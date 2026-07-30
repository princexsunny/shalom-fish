/**
 * POST /api/razorpay/verify  →  { ok: true }
 *
 * The browser telling us "payment succeeded" means nothing — anyone can POST
 * that. Razorpay signs `order_id|payment_id` with your key secret, so we
 * recompute the HMAC here and compare. Only a matching signature proves the
 * payment actually happened.
 *
 * timingSafeEqual is used instead of `===` so the comparison can't be attacked
 * by measuring how long a mismatch takes to reject.
 */

import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return Response.json({ ok: false, error: "Not configured" }, { status: 503 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return Response.json({ ok: false, error: "Missing payment fields" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(razorpay_signature), "utf8");
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!ok) return Response.json({ ok: false, error: "Signature mismatch" }, { status: 400 });

  return Response.json({ ok: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
}
