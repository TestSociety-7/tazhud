"use client";

import Link from "next/link";
import { AdminWelcome } from "./welcome";
import { OrderWatcher } from "./order-alerts";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ExternalLink,
  Gift,
  Home,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  Plus,
  Settings,
  Shapes,
  TicketPercent,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { Sheet } from "@/components/ui/sheet";
import { LogoCoin } from "@/components/ui/fx";
import { InstallAppButton } from "@/components/ui/install-app";
import { SeasonSky, SeasonTrim, useSeason } from "@/components/store/season";

const NAV = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "الطلبات", icon: Inbox },
  { href: "/admin/returns", label: "الإرجاع والاستبدال", icon: Undo2 },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "الأقسام", icon: Shapes },
  { href: "/admin/bundles", label: "المجموعات", icon: Gift },
  { href: "/admin/coupons", label: "أكواد الخصم", icon: TicketPercent },
  { href: "/admin/homepage", label: "واجهة المتجر", icon: Home },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

/** Screens that live in the phone bottom bar (so the "more" sheet leaves them out). */
const BOTTOM_HREFS = new Set(["/admin", "/admin/orders", "/admin/products"]);

function NavList() {
  const pathname = usePathname();
  const { data } = useStore();
  const newOrders = data.orders.filter((o) => o.status === "new").length;
  return (
    <ul className="space-y-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`side-link press flex min-h-12 items-center gap-3 rounded-2xl px-2 text-sm transition-colors duration-300 ${
                active ? "font-semibold text-ivory" : "text-ivory/65 hover:text-ivory"
              }`}
            >
              <span className="side-bar" aria-hidden />
              <span className="side-icon">
                <Icon className="size-[1.1rem]" />
              </span>
              <span className="flex-1">{label}</span>
              {href === "/admin/orders" && newOrders > 0 && (
                <span className="btn-pearl rounded-full px-2 py-0.5 text-[0.68rem] font-bold">{newOrders}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

async function logout(router: ReturnType<typeof useRouter>) {
  await fetch("/api/admin/logout", { method: "POST" });
  toast.success("تم تسجيل الخروج");
  router.replace("/admin/login");
  router.refresh();
}

/** Desktop sidebar: every screen in one list. */
function Sidebar() {
  const router = useRouter();
  const { data } = useStore();
  return (
    <div className="on-dark admin-side flex h-full flex-col p-4 text-ivory">
      <Link href="/admin" className="relative mb-7 flex items-center gap-3 rounded-2xl px-2 pt-2 pb-3">
        <SeasonTrim />
        <LogoCoin hat float={false} className="size-12" />
        <span className="min-w-0">
          <span className="font-display block text-2xl leading-none">{data.settings.storeName}</span>
          <span className="pearl-text mt-1 inline-block text-xs font-semibold">لوحة التحكم</span>
        </span>
      </Link>
      <nav aria-label="قائمة لوحة التحكم" className="-mx-1 flex-1 overflow-y-auto px-1">
        <NavList />
      </nav>
      <div className="space-y-1 border-t border-white/10 pt-4">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm text-ivory/65 transition-colors hover:bg-white/5 hover:text-ivory">
          <ExternalLink className="size-[1.1rem]" /> عرض المتجر
        </a>
        <button type="button" onClick={() => logout(router)} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm text-ivory/65 transition-colors hover:bg-white/5 hover:text-ivory">
          <LogOut className="size-[1.1rem]" /> تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

/** Phone "more" sheet: only the screens that are not already in the bottom bar. */
function MoreSheet({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const tiles = NAV.filter((n) => !BOTTOM_HREFS.has(n.href));
  return (
    <div className="on-dark flex flex-col gap-5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-ivory">
      <ul className="more-tiles grid grid-cols-3 gap-3">
        {tiles.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`press flex aspect-square flex-col items-center justify-center gap-2.5 rounded-[1.4rem] p-2 text-center transition-colors ${
                  active ? "bg-white/[0.14] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)]" : "bg-white/[0.05] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] hover:bg-white/[0.09]"
                }`}
              >
                <span className="pearl-icon size-12">
                  <Icon className="size-5" />
                </span>
                <span className="text-[0.78rem] leading-tight font-semibold">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <InstallAppButton className="press btn btn-glass w-full" />
      <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
        <a href="/" target="_blank" rel="noopener noreferrer" className="press btn btn-glass">
          <ExternalLink className="size-4" /> عرض المتجر
        </a>
        <button type="button" onClick={() => logout(router)} className="press btn btn-glass text-ivory/80">
          <LogOut className="size-4" /> خروج
        </button>
      </div>
    </div>
  );
}

/** Floating glass tab bar for phones: the screens used most, a quick "add product", and the rest. */
function BottomBar({ onMore, moreOpen }: { onMore: () => void; moreOpen: boolean }) {
  const pathname = usePathname();
  const { data } = useStore();
  const newOrders = data.orders.filter((o) => o.status === "new").length;
  const tabs = [
    { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, active: pathname === "/admin" },
    { href: "/admin/orders", label: "الطلبات", icon: Inbox, active: pathname.startsWith("/admin/orders"), badge: newOrders },
    { href: "/admin/products/new", label: "إضافة منتج", icon: Plus, active: pathname === "/admin/products/new", primary: true },
    { href: "/admin/products", label: "المنتجات", icon: Package, active: pathname.startsWith("/admin/products") && pathname !== "/admin/products/new" },
  ];
  const tabIndex = tabs.findIndex((t) => t.active);
  const index = moreOpen ? 4 : tabIndex >= 0 ? tabIndex : 4;
  return (
    <nav aria-label="التنقل السريع" className="atab lg:hidden">
      <ul className="atab-bar">
        <li className="atab-pill" data-hide={index === 2} style={{ "--i": index } as React.CSSProperties} aria-hidden />
        {tabs.map(({ href, label, icon: Icon, active, badge, primary }) => (
          <li key={href} className="grid">
            <Link href={href} aria-current={active ? "page" : undefined} className="atab-item">
              {primary ? (
                <span className="atab-orb">
                  <Icon className="size-6" strokeWidth={2.4} />
                </span>
              ) : (
                <Icon className="size-[1.35rem]" strokeWidth={active ? 2.3 : 1.9} />
              )}
              <span className={primary ? "sr-only" : ""}>{label}</span>
              {badge ? <span className="atab-badge" key={badge}>{badge}</span> : null}
            </Link>
          </li>
        ))}
        <li className="grid">
          <button type="button" onClick={onMore} aria-expanded={moreOpen} aria-current={!moreOpen && tabIndex < 0 ? "page" : undefined} className="atab-item">
            <LayoutGrid className="size-[1.35rem]" strokeWidth={1.9} />
            المزيد
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data } = useStore();
  const season = useSeason();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <div data-season={season} className="admin-season admin-app min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <div className="admin-backdrop" aria-hidden />
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar />
      </aside>

      <div className="min-w-0">
        <header className="on-dark admin-topbar flex items-center justify-between px-4 text-ivory lg:hidden">
          <Link href="/admin" className="press flex items-center gap-2.5">
            <LogoCoin hat float={false} className="size-9" />
            <span className="font-display text-xl leading-none">{data.settings.storeName}</span>
          </Link>
          <span className="flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 text-[0.7rem] font-semibold text-ivory/80 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]">
            <span className="live-pulse" aria-hidden />
            لوحة التحكم
          </span>
          <SeasonTrim />
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-5 pb-32 sm:px-8 sm:pt-10 lg:pb-12">
          {/* Admin screens read the current time and browser storage, so they render on request. */}
          <Suspense fallback={<div className="skeleton h-96 rounded-[1.75rem]" aria-busy="true" />}>
            <div key={pathname} className="admin-enter">
              {children}
            </div>
          </Suspense>
        </main>
      </div>

      <BottomBar onMore={() => setOpen(true)} moreOpen={open} />
      <SeasonSky season={season} />
      <AdminWelcome />
      <OrderWatcher />

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title="المزيد"
        className="more-sheet !bg-ink !text-ivory [&>div:first-child]:border-white/10 [&_h2]:!text-ivory [&_.icon-btn:hover]:bg-white/10"
      >
        <MoreSheet onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
