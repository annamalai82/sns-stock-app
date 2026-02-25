// LogBook.js — Full log viewer: Logs, Out of Stock, Trends, Staff
// Features: Calendar date picker, dedicated OOS section, custom thresholds

import React, { useState } from 'react';
import { DEFAULT_STAFF, DEFAULT_SECTIONS, DEFAULT_LOCATIONS, DEFAULT_THRESHOLDS, dateKey } from './config';
import { checkLowStock } from './engine';

function Dot({ severity }) {
  const c = severity === 'critical' ? '#EF4444' : severity === 'warning' ? '#F59E0B' : '#22C55E';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, marginRight: 5, flexShrink: 0 }} />;
}

export default function LogBook({ logs, transfers, onClose, currentUser, thresholds, sections: propSections, staff: propStaff, locations: propLocations }) {
  const th = thresholds || DEFAULT_THRESHOLDS;
  const STAFF = propStaff || DEFAULT_STAFF;
  const SECTIONS = propSections || DEFAULT_SECTIONS;
  const LOCATIONS = propLocations || DEFAULT_LOCATIONS;
  const [vDate, setVDate] = useState(dateKey());
  const [vSec, setVSec] = useState('all');
  const [vLoc, setVLoc] = useState('all');
  const [tab, setTab] = useState('logs');
  const [trendItem, setTrendItem] = useState(null);
  const [trendSec, setTrendSec] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const allDates = [...new Set([dateKey(), ...Object.keys(logs)])].sort().reverse();
  const dayLogs = logs[vDate] || [];
  const filtered = dayLogs.filter(l => (vSec === 'all' || l.section === vSec) && (vLoc === 'all' || l.location === vLoc));
  const dayTransfers = transfers.filter(t => t.date === vDate);
  const staffStatus = STAFF.map(s => ({
    ...s, logged: dayLogs.filter(l => l.staffId === s.id).length,
    logsToday: dayLogs.filter(l => l.staffId === s.id),
  }));

  // ── OUT OF STOCK: collect all qty=0 items from day's logs ──
  const oosItems = [];
  const lowItems = [];
  for (const log of dayLogs) {
    for (const item of (log.items || [])) {
      const threshold = th[item.name] || th.default || 2;
      if (item.quantity === 0) {
        oosItems.push({ ...item, section: log.section, location: log.location, staffName: log.staffName, time: log.time });
      } else if (item.quantity <= threshold) {
        lowItems.push({ ...item, threshold, section: log.section, location: log.location, staffName: log.staffName, time: log.time });
      }
    }
  }

  const getTrend = (name) => {
    const pts = [];
    for (const d of allDates.slice(0, 30).reverse()) {
      for (const log of (logs[d] || [])) {
        const f = (log.items || []).find(i => i.name === name);
        if (f) { pts.push({ date: d, qty: f.quantity, unit: f.unit, loc: log.location }); break; }
      }
    }
    return pts;
  };

  const tabBtn = (id, label, active, badge) => (
    <button onClick={() => setTab(id)} style={{
      flex: 1, padding: '8px 0', border: 'none',
      background: active ? '#064E3B' : 'transparent',
      color: active ? '#fff' : '#6B7280',
      fontWeight: 700, fontSize: 12, cursor: 'pointer', borderRadius: 10, fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    }}>
      {label}
      {badge > 0 && <span style={{ background: active ? '#EF4444' : '#FEE2E2', color: active ? '#fff' : '#DC2626', borderRadius: 8, padding: '0 5px', fontSize: 10, fontWeight: 800 }}>{badge}</span>}
    </button>
  );

  // Date picker for going to any historical date
  const DatePickerModal = () => {
    if (!showDatePicker) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.5)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        onClick={() => setShowDatePicker(false)}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, maxWidth: 320, width: '100%' }} onClick={e => e.stopPropagation()}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#064E3B' }}>📅 Go to Date</h3>
          <input type="date" value={vDate} max={dateKey()}
            onChange={e => { setVDate(e.target.value); setShowDatePicker(false); }}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 16, fontFamily: 'inherit' }} />
          <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280' }}>
            {allDates.length} days with logs. Earliest: {allDates[allDates.length - 1] || 'none'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#F9FAFB', zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#064E3B', color: '#fff', padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>📒 Stock Log Book</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{Object.keys(logs).length} days · {Object.values(logs).flat().length} entries</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,.1)', borderRadius: 11, padding: 3 }}>
          {tabBtn('logs', '📋 Logs', tab === 'logs', 0)}
          {tabBtn('oos', '🔴 Out/Low', tab === 'oos', oosItems.length)}
          {tabBtn('trends', '📈 Trends', tab === 'trends', 0)}
          {tabBtn('staff', '👥 Staff', tab === 'staff', 0)}
        </div>
      </div>

      {/* ── LOGS TAB ── */}
      {tab === 'logs' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {/* Date strip + calendar button */}
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 6, marginBottom: 10, alignItems: 'stretch' }}>
            {/* Calendar picker button */}
            <button onClick={() => setShowDatePicker(true)} style={{
              flexShrink: 0, minWidth: 48, padding: '7px 4px', borderRadius: 12,
              border: '2px dashed #10B981', background: '#F0FDF4', cursor: 'pointer',
              textAlign: 'center', fontFamily: 'inherit', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 1,
            }}>
              <div style={{ fontSize: 18 }}>📅</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#059669' }}>PICK</div>
            </button>
            {allDates.slice(0, 14).map(d => {
              const dt = new Date(d + 'T00:00:00');
              const active = d === vDate;
              const cnt = (logs[d] || []).length;
              return (
                <button key={d} onClick={() => setVDate(d)} style={{
                  flexShrink: 0, minWidth: 56, padding: '7px 4px', borderRadius: 12,
                  border: active ? '2px solid #10B981' : '2px solid #E5E7EB',
                  background: active ? '#D1FAE5' : '#fff', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: active ? '#064E3B' : '#9CA3AF' }}>
                    {d === dateKey() ? 'TODAY' : dt.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: active ? '#064E3B' : '#374151' }}>{dt.getDate()}</div>
                  <div style={{ fontSize: 10, color: active ? '#059669' : '#9CA3AF' }}>{dt.toLocaleDateString('en-AU', { month: 'short' })}</div>
                  {cnt > 0 && <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#10B981', borderRadius: 10, padding: '1px 5px', marginTop: 2, display: 'inline-block' }}>{cnt}</div>}
                </button>
              );
            })}
          </div>

          {/* Selected date label */}
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>
            📅 {new Date(vDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {vDate !== dateKey() && <span style={{ color: '#F59E0B', marginLeft: 6 }}>(past)</span>}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <select value={vLoc} onChange={e => setVLoc(e.target.value)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
              <option value="all">📍 All Locations</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={vSec} onChange={e => setVSec(e.target.value)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 12, fontFamily: 'inherit', fontWeight: 600, flex: 1 }}>
              <option value="all">📂 All Sections</option>
              {Object.entries(SECTIONS).map(([k, v]) => <option key={k} value={k}>{v.icon} {k}</option>)}
            </select>
          </div>

          {/* Empty */}
          {filtered.length === 0 && dayTransfers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9CA3AF' }}>
              <div style={{ fontSize: 44 }}>📭</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>No logs for this date</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Tap 📅 to browse other dates</div>
            </div>
          )}

          {/* Log cards */}
          {filtered.map((log, idx) => {
            const al = checkLowStock(log.items || [], th);
            const sc = SECTIONS[log.section] || {};
            return (
              <div key={idx} style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 8, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 17 }}>{sc.icon || '📋'}</span>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{log.section || 'General'}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                      📍 {log.location} · {STAFF.find(s => s.id === log.staffId)?.avatar || '👤'} {log.staffName} · {log.time}
                    </div>
                  </div>
                  {al.length > 0 && (
                    <div style={{ background: al.some(a => a.severity === 'critical') ? '#FEF2F2' : '#FFFBEB', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: al.some(a => a.severity === 'critical') ? '#DC2626' : '#D97706' }}>
                      {al.some(a => a.severity === 'critical') ? '🔴' : '🟡'} {al.length}
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px' }}>
                  {(log.items || []).map((item, i) => {
                    const a = al.find(x => x.name === item.name);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12.5 }}>
                        <Dot severity={a ? a.severity : 'ok'} />
                        <span style={{ flex: 1, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                        <span style={{ fontWeight: 700, color: a ? (a.severity === 'critical' ? '#DC2626' : '#D97706') : '#111', flexShrink: 0 }}>
                          {item.quantity} <span style={{ fontWeight: 400, fontSize: 10, color: '#9CA3AF' }}>{item.unit}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Transfers */}
          {dayTransfers.map((t, i) => (
            <div key={`x${i}`} style={{ background: '#F5F3FF', borderRadius: 14, padding: 12, marginBottom: 8, border: '1px solid #E9D5FF' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#6D28D9' }}>📦 Transfer → {t.toLocation} · {t.staffName} · {t.time}</div>
              <div style={{ fontSize: 11, color: '#7C3AED', marginTop: 3 }}>{(t.items || []).map(i => `${i.name}: ${i.quantity} ${i.unit}`).join(' · ')}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── OUT OF STOCK / LOW STOCK TAB ── */}
      {tab === 'oos' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 10 }}>
            📅 {new Date(vDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* Date strip */}
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 6, marginBottom: 12, alignItems: 'stretch' }}>
            <button onClick={() => setShowDatePicker(true)} style={{
              flexShrink: 0, minWidth: 48, padding: '7px 4px', borderRadius: 12,
              border: '2px dashed #10B981', background: '#F0FDF4', cursor: 'pointer',
              textAlign: 'center', fontFamily: 'inherit', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 16 }}>📅</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#059669' }}>PICK</div>
            </button>
            {allDates.slice(0, 10).map(d => {
              const dt = new Date(d + 'T00:00:00');
              const active = d === vDate;
              return (
                <button key={d} onClick={() => setVDate(d)} style={{
                  flexShrink: 0, padding: '5px 12px', borderRadius: 10,
                  border: active ? '2px solid #EF4444' : '1px solid #E5E7EB',
                  background: active ? '#FEE2E2' : '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  color: active ? '#DC2626' : '#6B7280',
                }}>{d === dateKey() ? 'Today' : `${dt.getDate()} ${dt.toLocaleDateString('en-AU', { month: 'short' })}`}</button>
              );
            })}
          </div>

          {/* OUT OF STOCK section */}
          <div style={{ background: '#FEF2F2', borderRadius: 16, padding: 14, marginBottom: 12, border: '1px solid #FECACA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>🔴</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#DC2626' }}>Out of Stock</div>
                <div style={{ fontSize: 11, color: '#EF4444' }}>{oosItems.length} item(s) at zero quantity</div>
              </div>
            </div>
            {oosItems.length === 0 ? (
              <div style={{ padding: '12px 0', textAlign: 'center', color: '#F87171', fontSize: 13 }}>✅ Nothing out of stock!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {oosItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fff', borderRadius: 10, border: '1px solid #FECACA' }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#DC2626', minWidth: 20, textAlign: 'center' }}>0</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: '#6B7280' }}>📍 {item.location} · {SECTIONS[item.section]?.icon} {item.section} · {item.staffName} · {item.time}</div>
                    </div>
                    <span style={{ background: '#DC2626', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>OOS</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOW STOCK section */}
          <div style={{ background: '#FFFBEB', borderRadius: 16, padding: 14, border: '1px solid #FDE68A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>🟡</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#D97706' }}>Low Stock</div>
                <div style={{ fontSize: 11, color: '#F59E0B' }}>{lowItems.length} item(s) below threshold</div>
              </div>
            </div>
            {lowItems.length === 0 ? (
              <div style={{ padding: '12px 0', textAlign: 'center', color: '#FBBF24', fontSize: 13 }}>✅ Nothing below threshold!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {lowItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fff', borderRadius: 10, border: '1px solid #FDE68A' }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#D97706', minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: '#6B7280' }}>📍 {item.location} · {SECTIONS[item.section]?.icon} {item.section} · min: {item.threshold}</div>
                    </div>
                    <span style={{ background: '#F59E0B', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>LOW</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TRENDS TAB ── */}
      {tab === 'trends' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📈 Stock Trends</div>
          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Pick section → item to see quantity over time (up to 30 days)</p>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {Object.entries(SECTIONS).map(([k, v]) => (
              <button key={k} onClick={() => { setTrendSec(k); setTrendItem(v.items[0]); }} style={{
                padding: '5px 11px', borderRadius: 20,
                border: trendSec === k ? '2px solid #10B981' : '1px solid #D1D5DB',
                background: trendSec === k ? '#D1FAE5' : '#fff',
                fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                color: trendSec === k ? '#064E3B' : '#6B7280',
              }}>{v.icon} {k}</button>
            ))}
          </div>
          {trendSec && SECTIONS[trendSec] && (
            <>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                {SECTIONS[trendSec].items.map(it => (
                  <button key={it} onClick={() => setTrendItem(it)} style={{
                    padding: '3px 9px', borderRadius: 7,
                    border: trendItem === it ? '2px solid #064E3B' : '1px solid #E5E7EB',
                    background: trendItem === it ? '#064E3B' : '#fff',
                    color: trendItem === it ? '#fff' : '#374151',
                    fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{it}</button>
                ))}
              </div>
              {trendItem && (() => {
                const pts = getTrend(trendItem);
                const mx = Math.max(...pts.map(p => p.qty), 1);
                const itemTh = th[trendItem] || th.default || 2;
                return (
                  <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #E5E7EB' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{trendItem}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>{pts.length} points · Threshold: {itemTh}</div>
                    {pts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}>No data logged yet</div>
                    ) : (
                      <>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 4, height: 130, padding: '0 2px' }}>
                          {itemTh <= mx && <><div style={{ position: 'absolute', bottom: (itemTh / mx) * 120, left: 0, right: 0, borderTop: '2px dashed #F59E0B', opacity: 0.5, zIndex: 1 }} />
                          <div style={{ position: 'absolute', bottom: (itemTh / mx) * 120 + 4, right: 2, fontSize: 9, color: '#F59E0B', fontWeight: 700, zIndex: 2 }}>min:{itemTh}</div></>}
                          {pts.map((p, i) => {
                            const h = Math.max(10, (p.qty / mx) * 120);
                            const low = p.qty <= itemTh;
                            return (
                              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, zIndex: 3 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: low ? '#DC2626' : '#111' }}>{p.qty}</div>
                                <div style={{ width: '100%', height: h, borderRadius: 5, background: low ? 'linear-gradient(180deg,#FCA5A5,#EF4444)' : 'linear-gradient(180deg,#6EE7B7,#10B981)' }} />
                                <div style={{ fontSize: 8, color: '#9CA3AF', textAlign: 'center' }}>{new Date(p.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>
                                <div style={{ fontSize: 7, color: '#D1D5DB' }}>{(p.loc || '').slice(0, 3)}</div>
                              </div>
                            );
                          })}
                        </div>
                        {pts.length >= 2 && (() => {
                          const diff = pts[pts.length - 1].qty - pts[0].qty;
                          return (
                            <div style={{ marginTop: 14, padding: '8px 12px', borderRadius: 10, background: diff < 0 ? '#FEF2F2' : diff > 0 ? '#F0FDF4' : '#F9FAFB', fontSize: 12, fontWeight: 600, color: diff < 0 ? '#DC2626' : diff > 0 ? '#059669' : '#6B7280' }}>
                              {diff < 0 ? '📉 Down' : diff > 0 ? '📈 Up' : '➡️ Stable'} by {Math.abs(diff)} over {pts.length} logs
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ── STAFF TAB ── */}
      {tab === 'staff' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>👥 Staff Tracker</div>
          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Who has submitted updates?</p>
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
            <button onClick={() => setShowDatePicker(true)} style={{
              flexShrink: 0, padding: '5px 10px', borderRadius: 10, border: '2px dashed #10B981',
              background: '#F0FDF4', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#059669',
            }}>📅</button>
            {allDates.slice(0, 10).map(d => (
              <button key={d} onClick={() => setVDate(d)} style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 10,
                border: d === vDate ? '2px solid #10B981' : '1px solid #E5E7EB',
                background: d === vDate ? '#D1FAE5' : '#fff',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{d === dateKey() ? 'Today' : new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</button>
            ))}
          </div>
          {/* Completion bar */}
          {(() => {
            const done = staffStatus.filter(s => s.logged > 0).length;
            const pct = Math.round((done / STAFF.length) * 100);
            return (
              <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Completion</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: pct === 100 ? '#059669' : '#D97706' }}>{done}/{STAFF.length} ({pct}%)</span>
                </div>
                <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10B981' : 'linear-gradient(90deg,#F59E0B,#EAB308)', borderRadius: 4, transition: 'width .5s' }} />
                </div>
              </div>
            );
          })()}
          {staffStatus.map((s, i) => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 6, border: s.logged ? '1px solid #BBF7D0' : '1px solid #FED7AA' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{s.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}{s.id === currentUser?.id ? ' (You)' : ''}</div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{s.sections.join(' · ')}</div>
                  </div>
                </div>
                <div style={{ padding: '3px 10px', borderRadius: 8, fontWeight: 700, fontSize: 11, background: s.logged ? '#D1FAE5' : '#FEF3C7', color: s.logged ? '#059669' : '#D97706' }}>
                  {s.logged ? `✅ ${s.logged}` : '⏳ Pending'}
                </div>
              </div>
              {s.logged > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {s.logsToday.map((l, j) => (
                    <span key={j} style={{ padding: '2px 7px', borderRadius: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 10, fontWeight: 600, color: '#064E3B' }}>
                      {SECTIONS[l.section]?.icon} {l.section} · {l.time}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <DatePickerModal />
    </div>
  );
}
