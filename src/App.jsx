import React, { useState, useEffect } from 'react';
import { Plus, Users, BarChart3, History, PlayCircle } from 'lucide-react';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, addDoc, query, onSnapshot, updateDoc, doc, 
  serverTimestamp, orderBy, getDocs, writeBatch 
} from 'firebase/firestore';

// 引入模块
import { auth, db, appId } from './services/firebase';
import NavBtn from './components/NavBtn';
import GlobalStats from './components/GlobalStats'; // 保持在 components 中

// 引入页面视图
import HomeView from './views/HomeView';
import ActiveTable from './views/ActiveTable';
import NewSessionSetup from './views/NewSessionSetup';
import PlayerManager from './views/PlayerManager';

export default function MahjongSessionApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. 自动登录
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

  // 2. 数据同步监听
  useEffect(() => {
    if (!user) return;
    const unsubPlayers = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'club_players')), (snap) => setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSessions = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'club_sessions'), orderBy('startTime', 'desc')), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSessions(list);
        const active = list.find(s => s.isActive);
        if (active) setActiveSessionId(active.id);
        setLoading(false);
    });
    const unsubRounds = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'club_rounds'), orderBy('timestamp', 'desc')), (snap) => setAllRounds(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubPlayers(); unsubSessions(); unsubRounds(); };
  }, [user]);

  // 3. 业务逻辑函数
  const currentSession = sessions.find(s => s.id === activeSessionId);
  const currentSessionRounds = allRounds.filter(r => r.sessionId === activeSessionId);

  const handleStartSession = async (selectedPlayerIds) => {
    const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'club_sessions'), {
      startTime: serverTimestamp(),
      playerIds: selectedPlayerIds,
      isActive: true
    });
    setActiveSessionId(docRef.id);
    setActiveTab('play'); 
  };

  const handleEndSession = async () => {
    if (!confirm("确定要结束这一场吗？结束后将归档数据。")) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'club_sessions', activeSessionId), {
      isActive: false,
      endTime: serverTimestamp()
    });
    setActiveSessionId(null);
    setActiveTab('home');
  };

  const handleClearAllData = async () => {
    if (!confirm('⚠️ 严重警告：此操作将删除所有数据！\n\n确定要执行吗？')) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const deleteCollection = async (colName) => {
         const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', colName));
         snap.docs.forEach(d => batch.delete(d.ref));
      };
      await deleteCollection('club_rounds');
      await deleteCollection('club_sessions');
      await deleteCollection('club_players');
      await batch.commit();
      alert(`数据已清空。`);
    } catch (e) {
      console.error(e);
      alert("删除失败");
    }
    setLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-100 text-emerald-700 font-bold">正在处理数据...</div>;

  const displayedTab = activeSessionId ? 'play' : activeTab;

  return (
    <div className="h-screen bg-slate-50 text-slate-800 font-sans flex flex-col max-w-md mx-auto overflow-hidden">
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

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {displayedTab === 'play' && currentSession && (
          <ActiveTable 
            session={currentSession} 
            rounds={currentSessionRounds} 
            players={players} 
            onEndSession={handleEndSession} 
            db={db} appId={appId} 
          />
        )}
        {displayedTab === 'home' && (
          <HomeView 
            sessions={sessions} 
            players={players} 
            onStartNew={() => setActiveTab('new_session')} 
            onClearData={handleClearAllData} 
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
          <GlobalStats 
            players={players} 
            allRounds={allRounds} 
            sessions={sessions} 
          />
        )}
        {displayedTab === 'players' && (
          <PlayerManager 
            players={players} 
            db={db} appId={appId} 
          />
        )}
      </main>

      {!activeSessionId && displayedTab !== 'new_session' && (
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 p-2 pb-6 flex justify-around z-20">
          <NavBtn id="home" icon={History} label="战绩" active={activeTab} set={setActiveTab} />
          <NavBtn id="new_session" icon={Plus} label="记账" active={activeTab} set={setActiveTab} isMain />
          <NavBtn id="stats" icon={BarChart3} label="统计" active={activeTab} set={setActiveTab} />
          <NavBtn id="players" icon={Users} label="成员" active={activeTab} set={setActiveTab} />
        </nav>
      )}
    </div>
  );
}