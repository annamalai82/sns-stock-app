// ManageScreen.js — Admin panel for managing branches, sections, items, and staff
// All changes sync to Firebase in real-time across all devices.

import React, { useState } from 'react';

const AVATARS = ['👨‍🍳','👩‍🍳','🧑‍🍳','👨','👩','🧑','👨‍💼','👩‍💼'];
const ICONS = ['🍛','❄️','🧊','📦','🥬','🥛','🥤','🔥','🫙','🥩','🍲','🥘','🧅','🍗','🫕','🍱','🥫','🧈','🥚','🍞','🧃','🍺','☕','🧹','📋','🏪','🛒'];

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #D1D5DB',
  fontSize: 14, fontFamily: 'inherit', background: '#fff', color: '#111',
};
const btnPrimary = {
  width: '100%', padding: '12px', background: '#064E3B', color: '#fff', border: 'none',
  borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};
const btnDanger = {
  background: 'none', border: 'none', color: '#EF4444', fontSize: 18,
  cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
};
const chipStyle = (active) => ({
  padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
  border: active ? '2px solid #10B981' : '1px solid #E5E7EB',
  background: active ? '#D1FAE5' : '#fff', fontSize: 12, fontWeight: 600,
  color: active ? '#064E3B' : '#6B7280',
});
const cardStyle = {
  background: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
  border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
};

