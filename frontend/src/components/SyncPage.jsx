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

/* ── Step data ────────────────────────────────── */
const STEPS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
    label: 'Fetch',
    desc: 'Download files from Drive',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    label: 'Extract',
    desc: 'Parse PDF, DOCX, TXT',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
    label: 'Chunk',
    desc: 'Split into 500-word blocks',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    label: 'Embed',
    desc: 'Store in FAISS vector DB',
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

/* ── Step indicator ───────────────────────────── */
function StepCard({ step, index, status }) {
  const isDone    = status === 'success';
  const isLoading = status === 'loading';

  return (
    <div
      className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all duration-500 ${
        isDone    ? 'step-done' :
        isLoading ? 'step-active' :
        'bg-white/[0.02] border border-white/[0.05]'
      }`}
    >
      {/* connector line (not last) */}
      {index < STEPS.length - 1 && (
        <div className={`absolute top-1/2 -right-3 w-6 h-px transition-colors duration-700 ${isDone ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`} />
      )}

      {/* icon circle */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
        isDone    ? 'bg-emerald-500/20 text-emerald-400' :
        isLoading ? 'bg-blue-500/20 text-blue-400' :
        'bg-white/[0.04] text-slate-600'
      }`}>
        {isDone ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : isLoading ? (
          <Spinner size="w-5 h-5" />
        ) : step.icon}
      </div>

      <div className="text-center">
        <p className={`text-xs font-semibold leading-tight ${isDone ? 'text-emerald-400' : isLoading ? 'text-blue-300' : 'text-slate-500'}`}>
          {step.label}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{step.desc}</p>
      </div>

      {/* step number badge */}
      <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border ${
        isDone    ? 'bg-emerald-900/60 border-emerald-600/40 text-emerald-400' :
        isLoading ? 'bg-blue-900/60 border-blue-600/40 text-blue-300' :
        'bg-slate-900 border-slate-700/50 text-slate-600'
      }`}>
        {index + 1}
      </div>
    </div>
  );
}

/* ── Stat card ────────────────────────────────── */
function StatCard({ value, label, icon }) {
  return (
    <div className="stat-card rounded-2xl p-4 text-center flex flex-col items-center gap-2">
      <div className="text-2xl font-bold gradient-text">{value}</div>
      <div className="text-slate-500 text-xs font-medium">{label}</div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────── */
export default function SyncPage() {
  const [status, setStatus]   = useState('idle');
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
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
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-16">
        {/* ── Hero header ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl glass mb-6 shadow-2xl">
            <DriveIcon size={36} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Sync Google Drive
          </h1>
          <p className="text-slate-400 max-w-md leading-relaxed text-[15px]">
            Import your documents (PDF, TXT, DOCX) from a shared Google Drive folder.
            They'll be processed into vector embeddings for semantic search.
          </p>
        </div>

        {/* ── Main card ── */}
        <div className="w-full max-w-lg glass rounded-3xl p-8 shadow-2xl">
          {/* Folder ID input */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
              Folder ID
              <span className="normal-case font-normal text-slate-600 ml-2">optional — uses .env default</span>
            </label>
            <div className="focus-ring rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <input
                type="text"
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74..."
                className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none rounded-2xl"
                disabled={status === 'loading'}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
              Find it in the Drive URL: drive.google.com/drive/folders/<span className="text-slate-500 font-mono">FOLDER_ID</span>
            </p>
          </div>

          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={status === 'loading'}
            className="btn-gradient w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-semibold text-white"
          >
            {status === 'loading' ? (
              <>
                <Spinner />
                <span>Syncing documents…</span>
              </>
            ) : (
              <>
                <DriveIcon size={18} />
                <span>Sync Google Drive</span>
              </>
            )}
          </button>

          {/* Success result */}
          {status === 'success' && result && (
            <div className="mt-6 rounded-2xl overflow-hidden border border-emerald-500/20 bg-emerald-950/20">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-emerald-500/10">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-emerald-400">Sync Successful</span>
              </div>
              <div className="grid grid-cols-3 gap-3 p-5">
                <StatCard value={result.files_processed} label="Files" />
                <StatCard value={result.chunks_created}  label="Chunks" />
                <StatCard value={result.index_size}      label="Vectors" />
              </div>
              <p className="text-[11px] text-emerald-600/80 text-center pb-4">
                Your documents are ready — switch to Chat to ask questions
              </p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl bg-red-950/30 border border-red-500/20">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-400 mb-1">Sync Failed</p>
                <p className="text-xs text-red-400/60 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Step indicators ── */}
        <div className="w-full max-w-lg mt-8">
          <p className="text-[10px] text-slate-700 font-semibold uppercase tracking-[0.15em] mb-4 text-center">Pipeline</p>
          <div className="grid grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <StepCard key={i} step={step} index={i} status={status} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
