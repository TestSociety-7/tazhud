"use client";

import { useEffect, useRef, useState } from "react";
import { Star8 } from "@/components/ui/mandala";
// Imported so the file gets a fresh, content-hashed address on every deploy.
import logo from "@/public/brand/tazhud-logo.jpg";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Leans its content towards the pointer in 3D. Does nothing on touch screens or with reduced motion. */
export function Tilt({ children, className = "", max = 7 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
  }

  function reset() {
    ref.current?.style.removeProperty("--rx");
    ref.current?.style.removeProperty("--ry");
  }

  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={reset} className={`tilt ${className}`}>
      {children}
    </div>
  );
}

/** Counts up to `value` once it is first shown. */
export function CountUp({ value, format = (n) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const duration = prefersReducedMotion() ? 1 : 900;
    const start = performance.now();
    const begin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(begin + (value - begin) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{format(shown)}</>;
}

/**
 * The brand logo as a gold coin. Every coin on the page turns over together every
 * few seconds and catches a glint of light as it lands: the one logo animation used
 * across the store and the admin. With `hat`, it wears the season's hat in the store.
 */
export function LogoCoin({ className = "size-16", float = true, hat = false }: { className?: string; float?: boolean; hat?: boolean }) {
  return (
    <span className={`coin inline-block shrink-0 ${float ? "float-soft" : ""} ${hat ? "logo-mark" : ""} ${className}`} aria-hidden>
      <span className="coin-inner block">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static brand mark */}
        <img src={logo.src} alt="" className="coin-face object-cover" width={150} height={150} />
        <span className="coin-face coin-back grid place-items-center bg-gradient-to-br from-gold-bright via-gold to-gold-deep">
          <Star8 className="size-1/2 text-ink/80" />
        </span>
        <span className="coin-glint" />
      </span>
    </span>
  );
}
