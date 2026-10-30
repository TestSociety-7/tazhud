"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/components/providers/store-provider";

const FREE_RE = /(توصيل مجاني للطلبات فوق\s*₪?\s*)[\d,.]+/;

export function AnnouncementBar() {
  const { data } = useStore();
  const { enabled, messages, link } = data.homepage.announcement;
  const free = data.settings.freeDeliveryThreshold;
  // The free-delivery line always shows the amount set in Settings.
  const items = messages
    .filter((m) => m.trim())
    .filter((m) => free > 0 || !FREE_RE.test(m))
    .map((m) => m.replace(FREE_RE, `$1${free}`));
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
    <div className="season-band on-dark bg-ink text-gold-soft">
      <div className="container-x flex min-h-9 items-center justify-center gap-3 py-2 text-center text-[0.82rem]">
        <p aria-live="polite" key={current} className="animate-fade-up">
          {link ? (
            <Link href={link} className="underline-offset-4 hover:underline">
              {current}
            </Link>
          ) : (
            current
          )}
        </p>
      </div>
      <span className="stitch absolute inset-x-0 bottom-[3px] h-px opacity-50" aria-hidden />
    </div>
  );
}
