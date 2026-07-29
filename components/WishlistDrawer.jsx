"use client";
import { useEffect } from "react";

export default function WishlistDrawer({ open, onClose, items = [], onRemove = () => {}, onAdd = () => {} }) {
  // stop the page scrolling behind the drawer on touch devices
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white ring-1 ring-slate-200 shadow-2xl transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Wishlist <span className="text-sm font-normal text-slate-400">({items.length})</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close wishlist"
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:text-lime-accent"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overscroll-contain overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-slate-400">
              <div>
                <p className="text-4xl text-lime-accent">♥</p>
                <p className="mt-3 text-sm">No saved items yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <div key={p.id} className="glass rounded-2xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-aqua/70">{p.category}</p>
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-400">{p.local}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-base font-bold text-lime-accent">₹{p.price}</span>
                        <span className="text-xs text-slate-400 line-through">₹{p.oldPrice}</span>
                        <span className="text-[11px] text-slate-500">/ {p.unit}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(p)}
                      aria-label="Remove"
                      className="shrink-0 text-slate-400 transition hover:text-discount"
                    >
                      ✕
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      onAdd({ id: p.id, name: p.name, image: p.image, weight: p.unit || "500 g", price: p.price })
                    }
                    className="mt-2 w-full rounded-xl bg-lime-accent/15 py-2 text-sm font-semibold text-lime-accent ring-1 ring-lime-accent/30 transition hover:bg-lime-accent hover:text-ink-900"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
