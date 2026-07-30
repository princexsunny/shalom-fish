"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getData } from "@/lib/store";

/**
 * Live Media tile — an autoplaying PHOTO reel that runs entirely inside the 96px
 * tile. No video playback and no play button (removed on request), no tap to
 * open: everything the customer needs is visible in the box.
 *
 * Rules:
 *   • photos advance every PHOTO_MS with a cross-fade
 *   • a single photo just sits there (nothing to rotate to)
 *   • rotation stops when the tile scrolls out of view
 *   • uploaded VIDEOS are shown as their still poster frame, never played, so a
 *     shop that only uploaded clips still gets a picture instead of an empty box
 *
 * Tapping is optional: if the item is linked to a product, it jumps the
 * carousel to that fish. Unlinked items are inert, not fake buttons.
 */

const PHOTO_MS = 4500; // how long each photo holds before the next one

export default function LiveMediaWidget({ onSelectProduct }) {
  const [media, setMedia] = useState([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const boxRef = useRef(null);

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

  // Stills only. A video contributes its poster frame if it has one; a video
  // without a usable poster is dropped rather than rendered as a black square.
  const photos = useMemo(
    () =>
      media
        .map((m) => (m.type === "video" ? (m.thumbnail ? { ...m, url: m.thumbnail } : null) : m))
        .filter((m) => m && m.url),
    [media]
  );
  const count = photos.length;

  // pause when scrolled out of view
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((e) => setVisible(e[0]?.isIntersecting ?? false), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [count]);

  const next = useCallback(() => {
    setIdx((i) => (count ? (i + 1) % count : 0));
  }, [count]);

  useEffect(() => {
    if (count < 2 || !visible) return;
    const t = setTimeout(next, PHOTO_MS);
    return () => clearTimeout(t);
  }, [idx, visible, count, next]);

  // Always render something so the widget slot is visible — an empty placeholder
  // makes it obvious where uploaded media will appear.
  if (!count) {
    return (
      <a
        href="/admin"
        aria-label="Upload live photos in admin"
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
            <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
            <circle cx="12" cy="12" r="3.2" />
            <path d="M17.5 9h.01" />
          </svg>
          <span className="mt-1 block text-[8px] font-semibold leading-tight">
            Live photos
            <br />
            coming soon
          </span>
        </span>
      </a>
    );
  }

  const item = photos[idx % count];
  const linked = Boolean(item.productId && onSelectProduct);

  return (
    <div
      ref={boxRef}
      onClick={linked ? () => onSelectProduct(item.productId) : undefined}
      role={linked ? "button" : undefined}
      tabIndex={linked ? 0 : undefined}
      onKeyDown={linked ? (e) => (e.key === "Enter" || e.key === " ") && onSelectProduct(item.productId) : undefined}
      aria-label={linked ? `View ${item.productName || "product"}` : "Shop photos"}
      className={`relative h-24 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 ${
        linked ? "cursor-pointer transition active:scale-[0.98]" : ""
      }`}
    >
      {/* keyed so each photo fades in cleanly instead of snapping */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={item.url || idx}
        src={item.url}
        alt={item.productName || item.title || "Shop photo"}
        loading="lazy"
        className="media-fade absolute inset-0 h-full w-full object-cover"
      />

      <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur-md">
        Photo
      </span>

      {/* product name so the photo is unambiguous at a glance */}
      {item.productName && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent pb-1 pl-1.5 pr-11 pt-3 text-[9px] font-bold text-white">
          {item.productName}
        </span>
      )}

      {/* reel position — segment bars, capped so 20 photos don't turn the
          bottom edge into a grey smear */}
      {count > 1 && (
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center gap-[3px]">
          {photos.slice(0, 6).map((m, i) => (
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
