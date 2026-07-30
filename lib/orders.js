"use client";
/**
 * Orders live in their own Firestore collection (`orders`), NOT under `shalom/*`.
 * That matters for security: `shalom/*` is admin-write-only, but customers must be
 * able to CREATE an order. The rules therefore allow `create` on `orders` with a
 * validated shape, while read/update stays admin-only.
 *
 * Falls back to localStorage when Firebase isn't configured so local dev works.
 */
import { firebaseEnabled, db } from "./firebase";

const LS_ORDERS = "shalom_orders";

export const ORDER_STATUSES = ["new", "confirmed", "out", "delivered", "cancelled"];

export const STATUS_LABEL = {
  new: "New",
  confirmed: "Confirmed",
  out: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Short human-friendly reference, e.g. SF-7K2Q9 */
export function orderRef() {
  return "SF-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

/* ---------------- create (customer) ---------------- */
export async function placeOrder(order) {
  const payload = {
    ...order,
    createdAt: new Date().toISOString(),
    status: "new",
  };

  if (firebaseEnabled && db) {
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    const docRef = await addDoc(collection(db, "orders"), {
      ...payload,
      // serverTimestamp is authoritative — a client clock can be wrong or spoofed
      createdAtServer: serverTimestamp(),
    });
    return { ...payload, id: docRef.id };
  }

  const local = { ...payload, id: "local_" + Date.now() };
  try {
    const all = JSON.parse(localStorage.getItem(LS_ORDERS) || "[]");
    localStorage.setItem(LS_ORDERS, JSON.stringify([local, ...all]));
  } catch {}
  return local;
}

/* ---------------- read (admin) ---------------- */
export async function listOrders(limitTo = 100) {
  if (firebaseEnabled && db) {
    const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore");
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(limitTo));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  try {
    return JSON.parse(localStorage.getItem(LS_ORDERS) || "[]");
  } catch {
    return [];
  }
}

/* ---------------- update status (admin) ---------------- */
export async function setOrderStatus(id, status) {
  if (firebaseEnabled && db) {
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "orders", id), { status });
    return;
  }
  try {
    const all = JSON.parse(localStorage.getItem(LS_ORDERS) || "[]");
    localStorage.setItem(LS_ORDERS, JSON.stringify(all.map((o) => (o.id === id ? { ...o, status } : o))));
  } catch {}
}

/** Remember the customer's delivery details for next time (convenience only). */
export function saveDetails(d) {
  try {
    localStorage.setItem("shalom_customer", JSON.stringify(d));
  } catch {}
}
export function loadDetails() {
  try {
    return JSON.parse(localStorage.getItem("shalom_customer") || "null");
  } catch {
    return null;
  }
}
