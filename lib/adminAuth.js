"use client";
/**
 * Admin authentication via Firebase Auth (email + password).
 *
 * Replaces the old client-side password gate, which was only cosmetic: the
 * password lived in localStorage and anyone could bypass it with devtools.
 * Firestore/Storage rules now require a signed-in admin, so writes are enforced
 * on the SERVER, not in the browser.
 *
 * When Firebase isn't configured the app falls back to the legacy local gate so
 * local development still works without keys.
 */
import { firebaseEnabled, auth } from "./firebase";

export { firebaseEnabled };

export async function signIn(email, password) {
  if (!firebaseEnabled || !auth) throw new Error("Firebase not configured");
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signOutAdmin() {
  if (!firebaseEnabled || !auth) return;
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
}

/** Subscribe to auth state. Returns an unsubscribe function. */
export function onAdminAuth(cb) {
  if (!firebaseEnabled || !auth) {
    cb(null, true); // (user, ready)
    return () => {};
  }
  let unsub = () => {};
  import("firebase/auth").then(({ onAuthStateChanged }) => {
    unsub = onAuthStateChanged(auth, (u) => cb(u, true));
  });
  return () => unsub();
}

export async function sendReset(email) {
  if (!firebaseEnabled || !auth) throw new Error("Firebase not configured");
  const { sendPasswordResetEmail } = await import("firebase/auth");
  await sendPasswordResetEmail(auth, email.trim());
}

/** Human-readable messages for the Firebase auth error codes we expect. */
export function authMessage(err) {
  const code = err?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "Incorrect email or password";
  if (code.includes("invalid-email")) return "That email address doesn't look right";
  if (code.includes("too-many-requests")) return "Too many attempts — wait a moment and try again";
  if (code.includes("network")) return "Network error — check your connection";
  if (code.includes("operation-not-allowed"))
    return "Email/password sign-in isn't enabled in Firebase Authentication yet";
  return err?.message || "Sign-in failed";
}
