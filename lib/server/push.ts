import { createECDH, hkdfSync } from "node:crypto";
import webpush, { type PushSubscription } from "web-push";
import { deletePushSubscription, hasSharedStorage, readPushSubscriptions, serverSeed } from "./storage";
import { SITE_URL } from "@/lib/site";

/**
 * Web Push for the admin. The VAPID key pair is derived from the server secret,
 * so there is nothing extra to set up in Vercel and the keys stay the same
 * between deployments.
 */
let keys: { publicKey: string; privateKey: string } | null = null;

export function vapidKeys() {
  if (keys) return keys;
  const ecdh = createECDH("prime256v1");
  for (let i = 0; ; i++) {
    try {
      const priv = Buffer.from(hkdfSync("sha256", serverSeed(), "tazhud-vapid", `push-key-${i}`, 32));
      ecdh.setPrivateKey(priv);
      keys = { publicKey: ecdh.getPublicKey().toString("base64url"), privateKey: priv.toString("base64url") };
      return keys;
    } catch {
      // Out of range for the curve (astronomically rare): try the next value.
    }
  }
}

export function isValidSubscription(input: unknown): input is PushSubscription {
  const s = input as PushSubscription | null;
  return (
    !!s &&
    typeof s.endpoint === "string" &&
    /^https:\/\/[^\s]{8,800}$/.test(s.endpoint) &&
    typeof s.keys?.p256dh === "string" &&
    typeof s.keys?.auth === "string" &&
    s.keys.p256dh.length < 200 &&
    s.keys.auth.length < 100
  );
}

/** Sends a notification to every admin device that turned them on. Never throws. */
export async function notifyAdmins(payload: { title: string; body: string; url: string; tag?: string }) {
  if (!hasSharedStorage()) return;
  try {
    const { publicKey, privateKey } = vapidKeys();
    const subs = await readPushSubscriptions<PushSubscription>();
    const message = JSON.stringify(payload);
    await Promise.all(
      subs.filter(isValidSubscription).map(async (sub) => {
        try {
          await webpush.sendNotification(sub, message, {
            vapidDetails: { subject: SITE_URL, publicKey, privateKey },
            TTL: 60 * 60 * 24,
            urgency: "high",
          });
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode;
          // The device unsubscribed or the browser dropped it: forget it.
          if (code === 404 || code === 410) await deletePushSubscription(sub.endpoint).catch(() => {});
        }
      }),
    );
  } catch {
    // Notifications are a bonus; the order is already saved.
  }
}
