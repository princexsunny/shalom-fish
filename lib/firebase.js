// Firebase init — reads config from NEXT_PUBLIC_* env vars.
// If the env vars are absent OR init fails for any reason, firebaseEnabled becomes
// false and the app falls back to browser localStorage (so it always loads).
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export let firebaseEnabled = Boolean(cfg.apiKey && cfg.projectId && cfg.storageBucket);

let db = null;
let storage = null;

if (firebaseEnabled) {
  try {
    const app = getApps().length ? getApp() : initializeApp(cfg);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (e) {
    // any init problem → silently fall back to local storage
    firebaseEnabled = false;
    if (typeof console !== "undefined") console.warn("Firebase init failed — using local storage.", e);
  }
}

export { db, storage };
