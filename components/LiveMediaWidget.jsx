"use client";
import { useEffect, useRef, useState } from "react";
import { getData } from "@/lib/store";
import MediaViewer from "./MediaViewer";

export default function LiveMediaWidget() {
  const [media, setMedia] = useState([]);
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (visible && !open) v.play().catch(() => {});
    else v.pause();
  }, [visible, open, media]);

  // Always render something so the widget slot is visible — an empty placeholder
  // makes it obvious where uploaded media will appear.
  if (!media.length) {
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

  // latest video wins; otherwise the latest image
  const latestVideo = media.find((m) => m.type === "video");
  const item = latestVideo || media[0];
  const startIndex = Math.max(0, media.indexOf(item));

  return (
    <>
      <button
        ref={boxRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open shop media"
        className="relative h-24 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 transition active:scale-[0.98]"
      >
        {item.type === "video" ? (
          <video
            ref={videoRef}
            key={item.url}
            src={item.url}
            poster={item.thumbnail || undefined}
            className="h-full w-full object-cover"
            playsInline
            muted
            loop
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.title || "Live"} loading="lazy" className="h-full w-full object-cover" />
        )}

        {/* Type chip. NOTE: this is an admin-uploaded clip, not a live stream —
            a red "LIVE" dot would imply real-time broadcast, so we show the
            media type + duration instead. */}
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur-md">
          {item.type === "video" ? (
            <>
              <svg viewBox="0 0 24 24" className="h-2 w-2" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              {item.duration ? `${item.duration}s` : "Video"}
            </>
          ) : (
            "Photo"
          )}
        </span>

        {item.type === "video" && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/25 text-white ring-1 ring-white/45 backdrop-blur-md">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-3 w-3" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        )}

        {media.length > 1 && (
          <span className="absolute bottom-1 right-1.5 text-[8px] font-semibold text-white/85 drop-shadow">
            {media.length}
          </span>
        )}
      </button>

      {open && <MediaViewer items={media} index={startIndex} onClose={() => setOpen(false)} />}
    </>
  );
}
