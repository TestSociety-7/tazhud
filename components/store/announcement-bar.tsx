"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { Star8 } from "@/components/ui/mandala";

export function AnnouncementBar() {
  const { data } = useStore();
  const { enabled, messages, link } = data.homepage.announcement;
  const items = messages.filter((m) => m.trim());
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % items.length), 4500);
    return () => window.clearInterval(t);
  }, [items.length]);

  if (!enabled || items.length === 0) return null;
  const current = items[index % items.length];

  return (
    <div className="on-dark bg-ink text-gold-soft">
      <div className="container-x flex min-h-9 items-center justify-center gap-3 py-2 text-center text-[0.82rem]">
        <Star8 className="hidden size-2.5 shrink-0 text-gold sm:block" />
        <p aria-live="polite" key={current} className="animate-fade-up">
          {link ? (
            <Link href={link} className="underline-offset-4 hover:underline">
              {current}
            </Link>
          ) : (
            current
          )}
        </p>
        <Star8 className="hidden size-2.5 shrink-0 text-gold sm:block" />
      </div>
    </div>
  );
}
