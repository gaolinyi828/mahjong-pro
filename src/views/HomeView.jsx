import React from 'react';
import { History, CalendarDays, Users, Trophy, Trash2 } from 'lucide-react';
import { doc, deleteDoc, writeBatch, query, collection, where, getDocs } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export default function HomeView({ sessions, players, onStartNew, onClearData }) {
  
  // --- 删除单个场次逻辑 ---
  const handleDeleteSession = async (sessionId) => {
    if (!confirm("确定要删除这场记录吗？\n\n这也将删除该场次下的所有对局数据，且无法恢复。")) return;

    try {
      // 1. 准备批量操作 (Batch Write)
      const batch = writeBatch(db);

      // 2. 找到该场次下的所有“局” (rounds)
      // 必须把它们也删了，否则会变成僵尸数据
      const roundsQuery = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'club_rounds'), 
        where('sessionId', '==', sessionId)
      );
      const roundsSnapshot = await getDocs(roundsQuery);
      
      // 3. 把删除局的操作加入 batch
      roundsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 4. 把删除场次本身的操作加入 batch
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'club_sessions', sessionId);
      batch.delete(sessionRef);

      // 5. 一次性执行所有删除
      await batch.commit();
      
    } catch (e) {
      console.error("删除失败: ", e);
      alert("删除失败，请检查网络或重试。");
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
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

      {/* History List */}
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
              <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative group">
                 <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                   <CalendarDays size={12} />
                   {s.startTime?.toDate().toLocaleDateString()} {s.startTime?.toDate().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                 </div>
                 <div className="flex items-start gap-2 pr-8">
                    <div className="bg-slate-100 p-2 rounded-lg"><Users size={16} className="text-slate-500"/></div>
                    <div>
                      <div className="font-bold text-slate-700 text-sm line-clamp-1">{sPlayers}</div>
                      <div className="text-xs text-slate-400 mt-1">已结束</div>
                    </div>
                 </div>
                 
                 {/* 单场删除按钮 */}
                 <button 
                   onClick={() => handleDeleteSession(s.id)}
                   className="absolute top-4 right-4 text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                   title="删除这场记录"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
            )
          })}
          {sessions.filter(s => !s.isActive).length === 0 && <p className="text-center text-slate-400 text-sm py-4">暂无历史记录</p>}
        </div>
      </div>

      {/* Footer Danger Zone */}
      <div className="pt-10 pb-4">
        <button 
          onClick={onClearData}
          className="mx-auto flex items-center gap-2 text-red-400 text-xs px-4 py-2 rounded-full border border-transparent hover:bg-red-50 hover:border-red-100 transition-colors"
        >
          <Trash2 size={14} />
          清空所有数据 (慎点)
        </button>
      </div>
    </div>
  );
}