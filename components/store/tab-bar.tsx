"use client";

import Link from "next/link";
import { Home, LayoutGrid, Menu, Search, ShoppingBag } from "lucide-react";

/**
 * Phone tab bar, like a social app: home, shop, the cart as a big neon button in the
 * middle, search and menu. Hidden on pages with their own bottom actions.
 */
export function TabBar({
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
  if (pathname.startsWith("/product/") || pathname === "/cart" || pathname === "/checkout") return null;
  const tab = (active: boolean) => ({ "aria-current": active ? ("page" as const) : undefined, className: "tab-item" });

  return (
    <nav aria-label="التنقل السريع" className="tab-bar lg:hidden">
      <Link href="/" {...tab(pathname === "/")}>
        <Home className="size-6" />
        الرئيسية
      </Link>
      <Link href="/shop" {...tab(pathname === "/shop")}>
        <LayoutGrid className="size-6" />
        المتجر
      </Link>
      <button type="button" onClick={onCart} className="tab-cart" data-bump={bump} aria-label={`فتح السلة، ${count} قطعة`}>
        <span className="tab-cart-face">
          <ShoppingBag className="size-5" />
        </span>
        {count > 0 && <span className="tab-cart-count">{count}</span>}
      </button>
      <button type="button" onClick={onSearch} className="tab-item">
        <Search className="size-6" />
        بحث
      </button>
      <button type="button" onClick={onMenu} className="tab-item">
        <Menu className="size-6" />
        القائمة
      </button>
    </nav>
  );
}
