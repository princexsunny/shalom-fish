"use client";
/**
 * Razorpay checkout, client side.
 *
 * Flow (each step matters):
 *   1. ask OUR server to create an order — the amount is computed there, not here
 *   2. open the Razorpay widget with the returned order id
 *   3. send the widget's response back to OUR server to verify the signature
 *   4. only then does the caller write the order to Firestore as paid
 *
 * Step 3 is the whole point. Without it, a customer could close the widget,
 * fake a success callback, and get a "paid" order for free.
 */

const SDK = "https://checkout.razorpay.com/v1/checkout.js";

/** Load the Razorpay script once; resolves false if it can't load (offline, blocked). */
function loadSdk() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(`script[src="${SDK}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const s = document.createElement("script");
    s.src = SDK;
    s.async = true;
    s.onload = () => resolve(Boolean(window.Razorpay));
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * Runs the full pay-then-verify cycle.
 * @returns {Promise<{status:"paid"|"cancelled", paymentId?:string, orderId?:string}>}
 * @throws  Error with a customer-readable message on failure
 */
export async function payWithRazorpay({ items, ref, customer, total }) {
  const ok = await loadSdk();
  if (!ok) throw new Error("Could not load the payment window. Check your connection or use Cash on Delivery.");

  const res = await fetch("/api/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, ref, name: customer?.name, phone: customer?.phone }),
  });
  const order = await res.json();
  if (!res.ok) throw new Error(order?.error || "Could not start the payment.");

  // The server is authoritative on price. If it disagrees with the cart the
  // customer is looking at, stop rather than silently charging a different sum.
  if (order?.totals?.total != null && Number(total) !== Number(order.totals.total)) {
    throw new Error("Cart total changed. Please reopen your cart and try again.");
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const rz = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Shalom Fish",
      description: `Order ${ref}`,
      image: "/logo.png",
      prefill: {
        name: customer?.name || "",
        contact: customer?.phone ? `+91${customer.phone}` : "",
      },
      theme: { color: "#65a30d" },
      modal: {
        ondismiss: () => {
          if (!settled) {
            settled = true;
            resolve({ status: "cancelled" });
          }
        },
      },
      handler: async (resp) => {
        try {
          const v = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          const data = await v.json();
          settled = true;
          if (!v.ok || !data.ok) {
            // Money may have left the customer's account here, so never tell
            // them it simply "failed" — they need the payment id to claim it.
            reject(
              new Error(
                `Payment could not be verified. Do not pay again — quote payment id ${
                  resp?.razorpay_payment_id || "unknown"
                } to the shop.`
              )
            );
            return;
          }
          resolve({ status: "paid", paymentId: data.paymentId, orderId: data.orderId });
        } catch {
          settled = true;
          reject(new Error("Payment verification failed. Please contact the shop before paying again."));
        }
      },
    });

    rz.on("payment.failed", (e) => {
      if (settled) return;
      settled = true;
      reject(new Error(e?.error?.description || "Payment failed. Please try another method."));
    });

    rz.open();
  });
}
