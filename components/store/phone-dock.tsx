"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, LayoutGrid, Menu, Search, ShoppingBag } from "lucide-react";

/**
 * Floating glass dock for phones: home, shop, the cart as a raised pearl, search and menu,
 * all within thumb reach. It tucks away while scrolling down and returns on the way up.
 * Hidden on pages that have their own bottom actions (product, cart, checkout).
 */
export function PhoneDock({
  pathname,
  count,
  bump,
  onMenu,
  onSearch,
  onCart,
}: {
  pathname: string;
  count: number;
  bump: boolean;
  onMenu: () => void;
  onSearch: () => void;
  onCart: () => void;
}) {
  const [away, setAway] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - last) < 14) return;
        setAway(y > last && y > 480);
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (pathname.startsWith("/product/") || pathname === "/cart" || pathname === "/checkout") return null;

  const item = (active: boolean) => ({ "aria-current": active ? ("page" as const) : undefined, className: "dock-item" });

  return (
    <nav aria-label="التنقل السريع" className="dock lg:hidden" data-away={away}>
      <div className="dock-bar glass-dark on-dark">
        <Link href="/" {...item(pathname === "/")}>
          <Home className="size-[1.3rem]" />
          الرئيسية
          {pathname === "/" && <span className="dock-dot" aria-hidden />}
        </Link>
        <Link href="/shop" {...item(pathname === "/shop")}>
          <LayoutGrid className="size-[1.3rem]" />
          المتجر
          {pathname === "/shop" && <span className="dock-dot" aria-hidden />}
        </Link>
        <button type="button" onClick={onCart} className="dock-orb" data-bump={bump} aria-label={`فتح السلة، ${count} قطعة`}>
          <ShoppingBag className="size-6" />
          {count > 0 && (
            <span className="absolute -top-0.5 -end-0.5 grid min-w-5 place-items-center rounded-full bg-forest px-1 text-[0.68rem] leading-5 font-bold text-ivory ring-2 ring-ink">
              {count}
            </span>
          )}
        </button>
        <button type="button" onClick={onSearch} className="dock-item">
          <Search className="size-[1.3rem]" />
          بحث
        </button>
        <button type="button" onClick={onMenu} className="dock-item">
          <Menu className="size-[1.3rem]" />
          القائمة
        </button>
      </div>
    </nav>
  );
}
