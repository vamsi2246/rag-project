// SyncPage.jsx — Dashboard-style sync panel (not centered card)

import { useState, Fragment } from 'react';
import { syncDrive } from '../api';

/* ── Inline SVG helpers ────────────────────────── */
const Icon = ({ d, size = 16, sw = 1.8 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const FOLDER_D   = "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z";
const CHECK_D    = "M5 13l4 4L19 7";
const WARN_D     = "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z";
const REFRESH_D  = "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15";
const FILE_D     = "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";
const LINES_D    = "M4 6h16M4 12h16M4 18h7";
const DB_D       = "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4";
const CLOUD_D    = "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10";
const LIGHTNING_D = "M13 10V3L4 14h7v7l9-11h-7z";

/* ── Google Drive icon ──────────────────────────── */
function DriveIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a7.3 7.3 0 003.3 3.3z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L.95 50.55a7.3 7.3 0 000 7.3H27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.35 57.9a7.3 7.3 0 000-7.3H59.8L73.55 76.8z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2A7.26 7.26 0 0054.1 0H33.2a7.26 7.26 0 00-3.3.75z" fill="#00832d"/>
      <path d="M59.8 50.55H27.5L13.75 76.8c1.35.8 2.9 1.2 4.4 1.2h50.9c1.5 0 3.05-.45 4.4-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.45l-13.2-22.9c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 25.55H86.3a7.3 7.3 0 00-1.6-5.65z" fill="#ffba00"/>
    </svg>
  );
}

/* ── Spinner ────────────────────────────────────── */
function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation:'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2"/>
      <path fill="currentColor" opacity="0.85" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );
}

