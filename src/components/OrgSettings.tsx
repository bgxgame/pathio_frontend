import { useEffect, useState } from 'react';
import { api } from '../api';

interface Member {
  id: string;
  nickname: string;
  email: string;
  role: 'admin' | 'editor' | 'member';
  created_at: string;
}

export default function OrgSettings() {
  const [members, setMembers] = useState<Member[]>([]);
  const [orgName, setOrgName] = useState('我的研究组织');
  const [plan, setPlan] = useState<'free' | 'team'>('free');
  const [inviteLink, setInviteLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. 加载组织详情
  const fetchOrgDetails = async () => {
    try {
      // 预留后端接口：GET /api/org/details
      const res = await api.get('/org/details');
      setMembers(res.data.members);
      setOrgName(res.data.name);
      setPlan(res.data.plan_type);
    } catch (err) {
      console.error("加载组织信息失败，请检查后端 API", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgDetails();
  }, []);

  // 2. 生成邀请链接
  const handleGenerateInvite = async () => {
    try {
      // 预留后端接口：POST /api/org/invite
      const res = await api.post('/org/invite');
      const fullLink = `${window.location.origin}/register?invite=${res.data.code}`;
      setInviteLink(fullLink);
    } catch (err) {
      alert("生成邀请码失败，请确认您是否有管理员权限");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("链接已复制，去发给伙伴吧！");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-pathio-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-12 py-16">
        
        {/* 头部标题区 */}
        <header className="mb-12">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">空间管理</h2>
          <p className="text-gray-400 font-medium italic">管理您的组织资产、成员席位与研究权限。</p>
        </header>

        {/* 1. 计划方案与升级卡片 (营销位) */}
        <section className="bg-gray-900 rounded-[2.5rem] p-10 mb-12 relative overflow-hidden shadow-2xl shadow-gray-900/20">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pathio-500 mb-2 block">Current Plan</span>
              <h3 className="text-3xl font-black text-white italic uppercase mb-2">
                {plan === 'free' ? 'Free 免费体验版' : 'Team 团队协作版'}
              </h3>
              <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                {plan === 'free' 
                  ? '您当前正在使用免费版，仅限创建 1 个路线图空间。升级团队版即可解锁无限空间与成员协作。' 
                  : '您已开启团队版。每席位 30rmb/月，享受无限空间与高级溯源功能。'}
              </p>
            </div>
            {plan === 'free' && (
              <button className="bg-pathio-500 hover:bg-white hover:text-pathio-900 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-pathio-500/20 whitespace-nowrap">
                升级获取无限空间 →
              </button>
            )}
          </div>
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pathio-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          
          {/* 2. 成员管理列表 (占 3 列) */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">
                团队成员 <span className="text-sm font-medium text-gray-300 ml-1">({members.length})</span>
              </h4>
            </div>
            
            <div className="space-y-4">
              {members.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-gray-100 rounded-[2rem] text-center italic text-gray-300">
                  暂无其他成员，快去邀请吧
                </div>
              ) : members.map((m) => (
                <div key={m.id} className="group flex items-center justify-between p-5 bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all rounded-[1.5rem] border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-black text-gray-500 text-lg border-2 border-white shadow-sm group-hover:bg-pathio-100 group-hover:text-pathio-600 transition-colors">
                      {m.nickname[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{m.nickname}</p>
                      <p className="text-xs text-gray-400 font-medium tracking-tight">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                      m.role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-white text-gray-400 border-gray-100'
                    }`}>
                      {m.role}
                    </span>
                    <span className="text-[9px] text-gray-300 mt-2">加入于 {new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 邀请与组织信息 (占 2 列) */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* 组织名称设置 */}
            <section>
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">空间信息</h4>
              <div className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                <label className="text-[10px] font-bold text-gray-300 uppercase block mb-2">空间展示名称</label>
                <input 
                  type="text" 
                  value={orgName} 
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-pathio-500 outline-none font-bold text-gray-700 transition-all"
                />
                <button className="mt-4 text-xs font-black text-pathio-500 hover:text-pathio-900 transition-colors">保存修改</button>
              </div>
            </section>

            {/* 邀请链接生成器 */}
            <section>
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">招募伙伴</h4>
              <div className="p-8 bg-pathio-50/50 border border-pathio-100 rounded-[2rem]">
                {!inviteLink ? (
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">
                      生成一个专属邀请链接，邀请伙伴加入您的组织。免费版最多可邀请 1 名成员。
                    </p>
                    <button 
                      onClick={handleGenerateInvite}
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-pathio-500 transition-all shadow-lg shadow-gray-900/10"
                    >
                      生成邀请链接
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-white border border-pathio-100 rounded-xl overflow-hidden shadow-sm">
                      <p className="text-[10px] font-black text-pathio-600 uppercase mb-2">邀请链接已就绪</p>
                      <code className="text-[11px] text-gray-500 break-all leading-tight block font-mono">
                        {inviteLink}
                      </code>
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className="w-full py-4 bg-pathio-500 text-white rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-pathio-500/20"
                    >
                      复制链接给伙伴
                    </button>
                    <button 
                      onClick={() => setInviteLink('')}
                      className="w-full text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-400"
                    >
                      作废此链接
                    </button>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}