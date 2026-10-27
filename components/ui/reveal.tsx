"use client";

import { useEffect, useRef } from "react";

/** Fades content up as it scrolls into view. Respects reduced motion via CSS. */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  as?: "div" | "section" | "li" | "article";
  delay?: number;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.reveal = "shown";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.reveal = "shown";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={ref}
      data-reveal="hidden"
      className={className}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      {...rest}
    >
      {children}
    </Comp>
  );
}
