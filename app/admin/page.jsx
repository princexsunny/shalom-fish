"use client";
import { useEffect, useRef, useState } from "react";
import { products as baseProducts } from "@/lib/products";
import { getData, setData, uploadImage, uploadMedia, firebaseEnabled } from "@/lib/store";
import { signIn, signOutAdmin, onAdminAuth, sendReset, authMessage } from "@/lib/adminAuth";
import { listOrders, setOrderStatus, ORDER_STATUSES, STATUS_LABEL } from "@/lib/orders";

const DEFAULT_CATS = ["Marine", "Brackish", "Freshwater"];
const CATEGORY_OPTIONS = DEFAULT_CATS;
const LS_PRODUCTS = "shalom_admin_products";
const LS_STOCK = "shalom_admin_stock";
const LS_PW = "shalom_admin_pw";
const LS_OVERRIDES = "shalom_admin_overrides";
const LS_DELETED = "shalom_admin_deleted";
const LS_CATEGORIES = "shalom_admin_categories";
const LS_LIVE = "shalom_admin_live";
const DEFAULT_PW = "shalom123";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SEASONS = ["All", "Summer", "Monsoon", "Winter"];

const EMPTY = {
  name: "",
  local: "",
  category: CATEGORY_OPTIONS[0],
  price: "",
  oldPrice: "",
  unit: "500 g",
  stock: "25",
  premium: false,
  todaysCatch: false,
  hidden: false,
  special: false,
  availMode: "24x7",
  days: [],
  timeFrom: "09:00",
  timeTo: "21:00",
  season: "All",
};

