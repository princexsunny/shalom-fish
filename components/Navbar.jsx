"use client";

export default function Navbar({
  cartCount = 0,
  wishCount = 0,
  onCart = () => {},
  onWishlist = () => {},
  onLogin = () => {},
  user = null,
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        {/* brand */}
        <a href="#home" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-lime-600 text-base font-bold text-white">
            ⌘
          </span>
          <span className="min-w-0 leading-tight">
            <span className="font-display block truncate text-[15px] font-extrabold tracking-tight text-slate-900">
              Shalom Fish
            </span>
            <span className="block truncate text-[10px] font-medium text-slate-400">Fresh Seafood</span>
          </span>
        </a>

        <div className="flex-1" />

        {/* only the essential actions — borderless icons, no button-soup */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={onWishlist}
            aria-label="Wishlist"
            className="relative grid h-11 w-11 place-items-center rounded-full text-lg text-slate-500 transition active:scale-90 hover:bg-slate-100 hover:text-lime-600"
          >
            ♥
            {wishCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-lime-600 px-1 text-[9px] font-bold text-white">
                {wishCount}
              </span>
            )}
          </button>

          <button
            onClick={onLogin}
            aria-label={user ? "Account" : "Log in"}
            className="grid h-11 w-11 place-items-center rounded-full text-slate-500 transition active:scale-90 hover:bg-slate-100"
          >
            {user ? (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-lime-600 text-[11px] font-bold text-white">
                {user.name?.[0]?.toUpperCase() || "U"}
              </span>
            ) : (
              <span className="text-lg">👤</span>
            )}
          </button>

          <button
            onClick={onCart}
            aria-label="Cart"
            className="relative ml-0.5 flex h-11 items-center gap-1.5 rounded-full bg-slate-900 px-3.5 text-white transition active:scale-95 hover:bg-slate-800"
          >
            <span className="text-base">🛒</span>
            <span className="text-xs font-bold">{cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