export default function ManageScreen({ locations, sections, staff, onSave, onClose }) {
  const [tab, setTab] = useState('branches');

  // Local copies for editing
  const [locs, setLocs] = useState([...locations]);
  const [secs, setSecs] = useState(JSON.parse(JSON.stringify(sections)));
  const [stf, setStf] = useState(JSON.parse(JSON.stringify(staff)));

  // Form states
  const [newBranch, setNewBranch] = useState('');
  const [newSecName, setNewSecName] = useState('');
  const [newSecIcon, setNewSecIcon] = useState('📋');
  const [editSec, setEditSec] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffAvatar, setNewStaffAvatar] = useState('👨‍🍳');
  const [newStaffSections, setNewStaffSections] = useState('');
  const [editStaff, setEditStaff] = useState(null);
  const [editStaffSections, setEditStaffSections] = useState('');

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({ locations: locs, sections: secs, staff: stf });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabBtn = (id, label, active) => (
    <button onClick={() => setTab(id)} style={{
      flex: 1, padding: '9px 4px', border: 'none',
      background: active ? '#064E3B' : 'transparent',
      color: active ? '#fff' : '#6B7280',
      fontWeight: 700, fontSize: 12, cursor: 'pointer', borderRadius: 10, fontFamily: 'inherit',
    }}>{label}</button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#F9FAFB', zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#064E3B', color: '#fff', padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>🛠️ Manage</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Add branches, sections, items & staff</div>
          </div>
          <button onClick={handleSave} style={{
            background: saved ? '#10B981' : 'rgba(255,255,255,.2)', border: 'none', color: '#fff',
            borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            transition: 'all .2s',
          }}>
            {saved ? '✅ Saved!' : '💾 Save All'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,.1)', borderRadius: 11, padding: 3 }}>
          {tabBtn('branches', '📍 Branches', tab === 'branches')}
          {tabBtn('sections', '📂 Sections', tab === 'sections')}
          {tabBtn('staff', '👥 Staff', tab === 'staff')}
        </div>
      </div>

      {/* ── BRANCHES TAB ── */}
      {tab === 'branches' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📍 Branches / Locations</div>
          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Add new restaurant locations. Staff select a branch when logging stock.</p>

          {/* Add new */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={newBranch} onChange={e => setNewBranch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newBranch.trim()) { setLocs(p => [...p, newBranch.trim()]); setNewBranch(''); }}}
              placeholder="New branch name (e.g. Fremantle)" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => { if (newBranch.trim() && !locs.includes(newBranch.trim())) { setLocs(p => [...p, newBranch.trim()]); setNewBranch(''); }}}
              style={{ ...btnPrimary, width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap' }}>+ Add</button>
          </div>

          {/* List */}
          {locs.map((loc, i) => (
            <div key={i} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{i === 0 ? '🏖️' : i === 1 ? '🏙️' : '📍'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{loc}</div>
              </div>
              <button onClick={() => setLocs(p => p.filter((_, j) => j !== i))} style={btnDanger} title="Remove">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ── SECTIONS TAB ── */}
      {tab === 'sections' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📂 Sections & Items</div>
          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Manage stock sections and their items. Tap a section to edit its items.</p>

          {/* Add new section */}
          <div style={{ background: '#F0FDF4', borderRadius: 14, padding: 14, marginBottom: 14, border: '1px solid #BBF7D0' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#064E3B', marginBottom: 8 }}>➕ Add New Section</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={newSecName} onChange={e => setNewSecName(e.target.value)}
                placeholder="Section name (e.g. Bakery)" style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setNewSecIcon(ic)} style={{
                  width: 32, height: 32, borderRadius: 8, border: newSecIcon === ic ? '2px solid #10B981' : '1px solid #E5E7EB',
                  background: newSecIcon === ic ? '#D1FAE5' : '#fff', cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{ic}</button>
              ))}
            </div>
            <button onClick={() => {
              if (newSecName.trim() && !secs[newSecName.trim()]) {
                setSecs(p => ({ ...p, [newSecName.trim()]: { items: [], icon: newSecIcon } }));
                setNewSecName('');
                setEditSec(newSecName.trim());
              }
            }} style={btnPrimary}>Add Section</button>
          </div>

          {/* Section list */}
          {Object.entries(secs).map(([name, sec]) => {
            const isEditing = editSec === name;
            return (
              <div key={name} style={{ ...cardStyle, border: isEditing ? '2px solid #10B981' : '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  onClick={() => setEditSec(isEditing ? null : name)}>
                  <span style={{ fontSize: 20 }}>{sec.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{sec.items.length} items {isEditing ? '▾' : '▸'}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSecs(p => { const n = { ...p }; delete n[name]; return n; }); }}
                    style={btnDanger} title="Delete section">✕</button>
                </div>

                {/* Expanded item editor */}
                {isEditing && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #E5E7EB' }}>
                    {/* Add item */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <input value={newItem} onChange={e => setNewItem(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newItem.trim()) {
                            setSecs(p => ({ ...p, [name]: { ...p[name], items: [...p[name].items, newItem.trim()] } }));
                            setNewItem('');
                          }
                        }}
                        placeholder="Add item (e.g. Paneer Tikka)" style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: 13 }} />
                      <button onClick={() => {
                        if (newItem.trim()) {
                          setSecs(p => ({ ...p, [name]: { ...p[name], items: [...p[name].items, newItem.trim()] } }));
                          setNewItem('');
                        }
                      }} style={{ ...btnPrimary, width: 'auto', padding: '8px 14px', fontSize: 12 }}>+</button>
                    </div>
                    {/* Item list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {sec.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: '#F9FAFB', borderRadius: 8, fontSize: 13 }}>
                          <span style={{ color: '#6B7280', fontSize: 11, minWidth: 18 }}>{idx + 1}.</span>
                          <span style={{ flex: 1, color: '#374151' }}>{item}</span>
                          <button onClick={() => {
                            setSecs(p => ({ ...p, [name]: { ...p[name], items: p[name].items.filter((_, j) => j !== idx) } }));
                          }} style={{ ...btnDanger, fontSize: 14, padding: '2px 6px' }}>✕</button>
                        </div>
                      ))}
                      {sec.items.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '12px 0', color: '#9CA3AF', fontSize: 12 }}>
                          No items yet — add some above
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── STAFF TAB ── */}
      {tab === 'staff' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>👥 Staff Members</div>
          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Add and manage staff. Each person selects their name when they open the app.</p>

          {/* Add new staff */}
          <div style={{ background: '#F0FDF4', borderRadius: 14, padding: 14, marginBottom: 14, border: '1px solid #BBF7D0' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#064E3B', marginBottom: 8 }}>➕ Add New Staff</div>
            <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)}
              placeholder="Name (e.g. Ravi)" style={{ ...inputStyle, marginBottom: 8 }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Avatar:</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {AVATARS.map(av => (
                <button key={av} onClick={() => setNewStaffAvatar(av)} style={{
                  width: 36, height: 36, borderRadius: 10, border: newStaffAvatar === av ? '2px solid #10B981' : '1px solid #E5E7EB',
                  background: newStaffAvatar === av ? '#D1FAE5' : '#fff', cursor: 'pointer', fontSize: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{av}</button>
              ))}
            </div>
            <input value={newStaffSections} onChange={e => setNewStaffSections(e.target.value)}
              placeholder="Sections (comma-separated, e.g. Cool Room, Dairy)" style={{ ...inputStyle, marginBottom: 8 }} />
            <button onClick={() => {
              if (newStaffName.trim()) {
                const id = newStaffName.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);
                const sects = newStaffSections.split(',').map(s => s.trim()).filter(Boolean);
                setStf(p => [...p, { id, name: newStaffName.trim(), avatar: newStaffAvatar, sections: sects }]);
                setNewStaffName(''); setNewStaffSections('');
              }
            }} style={btnPrimary}>Add Staff Member</button>
          </div>

          {/* Staff list */}
          {stf.map((s, i) => {
            const isEditing = editStaff === s.id;
            return (
              <div key={s.id} style={{ ...cardStyle, border: isEditing ? '2px solid #10B981' : '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{s.avatar}</span>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => {
                    if (isEditing) { setEditStaff(null); }
                    else { setEditStaff(s.id); setEditStaffSections(s.sections.join(', ')); }
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                      {s.sections.length > 0 ? s.sections.join(' · ') : 'No sections assigned'}
                      {' '}{isEditing ? '▾' : '▸'}
                    </div>
                  </div>
                  <button onClick={() => setStf(p => p.filter((_, j) => j !== i))} style={btnDanger} title="Remove staff">✕</button>
                </div>

                {/* Edit sections */}
                {isEditing && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>Edit assigned sections:</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                      {Object.keys(secs).map(secName => {
                        const assigned = editStaffSections.split(',').map(x => x.trim()).includes(secName);
                        return (
                          <button key={secName} onClick={() => {
                            const current = editStaffSections.split(',').map(x => x.trim()).filter(Boolean);
                            const updated = assigned ? current.filter(x => x !== secName) : [...current, secName];
                            setEditStaffSections(updated.join(', '));
                          }} style={chipStyle(assigned)}>
                            {secs[secName].icon} {secName}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => {
                      const sects = editStaffSections.split(',').map(x => x.trim()).filter(Boolean);
                      setStf(p => p.map(x => x.id === s.id ? { ...x, sections: sects } : x));
                      setEditStaff(null);
                    }} style={{ ...btnPrimary, fontSize: 12, padding: '8px' }}>✅ Update Sections</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom save reminder */}
      <div style={{ padding: '10px 16px', background: '#FFFBEB', borderTop: '1px solid #FDE68A', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>💡</span>
        <span style={{ fontSize: 12, color: '#92400E', flex: 1 }}>Changes are not saved until you tap <strong>💾 Save All</strong>. Saved changes sync to all devices.</span>
      </div>
    </div>
  );
}
