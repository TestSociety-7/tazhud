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

/**
 * The logo as a pearl inside a 3D orbit: a ring tilted back, a second fainter one,
 * and a small pearl bead travelling round. Used on sign-in, the welcome and the dashboard.
 */
export function WelcomeMark({
  size = "size-28",
  pad = "p-6",
  orbit = "5.5rem",
  enter = true,
}: {
  size?: string;
  pad?: string;
  /** Horizontal radius of the bead's path. */
  orbit?: string;
  enter?: boolean;
}) {
  return (
    <div className={`pearl-orbit relative mx-auto w-fit shrink-0 ${enter ? "welcome-coin" : ""} ${pad}`} aria-hidden>
      <span className="moon-glow -inset-6" />
      <span className="admin-ring alt back" />
      <span className="admin-ring back" />
      <LogoCoin hat float={false} className={size} />
      <span className="admin-ring front" />
      <span className="admin-ring alt front" />
      <span className="bead-x" style={{ "--rx": orbit } as React.CSSProperties}>
        <span className="bead-y" style={{ "--ry": `calc(${orbit} * 0.24)` } as React.CSSProperties}>
          <i className="orbit-bead block" />
        </span>
      </span>
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

/** Full-screen night scene: a pearl burst, the logo turning in, and the words rising out of a blur. */
export function WelcomeScene({
  eyebrow,
  title,
  note,
  extra,
  leaving = false,
  onClick,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  note?: React.ReactNode;
  extra?: React.ReactNode;
  leaving?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      role="status"
      onClick={onClick}
      data-leaving={leaving}
      className="on-dark admin-night welcome-scene fixed inset-0 z-[90] grid place-items-center px-5 text-center"
    >
      <span className="night-stars" aria-hidden />
      <span className="welcome-burst" aria-hidden />
      <span className="welcome-ring" aria-hidden />
      <span className="welcome-ring late" aria-hidden />
      <div className="relative">
        <WelcomeMark size="size-28" pad="p-8" orbit="6rem" />
        {eyebrow && <p className="welcome-text mt-6 text-sm font-semibold text-gold-bright">{eyebrow}</p>}
        <p className="welcome-text font-display mt-2 text-[2.6rem] leading-tight text-balance sm:text-6xl" style={{ animationDelay: "450ms" }}>
          <span className="pearl-text">{title}</span>
        </p>
        <span className="welcome-line mt-4" aria-hidden />
        {note && (
          <p className="welcome-text mt-4 text-[0.95rem] text-ivory/75" style={{ animationDelay: "650ms" }}>
            {note}
          </p>
        )}
        {extra}
      </div>
    </div>
  );
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
    <WelcomeScene
      onClick={() => setPhase("off")}
      leaving={phase === "leaving"}
      eyebrow={greeting(new Date().getHours())}
      title={`أهلًا بك في ${data.settings.storeName}`}
      note={fresh > 0 ? `عندك ${fresh} ${fresh === 1 ? "طلب جديد" : "طلبات جديدة"} بانتظارك` : "كل شيء جاهز"}
      extra={
        season !== "original" && (
          <p className="welcome-text season-chip mt-4 inline-block rounded-full px-3.5 py-1.5 text-xs font-semibold" style={{ animationDelay: "750ms" }}>
            {SEASON_WORDS[season].hello}
          </p>
        )
      }
    />
  );
}
