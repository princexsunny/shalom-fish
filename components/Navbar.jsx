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
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-4">
          {/* logo — long-press/right-click free admin entry lives here */}
          <a href="#home" className="flex min-w-0 shrink items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 text-sm font-bold text-white shadow-sm">
              🐟
            </span>
            <span className="min-w-0 leading-tight">
              <span className="font-display block whitespace-nowrap text-[15px] font-extrabold tracking-tight text-slate-900">
                Shalom Fish
              </span>
              <span className="hidden whitespace-nowrap text-[9px] font-medium tracking-[0.2em] text-slate-400 sm:block">
                FRESH FROM THE SEA
              </span>
            </span>
          </a>

          <div className="flex-1" />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* wishlist */}
            <button
              onClick={onWishlist}
              aria-label="Wishlist"
              className="tap-target relative grid h-10 w-10 place-items-center rounded-full text-lg text-slate-500 transition active:scale-90 hover:bg-slate-100 hover:text-lime-600"
            >
              ♡
              {wishCount > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-lime-600 text-[9px] font-bold text-white">
                  {wishCount}
                </span>
              )}
            </button>

            {/* customer login / account */}
            <button
              onClick={onLogin}
              aria-label={user ? "Account" : "Log in"}
              className="tap-target flex h-10 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-slate-600 transition active:scale-95 hover:bg-slate-100 hover:text-slate-900"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[11px]">
                {user ? (user.name?.[0]?.toUpperCase() || "U") : "👤"}
              </span>
              <span className="hidden sm:inline">{user ? user.name?.split(" ")[0] || "Account" : "Log in"}</span>
            </button>

            {/* cart */}
            <button
              onClick={onCart}
              aria-label="Cart"
              className="tap-target relative flex h-10 items-center gap-1.5 rounded-full bg-lime-600 px-3.5 text-xs font-semibold text-white shadow-sm transition active:scale-95 hover:bg-lime-700"
            >
              <span className="text-sm">🛒</span>
              <span className="hidden sm:inline">Cart</span>
              <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-lime-700">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
