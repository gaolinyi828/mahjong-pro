import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Users, BarChart3, History, Trophy, 
  UserPlus, ChevronRight, ArrowRightLeft,
  PlayCircle, CalendarDays, CheckCircle2, X
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, 
  updateDoc, doc, serverTimestamp, orderBy, deleteDoc
} from 'firebase/firestore';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBIXM_YBlyVwuFad3Y-GB5U9aN2Mimi5gc",
  authDomain: "mahjong-pro-256b9.firebaseapp.com",
  projectId: "mahjong-pro-256b9",
  storageBucket: "mahjong-pro-256b9.firebasestorage.app",
  messagingSenderId: "1072025993542",
  appId: "1:1072025993542:web:06c1be124ab531054ba547",
  measurementId: "G-D2FB8194KC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); 

const appId = 'mahjong-pro';

// --- Main App ---
export default function MahjongSessionApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    onAuthStateChanged(auth, setUser);
  }, []);

  // Data Sync
  useEffect(() => {
    if (!user) return;

    // 1. Players
    const unsubPlayers = onSnapshot(
      query(collection(db, 'artifacts', appId, 'public', 'data', 'club_players')), 
      (snap) => setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // 2. Sessions (场)
    const unsubSessions = onSnapshot(
      query(collection(db, 'artifacts', appId, 'public', 'data', 'club_sessions'), orderBy('startTime', 'desc')),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSessions(list);
        // Check for any active session to auto-resume
        const active = list.find(s => s.isActive);
        if (active) setActiveSessionId(active.id);
        setLoading(false);
      }
    );

    // 3. Rounds (局)
    const unsubRounds = onSnapshot(
      query(collection(db, 'artifacts', appId, 'public', 'data', 'club_rounds'), orderBy('timestamp', 'desc')),
      (snap) => setAllRounds(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubPlayers(); unsubSessions(); unsubRounds(); };
  }, [user]);

  // Logic to switch views
  const currentSession = sessions.find(s => s.id === activeSessionId);
  const currentSessionRounds = allRounds.filter(r => r.sessionId === activeSessionId);

  // Function to start a new session
  const handleStartSession = async (selectedPlayerIds) => {
    const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'club_sessions'), {
      startTime: serverTimestamp(),
      playerIds: selectedPlayerIds,
      isActive: true
    });
    setActiveSessionId(docRef.id);
    setActiveTab('play'); 
  };

  // Function to end session
  const handleEndSession = async () => {
    if (!confirm("确定要结束这一场吗？结束后将归档数据。")) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'club_sessions', activeSessionId), {
      isActive: false,
      endTime: serverTimestamp()
    });
    setActiveSessionId(null);
    setActiveTab('home');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-100 text-emerald-700 font-bold">正在加载数据...</div>;

  // If there is an active session, force the "Play" tab, otherwise show standard tabs
  const displayedTab = activeSessionId ? 'play' : activeTab;

  return (
    <div className="h-screen bg-slate-50 text-slate-800 font-sans flex flex-col max-w-md mx-auto overflow-hidden">
      
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4 pt-10 pb-4 shadow-md z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              🀄 雀友会 <span className="text-[10px] bg-emerald-900 px-1 rounded text-emerald-200">PRO</span>
            </h1>
          </div>
          {activeSessionId && (
            <div className="flex items-center gap-2 text-xs bg-emerald-600 px-3 py-1 rounded-full animate-pulse">
              <PlayCircle size={12} />
              正在营业中
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        
        {displayedTab === 'play' && currentSession && (
          <ActiveTable 
            session={currentSession} 
            rounds={currentSessionRounds}
            players={players}
            onEndSession={handleEndSession}
            db={db}
            appId={appId}
          />
        )}

        {displayedTab === 'home' && (
          <HomeView 
            sessions={sessions} 
            players={players} 
            onStartNew={() => setActiveTab('new_session')}
          />
        )}

        {displayedTab === 'new_session' && (
          <NewSessionSetup 
            players={players} 
            onStart={handleStartSession} 
            onCancel={() => setActiveTab('home')}
          />
        )}

        {displayedTab === 'stats' && (
          <GlobalStats players={players} allRounds={allRounds} sessions={sessions} />
        )}

        {displayedTab === 'players' && (
          <PlayerManager players={players} db={db} appId={appId} />
        )}

      </main>

      {/* Navigation */}
      {!activeSessionId && displayedTab !== 'new_session' && (
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 p-2 pb-6 flex justify-around z-20">
          <NavBtn id="home" icon={History} label="战绩" active={activeTab} set={setActiveTab} />
          <button 
             onClick={() => setActiveTab('new_session')}
             className="relative -top-6 bg-emerald-600 text-white w-14 h-14 rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus size={28} />
          </button>
          <NavBtn id="stats" icon={BarChart3} label="统计" active={activeTab} set={setActiveTab} />
          <NavBtn id="players" icon={Users} label="成员" active={activeTab} set={setActiveTab} />
        </nav>
      )}
    </div>
  );
}

// --- Sub-Components ---

function ActiveTable({ session, rounds, players, onEndSession, db, appId }) {
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
      {/* Session Header Card */}
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

        {/* Live Scoreboard */}
        <div className="grid grid-cols-4 gap-2">
          {session.playerIds.map((pid, idx) => {
            const p = players.find(pl => pl.id === pid);
            const score = runningTotals[idx];
            return (
              <div key={pid} className="flex flex-col items-center p-2 rounded-xl bg-slate-50 relative">
                 <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mb-1 shadow-sm">
                   {p?.name[0]}
                 </div>
                 <div className="text-xs font-medium text-slate-500 mb-1 w-full text-center truncate">{p?.name}</div>
                 <div className={`text-lg font-mono font-black ${score > 0 ? 'text-red-500' : score < 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                   {score > 0 ? `+${score}` : score}
                 </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      {!showInput ? (
        <button 
          onClick={() => setShowInput(true)}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 font-bold text-lg active:scale-95 transition-transform"
        >
          <Plus size={24} /> 记一局
        </button>
      ) : (
        <ScoreInput 
          session={session} 
          players={players} 
          onCancel={() => setShowInput(false)} 
          onSave={() => setShowInput(false)}
          db={db} appId={appId}
        />
      )}

      {/* History List */}
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
               <button 
                onClick={() => confirm('删除这局记录？') && deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'club_rounds', r.id))}
                className="text-slate-300 hover:text-red-400 ml-2"
               >
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

// --- Score Input (Updated: Multi-tag) ---
function ScoreInput({ session, players, onCancel, onSave, db, appId }) {
  const [scores, setScores] = useState(['', '', '', '']);
  // 升级：每个人是一个标签数组，比如 [['pao'], ['zimo', 'pao'], [], ['hu']]
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

  // 核心逻辑：切换标签状态
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
    
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'club_rounds'), {
      sessionId: session.id,
      scores: finalScores,
      tags: tags, // ✅ 存入多标签数据
      timestamp: serverTimestamp()
    });
    onSave();
  };

  const isActive = (pIdx, tag) => tags[pIdx].includes(tag);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-700">战绩录入 (多选模式)</h3>
        <button onClick={onCancel} className="text-slate-400 text-sm">取消</button>
      </div>

      <div className="space-y-4 mb-4">
        {session.playerIds.map((pid, idx) => {
           const p = players.find(pl => pl.id === pid);
           return (
             <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-0">
                {/* 第一行：名字和分数 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                      {['东','南','西','北'][idx]}
                    </div>
                    <span className="font-bold text-slate-700">{p?.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleSign(idx)} className="p-1.5 bg-slate-100 rounded text-slate-400">
                      <ArrowRightLeft size={14} />
                    </button>
                    <input 
                      type="number"
                      inputMode="decimal"
                      className={`w-20 p-1 text-right font-mono text-xl font-bold border-b-2 outline-none bg-transparent
                        ${(parseInt(scores[idx])||0) > 0 ? 'text-red-500 border-red-200' : (parseInt(scores[idx])||0) < 0 ? 'text-emerald-600 border-emerald-200' : 'text-slate-800 border-slate-200'}`}
                      placeholder="0"
                      value={scores[idx]}
                      onChange={(e) => updateScore(idx, e.target.value)}
                    />
                  </div>
                </div>

                {/* 第二行：标签开关 */}
                <div className="flex gap-2 pl-8">
                  <button 
                    onClick={() => toggleTag(idx, 'zimo')}
                    className={`px-2 py-1 rounded text-[10px] border transition-all ${
                      isActive(idx, 'zimo') ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    自摸
                  </button>
                  <button 
                    onClick={() => toggleTag(idx, 'hu')}
                    className={`px-2 py-1 rounded text-[10px] border transition-all ${
                      isActive(idx, 'hu') ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    接炮
                  </button>
                  <button 
                    onClick={() => toggleTag(idx, 'pao')}
                    className={`px-2 py-1 rounded text-[10px] border transition-all ${
                      isActive(idx, 'pao') ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    点炮
                  </button>
                </div>
             </div>
           )
        })}
      </div>

      <div className="flex items-center justify-between mb-4 px-2 text-sm">
        <span className="text-slate-400">校验和:</span>
        <span className={`font-bold ${sum !== 0 ? 'text-orange-500' : 'text-emerald-500'}`}>{sum}</span>
      </div>

      <button onClick={handleSubmit} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow active:scale-95 transition-transform">
        确认记录
      </button>
    </div>
  );
}

// --- Global Stats (Updated: Compatible) ---
function GlobalStats({ players, allRounds, sessions }) {
  const stats = useMemo(() => {
    const playerStats = {};
    players.forEach(p => {
      playerStats[p.id] = { 
        id: p.id, name: p.name, 
        total: 0, count: 0, wins: 0,       
        zimo: 0, hu: 0, pao: 0,        
        max: -9999,    
      };
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

          // 兼容解析
          if (round.tags && Array.isArray(round.tags[idx])) {
            const myTags = round.tags[idx];
            if (myTags.includes('zimo')) pStat.zimo += 1;
            if (myTags.includes('hu')) pStat.hu += 1;
            if (myTags.includes('pao')) pStat.pao += 1;
          } else if (round.roles && typeof round.roles[idx] === 'string') {
             const role = round.roles[idx];
             if (role === 'zimo') pStat.zimo += 1;
             if (role === 'hu') pStat.hu += 1;
             if (role === 'pao') pStat.pao += 1;
          }
        }
      });
    });

    return Object.values(playerStats)
      .filter(p => p.count > 0)
      .sort((a, b) => b.total - a.total);

  }, [players, allRounds, sessions]);

  const getRate = (num, total) => total > 0 ? Math.round((num / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 text-center">
        <h2 className="text-xl font-bold text-emerald-800">全能数据分析</h2>
        <p className="text-slate-400 text-xs mt-1">
          支持血战模式：单局可同时统计点炮与自摸
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {stats.map((stat, index) => (
          <div key={stat.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-50 relative overflow-hidden">
             <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                <div className="flex items-center gap-2">
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold
                     ${index === 0 ? 'bg-yellow-400' : 'bg-slate-300'}`}>
                     {index + 1}
                   </div>
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

// --- Standard Components ---

function HomeView({ sessions, players, onStartNew }) {
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
            const sPlayers = s.playerIds.map(id => players.find(p => p.id === id)?.name).join('、');
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
    </div>
  );
}

function NewSessionSetup({ players, onStart, onCancel }) {
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
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
               selectedIds.includes(p.id) ? 'bg-emerald-200' : 'bg-slate-100'
             }`}>
               {p.name[0]}
             </div>
             <span className="font-bold">{p.name}</span>
          </button>
        ))}
        <div onClick={() => document.getElementById('nav-players')?.click()} className="col-span-2 p-4 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 gap-2 cursor-pointer hover:bg-slate-50">
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

function PlayerManager({ players, db, appId }) {
  const [name, setName] = useState('');
  const add = async () => {
    if(!name.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'club_players'), { name, joinedAt: serverTimestamp() });
    setName('');
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="新成员名字" className="flex-1 p-3 border rounded-xl outline-none focus:border-emerald-500"/>
        <button onClick={add} className="bg-emerald-600 text-white px-4 rounded-xl"><UserPlus/></button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {players.map(p => (
          <div key={p.id} className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-xs">{p.name[0]}</div>
            <span className="font-bold text-slate-700">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NavBtn({ id, icon: Icon, label, active, set }) {
  return (
    <button onClick={() => set(id)} className={`flex flex-col items-center gap-1 w-16 py-1 rounded-lg transition-colors ${active === id ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:bg-slate-50'}`}>
      <Icon size={20} strokeWidth={active === id ? 2.5 : 2} />
      <span className="text-[10px]">{label}</span>
    </button>
  );
}