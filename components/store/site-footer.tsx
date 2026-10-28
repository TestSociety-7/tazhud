"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { InstagramIcon } from "@/components/ui/brand-icons";
import { useStore } from "@/components/providers/store-provider";
import { LogoCoin } from "@/components/ui/fx";
import { whatsappLink } from "@/lib/whatsapp";

export function SiteFooter() {
  const { data } = useStore();
  const s = data.settings;

  return (
    <footer className="on-dark mt-20 bg-ink text-sm text-ivory/70">
      <div className="container-x flex flex-col gap-5 pt-8 pb-24 sm:flex-row sm:pb-8 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LogoCoin float={false} className="size-10" />
          <p className="font-display text-xl text-ivory">{s.storeName}</p>
        </div>
        <nav aria-label="روابط أسفل الصفحة" className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link className="inline-flex min-h-10 items-center hover:text-ivory" href="/shop">المتجر</Link>
          <Link className="inline-flex min-h-10 items-center hover:text-ivory" href="/policies">التوصيل والاستبدال</Link>
          <a href={whatsappLink(s.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 hover:text-ivory">
            <MessageCircle className="size-4" /> واتساب
          </a>
          {s.instagramUrl && (
            <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 hover:text-ivory">
              <InstagramIcon className="size-4" /> إنستغرام
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
