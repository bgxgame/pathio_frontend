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
  const [title, setTitle] = useState('加载中...');
  const [activeNode, setActiveNode] = useState<{id: string, title: string} | null>(null);

  useEffect(() => {
    api.get(`/share/${token}`).then(res => {
      setTitle(res.data.roadmap_title);
      setNodes(res.data.nodes.map((n: any) => ({
        id: n.id, type: 'pathio',
        position: { x: n.pos_x, y: n.pos_y },
        data: { label: n.title },
      })));
      setEdges(res.data.edges.map((e: any) => ({
        id: e.id, source: e.source_node_id, target: e.target_node_id,
      })));
    });
  }, [token]);

  return (
    <div className="relative w-screen h-[200vh] transition-transform duration-700 ease-in-out overflow-hidden"
         style={{ transform: activeNode ? 'translateY(-50%)' : 'translateY(0%)' }}>
      
      {/* 视图1：只读画布 */}
      <div className="w-full h-screen relative">
        {/* 顶部引流 Banner */}
        <div className="absolute top-0 left-0 w-full bg-pathio-900 text-white py-3 px-6 z-50 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <span className="font-black tracking-tighter text-xl">PATHIO</span>
            <span className="text-sm opacity-60">|</span>
            <span className="text-sm font-medium">正在查看: {title}</span>
          </div>
          <a href="/" className="bg-pathio-500 hover:bg-white hover:text-pathio-900 px-4 py-1.5 rounded-full text-xs font-bold transition-all">
            我也要构建路线图 →
          </a>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_e, node) => setActiveNode({ id: node.id, title: node.data.label })}
          // 关键：禁用所有编辑功能
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          fitView
        >
          <Background color="#eee" gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* 视图2：只读笔记 (重用 NoteView，内部需要根据权限隐藏保存按钮) */}
      <div className="w-full h-screen relative">
        {activeNode && (
          <NoteView 
            nodeId={activeNode.id} 
            nodeTitle={activeNode.title} 
            onBack={() => setActiveNode(null)}
            readOnly={true} // 传入只读标记
          />
        )}
        {/* 一键上滑箭头 */}
        <button 
          onClick={() => setActiveNode(null)}
          className="absolute bottom-8 right-8 w-12 h-12 bg-white shadow-2xl rounded-full flex items-center justify-center text-pathio-500 hover:scale-110 transition-transform z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
        </button>
      </div>
    </div>
  );
}