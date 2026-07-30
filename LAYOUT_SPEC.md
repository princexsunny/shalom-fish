# 📐 Shalom Fish — Layout Spec (mobile, one screen, no scrolling)

All values are CSS pixels. `svh` = *small viewport height* (excludes mobile
browser toolbars), which is why the layout never gets cut off by the URL bar.

---

## 1. Screen stack (top → bottom)

```
┌─────────────────────────────────────┐  0
│  HEADER            44px             │
│  ├ logo tile 32×32, radius 12       │
│  ├ title 14px / subtitle 9px        │
│  └ 3 icons 36×36 circles, gap 6     │
├─────────────────────────────────────┤  44
│  SEARCH            50px             │  (hidden ≤730px tall)
│  └ pill h-40, radius full, grey     │
├─────────────────────────────────────┤  94
│  CATEGORY PILLS    44px  @top 100   │
│  └ container radius full, p-4       │
│    pills h-36, radius full          │
├─────────────────────────────────────┤  138
│         (18px breathing gap)        │
├─────────────────────────────────────┤  152  ← card starts
│                                     │
│           PRODUCT CARD              │
│           (see §2)                  │
│                                     │
├─────────────────────────────────────┤
│         (12px gap)                  │
├─────────────────────────────────────┤
│  LIVE TILES        88px             │
│  ┌───────────┐ 10 ┌───────────┐     │
│  │ LIVE STOCK│gap │ LIVE MEDIA│     │
│  └───────────┘    └───────────┘     │
├─────────────────────────────────────┤
│         14px bottom margin          │
└─────────────────────────────────────┘  = 100svh
```

**Reserved space** is computed from CSS variables — no magic numbers:

```css
--top-offset: calc(var(--header-h) + var(--search-h) + var(--tabs-h) + var(--gap-top));
--reserved:   calc(var(--top-offset) + var(--gap-bottom) + var(--tiles-h)
                 + var(--bottom-margin) + var(--safe-bottom));
--card-w:     min(calc(100vw - 36px), 360px);   /* always 18px side margins */
--card-h:     min(calc(100svh - var(--reserved)), var(--card-max-h));
```

### Height classes
| Class | Range | search | gap-top | tiles | card max |
|---|---|---|---|---|---|
| very short | ≤679 | hidden | 12 | 80 | 600 |
| short | 680–759 | hidden | 14 | 88 | 600 |
| regular | 760–899 | 50 | 18 | 88 | 600 |
| tall | ≥900 | 50 | 22 | 88 | 660 |

| Screen | Class | Card top | Card H | Image | Details |
|---|---|---|---|---|---|
| 640 | very short | 100 | 434 | 244 | 190 |
| 667 | very short | 100 | 461 | 271 | 190 |
| 700 | short | 102 | 484 | 288 | 196 |
| 740 | short | 102 | 524 | 317 | 207 |
| 800 | regular | 156 | 530 | 310 | 220 |
| 844 | regular | 156 | 574 | 354 | 220 |
| 932 | tall | 160 | 658 | 438 | 220 |
| 1024 | tall | 160 | 660 | 440 | 220 |

Details height is `clamp(190px, 28vh, 220px)`. Image is `flex-1` with
`min-height: 180px` so it can't be squashed on very short devices.

---

## 2. Product card

| Property | Value |
|---|---|
| Width | `min(calc(100vw - 36px), 360px)` |
| Height | `min(100svh − var(--reserved)), var(--card-max-h))` |
| Radius | **20px** |
| Border | 1px `#e2e8f0` |
| Shadow | `shadow-xl` |
| Image | **flex-1 min-h-0** — takes all leftover height |
| Details | **content-driven** (`shrink-0`, auto height ≈ 239px) |

> ⚠️ The details block height is **CONTENT-DRIVEN**, not fixed. An earlier fixed
> height (208px) clipped the Add to Cart button because the content measured
> ~239px — a fixed box can only clip, never adapt. `shrink-0` + auto height means
> it is always exactly as tall as it needs to be, and the image absorbs the rest.

### Details block internals (210px)
| Element | Size |
|---|---|
| Category label | 10px, letter-spacing .18em |
| Product name | 22px, extrabold |
| Local name | 12px, slate-400 |
| Rating row | 11px + stock chip 9px |
| Weight chips | h-36, radius 12 |
| Price | 26px extrabold / unit 12px / old price 14px |
| **Add to Cart** | **h-52** (58 on `sm+`), radius 18 |

---

## 3. Card width by device

| Viewport | Card width | Side margin (each) |
|---|---|---|
| 360px | 324px | 18px |
| 375px | 338px | 19px |
| 390px | 351px | 20px |
| 412px | 360px | 26px |
| 430px | 360px | 35px |
| ≥400px | 360px (capped) | — |

## 4. Card height by device

| Screen height | Mode | Card top | Card H | Image H | Details | Tiles | Bottom margin |
|---|---|---|---|---|---|---|---|
| 640 | short | 102 | 424 | 214 | 210 | 538–626 | 14 |
| 667 | short | 102 | 451 | 241 | 210 | 565–653 | 14 |
| 700 | short | 102 | 484 | 274 | 210 | 598–686 | 14 |
| 730 | short | 102 | 514 | 304 | 210 | 628–716 | 14 |
| 740 | tall | 152 | 474 | 264 | 210 | 638–726 | 14 |
| 800 | tall | 152 | 534 | 324 | 210 | 698–786 | 14 |
| 844 | tall | 152 | 578 | 368 | 210 | 742–830 | 14 |
| 932 | tall | 152 | 600 | 390 | 210 | 764–852 | 80 |

