# 💳 Payment setup — Razorpay

Checkout now offers **Cash on delivery** and **Pay now** (UPI · card · netbanking).
COD works with no setup. "Pay now" needs two keys.

---

## 1. Get test keys (5 minutes, no KYC)

1. Sign up at **razorpay.com** → the dashboard opens in **Test mode**
2. **Settings → API Keys → Generate Test Key**
3. Copy `Key Id` (starts `rzp_test_`) and `Key Secret` — **the secret is shown once**

## 2. Add them to Render

Render → your service → **Environment** → Add:

| Key | Value |
|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_xxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | the secret |

Save → Render redeploys automatically.

> ⚠️ `RAZORPAY_KEY_SECRET` has **no** `NEXT_PUBLIC_` prefix, and must never get
> one. That prefix bundles a value into the JavaScript every visitor downloads.
> A leaked key secret lets anyone create charges in your name.

For local testing put the same two lines in `.env.local`.

## 3. Publish the Firestore rules

Paste `firestore.rules` into Firebase console → Firestore → Rules → **Publish**.
The order-create rule now validates the payment fields, and blocks a COD order
from claiming it was already paid.

## 4. Test the flow

Use Razorpay's test cards — no real money moves:

| Card | Result |
|---|---|
| `4111 1111 1111 1111` | success (any future expiry, any CVV) |
| `5104 0600 0000 0008` | success (Mastercard) |
| any UPI id `success@razorpay` | success |
| `failure@razorpay` | failure |

Place an order → the Admin **Orders** tab should show a green **PAID ✓** chip and
the payment id.

## 5. Going live

1. Complete KYC in the dashboard (business PAN, bank account, address proof) —
   usually 2–4 working days
2. Switch the dashboard to **Live mode**, generate **live** keys
3. Replace both Render env values with the `rzp_live_` pair
4. Place one small real order (₹1) and refund it from the dashboard

Fees are roughly **2% + GST** per successful transaction. Nothing is charged on
COD orders or on failed payments.

---

## How it works (and why)

```
Customer taps "Pay ₹450"
   → POST /api/razorpay/order      ← server recomputes the amount from the cart
   → Razorpay widget opens          ← customer pays
   → POST /api/razorpay/verify      ← server checks the HMAC signature
   → order written to Firestore as paid
```

Two things are deliberate:

**The amount is recomputed on the server.** The browser sends the cart, not the
price. If it sent the price, a customer could edit it to ₹1 before paying.

**The signature is verified on the server.** Razorpay signs
`order_id|payment_id` with your key secret. The browser claiming "payment
succeeded" proves nothing — anyone can send that. Only the matching HMAC does.

---

## ⚠️ Known limitation — read this

After a verified payment, **the browser** writes the order to Firestore with
`paymentStatus: "paid"`. The Firestore rules can't call Razorpay, so they can't
independently confirm the payment happened.

**What this means in practice:** nobody can steal money, and nobody can pay less
than the real total. But a technically-skilled person could create an order
marked "paid" *without paying at all*.

Two ways to close it:

1. **Cheap check (do this now):** before dispatching an expensive order, search
   the payment id shown in the admin card in your Razorpay dashboard. Real
   payments appear there; fake ones don't.
2. **Proper fix:** have the `/api/razorpay/verify` route write the order using
   the Firebase **Admin SDK**, and change the rule to block client creation of
   `payment: "online"` orders entirely. This needs a service-account key stored
   as a Render env var — ask and I'll wire it up.

At COD-sized volumes option 1 is fine. Do option 2 before you take large
prepaid orders.
