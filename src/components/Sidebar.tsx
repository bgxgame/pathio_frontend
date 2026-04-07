// frontend/src/components/Sidebar.tsx
import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';

interface Roadmap {
  id: string;
  title: string;
}

interface SidebarProps {
  currentId: string | null;
  onSelect: (id: string) => void;
  isCollapsed: boolean;
  setDialog: (config: any) => void; // 接收来自 App 的弹窗控制函数
}

export default function Sidebar({ 
  currentId, 
  onSelect,
  isCollapsed,
  setDialog
}: SidebarProps) {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);

  const fetchRoadmaps = useCallback(() => {
    api.get('/roadmaps').then(res => {
      setRoadmaps(res.data);
      if (!currentId && res.data.length > 0) {
        onSelect(res.data[0].id);
      }
    });
  }, [currentId, onSelect]);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  // 使用自定义弹窗代替 prompt
  const handleAdd = () => {
    setDialog({
      isOpen: true,
      title: '开启新研究路径',
      type: 'input',
      placeholder: '请输入路线图名称...',
      defaultValue: '未命名研究路径',
      onConfirm: (title: string) => {
        if (title && title.trim()) {
          api.post('/roadmaps', { title }).then(() => {
            fetchRoadmaps();
            setDialog({ isOpen: false }); // 成功后关闭弹窗
          }).catch(err => {
            console.error("创建失败", err);
          });
        }
      }
    });
  };

  // 使用自定义弹窗代替 confirm
  const handleLogout = () => {
    setDialog({
      isOpen: true,
      title: '确定要退出空间吗？',
      type: 'confirm',
      isDanger: true,
      onConfirm: () => {
        localStorage.removeItem('token'); 
        window.location.href = '/'; 
      }
    });
  };

  return (
    <aside 
      className={`h-screen bg-gray-900 flex flex-col transition-all duration-500 ease-in-out overflow-hidden z-50 shrink-0 ${
        isCollapsed ? 'w-0 p-0' : 'w-64 p-6'
      }`}
    >
      {/* 品牌标识 */}
      <div className="text-white font-black tracking-tighter text-2xl mb-10 italic whitespace-nowrap uppercase">
        Pathio
      </div>
      
      {/* 路线图列表 */}
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar min-w-[200px]">
        <div className="flex items-center justify-between text-gray-500 mb-4 px-2 whitespace-nowrap">
          <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">我的路线图</span>
          <button 
            onClick={handleAdd} 
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-800 hover:text-white transition-colors text-xl font-light"
          >
            +
          </button>
        </div>
        
        <nav className="space-y-1">
          {roadmaps.map(r => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-3 ${
                currentId === r.id 
                  ? 'bg-pathio-500 text-white shadow-lg shadow-pathio-500/20 translate-x-1' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${currentId === r.id ? 'bg-white' : 'bg-gray-700'}`}></div>
              <span className="truncate">{r.title}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 底部退出区 */}
      <div className="mt-auto pt-6 border-t border-gray-800 min-w-[200px]">
        <button 
          onClick={handleLogout}
          className="group w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-800 text-gray-500 text-xs font-bold hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all duration-300"
        >
          <svg className="w-4 h-4 opacity-50 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="whitespace-nowrap uppercase tracking-widest">退出空间</span>
        </button>
      </div>
    </aside>
  );
}