/**
 * Minimal passcode gate for /admin.
 *
 * A signed, httpOnly cookie proves the visitor entered ADMIN_PASSCODE. This
 * keeps casual visitors out of the admin screens. It is a single shared
 * passcode, not user accounts: add a real auth provider before production
 * (see README). Works in both the proxy and route handlers (Web Crypto only).
 */

export const ADMIN_COOKIE = "tazhud_admin";
export const DEMO_PASSCODE = "tazhud-demo";
const SESSION_DAYS = 7;

export function adminPasscode() {
  return process.env.ADMIN_PASSCODE || DEMO_PASSCODE;
}

export function isDemoPasscode() {
  return !process.env.ADMIN_PASSCODE;
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || `tazhud:${adminPasscode()}`;
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
  // Compare signatures rather than raw strings to avoid length/timing leaks.
  const [a, b] = await Promise.all([sign(`pass:${input}`), sign(`pass:${adminPasscode()}`)]);
  return safeEqual(a, b);
}

export async function createSessionToken() {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `admin.${expires}`;
  return { token: `${payload}.${await sign(payload)}`, maxAge: SESSION_DAYS * 24 * 60 * 60 };
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  return safeEqual(parts[2], await sign(`${parts[0]}.${parts[1]}`));
}
