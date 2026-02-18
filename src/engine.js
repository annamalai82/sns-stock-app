// engine.js — Stock parsing, section detection, AI responses

import { STAFF, SECTIONS, ORDERING_SCHEDULE, LOW_STOCK_THRESHOLDS, dateKey } from './config';

export function parseStock(text) {
  const items = [];
  for (const line of text.split('\n').filter(l => l.trim())) {
    const m = line.match(/^(.+?)[\s]*[:\-–]+[\s]*(.+)$/);
    if (m) {
      const name = m[1].trim();
      const raw = m[2].trim();
      let qty = parseFloat(raw) || 0;
      const u = raw.match(/(kg|litre|liter|lit|ltr|L|serve|pcs|pieces|box|bag|pack|bucket|tray|bunch|bottle)/i);
      if (/and\s*half|½|&\s*half/i.test(raw)) qty += 0.5;
      if (/less\s*than/i.test(raw)) qty = Math.max(0, qty - 0.5);
      items.push({ name, quantity: qty, unit: u ? u[1] : '', raw });
    }
  }
  return items;
}

export function detectSection(t) {
  const l = t.toLowerCase();
  if (/kot\s*(section|stock|fridge)/i.test(l)) return 'KOT Section';
  if (/cool\s*room/i.test(l)) return 'Cool Room';
  if (/freezer/i.test(l)) return 'Freezer';
  if (/dry\s*(store|storage)/i.test(l)) return 'Dry Store';
  if (/vegetable/i.test(l)) return 'Vegetables';
  if (/dairy/i.test(l)) return 'Dairy';
  if (/drink/i.test(l)) return 'Drinks';
  if (/tandoor|grill|tikka/i.test(l)) return 'Tandoor/Grill';
  if (/marinat/i.test(l)) return 'Marination';
  if (/meat|seafood|fridge\s*stock/i.test(l)) return 'Meat & Seafood';
  return null;
}

export function detectLocation(t) {
  if (/nedlands/i.test(t)) return 'Nedlands';
  if (/vic\s*park|victoria/i.test(t)) return 'Vic Park';
  return null;
}

export function checkLowStock(items) {
  return items
    .filter(i => i.quantity <= (LOW_STOCK_THRESHOLDS[i.name] || LOW_STOCK_THRESHOLDS.default))
    .map(i => ({
      ...i,
      threshold: LOW_STOCK_THRESHOLDS[i.name] || LOW_STOCK_THRESHOLDS.default,
      severity: i.quantity === 0 ? 'critical' : 'warning',
    }));
}

