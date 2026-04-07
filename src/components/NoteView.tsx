// frontend/src/components/NoteView.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Code from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';
import Marker from '@editorjs/marker';
import { api } from '../api';

interface NoteViewProps {
  nodeId: string;
  nodeTitle: string;
  onBack: () => void;
  readOnly?: boolean;
  shareToken?: string;
  nodes: any[]; // 接收全局节点
  edges: any[]; // 接收全局连线
}

export default function NoteView({ 
  nodeId, nodeTitle, onBack, readOnly = false, shareToken, nodes, edges 
}: NoteViewProps) {
  const editorInstance = useRef<EditorJS | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [toc, setToc] = useState<{ text: string, level: number }[]>([]);

  // 1. 核心逻辑：计算关联溯源数据 (基于画布连线)
  const trace = useMemo(() => {
    const precursors = edges
      .filter(e => e.target === nodeId)
      .map(e => nodes.find(n => n.id === e.source))
      .filter(Boolean);

    const successors = edges
      .filter(e => e.source === nodeId)
      .map(e => nodes.find(n => n.id === e.target))
      .filter(Boolean);

    return { precursors, successors };
  }, [nodeId, nodes, edges]);

  // 2. 核心逻辑：从 Editor.js 数据中提取大纲
  const generateTOC = useCallback((data: any) => {
    if (!data || !data.blocks) return;
    const headers = data.blocks
      .filter((b: any) => b.type === 'header')
      .map((b: any) => ({
        text: b.data.text.replace(/&nbsp;/g, ' '),
        level: b.data.level
      }));
    setToc(headers);
  }, []);

  // 3. 初始化编辑器
  const initEditor = useCallback((initialData: any) => {
    if (editorInstance.current) return;

    const editor = new EditorJS({
      holder: 'editorjs-container',
      placeholder: readOnly ? '' : '输入 "/" 唤出菜单...',
      readOnly: readOnly,
      data: initialData || { blocks: [] },
      tools: {
        header: { class: Header as any, inlineToolbar: true },
        list: { class: List as any, inlineToolbar: true },
        code: { class: Code as any },
        inlineCode: { class: InlineCode as any },
        marker: { class: Marker as any },
      },
      onChange: async () => {
        if (!readOnly) {
          const content = await editor.save();
          generateTOC(content); // 实时更新左侧大纲
          setLastSaved('未保存的更改...');
        }
      }
    });

    editorInstance.current = editor;
    generateTOC(initialData); // 初始化时生成一次大纲
  }, [readOnly, generateTOC]);

  // 4. 加载数据
  useEffect(() => {
    const url = readOnly && shareToken 
      ? `/share/${shareToken}/notes/${nodeId}`
      : `/nodes/${nodeId}/note`;

    api.get(url).then(res => {
      initEditor(res.data.content);
    }).catch(err => console.error("加载笔记失败", err));

    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [nodeId, readOnly, shareToken, initEditor]);

  // 5. 保存逻辑
  const handleSave = async () => {
    if (!editorInstance.current || readOnly) return;
    setIsSaving(true);
    try {
      const savedData = await editorInstance.current.save();
      await api.put(`/nodes/${nodeId}/note`, { content: savedData });
      setLastSaved(`已沉淀 ${StandardDateFormat(new Date())}`);
    } catch (error) {
      alert("同步失败");
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-gray-50 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="group flex items-center gap-2 text-gray-400 hover:text-pathio-500 transition-all">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" /></svg>
            <span className="text-sm font-bold">返回画布</span>
          </button>
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{nodeTitle}</h1>
            {readOnly && <span className="px-2 py-0.5 bg-gray-100 text-[10px] text-gray-400 rounded font-bold uppercase tracking-widest border border-gray-200/50">只读模式</span>}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-xs font-medium text-gray-300">{isSaving ? '正在同步...' : lastSaved}</span>
          {!readOnly && <button onClick={handleSave} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-2xl hover:bg-pathio-500 shadow-lg transition-all active:scale-95">保存沉淀</button>}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden bg-white">
        {/* 左侧：动态内容大纲 (Wing 1) */}
        <aside className="w-64 border-r border-gray-50 p-8 hidden md:block overflow-y-auto bg-gray-50/10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1.5 h-1.5 bg-pathio-500 rounded-full"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">内容大纲</h3>
          </div>
          <nav className="space-y-4">
            {toc.length === 0 ? (
              <p className="text-xs text-gray-300 italic">暂无标题内容</p>
            ) : toc.map((item, i) => (
              <div 
                key={i} 
                className={`text-sm cursor-default transition-colors hover:text-pathio-500 ${
                  item.level === 2 ? 'font-bold text-gray-700' : 'pl-4 text-gray-400 text-xs'
                }`}
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
            ))}
          </nav>
        </aside>

        {/* 中间：Editor.js 编辑区域 */}
        <section className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          <div className="max-w-3xl mx-auto py-20 px-10">
            <div id="editorjs-container" className="prose prose-slate max-w-none min-h-[60vh] font-serif"></div>
          </div>
        </section>

        {/* 右侧：关联溯源 (Wing 2) */}
        <aside className="w-80 border-l border-gray-50 p-8 hidden lg:block overflow-y-auto">
          <div className="mb-12">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <div className="w-1 h-3 bg-blue-500 rounded-full"></div> 前置知识 / Context
            </h3>
            <div className="space-y-3">
              {trace.precursors.length === 0 ? (
                <p className="text-xs text-gray-300 italic">这是探索的起点</p>
              ) : trace.precursors.map((n: any) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 shadow-sm">
                  ← {n.data.label}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> 后续探索 / Next
            </h3>
            <div className="space-y-3">
              {trace.successors.length === 0 ? (
                <p className="text-xs text-gray-300 italic">暂无延伸路径</p>
              ) : trace.successors.map((n: any) => (
                <div key={n.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs font-bold text-emerald-700 shadow-sm">
                  → {n.data.label}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-gray-50">
             <p className="text-[10px] text-gray-300 leading-relaxed italic">
               由知径知识引擎自动构建，<br/>基于画布逻辑建立溯源关系。
             </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function StandardDateFormat(date: Date) {
  return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}:${date.getSeconds().toString().padStart(2,'0')}`;
}