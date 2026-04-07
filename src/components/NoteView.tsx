// frontend/src/components/NoteView.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  nodes: any[];
  edges: any[];
}

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DELAY_MS = 3000;

export default function NoteView({
  nodeId,
  nodeTitle,
  onBack,
  readOnly = false,
  shareToken,
  nodes,
  edges,
}: NoteViewProps) {
  const editorInstance = useRef<EditorJS | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [toc, setToc] = useState<{ text: string; level: number }[]>([]);

  // 1. 知识溯源逻辑：计算前置和后续节点
  const trace = useMemo(() => {
    const precursors = edges
      .filter((e) => e.target === nodeId)
      .map((e) => nodes.find((n) => n.id === e.source))
      .filter(Boolean);

    const successors = edges
      .filter((e) => e.source === nodeId)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter(Boolean);

    return { precursors, successors };
  }, [nodeId, nodes, edges]);

  // 2. 状态文案格式化
  const saveStatusText = useMemo(() => {
    if (readOnly) return '只读模式';
    switch (saveStatus) {
      case 'dirty': return '未保存的更改...';
      case 'saving': return '正在同步至云端...';
      case 'saved': return lastSavedAt ? `已保存于 ${StandardDateFormat(lastSavedAt)}` : '已保存';
      case 'error': return '同步失败，请检查网络';
      default: return '自动保存已开启';
    }
  }, [readOnly, saveStatus, lastSavedAt]);

  // 3. 大纲提取逻辑
  const generateTOC = useCallback((data: any) => {
    if (!data?.blocks) return;
    const headers = data.blocks
      .filter((b: any) => b.type === 'header')
      .map((b: any) => ({
        text: String(b.data.text || '').replace(/&nbsp;/g, ' '),
        level: Number(b.data.level) || 2,
      }));
    setToc(headers);
  }, []);

  // 4. 核心保存执行函数
  const persistNote = useCallback(async () => {
    if (readOnly || !editorInstance.current || !isDirtyRef.current || isSavingRef.current) return;

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      // 💡 直接获取原始 JSON，不再通过 normalizeEditorData 转换
      const savedData = await editorInstance.current.save();
      await api.put(`/nodes/${nodeId}/note`, { content: savedData });
      
      isDirtyRef.current = false;
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('保存笔记失败', error);
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [nodeId, readOnly]);

  // 5. 初始化编辑器
  const initEditor = useCallback((initialData: any) => {
    if (editorInstance.current) return;

    const editor = new EditorJS({
      holder: 'editorjs-container',
      placeholder: readOnly ? '' : '输入 "/" 唤出菜单...',
      readOnly,
      data: initialData || { blocks: [] }, // 💡 必须传入符合 Editor.js 结构的原始对象
      tools: {
        header: { class: Header as any, inlineToolbar: true },
        list: { class: List as any, inlineToolbar: true },
        code: { class: Code as any },
        inlineCode: { class: InlineCode as any },
        marker: { class: Marker as any },
      },
      onChange: async () => {
        if (readOnly) return;
        
        // 标记为脏数据，触发 UI 同步提示
        isDirtyRef.current = true;
        setSaveStatus('dirty');

        // 实时渲染大纲
        const currentContent = await editor.save();
        generateTOC(currentContent);

        // 开启防抖自动保存
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
          persistNote();
        }, AUTOSAVE_DELAY_MS);
      },
    });

    editorInstance.current = editor;
    generateTOC(initialData || { blocks: [] });
  }, [readOnly, persistNote, generateTOC]);

  // 6. 生命周期管理
  useEffect(() => {
    const url = readOnly && shareToken ? `/share/${shareToken}/notes/${nodeId}` : `/nodes/${nodeId}/note`;
    
    // 加载前重置状态
    setSaveStatus('idle');
    setLastSavedAt(null);
    isDirtyRef.current = false;

    api.get(url).then((res) => {
      // 💡 加载从后端取出的完整原始 JSON 对象
      initEditor(res.data.content);
    }).catch(err => console.error("数据加载失败", err));

    return () => {
      // 卸载前清理
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      // 如果还有未保存的内容，退出前强行同步一次
      if (isDirtyRef.current && !readOnly) persistNote();
      
      if (editorInstance.current) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [nodeId, readOnly, shareToken, initEditor, persistNote]);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 顶部状态栏 */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-gray-50 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="group flex items-center gap-2 text-gray-400 hover:text-pathio-500 transition-all">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" /></svg>
            <span className="text-sm font-bold">返回画布</span>
          </button>
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{nodeTitle}</h1>
            {readOnly && <span className="px-2 py-0.5 bg-gray-100 text-[10px] text-gray-400 rounded font-bold uppercase tracking-widest border border-gray-200/50">只读</span>}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-xs font-medium text-gray-300 transition-all duration-300">{saveStatusText}</span>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden bg-white">
        {/* 左翼：大纲 */}
        <aside className="w-64 border-r border-gray-50 p-8 hidden md:block overflow-y-auto bg-gray-50/10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1.5 h-1.5 bg-pathio-500 rounded-full"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">内容大纲</h3>
          </div>
          <nav className="space-y-4">
            {toc.length === 0 ? <p className="text-xs text-gray-300 italic">尚未编写标题内容</p> : toc.map((item, i) => (
              <div key={i} className={`text-sm transition-colors hover:text-pathio-500 cursor-default ${item.level === 2 ? 'font-bold text-gray-700' : 'pl-4 text-gray-400 text-xs'}`} dangerouslySetInnerHTML={{ __html: item.text }} />
            ))}
          </nav>
        </aside>

        {/* 主体：编辑器 */}
        <section className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          <div className="max-w-3xl mx-auto py-20 px-10">
            <div id="editorjs-container" className="prose prose-slate max-w-none min-h-[60vh] font-serif"></div>
          </div>
        </section>

        {/* 右翼：溯源 */}
        <aside className="w-80 border-l border-gray-50 p-8 hidden lg:block overflow-y-auto">
          <div className="mb-12">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <div className="w-1 h-3 bg-blue-500 rounded-full"></div> 前置知识
            </h3>
            <div className="space-y-3">
              {trace.precursors.length === 0 ? <p className="text-xs text-gray-300 italic">这是探索的起点</p> : trace.precursors.map((n: any) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-white hover:border-blue-200">← {n.data.label}</div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> 后续探索
            </h3>
            <div className="space-y-3">
              {trace.successors.length === 0 ? <p className="text-xs text-gray-300 italic">暂无延伸路径</p> : trace.successors.map((n: any) => (
                <div key={n.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs font-bold text-emerald-700 shadow-sm transition-all hover:bg-white hover:border-emerald-300">→ {n.data.label}</div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function StandardDateFormat(date: Date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}