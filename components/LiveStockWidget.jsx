"use client";
import { useEffect, useMemo, useState } from "react";
import { products } from "@/lib/products";
import { getData } from "@/lib/store";

const ROTATE_MS = 4000;

export default function LiveStockWidget({ onSelect }) {
  const [stock, setStock] = useState({});
  const [extra, setExtra] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [deleted, setDeleted] = useState([]);
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(true);

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

  const list = useMemo(() => {
    const base = products
      .filter((p) => !deleted.includes(p.id))
      .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
    return [...extra, ...base]
      .map((p) => ({ ...p, qty: stock[p.id] !== undefined ? stock[p.id] : 20 }))
      .filter((p) => p.qty > 0)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [extra, overrides, deleted, stock]);

  // rotate with a short fade
  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setI((v) => (v + 1) % list.length);
        setFade(true);
      }, 220);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [list.length]);

  const p = list[i % (list.length || 1)];
  if (!p) return null;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(p.id)}
      aria-label={`${p.name}, ${p.qty} kg available`}
      className="h-24 w-24 overflow-hidden rounded-[20px] border border-slate-200/80 bg-white/95 px-2.5 py-2 text-left shadow-[0_6px_16px_rgba(15,23,42,0.11)] backdrop-blur transition active:scale-95 hover:border-lime-300"
    >
      <div className="flex items-center gap-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime-500" />
        </span>
        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">Live</span>
      </div>

      <div className={`transition-opacity duration-200 ${fade ? "opacity-100" : "opacity-0"}`}>
        <div className="mt-1 flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image || "/products/seer.jpg"}
            alt=""
            loading="lazy"
            className="h-[26px] w-[26px] shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
          />
          <p className="min-w-0 flex-1 truncate text-[9px] font-bold leading-tight text-slate-700">{p.name}</p>
        </div>
        <p
          className={`mt-1 text-[17px] font-extrabold leading-none ${
            p.qty < 8 ? "text-orange-600" : "text-lime-700"
          }`}
        >
          {p.qty} kg
        </p>
        <p className="mt-0.5 text-[8px] font-medium text-slate-400">Available</p>
      </div>
    </button>
  );
}
