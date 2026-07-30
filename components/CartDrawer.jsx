"use client";
import { useEffect, useState } from "react";
import CheckoutSheet from "./CheckoutSheet";

const DELIVERY = 40;
const FREE_ABOVE = 499;
const CLEAN_FEE = 20;
const GST_RATE = 0.18;

export default function CartDrawer({ open, onClose, cart, setCart }) {
  const [checkout, setCheckout] = useState(false);
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
  const savings = cart.reduce((s, x) => s + Math.max(0, (x.oldPrice || x.price) - x.price) * x.qty, 0);
  const gst = Math.round(itemsTotal * GST_RATE);
  const delivery = itemsTotal === 0 ? 0 : itemsTotal >= FREE_ABOVE ? 0 : DELIVERY;
  const total = itemsTotal + gst + delivery;
  const count = cart.reduce((n, x) => n + x.qty, 0);

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
            <h2 className="font-display text-lg font-bold text-slate-900">Your Cart</h2>
            <p className="text-xs text-slate-500">
              {count} {count === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="grid h-10 w-10 place-items-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
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
                <div key={x.key} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="flex gap-3.5">
                    {/* thumbnail */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={x.image || "/products/seer.jpg"}
                      alt={x.name}
                      className="h-[68px] w-[68px] shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-bold leading-tight text-slate-900">{x.name}</p>
                          <p className="mt-1 text-[11px] font-medium text-slate-400">{x.category || "Fresh Seafood"}</p>
                        </div>
                        <button
                          onClick={() => remove(x.key)}
                          aria-label={`Remove ${x.name}`}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                        >
                          🗑
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] text-slate-400">{x.weight}</p>
                          <p className="text-[17px] font-extrabold leading-tight text-lime-700">
                            ₹{(x.price + (x.cleaning ? CLEAN_FEE : 0)) * x.qty}
                          </p>
                        </div>

                        {/* quantity capsule */}
                        <div className="flex h-11 items-center gap-1 rounded-full bg-slate-100 px-1.5">
                          <button
                            onClick={() => dec(x.key)}
                            aria-label="Decrease quantity"
                            className="grid h-9 w-9 place-items-center rounded-full text-lg font-bold text-slate-600 transition active:scale-90 hover:bg-white hover:text-lime-700"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-slate-900">{x.qty}</span>
                          <button
                            onClick={() => inc(x.key)}
                            aria-label="Increase quantity"
                            className="grid h-9 w-9 place-items-center rounded-full text-lg font-bold text-slate-600 transition active:scale-90 hover:bg-white hover:text-lime-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* clean & cut — proper checkbox row, large tap target */}
                  <button
                    onClick={() => toggleClean(x.key)}
                    className={`mt-3 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      x.cleaning ? "border-lime-300 bg-lime-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] text-[11px] font-bold transition ${
                        x.cleaning ? "bg-lime-600 text-white" : "border-2 border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-slate-800">Clean &amp; Cut</span>
                      <span className="block text-[10px] text-slate-400">Adds professional cleaning</span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-slate-500">+₹{CLEAN_FEE}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <footer className="rounded-t-[30px] border-t border-slate-200 bg-white px-5 pb-5 pt-5 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-700">₹{itemsTotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (18%)</span>
                <span className="font-medium text-slate-700">₹{gst}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery</span>
                <span className={delivery === 0 ? "font-semibold text-lime-700" : "font-medium text-slate-700"}>
                  {delivery === 0 ? "FREE" : `₹${delivery}`}
                </span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between">
                  <span className="text-lime-700">Savings</span>
                  <span className="font-semibold text-lime-700">−₹{savings}</span>
                </div>
              )}
              {itemsTotal < FREE_ABOVE && (
                <p className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
                  Add ₹{FREE_ABOVE - itemsTotal} more for free delivery
                </p>
              )}
              <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-base font-bold text-slate-900">Total</span>
                <span className="text-[22px] font-extrabold text-slate-900">₹{total}</span>
              </div>
            </div>

            <button
              onClick={() => setCheckout(true)}
              className="mt-4 h-[58px] w-full rounded-[18px] bg-lime-600 text-[15px] font-bold uppercase tracking-wide text-white shadow-lg shadow-lime-600/25 transition active:scale-[0.98] hover:bg-lime-700"
            >
              Checkout · ₹{total}
            </button>
          </footer>
        )}
      </aside>

      <CheckoutSheet
        open={checkout}
        onClose={() => setCheckout(false)}
        cart={cart}
        totals={{ subtotal: itemsTotal, gst, delivery, savings, total }}
        onPlaced={() => {
          setCart([]);      // basket is now an order
          onClose();
        }}
      />
    </>
  );
}
