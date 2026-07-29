"use client";
import { useEffect, useState } from "react";

export default function Navbar({ cartCount = 0, wishCount = 0, onCart = () => {}, onWishlist = () => {} }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "py-1" : "py-2"}`}>
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={`flex items-center gap-4 rounded-2xl px-3 py-1.5 transition-all duration-500 ${
            scrolled ? "glass-strong shadow-frost" : "bg-transparent"
          }`}
        >
          {/* logo */}
          <a href="#home" className="flex shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-lime-accent/15 text-sm text-lime-accent ring-1 ring-lime-accent/30">
              ⌘
            </span>
            <span className="leading-tight">
              <span className="font-display block text-sm font-bold text-white">Shalom Fish</span>
              <span className="block text-[9px] tracking-widest text-aqua/70">FRESH FROM THE SEA</span>
            </span>
          </a>

          <div className="flex-1" />

          {/* right: wishlist + admin + cart */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onWishlist}
              aria-label="Wishlist"
              className="glass relative grid h-9 w-9 place-items-center rounded-xl text-sm text-lime-accent ring-1 ring-white/10 transition active:scale-90 hover:text-white"
            >
              ♥
              {wishCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-lime-accent text-[9px] font-bold text-ink-900">
                  {wishCount}
                </span>
              )}
            </button>
            <a
              href="/admin"
              className="glass hidden rounded-xl min-h-[38px] px-3.5 py-2 text-xs font-semibold active:scale-95 text-white/80 ring-1 ring-white/10 transition hover:text-lime-accent sm:inline-flex"
            >
              Admin
            </a>
            <button
              onClick={onCart}
              className="relative flex items-center gap-1.5 rounded-xl bg-lime-accent min-h-[38px] px-3.5 py-2 text-xs font-semibold active:scale-95 text-ink-900 shadow-glow-lime transition hover:brightness-110"
            >
              Cart
              <span className="grid h-4 w-4 place-items-center rounded-full bg-ink-900 text-[10px] text-lime-accent">
                {cartCount}
              </span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
