import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import Avatar from '../components/Avatar';
import ScoreInput from '../components/ScoreInput';

export default function ActiveTable({ session, rounds, players, onEndSession, db, appId }) {
  const [showInput, setShowInput] = useState(false);

  const runningTotals = useMemo(() => {
    const totals = session.playerIds.map(() => 0);
    rounds.forEach(r => {
      r.scores.forEach((s, i) => totals[i] += s);
    });
    return totals;
  }, [rounds, session]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
           <div>
             <h2 className="font-bold text-lg text-slate-800">🀄 牌局进行中</h2>
             <p className="text-xs text-slate-400">
               开始于: {session.startTime?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </p>
           </div>
           <button onClick={onEndSession} className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50">
             结束/结算
           </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {session.playerIds.map((pid, idx) => {
            const p = players.find(pl => pl.id === pid);
            const score = runningTotals[idx];
            return (
              <div key={pid} className="flex flex-col items-center p-2 rounded-xl bg-slate-50 relative">
                 <Avatar player={p} size="sm" className="mb-1" />
                 <div className="text-xs font-medium text-slate-500 mb-1 w-full text-center truncate">{p?.name}</div>
                 <div className={`text-lg font-mono font-black ${score > 0 ? 'text-red-500' : score < 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                   {score > 0 ? `+${score}` : score}
                 </div>
              </div>
            )
          })}
        </div>
      </div>

      {!showInput ? (
        <button onClick={() => setShowInput(true)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 font-bold text-lg active:scale-95 transition-transform">
          <Plus size={24} /> 记一局
        </button>
      ) : (
        <ScoreInput session={session} players={players} onCancel={() => setShowInput(false)} onSave={() => setShowInput(false)} db={db} appId={appId} />
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 ml-1">本场明细 ({rounds.length}局)</h3>
        <div className="space-y-2">
          {rounds.map((r, idx) => (
            <div key={r.id} className="bg-white px-4 py-3 rounded-xl border border-slate-100 flex items-center justify-between text-sm">
               <span className="text-slate-400 w-8">#{rounds.length - idx}</span>
               <div className="flex-1 grid grid-cols-4 gap-2 text-center">
                 {r.scores.map((s, i) => (
                   <span key={i} className={`font-mono font-bold ${s > 0 ? 'text-red-500' : s < 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                     {s > 0 ? `+${s}` : s}
                   </span>
                 ))}
               </div>
               <button onClick={() => confirm('删除这局记录？') && deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'club_rounds', r.id))} className="text-slate-300 hover:text-red-400 ml-2">
                 <span className="text-xs">×</span>
               </button>
            </div>
          ))}
          {rounds.length === 0 && <div className="text-center text-slate-300 py-4 text-sm">还没开始打呢，快记一局吧</div>}
        </div>
      </div>
    </div>
  );
}