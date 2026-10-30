"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { useStore } from "@/components/providers/store-provider";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Floating WhatsApp button. It slides away while the customer scrolls down through
 * products and comes back when they scroll up. Hidden where the page has its own bottom actions.
 */
export function WhatsappFab() {
  const { data } = useStore();
  const pathname = usePathname();
  const [away, setAway] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - last) < 12) return;
        setAway(y > last && y > 320);
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // The home feed has a WhatsApp button on every reel.
  if (pathname === "/" || pathname.startsWith("/product/") || pathname === "/cart" || pathname === "/checkout") return null;
  return (
    <a
      href={whatsappLink(data.settings.whatsappNumber, `السلام عليكم ${data.settings.storeName}، لدي سؤال.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصلي معنا على واتساب"
      className={`fixed end-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 grid size-13 lg:size-14 animate-fade-up place-items-center rounded-full bg-[#1f7a4d] text-white shadow-[0_14px_30px_-10px_rgb(31_122_77/0.7)] transition-[translate,opacity] duration-500 ease-[var(--ease-soft)] [animation-delay:900ms] active:scale-95 lg:end-6 lg:bottom-6 ${
        away ? "pointer-events-none translate-y-24 opacity-0" : ""
      }`}
    >
      <span className="absolute inset-0 rounded-full bg-[#1f7a4d] opacity-40 motion-safe:animate-ping [animation-duration:2.8s]" aria-hidden />
      <WhatsappIcon className="relative size-7" />
    </a>
  );
}
