import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Avatar from './Avatar';

export default function ScoreInput({ session, players, onCancel, onSave, db, appId }) {
  const [scores, setScores] = useState(['', '', '', '']);
  // 多标签状态
  const [tags, setTags] = useState([[], [], [], []]);

  const updateScore = (idx, val) => {
    const newScores = [...scores];
    newScores[idx] = val;
    setScores(newScores);
  }

  const toggleSign = (idx) => {
    const val = scores[idx] || '';
    if (!val) updateScore(idx, '-');
    else if (val.toString().startsWith('-')) updateScore(idx, val.toString().substring(1));
    else updateScore(idx, '-' + val);
  }

  const toggleTag = (playerIdx, tagType) => {
    const newTags = [...tags];
    const currentPlayerTags = newTags[playerIdx];
    if (currentPlayerTags.includes(tagType)) {
      newTags[playerIdx] = currentPlayerTags.filter(t => t !== tagType);
    } else {
      newTags[playerIdx] = [...currentPlayerTags, tagType];
    }
    setTags(newTags);
  }

  const sum = scores.reduce((a, b) => a + (parseInt(b) || 0), 0);

  const handleSubmit = async () => {
    const finalScores = scores.map(s => parseInt(s) || 0);
    if (finalScores.reduce((a,b)=>a+b,0) !== 0) {
      if (!confirm(`总分为 ${sum}，确定提交吗？`)) return;
    }
    
    // 转为对象存入 Firestore (因为不支持嵌套数组)
    const tagsMap = Object.assign({}, tags);

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'club_rounds'), {
      sessionId: session.id,
      scores: finalScores,
      tags: tagsMap,
      timestamp: serverTimestamp()
    });
    onSave();
  };

  const isActive = (pIdx, tag) => tags[pIdx].includes(tag);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-700">战绩录入</h3>
        <button onClick={onCancel} className="text-slate-400 text-sm">取消</button>
      </div>

      <div className="space-y-4 mb-4">
        {session.playerIds.map((pid, idx) => {
           const p = players.find(pl => pl.id === pid);
           return (
             <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar player={p} size="sm" />
                    <span className="font-bold text-slate-700">{p?.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleSign(idx)} className="p-1.5 bg-slate-100 rounded text-slate-400"><ArrowRightLeft size={14} /></button>
                    <input type="number" inputMode="decimal" className={`w-20 p-1 text-right font-mono text-xl font-bold border-b-2 outline-none bg-transparent ${(parseInt(scores[idx])||0) > 0 ? 'text-red-500 border-red-200' : (parseInt(scores[idx])||0) < 0 ? 'text-emerald-600 border-emerald-200' : 'text-slate-800 border-slate-200'}`} placeholder="0" value={scores[idx]} onChange={(e) => updateScore(idx, e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-2 pl-10">
                  <button onClick={() => toggleTag(idx, 'zimo')} className={`px-2 py-1 rounded text-[10px] border transition-all ${isActive(idx, 'zimo') ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200'}`}>自摸</button>
                  <button onClick={() => toggleTag(idx, 'hu')} className={`px-2 py-1 rounded text-[10px] border transition-all ${isActive(idx, 'hu') ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-200'}`}>接炮</button>
                  <button onClick={() => toggleTag(idx, 'pao')} className={`px-2 py-1 rounded text-[10px] border transition-all ${isActive(idx, 'pao') ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-400 border-slate-200'}`}>点炮</button>
                </div>
             </div>
           )
        })}
      </div>
      <div className="flex items-center justify-between mb-4 px-2 text-sm">
        <span className="text-slate-400">校验和:</span>
        <span className={`font-bold ${sum !== 0 ? 'text-orange-500' : 'text-emerald-500'}`}>{sum}</span>
      </div>
      <button onClick={handleSubmit} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow active:scale-95 transition-transform">确认记录</button>
    </div>
  );
}