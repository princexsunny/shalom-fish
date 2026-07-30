"use client";
// Unified data layer. Uses Firebase (Firestore + Storage) when configured,
// otherwise falls back to browser localStorage so the app works with no backend.
import { firebaseEnabled, db, storage, app, projectId } from "./firebase";

// logical key -> localStorage key (kept identical to the old keys for a smooth switch)
const LS = {
  products: "shalom_admin_products",
  stock: "shalom_admin_stock",
  overrides: "shalom_admin_overrides",
  deleted: "shalom_admin_deleted",
  categories: "shalom_admin_categories",
  offers: "shalom_admin_offers",
  live: "shalom_admin_live",
  media: "shalom_admin_media",
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
        const max = 600;
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
        resolve(c.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => resolve(r.result);
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

export async function uploadImage(file) {
  // Try Firebase Storage first. The bucket domain differs by project age
  // (<project>.firebasestorage.app vs <project>.appspot.com), so try the
  // configured bucket and then both conventional names. Each attempt is capped
  // so a wrong bucket can't hang the UI; if all fail we embed the image inline.
  if (firebaseEnabled && app) {
    const { ref, uploadBytes, getDownloadURL, getStorage } = await import("firebase/storage");
    const safe = file.name.replace(/[^a-z0-9.\-_]/gi, "_");
    const path = `products/${Date.now()}-${safe}`;

    const targets = [storage];
    if (projectId) {
      targets.push(
        () => getStorage(app, `gs://${projectId}.firebasestorage.app`),
        () => getStorage(app, `gs://${projectId}.appspot.com`)
      );
    }

    for (const t of targets) {
      try {
        const s = typeof t === "function" ? t() : t;
        if (!s) continue;
        const attempt = (async () => {
          await uploadBytes(ref(s, path), file);
          return await getDownloadURL(ref(s, path));
        })();
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("storage/timeout")), 12000)
        );
        return await Promise.race([attempt, timeout]);
      } catch (e) {
        if (typeof console !== "undefined") console.warn("Storage attempt failed:", e?.code || e);
        // try the next candidate bucket
      }
    }
    if (typeof console !== "undefined") {
      console.warn("All Storage attempts failed — embedding image inline instead.");
    }
  }
  return await resizeToDataUrl(file);
}

/* ---------- live media (images + videos) ---------- */

// Grab a poster frame from a video file so the carousel has something to show
// before the video is ready.
function videoThumbnail(file) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "metadata";
      v.src = url;
      const done = (out) => {
        URL.revokeObjectURL(url);
        resolve(out);
      };
      v.onloadeddata = () => {
        v.currentTime = Math.min(0.5, (v.duration || 1) / 3);
      };
      v.onseeked = () => {
        try {
          const c = document.createElement("canvas");
          const max = 640;
          const scale = Math.min(1, max / Math.max(v.videoWidth || max, v.videoHeight || max));
          c.width = (v.videoWidth || max) * scale;
          c.height = (v.videoHeight || max) * scale;
          c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
          done({ thumb: c.toDataURL("image/jpeg", 0.7), duration: Math.round(v.duration || 0) });
        } catch {
          done({ thumb: "", duration: 0 });
        }
      };
      v.onerror = () => done({ thumb: "", duration: 0 });
      setTimeout(() => done({ thumb: "", duration: 0 }), 8000);
    } catch {
      resolve({ thumb: "", duration: 0 });
    }
  });
}

/**
 * Upload an image or video for the Live Media strip.
 * Videos REQUIRE Firebase Storage — they're far too large to inline as data URLs.
 */
export async function uploadMedia(file) {
  const isVideo = (file.type || "").startsWith("video/");

  if (isVideo && !(firebaseEnabled && storage)) {
    throw new Error("Video upload needs Firebase Storage — add your Firebase keys first.");
  }

  if (firebaseEnabled && storage) {
    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
    const safe = file.name.replace(/[^a-z0-9.\-_]/gi, "_");
    const r = ref(storage, `media/${Date.now()}-${safe}`);
    await uploadBytes(r, file);
    const url = await getDownloadURL(r);
    let thumbnail = "";
    let duration = 0;
    if (isVideo) {
      const t = await videoThumbnail(file);
      thumbnail = t.thumb;
      duration = t.duration;
    }
    return { type: isVideo ? "video" : "image", url, thumbnail, duration };
  }

  // images only, no backend configured
  return { type: "image", url: await resizeToDataUrl(file), thumbnail: "", duration: 0 };
}

export { firebaseEnabled };
