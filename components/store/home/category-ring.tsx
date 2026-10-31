"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { piecesLabel } from "@/lib/arabic";
import type { Category } from "@/lib/types";

/**
 * The categories stand on a 3D carousel: swipe or drag to spin it, tap the front card to open it.
 * It turns by itself now and then until someone touches it. Keyboard users move through the
 * links normally and the ring turns to the focused card.
 */
export function CategoryRing({ cats, counts }: { cats: Category[]; counts: (id: string) => number }) {
  const n = cats.length;
  const step = 360 / n;
  const [index, setIndex] = useState(0);
  const [cardW, setCardW] = useState(160);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; moved: boolean; base: number } | null>(null);
  const touched = useRef(false);

  // The card size follows the screen; the radius follows the card size.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCardW(Math.min(220, Math.max(130, e.contentRect.width * 0.42))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const radius = Math.round(cardW / 2 / Math.tan(Math.PI / n) + 18);

  // Turns on its own while visible, until the first touch.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const io = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      if (entry.isIntersecting && !touched.current) timer = window.setInterval(() => !touched.current && setIndex((i) => i + 1), 3200);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  const angle = -index * step;
  const front = ((index % n) + n) % n;

  function onDown(e: React.PointerEvent) {
    touched.current = true;
    drag.current = { x: e.clientX, moved: false, base: angle };
  }
  function onMove(e: React.PointerEvent) {
    const d = drag.current;
    const ring = ringRef.current;
    if (!d || !ring) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      ring.dataset.dragging = "true";
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    // RTL: dragging to the left brings the next card in.
    if (d.moved) ring.style.transform = `translateZ(${-radius}px) rotateY(${d.base - dx * 0.35}deg)`;
  }
  function onUp(e: React.PointerEvent) {
    const d = drag.current;
    const ring = ringRef.current;
    drag.current = null;
    if (!d || !ring || !d.moved) return;
    const dx = e.clientX - d.x;
    ring.dataset.dragging = "false";
    ring.style.transform = "";
    setIndex(Math.round(-(d.base - dx * 0.35) / step));
    // Swallow the click that ends a drag so it does not open a category.
    const stop = (ev: Event) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    window.addEventListener("click", stop, { capture: true, once: true });
    window.setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 0);
  }

  return (
    <div>
      <div
        ref={stageRef}
        className="cring-stage mx-auto max-w-3xl"
        style={{ height: cardW * 1.33 + 70 }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div ref={ringRef} className="cring" style={{ transform: `translateZ(${-radius}px) rotateY(${angle}deg)` }}>
          {cats.map((c, i) => {
            // How far this card is from the front, in steps (0 = facing the customer).
            const off = Math.min(Math.abs(i - front), n - Math.abs(i - front));
            return (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                draggable={false}
                onClick={(e) => {
                  // A side card turns to the front first; the front card opens.
                  if (off === 0) return;
                  e.preventDefault();
                  touched.current = true;
                  setIndex((cur) => cur + ((((i - cur) % n) + n + Math.floor(n / 2)) % n) - Math.floor(n / 2));
                }}
                onFocus={(e) => {
                  if (!e.currentTarget.matches(":focus-visible")) return;
                  touched.current = true;
                  setIndex((cur) => cur + ((((i - cur) % n) + n + Math.floor(n / 2)) % n) - Math.floor(n / 2));
                }}
                className="cring-card group block text-center"
                style={{
                  width: cardW,
                  marginInlineStart: -cardW / 2,
                  transform: `rotateY(${i * step}deg) translateZ(${radius}px)`,
                  opacity: off === 0 ? 1 : off === 1 ? 0.8 : 0.45,
                  filter: off === 0 ? "none" : `saturate(0.7) brightness(${off === 1 ? 0.92 : 0.8})`,
                }}
              >
                <span className="leaf pearl-ring shine-follow relative block aspect-[3/4] overflow-hidden bg-sand shadow-[0_30px_50px_-30px_rgb(12_16_36/0.7)]" style={{ "--shine": off === 0 ? 1 : 0, "--mx": "30%", "--my": "10%" } as React.CSSProperties}>
                  <SmartImage src={c.image} alt="" className="absolute inset-0" fallbackLabel={c.name} />
                  <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/70 to-transparent" aria-hidden />
                  <span className="absolute inset-x-0 bottom-3 px-2 text-ivory">
                    <span className="font-display block text-lg leading-tight">{c.name}</span>
                    <span className="block text-[0.68rem] text-ivory/75">{piecesLabel(counts(c.id))}</span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        <span className="cring-floor" aria-hidden />
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          className="press glass grid size-11 place-items-center rounded-full text-ink"
          onClick={() => {
            touched.current = true;
            setIndex((i) => i - 1);
          }}
          aria-label="القسم السابق"
        >
          <ChevronRight className="size-5" />
        </button>
        <p className="min-w-24 text-center text-sm font-semibold text-ink" aria-live="polite">
          {cats[front]?.name}
        </p>
        <button
          type="button"
          className="press glass grid size-11 place-items-center rounded-full text-ink"
          onClick={() => {
            touched.current = true;
            setIndex((i) => i + 1);
          }}
          aria-label="القسم التالي"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>
    </div>
  );
}
