import React from 'react';

export default function NavBtn({ id, icon: Icon, label, active, set, isMain }) {
  if (isMain) {
    return (
      <button 
        onClick={() => set(id)}
        className="relative -top-5 bg-emerald-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
      >
        <Icon size={24} />
      </button>
    )
  }
  return (
    <button 
      onClick={() => set(id)}
      className={`flex flex-col items-center gap-1 w-16 py-1 rounded-lg transition-colors ${active === id ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:bg-slate-50'}`}
    >
      <Icon size={20} strokeWidth={active === id ? 2.5 : 2} />
      <span className="scale-90">{label}</span>
    </button>
  );
}