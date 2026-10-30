"use client";

import Link from "next/link";
import { InstagramIcon, WhatsappIcon } from "@/components/ui/brand-icons";
import { useStore } from "@/components/providers/store-provider";
import { LogoCoin } from "@/components/ui/fx";
import { InstallAppButton } from "@/components/ui/install-app";
import { whatsappLink } from "@/lib/whatsapp";

const link = "inline-flex min-h-10 items-center transition-colors hover:text-ink";

export function SiteFooter() {
  const { data } = useStore();
  const s = data.settings;
  const categories = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line bg-black text-sm text-muted">
            <div className="season-footer-edge" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" aria-hidden />
      <div className="container-x relative grid gap-10 pt-14 pb-28 lg:pb-14 lg:grid-cols-[1.4fr_2fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <LogoCoin hat float={false} className="size-12" />
            <p className="font-display neon-text text-3xl font-black">{s.storeName}</p>
          </div>
          <p className="mt-4 leading-relaxed text-pretty">{s.tagline || "أزياء محتشمة بأقمشة ناعمة ومختارة بعناية."}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={whatsappLink(s.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="press btn btn-sm btn-whatsapp">
              <WhatsappIcon className="size-4" /> واتساب
            </a>
            {s.instagramUrl && (
              <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className="press btn btn-sm btn-outline border-white/20 text-ink">
                <InstagramIcon className="size-4" /> إنستغرام
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <nav aria-labelledby="footer-cats">
            <h2 id="footer-cats" className="mb-3 text-xs font-semibold text-gold">
              الأقسام
            </h2>
            <ul className="grid gap-x-6 sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link className={link} href={`/shop?category=${c.slug}`}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-help">
            <h2 id="footer-help" className="mb-3 text-xs font-semibold text-gold">
              المساعدة
            </h2>
            <ul>
              <li>
                <Link className={link} href="/shop">
                  كل المنتجات
                </Link>
              </li>
              <li>
                <Link className={link} href="/policies">
                  التوصيل والاستبدال
                </Link>
              </li>
              <li>
                <Link className={link} href="/orders">
                  طلباتي
                </Link>
              </li>
              <li>
                <Link className={link} href="/returns">
                  إرجاع أو استبدال
                </Link>
              </li>
              <li>
                <Link className={link} href="/cart">
                  سلة التسوق
                </Link>
              </li>
              <li>
                <InstallAppButton className={`${link} gap-2 text-start`} />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
