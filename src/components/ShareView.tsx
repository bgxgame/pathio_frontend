import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';
import { api } from '../api';
import PathioNode from './PathioNode';
import NoteView from './NoteView';

const nodeTypes = { pathio: PathioNode };

type ShareNodeData = { label: string; status: string };
type ShareNodeType = Node<ShareNodeData, 'pathio'>;
type ShareEdgeType = Edge;

export default function ShareView() {
  const { token } = useParams();
  const [nodes, setNodes] = useNodesState<ShareNodeType>([]);
  const [edges, setEdges] = useEdgesState<ShareEdgeType>([]);
  const [title, setTitle] = useState('正在加载知识图谱...');
  const [activeNode, setActiveNode] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    api
      .get(`/share/${token}`)
      .then((res) => {
        setTitle(res.data.roadmap_title);
        setNodes(
          res.data.nodes.map((n: any): ShareNodeType => ({
            id: n.id,
            type: 'pathio',
            position: { x: n.pos_x, y: n.pos_y },
            data: { label: n.title, status: n.status },
          }))
        );
        setEdges(
          res.data.edges.map((e: any): ShareEdgeType => ({
            id: e.id,
            source: e.source_node_id,
            target: e.target_node_id,
          }))
        );
      })
      .catch(() => {
        setTitle('该分享链接已失效或不存在');
      });
  }, [token, setNodes, setEdges]);

  return (
    <div
      className="relative w-screen h-[200vh] transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden"
      style={{ transform: activeNode ? 'translateY(-50%)' : 'translateY(0%)' }}
    >
      <div className="w-full h-screen relative bg-[#F8FAFC]">
        <header className="absolute top-0 left-0 w-full bg-white/70 backdrop-blur-xl border-b border-gray-100 py-4 px-8 z-50 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div className="font-black tracking-tighter text-2xl text-pathio-900 italic uppercase">Pathio</div>
            <div className="h-4 w-px bg-gray-200"></div>
            <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{title}</span>
          </div>
          <a
            href="/"
            className="bg-pathio-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black shadow-lg hover:scale-105 transition-all"
          >
            构建我的知识路径图 →
          </a>
        </header>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_e, node) => setActiveNode({ id: node.id, title: node.data.label })}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          fitView
        >
          <Background color="#CBD5E1" gap={32} size={1} />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>

      <div className="w-full h-screen relative bg-white">
        {activeNode && (
          <NoteView
            nodeId={activeNode.id}
            nodeTitle={activeNode.title}
            onBack={() => setActiveNode(null)}
            readOnly={true}
            shareToken={token}
            nodes={nodes}
            edges={edges}
          />
        )}
        <button
          onClick={() => setActiveNode(null)}
          className="absolute bottom-10 right-10 w-14 h-14 bg-gray-900 text-white shadow-2xl rounded-2xl flex flex-col items-center justify-center hover:bg-pathio-500 transition-all z-50 group"
        >
          <svg
            className="w-6 h-6 group-hover:-translate-y-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-[8px] font-black mt-1">BACK</span>
        </button>
      </div>
    </div>
  );
}
