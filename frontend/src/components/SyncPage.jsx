// SyncPage.jsx — Premium Google Drive sync dashboard

import { useState } from 'react';
import { syncDrive } from '../api';

/* ── Google Drive SVG ─────────────────────────── */
function DriveIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" aria-hidden="true">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a7.3 7.3 0 003.3 3.3z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L.95 50.55a7.3 7.3 0 000 7.3H27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.35 57.9a7.3 7.3 0 000-7.3H59.8L73.55 76.8z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2A7.26 7.26 0 0054.1 0H33.2a7.26 7.26 0 00-3.3.75z" fill="#00832d"/>
      <path d="M59.8 50.55H27.5L13.75 76.8c1.35.8 2.9 1.2 4.4 1.2h50.9c1.5 0 3.05-.45 4.4-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.45l-13.2-22.9c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 25.55H86.3a7.3 7.3 0 00-1.6-5.65z" fill="#ffba00"/>
    </svg>
  );
}

/* ── Pipeline steps ───────────────────────────── */
const STEPS = [
  {
    label: 'Fetch',
    desc: 'Download from Drive',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
  },
  {
    label: 'Extract',
    desc: 'Parse PDF, DOCX, TXT',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Chunk',
    desc: 'Split into 500-word blocks',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  {
    label: 'Embed',
    desc: 'Index in FAISS vector DB',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
];

/* ── Spinner ──────────────────────────────────── */
function Spinner({ size = 'w-5 h-5' }) {
  return (
    <svg className={`${size} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

/* ── Folder icon for input ────────────────────── */
function FolderIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

/* ── Pipeline stepper ─────────────────────────── */
function Pipeline({ status }) {
  const isDone    = status === 'success';
  const isLoading = status === 'loading';

  return (
    <div className="w-full">
      {/* label */}
      <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-[0.18em] mb-5 text-center">
        Processing Pipeline
      </p>

      {/* steps row */}
      <div className="flex items-start gap-0">
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          const stateClass = isDone ? 'step-done' : isLoading ? 'step-active' : 'step-idle';
          const iconColor  = isDone ? 'text-emerald-400' : isLoading ? 'text-blue-400' : 'text-slate-600';
          const labelColor = isDone ? 'text-emerald-400' : isLoading ? 'text-blue-300' : 'text-slate-500';
          const badgeBg    = isDone
            ? 'bg-emerald-900/50 border-emerald-600/40 text-emerald-400'
            : isLoading
            ? 'bg-blue-900/50 border-blue-600/40 text-blue-300'
            : 'bg-slate-900 border-slate-700/40 text-slate-600';

          return (
            <div key={i} className="flex items-center flex-1 min-w-0">
              {/* card */}
              <div className={`flex-1 min-w-0 relative flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl transition-all duration-500 ${stateClass}`}>
                {/* step badge */}
                <div className={`absolute -top-2.5 -left-2 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border z-10 ${badgeBg}`}>
                  {i + 1}
                </div>

                {/* icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isDone    ? 'bg-emerald-500/15 text-emerald-400' :
                  isLoading ? 'bg-blue-500/15 text-blue-400' :
                  'bg-white/[0.03] text-slate-600'
                }`}>
                  {isDone ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isLoading ? (
                    <Spinner size="w-5 h-5" />
                  ) : step.icon}
                </div>

                {/* text */}
                <div className="text-center">
                  <p className={`text-xs font-semibold leading-tight ${labelColor}`}>{step.label}</p>
                  <p className="text-[10px] text-slate-700 mt-0.5 leading-snug">{step.desc}</p>
                </div>
              </div>

              {/* connector */}
              {!isLast && (
                <div className={`w-5 h-px flex-shrink-0 mx-1 transition-colors duration-700 ${
                  isDone ? 'bg-emerald-500/35' : 'bg-white/[0.06]'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Stat card ────────────────────────────────── */
function StatCard({ value, label }) {
  return (
    <div className="stat-card rounded-2xl py-5 px-4 text-center">
      <div className="text-3xl font-bold gradient-text mb-1">{value}</div>
      <div className="text-slate-500 text-xs font-medium uppercase tracking-widest">{label}</div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────── */
export default function SyncPage() {
  const [status,   setStatus]   = useState('idle');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [folderId, setFolderId] = useState('');

  const handleSync = async () => {
    setStatus('loading');
    setResult(null);
    setError('');
    try {
      const data = await syncDrive(folderId.trim() || null);
      setResult(data);
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          {/* icon + glow */}
          <div className="relative inline-flex mb-7">
            <div className="w-24 h-24 rounded-3xl glass flex items-center justify-center shadow-2xl">
              <DriveIcon size={42} />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-blue-500/8 blur-2xl scale-[2] -z-10" />
          </div>

          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Sync Google Drive
          </h1>
          <p className="text-slate-400 max-w-lg leading-relaxed text-base mx-auto">
            Import your documents — PDF, TXT, DOCX — from a shared folder.
            They'll be chunked, embedded, and stored for instant semantic retrieval.
          </p>
        </div>

        {/* ── Main card ── */}
        <div className="relative w-full max-w-2xl">
          {/* glow behind card */}
          <div className="card-glow" />

          <div className="glass rounded-3xl p-10 shadow-2xl">

            {/* Folder ID input */}
            <div className="mb-7">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-[0.14em] mb-3">
                <FolderIcon />
                Google Drive Folder ID
                <span className="normal-case font-normal text-slate-700 ml-1">— optional</span>
              </label>

              {/* pill input */}
              <div className="focus-ring flex items-center gap-3 rounded-full border border-white/[0.09] bg-white/[0.03] px-5 py-3.5">
                <FolderIcon />
                <input
                  type="text"
                  value={folderId}
                  onChange={e => setFolderId(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74…"
                  disabled={status === 'loading'}
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none disabled:opacity-50"
                />
              </div>

              <p className="mt-2.5 text-[11px] text-slate-700 pl-1">
                Found in the Drive URL after <span className="font-mono text-slate-600">/folders/</span>
              </p>
            </div>

            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={status === 'loading'}
              className="btn-gradient w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[15px] font-semibold text-white tracking-wide"
            >
              {status === 'loading' ? (
                <>
                  <Spinner />
                  <span>Syncing documents…</span>
                </>
              ) : (
                <>
                  <DriveIcon size={20} />
                  <span>Sync Google Drive</span>
                </>
              )}
            </button>

            {/* Success */}
            {status === 'success' && result && (
              <div className="mt-7 rounded-2xl overflow-hidden border border-emerald-500/20 bg-emerald-950/20 fade-up">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-emerald-500/10">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">Sync Complete</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Documents indexed and ready for queries</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 p-6">
                  <StatCard value={result.files_processed} label="Files" />
                  <StatCard value={result.chunks_created}  label="Chunks" />
                  <StatCard value={result.index_size}      label="Vectors" />
                </div>
              </div>
            )}

            {/* Error — soft, fade-up card */}
            {status === 'error' && (
              <div className="mt-6 flex items-start gap-4 px-5 py-4 rounded-2xl bg-red-500/[0.08] border border-red-500/[0.18] fade-up">
                <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-400 mb-1">Sync failed</p>
                  <p className="text-[12px] text-red-400/55 leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Pipeline ── */}
        <div className="w-full max-w-2xl mt-10">
          <Pipeline status={status} />
        </div>

      </div>
    </div>
  );
}
