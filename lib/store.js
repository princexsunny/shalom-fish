"use client";
// Unified data layer. Uses Firebase (Firestore + Storage) when configured,
// otherwise falls back to browser localStorage so the app works with no backend.
import { firebaseEnabled, db, storage } from "./firebase";

// logical key -> localStorage key (kept identical to the old keys for a smooth switch)
const LS = {
  products: "shalom_admin_products",
  stock: "shalom_admin_stock",
  overrides: "shalom_admin_overrides",
  deleted: "shalom_admin_deleted",
  categories: "shalom_admin_categories",
  offers: "shalom_admin_offers",
  live: "shalom_admin_live",
};

/* ---------- read ---------- */
export async function getData(key, fallback) {
  if (firebaseEnabled) {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const snap = await getDoc(doc(db, "shalom", key));
      return snap.exists() && snap.data().value != null ? snap.data().value : fallback;
    } catch {
      return fallback;
    }
  }
  try {
    const raw = localStorage.getItem(LS[key]);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/* ---------- write ---------- */
// Returns a promise so callers can await + surface real errors (e.g. blocked by
// Firestore security rules) instead of failing silently.
export async function setData(key, value) {
  if (firebaseEnabled) {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "shalom", key), { value }); // throws on permission-denied etc.
    return true;
  }
  localStorage.setItem(LS[key], JSON.stringify(value)); // throws on quota exceeded
  return true;
}

/* ---------- live subscribe (Firestore only; no-op otherwise) ---------- */
export function subscribe(key, cb) {
  if (!firebaseEnabled) return () => {};
  let unsub = () => {};
  import("firebase/firestore").then(({ doc, onSnapshot }) => {
    unsub = onSnapshot(doc(db, "shalom", key), (snap) => {
      if (snap.exists()) cb(snap.data().value);
    });
  });
  return () => unsub();
}

/* ---------- images ---------- */
function resizeToDataUrl(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const max = 800;
        let { width, height } = img;
        if (width > height && width > max) {
          height = Math.round((height * max) / width);
          width = max;
        } else if (height > max) {
          width = Math.round((width * max) / height);
          height = max;
        }
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        c.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => resolve(r.result);
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

export async function uploadImage(file) {
  if (firebaseEnabled) {
    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
    const safe = file.name.replace(/[^a-z0-9.\-_]/gi, "_");
    const r = ref(storage, `products/${Date.now()}-${safe}`);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  }
  return await resizeToDataUrl(file);
}

export { firebaseEnabled };
