"use client";

import { usePathname } from "next/navigation";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { useStore } from "@/components/providers/store-provider";
import { whatsappLink } from "@/lib/whatsapp";

/** Floating WhatsApp button. Hidden where the page already has its own bottom actions. */
export function WhatsappFab() {
  const { data } = useStore();
  const pathname = usePathname();
  if (pathname.startsWith("/product/") || pathname === "/cart" || pathname === "/checkout") return null;
  return (
    <a
      href={whatsappLink(data.settings.whatsappNumber, `السلام عليكم ${data.settings.storeName}، لدي سؤال.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصلي معنا على واتساب"
      className="press fixed end-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 grid size-14 animate-fade-up place-items-center rounded-full bg-[#1f7a4d] text-white shadow-[0_14px_30px_-10px_rgb(31_122_77/0.7)] [animation-delay:900ms] sm:end-6 sm:bottom-6"
    >
      <span className="absolute inset-0 rounded-full bg-[#1f7a4d] opacity-40 motion-safe:animate-ping [animation-duration:2.8s]" aria-hidden />
      <WhatsappIcon className="relative size-7" />
    </a>
  );
}
