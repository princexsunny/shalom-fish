"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { products } from "@/lib/products";
import { getData } from "@/lib/store";
import MediaViewer from "./MediaViewer";

const IMAGE_MS = 4000; // how long a still image shows before advancing

export default function LiveSection() {
  const [stock, setStock] = useState({});
  const [extra, setExtra] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [deleted, setDeleted] = useState([]);
  const [media, setMedia] = useState([]);
  const [idx, setIdx] = useState(0);
  const [viewer, setViewer] = useState(null); // index or null
  const [visible, setVisible] = useState(false);
  const [updated, setUpdated] = useState(null);

  const boxRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  /* ---- data ---- */
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [st, e, ov, del, md] = await Promise.all([
        getData("stock", {}),
        getData("products", []),
        getData("overrides", {}),
        getData("deleted", []),
        getData("media", []),
      ]);
      if (!alive) return;
      setStock(st || {});
      setExtra(Array.isArray(e) ? e : []);
      setOverrides(ov || {});
      setDeleted(del || []);
      setMedia(Array.isArray(md) ? md : []);
      setUpdated(new Date());
    };
    load();
    const t = setInterval(load, 30000); // refresh stock every 30s
    window.addEventListener("focus", load);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("focus", load);
    };
  }, []);

  const stockList = useMemo(() => {
    const base = products
      .filter((p) => !deleted.includes(p.id))
      .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
    return [...extra, ...base]
      .map((p) => ({ ...p, qty: stock[p.id] !== undefined ? stock[p.id] : 20 }))
      .filter((p) => p.qty > 0)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [extra, overrides, deleted, stock]);

  /* ---- only run media when the section is on screen ---- */
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver((entries) => setVisible(entries[0]?.isIntersecting ?? false), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ---- advance the carousel (video: on end / image: on timer) ---- */
  const current = media[idx];
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!visible || media.length < 2) return;
    if (!current || current.type === "image") {
      timerRef.current = setTimeout(() => setIdx((v) => (v + 1) % media.length), IMAGE_MS);
    }
    return () => clearTimeout(timerRef.current);
  }, [visible, idx, media.length, current]);

  /* ---- pause the video when off screen or when the viewer is open ---- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (visible && viewer === null) v.play().catch(() => {});
    else v.pause();
  }, [visible, viewer, idx]);

  if (!stockList.length && !media.length) return null;

  return (
    <section ref={boxRef} className="bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* ---------- LIVE STOCK ---------- */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-500" />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-700">Live Stock</h2>
            </div>

            <ul className="divide-y divide-slate-100">
              {stockList.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image || "/products/seer.jpg"}
                    alt={p.name}
                    loading="lazy"
                    className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{p.name}</span>
                    <span className="block text-[11px] text-slate-400">₹{p.price} / {p.unit}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.qty < 8 ? "bg-orange-50 text-orange-600" : "bg-lime-50 text-lime-700"
                    }`}
                  >
                    {p.qty} kg
                  </span>
                </li>
              ))}
            </ul>

            {updated && (
              <p className="mt-3 text-[10px] text-slate-400">
                Updated{" "}
                {updated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>

          {/* ---------- LIVE MEDIA ---------- */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-700">
                <span>🎥</span> Live Media
              </h2>
              {media.length > 1 && (
                <span className="text-[10px] font-medium text-slate-400">
                  {idx + 1}/{media.length}
                </span>
              )}
            </div>

            {media.length === 0 ? (
              <div className="grid aspect-square place-items-center rounded-2xl bg-slate-100 text-center">
                <div className="px-6">
                  <p className="text-2xl">📷</p>
                  <p className="mt-2 text-xs text-slate-400">
                    No live media yet — upload photos or videos from the admin Media tab.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setViewer(idx)}
                  aria-label="Open live media"
                  className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-slate-900"
                >
                  {current?.type === "video" ? (
                    <video
                      ref={videoRef}
                      key={current.url}
                      src={current.url}
                      poster={current.thumbnail || undefined}
                      className="h-full w-full object-cover"
                      playsInline
                      muted
                      loop={media.length === 1}
                      preload="metadata"
                      onEnded={() => media.length > 1 && setIdx((v) => (v + 1) % media.length)}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={current?.url}
                      src={current?.url}
                      alt={current?.title || "Live"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}

                  {/* live chip */}
                  <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Live
                  </span>

                  {current?.type === "video" && (
                    <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-[10px] text-white backdrop-blur">
                      ▶
                    </span>
                  )}

                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-left">
                    <span className="block truncate text-sm font-semibold text-white">
                      {current?.title || (current?.type === "video" ? "Live video" : "Fresh catch")}
                    </span>
                    <span className="block text-[10px] text-white/70">Tap to view fullscreen</span>
                  </span>
                </button>

                {/* thumbnail strip */}
                {media.length > 1 && (
                  <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                    {media.map((m, k) => (
                      <button
                        key={m.url + k}
                        onClick={() => setIdx(k)}
                        aria-label={`Show media ${k + 1}`}
                        className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                          k === idx ? "ring-lime-600" : "ring-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.thumbnail || m.url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full bg-slate-200 object-cover"
                        />
                        {m.type === "video" && (
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] text-white drop-shadow">▶</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {viewer !== null && <MediaViewer items={media} index={viewer} onClose={() => setViewer(null)} />}
    </section>
  );
}
