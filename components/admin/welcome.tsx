"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { LogoCoin } from "@/components/ui/fx";
import { SEASON_WORDS, useSeason } from "@/components/store/season";

const SEEN = "tz-admin-hi";

export function greeting(hour: number) {
  if (hour < 0) return "مرحبًا";
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "نهارك سعيد";
  return "مساء الخير";
}

/** The logo coin inside a turning story ring, zooming in like the first frame of a reel. */
export function WelcomeMark({ size = "size-28", pad = "p-1" }: { size?: string; pad?: string }) {
  return (
    <div className={`cine-zoom relative mx-auto w-fit shrink-0 ${pad}`}>
      <span className={`story-ring is-live !size-auto !p-1`}>
        <span className="story-face overflow-hidden !border-4">
          <LogoCoin hat float={false} className={size} />
        </span>
      </span>
    </div>
  );
}

/** Instagram-style story bars that fill once over `ms`. */
export function StoryBars({ ms, count = 3 }: { ms: number; count?: number }) {
  return (
    <div className="story-progress fixed inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] z-[95] mx-auto max-w-md" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <i key={i} style={{ "--d": `${ms / count}ms`, "--delay": `${(ms / count) * i}ms` } as React.CSSProperties} />
      ))}
    </div>
  );
}

/** The dark stage with drifting neon light behind the sign-in and the welcome. */
export function StudioBackdrop() {
  return (
    <>
      <span className="studio-blob studio-blob-a" aria-hidden />
      <span className="studio-blob studio-blob-b" aria-hidden />
      <span className="studio-blob studio-blob-c" aria-hidden />
    </>
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
  const season = useSeason();
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
      className={`studio-stage fixed inset-0 z-[90] grid place-items-center px-6 text-center transition-[opacity,transform] duration-500 ${phase === "leaving" ? "scale-105 opacity-0" : ""}`}
    >
      <StudioBackdrop />
      <StoryBars ms={1700} />
      <div className="relative">
        <WelcomeMark />
        <p className="cine-mask mt-8"><span className="cine-line text-sm font-bold text-gold-bright" style={{ animationDelay: "300ms" }}>{greeting(new Date().getHours())}</span></p>
        <p className="cine-mask mt-1">
          <span className="cine-line studio-title text-[2.6rem] sm:text-6xl" style={{ animationDelay: "420ms" }}>
            أهلًا بك في <span className="neon-text">{data.settings.storeName}</span>
          </span>
        </p>
        <p className="cine-mask mt-3">
          <span className="cine-line text-base text-text" style={{ animationDelay: "560ms" }}>
            {fresh > 0 ? `عندك ${fresh} ${fresh === 1 ? "طلب جديد" : "طلبات جديدة"} بانتظارك` : "كل شيء جاهز"}
          </span>
        </p>
        {season !== "original" && (
          <p className="welcome-text season-chip chip mt-5" style={{ animationDelay: "750ms" }}>
            {SEASON_WORDS[season].hello}
          </p>
        )}
      </div>
    </div>
  );
}
