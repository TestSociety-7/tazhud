"use client";

import { InstagramIcon } from "@/components/ui/brand-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { Logo } from "@/components/ui/logo";
import { LogoCoin } from "@/components/ui/fx";
import { InstallAppButton } from "@/components/ui/install-app";
import { piecesLabel } from "@/lib/arabic";
import { visibleProducts } from "@/lib/commerce";
import { SmartImage } from "@/components/ui/smart-image";
import { Sheet } from "@/components/ui/sheet";
import { SearchPanel } from "./search-panel";
import { whatsappLink } from "@/lib/whatsapp";
import { SeasonTrim } from "./season";

export function SiteHeader() {
  const { data } = useStore();
  const { count, setDrawerOpen, hydrated } = useCart();
  const pathname = usePathname();
  // Read when the menu opens, so the header itself never waits on the query string.
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
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

  const categories = [...data.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const counts = (id: string) =>
    visibleProducts(data).filter((p) => p.categoryId === id).length;
  const nav = [
    { href: "/shop", label: "كل المنتجات" },
    ...categories
      .slice(0, 3)
      .map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-500 ${
          scrolled
            ? "border-line bg-ivory/90 shadow-[0_8px_24px_-20px_rgb(15_18_15/0.4)] backdrop-blur-md"
            : "border-transparent bg-ivory"
        }`}
      >
        <div className="container-x grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center gap-2 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="icon-btn -ms-2"
              onClick={() => {
                setCurrentCategory(
                  new URLSearchParams(location.search).get("category"),
                );
                setMenuOpen(true);
              }}
              aria-label="فتح القائمة"
            >
              <Menu className="size-5" />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="بحث"
            >
              <Search className="size-5" />
            </button>
          </div>

          <Logo name={data.settings.storeName} />

          <nav
            aria-label="القائمة الرئيسية"
            className="hidden justify-center lg:flex"
          >
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
            <button
              type="button"
              className="icon-btn hidden lg:inline-grid"
              onClick={() => setSearchOpen(true)}
              aria-label="بحث"
            >
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
              <ShoppingBag
                className={`size-5 transition-transform ${bump ? "scale-125" : ""}`}
              />
              {hydrated && count > 0 && (
                <span className="absolute top-1 end-0.5 grid min-w-[1.15rem] place-items-center rounded-full bg-forest px-1 text-[0.65rem] leading-[1.15rem] font-bold text-ivory">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
        <span className="scroll-progress" aria-hidden />
        <SeasonTrim />
      </header>

      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        side="start"
        title="القائمة"
        heading={
          <span className="flex items-center gap-2.5">
            <LogoCoin hat float={false} className="size-9" />
            <span className="font-display text-2xl text-ivory">
              {data.settings.storeName}
            </span>
          </span>
        }
        className="on-dark !bg-ink !text-ivory [&>div:first-child]:border-white/10"
      >
        <nav
          aria-label="قائمة الجوال"
          className="relative flex min-h-full flex-col px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <div
            className="pattern-geo pointer-events-none absolute inset-0 opacity-[0.05]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -top-24 -end-24 size-72 rounded-full bg-gold/15 blur-3xl"
            aria-hidden
          />

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
            }}
            className="press relative flex min-h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-ivory/60"
          >
            <Search className="size-4 text-gold" /> ابحثي عن قطعة…
          </button>

          <p className="relative mt-7 mb-1 text-xs font-semibold tracking-wide text-gold">
            الأقسام
          </p>
          <ul className="menu-stagger relative">
            {categories.map((c) => {
              const active = pathname === "/shop" && currentCategory === c.slug;
              return (
                <li key={c.id} className="border-b border-white/10">
                  <Link
                    href={`/shop?category=${c.slug}`}
                    aria-current={active ? "page" : undefined}
                    className="group flex min-h-[4.5rem] items-center gap-4 py-2"
                  >
                    <span className="arch-full relative h-14 w-11 shrink-0 overflow-hidden bg-ink-2 ring-1 ring-gold/30 transition-transform duration-500 group-active:scale-95">
                      <SmartImage
                        src={c.image}
                        alt=""
                        className="absolute inset-0"
                        fallbackLabel={c.name}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`font-display block text-[1.6rem] leading-tight transition-colors ${active ? "text-gold" : "text-ivory group-hover:text-gold-soft"}`}
                      >
                        {c.name}
                      </span>
                      <span className="block text-xs text-ivory/50">
                        {piecesLabel(counts(c.id))}
                      </span>
                    </span>
                    <ChevronLeft className="size-5 text-gold/70 transition-transform duration-300 group-hover:-translate-x-1" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href="/shop"
            className="press sheen btn btn-gold relative mt-6 w-full"
          >
            كل المنتجات <ArrowLeft className="size-4" />
          </Link>

          <div className="relative mt-auto pt-8">
            <div className="grid grid-cols-2 gap-3">
              <a
                href={whatsappLink(data.settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="press btn btn-whatsapp"
              >
                <MessageCircle className="size-4" /> واتساب
              </a>
              {data.settings.instagramUrl && (
                <a
                  href={data.settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press btn btn-outline border-white/20 text-ivory"
                >
                  <InstagramIcon className="size-4" /> إنستغرام
                </a>
              )}
            </div>
            <InstallAppButton className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/10 text-sm text-gold-soft" />
            <Link
              href="/policies"
              className="mt-1 flex min-h-11 items-center justify-center text-sm text-ivory/55 underline-offset-4 hover:text-ivory hover:underline"
            >
              التوصيل والاستبدال
            </Link>
          </div>
        </nav>
      </Sheet>

      <Sheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        side="top"
        title="بحث"
      >
        <SearchPanel
          onNavigate={() => setSearchOpen(false)}
          active={searchOpen}
        />
      </Sheet>
    </>
  );
}
