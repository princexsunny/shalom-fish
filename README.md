# 🌊 Shalom Fish — Premium Seafood Storefront

An award-style, cinematic seafood storefront for **Shalom Fish** — *Fresh from the Sea*.
Dark emerald theme, glassmorphism, and a 3D product-card slider, built with Next.js + GSAP.

## Stack
- **Next.js 14** (App Router)
- **GSAP** — slide reveals, price count-up, scroll animations
- **Lenis** — smooth scrolling
- **Tailwind CSS** — dark emerald theme, frosted glass
- No WebGL/Three.js — the hero is a CSS 3D transform slider (light and fast)

## Run it
```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```
Requires Node 18+.

## Hero — 3D product-card slider
Each active slide is a **complete product card**: image on top, details below
(category, name, star rating, **weight selector** 500 g / 1 kg / 2 kg, price + old price,
a **Clean & cut** option, and a full-width **Add to Cart**). Premium / Today's Catch /
discount badges and a themed wishlist heart sit on the image. Neighbouring cards show the
image only, rotated and lightly blurred, and expand into the full card when centered.
Controls: drag / swipe, ← → keyboard, arrows, dots. Category circles in the top bar filter
the slider.

## Cart
The navbar Cart button opens a slide-in drawer with quantities, a **Clean & cut** surcharge,
**18% GST**, **delivery** (₹40, free over ₹499), and total. The badge counts live.

## Admin (`/admin`)
Password-gated (default **`shalom123`**, changeable under Settings). Tabs:
- **Add Product** — details + **multi-image upload** with an auto-sliding preview. Images are
  compressed and saved so products persist.
- **Inventory** — editable stock, live status (In stock / Low / Out), edit & delete for
  added products.

Admin-added products also appear in the storefront slider (they load on page open and refresh
when the tab regains focus).

## Data & persistence
Catalogue lives in **`lib/products.js`** (12 Kerala varieties). Admin additions, stock, and the
password are stored in the browser via `localStorage` — great for a demo, but per-device and not
a substitute for a real backend.

## Images
`/public/products`, `/public/recipes`, `/public/collections` hold themed placeholder images so
the site runs out of the box. Drop real photos in with the same filenames to go live.

## Structure
```
shalom-fish/
├─ app/            layout, page (store), admin/page, globals.css
├─ components/     Hero3D (slider), Navbar, CartDrawer, ProductCard,
│                  Sections, Sections2, SmoothScroll, ui/
├─ lib/            products.js (catalogue), animations.js (GSAP hooks)
└─ public/         products / recipes / collections images
```
