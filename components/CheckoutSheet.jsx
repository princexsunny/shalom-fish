"use client";
import { useEffect, useState } from "react";
import { placeOrder, orderRef, saveDetails, loadDetails } from "@/lib/orders";
import { payWithRazorpay } from "@/lib/payment";

export default function CheckoutSheet({ open, onClose, cart, totals, onPlaced }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [slot, setSlot] = useState("asap");
  const [pay, setPay] = useState("cod"); // "cod" | "online"
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null); // placed order

  useEffect(() => {
    if (!open) return;
    const d = loadDetails();
    if (d) {
      setName(d.name || "");
      setPhone(d.phone || "");
      setAddress(d.address || "");
    }
    setErr("");
    setDone(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const digits = phone.replace(/\D/g, "");
    if (!name.trim()) return setErr("Please enter your name");
    if (digits.length < 10) return setErr("Enter a valid 10-digit mobile number");
    if (address.trim().length < 10) return setErr("Please enter a delivery address");

    setBusy(true);
    const ref = orderRef();
    const customer = { name: name.trim(), phone: digits, address: address.trim(), notes: notes.trim() };
    const items = cart.map((x) => ({
      id: x.id,
      name: x.name,
      weight: x.weight,
      price: x.price,
      qty: x.qty,
      cleaning: !!x.cleaning,
    }));

    try {
      let paymentInfo = { payment: "cod", paymentStatus: "pending" };

      // Take the money FIRST when paying online. Writing the order before the
      // payment would leave a paid-looking record behind every abandoned
      // checkout, and the shop would dispatch fish nobody paid for.
      if (pay === "online") {
        const r = await payWithRazorpay({ items, ref, customer, total: totals.total });
        if (r.status === "cancelled") {
          setErr("Payment cancelled. Nothing was charged.");
          setBusy(false);
          return;
        }
        paymentInfo = {
          payment: "online",
          paymentStatus: "paid",
          paymentId: r.paymentId,
          gatewayOrderId: r.orderId,
        };
      }

      const order = await placeOrder({ ref, customer, slot, ...paymentInfo, items, totals });
      saveDetails({ name: name.trim(), phone: digits, address: address.trim() });
      setDone(order);
      onPlaced?.(order);
    } catch (e2) {
      setErr(e2?.message || e2?.code || "Could not place the order. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={busy ? undefined : onClose} />

      <div className="relative max-h-[92svh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">
        {done ? (
          /* ---------- confirmation ---------- */
          <div className="p-7 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-lime-100 text-3xl text-lime-700">
              ✓
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900">Order placed</h2>
            <p className="mt-1 text-sm text-slate-500">
              Reference <span className="font-bold text-slate-800">{done.ref}</span>
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total</span>
                <span className="font-bold text-slate-900">₹{totals.total}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className="font-medium text-slate-700">
                  {done.payment === "online" ? "Paid online ✓" : "Cash on delivery"}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-slate-500">Delivery</span>
                <span className="font-medium text-slate-700">{slot === "asap" ? "As soon as possible" : slot}</span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              We&apos;ll call {phone} to confirm. Keep this reference handy.
              {done.paymentId ? ` Payment id: ${done.paymentId}` : ""}
            </p>

            <button
              onClick={onClose}
              className="mt-5 h-12 w-full rounded-xl bg-lime-600 font-semibold text-white transition hover:bg-lime-700"
            >
              Done
            </button>
          </div>
        ) : (
          /* ---------- form ---------- */
          <form onSubmit={submit} className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Checkout</h2>
                <p className="text-xs text-slate-500">
                  {cart.reduce((n, x) => n + x.qty, 0)} items · ₹{totals.total}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Your name" />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Mobile number</span>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-lime-500 focus-within:ring-2 focus-within:ring-lime-100">
                  <span className="pl-4 pr-2 text-slate-500">+91</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="numeric"
                    className="w-full rounded-r-xl bg-transparent py-3 pr-4 text-slate-900 outline-none"
                    placeholder="10-digit number"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Delivery address</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className={field}
                  placeholder="House / street / landmark, area, pincode"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Delivery time</span>
                <div className="flex gap-2">
                  {[
                    { id: "asap", label: "ASAP" },
                    { id: "morning", label: "Morning" },
                    { id: "evening", label: "Evening" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlot(s.id)}
                      className={`h-10 flex-1 rounded-xl text-xs font-semibold transition ${
                        slot === s.id
                          ? "bg-lime-600 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* payment method */}
              <div>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Payment</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "cod", label: "Cash on delivery", sub: "Pay at the door" },
                    { id: "online", label: "Pay now", sub: "UPI · Card · Netbanking" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPay(p.id)}
                      aria-pressed={pay === p.id}
                      className={`flex min-h-[56px] flex-col justify-center rounded-xl border px-3 py-2 text-left transition ${
                        pay === p.id
                          ? "border-lime-500 bg-lime-50 ring-2 ring-lime-100"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800">{p.label}</span>
                      <span className="mt-0.5 text-[10px] leading-tight text-slate-500">{p.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Notes (optional)</span>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={field}
                  placeholder="e.g. call on arrival"
                />
              </label>
            </div>

            {/* summary */}
            <div className="mt-4 space-y-1.5 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (18%)</span>
                <span>₹{totals.gst}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery</span>
                <span>{totals.delivery === 0 ? "FREE" : `₹${totals.delivery}`}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>₹{totals.total}</span>
              </div>
              <p className="pt-1 text-[11px] text-slate-500">
                {pay === "online" ? "Paid securely via Razorpay" : "Cash on delivery"}
              </p>
            </div>

            {err && <p className="mt-3 text-sm font-medium text-red-600">{err}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-4 h-[56px] w-full rounded-[18px] bg-lime-600 text-[16px] font-bold uppercase tracking-wide text-white shadow-lg shadow-lime-600/25 transition active:scale-[0.98] hover:bg-lime-700 disabled:opacity-60"
            >
              {busy
                ? pay === "online"
                  ? "Opening payment…"
                  : "Placing order…"
                : `${pay === "online" ? "Pay" : "Place order ·"} ₹${totals.total}`}
            </button>

            <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-400">
              Your number is used only for delivery updates.
              {pay === "online" ? " Payments are processed by Razorpay — we never see your card details." : ""}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
