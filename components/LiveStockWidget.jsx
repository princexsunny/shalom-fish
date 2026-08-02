"use client";
import { useEffect, useMemo, useState } from "react";
import { products } from "@/lib/products";
import { getData } from "@/lib/store";

const ROTATE_MS = 4000;
const FULL_STOCK = 30; // kg treated as "full" for the stock bar

/** Stable pseudo price series for the sparkline (demo data — replace with real
 *  price history when you start storing it). Seeded from the id so it never
 *  flickers between renders. */
function series(id, price, points = 12) {
  let seed = String(id)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 7);
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5);
  const out = [];
  let v = price * 0.94;
  for (let i = 0; i < points; i++) {
    v += price * 0.02 * rnd();
    out.push(v);
  }
  out[points - 1] = price;
  return out;
}

function Sparkline({ data, up }) {
  const w = 100;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / span) * (h - 3) - 1.5]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const stroke = up ? "#059669" : "#ef4444";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-[22px] w-full">
      <path d={area} fill={stroke} opacity="0.12" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LiveStockWidget({ onSelect }) {
  const [stock, setStock] = useState({});
  const [extra, setExtra] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [deleted, setDeleted] = useState([]);
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [ago, setAgo] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [st, e, ov, del] = await Promise.all([
        getData("stock", {}),
        getData("products", []),
        getData("overrides", {}),
        getData("deleted", []),
      ]);
      if (!alive) return;
      setStock(st || {});
      setExtra(Array.isArray(e) ? e : []);
      setOverrides(ov || {});
      setDeleted(del || []);
      setUpdatedAt(Date.now());
    };
    load();
    const t = setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("focus", load);
    };
  }, []);

  // "Updated Ns" counter
  useEffect(() => {
    if (!updatedAt) return;
    const t = setInterval(() => setAgo(Math.round((Date.now() - updatedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [updatedAt]);

  const list = useMemo(() => {
    const catalogue = products
      .filter((p) => !deleted.includes(p.id))
      .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
    return [...extra, ...catalogue]
      .filter((p) => !p.hidden) // hidden fish must not appear in the live ticker either
      .map((p) => {
        const realDelta = p.oldPrice && p.oldPrice !== p.price ? p.price - p.oldPrice : null;
        const seed = String(p.id)
          .split("")
          .reduce((a, c) => a + c.charCodeAt(0), 0);
        const delta = realDelta !== null ? realDelta : (seed % 27) - 13;
        const pct = p.price ? (delta / p.price) * 100 : 0;
        return {
          ...p,
          qty: stock[p.id] !== undefined ? stock[p.id] : 20,
          delta,
          pct,
          up: delta >= 0,
        };
      })
      .filter((p) => p.qty > 0)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [extra, overrides, deleted, stock]);

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setI((v) => (v + 1) % list.length);
        setFade(true);
      }, 200);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [list.length]);

  const p = list[i % (list.length || 1)];
  if (!p) return null;

  const pctStock = Math.max(6, Math.min(100, (p.qty / FULL_STOCK) * 100));
  const spark = series(p.id, p.price);
  const hot = p.qty < 8 || p.pct > 3;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(p.id)}
      aria-label={`${p.name}, ₹${p.price}, ${p.qty} kg left`}
      className="relative flex h-24 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 text-left transition active:scale-[0.98] hover:border-lime-300"
    >
      {/* fish photo — top-right corner inside the card */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={p.id}
        src={p.image || "/products/neymeen.jpg"} onError={(e) => {
                        if (e.currentTarget.dataset.fb) return;
                        e.currentTarget.dataset.fb = "1";
                        e.currentTarget.src = "/products/_placeholder.svg";
                      }}
        alt=""
        loading="lazy"
        className={`absolute right-2 top-2 h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200 transition-opacity duration-200 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* live + updated */}
      <div className="flex items-center gap-1 pr-9">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-slate-500">Live</span>
        {hot && <span className="text-[7px] font-bold text-orange-600">🔥</span>}
        <span className="ml-auto text-[7px] font-medium text-slate-400">{ago}s</span>
      </div>

      <div className={`min-h-0 flex-1 transition-opacity duration-200 ${fade ? "opacity-100" : "opacity-0"}`}>
        {/* name — keep clear of the photo */}
        <p className="truncate pr-9 text-[9px] font-bold leading-tight text-slate-800">{p.name}</p>

        {/* price + % change */}
        <div className="flex items-baseline gap-1 pr-9">
          <span className="text-[13px] font-extrabold leading-none text-slate-900">
            ₹{p.price.toLocaleString("en-IN")}
          </span>
          <span
            className={`text-[8px] font-bold leading-none ${p.up ? "text-emerald-600" : "text-red-500"}`}
          >
            {p.up ? "▲" : "▼"}
            {Math.abs(p.pct).toFixed(1)}%
          </span>
        </div>

        {/* sparkline */}
        <div className="-mx-0.5 mt-0.5">
          <Sparkline data={spark} up={p.up} />
        </div>

        {/* stock bar */}
        <div className="flex items-center gap-1.5">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
            <span
              className={`block h-full rounded-full transition-all duration-500 ${
                p.qty < 8 ? "bg-orange-500" : "bg-lime-600"
              }`}
              style={{ width: `${pctStock}%` }}
            />
          </span>
          <span
            className={`shrink-0 text-[8px] font-bold leading-none ${
              p.qty < 8 ? "text-orange-600" : "text-slate-600"
            }`}
          >
            {p.qty}kg
          </span>
        </div>
      </div>
    </button>
  );
}