**Short mode** (`@media (max-height: 730px)`): the search row is hidden, so
everything shifts up 50px and the card reserve drops to 216px.

---

## 5. Live tiles (below the card)

| Property | Value |
|---|---|
| Height | 96px |
| Width | `flex-1` each — together they match the card width |
| Gap | 10px |
| Radius | 16px (`rounded-2xl`) |
| Border | 1px `#e2e8f0` (media placeholder: dashed) |
| Shadow | **none** (flat) |

**Live Stock:** "LIVE STOCK" 8px label + pulsing dot · 32px thumbnail ·
name 10px bold · quantity **16px extrabold** (orange under 8kg).
Rotates every **4s** with a 220ms fade. Tapping jumps the carousel to that fish.

**Live Media:** an **autoplaying PHOTO reel inside the tile** — no video
playback, no play button, no tap needed and no fullscreen viewer. Photos hold
**4.5s** then cross-fade (`.media-fade`, 350ms); a single photo just sits still.
Rotation stops off-screen (`IntersectionObserver`). Uploaded *videos* are shown
as their **still poster frame only** and never play. Segment bars bottom-right
show position (max 6 + "+N"). Tapping is only active when the item is **linked to
a product** — then it jumps the carousel to that fish. Unlinked items are inert.

---

## 6. 3D slider geometry

| Property | Value |
|---|---|
| Perspective | 1900px |
| Neighbour X offset | `calc(var(--cardW) × 0.66 × position)` |
| Neighbour Z | `−170px × distance` |
| Rotation Y | `−33° × position`, clamped ±46° |
| Scale | `1 − 0.1 × distance`, min 0.8 |
| Neighbour opacity | `0.85 − 0.22 × distance`, min 0.42 |
| Hidden beyond | distance > 3.3 |
| Transition | `transform .55s cubic-bezier(.16,1,.3,1)` |

**Performance:** only `transform` + `opacity` animate (both GPU-composited).
No `filter: blur()` or `box-shadow` tweens — those caused the earlier stutter.

**Swipe:** threshold 46px on touch / 72px mouse. Vertical gestures ignored.
Pointer capture engages *only after* a real swipe, so button taps still work.

---

## 7. Colour system

| Colour | Hex | Used for |
|---|---|---|
| Primary green | `#65A30D` (lime-600) | buttons, prices, active states |
| Dark green | `#047857` | Today's Catch badge |
| Orange | `#F97316` | discounts, low stock |
| Red | `#DC2626` | remove / destructive only |
| Teal | `#0E7490` | informational category labels |
| Page | `#DDE5EA` | app background (darkest) |
| Category bar | `#DFE8ED` | chrome |
| Header | `#E6EDF1` | chrome |
| Surface | `#FFFFFF` | cards + live tiles (lightest, pops forward) |
| Text | `#0F172A` / `#64748B` | primary / muted |

---

## 8. Touch targets

- Minimum **44×44px** on coarse pointers (`.tap-target`)
- `touch-action: manipulation` — removes the 300ms double-tap delay
- Inputs are 16px so iOS doesn't zoom on focus
- No tap-highlight flash; `active:scale` feedback on every control
- Pinch-zoom left **enabled** (accessibility)

---

## 9. Drawers & overlays

| Element | Spec |
|---|---|
| Cart / Wishlist | right slide-in, `max-w-md`, full width on mobile |
| Cart thumbnails | 68×68, radius 12 |
| Wishlist thumbnails | 76×76, radius 12 |
| Quantity capsule | h-44, ± buttons 36×36 |
| Checkout button | h-58, radius 18 |
| Summary sheet | top radius 30px |
| Login modal | bottom sheet on mobile, centred on `sm+` |
| Media viewer | fullscreen black, z-95 |

---

## 10. Files

```
app/
├─ page.jsx           state: cart, wishlist, user, search
├─ layout.jsx         fonts, viewport (viewportFit: cover)
├─ globals.css        theme vars, slider geometry, animations
└─ admin/page.jsx     7 tabs incl. Media uploader
components/
├─ Hero3D.jsx         3D slider + category pills + tiles
├─ Navbar.jsx         header + search
├─ LiveStockWidget.jsx
├─ LiveMediaWidget.jsx  autoplay reel (in-tile, no viewer)
├─ CartDrawer.jsx
├─ WishlistDrawer.jsx
└─ LoginModal.jsx
lib/
├─ products.js        12-item Kerala catalogue
├─ firebase.js        env-based init, safe fallback
└─ store.js           Firestore/Storage ↔ localStorage layer
```


---

## 11. Backend & security (current state)

| Area | Status |
|---|---|
| Admin auth | **Firebase Auth** (email/password), real session |
| Firestore `shalom/*` | public read · write only `uid == qa8OBPQ…Wk2` |
| Firestore `orders` | admin read/update · **public create with validated shape** |
| Storage `products/`, `media/` | public read · admin-only write |
| Authorised domain | `shalom-fish.onrender.com` added |

**Known gaps (deliberate, not bugs):**
1. **No customer OTP** — anyone can submit an order for any phone number. COD
   limits the exposure to a wasted trip; phone auth is the fix when you want it.
2. **Sparkline + % change are demo data** — seeded per product id, stable but not
   real history. Needs a `priceHistory` collection to be meaningful.
3. **Media product link is a snapshot** — name/price are copied at upload time and
   won't follow later product edits until relinked.
4. **Admin is a single UID** — a second staff account is denied until its uid is
   added to the rules.
