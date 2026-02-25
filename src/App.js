// App.js — Main application shell
// Features: Branch selector, threshold settings, log book, chat

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_STAFF, DEFAULT_SECTIONS, DEFAULT_LOCATIONS, QUICK_REPLIES, DEFAULT_THRESHOLDS, dateKey, timeNow } from './config';
import { loadData, saveData, onDataChange } from './storage';
import { generateResponse, parseStock, detectSection, detectLocation } from './engine';
import LogBook from './LogBook';
import ManageScreen from './ManageScreen';

const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  textarea:focus, button:focus, select:focus, input:focus { outline: none; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: #c5c5c5; border-radius: 4px; }
  body { overscroll-behavior: none; }
  input[type=number]::-webkit-inner-spin-button { opacity: 1; }
`;

// ─── Bubble ──────────────────────────────────────────────────────────────────
function Bubble({ message }) {
  const isUser = message.sender === 'user';
  const bgMap = { alert: '#FEF3C7', 'stock-update': '#D1FAE5', 'stock-report': '#DBEAFE', transfer: '#EDE9FE' };
  const bg = isUser ? '#DCF8C6' : (bgMap[message.type] || '#fff');
  const fmt = t => t.replace(/\*([^*]+)\*/g, '<strong>$1</strong>').replace(/_([^_]+)_/g, '<em>$1</em>').replace(/\n/g, '<br/>');
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', padding: '2px 12px', animation: 'slideIn .2s ease' }}>
      <div style={{ maxWidth: isUser ? '78%' : '88%', background: bg, borderRadius: isUser ? '14px 14px 0 14px' : '14px 14px 14px 0', padding: '8px 12px', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.45, color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: fmt(message.text) }} />
        <div style={{ fontSize: 10, color: '#8696A0', textAlign: 'right', marginTop: 3 }}>{message.time}{isUser && <span style={{ marginLeft: 4, color: '#53BDEB' }}>✓✓</span>}</div>
      </div>
    </div>
  );
}

// ─── Template Modal ──────────────────────────────────────────────────────────
function TemplateModal({ open, onClose, onSelect, activeBranch, sections }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '18px 18px 0 0', padding: 20, width: '100%', maxWidth: 500, maxHeight: '70vh', overflowY: 'auto', animation: 'slideUp .3s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#064E3B' }}>📋 Stock Templates</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px' }}>Logging to: <strong>📍 {activeBranch}</strong>. Tap section → fill quantities → send!</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Object.entries(sections).map(([name, sec]) => (
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

// ─── Threshold Settings Modal ────────────────────────────────────────────────
function ThresholdSettings({ open, onClose, thresholds, onSave, sections }) {
  const [editSec, setEditSec] = useState(null);
  const [local, setLocal] = useState({});

  useEffect(() => { if (open) setLocal({ ...thresholds }); }, [open, thresholds]);

  if (!open) return null;

  const updateItem = (name, val) => {
    setLocal(prev => ({ ...prev, [name]: Math.max(0, parseInt(val) || 0) }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'fadeIn .25s ease', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#064E3B' }}>⚙️ Threshold Settings</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>Set minimum stock levels per item. Items at or below this trigger alerts.</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button>
          </div>
          {/* Default threshold */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '8px 12px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#064E3B', flex: 1 }}>Global Default Threshold</span>
            <input type="number" min={0} value={local.default || 2} onChange={e => updateItem('default', e.target.value)}
              style={{ width: 60, padding: '4px 8px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, fontWeight: 700, textAlign: 'center', fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '10px 20px 0', flexShrink: 0 }}>
          {Object.entries(sections).map(([k, v]) => (
            <button key={k} onClick={() => setEditSec(k)} style={{
              flexShrink: 0, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: editSec === k ? '2px solid #10B981' : '1px solid #E5E7EB',
              background: editSec === k ? '#D1FAE5' : '#fff', color: editSec === k ? '#064E3B' : '#6B7280',
            }}>{v.icon} {k}</button>
          ))}
        </div>

        {/* Items for selected section */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
          {!editSec && <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 13 }}>👆 Select a section above to edit item thresholds</div>}
          {editSec && sections[editSec] && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sections[editSec].items.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{item}</span>
                  <input type="number" min={0}
                    value={local[item] !== undefined ? local[item] : (local.default || 2)}
                    onChange={e => updateItem(item, e.target.value)}
                    style={{ width: 60, padding: '4px 8px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, fontWeight: 600, textAlign: 'center', fontFamily: 'inherit' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
          <button onClick={() => { onSave(local); onClose(); }} style={{
            width: '100%', padding: '12px', background: '#064E3B', color: '#fff', border: 'none',
            borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>💾 Save Thresholds</button>
        </div>
      </div>
    </div>
  );
}

// ─── Branch Selector (shown after login) ─────────────────────────────────────
function BranchSelector({ onSelect, userName, locations }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'linear-gradient(145deg, #064E3B, #047857)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif", padding: 20, zIndex: 300,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 360, width: '100%', animation: 'fadeIn .4s ease' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>📍</div>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Select Branch</h2>
        <p style={{ color: '#A7F3D0', fontSize: 13, margin: '0 0 24px' }}>Hi {userName}! Which location are you logging stock for?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {locations.map((loc, i) => (
            <button key={loc} onClick={() => onSelect(loc)} style={{
              background: '#fff', border: '2px solid transparent', borderRadius: 16,
              padding: '18px 20px', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'inherit', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 14,
            }} onMouseOver={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.transform = 'scale(1.02)'; }}
               onMouseOut={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: i % 2 === 0 ? '#DBEAFE' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {'📍'}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#111' }}>{loc}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                </div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#10B981', fontSize: 20 }}>→</span>
            </button>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 16 }}>You can switch branches anytime from the header</p>
      </div>
    </div>
  );
}

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, staffList }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(145deg, #064E3B, #047857)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', sans-serif",
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      {/* Compact sticky header */}
      <div style={{
        textAlign: 'center', padding: '24px 20px 16px', flexShrink: 0,
      }}>
        <div style={{ fontSize: 44, marginBottom: 2 }}>🍛</div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>Sizzle n Sambar</h1>
        <p style={{ color: '#A7F3D0', fontSize: 12, margin: '2px 0 0' }}>Daily Stock Tracker</p>
      </div>

      {/* Scrollable staff list card */}
      <div style={{
        flex: 1, padding: '0 16px 24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px 18px',
          boxShadow: '0 16px 60px rgba(0,0,0,.2)',
          width: '100%', maxWidth: 440,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#064E3B', margin: '0 0 2px', textAlign: 'center' }}>Select Your Name</h2>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 14px', textAlign: 'center' }}>Your daily logs are linked to your account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {staffList.map((s, i) => (
              <button key={s.id} onClick={() => onLogin(s)} style={{
                display: 'flex', alignItems: 'center', gap: 12, background: '#F0FDF4',
                border: '2px solid transparent', borderRadius: 14, padding: '11px 14px',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                animation: `fadeIn ${0.2 + i * 0.04}s ease`, transition: 'all .15s',
              }} onMouseOver={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.background = '#D1FAE5'; }}
                 onMouseOut={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#F0FDF4'; }}>
                <span style={{ fontSize: 26 }}>{s.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sections.join(' · ')}</div>
                </div>
                <span style={{ color: '#10B981', fontSize: 18, flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, marginTop: 14, textAlign: 'center' }}>
          {staffList.length} staff members
        </p>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [branch, setBranch] = useState(null);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [stock, setStock] = useState({});
  const [logs, setLogs] = useState({});
  const [xfers, setXfers] = useState([]);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [showTpl, setShowTpl] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showQR, setShowQR] = useState(true);

  // Dynamic config — loaded from Firebase, falls back to defaults
  const [dynStaff, setDynStaff] = useState(DEFAULT_STAFF);
  const [dynSections, setDynSections] = useState(DEFAULT_SECTIONS);
  const [dynLocations, setDynLocations] = useState(DEFAULT_LOCATIONS);

  const endRef = useRef(null);
  const inRef = useRef(null);

  // Load persisted data + subscribe to real-time updates from Firebase
  useEffect(() => {
    let mounted = true;
    const rebuildStock = (logsObj) => {
      const sd = {};
      for (const d of Object.keys(logsObj).sort().reverse()) {
        for (const log of logsObj[d]) {
          const loc = log.location || 'Vic Park';
          const sec = log.section || 'General';
          if (!sd[loc]) sd[loc] = {};
          if (!sd[loc][sec]) sd[loc][sec] = log.items || [];
        }
      }
      if (Object.keys(sd).length) setStock(sd);
    };

    (async () => {
      const [sL, sX, sT, sSt, sSe, sLo] = await Promise.all([
        loadData('logs', {}), loadData('xfers', []), loadData('thresholds', DEFAULT_THRESHOLDS),
        loadData('staff', DEFAULT_STAFF), loadData('sections', DEFAULT_SECTIONS), loadData('locations', DEFAULT_LOCATIONS),
      ]);
      if (!mounted) return;
      setLogs(sL); setXfers(sX); setThresholds(sT);
      setDynStaff(sSt); setDynSections(sSe); setDynLocations(sLo);
      rebuildStock(sL);
      const lastUser = await loadData('lastUser', null);
      const lastBranch = await loadData('lastBranch', null);
      if (mounted && lastUser) setUser(lastUser);
      if (mounted && lastBranch) setBranch(lastBranch);
    })();

    const unsub1 = onDataChange('logs', (v) => { if (mounted) { setLogs(v); rebuildStock(v); } });
    const unsub2 = onDataChange('xfers', (v) => { if (mounted) setXfers(v); });
    const unsub3 = onDataChange('thresholds', (v) => { if (mounted) setThresholds(v); });
    const unsub4 = onDataChange('staff', (v) => { if (mounted) setDynStaff(v); });
    const unsub5 = onDataChange('sections', (v) => { if (mounted) setDynSections(v); });
    const unsub6 = onDataChange('locations', (v) => { if (mounted) setDynLocations(v); });

    return () => { mounted = false; unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = useCallback((text) => {
    if (!text.trim() || !user || !branch) return;
    // Inject the active branch into the message for detection if no location mentioned
    const enriched = detectLocation(text) ? text : `${branch} ${text}`;
    const userMsg = { id: Date.now(), text: text.trim(), sender: 'user', time: timeNow(), type: 'user' };
    const resp = generateResponse(enriched, stock, user, logs, thresholds);
    const botMsg = { id: Date.now() + 1, text: resp.text, sender: 'bot', time: timeNow(), type: resp.type };
    setMsgs(prev => [...prev, userMsg, botMsg]);
    setInput('');
    setShowQR(false);

    if (resp.isStockUpdate && resp.stockPayload) {
      const { section, items } = resp.stockPayload;
      const location = resp.stockPayload.location || branch;
      const entry = { staffId: user.id, staffName: user.name, section, location, items, time: timeNow(), timestamp: Date.now() };
      const today = dateKey();
      const newLogs = { ...logs, [today]: [...(logs[today] || []), entry] };
      setLogs(newLogs);
      saveData('logs', newLogs);
      setStock(prev => ({ ...prev, [location]: { ...(prev[location] || {}), [section]: items } }));
    }

    if (resp.isTransfer && resp.transferData) {
      const t = { staffId: user.id, staffName: user.name, date: dateKey(), time: timeNow(), toLocation: resp.transferData.toLocation, items: resp.transferData.items, timestamp: Date.now() };
      const newXfers = [...xfers, t];
      setXfers(newXfers);
      saveData('xfers', newXfers);
    }
  }, [user, branch, stock, logs, xfers, thresholds]);

  const handleLogin = (staff) => {
    setUser(staff);
    saveData('lastUser', staff);
    setShowBranchPicker(true);
  };

  const handleBranchSelect = (loc) => {
    setBranch(loc);
    saveData('lastBranch', loc);
    setShowBranchPicker(false);
    const todayLogs = logs[dateKey()] || [];
    setMsgs([{
      id: 1,
      text: `Welcome, *${user.name}*! 👋\n\n📍 Branch: *${loc}*\nYour sections: ${user.sections.map(x => `📌 ${x}`).join(', ')}\n\n📅 *Today:* ${todayLogs.length} update(s) logged\n\n📋 Paste stock to log it\n📒 Tap *Log Book* for history\n⚙️ Tap *Settings* to adjust thresholds\n\nAll logs will be tagged to *${loc}*.\n👇 Tap a quick reply to start!`,
      sender: 'bot', time: timeNow(), type: 'assistant',
    }]);
  };

  const handleLogout = () => {
    setUser(null);
    setBranch(null);
    setMsgs([]);
    saveData('lastUser', null);
    saveData('lastBranch', null);
  };

  const handleSaveThresholds = (newTh) => {
    setThresholds(newTh);
    saveData('thresholds', newTh);
  };

  const handleManageSave = ({ locations, sections, staff }) => {
    setDynLocations(locations); saveData('locations', locations);
    setDynSections(sections); saveData('sections', sections);
    setDynStaff(staff); saveData('staff', staff);
  };

  // Login
  if (!user) return (<><style>{GLOBAL_CSS}</style><LoginScreen onLogin={handleLogin} staffList={dynStaff} /></>);

  // Branch picker
  if (showBranchPicker || !branch) return (<><style>{GLOBAL_CSS}</style><BranchSelector onSelect={handleBranchSelect} userName={user.name} locations={dynLocations} /></>);

  // Log Book
  if (showManage) return (<><style>{GLOBAL_CSS}</style><ManageScreen locations={dynLocations} sections={dynSections} staff={dynStaff} onSave={handleManageSave} onClose={() => setShowManage(false)} /></>);

  // Log Book
  if (showLog) return (<><style>{GLOBAL_CSS}</style><LogBook logs={logs} transfers={xfers} onClose={() => setShowLog(false)} currentUser={user} thresholds={thresholds} sections={dynSections} staff={dynStaff} locations={dynLocations} /></>);

  // Chat
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
            <div style={{ fontSize: 11, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
              {user.avatar} {user.name}
              <span style={{ margin: '0 2px' }}>·</span>
              {/* Tappable branch badge */}
              <button onClick={() => setShowBranchPicker(true)} style={{
                background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff',
                borderRadius: 6, padding: '1px 7px', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                📍{branch} ▾
              </button>
              <span style={{ margin: '0 2px' }}>·</span>
              {(logs[dateKey()] || []).length} logs
            </div>
          </div>
          <button onClick={() => setShowManage(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: '4px' }} title="Manage">🛠️</button>
          <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: '4px' }} title="Settings">⚙️</button>
          <button onClick={() => setShowLog(true)} style={{
            background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff',
            borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            📒
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
          <textarea ref={inRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={`Paste stock for ${branch}...`} rows={1}
            style={{ flex: 1, border: 'none', resize: 'none', fontSize: 14, padding: '10px 0', lineHeight: 1.4, maxHeight: 120, fontFamily: 'inherit', background: 'transparent', color: '#111',
              overflowY: input.split('\n').length > 4 ? 'auto' : 'hidden',
              height: Math.min(120, Math.max(38, input.split('\n').length * 22)) }} />
        </div>
        <button onClick={() => send(input)} style={{
          background: input.trim() ? '#10B981' : '#CCC', border: 'none', borderRadius: '50%', width: 42, height: 42,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0, fontSize: 18, color: '#fff',
          boxShadow: input.trim() ? '0 2px 8px rgba(16,185,129,.3)' : 'none',
        }}>➤</button>
      </div>

      <TemplateModal open={showTpl} onClose={() => setShowTpl(false)} activeBranch={branch} sections={dynSections}
        onSelect={(name, sec) => { setInput(`${name} update:\n` + sec.items.map(i => `${i}: `).join('\n')); setShowTpl(false); setTimeout(() => inRef.current?.focus(), 100); }} />
      <ThresholdSettings open={showSettings} onClose={() => setShowSettings(false)} thresholds={thresholds} onSave={handleSaveThresholds} sections={dynSections} />
    </div>
  );
}
