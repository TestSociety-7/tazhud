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
              className={`press relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors duration-300 ease-[var(--ease-soft)] ${
                active
                  ? "bg-white/[0.07] font-semibold text-ivory outline-1 outline-offset-[-4px] outline-dashed outline-gold/45"
                  : "text-ivory/65 hover:bg-white/5 hover:text-ivory"
              }`}
            >
              <Icon className={`size-[1.1rem] ${active ? "text-gold-bright" : ""}`} strokeWidth={active ? 2.2 : 1.8} />
              <span className="flex-1">{label}</span>
              {href === "/admin/orders" && newOrders > 0 && (
                <span className="adm-num rounded-[3px] bg-gold-bright px-1.5 text-[0.72rem] leading-5 text-ink">{newOrders}</span>
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
    <div className="on-dark adm-cloth-flat flex h-full flex-col p-4">
      <Link href="/admin" className="relative mb-3 flex items-center gap-3 px-2 pt-2 pb-3">
        <SeasonTrim />
        <LogoCoin hat float={false} className="size-11" />
        <span>
          <span className="font-display block text-2xl leading-none">{data.settings.storeName}</span>
          <span className="mt-1 block text-xs text-gold-bright">دفتر المشغل</span>
        </span>
      </Link>
      <span className="stitch mx-2 mb-5 opacity-60" aria-hidden />
      <nav aria-label="قائمة لوحة التحكم" className="flex-1 overflow-y-auto">
        <NavList />
      </nav>
      <div className="space-y-1 border-t border-dashed border-white/15 pt-4">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-ivory/70 hover:bg-white/5 hover:text-ivory">
          <ExternalLink className="size-[1.1rem]" /> عرض المتجر
        </a>
        <button type="button" onClick={() => logout(router)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-ivory/70 hover:bg-white/5 hover:text-ivory">
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
    <div className="on-dark adm-cloth-flat flex h-full flex-col gap-6 p-5">
      <ul className="stagger grid grid-cols-2 gap-3">
        {tiles.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`press flex aspect-[4/3] flex-col justify-between rounded-2xl border p-4 transition-colors duration-300 ${
                  active ? "border-gold/60 bg-gold/15 outline-1 outline-offset-[-6px] outline-dashed outline-gold/50" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                }`}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-paper/[0.08] text-gold-bright ring-1 ring-gold/35">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <InstallAppButton className="press btn w-full border border-dashed border-gold/50 bg-gold/10 text-gold-soft" />
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-dashed border-white/15 pt-5">
        <a href="/" target="_blank" rel="noopener noreferrer" className="press btn btn-outline border-white/20 text-ivory">
          <ExternalLink className="size-4" /> عرض المتجر
        </a>
        <button type="button" onClick={() => logout(router)} className="press btn btn-outline border-white/20 text-ivory/80">
          <LogOut className="size-4" /> خروج
        </button>
      </div>
    </div>
  );
}

/** Thumb-friendly tab bar for phones: the screens used most, plus a quick "add product". */
function BottomBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const { data } = useStore();
  const newOrders = data.orders.filter((o) => o.status === "new").length;
  const tabs = [
    { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, active: pathname === "/admin" },
    { href: "/admin/orders", label: "الطلبات", icon: Inbox, active: pathname.startsWith("/admin/orders"), badge: newOrders },
    { href: "/admin/products/new", label: "إضافة", icon: Plus, active: pathname === "/admin/products/new", primary: true },
    { href: "/admin/products", label: "المنتجات", icon: Package, active: pathname.startsWith("/admin/products") && pathname !== "/admin/products/new" },
  ];
  return (
    <nav aria-label="التنقل السريع" className="adm-tabbar fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] text-ink lg:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, active, badge, primary }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`press relative flex min-h-16 flex-col items-center justify-center gap-1 pb-1 text-[0.7rem] transition-colors duration-300 ${active ? "font-semibold text-forest" : "text-muted"}`}
            >
              {primary ? (
                <span className="adm-add">
                  <Icon className="size-6" strokeWidth={2.4} />
                </span>
              ) : (
                <>
                  <span className={`adm-tab-mark ${active ? "w-5 opacity-100" : "w-0 opacity-0"}`} aria-hidden />
                  <Icon className="size-5" strokeWidth={active ? 2.3 : 1.8} />
                </>
              )}
              <span className={primary ? "sr-only" : ""}>{label}</span>
              {badge ? (
                <span className="adm-num absolute top-2 start-[calc(50%+0.35rem)] min-w-[1.1rem] rounded-[3px] bg-gold-bright px-1 text-center text-[0.68rem] leading-[1.1rem] text-ink shadow-[0_0_0_2px_var(--color-paper)]">{badge}</span>
              ) : null}
            </Link>
          </li>
        ))}
        <li>
          <button type="button" onClick={onMore} className="press flex min-h-16 w-full flex-col items-center justify-center gap-1 pb-1 text-[0.7rem] text-muted">
            <Menu className="size-5" strokeWidth={1.8} />
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
    <div data-season={season} className="admin-season min-h-dvh lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar />
      </aside>

      <div className="min-w-0">
        <header className="on-dark adm-cloth-flat sticky top-0 z-30 flex h-14 items-center justify-center px-3 lg:hidden">
          <Link href="/admin" className="flex min-h-11 items-center gap-2.5">
            <LogoCoin hat float={false} className="size-8" />
            <span className="font-display text-xl">{data.settings.storeName}</span>
            <span className="rounded-[3px] bg-gold-bright/90 px-1.5 text-[0.68rem] leading-5 font-semibold text-ink">الإدارة</span>
          </Link>
          <span className="stitch absolute inset-x-4 bottom-1.5 opacity-50" aria-hidden />
          <SeasonTrim />
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-8 sm:py-10 lg:pb-10">
          {/* Admin screens read the current time and browser storage, so they render on request. */}
          <Suspense fallback={<div className="skeleton h-96 rounded-2xl" aria-busy="true" />}>
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

      <Sheet open={open} onClose={() => setOpen(false)} side="start" title="المزيد" className="!bg-ink !text-ivory [&>div:first-child]:border-dashed [&>div:first-child]:border-white/15 [&_h2]:!text-ivory">
        <MoreSheet onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
