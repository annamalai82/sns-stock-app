// storage.js — Firebase Firestore persistence with real-time sync
// All data is shared across all devices in real-time.
//
// Firestore structure:
//   app/logs      → { value: { "2025-02-20": [...entries], ... } }
//   app/xfers     → { value: [...transfers] }
//   app/thresholds→ { value: { default: 2, Sambar: 10, ... } }
//   app/lastUser  → { value: { id, name, ... } }  (per-device, uses localStorage fallback)

import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const COLLECTION = 'app';

// ─── One-time read ───────────────────────────────────────────────────────────
export async function loadData(key, fallback) {
  try {
    // lastUser is device-specific, keep in localStorage
    if (key === 'lastUser' || key === 'lastBranch') {
      const raw = localStorage.getItem('sns_' + key);
      return raw ? JSON.parse(raw) : fallback;
    }
    const snap = await getDoc(doc(db, COLLECTION, key));
    if (snap.exists()) {
      return snap.data().value;
    }
    return fallback;
  } catch (e) {
    console.error('loadData error:', e);
    // Fallback to localStorage if Firebase fails
    try {
      const raw = localStorage.getItem('sns_' + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
}

// ─── Write ───────────────────────────────────────────────────────────────────
export async function saveData(key, data) {
  try {
    // lastUser/lastBranch stays local (each device picks their own user)
    if (key === 'lastUser' || key === 'lastBranch') {
      localStorage.setItem('sns_' + key, JSON.stringify(data));
      return;
    }
    await setDoc(doc(db, COLLECTION, key), {
      value: data,
      updatedAt: new Date().toISOString(),
    });
    // Also cache locally as fallback
    localStorage.setItem('sns_' + key, JSON.stringify(data));
  } catch (e) {
    console.error('saveData error:', e);
    // Fallback: save to localStorage
    localStorage.setItem('sns_' + key, JSON.stringify(data));
  }
}

// ─── Real-time listener ──────────────────────────────────────────────────────
// Call this to subscribe to changes from other devices.
// Returns an unsubscribe function.
export function onDataChange(key, callback) {
  try {
    return onSnapshot(doc(db, COLLECTION, key), (snap) => {
      if (snap.exists()) {
        callback(snap.data().value);
      }
    }, (error) => {
      console.error('onDataChange error:', error);
    });
  } catch (e) {
    console.error('onDataChange setup error:', e);
    return () => {}; // no-op unsubscribe
  }
}

export function clearAll() {
  Object.keys(localStorage)
    .filter(k => k.startsWith('sns_'))
    .forEach(k => localStorage.removeItem(k));
}
