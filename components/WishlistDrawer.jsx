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
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-slate-50 shadow-2xl ring-1 ring-slate-200 transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Wishlist</h2>
            <p className="text-xs text-slate-500">
              {items.length} Saved {items.length === 1 ? "Item" : "Items"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close wishlist"
            className="grid h-10 w-10 place-items-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-slate-400">
              <div>
                <p className="text-4xl text-lime-600">♡</p>
                <p className="mt-3 text-sm">No saved items yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="flex gap-3.5">
                    {/* thumbnail — the biggest recognition win */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image || "/products/seer.jpg"}
                      alt={p.name}
                      className="h-[76px] w-[76px] shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-bold leading-tight text-slate-900">{p.name}</p>
                          {p.local && p.local !== "—" && (
                            <p className="mt-1 text-xs text-slate-400">{p.local}</p>
                          )}
                          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-aqua/80">
                            {p.category}
                          </p>
                        </div>
                        <button
                          onClick={() => onRemove(p)}
                          aria-label={`Remove ${p.name}`}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-base text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-[19px] font-extrabold leading-none text-lime-700">₹{p.price}</span>
                        {p.oldPrice > p.price && (
                          <span className="text-xs text-slate-400 line-through">₹{p.oldPrice}</span>
                        )}
                        <span className="text-[11px] text-slate-400">/ {p.unit}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onAdd({
                        id: p.id,
                        name: p.name,
                        image: p.image,
                        category: p.category,
                        weight: p.unit || "500 g",
                        price: p.price,
                        oldPrice: p.oldPrice || p.price,
                      })
                    }
                    className="mt-3.5 h-12 w-full rounded-xl bg-lime-600 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition active:scale-[0.98] hover:bg-lime-700"
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
