"use client";

import { InstagramIcon } from "@/components/ui/brand-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { Logo, LogoMark } from "@/components/ui/logo";
import { OrnamentDivider } from "@/components/ui/mandala";
import { Sheet } from "@/components/ui/sheet";
import { SearchPanel } from "./search-panel";
import { whatsappLink } from "@/lib/whatsapp";

export function SiteHeader() {
  const { data } = useStore();
  const { count, setDrawerOpen, hydrated } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const [lastCount, setLastCount] = useState(count);

  if (count !== lastCount) {
    setLastCount(count);
    if (hydrated && count > lastCount) setBump(true);
  }

  useEffect(() => {
    if (!bump) return;
    const t = window.setTimeout(() => setBump(false), 600);
    return () => window.clearTimeout(t);
  }, [bump]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  const categories = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const nav = [
    { href: "/shop", label: "كل المنتجات" },
    ...categories.slice(0, 3).map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
    { href: "/shop?view=bundles", label: "المجموعات" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-500 ${
          scrolled ? "border-line bg-ivory/90 shadow-[0_8px_24px_-20px_rgb(15_18_15/0.4)] backdrop-blur-md" : "border-transparent bg-ivory"
        }`}
      >
        <div className="container-x grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center gap-2 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center lg:hidden">
            <button type="button" className="icon-btn -ms-2" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة">
              <Menu className="size-5" />
            </button>
            <button type="button" className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="بحث">
              <Search className="size-5" />
            </button>
          </div>

          <Logo name={data.settings.storeName} />

          <nav aria-label="القائمة الرئيسية" className="hidden justify-center lg:flex">
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative rounded-full px-4 py-2 text-[0.85rem] font-medium text-text transition-colors after:absolute after:inset-x-4 after:bottom-1 after:h-px after:origin-right after:scale-x-0 after:bg-gold after:transition-transform after:duration-500 hover:text-ink hover:after:scale-x-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center justify-end">
            <button type="button" className="icon-btn hidden lg:inline-grid" onClick={() => setSearchOpen(true)} aria-label="بحث">
              <Search className="size-5" />
            </button>
            <a
              href={data.settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn hidden sm:inline-grid"
              aria-label={`إنستغرام ${data.settings.instagramHandle} (يفتح في نافذة جديدة)`}
            >
              <InstagramIcon className="size-5" />
            </a>
            <button
              type="button"
              className="icon-btn relative -me-2"
              onClick={() => setDrawerOpen(true)}
              aria-label={`فتح السلة، ${count} قطعة`}
            >
              <ShoppingBag className={`size-5 transition-transform ${bump ? "scale-125" : ""}`} />
              {hydrated && count > 0 && (
                <span className="absolute top-1 end-0.5 grid min-w-[1.15rem] place-items-center rounded-full bg-forest px-1 text-[0.65rem] leading-[1.15rem] font-bold text-ivory">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} side="start" title="القائمة">
        <nav aria-label="قائمة الجوال" className="px-5 py-4">
          <ul className="space-y-1">
            <li>
              <Link href="/shop" className="flex min-h-12 items-center font-display text-2xl text-ink">
                كل المنتجات
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/shop?category=${c.slug}`} className="flex min-h-12 items-center font-display text-2xl text-ink">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop?view=bundles" className="flex min-h-12 items-center font-display text-2xl text-ink">
                المجموعات
              </Link>
            </li>
          </ul>
          <OrnamentDivider className="my-6" />
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/cart" className="flex min-h-11 items-center">سلة التسوق</Link>
            </li>
            <li>
              <Link href="/policies" className="flex min-h-11 items-center">التوصيل والاستبدال</Link>
            </li>
            <li>
              <a href={whatsappLink(data.settings.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center">
                تواصلي معنا على واتساب
              </a>
            </li>
            <li>
              <a href={data.settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2">
                <InstagramIcon className="size-4" /> {data.settings.instagramHandle}
              </a>
            </li>
          </ul>
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-ink p-4 text-gold-soft">
            <LogoMark className="size-12" />
            <p className="text-sm leading-snug">{data.settings.tagline}</p>
          </div>
        </nav>
      </Sheet>

      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)} side="top" title="بحث">
        <SearchPanel onNavigate={() => setSearchOpen(false)} active={searchOpen} />
      </Sheet>
    </>
  );
}
