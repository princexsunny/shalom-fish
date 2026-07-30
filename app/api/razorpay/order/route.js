/**
 * POST /api/razorpay/order  →  { orderId, amount, currency, keyId }
 *
 * Creates a Razorpay order SERVER-SIDE. This route exists for one reason: the
 * key secret must never reach the browser. RAZORPAY_KEY_SECRET has no
 * NEXT_PUBLIC_ prefix precisely so Next.js refuses to bundle it into client JS.
 *
 * The amount is NOT taken from the request body — a browser can send any number
 * it likes. It is recomputed here from the cart the client sent, using the same
 * pricing rules the storefront uses. Anything else lets a customer pay ₹1 for a
 * ₹1000 order.
 *
 * We call the REST API with fetch rather than pulling in the `razorpay` npm
 * package — one less dependency to install on every Render build.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DELIVERY = 40;
const FREE_ABOVE = 499;
const CLEAN_FEE = 20;
const GST_RATE = 0.18;

/** Recompute the payable total from the line items. Mirrors CartDrawer. */
function serverTotal(items) {
  const subtotal = items.reduce((s, x) => {
    const price = Number(x.price) || 0;
    const qty = Math.max(1, Math.min(50, Number(x.qty) || 1));
    return s + (price + (x.cleaning ? CLEAN_FEE : 0)) * qty;
  }, 0);
  const gst = Math.round(subtotal * GST_RATE);
  const delivery = subtotal === 0 ? 0 : subtotal >= FREE_ABOVE ? 0 : DELIVERY;
  return { subtotal, gst, delivery, total: subtotal + gst + delivery };
}

export async function POST(req) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return Response.json(
      { error: "Online payment is not configured yet. Please choose Cash on Delivery." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return Response.json({ error: "Cart is empty" }, { status: 400 });

  const totals = serverTotal(items);
  if (totals.total < 1) return Response.json({ error: "Invalid amount" }, { status: 400 });

  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: totals.total * 100, // Razorpay works in paise
        currency: "INR",
        receipt: String(body?.ref || "").slice(0, 40) || undefined,
        notes: {
          phone: String(body?.phone || "").slice(0, 15),
          name: String(body?.name || "").slice(0, 60),
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      // Surface Razorpay's own message — it's usually specific ("key not
      // activated", "amount below minimum") and saves a lot of guessing.
      return Response.json(
        { error: data?.error?.description || "Could not start the payment." },
        { status: 502 }
      );
    }

    return Response.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId, // public key — safe to send, it's meant for the checkout widget
      totals,
    });
  } catch {
    return Response.json({ error: "Payment service unreachable. Try Cash on Delivery." }, { status: 502 });
  }
}
