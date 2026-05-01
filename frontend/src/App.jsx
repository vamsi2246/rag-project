// App.jsx — Root layout with sidebar navigation

import { useState, useEffect } from 'react';
import SyncPage from './components/SyncPage';
import ChatPage from './components/ChatPage';
import { checkHealth } from './api';
import './index.css';

/* ── Nav item ─────────────────────────────────── */
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
          : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── Main App ─────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState('sync');
  const [serverStatus, setServerStatus] = useState('checking'); // checking | online | offline
  const [indexSize, setIndexSize] = useState(0);

  // Poll health endpoint every 5 seconds
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
    const timer = setInterval(check, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1117]">
      {/* ── Sidebar ───────────────────────── */}
      <aside className="sidebar w-64 flex flex-col py-5 px-3 gap-1">
        {/* Logo */}
        <div className="px-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">RAG Project</div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest">Document AI</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          <p className="text-[10px] text-gray-700 uppercase tracking-widest px-3 mb-1">Navigation</p>
          <NavItem
            icon="☁️"
            label="Sync Drive"
            active={page === 'sync'}
            onClick={() => setPage('sync')}
          />
          <NavItem
            icon="💬"
            label="Chat"
            active={page === 'chat'}
            onClick={() => setPage('chat')}
            badge={indexSize > 0 ? `${indexSize} chunks` : null}
          />
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Server status */}
        <div className="mx-1 p-3 rounded-xl bg-gray-800/40 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${
                serverStatus === 'online'
                  ? 'bg-green-500 shadow-[0_0_6px_#22c55e]'
                  : serverStatus === 'checking'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-400 font-medium">
              {serverStatus === 'online'
                ? 'Backend Online'
                : serverStatus === 'checking'
                ? 'Connecting…'
                : 'Backend Offline'}
            </span>
          </div>
          <div className="text-[10px] text-gray-600">
            {indexSize > 0 ? (
              <span className="text-green-600">✓ {indexSize} vectors indexed</span>
            ) : (
              'No index loaded'
            )}
          </div>
          <div className="text-[10px] text-gray-700 mt-0.5">127.0.0.1:8000</div>
        </div>
      </aside>

      {/* ── Main content ──────────────────── */}
      <main className="flex-1 overflow-hidden flex flex-col bg-[#0f1117]">
        {page === 'sync' ? <SyncPage /> : <ChatPage />}
      </main>
    </div>
  );
}
