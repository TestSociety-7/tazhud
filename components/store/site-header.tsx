"use client";

import { InstagramIcon } from "@/components/ui/brand-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Menu,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
  Undo2,
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
import { readMyOrders } from "@/lib/my-orders";
import { SeasonTrim } from "./season";

export function SiteHeader() {
  const { data } = useStore();
  const { count, setDrawerOpen, hydrated } = useCart();
  const pathname = usePathname();
  // Read when the menu opens, so the header itself never waits on the query string.
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [myOrders, setMyOrders] = useState(0);
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
                setMyOrders(readMyOrders().length);
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
            <Link href="/orders" className="icon-btn hidden lg:inline-grid" aria-label="طلباتي">
              <Package className="size-5" />
            </Link>
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

          {/* The things customers come back for, one tap away. */}
          <ul className="menu-stagger relative mt-5 grid grid-cols-2 gap-3">
            {[
              { href: "/orders", label: "طلباتي", note: myOrders ? `${myOrders} ${myOrders === 1 ? "طلب" : "طلبات"}` : "تابعي طلباتكِ", icon: Package },
              { href: "/returns", label: "إرجاع أو استبدال", note: `خلال ${data.settings.returnDays} أيام`, icon: Undo2 },
              { href: "/cart", label: "السلة", note: hydrated && count ? piecesLabel(count) : "فارغة", icon: ShoppingBag },
              { href: whatsappLink(data.settings.whatsappNumber), label: "تواصلي معنا", note: "واتساب", icon: MessageCircle, external: true },
            ].map(({ href, label, note, icon: Icon, external }) => (
              <li key={label}>
                <Link
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  aria-current={pathname === href ? "page" : undefined}
                  className={`press flex h-full flex-col gap-3 rounded-2xl border p-3.5 transition-colors ${pathname === href ? "border-gold/60 bg-gold/15" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-gold-bright to-gold-deep text-ink shadow-[0_8px_18px_-8px_rgb(201_162_74/0.7)]">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ivory">{label}</span>
                    <span className="block text-[0.7rem] text-ivory/55">{note}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="relative mt-7 mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-gold">الأقسام</p>
            <Link href="/shop" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-gold-soft">
              كل المنتجات <ArrowLeft className="size-3.5" />
            </Link>
          </div>
          <ul className="menu-stagger relative grid grid-cols-3 gap-x-3 gap-y-4">
            {categories.map((c) => {
              const active = pathname === "/shop" && currentCategory === c.slug;
              return (
                <li key={c.id}>
                  <Link
                    href={`/shop?category=${c.slug}`}
                    aria-current={active ? "page" : undefined}
                    className="group block text-center"
                  >
                    <span className={`arch-full relative block aspect-[3/4] overflow-hidden bg-ink-2 ring-1 transition-transform duration-500 group-active:scale-95 ${active ? "ring-2 ring-gold" : "ring-gold/30"}`}>
                      <SmartImage src={c.image} alt="" className="absolute inset-0" fallbackLabel={c.name} />
                    </span>
                    <span className={`mt-1.5 block text-[0.8rem] leading-tight font-semibold ${active ? "text-gold" : "text-ivory"}`}>{c.name}</span>
                    <span className="block text-[0.65rem] text-ivory/45">{piecesLabel(counts(c.id))}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="relative mt-auto pt-8">
            <div className="flex items-center justify-center gap-2">
              {data.settings.instagramUrl && (
                <a
                  href={data.settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press btn btn-sm btn-outline border-white/20 text-ivory"
                >
                  <InstagramIcon className="size-4" /> إنستغرام
                </a>
              )}
              <InstallAppButton className="press btn btn-sm border border-white/15 text-gold-soft" />
            </div>
            <Link
              href="/policies"
              className="mt-2 flex min-h-11 items-center justify-center text-sm text-ivory/55 underline-offset-4 hover:text-ivory hover:underline"
            >
              التوصيل والإرجاع والسياسات
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
