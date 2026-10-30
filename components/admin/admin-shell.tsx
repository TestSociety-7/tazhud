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
  LogOut,
  Menu,
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
              className={`studio-tile relative flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm transition-colors ${
                active ? "bg-sand font-bold text-ink" : "text-muted hover:bg-sand/60 hover:text-ink"
              }`}
            >
              <span
                className={`grid size-9 place-items-center rounded-xl transition-colors ${
                  active ? "bg-gradient-to-br from-gold to-gold-deep text-white shadow-[0_8px_20px_-8px_var(--color-gold)]" : "bg-paper"
                }`}
              >
                <Icon className="size-[1.1rem]" />
              </span>
              <span className="flex-1">{label}</span>
              {href === "/admin/orders" && newOrders > 0 && (
                <span className="min-w-6 rounded-full bg-gold-deep px-1.5 text-center text-[0.7rem] leading-6 font-extrabold text-white tabular-nums">{newOrders}</span>
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
    <div className="flex h-full flex-col border-e border-line bg-paper/70 p-4 backdrop-blur-xl">
      <Link href="/admin" className="relative mb-7 flex items-center gap-3 px-1 pt-2 pb-2">
        <SeasonTrim />
        <span className="story-ring is-live !size-14 shrink-0 [--story-gap:var(--color-paper)]">
          <span className="story-face overflow-hidden">
            <LogoCoin hat float={false} className="size-full" />
          </span>
        </span>
        <span className="min-w-0">
          <span className="studio-title block truncate text-2xl leading-none">{data.settings.storeName}</span>
          <span className="neon-text text-xs font-bold">لوحة التحكم</span>
        </span>
      </Link>
      <nav aria-label="قائمة لوحة التحكم" className="-mx-1 flex-1 overflow-y-auto px-1">
        <NavList />
      </nav>
      <div className="space-y-1 border-t border-line pt-4">
        <a href="/" target="_blank" rel="noopener noreferrer" className="studio-tile flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm text-muted hover:bg-sand/60 hover:text-ink">
          <ExternalLink className="size-[1.1rem]" /> عرض المتجر
        </a>
        <button type="button" onClick={() => logout(router)} className="studio-tile flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm text-muted hover:bg-sand/60 hover:text-ink">
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
    <div className="flex h-full flex-col gap-5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <ul className="studio-list grid grid-cols-2 gap-3">
        {tiles.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`studio-tile flex aspect-[5/4] flex-col justify-between rounded-[1.4rem] border p-4 ${
                  active ? "border-gold/60 bg-gold/10" : "border-line bg-paper"
                }`}
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-gold to-gold-deep text-white shadow-[0_10px_22px_-10px_var(--color-gold)]">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-bold text-ink">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <InstallAppButton className="press btn w-full border border-gold/40 bg-gold/10 font-bold text-gold-bright" />
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-5">
        <a href="/" target="_blank" rel="noopener noreferrer" className="press btn btn-outline border-line text-ink">
          <ExternalLink className="size-4" /> عرض المتجر
        </a>
        <button type="button" onClick={() => logout(router)} className="press btn btn-outline border-line text-muted">
          <LogOut className="size-4" /> خروج
        </button>
      </div>
    </div>
  );
}

/** TikTok-style tab bar for phones: the screens used most, plus a big "add product" in the middle. */
function BottomBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const { data } = useStore();
  const newOrders = data.orders.filter((o) => o.status === "new").length;
  const tabs = [
    { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, active: pathname === "/admin" },
    { href: "/admin/orders", label: "الطلبات", icon: Inbox, active: pathname.startsWith("/admin/orders"), badge: newOrders },
    { href: "/admin/products/new", label: "إضافة منتج", icon: Plus, active: pathname === "/admin/products/new", primary: true },
    { href: "/admin/products", label: "المنتجات", icon: Package, active: pathname.startsWith("/admin/products") && pathname !== "/admin/products/new" },
  ];
  return (
    <nav aria-label="التنقل السريع" className="studio-tabbar fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid h-[var(--studio-tab-h)] grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, active, badge, primary }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`studio-tab relative flex h-full flex-col items-center justify-center gap-1 text-[0.68rem] font-semibold ${active ? "text-ink" : "text-muted"}`}
            >
              {primary ? (
                <span className="tt-plus">
                  <span>
                    <Icon className="size-6" strokeWidth={3} />
                  </span>
                </span>
              ) : (
                <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
              )}
              <span className={primary ? "sr-only" : ""}>{label}</span>
              {badge ? (
                <span className="absolute top-2 start-[calc(50%+0.35rem)] min-w-[1.15rem] rounded-full bg-gold-deep px-1 text-center text-[0.62rem] leading-[1.15rem] font-extrabold text-white shadow-[0_0_0_2px_var(--color-ivory)]">{badge}</span>
              ) : null}
            </Link>
          </li>
        ))}
        <li>
          <button type="button" onClick={onMore} className="studio-tab flex h-full w-full flex-col items-center justify-center gap-1 text-[0.68rem] font-semibold text-muted">
            <Menu className="size-6" />
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
    <div data-season={season} className="admin-season min-h-dvh text-text lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar />
      </aside>

      <div className="min-w-0">
        <header className="studio-tabbar sticky top-0 z-30 flex h-14 items-center justify-between px-4 pt-[env(safe-area-inset-top)] lg:hidden">
          <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
            <LogoCoin hat float={false} className="size-8" />
            <span className="studio-title truncate text-xl">{data.settings.storeName}</span>
          </Link>
          <span className="chip shrink-0 !bg-gold/15 !text-gold-bright">لوحة التحكم</span>
          <SeasonTrim />
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-5 pb-[calc(var(--studio-tab-h)+env(safe-area-inset-bottom)+2rem)] sm:px-8 sm:pt-10 lg:pb-12">
          {/* Admin screens read the current time and browser storage, so they render on request. */}
          <Suspense fallback={<div className="skeleton h-96 rounded-[1.4rem]" aria-busy="true" />}>
            <div key={pathname} className="admin-enter">
              {children}
            </div>
          </Suspense>
        </main>
      </div>

      <BottomBar onMore={() => setOpen(true)} />
      <SeasonSky season={season} />
      <AdminWelcome />
      <OrderWatcher />

      <Sheet open={open} onClose={() => setOpen(false)} side="bottom" title="المزيد" className="rounded-t-[1.75rem] border-t border-line backdrop:!bg-black/60 [&>div:first-child]:border-line [&_h2]:font-extrabold">
        <MoreSheet onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
