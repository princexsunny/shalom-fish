"use client";

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-1.5">
        {/* brand */}
        <a href="#home" className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lime-600 text-sm font-bold text-white">
            ⌘
          </span>
          <span className="min-w-0 leading-tight">
            <span className="font-display block truncate text-[14px] font-extrabold tracking-tight text-slate-900">
              Shalom Fish
            </span>
            <span className="block truncate text-[9px] font-medium text-slate-400">Fresh Seafood</span>
          </span>
        </a>

        <div className="flex-1" />

        {/* one consistent icon style: 36px circle, soft grey surface */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onWishlist}
            aria-label="Wishlist"
            className="relative grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm text-slate-600 transition active:scale-90 hover:bg-slate-200 hover:text-lime-700"
          >
            ♥
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-lime-600 px-1 text-[9px] font-bold text-white">
                {wishCount}
              </span>
            )}
          </button>

          <button
            onClick={onLogin}
            aria-label={user ? "Account" : "Log in"}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm text-slate-600 transition active:scale-90 hover:bg-slate-200"
          >
            {user ? (
              <span className="text-[11px] font-bold text-lime-700">{user.name?.[0]?.toUpperCase() || "U"}</span>
            ) : (
              "👤"
            )}
          </button>

          <button
            onClick={onCart}
            aria-label="Cart"
            className="relative grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-sm text-white transition active:scale-90 hover:bg-slate-800"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-lime-600 px-1 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* search — hidden on very short screens so the product card keeps its height */}
      <div className="search-row mx-auto max-w-7xl px-4 pb-2.5">
        <label className="flex h-10 items-center gap-2 rounded-full bg-slate-100 px-4 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-lime-200">
          <span className="text-sm text-slate-400">🔍</span>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search fresh seafood…"
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => onQuery("")} aria-label="Clear search" className="text-slate-400 hover:text-slate-700">
              ×
            </button>
          )}
        </label>
      </div>
    </header>
  );
}
