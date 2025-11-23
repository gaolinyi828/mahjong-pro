import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Avatar from '../components/Avatar';

export default function NewSessionSetup({ players, onStart, onCancel }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggle = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(s => s !== id));
    else if (selectedIds.length < 4) setSelectedIds([...selectedIds, id]);
  };

  return (
    <div className="flex flex-col h-full pt-4">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onCancel} className="text-slate-400">取消</button>
        <h2 className="font-bold text-lg">选择今日牌友</h2>
        <div className="w-8"></div>
      </div>

      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-emerald-800 mb-1">{selectedIds.length} / 4</div>
        <p className="text-slate-400 text-xs">请选择4位上桌玩家</p>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start">
        {players.map(p => (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
              selectedIds.includes(p.id) 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm' 
                : 'border-transparent bg-white text-slate-600 shadow-sm'
            }`}
          >
             <Avatar player={p} size="sm" />
             <span className="font-bold">{p.name}</span>
          </button>
        ))}
        <div className="col-span-2 p-4 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 gap-2 cursor-pointer hover:bg-slate-50">
           <UserPlus size={16} /> 找不到人？去添加成员
        </div>
      </div>

      <button 
        disabled={selectedIds.length !== 4}
        onClick={() => onStart(selectedIds)}
        className="mt-4 w-full bg-emerald-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all"
      >
        开台
      </button>
    </div>
  )
}