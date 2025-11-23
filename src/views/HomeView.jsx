import React from 'react';
import { History, CalendarDays, Users, Trophy, Trash2 } from 'lucide-react';

export default function HomeView({ sessions, players, onStartNew, onClearData }) {
  return (
    <div className="space-y-6">
      <div className="bg-emerald-800 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200/50 relative overflow-hidden">
         <div className="relative z-10">
           <h2 className="text-2xl font-bold mb-1">准备好了吗？</h2>
           <p className="text-emerald-200 text-sm mb-4">组局打牌，记录每一个高光时刻。</p>
           <button onClick={onStartNew} className="bg-white text-emerald-900 px-6 py-2 rounded-full font-bold text-sm shadow active:scale-95 transition-transform">
             + 发起新一场
           </button>
         </div>
         <Trophy className="absolute -right-4 -bottom-4 text-emerald-700 opacity-50" size={120} />
      </div>

      <div>
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
          <History size={18} /> 历史牌局
        </h3>
        <div className="space-y-3">
          {sessions.filter(s => !s.isActive).map(s => {
            const sPlayers = s.playerIds.map(id => {
              const p = players.find(pl => pl.id === id);
              return p ? p.name : '未知';
            }).join('、');
            return (
              <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                 <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                   <CalendarDays size={12} />
                   {s.startTime?.toDate().toLocaleDateString()} {s.startTime?.toDate().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                 </div>
                 <div className="flex items-start gap-2">
                    <div className="bg-slate-100 p-2 rounded-lg"><Users size={16} className="text-slate-500"/></div>
                    <div>
                      <div className="font-bold text-slate-700 text-sm line-clamp-1">{sPlayers}</div>
                      <div className="text-xs text-slate-400 mt-1">已结束</div>
                    </div>
                 </div>
              </div>
            )
          })}
          {sessions.length === 0 && <p className="text-center text-slate-400 text-sm py-4">暂无历史记录</p>}
        </div>
      </div>

      <div className="pt-10 pb-4">
        <button onClick={onClearData} className="mx-auto flex items-center gap-2 text-red-400 text-xs px-4 py-2 rounded-full border border-transparent hover:bg-red-50 hover:border-red-100 transition-colors">
          <Trash2 size={14} />
          清空所有数据 (慎点)
        </button>
      </div>
    </div>
  );
}