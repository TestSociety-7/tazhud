"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { LogoCoin } from "@/components/ui/fx";

const SEEN = "tz-admin-hi";

export function greeting(hour: number) {
  if (hour < 0) return "مرحبًا";
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "نهارك سعيد";
  return "مساء الخير";
}

/** The logo coin inside two gold rings turning in 3D. Used on every admin welcome. */
export function WelcomeMark({ size = "size-28", pad = "p-6" }: { size?: string; pad?: string }) {
  return (
    <div className={`orbit-stage welcome-coin relative mx-auto grid w-fit shrink-0 place-items-center ${pad}`}>
      <span className="orbit orbit-a" aria-hidden />
      <span className="orbit orbit-b" aria-hidden />
      <LogoCoin float={false} className={size} />
    </div>
  );
}

/** Marks the greeting as shown, e.g. right after signing in, which has its own welcome. */
export function markWelcomed() {
  try {
    sessionStorage.setItem(SEEN, "1");
  } catch {
    /* private mode: the greeting may simply show again */
  }
}

/** Greets the admin each time the panel is opened (once per visit). */
export function AdminWelcome() {
  const { data } = useStore();
  const [phase, setPhase] = useState<"off" | "on" | "leaving">("off");

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(SEEN) === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* ignore */
    }
    if (seen) return;
    markWelcomed();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads session storage after hydration
    setPhase("on");
    const a = window.setTimeout(() => setPhase("leaving"), 1700);
    const b = window.setTimeout(() => setPhase("off"), 2200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  if (phase === "off") return null;
  const fresh = data.orders.filter((o) => o.status === "new").length;
  return (
    <div
      role="status"
      onClick={() => setPhase("off")}
      className={`on-dark fixed inset-0 z-[90] grid place-items-center overflow-hidden bg-ink px-4 text-center text-ivory transition-opacity duration-500 ${phase === "leaving" ? "opacity-0" : ""}`}
    >
      <div className="pattern-geo absolute inset-0 opacity-[0.07]" aria-hidden />
      <div className="welcome-glow pointer-events-none absolute top-1/2 left-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/25 blur-3xl" aria-hidden />
      <div className="relative">
        <WelcomeMark />
        <p className="welcome-text mt-8 text-sm text-gold">{greeting(new Date().getHours())}</p>
        <p className="welcome-text font-display mt-1 text-4xl sm:text-5xl" style={{ animationDelay: "450ms" }}>
          أهلًا بك في {data.settings.storeName}
        </p>
        <p className="welcome-text mt-3 text-sm text-ivory/70" style={{ animationDelay: "600ms" }}>
          {fresh > 0 ? `عندك ${fresh} ${fresh === 1 ? "طلب جديد" : "طلبات جديدة"} بانتظارك` : "كل شيء جاهز"}
        </p>
      </div>
    </div>
  );
}
