# 🚀 Deploy Shalom Fish — Firebase + GitHub + Render

This takes you from the code on your computer to a **live website** where the admin
panel saves products/images to the cloud (Firebase) and every visitor sees them.

Four parts:
- **A — Firebase** (database + image storage)
- **B — Run locally** (make sure it works first)
- **C — GitHub** (put the code online)
- **D — Render** (host the live site)

> The app also runs **without Firebase** — it just stores data in each browser
> (localStorage). Firebase makes the data shared and permanent.

---

## Part A — Firebase (Firestore + Storage)

1. Go to https://console.firebase.google.com → **Add project**. Name it `shalom-fish`
   (Analytics can be OFF). Create it.
2. **Firestore Database** → left menu **Build → Firestore Database → Create database** →
   choose a location (e.g. `asia-south1`) → **Start in production mode** → Enable.
3. **Storage** → **Build → Storage → Get started** → accept defaults → Done. Note the
   bucket name shown (looks like `shalom-fish.appspot.com`).
4. **Get your web config:** click the ⚙️ gear → **Project settings** → scroll to
   **Your apps** → click the **web** icon `</>` → register an app (nickname `web`) →
   copy the `firebaseConfig` values. You'll need: apiKey, authDomain, projectId,
   storageBucket, messagingSenderId, appId.

### Security rules (important)
This app writes from the browser, so open the rules for the store data. In the Firebase
console set these (tighten later with Firebase Auth if you want a truly locked admin):

**Firestore rules** (Rules tab):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shalom/{doc} {
      allow read: if true;
      allow write: if true;   // demo — anyone can write. Lock down with Auth for production.
    }
  }
}
```
**Storage rules** (Storage → Rules) — note `media/` is required for live photos/videos:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{file} {
      allow read: if true;
      allow write: if true;   // demo — lock down for production.
    }
    match /media/{file} {
      allow read: if true;
      allow write: if true;   // live photos + videos
    }
  }
}
```
⚠️ If `media/` is missing from these rules, **video and photo uploads in the admin
Media tab will fail** with `storage/unauthorized`.
### 🔒 Locked-down rules (use these once you've created your admin user)

Public **read** (customers browse), admin-only **write**. Replace `YOUR_ADMIN_UID`
with the UID from Authentication → Users.

**Firestore:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shalom/{doc} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == 'YOUR_ADMIN_UID';
    }
  }
}
```
**Storage:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{file} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == 'YOUR_ADMIN_UID';
    }
    match /media/{file} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == 'YOUR_ADMIN_UID';
    }
  }
}
```

> Pinning to your UID is stronger than `request.auth != null`: because the
> Email/Password provider allows self-signup via the API, *anyone* could create an
> account and would then satisfy `!= null`. Restricting to your UID means only you
> can write.

---

## Part B — Run locally first

1. Copy `.env.example` to **`.env.local`** and paste your Firebase values:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=shalom-fish.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=shalom-fish
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=shalom-fish.appspot.com
   NEXT_PUBLIC_FIREBASE_SENDER_ID=1234567890
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
   ```
2. Install & run:
   ```bash
   npm install
   npm run dev        # http://localhost:3000  (admin at /admin)
   ```
3. Open **/admin** (default password `shalom123`). The header shows **FIREBASE** when
   connected (or **LOCAL** if the env vars are missing). Add a product with an image —
   it should appear on the store and persist after refresh / on another device.

Build check:
```bash
npm run build && npm start
```

---

## Part C — GitHub

1. Create an **empty** repo at https://github.com/new named `shalom-fish` (no README/gitignore).
2. From the project folder run the helper (Windows): **`push-to-github.bat`**, or manually:
   ```bash
   git init && git add . && git commit -m "Shalom Fish"
   git branch -M main
   git remote add origin https://github.com/YOURNAME/shalom-fish.git
   git push -u origin main
   ```
   Your `.env.local` is **not** uploaded (it's git-ignored). Good — keep keys private.

---

## Part D — Render

1. https://dashboard.render.com → **New +** → **Blueprint** → connect your GitHub → pick
   the `shalom-fish` repo. Render reads `render.yaml` and proposes a web service.
2. It will ask for the env values — paste each **NEXT_PUBLIC_FIREBASE_\*** value from your
   Firebase config (same as `.env.local`).
3. **Apply / Create**. Wait ~3–5 min for the build.
4. You get a URL like `https://shalom-fish.onrender.com`. The store is there; `/admin` is
   the admin panel.

Every push to GitHub auto-redeploys.

> Also add your Render URL to Firebase → **Authentication → Settings → Authorized domains**
> if you later add Firebase Auth. For Storage image loads, the default rules above already
> allow public read.

---

## How the data works
- Admin changes (products, stock, categories, offers, live settings) are stored in Firestore
  under the `shalom/*` documents; uploaded images go to Storage under `products/`.
- The storefront reads those on load and when the tab regains focus.
- The base 12-item Kerala catalogue lives in `lib/products.js`; admin additions, edits
  (overrides) and deletions are layered on top.

## Notes / next steps
- **Admin password** (`shalom123`, changeable in Settings) is a **client-side** gate — fine
  for a demo, not real security. Use **Firebase Authentication** for a locked admin.
- **Cart & wishlist** are per-visitor (in memory). Add a `orders` collection + checkout to
  make real orders.
- Free Render instances sleep after ~15 min idle (first hit wakes in ~30s). Upgrade for
  always-on.

## Troubleshooting
- Admin header shows **LOCAL** → env vars missing/incorrect. Recheck `.env.local` /
  Render env, restart.
- Images don't upload → Storage rules not set, or bucket name wrong in
  `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.
- Products don't persist across devices → Firestore rules not set to allow write, or you're
  still in LOCAL mode.
