/**
 * Passcode gate for /admin.
 *
 * A signed, httpOnly cookie proves the visitor entered ADMIN_PASSCODE. It is a
 * single shared passcode, not user accounts. Works in both the proxy and route
 * handlers (Web Crypto only).
 */

const PRODUCTION = process.env.NODE_ENV === "production";

/** "__Host-" makes the browser refuse the cookie unless it is Secure, host-only and path=/. */
export const ADMIN_COOKIE = PRODUCTION ? "__Host-tazhud_admin" : "tazhud_admin";
const DEMO_PASSCODE = "tazhud-demo";
export const SESSION_DAYS = 7;

/** The passcode, or null when none is set in production (sign-in is then switched off). */
export function adminPasscode() {
  if (process.env.ADMIN_PASSCODE) return process.env.ADMIN_PASSCODE;
  return PRODUCTION ? null : DEMO_PASSCODE;
}

/**
 * The signing key mixes in the passcode, so changing ADMIN_PASSCODE (or
 * ADMIN_SESSION_SECRET) signs every device out at once.
 */
function secret() {
  return `${process.env.ADMIN_SESSION_SECRET || "tazhud-session"}|${adminPasscode() ?? ""}`;
}

const enc = new TextEncoder();

function toBase64Url(buf: ArrayBuffer) {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return toBase64Url(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPasscode(input: string) {
  const passcode = adminPasscode();
  if (!passcode || !input || input.length > 200) return false;
  // Compare signatures rather than raw strings to avoid length/timing leaks.
  const [a, b] = await Promise.all([sign(`pass:${input}`), sign(`pass:${passcode}`)]);
  return safeEqual(a, b);
}

export async function createSessionToken() {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const payload = `admin.${Date.now() + maxAge * 1000}`;
  return { token: `${payload}.${await sign(payload)}`, maxAge };
}

export async function verifySessionToken(token: string | undefined) {
  if (!token || token.length > 200 || !adminPasscode()) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  return safeEqual(parts[2], await sign(`${parts[0]}.${parts[1]}`));
}

export function sessionCookie(token: string, maxAge: number) {
  return { name: ADMIN_COOKIE, value: token, httpOnly: true, sameSite: "lax" as const, secure: PRODUCTION, path: "/", maxAge };
}
