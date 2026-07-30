"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getData } from "@/lib/store";

/**
 * Live Media tile — an AUTOPLAYING PLAYLIST that runs entirely inside the 96px
 * tile. Videos DO play here; there is simply no play button, no pause control
 * and no fullscreen viewer — the reel runs itself, so a control would only sit
 * on top of a video that is already playing.
 *
 * Playback rules:
 *   • videos play to their natural end, then the next item comes up
 *   • images hold for IMAGE_MS
 *   • a long or broken clip is capped at MAX_VIDEO_MS so the reel never stalls
 *   • a single item loops forever (no point cross-fading to itself)
 *   • everything pauses when the tile scrolls out of view (saves battery/data)
 *
 * Tapping is optional: if the item is linked to a product, it jumps the
 * carousel to that fish. Unlinked items are inert, not fake buttons.
 */

const IMAGE_MS = 4500; // how long a photo holds before the next item
const MAX_VIDEO_MS = 15000; // safety cap — some encodes never fire "ended"

export default function LiveMediaWidget({ onSelectProduct }) {
  const [media, setMedia] = useState([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const boxRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const md = await getData("media", []);
      if (alive) setMedia(Array.isArray(md) ? md : []);
    };
    load();
    window.addEventListener("focus", load);
    return () => {
      alive = false;
      window.removeEventListener("focus", load);
    };
  }, []);

  // pause when scrolled out of view
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((e) => setVisible(e[0]?.isIntersecting ?? false), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [media.length]);

  const count = media.length;
  const next = useCallback(() => {
    setIdx((i) => (count ? (i + 1) % count : 0));
  }, [count]);

  // advance timer — images on a fixed hold, videos on a safety cap only
  // (their real trigger is onEnded, which usually fires first)
  useEffect(() => {
    if (count < 2 || !visible) return;
    const it = media[idx % count];
    if (!it) return;
    const ms =
      it.type === "video"
        ? Math.min(Math.max((it.duration || 0) * 1000 + 900, 6000), MAX_VIDEO_MS)
        : IMAGE_MS;
    const t = setTimeout(next, ms);
    return () => clearTimeout(t);
  }, [idx, visible, media, count, next]);

  // keep the <video> in sync with visibility and the current slot
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (visible) v.play().catch(() => {});
    else v.pause();
  }, [visible, idx, media]);

  // Always render something so the widget slot is visible — an empty placeholder
  // makes it obvious where uploaded media will appear.
  if (!count) {
    return (
      <a
        href="/admin"
        aria-label="Upload live media in admin"
        className="grid h-24 flex-1 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center transition hover:border-lime-400"
      >
        <span className="px-1 text-slate-400">
          <svg
            viewBox="0 0 24 24"
            className="mx-auto h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2.5" y="6.5" width="13" height="11" rx="2.5" />
            <path d="m15.5 11.2 6-3v7.6l-6-3z" />
          </svg>
          <span className="mt-1 block text-[8px] font-semibold leading-tight">
            Live media
            <br />
            coming soon
          </span>
        </span>
      </a>
    );
  }

  const item = media[idx % count];
  const linked = Boolean(item.productId && onSelectProduct);

  return (
    <div
      ref={boxRef}
      onClick={linked ? () => onSelectProduct(item.productId) : undefined}
      role={linked ? "button" : undefined}
      tabIndex={linked ? 0 : undefined}
      onKeyDown={linked ? (e) => (e.key === "Enter" || e.key === " ") && onSelectProduct(item.productId) : undefined}
      aria-label={linked ? `View ${item.productName || "product"}` : "Shop media reel"}
      className={`relative h-24 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 ${
        linked ? "cursor-pointer transition active:scale-[0.98]" : ""
      }`}
    >
      {/* keyed so each slot cross-fades in cleanly instead of snapping */}
      <div key={item.url || idx} className="media-fade absolute inset-0">
        {item.type === "video" ? (
          <video
            ref={videoRef}
            src={item.url}
            poster={item.thumbnail || undefined}
            className="h-full w-full object-cover"
            playsInline
            muted
            loop={count === 1}
            preload="metadata"
            onEnded={count > 1 ? next : undefined}
            onError={count > 1 ? next : undefined}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.title || "Live"} loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Type chip. NOTE: this is an admin-uploaded clip, not a live stream —
          a red "LIVE" dot would imply real-time broadcast, so we show the
          media type + duration instead. */}
      <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur-md">
        {item.type === "video" ? (item.duration ? `${item.duration}s` : "Video") : "Photo"}
      </span>

      {/* product name so the photo is unambiguous at a glance */}
      {item.productName && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent pb-1 pl-1.5 pr-11 pt-3 text-[9px] font-bold text-white">
          {item.productName}
        </span>
      )}

      {/* playlist position — segment bars, capped so 20 clips don't turn the
          bottom edge into a grey smear */}
      {count > 1 && (
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center gap-[3px]">
          {media.slice(0, 6).map((m, i) => (
            <span
              key={m.url || i}
              className={`h-[3px] rounded-full transition-all duration-300 ${
                i === idx % count ? "w-3 bg-white" : "w-[3px] bg-white/45"
              }`}
            />
          ))}
          {count > 6 && <span className="text-[7px] font-bold text-white/70">+{count - 6}</span>}
        </span>
      )}
    </div>
  );
}
