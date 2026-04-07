// frontend/src/components/ShareView.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import { api } from '../api';
import PathioNode from './PathioNode';
import NoteView from './NoteView';

const nodeTypes = { pathio: PathioNode };

export default function ShareView() {
  const { token } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [title, setTitle] = useState('正在加载知识图谱...');
  const [activeNode, setActiveNode] = useState<{id: string, title: string} | null>(null);

  useEffect(() => {
    // 这里的 API 调用不带 Token，走公开的 share 路由
    api.get(`/share/${token}`).then(res => {
      setTitle(res.data.roadmap_title);
      setNodes(res.data.nodes.map((n: any) => ({
        id: n.id, 
        type: 'pathio',
        position: { x: n.pos_x, y: n.pos_y },
        data: { label: n.title },
      })));
      setEdges(res.data.edges.map((e: any) => ({
        id: e.id, 
        source: e.source_node_id, 
        target: e.target_node_id,
      })));
    }).catch(err => {
      setTitle("该分享链接已失效或不存在");
      console.error(err);
    });
  }, [token, setNodes, setEdges]);

  return (
    <div className="relative w-screen h-[200vh] transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden"
         style={{ transform: activeNode ? 'translateY(-50%)' : 'translateY(0%)' }}>
      
      {/* 视图1：沉浸式只读画布 */}
      <div className="w-full h-screen relative bg-[#F8FAFC]">
        
        {/* 顶部引流与状态 Banner */}
        <header className="absolute top-0 left-0 w-full bg-white/70 backdrop-blur-xl border-b border-gray-100 py-4 px-8 z-50 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div className="font-black tracking-tighter text-2xl text-pathio-900 italic">PATHIO</div>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">正在查阅</span>
              <span className="text-sm font-bold text-gray-700 truncate max-w-[200px] leading-none">{title}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-400 hidden md:block font-medium italic opacity-60">
              探索、连接、沉淀
            </span>
            <a 
              href="/" 
              className="bg-pathio-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-pathio-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              构建我的知识路线图 →
            </a>
          </div>
        </header>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_e, node) => setActiveNode({ id: node.id, title: node.data.label })}
          // 彻底锁定交互权限
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          fitView
        >
          <Background color="#CBD5E1" gap={32} size={1} />
          {/* 只留缩放控件，不留编辑控件 */}
          <Controls showInteractive={false} position="bottom-right" className="!bg-white !border-none !shadow-xl !rounded-2xl overflow-hidden" />
        </ReactFlow>

        {/* 底部版权装饰 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="text-[10px] text-gray-300 font-bold tracking-[0.4em] uppercase text-center">
            Pathio Knowledge Engine © 2024
          </div>
        </div>
      </div>

      {/* 视图2：只读沉淀详情 */}
      <div className="w-full h-screen relative bg-white">
        {activeNode && (
          <NoteView 
            nodeId={activeNode.id} 
            nodeTitle={activeNode.title} 
            onBack={() => setActiveNode(null)}
            readOnly={true}    // 核心：强制进入只读
            shareToken={token} // 核心：传递 Token 供公开 API 校验
          />
        )}
        
        {/* 精修：回到顶部/画布按钮 */}
        <button 
          onClick={() => setActiveNode(null)}
          className="absolute bottom-10 right-10 w-14 h-14 bg-gray-900 text-white shadow-2xl rounded-2xl flex flex-col items-center justify-center hover:bg-pathio-500 transition-all z-50 group active:scale-90"
          title="回到路线图"
        >
          <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-[8px] font-black mt-1 tracking-tighter">BACK</span>
        </button>
      </div>
    </div>
  );
}