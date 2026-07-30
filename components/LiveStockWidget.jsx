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
      className="flex h-[88px] flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left transition active:scale-[0.98] hover:border-lime-300"
    >
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime-500" />
        </span>
        <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">Live Stock</span>
      </div>

      <div className={`transition-opacity duration-200 ${fade ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image || "/products/seer.jpg"}
            alt=""
            loading="lazy"
            className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10px] font-bold leading-tight text-slate-700">{p.name}</span>
            <span
              className={`block text-[16px] font-extrabold leading-tight ${
                p.qty < 8 ? "text-orange-600" : "text-lime-700"
              }`}
            >
              {p.qty} kg
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