/* ── Pipeline step ──────────────────────────────── */
function Step({ icon, label, sublabel, state }) {
  // state: 'idle' | 'active' | 'done'
  return (
    <div className={`pipeline-step ${state}`}>
      <div className={`step-icon ${state}`}>{icon}</div>
      <div style={{ minWidth:0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: state === 'done' ? '#34d399' : state === 'active' ? '#93c5fd' : '#475569',
          lineHeight: 1.3
        }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{sublabel}</div>
      </div>
      {state === 'done' && (
        <div style={{ marginLeft:'auto', color:'#34d399', flexShrink:0 }}>
          <Icon d={CHECK_D} size={15} sw={2.5} />
        </div>
      )}
      {state === 'active' && (
        <div style={{ marginLeft:'auto', color:'#60a5fa', flexShrink:0 }}>
          <Spinner size={15} />
        </div>
      )}
    </div>
  );
}

/* ── Connector line between steps ───────────────── */
function Connector({ done }) {
  return (
    <div style={{
      width: 32, height: 2, flexShrink: 0,
      background: done ? 'rgba(16,185,129,0.35)' : '#111827',
      borderRadius: 99, transition:'background 0.4s ease'
    }} />
  );
}

/* ── Stat box ───────────────────────────────────── */
function Stat({ label, value, icon }) {
  return (
    <div className="stat-box">
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:'rgba(59,130,246,0.1)', color:'#60a5fa', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {icon}
        </div>
        <span style={{ fontSize:11, color:'#475569', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
      </div>
      <div style={{ fontSize:28, fontWeight:800, lineHeight:1 }} className="text-gradient">{value}</div>
    </div>
  );
}

/* ── Pipeline step definitions ──────────────────── */
const STEPS = [
  { label:'Fetch',   sublabel:'Download from Drive', icon:<Icon d={CLOUD_D}  size={16}/> },
  { label:'Extract', sublabel:'Parse PDF, DOCX, TXT', icon:<Icon d={FILE_D}  size={16}/> },
  { label:'Chunk',   sublabel:'Split into 500-word blocks', icon:<Icon d={LINES_D} size={16}/> },
  { label:'Embed',   sublabel:'Store in FAISS index', icon:<Icon d={DB_D}    size={16}/> },
];

/* ════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════ */
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

  const stepState = (i) => {
    if (status === 'success') return 'done';
    if (status === 'loading') return i === 0 ? 'active' : 'idle';
    return 'idle';
  };

  /* status badge for header */
  const headerBadge = () => {
    if (status === 'success') return <span className="badge badge-green"><span style={{width:6,height:6,borderRadius:'50%',background:'#34d399',display:'inline-block'}}/>Synced</span>;
    if (status === 'loading') return <span className="badge badge-blue"><Spinner size={11}/>Syncing…</span>;
    if (status === 'error')   return <span className="badge badge-red"><Icon d={WARN_D} size={12} sw={2}/>Failed</span>;
    return <span className="badge badge-gray">Not synced</span>;
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* ── PAGE HEADER ────────────────────────── */}
      <div style={{
        padding:'20px 32px 18px',
        borderBottom:'1px solid #111827',
        display:'flex', alignItems:'flex-end', justifyContent:'space-between',
        flexShrink:0
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <DriveIcon size={22} />
            <h1 style={{ fontSize:20, fontWeight:700, color:'#f1f5f9', letterSpacing:'-0.02em' }}>
              Google Drive Sync
            </h1>
          </div>
          <p style={{ fontSize:13, color:'#475569', lineHeight:1.5 }}>
            Import documents, generate embeddings, and build your knowledge base.
          </p>
        </div>
        {headerBadge()}
      </div>

      {/* ── SCROLLABLE CONTENT ─────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px 32px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── ACTION PANEL ─────────────────────── */}
        <div className="section-card" style={{ padding:'24px' }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#94a3b8', marginBottom:2 }}>Folder ID</div>
            <div style={{ fontSize:12, color:'#334155' }}>Paste your Google Drive folder ID or leave blank to use the default from <code style={{ background:'#0a0e1a', padding:'1px 5px', borderRadius:4, fontSize:11 }}>.env</code></div>
          </div>

          {/* Input + Button as one unit */}
          <div className="input-unit">
            <div style={{ padding:'0 14px', color:'#334155', flexShrink:0, display:'flex' }}>
              <Icon d={FOLDER_D} size={16} />
            </div>
            <input
              type="text"
              value={folderId}
              onChange={e => setFolderId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !folderId.trim() === false && handleSync()}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74…"
              disabled={status === 'loading'}
            />
            <button
              className="btn-primary"
              onClick={handleSync}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <><Spinner size={14}/> Syncing…</>
              ) : (
                <><Icon d={REFRESH_D} size={14} />&nbsp;Sync Now</>
              )}
            </button>
          </div>

          <div style={{ marginTop:10, fontSize:11, color:'#1e293b' }}>
            Find the folder ID in the Drive URL: <span style={{ fontFamily:'monospace', color:'#334155' }}>drive.google.com/drive/folders/<strong style={{color:'#475569'}}>FOLDER_ID</strong></span>
          </div>
        </div>

        {/* ── PIPELINE ──────────────────────────── */}
        <div className="section-card" style={{ padding:'24px' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#334155', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:16 }}>
            Processing Pipeline
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:0 }}>
            {STEPS.map((s, i) => (
              <Fragment key={i}>
                <Step {...s} state={stepState(i)} />
                {i < STEPS.length - 1 && <Connector done={status==='success'} />}
              </Fragment>
            ))}
          </div>
        </div>

        {/* ── SUCCESS ───────────────────────────── */}
        {status === 'success' && result && (
          <div className="fade-in">
            {/* success header */}
            <div style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'14px 20px', background:'rgba(16,185,129,0.07)',
              border:'1px solid rgba(16,185,129,0.2)', borderRadius:'14px 14px 0 0',
              borderBottom:'none'
            }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#34d399' }}>
                <Icon d={CHECK_D} size={14} sw={2.5} />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#34d399' }}>Sync Complete</div>
                <div style={{ fontSize:11, color:'rgba(52,211,153,0.6)', marginTop:1 }}>Documents are indexed and ready for queries</div>
              </div>
              <button
                style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#334155', fontSize:12, display:'flex', alignItems:'center', gap:4 }}
                onClick={() => setPage?.('chat')}
              >
                Go to Chat →
              </button>
            </div>

            {/* stats */}
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1,
              border:'1px solid rgba(16,185,129,0.2)', borderRadius:'0 0 14px 14px',
              overflow:'hidden'
            }}>
              <Stat label="Files"   value={result.files_processed} icon={<Icon d={FILE_D}  size={14}/>} />
              <Stat label="Chunks"  value={result.chunks_created}  icon={<Icon d={LINES_D} size={14}/>} />
              <Stat label="Vectors" value={result.index_size}      icon={<Icon d={DB_D}    size={14}/>} />
            </div>
          </div>
        )}

        {/* ── ERROR ─────────────────────────────── */}
        {status === 'error' && (
          <div className="section-card fade-in" style={{ padding:'20px 24px', borderColor:'rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.04)' }}>
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f87171', flexShrink:0, marginTop:2 }}>
                <Icon d={WARN_D} size={16} sw={2} />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fca5a5', marginBottom:6 }}>Sync Failed</div>
                <div style={{ fontSize:13, color:'rgba(252,165,165,0.6)', lineHeight:1.6 }}>{error}</div>
                <div style={{ marginTop:12, fontSize:12, color:'#475569' }}>
                  Common causes:
                  <ul style={{ marginTop:4, paddingLeft:16, color:'#334155', lineHeight:2 }}>
                    <li>Folder ID is missing or incorrect</li>
                    <li>Service account lacks read access to the folder</li>
                    <li>Backend server is not running</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setStatus('idle')}
                style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#475569', flexShrink:0 }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ── IDLE EMPTY STATE ──────────────────── */}
        {status === 'idle' && (
          <div className="section-card fade-in" style={{ padding:'32px', textAlign:'center' }}>
            <div style={{
              width:56, height:56, borderRadius:16, margin:'0 auto 16px',
              background:'#0a0e1a', border:'1px solid #1e293b',
              display:'flex', alignItems:'center', justifyContent:'center', color:'#334155'
            }}>
              <Icon d={CLOUD_D} size={24} sw={1.5} />
            </div>
            <div style={{ fontSize:15, fontWeight:600, color:'#475569', marginBottom:6 }}>No documents synced yet</div>
            <div style={{ fontSize:13, color:'#334155', maxWidth:320, margin:'0 auto', lineHeight:1.6 }}>
              Enter your Google Drive folder ID above and click Sync to import and index your documents.
            </div>

            {/* quick tip */}
            <div style={{
              marginTop:20, padding:'12px 18px', background:'rgba(59,130,246,0.05)',
              border:'1px solid rgba(59,130,246,0.1)', borderRadius:10,
              display:'inline-flex', alignItems:'center', gap:8, fontSize:12, color:'#475569'
            }}>
              <Icon d={LIGHTNING_D} size={13} />
              <span>Supports <strong style={{color:'#64748b'}}>PDF, DOCX, TXT</strong> — max 50MB per file</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
