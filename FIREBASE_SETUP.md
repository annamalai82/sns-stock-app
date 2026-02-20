# 🔥 Firebase Setup Guide — SnS Stock Tracker

This guide will get your app running with a shared real-time database in about 10 minutes.
Once done, **all staff will see each other's logs instantly across all devices**.

---

## Step 1: Create Firebase Project (2 min)

1. Go to **https://console.firebase.google.com**
2. Click **"Create a project"** (or "Add project")
3. Name it: `sns-stock-tracker`
4. Disable Google Analytics (not needed) → Click **Create Project**
5. Wait for it to finish → Click **Continue**

---

## Step 2: Create Firestore Database (1 min)

1. In the left sidebar, click **"Build" → "Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (allows read/write for 30 days — we'll secure it later)
4. Choose location: **australia-southeast1 (Sydney)** ← closest to Perth
5. Click **Enable**

✅ Your database is now live!

---

## Step 3: Register Your Web App (1 min)

1. Click the **⚙️ gear icon** next to "Project Overview" → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **web icon** `</>`
4. App nickname: `SnS Stock Tracker`
5. ☐ Leave "Firebase Hosting" unchecked
6. Click **"Register app"**
7. You'll see a config block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "sns-stock-tracker.firebaseapp.com",
  projectId: "sns-stock-tracker",
  storageBucket: "sns-stock-tracker.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

8. **Copy these values** — you need them for the next step

---

## Step 4: Paste Config into Your App (30 sec)

Open `src/firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",              // ← paste yours
  authDomain: "sns-stock-tracker.firebaseapp.com",
  projectId: "sns-stock-tracker",
  storageBucket: "sns-stock-tracker.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**That's it! The app is now connected to Firebase.** 🎉

---

## Step 5: Install, Test & Deploy (5 min)

### Test locally first:
```bash
cd sns-stock-app
npm install
npm start
```

Open http://localhost:3000 in two browser tabs.
Log stock in one tab → see it appear in the other tab instantly! ✅

### Deploy to Vercel:
1. Push to GitHub
2. Import in Vercel → Deploy
3. Share the URL with staff

---

## Step 6: Secure Your Database (do this within 30 days!)

After 30 days, test mode expires. Set proper security rules:

1. Go to **Firestore Database → Rules** tab
2. Replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read and write the app collection
    // (your staff don't have accounts, so we keep it open)
    match /app/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **Publish**

> 💡 This keeps the database open but limited to the `app` collection.
> For tighter security in the future, you can add Firebase Authentication
> so only logged-in staff can read/write.

---

## How It Works

| Feature | How |
|---------|-----|
| **Shared data** | Logs, transfers, and thresholds are stored in Firestore — all devices see the same data |
| **Real-time sync** | When Sapna saves stock on her phone, Veer's screen updates within 1-2 seconds |
| **Offline fallback** | If Firebase is temporarily unreachable, data saves to localStorage and syncs when back online |
| **Device-specific** | Which staff member is logged in and which branch they selected stays on their own device |

### Firestore Structure
```
app/
  logs        → { "2025-02-20": [{staffId, section, location, items, time}, ...], ... }
  xfers       → [{staffId, toLocation, items, date, time}, ...]
  thresholds  → { default: 2, Sambar: 10, "Curry Base": 5, ... }
```

---

## Cost

Firebase free tier (Spark plan) includes:
- **1 GB** stored data
- **50,000 reads/day**
- **20,000 writes/day**
- **20,000 deletes/day**

For 7 staff logging stock daily, you'll use roughly **~200 reads + 50 writes per day**.
That's **less than 1%** of the free tier. **You will never be charged.**

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Firebase: No Firebase App" error | Make sure `src/firebase.js` has your real config values |
| Data not syncing between devices | Check Firestore rules allow read/write. Open Firebase Console → Firestore → Data tab to verify data exists |
| "Permission denied" | Test mode may have expired. Update security rules (Step 6) |
| App works but data disappears | Check that you're looking at the same Firebase project |
| Want to reset all data | Firebase Console → Firestore → Delete the `app` collection |

---

## Quick Summary

1. Create Firebase project at console.firebase.google.com
2. Enable Firestore database in test mode
3. Register a web app → copy the config
4. Paste config into `src/firebase.js`
5. `npm install` → `npm start` → deploy to Vercel
6. Done! All staff see shared real-time data 🎉
