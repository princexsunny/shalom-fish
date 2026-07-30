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

**Reserved space:** `152` above + `114` below = **266px**

---

## 2. Product card

| Property | Value |
|---|---|
| Width | `clamp(300px, 90vw, 360px)` |
| Height | `min(100svh − 266px, 600px)` |
| Radius | 32px (`rounded-4xl`) |
| Border | 1px `#e2e8f0` |
| Shadow | `shadow-xl` |
| Image | **flex-1** — takes all leftover height |
| Details | **fixed 210px** (220px on `sm+`) |

> The details block is a **fixed height** and the image flexes. That's what
> guarantees the Add to Cart button can never be clipped, on any screen.

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
| Height | 88px |
| Width | `flex-1` each — together they match the card width |
| Gap | 10px |
| Radius | 16px (`rounded-2xl`) |
| Border | 1px `#e2e8f0` (media placeholder: dashed) |
| Shadow | **none** (flat) |

**Live Stock:** "LIVE STOCK" 8px label + pulsing dot · 32px thumbnail ·
name 10px bold · quantity **16px extrabold** (orange under 8kg).
Rotates every **4s** with a 220ms fade. Tapping jumps the carousel to that fish.

**Live Media:** latest video, else latest image. Autoplays **muted**, loops,
`object-cover`. Pauses when off-screen (`IntersectionObserver`).
Tap → fullscreen viewer.

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
| Page | `#E8EDF0` | app background |
| Surface | `#FFFFFF` | cards, tiles, header |
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
├─ LiveMediaWidget.jsx
├─ MediaViewer.jsx    fullscreen video/image viewer
├─ CartDrawer.jsx
├─ WishlistDrawer.jsx
└─ LoginModal.jsx
lib/
├─ products.js        12-item Kerala catalogue
├─ firebase.js        env-based init, safe fallback
└─ store.js           Firestore/Storage ↔ localStorage layer
```
