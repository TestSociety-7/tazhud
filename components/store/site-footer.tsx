"use client";

import { InstagramIcon } from "@/components/ui/brand-icons";
import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { LogoMark } from "@/components/ui/logo";
import { Mandala } from "@/components/ui/mandala";
import { whatsappLink } from "@/lib/whatsapp";
import { NewsletterForm } from "./newsletter-form";

export function SiteFooter() {
  const { data } = useStore();
  const s = data.settings;
  const categories = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <footer className="on-dark relative mt-24 overflow-hidden bg-ink text-ivory/80">
      <Mandala className="pointer-events-none absolute -top-40 -right-40 size-[28rem] text-gold/15 motion-safe:animate-spin-slow" />
      <div className="container-x relative grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark className="size-14" />
            <p className="font-display text-3xl text-ivory">{s.storeName}</p>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{s.tagline}</p>
          <div className="mt-6 flex gap-2">
            <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className="icon-btn border border-white/15" aria-label={`Instagram ${s.instagramHandle}`}>
              <InstagramIcon className="size-5" />
            </a>
            <a href={whatsappLink(s.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="icon-btn border border-white/15" aria-label="WhatsApp">
              <MessageCircle className="size-5" />
            </a>
            {s.email && (
              <a href={`mailto:${s.email}`} className="icon-btn border border-white/15" aria-label="Email">
                <Mail className="size-5" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h2 className="eyebrow text-gold">Shop</h2>
          <ul className="mt-4 space-y-1 text-sm">
            <li><Link className="inline-flex min-h-9 items-center hover:text-ivory" href="/shop">All pieces</Link></li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link className="inline-flex min-h-9 items-center hover:text-ivory" href={`/shop?category=${c.slug}`}>{c.name}</Link>
              </li>
            ))}
            <li><Link className="inline-flex min-h-9 items-center hover:text-ivory" href="/shop?view=bundles">Bundles</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="eyebrow text-gold">Help</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {s.policies.map((p) => (
              <li key={p.id}>
                <Link className="inline-flex min-h-9 items-center hover:text-ivory" href={`/policies#${p.id}`}>{p.title}</Link>
              </li>
            ))}
            <li><Link className="inline-flex min-h-9 items-center hover:text-ivory" href="/cart">Your bag</Link></li>
          </ul>
          {s.address && (
            <p className="mt-6 flex gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" /> <span>{s.address}<br />{s.hours}</span>
            </p>
          )}
        </div>

        <div>
          <h2 className="eyebrow text-gold">Join the circle</h2>
          <p className="mt-4 mb-4 text-sm">New drops, restocks and styling notes. No spam.</p>
          <NewsletterForm dark />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {s.storeName}. All rights reserved.</p>
          <p>Orders are placed and confirmed on WhatsApp. No online payment is taken on this site.</p>
        </div>
      </div>
    </footer>
  );
}
