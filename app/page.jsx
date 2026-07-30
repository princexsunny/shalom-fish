"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import LoginModal from "@/components/LoginModal";

const Hero3D = dynamic(() => import("@/components/Hero3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[100svh] place-items-center bg-[radial-gradient(120%_90%_at_50%_-10%,#d3e3da,#dde5ea)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-lime-accent/30 border-t-lime-accent" />
        <p className="text-sm tracking-[0.3em] text-slate-500">LOADING THE OCEAN…</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [cat, setCat] = useState("All");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState({}); // id -> product
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");

  // remember the customer between visits (convenience only, not auth)
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("shalom_customer") || "null");
      if (u) setUser(u);
    } catch {}
  }, []);
  const saveUser = (u) => {
    setUser(u);
    try {
      localStorage.setItem("shalom_customer", JSON.stringify(u));
    } catch {}
  };
  const logoutUser = () => {
    setUser(null);
    try {
      localStorage.removeItem("shalom_customer");
    } catch {}
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const key = `${item.id}|${item.weight}`;
      const found = prev.find((x) => x.key === key);
      if (found) return prev.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x));
      return [...prev, { ...item, key, qty: 1, cleaning: false }];
    });
  };
  const toggleWish = (product) =>
    setWishlist((w) => {
      const next = { ...w };
      if (next[product.id]) delete next[product.id];
      else next[product.id] = product;
      return next;
    });

  const wishItems = Object.values(wishlist);
  const wishCount = wishItems.length;
  const cartCount = cart.reduce((n, x) => n + x.qty, 0);
  const cartIds = new Set(cart.map((x) => x.id));

  return (
    <>
      <Navbar
        cartCount={cartCount}
        wishCount={wishCount}
        onCart={() => setCartOpen(true)}
        onWishlist={() => setWishOpen(true)}
        onLogin={() => setLoginOpen(true)}
        user={user}
        query={query}
        onQuery={setQuery}
      />
      <main>
        <Hero3D
          cat={cat}
          onCat={setCat}
          onAdd={addToCart}
          wishlist={wishlist}
          onToggleWish={toggleWish}
          cartIds={cartIds}
          query={query}
        />
      </main>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} />
      <WishlistDrawer
        open={wishOpen}
        onClose={() => setWishOpen(false)}
        items={wishItems}
        onRemove={toggleWish}
        onAdd={addToCart}
      />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        user={user}
        onSave={saveUser}
        onLogout={logoutUser}
      />
    </>
  );
}
