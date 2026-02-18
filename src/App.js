// App.js — Main application shell

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { STAFF, SECTIONS, QUICK_REPLIES, dateKey, timeNow } from './config';
import { loadData, saveData } from './storage';
import { generateResponse, parseStock, detectSection, detectLocation } from './engine';
import LogBook from './LogBook';

// ─── Styles ──────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }
  textarea:focus, button:focus, select:focus { outline: none; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: #c5c5c5; border-radius: 4px; }
  body { overscroll-behavior: none; }
`;

// ─── Bubble ──────────────────────────────────────────────────────────────────
function Bubble({ message }) {
  const isUser = message.sender === 'user';
  const bgMap = { alert: '#FEF3C7', 'stock-update': '#D1FAE5', 'stock-report': '#DBEAFE', transfer: '#EDE9FE' };
  const bg = isUser ? '#DCF8C6' : (bgMap[message.type] || '#fff');
  const fmt = t => t.replace(/\*([^*]+)\*/g, '<strong>$1</strong>').replace(/_([^_]+)_/g, '<em>$1</em>').replace(/\n/g, '<br/>');

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', padding: '2px 12px', animation: 'slideIn .2s ease' }}>
      <div style={{
        maxWidth: isUser ? '78%' : '88%', background: bg,
        borderRadius: isUser ? '14px 14px 0 14px' : '14px 14px 14px 0',
        padding: '8px 12px', boxShadow: '0 1px 2px rgba(0,0,0,.06)',
      }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.45, color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: fmt(message.text) }} />
        <div style={{ fontSize: 10, color: '#8696A0', textAlign: 'right', marginTop: 3 }}>
          {message.time}
          {isUser && <span style={{ marginLeft: 4, color: '#53BDEB' }}>✓✓</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Template Modal ──────────────────────────────────────────────────────────
function TemplateModal({ open, onClose, onSelect }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '18px 18px 0 0', padding: 20, width: '100%', maxWidth: 500, maxHeight: '70vh', overflowY: 'auto', animation: 'slideUp .3s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#064E3B' }}>📋 Stock Templates</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px' }}>Tap section → fill quantities → send!</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Object.entries(SECTIONS).map(([name, sec]) => (
            <button key={name} onClick={() => onSelect(name, sec)} style={{
              background: '#F0FDF4', border: '1px solid #E5E7EB', borderRadius: 12,
              padding: '12px 10px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .15s',
            }} onMouseOver={e => { e.currentTarget.style.background = '#D1FAE5'; }}
               onMouseOut={e => { e.currentTarget.style.background = '#F0FDF4'; }}>
              <div style={{ fontSize: 22, marginBottom: 2 }}>{sec.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{name}</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>{sec.items.length} items</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #064E3B, #047857)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif", padding: 20,
    }}>
      <div style={{ animation: 'fadeIn .5s ease', textAlign: 'center', maxWidth: 440, width: '100%' }}>
        <div style={{ fontSize: 52, marginBottom: 4 }}>🍛</div>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: -0.7, margin: 0 }}>Sizzle n Sambar</h1>
        <p style={{ color: '#A7F3D0', fontSize: 13, margin: '2px 0 6px' }}>Daily Stock Tracker</p>
        <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 8, padding: '5px 14px', display: 'inline-block', marginBottom: 24 }}>
          <span style={{ color: '#D1FAE5', fontSize: 12 }}>📍 Nedlands & Vic Park</span>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#064E3B', margin: '0 0 2px' }}>Select Your Name</h2>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 18px' }}>Your daily logs are linked to your account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {STAFF.map((s, i) => (
              <button key={s.id} onClick={() => onLogin(s)} style={{
                display: 'flex', alignItems: 'center', gap: 12, background: '#F0FDF4',
                border: '2px solid transparent', borderRadius: 14, padding: '12px 16px',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                animation: `fadeIn ${0.3 + i * 0.05}s ease`, transition: 'all .2s',
              }} onMouseOver={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.background = '#D1FAE5'; }}
                 onMouseOut={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#F0FDF4'; }}>
                <span style={{ fontSize: 28 }}>{s.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{s.sections.join(' · ')}</div>
                </div>
                <span style={{ color: '#10B981', fontSize: 18 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [stock, setStock] = useState({});
  const [logs, setLogs] = useState({});
  const [xfers, setXfers] = useState([]);
  const [showTpl, setShowTpl] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const endRef = useRef(null);
  const inRef = useRef(null);

  // Load persisted data on mount
  useEffect(() => {
    const savedLogs = loadData('logs', {});
    const savedXfers = loadData('xfers', []);
    setLogs(savedLogs);
    setXfers(savedXfers);

    // Rebuild latest stock snapshot from logs
    const sd = {};
    for (const d of Object.keys(savedLogs).sort().reverse()) {
      for (const log of savedLogs[d]) {
        const loc = log.location || 'Vic Park';
        const sec = log.section || 'General';
        if (!sd[loc]) sd[loc] = {};
        if (!sd[loc][sec]) sd[loc][sec] = log.items || [];
      }
    }
    if (Object.keys(sd).length) setStock(sd);

    // Restore last user if they didn't log out
    const lastUser = loadData('lastUser', null);
    if (lastUser) setUser(lastUser);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = useCallback((text) => {
    if (!text.trim() || !user) return;
    const userMsg = { id: Date.now(), text: text.trim(), sender: 'user', time: timeNow(), type: 'user' };
    const resp = generateResponse(text.trim(), stock, user, logs);
    const botMsg = { id: Date.now() + 1, text: resp.text, sender: 'bot', time: timeNow(), type: resp.type };
    setMsgs(prev => [...prev, userMsg, botMsg]);
    setInput('');
    setShowQR(false);

    // Persist stock update
    if (resp.isStockUpdate && resp.stockPayload) {
      const { section, location, items } = resp.stockPayload;
      const entry = { staffId: user.id, staffName: user.name, section, location, items, time: timeNow(), timestamp: Date.now() };
      const today = dateKey();
      const newLogs = { ...logs, [today]: [...(logs[today] || []), entry] };
      setLogs(newLogs);
      saveData('logs', newLogs);
      setStock(prev => ({ ...prev, [location]: { ...(prev[location] || {}), [section]: items } }));
    }

    // Persist transfer
    if (resp.isTransfer && resp.transferData) {
      const t = { staffId: user.id, staffName: user.name, date: dateKey(), time: timeNow(), toLocation: resp.transferData.toLocation, items: resp.transferData.items, timestamp: Date.now() };
      const newXfers = [...xfers, t];
      setXfers(newXfers);
      saveData('xfers', newXfers);
    }
  }, [user, stock, logs, xfers]);

  const handleLogin = (staff) => {
    setUser(staff);
    saveData('lastUser', staff);
    const todayLogs = logs[dateKey()] || [];
    setMsgs([{
      id: 1,
      text: `Welcome, *${staff.name}*! 👋\n\nYour sections: ${staff.sections.map(x => `📌 ${x}`).join(', ')}\n\n📅 *Today:* ${todayLogs.length} update(s) logged\n\n📋 Paste stock to log it\n📒 Tap *Log Book* for history\n⚠️ "Low stock" for alerts\n📦 "Orders" for schedule\n\n👇 Tap a quick reply to start!`,
      sender: 'bot', time: timeNow(), type: 'assistant',
    }]);
  };

  const handleLogout = () => {
    setUser(null);
    setMsgs([]);
    saveData('lastUser', null);
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  // No async loading needed with localStorage — it's synchronous

  // ─── Login Screen ────────────────────────────────────────────────────────
  if (!user) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <LoginScreen onLogin={handleLogin} />
    </>
  );

  // ─── Log Book ────────────────────────────────────────────────────────────
  if (showLog) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <LogBook logs={logs} transfers={xfers} onClose={() => setShowLog(false)} currentUser={user} />
    </>
  );

  // ─── Chat Interface ──────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif", background: '#ECE5DD' }}>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <div style={{ background: '#064E3B', color: '#fff', padding: '10px 14px', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>←</button>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🍛</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>SnS Stock Agent</div>
            <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.avatar} {user.name} · {(logs[dateKey()] || []).length} logs today
            </div>
          </div>
          <button onClick={() => setShowLog(true)} style={{
            background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff',
            borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            📒 Log Book
            {(logs[dateKey()] || []).length > 0 && (
              <span style={{ background: '#10B981', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>
                {(logs[dateKey()] || []).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <span style={{ background: 'rgba(255,255,255,.9)', padding: '4px 14px', borderRadius: 8, fontSize: 11.5, color: '#8696A0', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        {msgs.map(m => <Bubble key={m.id} message={m} />)}

        {showQR && msgs.length <= 2 && (
          <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', animation: 'slideIn .4s ease' }}>
            {QUICK_REPLIES.map(q => (
              <button key={q.text} onClick={() => send(q.text)} style={{
                background: '#fff', border: '1px solid #10B981', borderRadius: 20,
                padding: '7px 14px', fontSize: 12, color: '#064E3B', cursor: 'pointer',
                fontWeight: 600, fontFamily: 'inherit', transition: 'all .15s',
              }} onMouseOver={e => { e.currentTarget.style.background = '#D1FAE5'; }}
                 onMouseOut={e => { e.currentTarget.style.background = '#fff'; }}>
                {q.label}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ background: '#F0F2F5', padding: '8px 10px', display: 'flex', alignItems: 'flex-end', gap: 8, flexShrink: 0, borderTop: '1px solid #E5E7EB' }}>
        <button onClick={() => setShowTpl(true)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#064E3B', padding: '6px 2px', flexShrink: 0, lineHeight: 1 }}>📋</button>
        <div style={{ flex: 1, background: '#fff', borderRadius: 20, padding: '0 14px', display: 'flex', alignItems: 'flex-end', border: '1px solid #E5E7EB' }}>
          <textarea
            ref={inRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Paste stock list or ask a question..."
            rows={1}
            style={{
              flex: 1, border: 'none', resize: 'none', fontSize: 14,
              padding: '10px 0', lineHeight: 1.4, maxHeight: 120,
              fontFamily: 'inherit', background: 'transparent', color: '#111',
              overflowY: input.split('\n').length > 4 ? 'auto' : 'hidden',
              height: Math.min(120, Math.max(38, input.split('\n').length * 22)),
            }}
          />
        </div>
        <button onClick={() => send(input)} style={{
          background: input.trim() ? '#10B981' : '#CCC',
          border: 'none', borderRadius: '50%', width: 42, height: 42,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0,
          fontSize: 18, color: '#fff',
          boxShadow: input.trim() ? '0 2px 8px rgba(16,185,129,.3)' : 'none',
        }}>➤</button>
      </div>

      <TemplateModal
        open={showTpl}
        onClose={() => setShowTpl(false)}
        onSelect={(name, sec) => {
          setInput(`${name} update:\n` + sec.items.map(i => `${i}: `).join('\n'));
          setShowTpl(false);
          setTimeout(() => inRef.current?.focus(), 100);
        }}
      />
    </div>
  );
}