export function generateResponse(input, stockData, user, logs) {
  const lo = input.toLowerCase().trim();
  const today = dateKey();
  const todayLogs = logs[today] || [];

  // Greetings
  if (/^(hi|hello|hey|good\s*(morning|evening|afternoon))/i.test(lo)) {
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const pending = STAFF.filter(s => !todayLogs.some(l => l.staffId === s.id));
    let m = `${g} ${user.name}! 👋\n\n📅 *Today:* ${todayLogs.length} update(s) logged\n`;
    if (pending.length > 0 && pending.length < STAFF.length)
      m += `⏳ Awaiting: ${pending.map(s => s.name).join(', ')}\n`;
    m += `\n📋 Paste stock to log it\n📒 Tap *Log Book* for history\n⚠️ "Low stock" for alerts\n📦 "Orders" for schedule`;
    return { text: m, type: 'assistant' };
  }

  // Help
  if (/help|how\s*to|what\s*can/i.test(lo)) {
    return {
      text: `📖 *SnS Stock Agent*\n\n*Log Stock:* Paste your list:\n"Sambar: 25\\nTamarind: 8"\n✅ Auto-logged with name, time, section\n\n*View Logs:* Tap 📒 Log Book\n  📋 Daily logs by date/section\n  📈 Item trends over time\n  👥 Staff completion tracker\n\n*Commands:*\n"Show [section] stock"\n"Low stock" — alerts\n"Orders" — schedule\n"Summary" — overview\n"Rules" — guidelines`,
      type: 'assistant',
    };
  }

  // Low stock
  if (/low\s*stock|shortage|running\s*(low|out)|what.*need/i.test(lo) && !/schedule/i.test(lo)) {
    const all = [];
    for (const [loc, secs] of Object.entries(stockData))
      for (const [sec, items] of Object.entries(secs))
        checkLowStock(items).forEach(a => all.push({ ...a, location: loc, section: sec }));
    if (!all.length) return { text: '✅ All stock levels healthy!', type: 'assistant' };
    const c = all.filter(a => a.severity === 'critical');
    const w = all.filter(a => a.severity === 'warning');
    let m = `⚠️ *Low Stock Alert*\n\n`;
    if (c.length) {
      m += `🔴 *OUT OF STOCK (${c.length}):*\n`;
      c.forEach(a => (m += `  • ${a.name} — ${a.location} (${a.section})\n`));
      m += '\n';
    }
    if (w.length) {
      m += `🟡 *LOW (${w.length}):*\n`;
      w.forEach(a => (m += `  • ${a.name}: ${a.quantity} ${a.unit} — ${a.location} [min:${a.threshold}]\n`));
    }
    return { text: m, type: 'alert' };
  }

  // Orders
  if (/order|schedule|supplier/i.test(lo)) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const td = days[new Date().getDay()];
    let m = `📦 *Ordering Schedule*\n\n`;
    ORDERING_SCHEDULE.forEach(o => {
      const is = o.day.includes(td);
      m += `${is ? '👉 ' : '  '}*${o.supplier}* — ${o.day}${is ? ' ⬅️ TODAY' : ''}${o.note ? '\n     ' + o.note : ''}\n`;
    });
    return { text: m, type: 'assistant' };
  }

  // Stock query
  if (/what('?s| is).*stock|show.*stock|check.*stock|status/i.test(lo) || /stock.*\?/.test(lo)) {
    const sec = detectSection(lo);
    const loc = detectLocation(lo) || 'Vic Park';
    if (sec && stockData[loc]?.[sec]) {
      const items = stockData[loc][sec];
      const al = checkLowStock(items);
      let m = `📊 *${sec} — ${loc}*\n\n`;
      items.forEach(i => {
        const a = al.find(x => x.name === i.name);
        m += `${a ? (a.severity === 'critical' ? '🔴' : '🟡') : '🟢'} ${i.name}: *${i.quantity} ${i.unit}*\n`;
      });
      if (al.length) m += `\n⚠️ ${al.length} item(s) flagged!`;
      return { text: m, type: 'stock-report' };
    }
    return {
      text: `Section not found. Try:\n${Object.entries(SECTIONS).map(([k, v]) => `${v.icon} ${k}`).join('\n')}`,
      type: 'assistant',
    };
  }

  // Summary
  if (/daily\s*summary|overview/i.test(lo)) {
    const staffDone = [...new Set(todayLogs.map(l => l.staffId))].length;
    let m = `📊 *Summary*\n\n📝 Today: ${todayLogs.length} updates\n👥 Staff: ${staffDone}/${STAFF.length}\n\n`;
    for (const [loc, secs] of Object.entries(stockData)) {
      m += `📍 *${loc}*\n`;
      for (const [sec, items] of Object.entries(secs)) {
        const al = checkLowStock(items);
        m += `  ${al.some(a => a.severity === 'critical') ? '🔴' : al.length ? '🟡' : '🟢'} ${sec}: ${items.length} items${al.length ? ` (${al.length} low)` : ''}\n`;
      }
      m += '\n';
    }
    return { text: m, type: 'stock-report' };
  }

  // Transfer
  if (/sent\s*to|transfer|moved\s*to|sending/i.test(lo)) {
    const loc = detectLocation(lo) || 'Nedlands';
    const items = parseStock(input);
    if (items.length) {
      let m = `📦 *Transfer Logged!*\n➡️ ${loc} · ${user.name} · ${new Date().toLocaleTimeString('en-AU')}\n\n`;
      items.forEach(i => (m += `  • ${i.name}: ${i.quantity} ${i.unit}\n`));
      return { text: m, type: 'transfer', isTransfer: true, transferData: { toLocation: loc, items } };
    }
  }

  // Responsibilities
  if (/who|responsib|assign|my\s*section/i.test(lo)) {
    let m = `👥 *Responsibilities*\n\n`;
    STAFF.forEach(s => (m += `${s.avatar} *${s.name}*${s.id === user.id ? ' (You)' : ''}\n   ${s.sections.join(' · ')}\n\n`));
    return { text: m, type: 'assistant' };
  }

  // Rules
  if (/rule|fifo|quality|expiry|wastage/i.test(lo)) {
    return {
      text: `📌 *Rules*\n\n1️⃣ Remind *one day before* ordering\n2️⃣ Accountable for section wastage\n3️⃣ Quality, freshness, expiry, FIFO\n4️⃣ Report low stock *immediately*\n5️⃣ Report wastage/spoilage ASAP`,
      type: 'assistant',
    };
  }

  // Stock update (auto-detect pasted list)
  const parsed = parseStock(input);
  if (parsed.length >= 2) {
    const sec = detectSection(input) || 'General';
    const loc = detectLocation(input) || 'Vic Park';
    const al = checkLowStock(parsed);
    let m = `✅ *Stock Logged!*\n\n📍 *${loc}* — ${sec}\n👤 *${user.name}* · 🕐 ${new Date().toLocaleTimeString('en-AU')}\n📅 Saved to today's log\n\n`;
    parsed.forEach(i => {
      const a = al.find(x => x.name === i.name);
      m += `${a ? (a.severity === 'critical' ? '🔴' : '🟡') : '✅'} ${i.name}: ${i.quantity} ${i.unit}\n`;
    });
    if (al.length) {
      m += `\n⚠️ *${al.length} flagged:*\n`;
      al.forEach(a => (m += `  🔔 *${a.name}* ${a.severity === 'critical' ? 'OUT' : 'LOW'} (${a.quantity}, min:${a.threshold})\n`));
    } else {
      m += `\n👍 All OK.`;
    }
    return { text: m, type: 'stock-update', isStockUpdate: true, stockPayload: { section: sec, location: loc, items: parsed } };
  }

  // Fallback
  return {
    text: `Try:\n• Paste stock list to log\n• "Low stock"\n• "Show cool room stock"\n• "Orders"\n• "Summary"\n• "Help"\nOr tap 📒 Log Book`,
    type: 'assistant',
  };
}
