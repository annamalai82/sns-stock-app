// firebase.js — Firebase initialization
// ⚠️ PASTE YOUR CONFIG BELOW (from Firebase Console → Project Settings → Your apps → Web app)

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC1JEPuySS5tth6AmugM525MGOSzVpisww",
  authDomain: "snsdb-68de9.firebaseapp.com",
  projectId: "snsdb-68de9",
  storageBucket: "snsdb-68de9.firebasestorage.app",
  messagingSenderId: "648935982533",
  appId: "1:648935982533:web:d51e06d5711ba0bf9d37ac",
  measurementId: "G-ZQS3CMXQE4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
