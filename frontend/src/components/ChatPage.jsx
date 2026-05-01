// ChatPage.jsx — ChatGPT-style chat interface

import { useState, useRef, useEffect } from 'react';
import { queryRAG } from '../api';

/* ── Icons ─────────────────────────────────────── */
function SendIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function BotIcon() {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
      AI
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-sm font-bold">
      U
    </div>
  );
}

/* ── Typing indicator ───────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

/* ── Source citations ───────────────────────────── */
function Sources({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-3 border-t border-gray-700/50 pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition"
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {sources.length} source{sources.length > 1 ? 's' : ''} retrieved
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {sources.map((src, i) => (
            <div key={i} className="bg-gray-800/60 rounded-lg p-3 text-xs text-gray-400 leading-relaxed border border-gray-700/40">
              <span className="text-gray-600 mr-2">#{i + 1}</span>
              {src.text.length > 200 ? src.text.slice(0, 200) + '…' : src.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Single message bubble ──────────────────────── */
function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 msg-anim ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isUser ? <UserAvatar /> : <BotIcon />}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-800 text-gray-200 rounded-tl-sm border border-gray-700/50'
          }`}
        >
          {msg.content}
        </div>
        {!isUser && msg.sources && <Sources sources={msg.sources} />}
      </div>
    </div>
  );
}

/* ── Empty state ────────────────────────────────── */
function EmptyState() {
  const suggestions = [
    'What are the main topics in the documents?',
    'Summarize the key findings.',
    'What does the document say about…?',
    'List the important points.',
  ];
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Ask about your documents</h2>
      <p className="text-gray-500 text-sm mb-8 max-w-sm">
        Sync your Google Drive first, then ask any question about the documents.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-400 text-left cursor-default hover:border-gray-700 hover:text-gray-300 transition"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ChatPage ──────────────────────────────── */
export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setError('');
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const data = await queryRAG(q);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ ${err.message}`,
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/60 backdrop-blur-sm">
        <div>
          <h1 className="text-base font-semibold text-white">Document Chat</h1>
          <p className="text-xs text-gray-500 mt-0.5">Powered by FAISS + GPT-4o-mini</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-800 hover:border-gray-700 transition"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg, i) => <Message key={i} msg={msg} />)
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 msg-anim">
            <BotIcon />
            <div className="bg-gray-800 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Error bar ── */}
      {error && (
        <div className="mx-4 mb-3 px-4 py-3 bg-red-950/50 border border-red-800/50 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Input area ── */}
      <div className="px-4 pb-5 pt-2">
        <div className="flex items-end gap-3 bg-gray-900 border border-gray-700 rounded-2xl p-3 focus-within:border-blue-500/60 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-grow
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents…"
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-200 placeholder-gray-600 max-h-40 py-1 leading-relaxed"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <SendIcon className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-gray-700 mt-2">
          Press <kbd className="bg-gray-800 px-1 rounded">Enter</kbd> to send,{' '}
          <kbd className="bg-gray-800 px-1 rounded">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
