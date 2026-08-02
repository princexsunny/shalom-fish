"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { products, discountPct } from "@/lib/products";
import { getData } from "@/lib/store";
import LiveStockWidget from "./LiveStockWidget";
import LiveMediaWidget from "./LiveMediaWidget";

// Layout comes from CSS custom properties defined in globals.css (:root) so the
// budget lives in ONE place and adapts per height class. No magic numbers here.
const CARD_W = "var(--card-w)";
const CARD_H = "var(--card-h)";
const TOP_OFFSET = "var(--top-offset)";

const DEFAULT_CATS = ["Marine", "Brackish", "Freshwater"];
const CAT_ICONS = { Marine: "≋", Brackish: "≈", Freshwater: "◦" };

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

export default function Hero3D({
  cat = "All",
  onCat = () => {},
  onAdd = () => {},
  wishlist = {},
  onToggleWish = () => {},
  cartIds,
  query = "",
}) {
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
    // `hidden` products are excluded here, once, so nothing downstream (cards,
    // search, live stock, media links) can accidentally surface them.
    return [...extra, ...base].filter((p) => !p.hidden);
  }, [extra, overrides, deleted]);
  const list = useMemo(() => {
    const byCat = cat === "All" ? all : all.filter((p) => p.category === cat);
    const q = query.trim().toLowerCase();
    if (!q) return byCat;
    return byCat.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.local || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [cat, all, query]);
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
      // short label so the whole row fits a phone screen without scrolling
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
  // Entry animation for the active card. This used to be GSAP; it's now the
  // native Web Animations API + one rAF counter, which does the same job with
  // no 60KB dependency. Only transform/opacity animate, so it stays on the
  // compositor and doesn't repaint.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const card = stage.querySelector(".slide-card.is-active");
    if (!card) return;
    const p = list[active];

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const anims = [];
    const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

    if (!reduce) {
      const img = card.querySelector("[data-img]");
      if (img) {
        anims.push(
          img.animate([{ transform: "scale(1.14)" }, { transform: "scale(1)" }], {
            duration: 900,
            easing: EASE,
            fill: "backwards",
          })
        );
      }

      // staggered detail reveal — delay replaces GSAP's `stagger`
      card.querySelectorAll("[data-rv]").forEach((el, i) => {
        anims.push(
          el.animate([{ transform: "translateY(14px)", opacity: 0 }, { transform: "none", opacity: 1 }], {
            duration: 420,
            delay: 40 + i * 50,
            easing: EASE,
            fill: "backwards",
          })
        );
      });
    }

    // number count-ups. One rAF loop drives every counter, so adding a second
    // one doesn't cost a second animation frame subscription.
    const priceEl = card.querySelector("[data-price]");
    const discEl = card.querySelector("[data-disc]");
    const counters = [];
    if (priceEl && p) counters.push({ el: priceEl, to: p.price, ms: 700, fmt: (n) => "₹" + Math.round(n) });
    if (discEl && p && p.special) {
      counters.push({ el: discEl, to: discountPct(p), ms: 800, fmt: (n) => String(Math.round(n)) });
    }

    let raf = 0;
    if (counters.length) {
      if (reduce) {
        counters.forEach((c) => (c.el.textContent = c.fmt(c.to)));
      } else {
        const t0 = performance.now();
        const tick = (t) => {
          let running = false;
          for (const c of counters) {
            const k = Math.min(1, (t - t0) / c.ms);
            // easeOutQuad — matches the old power2.out closely enough
            c.el.textContent = c.fmt(c.to * (1 - (1 - k) * (1 - k)));
            if (k < 1) running = true;
          }
          if (running) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
    }

    return () => {
      anims.forEach((a) => a.cancel());
      if (raf) cancelAnimationFrame(raf);
      // leave the final values on screen rather than snapping back to 0
      counters.forEach((c) => (c.el.textContent = c.fmt(c.to)));
    };
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
      // NO css filter/blur here — it forces a repaint every frame and was the
      // main cause of the stutter. Depth is conveyed with opacity + scale only,
      // which the compositor can animate on the GPU at 60fps.
      opacity: hidden ? 0 : isA ? 1 : Math.max(0.42, 0.85 - a * 0.22),
      zIndex: 100 - Math.round(a * 10),
      pointerEvents: hidden ? "none" : "auto",
    };
  };

  return (
    <section id="home" className="relative h-[100svh] w-full overflow-hidden">
      {/* ambient wash */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#d3e3da_0%,#dae3e9_45%,#dde5ea_100%)]" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-emerald-glow/[0.08] blur-[150px]" />
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-lime-accent/[0.05] blur-[150px]" />

      {/* category nav — ONE pill container, only the active item highlighted */}
      <div
        className="cat-bar absolute inset-x-0 z-[60] px-4"
        style={{ top: "calc(var(--header-h) + var(--search-h) + 6px)" }}
      >
        <div className="no-scrollbar mx-auto flex max-w-md snap-x items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-[#0b4148] p-[3px] shadow-sm backdrop-blur-md">
          {chipCats.map((c) => {
            const on = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onCat(c.id)}
                title={c.id}
                className={`flex h-8 shrink-0 snap-start items-center whitespace-nowrap rounded-full px-3.5 text-[11px] font-bold uppercase tracking-wide outline-none transition-all duration-300 focus:outline-none ${
                  on ? "bg-lime-500 text-teal-950 shadow-sm" : "text-teal-100/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {c.label}
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
            style={{ backgroundImage: `url(${list[active].image || "/products/_placeholder.svg"})` }}
          />
        )}

        {list.map((p, i) => {
          const pos = wrap(i - active, N);
          const isA = pos === 0;
          const stk = stockStatus(p.id);
          return (
            <article
              key={p.id}
              className={`slide-card flex flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xl ${isA ? "is-active" : ""} ${
                isA && p.special ? "super-offer-card super-glow" : ""
              }`}
              style={cardStyle(pos)}
              onClick={() => {
                if (!isA && !drag.current.moved) goto(i);
              }}
            >
              {/* media (upper) */}
              {/* image takes ALL space left over after the details block, so it is
                  as tall as possible and the details can never be squeezed */}
              <div
                className={`slide-media relative w-full overflow-hidden ${isA ? "min-h-0 flex-1" : "flex-none"}`}
                style={isA ? undefined : { flexBasis: "100%" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  data-img
                  src={p.image || "/products/neymeen.jpg"} onError={(e) => {
                        if (e.currentTarget.dataset.fb) return;
                        e.currentTarget.dataset.fb = "1";
                        e.currentTarget.src = "/products/_placeholder.svg";
                      }}
                  alt={p.name}
                  draggable="false"
                  loading={isA ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                {/* no scrim on the active card — the photo stays fully clear */}

                {isA && (
                  <>
                    {p.special ? (
                      <span className="super-badge absolute left-3 top-3 z-[7] rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide">
                        ★ Super Offer
                      </span>
                    ) : (
                      p.premium && (
                        <span className="absolute left-3 top-3 flex h-[30px] items-center rounded-full bg-lime-600/80 px-3 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg ring-1 ring-white/40 backdrop-blur-md">
                          Premium
                        </span>
                      )
                    )}
                    {/* discount — smaller, pill-shaped */}
                    <span
                      className={`absolute right-3 top-3 z-[7] flex h-[30px] items-center rounded-full px-2.5 text-[11px] font-bold shadow-lg ${
                        p.special
                          ? "super-badge"
                          : "bg-orange-500/80 text-white ring-1 ring-white/40 backdrop-blur-md"
                      }`}
                    >
                      <span data-disc>{discountPct(p)}</span>% OFF
                    </span>
                    {/* Today's Catch — brand green, not blue */}
                    {p.todaysCatch && (
                      <span className="absolute bottom-3 left-3 flex h-[30px] items-center rounded-full bg-emerald-800/60 px-3 text-[11px] font-semibold text-white shadow-lg ring-1 ring-white/35 backdrop-blur-md">
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
                      className={`absolute right-3 top-[52px] z-10 grid h-11 w-11 place-items-center rounded-full text-lg shadow-lg ring-1 backdrop-blur-md transition active:scale-90 ${
                        wishlist[p.id]
                          ? "bg-lime-500/85 text-white ring-white/50"
                          : "bg-white/25 text-white ring-white/45 hover:bg-white/35"
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

              {/* Details height is CONTENT-DRIVEN (shrink-0, auto height). A fixed
                  height clips the CTA as soon as the content is taller than it —
                  which is exactly what was happening. The image (flex-1) absorbs
                  whatever height is left over. */}
              {isA && (
                <div className="flex shrink-0 flex-col gap-1.5 border-t border-slate-100 bg-white px-4 pb-3.5 pt-2.5">
                  <div>
                    <p data-rv className="text-[10px] font-semibold uppercase tracking-[0.18em] text-aqua/80">
                      {p.category}
                    </p>
                    <h3 data-rv className="font-display mt-1 text-[23px] font-extrabold leading-none text-slate-900">
                      {p.name}
                    </h3>
                    {p.local && p.local !== "—" && (
                      <p data-rv className="mt-0.5 text-xs font-medium text-slate-400">{p.local}</p>
                    )}
                    <div data-rv className="mt-2 flex items-center gap-1.5 text-[11px]">
                      <span className="text-lime-600">
                        {"★★★★★".split("").map((s, k) => (
                          <span key={k} className={k < Math.round(p.rating) ? "opacity-100" : "opacity-25"}>
                            ★
                          </span>
                        ))}
                      </span>
                      <span className="font-semibold text-slate-700">{p.rating.toFixed(1)}</span>
                      <span className="text-slate-400">({p.reviews})</span>
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

                    <div data-rv className="mt-1.5 flex items-baseline gap-2.5">
                      <span data-price className="text-[26px] font-extrabold leading-none text-lime-700">
                        ₹{Math.round(p.price * WEIGHTS[weightIdx].mult)}
                      </span>
                      <span className="text-xs text-slate-500">/{WEIGHTS[weightIdx].label}</span>
                      {p.oldPrice > p.price && (
                        <span className="text-sm text-slate-400 line-through">
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
                        category: p.category,
                        weight: w.label,
                        price: Math.round(p.price * w.mult),
                        oldPrice: Math.round((p.oldPrice || p.price) * w.mult),
                      });
                    }}
                    className={`h-[52px] w-full shrink-0 rounded-[20px] px-5 text-[16px] font-bold uppercase tracking-wide transition active:scale-[0.98] hover:brightness-105 ${
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

      {/* Live tiles — flat, sitting UNDER the card with a small gap, matched to
          the card width and splitting the space evenly. */}
      <div
        className="live-tiles absolute left-1/2 z-40 -translate-x-1/2"
        style={{ width: CARD_W, top: `calc(${TOP_OFFSET} + ${CARD_H} + var(--gap-bottom))`, paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="flex gap-2.5">
          <LiveStockWidget
            onSelect={(id) => {
              const k = list.findIndex((p) => p.id === id);
              if (k >= 0) goto(k);
            }}
          />
          <LiveMediaWidget
            onSelectProduct={(id) => {
              const k = list.findIndex((p) => String(p.id) === String(id));
              if (k >= 0) goto(k);
            }}
          />
        </div>
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
