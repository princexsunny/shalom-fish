"use client";
import { useEffect } from "react";

const DELIVERY = 40;
const FREE_ABOVE = 499;
const CLEAN_FEE = 20;
const GST_RATE = 0.18;

export default function CartDrawer({ open, onClose, cart, setCart }) {
  // stop the page scrolling behind the drawer on touch devices
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const inc = (key) => setCart((c) => c.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x)));
  const dec = (key) =>
    setCart((c) => c.flatMap((x) => (x.key === key ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x])));
  const remove = (key) => setCart((c) => c.filter((x) => x.key !== key));
  const toggleClean = (key) => setCart((c) => c.map((x) => (x.key === key ? { ...x, cleaning: !x.cleaning } : x)));

  const itemsTotal = cart.reduce((s, x) => s + (x.price + (x.cleaning ? CLEAN_FEE : 0)) * x.qty, 0);
  const gst = Math.round(itemsTotal * GST_RATE);
  const delivery = itemsTotal === 0 ? 0 : itemsTotal >= FREE_ABOVE ? 0 : DELIVERY;
  const total = itemsTotal + gst + delivery;

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
            Your Cart <span className="text-sm font-normal text-slate-400">({cart.reduce((n, x) => n + x.qty, 0)})</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:text-lime-accent"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overscroll-contain overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-slate-400">
              <div>
                <p className="text-4xl">🛒</p>
                <p className="mt-3 text-sm">Your cart is empty</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((x) => (
                <div key={x.key} className="glass rounded-2xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{x.name}</p>
                      <p className="text-xs text-slate-500">{x.weight}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        ₹{x.price} × {x.qty}
                        {x.cleaning ? ` + ₹${CLEAN_FEE} clean × ${x.qty}` : ""} ={" "}
                        <span className="font-semibold text-lime-accent">
                          ₹{(x.price + (x.cleaning ? CLEAN_FEE : 0)) * x.qty}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <button onClick={() => remove(x.key)} className="text-xs text-slate-400 hover:text-discount">
                        Remove
                      </button>
                      <div className="flex items-center gap-2 rounded-full bg-slate-50 px-1 ring-1 ring-slate-200">
                        <button onClick={() => dec(x.key)} className="grid h-6 w-6 place-items-center text-slate-600 hover:text-lime-accent">
                          −
                        </button>
                        <span className="w-4 text-center text-sm text-slate-900">{x.qty}</span>
                        <button onClick={() => inc(x.key)} className="grid h-6 w-6 place-items-center text-slate-600 hover:text-lime-accent">
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* clean & cut per item */}
                  <button
                    onClick={() => toggleClean(x.key)}
                    className={`mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] ring-1 transition ${
                      x.cleaning
                        ? "bg-lime-accent/15 text-lime-accent ring-lime-accent"
                        : "bg-slate-50 text-slate-500 ring-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`grid h-4 w-4 place-items-center rounded text-[10px] ${
                        x.cleaning ? "bg-lime-accent text-ink-900" : "ring-1 ring-slate-300"
                      }`}
                    >
                      {x.cleaning ? "✓" : ""}
                    </span>
                    Clean &amp; cut
                    <span className="ml-auto text-slate-500">+₹{CLEAN_FEE}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <footer className="border-t border-slate-200 px-5 py-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{itemsTotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18%)</span>
                <span>₹{gst}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span className={delivery === 0 ? "text-lime-accent" : ""}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
              </div>
              {itemsTotal < FREE_ABOVE && (
                <p className="text-[11px] text-aqua/70">Add ₹{FREE_ABOVE - itemsTotal} more for free delivery</p>
              )}
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>Total</span>
                <span className="text-lime-accent">₹{total}</span>
              </div>
            </div>
            <button className="mt-4 w-full rounded-2xl bg-lime-accent px-5 py-3 font-semibold text-ink-900 shadow-glow-lime transition hover:brightness-110">
              Checkout
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
