// ChatPage.jsx — Premium ChatGPT-style chat interface

import { useState, useRef, useEffect, useCallback } from 'react';
import { queryRAG } from '../api';

/* ── Icons ────────────────────────────────────── */
function SendIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* ── Avatars ──────────────────────────────────── */
function AIAvatar() {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
      <BrainIcon />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center border border-white/10">
      <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
}

/* ── Typing indicator ─────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-0.5">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

/* ── Source citations ─────────────────────────── */
function Sources({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06]">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-400 transition-colors font-medium"
      >
        <ChevronIcon open={open} />
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {sources.length} source{sources.length > 1 ? 's' : ''} retrieved
      </button>

      {open && (
        <div className="mt-2.5 space-y-2">
          {sources.map((src, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-500 leading-relaxed"
            >
              <span className="text-slate-700 font-mono mr-2 text-[10px]">#{i + 1}</span>
              {src.text.length > 220 ? src.text.slice(0, 220) + '…' : src.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Message bubble ───────────────────────────── */
function Message({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 msg-anim ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isUser ? <UserAvatar /> : <AIAvatar />}
      <div className={`max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-md shadow-lg shadow-blue-900/20'
              : 'glass text-slate-200 rounded-2xl rounded-tl-md'
          }`}
        >
          {msg.content}
        </div>
        {!isUser && <Sources sources={msg.sources} />}
      </div>
    </div>
  );
}

/* ── Empty / welcome state ────────────────────── */
function WelcomeState({ onSuggestion }) {
  const suggestions = [
    { q: 'What are the main topics covered?',       icon: '🔍' },
    { q: 'Summarize the key findings.',              icon: '📋' },
    { q: 'What are the most important conclusions?', icon: '💡' },
    { q: 'List all action items mentioned.',         icon: '✅' },
  ];

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      {/* icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center shadow-2xl">
          <svg className="w-9 h-9 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        {/* glow */}
        <div className="absolute inset-0 rounded-3xl bg-blue-500/10 blur-xl scale-150 -z-10" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
        Ask your documents
      </h2>
      <p className="text-slate-500 text-sm mb-10 max-w-xs leading-relaxed">
        Sync your Google Drive first, then start a conversation with your documents.
      </p>

      {/* suggestion chips */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {suggestions.map(({ q, icon }, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(q)}
            className="suggestion-chip rounded-xl p-3.5 text-left"
          >
            <span className="text-base mb-1.5 block">{icon}</span>
            <span className="text-xs text-slate-400 leading-snug">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main ChatPage ────────────────────────────── */
export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const textareaRef = useRef(null);

  // auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // auto-grow textarea
  const autoGrow = useCallback(el => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, []);

  const sendMessage = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const data = await queryRAG(q);
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, sources: data.sources }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error: ${err.message}\n\nMake sure you've synced your documents first via the Sync Drive page.`,
        sources: [],
      }]);
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
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-[#080b12]/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center">
            <BrainIcon />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">Document Chat</h1>
            <p className="text-[10px] text-slate-600 mt-0.5">FAISS · sentence-transformers · GPT-4o-mini</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            New chat
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <WelcomeState onSuggestion={q => sendMessage(q)} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}

            {/* typing indicator */}
            {loading && (
              <div className="flex gap-3 msg-anim">
                <AIAvatar />
                <div className="glass rounded-2xl rounded-tl-md px-4 py-3.5">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-6 pb-6 pt-3">
        <div className="max-w-3xl mx-auto">
          <div className="chat-input-area flex items-end gap-3 px-4 py-3">
            <textarea
              ref={el => { inputRef.current = el; textareaRef.current = el; }}
              rows={1}
              value={input}
              onChange={e => { setInput(e.target.value); autoGrow(e.target); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents…"
              disabled={loading}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-200 placeholder-slate-600 leading-relaxed py-0.5 max-h-40 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl btn-gradient flex items-center justify-center text-white"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-700 mt-2.5">
            <kbd className="font-mono bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded text-[9px]">Enter</kbd> to send &nbsp;·&nbsp;
            <kbd className="font-mono bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded text-[9px]">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
