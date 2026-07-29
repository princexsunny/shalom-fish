"use client";
import { useEffect, useState } from "react";
import { products, discountPct } from "@/lib/products";
import { getData } from "@/lib/store";

export default function LiveMarketBox({ items = products, onSelect }) {
  const [i, setI] = useState(0);
  const [cfg, setCfg] = useState({ enabled: true, speed: 2400 });
  const n = items.length || 1;
  useEffect(() => {
    getData("live", null).then((c) => {
      if (c) setCfg({ enabled: c.enabled !== false, speed: c.speed || 2400 });
    });
  }, []);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % n), cfg.speed);
    return () => clearInterval(t);
  }, [n, cfg.speed]);

  const idx = i % n;
  const p = items[idx];
  if (!p || !cfg.enabled) return null;

  const delta = ((p.price * 7) % 41) - 20; // demo movement
  const up = delta >= 0;

  return (
    <div className="w-fit">
      <button
        type="button"
        onClick={() => onSelect?.(idx)}
        aria-label={`Show ${p.name}`}
        className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-left backdrop-blur transition hover:-translate-y-0.5 hover:border-lime-accent/40"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-accent opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-accent" />
        </span>
        <span className="shrink-0 text-[9px] uppercase tracking-[0.2em] text-aqua/70">Live</span>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image || "/products/seer.jpg"}
          alt={p.name}
          className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
        />

        <div key={idx} className="detail-in min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-semibold text-slate-900">{p.name}</p>
            <span className="shrink-0 text-[9px] text-emerald-glow">● Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-lime-accent">₹{p.price}</span>
            <span className={`flex items-center text-[10px] font-semibold ${up ? "text-emerald-glow" : "text-red-400"}`}>
              {up ? "▲" : "▼"}&nbsp;{up ? "+" : "−"}₹{Math.abs(delta)}
            </span>
            <span className="text-[9px] font-semibold text-discount">{discountPct(p)}% off</span>
          </div>
        </div>
      </button>

      {/* small dot progress bar */}
      <div className="mt-1 flex justify-center gap-1">
        {items.map((_, k) => (
          <span
            key={k}
            className={`h-1 rounded-full transition-all ${k === idx ? "w-2.5 bg-lime-accent" : "w-1 bg-slate-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
