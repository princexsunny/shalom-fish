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

  if (!media.length) return null;

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
        aria-label="Open live media"
        className="relative h-[90px] w-[90px] overflow-hidden rounded-2xl border border-white/60 bg-slate-900 shadow-lg transition active:scale-95"
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

        {/* LIVE chip */}
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur">
          <span className="h-1 w-1 rounded-full bg-red-500" /> Live
        </span>

        {item.type === "video" && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-black/45 text-[10px] text-white backdrop-blur">
              ▶
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
