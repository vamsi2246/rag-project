// ChatPage.jsx — Dashboard-style chat interface

import { useState, useRef, useEffect, useCallback } from 'react';
import { queryRAG } from '../api';

/* ── Inline SVG ─────────────────────────────────── */
const Icon = ({ d, size = 16, sw = 1.8 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const SEND_D  = "M12 19l9 2-9-18-9 18 9-2zm0 0v-8";
const USER_D  = "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z";
const BRAIN_D = "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z";
const DOC_D   = "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";
const TRASH_D = "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16";
const CHEV_D  = "M9 5l7 7-7 7";
const WARN_D  = "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z";

/* ── Spinner ────────────────────────────────────── */
function Spinner({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation:'spin 0.8s linear infinite', flexShrink:0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2"/>
      <path fill="currentColor" opacity="0.85" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );
}

/* ── Typing dots ────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display:'flex', gap:4, padding:'2px 0', alignItems:'center' }}>
      <span className="dot"/><span className="dot"/><span className="dot"/>
    </div>
  );
}

/* ── Avatars ────────────────────────────────────── */
function AIAvatar() {
  return (
    <div style={{
      width:30, height:30, borderRadius:9, flexShrink:0,
      background:'linear-gradient(135deg,#1d4ed8,#6d28d9)',
      display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:'0 2px 8px rgba(59,130,246,0.25)'
    }}>
      <Icon d={BRAIN_D} size={14} sw={2} />
    </div>
  );
}

function UserAvatar() {
  return (
    <div style={{
      width:30, height:30, borderRadius:9, flexShrink:0,
      background:'#1e293b', border:'1px solid #334155',
      display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b'
    }}>
      <Icon d={USER_D} size={14} sw={1.8} />
    </div>
  );
}

/* ── Source citations ────────────────────────────── */
function Sources({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div style={{ marginTop:8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background:'none', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', gap:5,
          fontSize:11, color:'#475569', padding:0,
          transition:'color 0.15s'
        }}
      >
        <span style={{ transform:`rotate(${open?90:0}deg)`, transition:'transform 0.2s', display:'flex' }}>
          <Icon d={CHEV_D} size={11} sw={2.5} />
        </span>
        <Icon d={DOC_D} size={11} sw={2} />
        {sources.length} source{sources.length>1?'s':''} retrieved
      </button>
      {open && (
        <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
          {sources.map((s, i) => (
            <div key={i} style={{
              padding:'8px 12px', background:'#0a0e1a', border:'1px solid #1e293b',
              borderRadius:8, fontSize:11, color:'#475569', lineHeight:1.6
            }}>
              <span style={{ color:'#1e293b', fontFamily:'monospace', marginRight:6 }}>#{i+1}</span>
              {s.text.length > 240 ? s.text.slice(0,240)+'…' : s.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Single message ─────────────────────────────── */
function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className="msg-in" style={{
      display:'flex', gap:12,
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems:'flex-start'
    }}>
      {isUser ? <UserAvatar/> : <AIAvatar/>}
      <div style={{ maxWidth:'72%', display:'flex', flexDirection:'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={{
          padding:'10px 14px',
          fontSize:13.5, lineHeight:1.7,
          whiteSpace:'pre-wrap', wordBreak:'break-word',
          ...(isUser ? {
            background:'linear-gradient(135deg,#1d4ed8,#5b21b6)',
            color:'#fff',
            borderRadius:'14px 14px 4px 14px',
            boxShadow:'0 2px 12px rgba(59,130,246,0.2)'
          } : {
            background:'#0c1120',
            border:'1px solid #1e293b',
            color:'#cbd5e1',
            borderRadius:'14px 14px 14px 4px',
          })
        }}>
          {msg.content}
        </div>
        {!isUser && <Sources sources={msg.sources}/>}
      </div>
    </div>
  );
}

/* ── Welcome / empty state ──────────────────────── */
function Welcome({ onSuggest }) {
  const chips = [
    { q:'What are the main topics in my documents?', e:'🔍' },
    { q:'Summarize the key findings.',                e:'📋' },
    { q:'List the most important conclusions.',       e:'💡' },
    { q:'What action items are mentioned?',           e:'✅' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'32px 24px', textAlign:'center' }}>
      <div style={{
        width:60, height:60, borderRadius:18, marginBottom:20,
        background:'#0c1120', border:'1px solid #1e293b',
        display:'flex', alignItems:'center', justifyContent:'center', color:'#334155'
      }}>
        <Icon d={BRAIN_D} size={26} sw={1.5} />
      </div>
      <div style={{ fontSize:17, fontWeight:700, color:'#94a3b8', marginBottom:6, letterSpacing:'-0.02em' }}>
        Ask about your documents
      </div>
      <div style={{ fontSize:13, color:'#334155', maxWidth:300, lineHeight:1.7, marginBottom:24 }}>
        Sync your Google Drive first, then start asking questions about your knowledge base.
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, width:'100%', maxWidth:440 }}>
        {chips.map(({ q, e }, i) => (
          <button key={i} className="chip" onClick={() => onSuggest(q)}>
            <div style={{ fontSize:18, marginBottom:6 }}>{e}</div>
            <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>{q}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════ */
export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const textRef    = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const autoGrow = useCallback(el => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, []);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput('');
    if (textRef.current) textRef.current.style.height = 'auto';
    setMessages(p => [...p, { role:'user', content:q }]);
    setLoading(true);
    try {
      const d = await queryRAG(q);
      setMessages(p => [...p, { role:'assistant', content:d.answer, sources:d.sources }]);
    } catch (err) {
      setMessages(p => [...p, {
        role:'assistant',
        content:`I couldn't process that request.\n\n**Reason:** ${err.message}\n\nMake sure your documents are synced first.`,
        sources:[]
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── HEADER ──────────────────────────────── */}
      <div style={{
        padding:'20px 28px 18px',
        borderBottom:'1px solid #111827',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:34, height:34, borderRadius:10,
            background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#60a5fa'
          }}>
            <Icon d={BRAIN_D} size={16} sw={1.8} />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9', letterSpacing:'-0.02em' }}>Document Chat</div>
            <div style={{ fontSize:11, color:'#334155', marginTop:1 }}>FAISS · sentence-transformers · GPT-4o-mini</div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            style={{
              background:'none', border:'1px solid #1e293b', borderRadius:8,
              cursor:'pointer', color:'#475569', display:'flex', alignItems:'center',
              gap:6, padding:'6px 12px', fontSize:12, transition:'all 0.15s'
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor='#334155'; e.currentTarget.style.color='#94a3b8'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor='#1e293b'; e.currentTarget.style.color='#475569'; }}
          >
            <Icon d={TRASH_D} size={13} sw={1.8} /> New chat
          </button>
        )}
      </div>

      {/* ── MESSAGES ────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
        {messages.length === 0 ? (
          <Welcome onSuggest={q => send(q)} />
        ) : (
          <div style={{ maxWidth:760, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {loading && (
              <div className="msg-in" style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <AIAvatar/>
                <div style={{
                  padding:'12px 16px', background:'#0c1120', border:'1px solid #1e293b',
                  borderRadius:'14px 14px 14px 4px'
                }}>
                  <TypingDots/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        )}
      </div>

      {/* ── INPUT ───────────────────────────────── */}
      <div style={{ flexShrink:0, padding:'16px 28px 20px', borderTop:'1px solid #111827', background:'#07090f' }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          <div className="chat-input-wrap" style={{ display:'flex', alignItems:'flex-end', padding:'10px 12px', gap:8 }}>
            <textarea
              ref={el => { inputRef.current=el; textRef.current=el; }}
              rows={1}
              value={input}
              onChange={e => { setInput(e.target.value); autoGrow(e.target); }}
              onKeyDown={onKey}
              placeholder="Ask a question about your documents…"
              disabled={loading}
              style={{
                flex:1, background:'transparent', border:'none', outline:'none',
                resize:'none', fontSize:13.5, color:'#e2e8f0', fontFamily:'inherit',
                lineHeight:1.6, maxHeight:180, padding:'2px 4px',
                '::placeholder': { color:'#334155' }
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width:36, height:36, borderRadius:9, border:'none', cursor:'pointer',
                background: !input.trim() || loading ? '#1e293b' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
                color: !input.trim() || loading ? '#334155' : 'white',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, transition:'all 0.2s',
                boxShadow: !input.trim() || loading ? 'none' : '0 2px 12px rgba(59,130,246,0.3)'
              }}
            >
              {loading ? <Spinner size={15}/> : <Icon d={SEND_D} size={15} sw={2}/>}
            </button>
          </div>
          <div style={{ textAlign:'center', fontSize:10, color:'#1e293b', marginTop:8 }}>
            Press <kbd style={{ background:'#111827', border:'1px solid #1e293b', borderRadius:4, padding:'1px 5px', fontSize:9 }}>Enter</kbd> to send · <kbd style={{ background:'#111827', border:'1px solid #1e293b', borderRadius:4, padding:'1px 5px', fontSize:9 }}>Shift+Enter</kbd> for new line
          </div>
        </div>
      </div>
    </div>
  );
}
