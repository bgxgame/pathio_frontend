// frontend/src/components/Home.tsx
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-pathio-100 selection:text-pathio-900">
      
      {/* 1. 导航栏 - 极简毛玻璃 */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-50 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-black tracking-tighter text-gray-900 italic">PATHIO</div>
          <div className="hidden md:flex gap-6 text-sm font-bold text-gray-400">
            <a href="#features" className="hover:text-gray-900 transition-colors">产品特性</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">定价方案</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-gray-900 px-4 py-2 transition-all">登录</Link>
          <Link to="/register" className="bg-gray-900 text-white text-sm font-bold px-6 py-2.5 rounded-2xl hover:bg-pathio-500 shadow-lg shadow-gray-900/10 transition-all active:scale-95">
            免费开始使用
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section - 冲击力文案 */}
      <section className="pt-44 pb-24 px-6 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 animate-fade-in">
          Next-Gen Knowledge Mapping
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1] mb-8">
          将灵感连成轨迹，<br/>
          让知识有<span className="text-pathio-500 italic relative">径
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-pathio-200 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 Q 50 0 100 10" stroke="currentColor" strokeWidth="10" fill="none"/></svg>
          </span>可寻
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-500 leading-relaxed mb-12 font-medium">
          知径 (Pathio) 融合了<b>无限画布的自由度</b>与<b>深度笔记的沉淀感</b>。
          无论是团队研发、深度学习还是创意探索，我们让每一场智力冒险都有迹可循。
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
          <Link to="/register" className="px-10 py-5 bg-gray-900 text-white text-lg font-bold rounded-[2rem] hover:bg-pathio-500 shadow-2xl transition-all hover:-translate-y-1">
            立即创建路线图 — 免费
          </Link>
          <button className="px-10 py-5 bg-white border border-gray-200 text-gray-900 text-lg font-bold rounded-[2rem] hover:bg-gray-50 transition-all">
            查看演示样例
          </button>
        </div>

        {/* 产品预览 Mockup */}
        <div className="max-w-6xl mx-auto rounded-[3rem] border-[12px] border-gray-100 shadow-2xl overflow-hidden relative group">
           <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent pointer-events-none"></div>
           <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
            className="w-full h-auto grayscale-[0.2] group-hover:scale-105 transition-transform duration-1000" 
            alt="Pathio Preview" 
           />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-md p-8 rounded-full border border-white/30 shadow-2xl">
                 <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
              </div>
           </div>
        </div>
      </section>

      {/* 3. 特性展示 */}
      <section id="features" className="py-32 bg-gray-50 px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-pathio-500/10 rounded-2xl flex items-center justify-center text-pathio-500 mb-6 font-black text-xl italic">C</div>
            <h3 className="text-xl font-bold mb-4">无限画布交互</h3>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">通过可视化节点与丝滑连线，构建你的全局思维蓝图。告别碎片化碎片，从上帝视角俯瞰知识脉络。</p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
             <div className="w-12 h-12 bg-pathio-500/10 rounded-2xl flex items-center justify-center text-pathio-500 mb-6 font-black text-xl italic">D</div>
             <h3 className="text-xl font-bold mb-4">深度笔记沉淀</h3>
             <p className="text-gray-400 text-sm leading-relaxed font-medium">点击节点瞬间下滑进入深度研究空间。基于 Editor.js 的块状编辑，让每一份资料都有结构，有溯源。</p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
             <div className="w-12 h-12 bg-pathio-500/10 rounded-2xl flex items-center justify-center text-pathio-500 mb-6 font-black text-xl italic">S</div>
             <h3 className="text-xl font-bold mb-4">一键只读分发</h3>
             <p className="text-gray-400 text-sm leading-relaxed font-medium">生成的精美路线图作品可一键分享。路人视角只读且流畅，同时为你自动吸引更多潜在关注者。</p>
          </div>
        </div>
      </section>

      {/* 4. 定价方案 - 严格按照你的规划 */}
      <section id="pricing" className="py-32 px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black mb-4">简单的定价，透明的增长</h2>
          <p className="text-gray-400 font-medium text-lg">支持个人探索，更助力组织协同。</p>
        </div>
        
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* 免费版 */}
          <div className="p-12 rounded-[3rem] border border-gray-100 bg-white">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Free</h4>
            <div className="text-5xl font-black mb-8 italic">0<span className="text-lg not-italic text-gray-300 ml-1">/ mo</span></div>
            <ul className="space-y-4 mb-12 text-sm font-bold text-gray-600">
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> 可创建 1 个路线图空间</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> 最多邀请 1 名协作者</li>
              <li className="text-gray-300 line-through flex items-center gap-3"><svg className="w-5 h-5 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg> 路线图空间公开分享</li>
            </ul>
            <Link to="/register" className="block w-full py-4 text-center border border-gray-100 rounded-2xl font-bold hover:bg-gray-50 transition-all italic">立即开始</Link>
          </div>

          {/* 团队版 */}
          <div className="p-12 rounded-[3rem] bg-gray-900 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8">
               <div className="bg-pathio-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest text-white shadow-lg">Popular</div>
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Team Plan</h4>
            <div className="text-5xl font-black mb-8 italic">30<span className="text-lg not-italic text-gray-500 ml-1">RMB / seat / mo</span></div>
            <ul className="space-y-4 mb-12 text-sm font-bold opacity-80">
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-pathio-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> 无限数量路线图空间</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-pathio-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> 阶梯定价优惠 (20人以上 25元)</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-pathio-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> 组织资产沉淀与节点任务指派</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-pathio-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> 一键只读分享与克隆</li>
            </ul>
            <Link to="/register" className="block w-full py-5 text-center bg-pathio-500 text-white rounded-2xl font-bold shadow-xl shadow-pathio-500/30 hover:bg-white hover:text-pathio-900 transition-all italic">开启团队空间</Link>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="py-20 border-t border-gray-50 text-center">
         <div className="text-xl font-black italic mb-6">PATHIO</div>
         <p className="text-xs text-gray-300 font-bold tracking-widest uppercase">© 2024 知径科技 - Connecting Dots for Deep Thinkers</p>
      </footer>
    </div>
  );
}