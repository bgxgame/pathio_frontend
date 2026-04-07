// frontend/src/components/NoteView.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
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
  readOnly?: boolean;    // 新增：是否只读
  shareToken?: string;   // 新增：分享链接的 Token
}

export default function NoteView({ nodeId, nodeTitle, onBack, readOnly = false, shareToken }: NoteViewProps) {
  const editorInstance = useRef<EditorJS | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');

  // 1. 初始化编辑器函数
  const initEditor = useCallback((initialData: any) => {
    // 如果实例已存在或 DOM 还没准备好，则跳过
    if (editorInstance.current) return;

    const editor = new EditorJS({
      holder: 'editorjs-container',
      placeholder: readOnly ? '' : '按 "/" 唤出菜单...',
      readOnly: readOnly, // 核心：如果是分享页，锁定编辑
      data: initialData || { blocks: [] },
      tools: {
        header: { class: Header as any, inlineToolbar: true },
        list: { class: List as any, inlineToolbar: true },
        code: { class: Code as any },
        inlineCode: { class: InlineCode as any },
        marker: { class: Marker as any },
      },
      onChange: () => {
        if (!readOnly) setLastSaved('未保存的更改...');
      }
    });

    editorInstance.current = editor;
  }, [readOnly]);

  // 2. 加载数据
  useEffect(() => {
    // 决定请求路径：分享页走公开接口，编辑器走私有接口
    const requestUrl = readOnly && shareToken 
      ? `/share/${shareToken}/notes/${nodeId}`
      : `/nodes/${nodeId}/note`;

    api.get(requestUrl).then(res => {
      const content = res.data.content;
      initEditor(content);
    }).catch(err => {
      console.error("加载笔记失败", err);
    });

    // 销毁
    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [nodeId, readOnly, shareToken, initEditor]);

  // 3. 保存逻辑 (只读模式下不触发)
  const handleSave = async () => {
    if (!editorInstance.current || readOnly) return;
    
    setIsSaving(true);
    try {
      const savedData = await editorInstance.current.save();
      await api.put(`/nodes/${nodeId}/note`, { content: savedData });
      setLastSaved(`已保存 ${StandardDateFormat(new Date())}`);
    } catch (error) {
      alert("保存失败，请检查网络");
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 顶部导航 - 精修 */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-gray-50 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack} 
            className="group flex items-center gap-2 text-gray-400 hover:text-pathio-500 transition-all active:scale-95"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-bold">返回画布</span>
          </button>
          
          <div className="h-4 w-px bg-gray-200"></div>
          
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{nodeTitle}</h1>
            {readOnly && (
              <span className="px-2 py-0.5 bg-gray-100 text-[10px] text-gray-400 rounded-md uppercase font-bold tracking-widest border border-gray-200/50">
                只读模式
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <span className="text-xs font-medium text-gray-300">
            {isSaving ? '正在同步...' : lastSaved}
          </span>
          
          {/* 只在非只读模式下显示保存按钮 */}
          {!readOnly && (
            <button 
              onClick={handleSave} 
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-2xl hover:bg-pathio-500 shadow-lg shadow-gray-900/10 transition-all active:scale-95"
            >
              保存沉淀
            </button>
          )}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden bg-white">
        {/* 左侧：目录 (TOC 占位) */}
        <aside className="w-64 border-r border-gray-50 p-10 hidden md:block bg-gray-50/20">
          <div className="flex items-center gap-2 mb-8 opacity-40">
            <div className="w-1.5 h-1.5 bg-pathio-500 rounded-full"></div>
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">内容大纲</h3>
          </div>
          <div className="space-y-5">
            <div className="h-2 bg-gray-100 rounded w-full animate-pulse"></div>
            <div className="h-2 bg-gray-100 rounded w-4/5 animate-pulse delay-75"></div>
            <div className="h-2 bg-gray-100 rounded w-2/3 animate-pulse delay-150"></div>
          </div>
        </aside>

        {/* 中间：Editor.js 编辑区域 */}
        <section className="flex-1 overflow-y-auto bg-white scroll-smooth custom-scrollbar">
          <div className="max-w-4xl mx-auto py-24 px-16">
            <div id="editorjs-container" className="prose prose-slate max-w-none min-h-[60vh] font-serif"></div>
          </div>
        </section>

        {/* 右侧：参考资料占位 */}
        <aside className="w-80 border-l border-gray-50 p-10 hidden lg:block">
          <div className="flex items-center gap-2 mb-8 opacity-40">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">关联溯源</h3>
          </div>
          <div className="p-6 rounded-3xl border border-dashed border-gray-100 bg-gray-50/50">
            <p className="text-[11px] text-gray-400 leading-relaxed italic">
              此处将自动汇聚画布中的前置逻辑节点与引用的外部文献，实现知识的闭环溯源。
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