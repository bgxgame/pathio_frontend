import { useEffect, useRef, useState } from 'react';
import EditorJS from '@editorjs/editorjs';
// 导入常用插件
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
}

export default function NoteView({ nodeId, nodeTitle, onBack }: NoteViewProps) {
  const editorInstance = useRef<EditorJS | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');

  // 1. 初始化编辑器函数
  const initEditor = (initialData: any) => {
    if (editorInstance.current) return; // 防止重复初始化

    const editor = new EditorJS({
      holder: 'editorjs-container', // 挂载点的 ID
      placeholder: '按 "/" 唤出菜单...',
      data: initialData || {}, // 加载从后端获取的 JSONB 数据
      tools: {
        header: { class: Header as any, inlineToolbar: true },
        list: { class: List as any, inlineToolbar: true },
        code: Code,
        inlineCode: InlineCode,
        marker: Marker,
      },
      // 自动保存逻辑 (可选)
      onChange: () => {
        setLastSaved('未保存的更改...');
      }
    });

    editorInstance.current = editor;
  };

  // 2. 加载数据
  useEffect(() => {
    api.get(`/nodes/${nodeId}/note`).then(res => {
      // 后端返回的是 { node_id, content: { blocks: [...] } }
      const content = res.data.content;
      initEditor(content);
    });

    // 组件销毁时释放编辑器实例
    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [nodeId]);

  // 3. 保存逻辑
  const handleSave = async () => {
    if (!editorInstance.current) return;
    
    setIsSaving(true);
    try {
      // 调用 editor.save() 获取当前所有块的 JSON
      const savedData = await editorInstance.current.save();
      
      await api.put(`/nodes/${nodeId}/note`, { 
        content: savedData // 直接把整个对象存入 JSONB
      });
      
      setLastSaved(`上次保存: ${StandardDateFormat(new Date())}`);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-50 bg-white z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-pathio-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" /></svg>
            <span className="text-sm font-medium">返回画布</span>
          </button>
          <div className="h-4 w-px bg-gray-200"></div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{nodeTitle}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">{isSaving ? '同步中...' : lastSaved}</span>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-pathio-500 shadow-sm transition-all active:scale-95"
          >
            保存记录
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* 左侧：目录占位 */}
        <aside className="w-64 border-r border-gray-50 p-8 hidden md:block bg-gray-50/20">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-center">笔记大纲</h3>
          <div className="space-y-4 opacity-30">
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-5/6"></div>
          </div>
        </aside>

        {/* 中间：Editor.js 编辑区域 */}
        <section className="flex-1 overflow-y-auto bg-white scroll-smooth">
          <div className="max-w-4xl mx-auto py-20 px-12">
            {/* Editor.js 的挂载容器 */}
            <div id="editorjs-container" className="prose prose-slate max-w-none min-h-[60vh]"></div>
          </div>
        </section>

        {/* 右侧：参考资料占位 */}
        <aside className="w-80 border-l border-gray-50 p-8 hidden lg:block bg-white">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">关联溯源</h3>
          <div className="text-xs text-gray-300 italic border-l-2 border-gray-100 pl-4">
            这里将展示你在画布中连接的前置节点和引用链接。
          </div>
        </aside>
      </main>
    </div>
  );
}

// 简单的日期格式化函数
function StandardDateFormat(date: Date) {
  return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}:${date.getSeconds().toString().padStart(2,'0')}`;
}