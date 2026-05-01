// App.jsx — Premium SaaS layout with sidebar

import { useState, useEffect } from 'react';
import SyncPage from './components/SyncPage';
import ChatPage from './components/ChatPage';
import { checkHealth } from './api';
import './index.css';

/* ── Icons ────────────────────────────────────── */
function SyncIcon({ active }) {
  return (
    <svg className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function ChatIcon({ active }) {
  return (
    <svg className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function LogoMark() {
  return (
    <div className="relative w-8 h-8 flex-shrink-0">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 opacity-90" />
      <div className="absolute inset-0 rounded-xl flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    </div>
  );
}

/* ── Nav Item ─────────────────────────────────── */
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
        active ? 'nav-active text-blue-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── Status dot ───────────────────────────────── */
function StatusDot({ status }) {
  const colors = {
    online:   'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    checking: 'bg-amber-400 animate-pulse',
    offline:  'bg-red-500',
  };
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[status] ?? colors.offline}`} />;
}

/* ── Main App ─────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState('sync');
  const [serverStatus, setServerStatus] = useState('checking');
  const [indexSize, setIndexSize] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const data = await checkHealth();
        setServerStatus('online');
        setIndexSize(data.index_size);
      } catch {
        setServerStatus('offline');
      }
    };
    check();
    const id = setInterval(check, 6000);
    return () => clearInterval(id);
  }, []);

  const statusLabel = {
    online:   'Connected',
    checking: 'Connecting…',
    offline:  'Disconnected',
  }[serverStatus];

  return (
    <div className="flex h-screen overflow-hidden bg-[#080b12] relative">
      {/* ambient glow blobs */}
      <div className="ambient-glow" aria-hidden="true" />
      <div className="ambient-glow-2" aria-hidden="true" />

      {/* ── Sidebar ──────────────────────────── */}
      <aside className="sidebar-bg relative z-10 w-60 flex flex-col py-5 px-3 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-7">
          <LogoMark />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight tracking-tight">DocMind AI</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.12em] mt-0.5">RAG Platform</p>
          </div>
        </div>

        {/* Nav section */}
        <div className="mb-1">
          <p className="text-[10px] text-slate-700 font-semibold uppercase tracking-[0.15em] px-3 mb-2">Workspace</p>
          <nav className="flex flex-col gap-1">
            <NavItem
              icon={<SyncIcon active={page === 'sync'} />}
              label="Sync Drive"
              active={page === 'sync'}
              onClick={() => setPage('sync')}
            />
            <NavItem
              icon={<ChatIcon active={page === 'chat'} />}
              label="Chat"
              active={page === 'chat'}
              onClick={() => setPage('chat')}
              badge={indexSize > 0 ? `${indexSize} docs` : null}
            />
          </nav>
        </div>

        <div className="flex-1" />

        {/* Status footer */}
        <div className="mx-1 rounded-xl p-3 bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <StatusDot status={serverStatus} />
              <span className="text-xs text-slate-400 font-medium">{statusLabel}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-600 leading-relaxed">
            {indexSize > 0 ? (
              <span className="text-emerald-600 font-medium">✓ {indexSize} vectors indexed</span>
            ) : (
              <span>No documents indexed</span>
            )}
          </div>
          <div className="text-[10px] text-slate-700 mt-1 font-mono">localhost:8000</div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────── */}
      <main className="relative z-10 flex-1 overflow-hidden flex flex-col min-w-0">
        {page === 'sync' ? <SyncPage /> : <ChatPage />}
      </main>
    </div>
  );
}
