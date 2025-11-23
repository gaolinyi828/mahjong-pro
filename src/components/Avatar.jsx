import React from 'react';

export const PRESET_AVATARS = [
  '🀄', '🎲', '🐲', '🐯', '🦊', '🐶', '🐱', '🐷', 
  '🐸', '🐼', '🐻', '🐨', '🐵', '🐔', '🦄', '🐝',
  '👻', '👽', '🤖', '💩', '🤡', '👹', '👺', '💀',
  '👨‍💻', '👩‍💻', '🤴', '👸', '🕵️‍♂️', '🥷', '🎅', '🧛‍♂️'
];

export default function Avatar({ player, size = "md", className = "" }) {
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-xl",
    xl: "w-20 h-20 text-4xl"
  };

  const content = player?.avatar || player?.name?.[0] || '?';
  const isUrl = content.startsWith('http');

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 overflow-hidden shadow-sm shrink-0 ${className}`}>
      {isUrl ? (
        <img src={content} alt={player?.name} className="w-full h-full object-cover" />
      ) : (
        <span>{content}</span>
      )}
    </div>
  );
}