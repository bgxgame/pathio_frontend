import { useCallback, useEffect, useState } from 'react';
import ReactFlow, { 
  Background, Controls, MiniMap, useNodesState, useEdgesState, ReactFlowProvider, useReactFlow, addEdge 
} from 'reactflow';
import type { Node, Edge as FlowEdge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { api } from './api';
import PathioNode from './components/PathioNode';
import NoteView from './components/NoteView'; 
import { Routes, Route, useLocation } from 'react-router-dom';
import ShareView from './components/ShareView';
import Home from './components/Home';
import AuthForm from './components/AuthForm';

const nodeTypes = { pathio: PathioNode };

// ==========================================
// 1. 侧边栏组件 (Sidebar)
// ==========================================
function Sidebar({ 
  currentId, 
  onSelect,
  isCollapsed
}: { 
  currentId: string | null, 
  onSelect: (id: string) => void,
  isCollapsed: boolean
}) {
  const [roadmaps, setRoadmaps] = useState<any[]>([]);

  const fetchRoadmaps = useCallback(() => {
    api.get('/roadmaps').then(res => {
      setRoadmaps(res.data);
      if (!currentId && res.data.length > 0) {
        onSelect(res.data[0].id);
      }
    });
  }, [currentId, onSelect]);

  useEffect(() => { fetchRoadmaps(); }, [fetchRoadmaps]);

  const handleCreate = () => {
    const title = prompt("新路线图名称：", "未命名研究路径");
    if (title) api.post('/roadmaps', { title }).then(() => fetchRoadmaps());
  };

  return (
    <aside className={`h-screen bg-gray-900 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-0 p-0' : 'w-64 p-6'}`}>
      <div className="text-white font-black tracking-tighter text-2xl mb-10 italic whitespace-nowrap">PATHIO</div>
      
      <div className="flex-1 overflow-y-auto space-y-2 min-w-[200px]">
        <div className="flex items-center justify-between text-gray-500 mb-4 px-2">
          <span className="text-xs font-bold uppercase tracking-widest">我的路线图</span>
          <button onClick={handleCreate} className="hover:text-white text-xl">+</button>
        </div>
        
        {roadmaps.map(r => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              currentId === r.id 
                ? 'bg-pathio-500 text-white shadow-lg shadow-pathio-500/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            {r.title}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-gray-800 min-w-[200px]">
        <button 
          onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}
          className="w-full py-3 rounded-xl border border-gray-800 text-gray-500 text-xs font-bold hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          退出登录
        </button>
      </div>
    </aside>
  );
}

// ==========================================
// 2. 画布组件 (Canvas)
// ==========================================
function Canvas({ roadmapId, onToggleSidebar, isSidebarCollapsed }: { 
  roadmapId: string | null, 
  onToggleSidebar: () => void,
  isSidebarCollapsed: boolean
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [activeNode, setActiveNode] = useState<{id: string, title: string} | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copying'>('idle');

  useEffect(() => {
    if (!roadmapId) return;
    api.get(`/nodes?roadmap_id=${roadmapId}`).then(res => {
      setNodes(res.data.map((n: any) => ({
        id: n.id, type: 'pathio',
        position: { x: n.pos_x, y: n.pos_y },
        data: { label: n.title },
      })));
    });
    api.get(`/edges?roadmap_id=${roadmapId}`).then(res => {
      setEdges(res.data.map((e: any) => ({
        id: e.id, source: e.source_node_id, target: e.target_node_id,
      })));
    });
  }, [roadmapId, setNodes, setEdges]);

  // 分享功能逻辑
  const handleShare = async () => {
    if (!roadmapId) return;
    setShareStatus('copying');
    try {
      const res = await api.get('/roadmaps');
      const currentRoadmap = res.data.find((r: any) => r.id === roadmapId);
      if (currentRoadmap?.share_token) {
        const shareUrl = `${window.location.origin}/share/${currentRoadmap.share_token}`;
        await navigator.clipboard.writeText(shareUrl);
        alert(`分享链接已复制到剪贴板！\n${shareUrl}`);
      }
    } catch (e) {
      alert("获取分享链接失败");
    } finally {
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setActiveNode({ id: node.id, title: node.data.label });
  }, []);

  const onConnect = useCallback((params: Connection) => {
    if (!roadmapId) return;
    setEdges((eds) => addEdge(params, eds));
    api.post('/edges', { source: params.source, target: params.target, roadmap_id: roadmapId });
  }, [setEdges, roadmapId]);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (event.detail !== 2 || !roadmapId) return;
    const title = prompt('节点名称：', '新研究节点');
    if (!title || !title.trim()) return;
    const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    api.post('/nodes', { title, pos_x: pos.x, pos_y: pos.y, roadmap_id: roadmapId }).then(res => {
      setNodes(nds => nds.concat({
        id: res.data.id, type: 'pathio',
        position: { x: res.data.pos_x, y: res.data.pos_y },
        data: { label: res.data.title },
      }));
    });
  }, [screenToFlowPosition, setNodes, roadmapId]);

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    api.put(`/nodes/${node.id}/position`, { pos_x: node.position.x, pos_y: node.position.y });
  }, []);

  return (
    <div className="relative w-full h-[200vh] transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden"
         style={{ transform: activeNode ? 'translateY(-50%)' : 'translateY(0%)' }}>
      
      <div className="w-full h-screen relative bg-white">
        {/* 左上角折叠按钮 */}
        <button 
          onClick={onToggleSidebar}
          className="absolute top-6 left-6 z-10 p-2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl shadow-sm hover:bg-pathio-50 text-gray-400 hover:text-pathio-500 transition-all"
        >
          {isSidebarCollapsed ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" /></svg>
          )}
        </button>

        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop} onPaneClick={onPaneClick}
          onConnect={onConnect} onNodeClick={onNodeClick}
          nodeTypes={nodeTypes} fitView
        >
          <Background color="#f1f5f9" gap={24} size={1} />
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
        
        {/* 右上角功能区 */}
        <div className="absolute top-6 right-6 flex gap-3 z-10">
            <button 
              onClick={handleShare}
              className="px-5 py-2.5 bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl text-sm font-bold text-pathio-500 shadow-sm hover:bg-pathio-500 hover:text-white transition-all active:scale-95"
            >
                {shareStatus === 'idle' ? '分享此路径' : '已复制！'}
            </button>
        </div>
      </div>

      <div className="w-full h-screen bg-white">
        {activeNode && (
          <NoteView nodeId={activeNode.id} nodeTitle={activeNode.title} onBack={() => setActiveNode(null)} />
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. 主路由分发 (App)
// ==========================================
export default function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [currentRoadmapId, setCurrentRoadmapId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setAuthToken(localStorage.getItem('token'));
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={
        authToken ? (
          <div className="flex w-screen h-screen overflow-hidden bg-gray-900 transition-all duration-300">
            <Sidebar 
              currentId={currentRoadmapId} 
              onSelect={setCurrentRoadmapId} 
              isCollapsed={isSidebarCollapsed}
            />
            <div className={`flex-1 bg-white overflow-hidden shadow-2xl transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'rounded-none' : 'rounded-l-[2.5rem] border-l border-white/10'
            }`}>
              <ReactFlowProvider>
                <Canvas 
                  roadmapId={currentRoadmapId} 
                  onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              </ReactFlowProvider>
            </div>
          </div>
        ) : (
          <Home />
        )
      } />
      <Route path="/login" element={<AuthForm mode="login" />} />
      <Route path="/register" element={<AuthForm mode="register" />} />
      <Route path="/share/:token" element={<ShareView />} />
    </Routes>
  );
}