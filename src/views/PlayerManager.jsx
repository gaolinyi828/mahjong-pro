import React, { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import Avatar, { PRESET_AVATARS } from '../components/Avatar';

export default function PlayerManager({ players, db, appId }) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');

  const handleSave = async () => {
    if (!newName.trim()) return;
    
    if (editingPlayer) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'club_players', editingPlayer.id), {
        name: newName.trim(),
        avatar: newAvatar.trim()
      });
      setEditingPlayer(null);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'club_players'), { 
        name: newName.trim(), 
        avatar: newAvatar.trim(),
        joinedAt: serverTimestamp() 
      });
    }
    setNewName('');
    setNewAvatar('');
  };

  const startEdit = (p) => {
    setEditingPlayer(p);
    setNewName(p.name);
    setNewAvatar(p.avatar || '');
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setNewName('');
    setNewAvatar('');
  };

  return (
    <div className="space-y-4">
      {/* Edit/Create Form */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
        <h3 className="font-bold text-slate-700 mb-3">{editingPlayer ? '编辑成员' : '添加新成员'}</h3>
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
             <div className="w-14 h-14 rounded-full bg-slate-100 border flex items-center justify-center overflow-hidden shrink-0 text-2xl">
               {newAvatar.startsWith('http') ? <img src={newAvatar} className="w-full h-full object-cover"/> : (newAvatar || newName[0] || '?')}
             </div>
             <div className="flex-1 space-y-2">
                <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="名字" className="w-full p-2 border rounded-lg outline-none focus:border-emerald-500 text-sm"/>
                <input value={newAvatar} onChange={e=>setNewAvatar(e.target.value)} placeholder="头像URL (选填)" className="w-full p-2 border rounded-lg outline-none focus:border-emerald-500 text-xs font-mono"/>
             </div>
          </div>
          
          {/* Preset Avatars */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {PRESET_AVATARS.map(emoji => (
               <button key={emoji} onClick={() => setNewAvatar(emoji)} className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-200 rounded-lg text-lg">
                 {emoji}
               </button>
             ))}
          </div>

          <div className="flex gap-2">
            {editingPlayer && <button onClick={cancelEdit} className="flex-1 bg-slate-100 text-slate-500 py-2 rounded-lg text-sm font-bold">取消</button>}
            <button onClick={handleSave} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold">
              {editingPlayer ? '保存修改' : '添加成员'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {players.map(p => (
          <div key={p.id} onClick={() => startEdit(p)} className="bg-white p-3 rounded-xl shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-3">
              <Avatar player={p} size="md" />
              <span className="font-bold text-slate-700">{p.name}</span>
            </div>
            <Edit3 size={16} className="text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  )
}