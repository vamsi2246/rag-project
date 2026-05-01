// SyncPage.jsx — Google Drive sync interface

import { useState } from 'react';
import { syncDrive } from '../api';

// Icon components (inline SVG to keep zero-dependency)
function DriveIcon() {
  return (
    <svg viewBox="0 0 87.3 78" className="w-6 h-6" aria-hidden="true">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a7.3 7.3 0 003.3 3.3z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L.95 50.55a7.3 7.3 0 000 7.3H27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.35 57.9a7.3 7.3 0 000-7.3H59.8L73.55 76.8z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2A7.26 7.26 0 0054.1 0H33.2a7.26 7.26 0 00-3.3.75z" fill="#00832d"/>
      <path d="M59.8 50.55H27.5L13.75 76.8c1.35.8 2.9 1.2 4.4 1.2h50.9c1.5 0 3.05-.45 4.4-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.45l-13.2-22.9c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 25.55H86.3a7.3 7.3 0 00-1.6-5.65z" fill="#ffba00"/>
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function SyncPage() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
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
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-5">
          <DriveIcon />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Sync Google Drive</h1>
        <p className="text-gray-400 max-w-md">
          Fetch your documents (PDF, TXT, DOCX) from a shared Google Drive folder,
          process them into embeddings, and store in the vector database.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        {/* Optional folder ID input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Folder ID <span className="text-gray-600">(optional — uses .env default)</span>
          </label>
          <input
            type="text"
            value={folderId}
            onChange={e => setFolderId(e.target.value)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
          />
          <p className="mt-2 text-xs text-gray-600">
            Found in the Drive folder URL: drive.google.com/drive/folders/<span className="text-gray-500">THIS_PART</span>
          </p>
        </div>

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={status === 'loading'}
          className="relative w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-900/30"
        >
          {status === 'loading' ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Syncing Documents…
            </>
          ) : (
            <>
              <DriveIcon />
              Sync Google Drive
            </>
          )}
        </button>

        {/* Success */}
        {status === 'success' && result && (
          <div className="mt-6 p-5 bg-green-950/40 border border-green-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon />
              <span className="text-green-400 font-semibold">Sync Successful!</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Files', value: result.files_processed },
                { label: 'Chunks', value: result.chunks_created },
                { label: 'Vectors', value: result.index_size },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-800/60 rounded-lg py-3">
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-green-500/80 text-center">
              You can now go to Chat and ask questions about your documents.
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start gap-3">
            <AlertIcon />
            <div>
              <div className="text-red-400 font-semibold text-sm mb-1">Sync Failed</div>
              <div className="text-red-300/70 text-xs">{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-10 w-full max-w-lg">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">How it works</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: '1', label: 'Fetch', desc: 'Downloads files from Drive' },
            { step: '2', label: 'Extract', desc: 'Parses PDF, DOCX, TXT' },
            { step: '3', label: 'Chunk', desc: 'Splits into 500-word chunks' },
            { step: '4', label: 'Embed', desc: 'Stores in FAISS index' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center mx-auto mb-2">
                {step}
              </div>
              <div className="text-xs font-semibold text-gray-300 mb-1">{label}</div>
              <div className="text-xs text-gray-600">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
