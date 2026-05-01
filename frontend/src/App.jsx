// App.jsx — Dashboard shell

import { useState, useEffect } from 'react';
import SyncPage from './components/SyncPage';
import ChatPage from './components/ChatPage';
import { checkHealth } from './api';
import './index.css';

/* ── Sidebar icons ────────────────────────────── */
const SyncSVG = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ChatSVG = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

export default function App() {
  const [page,         setPage]         = useState('sync');
  const [serverStatus, setServerStatus] = useState('checking');
  const [indexSize,    setIndexSize]    = useState(0);

  useEffect(() => {
    const ping = async () => {
      try {
        const d = await checkHealth();
        setServerStatus('online');
        setIndexSize(d.index_size ?? 0);
      } catch {
        setServerStatus('offline');
      }
    };
    ping();
    const t = setInterval(ping, 6000);
    return () => clearInterval(t);
  }, []);

  /* status dot */
  const dotColor = { online: '#10b981', checking: '#f59e0b', offline: '#ef4444' }[serverStatus];
  const dotLabel = { online: 'Connected', checking: 'Connecting…', offline: 'Disconnected' }[serverStatus];

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', position:'relative' }}>
      {/* ambient glows */}
      <div className="glow-top"    aria-hidden="true" />
      <div className="glow-bottom" aria-hidden="true" />

      {/* ── SIDEBAR ──────────────────────────────── */}
      <aside className="sidebar" style={{ display:'flex', flexDirection:'column', padding:'20px 12px', zIndex:10, position:'relative' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 6px', marginBottom:28 }}>
          <div style={{
            width:32, height:32, borderRadius:10, flexShrink:0,
            background:'linear-gradient(135deg,#2563eb,#7c3aed)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 12px rgba(59,130,246,0.3)'
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#f1f5f9', letterSpacing:'-0.02em' }}>DocMind AI</div>
            <div style={{ fontSize:10, color:'#334155', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:1 }}>RAG Platform</div>
          </div>
        </div>

        {/* Nav section label */}
        <div style={{ fontSize:10, color:'#1e293b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', padding:'0 6px', marginBottom:6 }}>
          WORKSPACE
        </div>

        {/* Nav items */}
        <nav style={{ display:'flex', flexDirection:'column', gap:3 }}>
          <button className={`nav-item ${page==='sync' ? 'active' : ''}`} onClick={() => setPage('sync')}>
            <SyncSVG color={page==='sync' ? '#60a5fa' : '#475569'} />
            Sync Drive
          </button>
          <button className={`nav-item ${page==='chat' ? 'active' : ''}`} onClick={() => setPage('chat')}>
            <ChatSVG color={page==='chat' ? '#60a5fa' : '#475569'} />
            Chat
            {indexSize > 0 && (
              <span style={{
                marginLeft:'auto', fontSize:10, fontWeight:700,
                background:'rgba(59,130,246,0.15)', color:'#60a5fa',
                border:'1px solid rgba(59,130,246,0.2)', padding:'1px 7px', borderRadius:99
              }}>{indexSize}</span>
            )}
          </button>
        </nav>

        <div style={{ flex:1 }} />

        {/* Connection status */}
        <div style={{ background:'#0a0e1a', border:'1px solid #111827', borderRadius:12, padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{
              width:7, height:7, borderRadius:'50%', flexShrink:0,
              background: dotColor,
              boxShadow: serverStatus==='online' ? `0 0 8px ${dotColor}` : 'none'
            }} />
            <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>{dotLabel}</span>
            {serverStatus==='online' && (
              <span style={{
                marginLeft:'auto', fontSize:9, fontWeight:700, textTransform:'uppercase',
                letterSpacing:'0.08em', background:'rgba(16,185,129,0.12)', color:'#10b981',
                border:'1px solid rgba(16,185,129,0.2)', padding:'2px 6px', borderRadius:99
              }}>LIVE</span>
            )}
          </div>
          <div style={{ fontSize:10, color:'#334155', lineHeight:1.6 }}>
            {indexSize > 0
              ? <span style={{ color:'#10b981', fontWeight:600 }}>✓ {indexSize} vectors indexed</span>
              : 'No documents indexed'}
          </div>
          <div style={{ fontSize:10, color:'#1e293b', marginTop:3, fontFamily:'monospace' }}>localhost:8000</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────── */}
      <main className="content-area" style={{ zIndex:10, position:'relative' }}>
        {page === 'sync' ? <SyncPage /> : <ChatPage />}
      </main>
    </div>
  );
}
