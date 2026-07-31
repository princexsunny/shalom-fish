"use client";

/* Line icons drawn to a common 24×24 grid so every header action matches the
   category-tile style (stroke 1.8, round caps, currentColor). */
const ico = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" {...ico} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.3 4.7 13a4.6 4.6 0 0 1 6.5-6.5l.8.8.8-.8A4.6 4.6 0 0 1 19.3 13Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" {...ico}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" {...ico}>
      <path d="M3 4h2.2l2 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20.5 8H6.2" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
    </svg>
  );
}

export default function Navbar({
  cartCount = 0,
  wishCount = 0,
  onCart = () => {},
  onWishlist = () => {},
  onLogin = () => {},
  user = null,
  query = "",
  onQuery = () => {},
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/20 bg-[#0e4d54] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-1.5">
        {/* brand */}
        <a href="#home" className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lime-600 text-sm font-bold text-white">
            ⌘
          </span>
          <span className="min-w-0 leading-tight">
            <span className="font-display block truncate text-[14px] font-extrabold tracking-tight text-white">
              Shalom Fish
            </span>
            <span className="block truncate text-[9px] font-medium text-teal-200/70">Fresh Seafood</span>
          </span>
        </a>

        <div className="flex-1" />

        {/* one consistent icon style: 36px circle, soft grey surface */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onWishlist}
            aria-label="Wishlist"
            className="relative grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition active:scale-90 hover:bg-white/20"
          >
            <HeartIcon filled={wishCount > 0} />
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-lime-600 px-1 text-[9px] font-bold text-white">
                {wishCount}
              </span>
            )}
          </button>

          <button
            onClick={onLogin}
            aria-label={user ? "Account" : "Log in"}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition active:scale-90 hover:bg-white/20"
          >
            {user ? (
              <span className="text-[11px] font-bold text-lime-300">{user.name?.[0]?.toUpperCase() || "U"}</span>
            ) : (
              <UserIcon />
            )}
          </button>

          <button
            onClick={onCart}
            aria-label="Cart"
            className="relative grid h-9 w-9 place-items-center rounded-full bg-lime-500 text-slate-900 transition active:scale-90 hover:bg-lime-400"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-white px-1 text-[9px] font-bold text-teal-900 ring-1 ring-teal-900/20">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* search — hidden on very short screens so the product card keeps its height */}
      <div className="search-row mx-auto max-w-7xl px-4 pb-2.5">
        <label className="flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 ring-1 ring-white/20 transition focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-lime-400/60">
          <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0 text-teal-200/70" {...ico}>
            <circle cx="11" cy="11" r="6.4" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search fresh seafood…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-teal-200/60"
          />
          {query && (
            <button onClick={() => onQuery("")} aria-label="Clear search" className="text-teal-200/70 hover:text-white">
              ×
            </button>
          )}
        </label>
      </div>
    </header>
  );
}
