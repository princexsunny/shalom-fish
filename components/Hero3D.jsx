"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { products, discountPct } from "@/lib/products";
import { getData } from "@/lib/store";
import LiveMarketBox from "./LiveMarketBox";

// Fills the mobile screen (small side margins), caps out on tablet/desktop.
// 360px → 324px card, 430px → 360px, desktop → 360px.
const CARD_W = "clamp(300px, 90vw, 360px)";
// leaves room for the navbar + category strip above and the live ticker below
const CARD_H = "min(calc(100svh - 250px), 560px)";

const DEFAULT_CATS = ["Premium Catch", "Backwater Special", "Shellfish", "Ready to Cook", "Everyday"];
const CAT_ICONS = {
  "Premium Catch": "★",
  "Backwater Special": "≈",
  Shellfish: "◆",
  "Ready to Cook": "✦",
  Everyday: "●",
};

// weight options (price scales from the per-500g base)
const WEIGHTS = [
  { label: "500 g", mult: 1 },
  { label: "1 kg", mult: 2 },
  { label: "2 kg", mult: 4 },
];

function wrap(raw, n) {
  let r = raw % n;
  if (r > n / 2) r -= n;
  if (r < -n / 2) r += n;
  return r;
}

export default function Hero3D({ cat = "All", onCat = () => {}, onAdd = () => {}, wishlist = {}, onToggleWish = () => {}, cartIds }) {
  // admin-added products (saved in the browser) show up alongside the catalogue
  const [extra, setExtra] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [deleted, setDeleted] = useState([]);
  const [stock, setStock] = useState({});
  const [cats, setCats] = useState(DEFAULT_CATS);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [e, ov, del, st, c] = await Promise.all([
        getData("products", []),
        getData("overrides", {}),
        getData("deleted", []),
        getData("stock", {}),
        getData("categories", null),
      ]);
      if (!alive) return;
      if (Array.isArray(e)) setExtra(e);
      setOverrides(ov || {});
      setDeleted(del || []);
      setStock(st || {});
      if (Array.isArray(c) && c.length) setCats(c);
    };
    load();
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);
  const all = useMemo(() => {
    const base = products
      .filter((p) => !deleted.includes(p.id))
      .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
    return [...extra, ...base];
  }, [extra, overrides, deleted]);
  const list = useMemo(
    () => (cat === "All" ? all : all.filter((p) => p.category === cat)),
    [cat, all]
  );
  const N = list.length;

  const stockStatus = (id) => {
    const n = stock[id] !== undefined ? stock[id] : 20;
    if (n <= 0) return { t: "Out of stock", c: "bg-red-50 text-red-600" };
    if (n < 8) return { t: "Low stock", c: "bg-orange-50 text-orange-600" };
    return { t: "In stock", c: "bg-lime-50 text-lime-700" };
  };

  const chipCats = useMemo(
    () => [
      { id: "All", label: "All", icon: "◎" },
      ...cats.map((c) => ({ id: c, label: c.split(" ")[0], icon: CAT_ICONS[c] || "●" })),
    ],
    [cats]
  );

  const [active, setActive] = useState(0);
  const [weightIdx, setWeightIdx] = useState(0);
  const stageRef = useRef(null);
  const drag = useRef({ on: false, x: 0, moved: false });

  const next = useCallback(() => setActive((a) => (a + 1) % N), [N]);
  const prev = useCallback(() => setActive((a) => (a - 1 + N) % N), [N]);
  const goto = useCallback((i) => setActive((((i % N) + N) % N)), [N]);

  // reset to first card whenever the category changes
  useEffect(() => {
    setActive(0);
  }, [cat]);

  // reset weight selection when the active product changes
  useEffect(() => {
    setWeightIdx(0);
  }, [active, cat]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // GSAP reveal on active/category change
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const card = stage.querySelector(".slide-card.is-active");
    if (!card) return;
    const p = list[active];
    const ctx = gsap.context(() => {
      const img = card.querySelector("[data-img]");
      if (img) gsap.fromTo(img, { scale: 1.14 }, { scale: 1, duration: 0.9, ease: "power3.out" });

      const items = card.querySelectorAll("[data-rv]");
      gsap.fromTo(
        items,
        { y: 18, opacity: 0, filter: "blur(6px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", stagger: 0.07, duration: 0.55, ease: "power3.out", delay: 0.06 }
      );

      const priceEl = card.querySelector("[data-price]");
      if (priceEl && p) {
        const v = { n: 0 };
        gsap.to(v, {
          n: p.price,
          duration: 0.7,
          ease: "power2.out",
          onUpdate: () => (priceEl.textContent = "₹" + Math.round(v.n)),
        });
      }

      // Super Offer: animate discount % into view
      const discEl = card.querySelector("[data-disc]");
      if (discEl && p && p.special) {
        const target = discountPct(p);
        const d = { n: 0 };
        gsap.to(d, {
          n: target,
          duration: 0.8,
          ease: "power2.out",
          onUpdate: () => (discEl.textContent = Math.round(d.n)),
        });
      }

      const cta = card.querySelector("[data-cta]");
      if (cta)
        gsap.fromTo(
          cta,
          { boxShadow: "0 0 0px rgba(163,230,53,0)" },
          { boxShadow: "0 0 42px -6px rgba(163,230,53,0.6)", duration: 0.9, ease: "power2.out" }
        );
    }, stage);
    return () => ctx.revert();
  }, [active, list]);

  // drag / swipe
  // Drag works from ANYWHERE on the card (image or details). Pointer capture is
  // taken only once a real swipe begins, so taps on buttons still land normally.
  const onDown = (e) => {
    drag.current = { on: true, x: e.clientX, y: e.clientY, moved: false, cap: false };
    if (typeof document !== "undefined") document.body.style.cursor = "grabbing";
  };
  const onMove = (e) => {
    if (!drag.current.on) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    // ignore mostly-vertical gestures
    if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dy) > 24) return;
    // touch gets a shorter threshold — 72px is a long swipe on a phone
    const threshold = e.pointerType === "touch" ? 46 : 72;
    if (Math.abs(dx) > threshold) {
      if (!drag.current.cap) {
        try {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          drag.current.cap = true;
        } catch {}
      }
      if (dx > 0) prev();
      else next();
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      drag.current.moved = true;
    }
  };
  const onUp = (e) => {
    if (drag.current.cap) {
      try {
        e?.currentTarget?.releasePointerCapture?.(e.pointerId);
      } catch {}
    }
    drag.current.on = false;
    drag.current.cap = false;
    if (typeof document !== "undefined") document.body.style.cursor = "";
  };

  const cardStyle = (pos) => {
    const a = Math.abs(pos);
    const isA = pos === 0;
    // offset scales with the card so neighbours never overlap on small screens
    const x = `calc(var(--cardW) * ${(pos * 0.66).toFixed(3)})`;
    const z = isA ? 55 : -a * 170;
    const ry = Math.max(-46, Math.min(46, -pos * 33));
    const s = isA ? 1 : Math.max(0.8, 1 - a * 0.1);
    const hidden = a > 3.3;
    return {
      width: CARD_W,
      height: CARD_H,
      transform: `translate(-50%, -50%) translateX(${x}) translateZ(${z}px) rotateY(${ry}deg) scale(${s})`,
      // lighter blur on the light theme — neighbours were washing out to nothing
      filter: isA ? "none" : `blur(${Math.min(1.4, 0.2 + a * 0.5)}px) saturate(0.92)`,
      opacity: hidden ? 0 : 1,
      zIndex: 100 - Math.round(a * 10),
      pointerEvents: hidden ? "none" : "auto",
    };
  };

  return (
    <section id="home" className="relative h-[100svh] w-full overflow-hidden">
      {/* ambient wash */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#f0fdf4_0%,#f8fafc_45%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-emerald-glow/[0.08] blur-[150px]" />
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-lime-accent/[0.05] blur-[150px]" />

      {/* category selector — full-width scrollable strip below the navbar */}
      <div className="absolute inset-x-0 top-[68px] z-[60] sm:top-[64px]">
        <div className="no-scrollbar flex snap-x gap-1 overflow-x-auto px-3 pb-1 sm:justify-center sm:gap-2">
          {chipCats.map((c) => {
            const on = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onCat(c.id)}
                className="flex w-[58px] shrink-0 snap-start flex-col items-center gap-1 py-1 outline-none focus:outline-none focus-visible:outline-none"
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-full text-sm ring-1 transition ${
                    on
                      ? "chip-active bg-lime-accent text-white ring-lime-accent"
                      : "bg-white text-lime-600 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {c.icon}
                </span>
                <span
                  className={`w-full truncate text-center text-[9px] font-medium leading-tight ${
                    on ? "text-lime-700" : "text-slate-500"
                  }`}
                  title={c.id}
                >
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D stage */}
      <div
        ref={stageRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
        className="slider-stage absolute inset-0 z-10 select-none"
        style={{ "--cardW": CARD_W, "--cardH": CARD_H, touchAction: "pan-y" }}
      >
        {/* reflection of active card */}
        {list[active] && (
          <div
            key={"refl-" + cat + active}
            className="slide-reflection"
            style={{ backgroundImage: `url(${list[active].image || "/products/seer.jpg"})` }}
          />
        )}

        {list.map((p, i) => {
          const pos = wrap(i - active, N);
          const isA = pos === 0;
          const stk = stockStatus(p.id);
          return (
            <article
              key={p.id}
              className={`slide-card overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-xl ${isA ? "is-active" : ""} ${
                isA && p.special ? "super-offer-card super-glow" : ""
              }`}
              style={cardStyle(pos)}
              onClick={() => {
                if (!isA && !drag.current.moved) goto(i);
              }}
            >
              {/* media (upper) */}
              <div
                className="slide-media relative w-full flex-none overflow-hidden"
                style={{ flexBasis: isA ? "55%" : "100%" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  data-img
                  src={p.image || "/products/seer.jpg"}
                  alt={p.name}
                  draggable="false"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />

                {isA && (
                  <>
                    {p.special ? (
                      <span className="super-badge absolute left-3 top-3 z-[7] rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide">
                        ★ Super Offer
                      </span>
                    ) : (
                      p.premium && (
                        <span className="absolute left-3 top-3 rounded-full bg-lime-accent/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-900">
                          Premium
                        </span>
                      )
                    )}
                    <span
                      className={`absolute right-3 top-3 z-[7] rounded-full px-3 py-1 text-[11px] font-bold ${
                        p.special ? "super-badge" : "bg-discount text-ink-900"
                      }`}
                    >
                      <span data-disc>{discountPct(p)}</span>% OFF
                    </span>
                    {p.todaysCatch && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-aqua/90 px-3 py-1 text-[11px] font-semibold text-ink-900">
                        Today&apos;s Catch
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Add to wishlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWish(p);
                      }}
                      className={`tap-target absolute bottom-3 right-3 z-10 grid h-11 w-11 place-items-center rounded-full text-lg ring-1 backdrop-blur transition active:scale-90 ${
                        wishlist[p.id]
                          ? "bg-lime-accent text-ink-900 ring-lime-accent"
                          : "bg-white/90 text-lime-600 ring-slate-200 hover:bg-white"
                      }`}
                    >
                      {wishlist[p.id] ? "♥" : "♡"}
                    </button>
                  </>
                )}

                {!isA && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent p-3 pt-10 text-center">
                    <span className="font-display text-sm font-bold text-slate-800">{p.name}</span>
                  </div>
                )}
              </div>

              {/* details (lower) */}
              {isA && (
                <div className="flex min-h-0 flex-1 flex-col justify-between gap-1 border-t border-slate-100 bg-white px-4 py-2.5">
                  <div>
                    <p data-rv className="text-[10px] uppercase tracking-[0.22em] text-aqua/70">
                      {p.category}
                    </p>
                    <h3 data-rv className="font-display text-xl font-extrabold leading-tight text-gradient">
                      {p.name}
                      {p.local && p.local !== "—" && (
                        <span className="ml-1 align-middle text-xs font-medium text-slate-400">· {p.local}</span>
                      )}
                    </h3>
                    <div data-rv className="mt-1 flex items-center gap-1.5 text-[11px]">
                      <span className="text-lime-accent">
                        {"★★★★★".split("").map((s, k) => (
                          <span key={k} className={k < Math.round(p.rating) ? "opacity-100" : "opacity-25"}>
                            ★
                          </span>
                        ))}
                      </span>
                      <span className="text-slate-600">{p.rating.toFixed(1)}</span>
                      <span className="text-slate-300">({p.reviews})</span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-semibold ${stk.c}`}>
                        {stk.t}
                      </span>
                    </div>
                  </div>

                  {/* weight + price */}
                  <div>
                    <div data-rv className="flex gap-2">
                      {WEIGHTS.map((wt, k) => (
                        <button
                          key={wt.label}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWeightIdx(k);
                          }}
                          className={`min-h-[36px] rounded-xl px-4 py-1.5 text-xs font-semibold ring-1 transition active:scale-95 ${
                            k === weightIdx
                              ? "bg-lime-50 text-lime-700 ring-lime-accent"
                              : "bg-slate-50 text-slate-600 ring-slate-200 hover:text-slate-900"
                          }`}
                        >
                          {wt.label}
                        </button>
                      ))}
                    </div>

                    <div data-rv className="mt-2 flex items-baseline gap-1.5">
                      <span data-price className="text-xl font-bold text-lime-accent">
                        ₹{Math.round(p.price * WEIGHTS[weightIdx].mult)}
                      </span>
                      <span className="text-[11px] text-slate-500">/{WEIGHTS[weightIdx].label}</span>
                      {p.oldPrice > p.price && (
                        <span className="ml-1 text-sm text-slate-400 line-through">
                          ₹{Math.round(p.oldPrice * WEIGHTS[weightIdx].mult)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    data-cta
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const w = WEIGHTS[weightIdx];
                      onAdd({
                        id: p.id,
                        name: p.name,
                        image: p.image,
                        weight: w.label,
                        price: Math.round(p.price * w.mult),
                      });
                    }}
                    className={`min-h-[46px] w-full shrink-0 rounded-2xl px-5 py-3 font-semibold uppercase tracking-wide transition active:scale-[0.98] hover:brightness-110 ${
                      cartIds && cartIds.has(p.id)
                        ? "bg-emerald-glow text-ink-900 ring-2 ring-lime-accent"
                        : "bg-lime-accent text-ink-900"
                    }`}
                  >
                    {cartIds && cartIds.has(p.id) ? "Added ✓" : "Add to Cart"}
                  </button>
                </div>
              )}

              {/* Super Offer overlays */}
              {isA && p.special && (
                <>
                  <span className="super-shimmer" />
                  <span className="super-spark" style={{ top: "12%", left: "16%" }} />
                  <span className="super-spark" style={{ top: "26%", right: "14%", animationDelay: "0.8s" }} />
                  <span className="super-spark" style={{ bottom: "40%", left: "22%", animationDelay: "1.6s" }} />
                  <span className="super-spark" style={{ top: "50%", right: "20%", animationDelay: "2.3s" }} />
                </>
              )}
            </article>
          );
        })}
      </div>

      {/* prev / next with position counter */}
      <button
        onClick={prev}
        aria-label="Previous product"
        className="glass absolute left-3 top-1/2 tap-target z-30 hidden h-11 w-11 -translate-y-1/2 flex-col items-center justify-center rounded-full text-slate-700 shadow-frost ring-1 ring-lime-accent/40 transition active:scale-95 hover:text-lime-accent md:flex"
      >
        <span className="text-[9px] leading-none">‹</span>
        <span className="text-[9px] font-bold leading-none text-lime-accent">
          {String(active + 1).padStart(2, "0")}
        </span>
        <span className="text-[6px] leading-none text-slate-400">/{String(N).padStart(2, "0")}</span>
      </button>
      <button
        onClick={next}
        aria-label="Next product"
        className="glass absolute right-3 top-1/2 tap-target z-30 hidden h-11 w-11 -translate-y-1/2 flex-col items-center justify-center rounded-full text-slate-700 shadow-frost ring-1 ring-lime-accent/40 transition active:scale-95 hover:text-lime-accent md:flex"
      >
        <span className="text-[9px] leading-none">›</span>
        <span className="text-[9px] font-bold leading-none text-lime-accent">
          {String((((active + 1) % N) + 1)).padStart(2, "0")}
        </span>
        <span className="text-[6px] leading-none text-slate-400">/{String(N).padStart(2, "0")}</span>
      </button>

      {/* live fish market — centred below the card, visible on mobile too */}
      <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center px-3 sm:bottom-4 sm:justify-start sm:px-0 sm:pl-3">
        <LiveMarketBox items={list} onSelect={(idx) => goto(idx)} />
      </div>

      {/* headline — bottom right, sits behind the moving cards */}
      <div className="pointer-events-none absolute bottom-[0.5vh] right-2 z-[1] hidden text-right sm:right-4 md:block">
        <h1 className="font-display text-2xl font-extrabold leading-[1] text-gradient opacity-90 sm:text-3xl md:text-4xl">
          Fresh from the Sea
        </h1>
        <p className="mt-1.5 text-[10px] uppercase tracking-[0.3em] text-aqua/60 sm:text-[11px]">
          Kerala&apos;s Ocean · Delivered in 8 Minutes
        </p>
      </div>
    </section>
  );
}
