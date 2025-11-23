import React, { useMemo } from 'react';
import Avatar from './Avatar';

export default function GlobalStats({ players, allRounds, sessions }) {
  const stats = useMemo(() => {
    const playerStats = {};
    players.forEach(p => {
      playerStats[p.id] = { id: p.id, name: p.name, avatar: p.avatar, total: 0, count: 0, wins: 0, zimo: 0, hu: 0, pao: 0, max: -9999 };
    });

    allRounds.forEach(round => {
      const session = sessions.find(s => s.id === round.sessionId);
      if (!session) return; 

      round.scores.forEach((score, idx) => {
        const playerId = session.playerIds[idx];
        const pStat = playerStats[playerId];
        
        if (pStat) {
          const s = parseInt(score) || 0;
          pStat.total += s;
          pStat.count += 1;
          if (s > 0) pStat.wins += 1;
          if (s > pStat.max) pStat.max = s;

          // 兼容旧数据 + 新对象数据格式
          if (round.tags && (Array.isArray(round.tags[idx]) || round.tags[idx])) {
             const myTags = round.tags[idx];
             if (Array.isArray(myTags)) { 
                if (myTags.includes('zimo')) pStat.zimo += 1;
                if (myTags.includes('hu')) pStat.hu += 1;
                if (myTags.includes('pao')) pStat.pao += 1;
             }
          } else if (round.roles && typeof round.roles[idx] === 'string') {
             const role = round.roles[idx];
             if (role === 'zimo') pStat.zimo += 1;
             if (role === 'hu') pStat.hu += 1;
             if (role === 'pao') pStat.pao += 1;
          }
        }
      });
    });

    return Object.values(playerStats).filter(p => p.count > 0).sort((a, b) => b.total - a.total);
  }, [players, allRounds, sessions]);

  const getRate = (num, total) => total > 0 ? Math.round((num / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 text-center">
        <h2 className="text-xl font-bold text-emerald-800">全能数据分析</h2>
        <p className="text-slate-400 text-xs mt-1">支持血战模式：单局可同时统计点炮与自摸</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {stats.map((stat, index) => (
          <div key={stat.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-50 relative overflow-hidden">
             <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                <div className="flex items-center gap-2">
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0
                     ${index === 0 ? 'bg-yellow-400' : 'bg-slate-300'}`}>
                     {index + 1}
                   </div>
                   <Avatar player={stat} size="md" />
                   <span className="font-bold text-lg text-slate-700">{stat.name}</span>
                </div>
                <div className={`text-xl font-black font-mono ${stat.total>0?'text-red-500':'text-emerald-600'}`}>
                  {stat.total > 0 ? `+${stat.total}` : stat.total}
                </div>
             </div>

             <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-orange-50 p-2 rounded-lg">
                   <div className="text-[10px] text-orange-400 mb-1">胡牌(自+接)</div>
                   <div className="font-bold text-orange-700 text-lg">{stat.zimo + stat.hu}</div>
                   <div className="text-[10px] text-orange-300">率: {getRate(stat.zimo + stat.hu, stat.count)}%</div>
                </div>
                <div className="bg-red-50 p-2 rounded-lg">
                   <div className="text-[10px] text-red-400 mb-1">自摸次数</div>
                   <div className="font-bold text-red-700 text-lg">{stat.zimo}</div>
                   <div className="text-[10px] text-red-300">占胡: {getRate(stat.zimo, stat.zimo + stat.hu)}%</div>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg">
                   <div className="text-[10px] text-slate-500 mb-1">点炮次数</div>
                   <div className="font-bold text-slate-700 text-lg">{stat.pao}</div>
                   <div className="text-[10px] text-slate-400">率: {getRate(stat.pao, stat.count)}%</div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}