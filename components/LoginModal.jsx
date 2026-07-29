"use client";
import { useEffect, useState } from "react";

/**
 * Customer login.
 * NOTE: this stores the name/phone locally for checkout convenience — it is NOT
 * authentication. Wire Firebase Auth (phone/OTP) before treating it as secure.
 */
export default function LoginModal({ open, onClose, user, onSave, onLogout }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setName(user?.name || "");
      setPhone(user?.phone || "");
      setErr("");
    }
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (!name.trim()) return setErr("Please enter your name");
    if (digits.length < 10) return setErr("Enter a valid 10-digit mobile number");
    onSave({ name: name.trim(), phone: digits });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:rounded-3xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="tap-target absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          ×
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-600 text-xl text-white">
            🐟
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            {user ? "Your details" : "Welcome to Shalom Fish"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {user ? "Update your delivery details" : "Log in for faster checkout and order updates"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mobile number</label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-lime-500 focus-within:ring-2 focus-within:ring-lime-100">
              <span className="pl-4 pr-2 text-slate-500">+91</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                placeholder="10-digit number"
                className="w-full rounded-r-xl bg-transparent py-3 pr-4 text-slate-900 outline-none"
              />
            </div>
          </div>

          {err && <p className="text-xs font-medium text-red-600">{err}</p>}

          <button
            type="submit"
            className="tap-target w-full rounded-xl bg-lime-600 py-3.5 font-semibold text-white shadow-sm transition active:scale-[0.98] hover:bg-lime-700"
          >
            {user ? "Save details" : "Continue"}
          </button>

          {user && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-slate-500 transition hover:text-red-600"
            >
              Log out
            </button>
          )}
        </form>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-400">
          By continuing you agree to our terms. We only use your number for delivery updates.
        </p>
      </div>
    </div>
  );
}
