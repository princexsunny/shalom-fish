"use client";
import { useEffect, useState } from "react";

export default function Navbar({
  cartCount = 0,
  wishCount = 0,
  onCart = () => {},
  onWishlist = () => {},
  onLogin = () => {},
  user = null,
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "py-1" : "py-2"}`}>
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <nav
          className={`flex items-center gap-2 rounded-2xl px-2.5 py-1.5 transition-all duration-500 sm:gap-4 sm:px-3 ${
            scrolled ? "border border-slate-200 bg-white/95 shadow-sm backdrop-blur" : "bg-transparent"
          }`}
        >
          {/* logo — compact so the row never overflows a 360px screen */}
          <a href="#home" className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime-600 text-sm font-bold text-white">
              ⌘
            </span>
            <span className="min-w-0 leading-tight">
              <span className="font-display block truncate text-[13px] font-bold text-slate-900 sm:text-sm">
                Shalom Fish
              </span>
              <span className="hidden whitespace-nowrap text-[9px] tracking-widest text-slate-500 sm:block">
                FRESH FROM THE SEA
              </span>
            </span>
          </a>

          <div className="flex-1" />

          {/* icon-only on phones, labelled from sm up */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* wishlist */}
            <button
              onClick={onWishlist}
              aria-label="Wishlist"
              className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-base text-lime-600 transition active:scale-90 hover:bg-slate-50 sm:h-10 sm:w-10"
            >
              ♥
              {wishCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-lime-600 text-[9px] font-bold text-white">
                  {wishCount}
                </span>
              )}
            </button>

            {/* customer login / account */}
            <button
              onClick={onLogin}
              aria-label={user ? "Account" : "Log in"}
              className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition active:scale-95 hover:bg-slate-50 sm:h-10 sm:px-2.5"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                {user ? user.name?.[0]?.toUpperCase() || "U" : "👤"}
              </span>
              <span className="hidden sm:inline">{user ? user.name?.split(" ")[0] || "Account" : "Log in"}</span>
            </button>

            {/* admin — gear icon on phones, word on larger screens */}
            <a
              href="/admin"
              aria-label="Admin"
              title="Admin"
              className="flex h-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition active:scale-95 hover:bg-slate-50 sm:h-10 sm:px-3"
            >
              <span className="sm:hidden">⚙</span>
              <span className="hidden sm:inline">Admin</span>
            </a>

            {/* cart */}
            <button
              onClick={onCart}
              aria-label="Cart"
              className="relative flex h-9 shrink-0 items-center gap-1 rounded-xl bg-lime-600 px-2.5 text-xs font-semibold text-white shadow-sm transition active:scale-95 hover:bg-lime-700 sm:h-10 sm:gap-1.5 sm:px-3.5"
            >
              <span className="sm:hidden">🛒</span>
              <span className="hidden sm:inline">Cart</span>
              <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-lime-700">
                {cartCount}
              </span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