export default function AdminPage() {
  const [tab, setTab] = useState("add");
  const [saved, setSaved] = useState([]);
  const [stock, setStock] = useState({});
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [idx, setIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editKind, setEditKind] = useState(null); // "added" | "base"
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  // overrides/deletions for base catalogue + menus
  const [overrides, setOverrides] = useState({});
  const [deleted, setDeleted] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [live, setLive] = useState({ enabled: true, speed: 2400 });
  const [media, setMedia] = useState([]);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaBusy, setMediaBusy] = useState("");
  const [mediaProduct, setMediaProduct] = useState("");
  const mediaRef = useRef(null);
  const [newCat, setNewCat] = useState("");
  // inventory controls
  const [invSearch, setInvSearch] = useState("");
  const [invStatus, setInvStatus] = useState("All");
  const [invCat, setInvCat] = useState("All");
  const [invSort, setInvSort] = useState("name");
  const [invVis, setInvVis] = useState("All");
  // orders
  const [orders, setOrders] = useState([]);
  const [ordersBusy, setOrdersBusy] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");

  // auth — real Firebase Auth when configured, legacy local gate otherwise
  const [authed, setAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [resetNote, setResetNote] = useState("");
  const [newPw, setNewPw] = useState("");

  // load from backend (Firestore if configured, else localStorage)
  useEffect(() => {
    (async () => {
      setSaved(await getData("products", []));
      setStock(await getData("stock", {}));
      setOverrides(await getData("overrides", {}));
      setDeleted(await getData("deleted", []));
      setCategories(await getData("categories", DEFAULT_CATS));
      setLive(await getData("live", { enabled: true, speed: 2400 }));
      setMedia(await getData("media", []));
    })();
  }, []);

  // Save to the backend and surface real failures (e.g. blocked by Firestore
  // security rules) instead of silently doing nothing.
  const flashError = (err) => {
    const msg = err?.code || err?.message || "Unknown error";
    setToast(`Save failed: ${msg}`);
    setTimeout(() => setToast(""), 4000);
  };
  const persistOverrides = (v) => {
    setOverrides(v);
    setData("overrides", v).catch(flashError);
  };
  const persistDeleted = (v) => {
    setDeleted(v);
    setData("deleted", v).catch(flashError);
  };
  const persistCategories = (v) => {
    setCategories(v);
    setData("categories", v).catch(flashError);
  };
  const persistLive = (v) => {
    setLive(v);
    setData("live", v).catch(flashError);
  };
  const persistMedia = (v) => {
    setMedia(v);
    setData("media", v).catch(flashError);
  };

  // upload live photos / videos
  const onMediaFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const added = [];
    for (const f of files) {
      setMediaBusy(`Uploading ${f.name}…`);
      try {
        const m = await uploadMedia(f);
        const linked = allProducts.find((p) => String(p.id) === String(mediaProduct));
        added.push({
          ...m,
          id: `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          title: mediaTitle || linked?.name || f.name.replace(/\.[^.]+$/, ""),
          // link the photo/clip to a product so customers know exactly what it is
          productId: linked ? linked.id : null,
          productName: linked ? linked.name : null,
          productPrice: linked ? linked.price : null,
          productUnit: linked ? linked.unit : null,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        flashError(err);
      }
    }
    setMediaBusy("");
    if (added.length) {
      persistMedia([...added, ...media]);
      setMediaTitle("");
      setMediaProduct("");
      setToast(`${added.length} item(s) uploaded ✓`);
      setTimeout(() => setToast(""), 2200);
    }
    e.target.value = "";
  };
  const removeMedia = (id) => persistMedia(media.filter((m) => m.id !== id));
  const linkMedia = (id, productId) => {
    const p = allProducts.find((x) => String(x.id) === String(productId));
    persistMedia(
      media.map((m) =>
        m.id === id
          ? {
              ...m,
              productId: p ? p.id : null,
              productName: p ? p.name : null,
              productPrice: p ? p.price : null,
              productUnit: p ? p.unit : null,
            }
          : m
      )
    );
  };
  const moveMedia = (id, dir) => {
    const i = media.findIndex((m) => m.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= media.length) return;
    const next = [...media];
    [next[i], next[j]] = [next[j], next[i]];
    persistMedia(next);
  };

  /* ---------------- authentication ----------------
     With Firebase configured this is REAL auth: Firestore/Storage rules require
     a signed-in admin, so a bypass in the browser gets you nothing — the server
     rejects the write. Without Firebase we fall back to the old local gate purely
     so local dev works; that fallback is cosmetic only.                        */

  // legacy local gate (no Firebase)
  const getPw = () => {
    try {
      return localStorage.getItem(LS_PW) || DEFAULT_PW;
    } catch {
      return DEFAULT_PW;
    }
  };

  // watch Firebase auth state
  useEffect(() => {
    if (!firebaseEnabled) {
      setAuthReady(true);
      try {
        if (sessionStorage.getItem("shalom_admin_authed") === "1") setAuthed(true);
      } catch {}
      return;
    }
    return onAdminAuth((u) => {
      setAdminUser(u);
      setAuthed(!!u);
      setAuthReady(true);
    });
  }, []);

  const refreshOrders = async () => {
    setOrdersBusy(true);
    try {
      setOrders(await listOrders(150));
    } catch (err) {
      flashError(err);
    } finally {
      setOrdersBusy(false);
    }
  };
  useEffect(() => {
    if (authed) refreshOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const changeStatus = async (id, status) => {
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));
    try {
      await setOrderStatus(id, status);
    } catch (err) {
      flashError(err);
      refreshOrders();
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setPwErr("");
    setResetNote("");

    if (!firebaseEnabled) {
      if (pw === getPw()) {
        setAuthed(true);
        setPw("");
        try {
          sessionStorage.setItem("shalom_admin_authed", "1");
        } catch {}
      } else {
        setPwErr("Incorrect password");
      }
      return;
    }

    setPwBusy(true);
    try {
      await signIn(email, pw);
      setPw("");
    } catch (err) {
      setPwErr(authMessage(err));
    } finally {
      setPwBusy(false);
    }
  };

  const logout = async () => {
    if (firebaseEnabled) {
      await signOutAdmin();
    } else {
      try {
        sessionStorage.removeItem("shalom_admin_authed");
      } catch {}
    }
    setAuthed(false);
    setAdminUser(null);
  };

  const forgotPassword = async () => {
    setPwErr("");
    if (!email.trim()) return setPwErr("Enter your email first");
    try {
      await sendReset(email);
      setResetNote("Reset link sent — check your inbox");
    } catch (err) {
      setPwErr(authMessage(err));
    }
  };

  // legacy-only: change the local gate password
  const changePw = (e) => {
    e.preventDefault();
    if (newPw.length < 4) {
      setToast("Password must be at least 4 characters");
      setTimeout(() => setToast(""), 2200);
      return;
    }
    try {
      localStorage.setItem(LS_PW, newPw);
    } catch {}
    setNewPw("");
    setToast("Password updated ✓");
    setTimeout(() => setToast(""), 2200);
  };

  const persistSaved = (list) => {
    setSaved(list);
    setData("products", list).catch(flashError);
  };
  const persistStock = (obj) => {
    setStock(obj);
    setData("stock", obj).catch(flashError);
  };

  // auto-sliding image preview
  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 1600);
    return () => clearInterval(t);
  }, [images.length]);

  // upload via data layer: Firebase Storage when configured, else a compressed data URL
  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const f of files) {
      try {
        const url = await uploadImage(f);
        setImages((prev) => [...prev, { name: f.name, url }]);
      } catch (err) {
        flashError(err);
      }
    }
    setUploading(false);
    e.target.value = "";
  };
  const removeImg = (i) => {
    setImages((prev) => prev.filter((_, k) => k !== i));
    setIdx(0);
  };

  const field = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const toggleDay = (d) =>
    setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setToast("Name and price are required");
      setTimeout(() => setToast(""), 2200);
      return;
    }
    const base = {
      name: form.name,
      local: form.local || "—",
      category: form.category,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice) || Number(form.price),
      unit: form.unit,
      premium: form.premium,
      todaysCatch: form.todaysCatch,
      hidden: form.hidden,
      special: form.special,
      schedule: {
        mode: form.availMode,
        days: form.days,
        from: form.timeFrom,
        to: form.timeTo,
        season: form.season,
      },
      images: images.map((im) => im.url),
      image: images[0]?.url || "",
    };
    if (editId && editKind === "added") {
      persistSaved(saved.map((s) => (s.id === editId ? { ...s, ...base } : s)));
      persistStock({ ...stock, [editId]: Number(form.stock) || 0 });
      setToast("Product updated ✓");
    } else if (editId && editKind === "base") {
      persistOverrides({ ...overrides, [editId]: base });
      persistStock({ ...stock, [editId]: Number(form.stock) || 0 });
      setToast("Product updated ✓");
    } else {
      const id = "p_" + Date.now();
      persistSaved([{ id, rating: 4.6, reviews: 0, ...base }, ...saved]);
      persistStock({ ...stock, [id]: Number(form.stock) || 0 });
      setToast("Product added ✓");
    }
    setForm(EMPTY);
    setImages([]);
    setIdx(0);
    setEditId(null);
    setEditKind(null);
    setTimeout(() => setToast(""), 2200);
  };

  const effectiveBase = baseProducts
    .filter((p) => !deleted.includes(p.id))
    .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
  const allProducts = [...saved, ...effectiveBase];
  const stockOf = (id) => (stock[id] !== undefined ? stock[id] : 20);
  const setStockFor = (id, v) => persistStock({ ...stock, [id]: Math.max(0, Number(v) || 0) });
  const status = (n) =>
    n <= 0
      ? { t: "Out", c: "text-red-300 bg-red-400/10 ring-red-400/30" }
      : n < 8
      ? { t: "Low", c: "text-amber-300 bg-amber-400/10 ring-amber-400/30" }
      : { t: "In stock", c: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/30" };

  // ---- statistics ----
  const stats = allProducts.reduce(
    (a, p) => {
      const s = stockOf(p.id);
      a.units += s;
      a.value += s * (p.price || 0);
      if (p.hidden) a.hidden += 1;
      if (s <= 0) a.out += 1;
      else if (s < 8) a.low += 1;
      else a.inStock += 1;
      return a;
    },
    { units: 0, value: 0, out: 0, low: 0, inStock: 0, hidden: 0 }
  );

  // ---- inventory filtering/sorting ----
  const invFiltered = allProducts
    .filter((p) => !invSearch || (p.name || "").toLowerCase().includes(invSearch.toLowerCase()))
    .filter((p) => invCat === "All" || p.category === invCat)
    .filter((p) => (invVis === "All" ? true : invVis === "Visible" ? !p.hidden : !!p.hidden))
    .filter((p) => {
      if (invStatus === "All") return true;
      const s = stockOf(p.id);
      if (invStatus === "In stock") return s >= 8;
      if (invStatus === "Low") return s > 0 && s < 8;
      if (invStatus === "Out") return s <= 0;
      return true;
    })
    .sort((x, y) => {
      if (invSort === "price") return (y.price || 0) - (x.price || 0);
      if (invSort === "stock") return stockOf(x.id) - stockOf(y.id);
      return (x.name || "").localeCompare(y.name || "");
    });
  /**
   * Show/hide a product on the storefront. Deliberately NOT delete: a hidden
   * fish keeps its price, stock and photo, so putting it back is one tap when
   * the next catch lands.
   *
   * Saved products live in `saved`; catalogue products are patched through
   * `overrides` — same reason edit works that way.
   */
  const toggleHidden = (p) => {
    const next = !p.hidden;
    if (saved.some((s) => s.id === p.id)) {
      persistSaved(saved.map((s) => (s.id === p.id ? { ...s, hidden: next } : s)));
    } else {
      persistOverrides({ ...overrides, [p.id]: { ...(overrides[p.id] || {}), hidden: next } });
    }
  };

  const delProduct = (p) => {
    if (saved.some((s) => s.id === p.id)) {
      persistSaved(saved.filter((s) => s.id !== p.id));
      const s = { ...stock };
      delete s[p.id];
      persistStock(s);
    } else {
      persistDeleted([...deleted, p.id]);
      const o = { ...overrides };
      delete o[p.id];
      persistOverrides(o);
    }
    if (editId === p.id) cancelEdit();
  };

  // categories CRUD
  const addCategory = () => {
    const v = newCat.trim();
    if (!v || categories.includes(v)) return;
    persistCategories([...categories, v]);
    setNewCat("");
  };
  const renameCategory = (i, v) => persistCategories(categories.map((c, k) => (k === i ? v : c)));
  const delCategory = (i) => persistCategories(categories.filter((_, k) => k !== i));


  const startEdit = (p) => {
    setEditId(p.id);
    setEditKind(saved.some((s) => s.id === p.id) ? "added" : "base");
    setForm({
      name: p.name || "",
      local: p.local === "—" ? "" : p.local || "",
      category: categories.includes(p.category) ? p.category : categories[0],
      price: String(p.price ?? ""),
      oldPrice: String(p.oldPrice ?? ""),
      unit: p.unit || "500 g",
      stock: String(stockOf(p.id)),
      premium: !!p.premium,
      todaysCatch: !!p.todaysCatch,
      hidden: !!p.hidden,
      special: !!p.special,
      availMode: p.schedule?.mode || "24x7",
      days: p.schedule?.days || [],
      timeFrom: p.schedule?.from || "09:00",
      timeTo: p.schedule?.to || "21:00",
      season: p.schedule?.season || "All",
    });
    const imgs = p.images && p.images.length ? p.images : p.image ? [p.image] : [];
    setImages(imgs.map((u) => ({ name: "", url: u })));
    setIdx(0);
    setTab("add");
  };
  function cancelEdit() {
    setEditId(null);
    setEditKind(null);
    setForm(EMPTY);
    setImages([]);
    setIdx(0);
  }

  const inputCls =
    "w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none placeholder:text-slate-300 focus:ring-lime-accent/50";

  // ---- login gate ----
  if (!authReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-lime-600" />
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 text-slate-900">
        <form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-600 text-lg text-white">⌘</span>
            <div>
              <h1 className="font-display text-lg font-bold">Admin sign in</h1>
              <p className="text-[11px] tracking-widest text-slate-400">SHALOM FISH</p>
            </div>
          </div>

          {firebaseEnabled ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Email</span>
                <input
                  type="email"
                  autoComplete="username"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setPwErr("");
                  }}
                  className={inputCls}
                  placeholder="you@example.com"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value);
                    setPwErr("");
                  }}
                  className={inputCls}
                  placeholder="••••••••"
                />
              </label>
            </>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Password</span>
              <input
                type="password"
                autoFocus
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setPwErr("");
                }}
                className={inputCls}
                placeholder="••••••••"
              />
            </label>
          )}

          {pwErr && <p className="mt-2 text-sm font-medium text-red-600">{pwErr}</p>}
          {resetNote && <p className="mt-2 text-sm font-medium text-lime-700">{resetNote}</p>}

          <button
            type="submit"
            disabled={pwBusy}
            className="mt-5 h-12 w-full rounded-xl bg-lime-600 font-semibold text-white shadow-sm transition hover:bg-lime-700 disabled:opacity-60"
          >
            {pwBusy ? "Signing in…" : "Sign in"}
          </button>

          {firebaseEnabled ? (
            <button
              type="button"
              onClick={forgotPassword}
              className="mt-3 block w-full text-center text-xs text-slate-500 hover:text-lime-700"
            >
              Forgot password?
            </button>
          ) : (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-700 ring-1 ring-amber-200">
              Firebase isn&apos;t connected, so this is the local dev gate only (default{" "}
              <strong>shalom123</strong>). It offers no real protection.
            </p>
          )}

          <a href="/" className="mt-3 block text-center text-xs text-slate-500 hover:text-lime-700">
            ← Back to store
          </a>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        {/* header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-accent/15 text-lg text-lime-accent ring-1 ring-lime-accent/30">
              ⌘
            </span>
            <div>
              <h1 className="font-display text-xl font-bold">Shalom Fish · Admin</h1>
              <p className="text-xs tracking-widest text-slate-400">
                <span className={firebaseEnabled ? "text-emerald-600" : "text-amber-600"}>
                  {firebaseEnabled ? "SECURED" : "LOCAL DEV"}
                </span>
                {adminUser?.email ? ` · ${adminUser.email}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="glass rounded-2xl px-4 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200 transition hover:text-lime-accent"
            >
              ← Back to store
            </a>
            <button
              onClick={logout}
              className="rounded-2xl bg-slate-50 px-4 py-2.5 text-sm text-slate-600 ring-1 ring-slate-200 transition hover:text-discount"
            >
              Logout
            </button>
          </div>
        </header>

        {/* statistics */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { l: "Products", v: allProducts.length, c: "text-slate-900" },
            { l: "In stock", v: stats.inStock, c: "text-emerald-300" },
            { l: "Low stock", v: stats.low, c: "text-amber-300" },
            { l: "Out", v: stats.out, c: "text-red-300" },
            { l: "Hidden", v: stats.hidden, c: "text-slate-400" },
            { l: "Inv. value", v: "₹" + stats.value.toLocaleString("en-IN"), c: "text-lime-accent" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className={`truncate text-xl font-bold ${s.c}`}>{s.v}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-widest text-slate-400">{s.l}</p>
            </div>
          ))}
        </div>

        {/* tabs — WRAP instead of horizontal scroll. With 7 tabs the scrolling
            version pushed "Media" off-screen on phones and, with the scrollbar
            hidden, there was no hint that more tabs existed. */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200">
          {[
            { id: "add", label: editId ? "Edit Product" : "Add Product", icon: "＋" },
            { id: "inventory", label: `Inventory (${allProducts.length})`, icon: "▦" },
            { id: "categories", label: "Categories", icon: "☰" },
            { id: "live", label: "Live", icon: "◉" },
            { id: "orders", label: `Orders (${orders.filter((o) => o.status === "new").length})`, icon: "🧾" },
            { id: "media", label: `Media (${media.length})`, icon: "▶" },
            { id: "settings", label: "Settings", icon: "⚙" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition sm:px-4 sm:text-sm ${
                tab === t.id
                  ? "bg-lime-accent text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <span className={`text-[11px] ${tab === t.id ? "text-white/80" : "text-lime-600"}`}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ADD PRODUCT */}
        {tab === "add" && (
          <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
            {/* left: fields */}
            <div className="glass rounded-4xl p-6 shadow-frost">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  {editId ? "Edit product" : "Product details"}
                </h2>
                {editId && (
                  <button type="button" onClick={cancelEdit} className="text-xs text-slate-500 hover:text-discount">
                    Cancel edit
                  </button>
                )}
              </div>
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-slate-500">Product name *</span>
                    <input className={inputCls} value={form.name} onChange={field("name")} placeholder="Seer Fish" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-slate-500">Local name</span>
                    <input className={inputCls} value={form.local} onChange={field("local")} placeholder="Neymeen" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs text-slate-500">Category</span>
                  <select className={inputCls} value={form.category} onChange={field("category")}>
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-ink-800">
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-slate-500">Price ₹ *</span>
                    <input className={inputCls} type="number" value={form.price} onChange={field("price")} placeholder="899" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-slate-500">Old price ₹</span>
                    <input className={inputCls} type="number" value={form.oldPrice} onChange={field("oldPrice")} placeholder="1099" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-slate-500">Base unit</span>
                    <input className={inputCls} value={form.unit} onChange={field("unit")} placeholder="500 g" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs text-slate-500">Stock (qty)</span>
                  <input className={inputCls} type="number" value={form.stock} onChange={field("stock")} placeholder="25" />
                </label>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.premium} onChange={field("premium")} className="h-4 w-4 accent-lime-accent" />
                    Premium
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.todaysCatch} onChange={field("todaysCatch")} className="h-4 w-4 accent-lime-accent" />
                    Today&apos;s Catch
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700" title="Keeps it off the shop without deleting it">
                    <input type="checkbox" checked={form.hidden} onChange={field("hidden")} className="h-4 w-4 accent-slate-500" />
                    Hidden
                  </label>
                </div>

                {/* availability & special */}
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Availability &amp; Super Offer</span>
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={form.special} onChange={field("special")} className="h-4 w-4 accent-lime-accent" />
                      ★ Super Offer
                    </label>
                  </div>

                  <div className="mb-3 inline-flex rounded-xl bg-slate-50 p-1 ring-1 ring-slate-200">
                    {[
                      { id: "24x7", label: "24 × 7" },
                      { id: "scheduled", label: "Scheduled" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, availMode: m.id }))}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          form.availMode === m.id ? "bg-lime-accent text-ink-900" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {form.availMode === "scheduled" && (
                    <div className="grid gap-3">
                      <div>
                        <span className="mb-1.5 block text-xs text-slate-500">Days</span>
                        <div className="flex flex-wrap gap-1">
                          {DAYS.map((d) => {
                            const on = form.days.includes(d);
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => toggleDay(d)}
                                className={`rounded-lg px-2 py-1 text-[11px] ring-1 transition ${
                                  on
                                    ? "bg-lime-accent/15 text-lime-accent ring-lime-accent"
                                    : "bg-slate-50 text-slate-500 ring-slate-200"
                                }`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="mb-1.5 block text-xs text-slate-500">From</span>
                          <input type="time" className={inputCls} value={form.timeFrom} onChange={field("timeFrom")} />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs text-slate-500">To</span>
                          <input type="time" className={inputCls} value={form.timeTo} onChange={field("timeTo")} />
                        </label>
                      </div>
                      <label className="block">
                        <span className="mb-1.5 block text-xs text-slate-500">Season</span>
                        <select className={inputCls} value={form.season} onChange={field("season")}>
                          {SEASONS.map((s) => (
                            <option key={s} value={s} className="bg-ink-800">
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* right: images */}
            <div className="glass rounded-4xl p-6 shadow-frost">
              <h2 className="font-display mb-4 text-lg font-semibold">
                Images <span className="text-sm font-normal text-slate-400">(multiple)</span>
              </h2>

              {/* auto-sliding preview */}
              <div className="relative mb-4 aspect-video overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-slate-200">
                {images.length ? (
                  <>
                    {images.map((im, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={im.url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                        style={{ opacity: i === idx ? 1 : 0 }}
                      />
                    ))}
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-lime-accent" : "w-1.5 bg-slate-300"}`}
                        />
                      ))}
                    </div>
                    <span className="absolute right-2 top-2 rounded-full bg-ink-900/70 px-2 py-0.5 text-[11px] text-lime-accent">
                      auto-play
                    </span>
                  </>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-400">Preview appears here</div>
                )}
              </div>

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-4 text-sm text-slate-600 transition hover:border-lime-accent/50 hover:text-lime-accent disabled:opacity-60"
              >
                {uploading ? "Uploading…" : "+ Upload images"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />

              {/* thumbs */}
              {images.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {images.map((im, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-xl ring-1 ring-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={im.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImg(i)}
                        className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-ink-900/80 text-xs text-slate-900 hover:text-discount"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="mt-6 w-full rounded-2xl bg-lime-accent px-5 py-3 font-semibold text-ink-900 shadow-glow-lime transition hover:brightness-110"
              >
                {editId ? "Update product" : "Save product"}
              </button>
            </div>
          </form>
        )}

        {/* INVENTORY */}
        {tab === "inventory" && (
          <div className="space-y-4">
            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                placeholder="Search products…"
                className="min-w-[160px] flex-1 rounded-2xl bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 placeholder:text-slate-500 focus:ring-lime-accent/50"
              />
              <select
                value={invStatus}
                onChange={(e) => setInvStatus(e.target.value)}
                className="rounded-2xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-slate-200"
              >
                {["All", "In stock", "Low", "Out"].map((o) => (
                  <option key={o} value={o} className="bg-white">
                    {o}
                  </option>
                ))}
              </select>
              <select
                value={invCat}
                onChange={(e) => setInvCat(e.target.value)}
                className="rounded-2xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-slate-200"
              >
                <option value="All" className="bg-white">
                  All categories
                </option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-white">
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={invVis}
                onChange={(e) => setInvVis(e.target.value)}
                className="rounded-2xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-slate-200"
              >
                {["All", "Visible", "Hidden"].map((o) => (
                  <option key={o} value={o} className="bg-white">
                    {o === "All" ? "All products" : o}
                  </option>
                ))}
              </select>
              <select
                value={invSort}
                onChange={(e) => setInvSort(e.target.value)}
                className="rounded-2xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-slate-200"
              >
                <option value="name" className="bg-white">Sort: Name</option>
                <option value="price" className="bg-white">Sort: Price</option>
                <option value="stock" className="bg-white">Sort: Stock</option>
              </select>
            </div>

            <div className="glass overflow-hidden rounded-4xl shadow-frost">
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-slate-200 px-5 py-3 text-[11px] uppercase tracking-widest text-slate-400 sm:grid-cols-[1.6fr_1fr_auto_auto_auto]">
              <span>Product</span>
              <span className="hidden sm:block">Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Status</span>
            </div>
            <div className="max-h-[62vh] overflow-y-auto">
              {invFiltered.map((p) => {
                const n = stockOf(p.id);
                const st = status(n);
                return (
                  <div
                    key={p.id}
                    className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-slate-100 px-5 py-3 text-sm sm:grid-cols-[1.6fr_1fr_auto_auto_auto] ${
                      p.hidden ? "bg-slate-50/80 opacity-60" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image || "/products/neymeen.jpg"} onError={(e) => {
                        if (e.currentTarget.dataset.fb) return;
                        e.currentTarget.dataset.fb = "1";
                        e.currentTarget.src = "/products/_placeholder.svg";
                      }}
                        alt={p.name}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {p.special && <span className="mr-1 text-lime-accent">★</span>}
                          {p.name}
                          {p.hidden && (
                            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                              Hidden
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {p.schedule?.mode === "scheduled"
                            ? `⏱ ${p.schedule.from}–${p.schedule.to}`
                            : p.local}
                        </p>
                      </div>
                    </div>
                    <span className="hidden text-slate-500 sm:block">{p.category}</span>
                    <span className="font-semibold text-lime-accent">₹{p.price}</span>
                    <input
                      type="number"
                      value={n}
                      onChange={(e) => setStockFor(p.id, e.target.value)}
                      className="w-16 rounded-lg bg-slate-50 px-2 py-1 text-center text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-lime-accent/50"
                    />
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${st.c}`}>{st.t}</span>
                      <button
                        onClick={() => toggleHidden(p)}
                        aria-label={p.hidden ? `Show ${p.name} on the shop` : `Hide ${p.name} from the shop`}
                        title={p.hidden ? "Hidden — tap to show on the shop" : "Visible — tap to hide"}
                        className={`transition ${
                          p.hidden ? "text-slate-400 hover:text-lime-accent" : "text-lime-accent hover:text-slate-400"
                        }`}
                      >
                        {p.hidden ? (
                          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3l18 18" />
                            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                            <path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c5 0 9 4.5 9 7a12 12 0 0 1-2.2 3.1M6.2 6.7A12.8 12.8 0 0 0 3 12c0 2.5 4 7 9 7a9.7 9.7 0 0 0 3.5-.6" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z" />
                            <circle cx="12" cy="12" r="2.6" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(p)}
                        aria-label="Edit"
                        className="text-slate-400 transition hover:text-lime-accent"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => delProduct(p)}
                        aria-label="Delete"
                        className="text-slate-400 transition hover:text-discount"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
              {invFiltered.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-slate-400">No products match your filters.</p>
              )}
            </div>
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        {tab === "categories" && (
          <div className="glass max-w-md rounded-4xl p-6 shadow-frost">
            <h2 className="font-display mb-4 text-lg font-semibold">Categories</h2>
            <div className="mb-4 flex gap-2">
              <input
                className={inputCls}
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="New category name"
              />
              <button
                type="button"
                onClick={addCategory}
                className="shrink-0 rounded-2xl bg-lime-accent px-4 text-sm font-semibold text-ink-900"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {categories.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={inputCls} value={c} onChange={(e) => renameCategory(i, e.target.value)} />
                  <button
                    type="button"
                    onClick={() => delCategory(i)}
                    aria-label="Delete category"
                    className="shrink-0 text-slate-400 hover:text-discount"
                  >
                    🗑
                  </button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-slate-400">No categories.</p>}
            </div>
            <p className="mt-4 text-xs text-slate-400">Used in the Add / Edit product category list.</p>
          </div>
        )}

        {/* OFFERS */}
        {tab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {["all", ...ORDER_STATUSES].map((st) => {
                const n = st === "all" ? orders.length : orders.filter((o) => o.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`h-9 rounded-full px-3.5 text-xs font-semibold transition ${
                      orderFilter === st
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {st === "all" ? "All" : STATUS_LABEL[st]} ({n})
                  </button>
                );
              })}
              <button
                onClick={refreshOrders}
                className="ml-auto h-9 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {ordersBusy ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>

            {orders.filter((o) => orderFilter === "all" || o.status === orderFilter).length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-3xl">🧾</p>
                <p className="mt-3 text-sm text-slate-500">
                  {ordersBusy ? "Loading orders…" : "No orders yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders
                  .filter((o) => orderFilter === "all" || o.status === orderFilter)
                  .map((o) => (
                    <div key={o.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-base font-bold text-slate-900">{o.ref || o.id}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                o.status === "new"
                                  ? "bg-lime-100 text-lime-800"
                                  : o.status === "cancelled"
                                  ? "bg-red-50 text-red-600"
                                  : o.status === "delivered"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {STATUS_LABEL[o.status] || o.status}
                            </span>
                            {/* Payment chip. Green PAID means the signature was
                                verified server-side, not that the customer said
                                so — safe to dispatch on. */}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                o.payment === "online" && o.paymentStatus === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {o.payment === "online" && o.paymentStatus === "paid" ? "Paid ✓" : "COD"}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {o.createdAt ? new Date(o.createdAt).toLocaleString("en-IN") : ""}
                          </p>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900">₹{o.totals?.total ?? 0}</p>
                      </div>

                      {/* customer */}
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm">
                        <p className="font-semibold text-slate-800">{o.customer?.name}</p>
                        <a href={`tel:+91${o.customer?.phone}`} className="text-lime-700 hover:underline">
                          +91 {o.customer?.phone}
                        </a>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">{o.customer?.address}</p>
                        {o.customer?.notes ? (
                          <p className="mt-1 text-xs italic text-slate-500">“{o.customer.notes}”</p>
                        ) : null}
                        <p className="mt-1.5 text-[11px] text-slate-400">
                          {o.slot === "asap" ? "ASAP" : o.slot} ·{" "}
                          {o.payment === "online" ? "Paid online (Razorpay)" : "Cash on delivery"}
                        </p>
                        {o.paymentId ? (
                          <p className="mt-0.5 break-all text-[10px] text-slate-400">
                            Payment id: {o.paymentId}
                          </p>
                        ) : null}
                      </div>

                      {/* items */}
                      <ul className="mt-3 divide-y divide-slate-100 text-sm">
                        {(o.items || []).map((it, k) => (
                          <li key={k} className="flex items-center justify-between py-1.5">
                            <span className="min-w-0 flex-1 truncate text-slate-700">
                              {it.name}{" "}
                              <span className="text-slate-400">
                                · {it.weight} × {it.qty}
                                {it.cleaning ? " · cleaned" : ""}
                              </span>
                            </span>
                            <span className="shrink-0 font-semibold text-slate-800">₹{it.price * it.qty}</span>
                          </li>
                        ))}
                      </ul>

                      {/* status actions */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {ORDER_STATUSES.map((st) => (
                          <button
                            key={st}
                            onClick={() => changeStatus(o.id, st)}
                            disabled={o.status === st}
                            className={`h-8 rounded-lg px-2.5 text-[11px] font-semibold transition ${
                              o.status === st
                                ? "bg-slate-900 text-white"
                                : st === "cancelled"
                                ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {STATUS_LABEL[st]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* LIVE MEDIA */}
        {tab === "media" && (
          <div className="space-y-4">
            <div className="glass rounded-4xl p-6 shadow-frost">
              <h2 className="font-display mb-1 text-lg font-semibold">Live photos &amp; videos</h2>
              <p className="mb-4 text-xs text-slate-500">
                Shown in the Live Media panel on the home page. Videos autoplay muted and loop; tapping opens a
                fullscreen viewer.
              </p>

              {!firebaseEnabled && (
                <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
                  Firebase isn&apos;t connected, so only <strong>images</strong> can be uploaded. Videos need Firebase
                  Storage.
                </p>
              )}

              <label className="mb-3 block">
                <span className="mb-1.5 block text-xs text-slate-500">Title (optional)</span>
                <input
                  className={inputCls}
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="e.g. Fresh catch arriving"
                />
              </label>

              <label className="mb-3 block">
                <span className="mb-1.5 block text-xs text-slate-500">
                  Link to product <span className="text-slate-400">(so customers know what they&apos;re seeing)</span>
                </span>
                <select
                  className={inputCls}
                  value={mediaProduct}
                  onChange={(e) => setMediaProduct(e.target.value)}
                >
                  <option value="">Not linked</option>
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price}/{p.unit}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                disabled={!!mediaBusy}
                onClick={() => mediaRef.current?.click()}
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-4 text-sm text-slate-600 transition hover:border-lime-accent/50 hover:text-lime-accent disabled:opacity-60"
              >
                {mediaBusy || "+ Upload photos or videos"}
              </button>
              <input
                ref={mediaRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={onMediaFiles}
                className="hidden"
              />
              <p className="mt-2 text-[11px] text-slate-400">
                Tip: keep videos under ~15 seconds and 720p — large files are slow for customers and cost more
                bandwidth.
              </p>
            </div>

            {media.length > 0 && (
              <div className="glass rounded-4xl p-6 shadow-frost">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  {media.length} item(s) — first one shows first
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {media.map((m, i) => (
                    <div key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="relative aspect-square bg-slate-100">
                        {m.type === "video" ? (
                          m.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <video src={m.url} className="h-full w-full object-cover" muted playsInline />
                          )
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.url} alt="" className="h-full w-full object-cover" />
                        )}
                        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                          {m.type === "video" ? "▶ Video" : "Photo"}
                        </span>
                        {m.productId && (
                          <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate rounded bg-lime-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            🔗 {m.productName}
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="truncate text-[11px] font-medium text-slate-700">{m.title || "Untitled"}</p>
                        <select
                          value={m.productId ?? ""}
                          onChange={(e) => linkMedia(m.id, e.target.value)}
                          className="mt-1 w-full rounded-lg bg-slate-50 px-1.5 py-1 text-[10px] text-slate-600 ring-1 ring-slate-200 outline-none"
                        >
                          <option value="">🔗 Not linked</option>
                          {allProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <div className="mt-1.5 flex items-center gap-1">
                          <button
                            onClick={() => moveMedia(m.id, -1)}
                            disabled={i === 0}
                            aria-label="Move earlier"
                            className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs text-slate-600 disabled:opacity-40"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveMedia(m.id, 1)}
                            disabled={i === media.length - 1}
                            aria-label="Move later"
                            className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs text-slate-600 disabled:opacity-40"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeMedia(m.id)}
                            aria-label="Delete"
                            className="ml-auto grid h-7 w-7 place-items-center rounded-lg bg-red-50 text-xs text-red-600"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIVE */}
        {tab === "live" && (
          <div className="glass max-w-md rounded-4xl p-6 shadow-frost">
            <h2 className="font-display mb-4 text-lg font-semibold">Live market settings</h2>
            <label className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-700">Show live market ticker</span>
              <input
                type="checkbox"
                checked={live.enabled}
                onChange={(e) => persistLive({ ...live, enabled: e.target.checked })}
                className="h-4 w-4 accent-lime-accent"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-slate-500">Rotation speed (ms)</span>
              <input
                type="number"
                className={inputCls}
                value={live.speed}
                onChange={(e) => persistLive({ ...live, speed: Math.max(600, Number(e.target.value) || 2400) })}
              />
            </label>
            <p className="mt-4 text-xs text-slate-400">The bottom-left live ticker on the store uses these settings.</p>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div className="max-w-md space-y-4">
            {firebaseEnabled ? (
              <>
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <h2 className="font-display mb-1 text-lg font-semibold">Signed in</h2>
                  <p className="mb-4 text-xs text-slate-500">{adminUser?.email}</p>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-800 ring-1 ring-emerald-200">
                    <strong>Server-enforced security.</strong> Firestore and Storage rules require this signed-in
                    account, so product, stock and media changes cannot be made by anyone else — even with browser
                    devtools.
                  </div>
                  <button
                    onClick={logout}
                    className="mt-4 h-11 w-full rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-1 text-sm font-semibold text-slate-800">Change password</h3>
                  <p className="mb-3 text-xs text-slate-500">
                    We&apos;ll email a secure reset link to {adminUser?.email}. Passwords are handled by Firebase and
                    never stored in this app.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await sendReset(adminUser?.email || "");
                        setToast("Reset link sent \u2713");
                      } catch (err) {
                        setToast(authMessage(err));
                      }
                      setTimeout(() => setToast(""), 3000);
                    }}
                    className="h-11 w-full rounded-xl bg-lime-600 text-sm font-semibold text-white transition hover:bg-lime-700"
                  >
                    Email me a reset link
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="font-display mb-4 text-lg font-semibold">Local dev password</h2>
                <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 ring-1 ring-amber-200">
                  Firebase isn&apos;t connected, so this gate is <strong>cosmetic only</strong> and offers no real
                  protection. Add your Firebase keys to enable real authentication.
                </div>
                <form onSubmit={changePw} className="grid gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-slate-500">New password</span>
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className={inputCls}
                      placeholder="At least 4 characters"
                    />
                  </label>
                  <button
                    type="submit"
                    className="h-11 w-full rounded-xl bg-lime-600 text-sm font-semibold text-white transition hover:bg-lime-700"
                  >
                    Update password
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-ink-800 px-5 py-3 text-sm font-medium text-lime-accent shadow-frost ring-1 ring-lime-accent/30">
          {toast}
        </div>
      )}
    </main>
  );
}
