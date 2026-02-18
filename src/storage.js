// storage.js — Persistent storage using localStorage
// Data lives in the browser on each device.
// For multi-device sync, swap this with a Firebase/Supabase backend later.

const PREFIX = 'sns_';

export function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveData(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export function clearAll() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}
