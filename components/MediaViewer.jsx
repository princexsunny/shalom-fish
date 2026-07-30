"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fullscreen media viewer.
 * - videos: play/pause, mute toggle, progress bar
 * - images: pinch-to-zoom (native, via touch-action) and swipe
 * - swipe left/right or arrow keys to move between items
 */
export default function MediaViewer({ items = [], index = 0, onClose = () => {} }) {
  const [i, setI] = useState(index);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const touch = useRef({ x: 0, y: 0, active: false });

  const n = items.length;
  const item = items[i];

  const go = useCallback(
    (d) => {
      setI((v) => (v + d + n) % n);
      setProgress(0);
      setPlaying(true);
    },
    [n]
  );

  useEffect(() => setI(index), [index]);

  // lock page scroll + keyboard controls
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose]);

  // keep the <video> in sync with play/mute state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing, muted, i]);

  if (!item) return null;

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, active: true };
  };
  const onTouchEnd = (e) => {
    if (!touch.current.active) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current.active = false;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90) onClose();
  };

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-black" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl backdrop-blur transition hover:bg-white/20"
        >
          ×
        </button>
        <span className="text-xs font-medium text-white/70">
          {i + 1} / {n}
        </span>
        {item.type === "video" ? (
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-base backdrop-blur transition hover:bg-white/20"
          >
            {muted ? "🔇" : "🔊"}
          </button>
        ) : (
          <span className="h-10 w-10" />
        )}
      </div>

      {/* media */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {item.type === "video" ? (
          <video
            ref={videoRef}
            key={item.url}
            src={item.url}
            poster={item.thumbnail || undefined}
            className="max-h-full max-w-full"
            playsInline
            loop
            autoPlay
            muted={muted}
            onClick={() => setPlaying((p) => !p)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress((v.currentTime / v.duration) * 100);
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.url}
            src={item.url}
            alt={item.title || "Live media"}
            className="max-h-full max-w-full object-contain"
            style={{ touchAction: "pinch-zoom" }}
            draggable="false"
          />
        )}

        {/* desktop arrows */}
        {n > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:grid"
            >
              ‹
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:grid"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* bottom: title, progress, play control */}
      <div className="px-4 pb-6 pt-3 text-white">
        {item.type === "video" && (
          <>
            <div className="mb-3 h-[3px] w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-lime-400 transition-[width] duration-200" style={{ width: `${progress}%` }} />
            </div>
            <div className="mb-2 flex items-center gap-3">
              <button
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause" : "Play"}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-base backdrop-blur transition hover:bg-white/25"
              >
                {playing ? "❚❚" : "▶"}
              </button>
              {item.duration > 0 && <span className="text-xs text-white/60">{item.duration}s</span>}
            </div>
          </>
        )}
        <p className="text-sm font-semibold">{item.title || (item.type === "video" ? "Live video" : "Live photo")}</p>
        {n > 1 && <p className="mt-1 text-[11px] text-white/50">Swipe to browse · swipe down to close</p>}
      </div>
    </div>
  );
}
