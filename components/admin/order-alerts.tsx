"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { InstallAppButton } from "@/components/ui/install-app";
import { formatMoney } from "@/lib/commerce";
import type { OrderInquiry } from "@/lib/types";
import { Panel } from "./ui";

const POLL_MS = 30_000;

/** A soft two-note chime made in the browser (no audio file to load). */
function chime() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.16;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* sound is optional */
  }
}

function setBadge(count: number) {
  const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
  if (count > 0) nav.setAppBadge?.(count).catch(() => {});
  else nav.clearAppBadge?.().catch(() => {});
}

/**
 * While the admin is open, checks for new orders every 30 seconds (and at once when a
 * push arrives or the app comes back to the screen), then shows them with a chime.
 */
export function OrderWatcher() {
  const { data, ready, isLocalOnly, receiveOrders } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const known = useRef<Set<string> | null>(null);
  const busy = useRef(false);
  const money = useCallback((n: number) => formatMoney(n, data.settings), [data.settings]);

  // Start from the orders already loaded, so only later ones are announced.
  useEffect(() => {
    if (ready && !known.current) known.current = new Set(data.orders.map((o) => o.id));
  }, [ready, data.orders]);

  const newCount = data.orders.filter((o) => o.status === "new").length;
  useEffect(() => setBadge(newCount), [newCount]);

  const check = useCallback(async () => {
    if (isLocalOnly || !known.current || busy.current || document.visibilityState !== "visible") return;
    busy.current = true;
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!res.ok) return;
      const { ids } = (await res.json()) as { ids: string[] };
      const fresh = ids.filter((id) => !known.current!.has(id));
      if (!fresh.length) return;
      const orders = (
        await Promise.all(
          fresh.slice(0, 20).map((id) =>
            fetch(`/api/admin/orders/${encodeURIComponent(id)}`, { cache: "no-store" })
              .then((r) => (r.ok ? (r.json() as Promise<OrderInquiry>) : null))
              .catch(() => null),
          ),
        )
      ).filter((o): o is OrderInquiry => !!o);
      fresh.forEach((id) => known.current!.add(id));
      if (!orders.length) return;
      receiveOrders(orders);
      chime();
      const first = orders[0];
      toast.success(orders.length === 1 ? `طلب جديد من ${first.customer.name}` : `${orders.length} طلبات جديدة`, {
        description: orders.length === 1 ? money(first.total) : undefined,
        duration: 10_000,
        action: { label: "عرض", onClick: () => router.push(orders.length === 1 ? `/admin/orders?open=${first.id}` : "/admin/orders") },
      });
    } catch {
      /* offline for a moment: try again on the next tick */
    } finally {
      busy.current = false;
    }
  }, [isLocalOnly, receiveOrders, money, router]);

  useEffect(() => {
    if (isLocalOnly) return;
    const timer = window.setInterval(check, POLL_MS);
    const onVisible = () => void check();
    const onMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string })?.type === "new-order") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [check, isLocalOnly]);

  // Opening the orders screen counts as having seen the alerts.
  useEffect(() => {
    if (pathname.startsWith("/admin/orders")) navigator.serviceWorker?.ready.then((r) => r.getNotifications().then((ns) => ns.forEach((n) => n.close()))).catch(() => {});
  }, [pathname]);

  return null;
}

type PushState = "loading" | "unsupported" | "install-first" | "no-storage" | "denied" | "off" | "on";

function keyBytes(base64url: string) {
  const b64 = base64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64url.length / 4) * 4, "=");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const send = (method: string, body?: unknown) =>
  fetch("/api/admin/push", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

/** Turns new-order notifications on or off for this phone or computer. */
export function NotificationsPanel() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (alive) setState(ios && !standalone ? "install-first" : "unsupported");
        return;
      }
      const info = await fetch("/api/admin/push", { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<{ available: boolean }>) : null))
        .catch(() => null);
      if (!info?.available) {
        if (alive) setState("no-storage");
        return;
      }
      if (Notification.permission === "denied") {
        if (alive) setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (alive) setState(sub ? "on" : "off");
    })().catch(() => alive && setState("unsupported"));
    return () => {
      alive = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const { publicKey } = (await fetch("/api/admin/push", { cache: "no-store" }).then((r) => r.json())) as { publicKey: string };
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      const res = await send("POST", sub.toJSON());
      if (!res.ok) throw new Error();
      setState("on");
      toast.success("تم تفعيل إشعارات الطلبات على هذا الجهاز");
    } catch {
      toast.error("تعذّر تفعيل الإشعارات", { description: "حاول مرة أخرى بعد قليل." });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await send("DELETE", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setState("off");
      toast.success("تم إيقاف الإشعارات على هذا الجهاز");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    const res = await send("PUT").catch(() => null);
    setBusy(false);
    if (res?.ok) toast.success("أُرسل إشعار تجريبي، سيصلك خلال ثوانٍ");
    else toast.error("تعذّر إرسال الإشعار التجريبي");
  }

  const text: Record<PushState, string> = {
    loading: "جارٍ التحقق…",
    unsupported: "هذا المتصفح لا يدعم الإشعارات. جرّب Chrome أو افتح لوحة التحكم من التطبيق المثبّت.",
    "install-first": "على الآيفون: ثبّت لوحة التحكم على الشاشة الرئيسية أولًا، ثم افتحها من هناك وفعّل الإشعارات.",
    "no-storage": "تعمل الإشعارات بعد ربط التخزين المشترك (Vercel Blob) بالموقع.",
    denied: "الإشعارات محظورة لهذا الموقع. اسمح بها من إعدادات المتصفح ثم عد إلى هنا.",
    off: "يصلك إشعار على هذا الجهاز فور وصول طلب جديد، حتى لو كانت لوحة التحكم مغلقة.",
    on: "مفعّلة على هذا الجهاز. يصلك إشعار مع كل طلب جديد.",
  };

  return (
    <div id="notifications" className="scroll-mt-24">
      <Panel title="إشعارات الطلبات" description="فعّلها على كل هاتف أو كمبيوتر تريد أن يصله تنبيه.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-sm text-text">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${state === "on" ? "bg-forest text-ivory" : "bg-sand text-forest"}`}>
              {state === "on" ? <BellRing className="size-5" /> : state === "install-first" ? <Smartphone className="size-5" /> : state === "denied" || state === "unsupported" ? <BellOff className="size-5" /> : <Bell className="size-5" />}
            </span>
            <span className="pt-2">{text[state]}</span>
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            {state === "off" && (
              <button type="button" className="press btn btn-primary" disabled={busy} onClick={enable}>
                <Bell className="size-4" /> تفعيل الإشعارات
              </button>
            )}
            {state === "on" && (
              <>
                <button type="button" className="press btn btn-sm btn-outline border-line" disabled={busy} onClick={test}>
                  إرسال إشعار تجريبي
                </button>
                <button type="button" className="press btn btn-sm btn-ghost text-danger" disabled={busy} onClick={disable}>
                  إيقاف
                </button>
              </>
            )}
            {state === "install-first" && <InstallAppButton className="press btn btn-primary" />}
          </div>
        </div>
      </Panel>
    </div>
  );
}
