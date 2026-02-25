# 🍛 Sizzle n Sambar — Stock Tracker

Daily stock management app for SnS Nedlands & Vic Park staff.

---

## 📁 Project Structure

```
sns-stock-app/
├── public/
│   ├── index.html          ← Main HTML (PWA-enabled)
│   ├── manifest.json       ← Makes it installable on phones
│   ├── icon-192.png        ← App icon (replace with your logo)
│   └── icon-512.png        ← Large app icon
├── src/
│   ├── index.js            ← Entry point
│   ├── App.js              ← Main app (chat, login, templates)
│   ├── LogBook.js          ← Log Book (logs, trends, staff tracker)
│   ├── config.js           ← Staff, sections, thresholds, schedules
│   ├── engine.js           ← AI parser & response generator
│   └── storage.js          ← Data persistence (localStorage)
├── package.json
└── README.md               ← This file
```

---

## 🚀 Deploy to Vercel (Step-by-Step)

### Prerequisites
- A **GitHub** account (free) → https://github.com
- A **Vercel** account (free) → https://vercel.com (sign up with GitHub)

### Step 1: Upload to GitHub

1. Go to https://github.com/new
2. Name it `sns-stock-tracker`, keep it **Private**, click **Create**
3. Upload ALL the files from this folder maintaining the folder structure
   - Easiest way: click "uploading an existing file" on the new repo page
   - Drag the entire `sns-stock-app` folder contents in

### Step 2: Deploy on Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New → Project"**
3. Select your `sns-stock-tracker` repo from GitHub
4. Vercel auto-detects it as a React app — **no config needed**
5. Click **"Deploy"**
6. Wait 1-2 minutes → You get a live URL like `sns-stock-tracker.vercel.app`

### Step 3: Share with Staff

Send this to your WhatsApp group:
```
🍛 SnS Stock Tracker is live!

Open this link and add to your home screen:
https://sns-stock-tracker.vercel.app

1. Open the link in Chrome/Safari
2. Tap ⋮ (menu) → "Add to Home Screen"
3. Select your name and start logging!
```

---

## 💾 How Data Persistence Works

### Current: localStorage (per-device)
- Data is saved in each phone/browser's local storage
- **Pros:** Free, instant, works offline, no server needed
- **Cons:** Data stays on that device only — Sapna's phone won't see Veer's updates

### This is fine if:
- You mainly want each person to track their OWN section logs
- You review stock in person / via WhatsApp alongside this tool
- You want a simple starting point before investing in a backend

### Upgrade Path: Shared Database (all devices see everything)

When you're ready for everyone to see all logs in real-time, add **Firebase** (free tier):

1. Go to https://console.firebase.google.com
2. Create a project → Enable **Firestore Database**
3. Replace `src/storage.js` with Firebase calls:

```javascript
// storage.js — Firebase version (replace the existing file)
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const app = initializeApp({
  // Paste your Firebase config here
  apiKey: "...",
  authDomain: "...",
  projectId: "sns-stock-tracker",
  // etc.
});

const db = getFirestore(app);

export async function loadData(key, fallback) {
  try {
    const snap = await getDoc(doc(db, 'app', key));
    return snap.exists() ? snap.data().value : fallback;
  } catch {
    return fallback;
  }
}

export async function saveData(key, data) {
  try {
    await setDoc(doc(db, 'app', key), { value: data, updatedAt: new Date() });
  } catch (e) {
    console.error('Firebase error:', e);
  }
}
```

4. Run `npm install firebase` and redeploy

---

## ✏️ How to Customize

### Add/Remove Staff
Edit `src/config.js` → `STAFF` array

### Change Stock Sections or Items
Edit `src/config.js` → `SECTIONS` object

### Adjust Low Stock Thresholds
Edit `src/config.js` → `LOW_STOCK_THRESHOLDS`

### Change Ordering Schedule
Edit `src/config.js` → `ORDERING_SCHEDULE`

### Replace App Icon
Replace `public/icon-192.png` and `public/icon-512.png` with your SnS logo

After any changes, just push to GitHub → Vercel auto-redeploys in ~60 seconds.

---

## 📱 Staff Quick Guide

1. **Open the app** → Select your name
2. **Log stock** → Paste your stock list (same format as WhatsApp):
   ```
   Cool Room update:
   Sambar: 25
   Butter Sauce: 15
   Dosa Batter: 10
   ```
3. **View logs** → Tap 📒 Log Book in the header
4. **Check alerts** → Type "low stock"
5. **See schedule** → Type "orders"

---

## 🆘 Troubleshooting

| Problem | Fix |
|---------|-----|
| "Deploy failed" on Vercel | Check that `package.json` is in the root folder |
| App shows blank page | Open browser console (F12) and check for errors |
| Data disappeared | localStorage was cleared — data resets if browser cache is cleared |
| Want multi-device sync | Follow the Firebase upgrade path above |
| Need to reset all data | Open browser console → type `localStorage.clear()` → refresh |

---

Built for Sizzle n Sambar 🍛 Nedlands & Vic Park
