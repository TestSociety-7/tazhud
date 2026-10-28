"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ExternalLink,
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
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { Sheet } from "@/components/ui/sheet";
import { LogoCoin } from "@/components/ui/fx";
import { InstallAppButton } from "@/components/ui/install-app";

const NAV = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "الطلبات", icon: Inbox },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "الأقسام", icon: Shapes },
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
              className={`press relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-all duration-300 ${
                active
                  ? "bg-gradient-to-l from-gold/25 to-white/5 font-semibold text-ivory shadow-[inset_0_0_0_1px_rgb(201_162_74/0.35)]"
                  : "text-ivory/70 hover:-translate-x-0.5 hover:bg-white/5 hover:text-ivory"
              }`}
            >
              <Icon className={`size-[1.1rem] ${active ? "text-gold" : ""}`} />
              <span className="flex-1">{label}</span>
              {href === "/admin/orders" && newOrders > 0 && (
                <span className="rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-bold text-ink">{newOrders}</span>
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
    <div className="on-dark flex h-full flex-col bg-ink p-4 text-ivory">
      <Link href="/admin" className="mb-8 flex items-center gap-3 px-2 pt-2">
        <LogoCoin float={false} className="size-11" />
        <span>
          <span className="font-display block text-2xl leading-none">{data.settings.storeName}</span>
          <span className="text-xs text-gold">لوحة التحكم</span>
        </span>
      </Link>
      <nav aria-label="قائمة لوحة التحكم" className="flex-1 overflow-y-auto">
        <NavList />
      </nav>
      <div className="space-y-1 border-t border-white/10 pt-4">
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
    <div className="on-dark flex h-full flex-col gap-6 bg-ink p-5 text-ivory">
      <ul className="stagger grid grid-cols-2 gap-3">
        {tiles.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`press flex aspect-[4/3] flex-col justify-between rounded-2xl border p-4 transition-colors ${
                  active ? "border-gold/60 bg-gold/15" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                }`}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-gold-bright to-gold-deep text-ink shadow-[0_8px_18px_-8px_rgb(201_162_74/0.7)]">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <InstallAppButton className="press btn sheen w-full border border-gold/50 bg-gold/10 text-gold-soft" />
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
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
    <nav aria-label="التنقل السريع" className="on-dark fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] text-ivory backdrop-blur-md lg:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, active, badge, primary }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`press relative flex min-h-16 flex-col items-center justify-center gap-1 text-[0.7rem] transition-colors ${active ? "text-gold" : "text-ivory/70"}`}
            >
              {primary ? (
                <span className="sheen -mt-6 grid size-14 place-items-center rounded-full bg-gradient-to-br from-gold-bright via-gold to-gold-deep text-ink shadow-[0_10px_24px_-8px_rgb(201_162_74/0.8),inset_0_-3px_0_rgb(0_0_0/0.15)] ring-4 ring-ink">
                  <Icon className="size-6" strokeWidth={2.5} />
                </span>
              ) : (
                <>
                  <span className={`absolute top-1.5 h-1 rounded-full bg-gold transition-all duration-300 ${active ? "w-6 opacity-100" : "w-0 opacity-0"}`} />
                  <Icon className={`size-5 transition-transform duration-300 ${active ? "-translate-y-0.5 scale-110" : ""}`} />
                </>
              )}
              <span className={primary ? "sr-only" : ""}>{label}</span>
              {badge ? (
                <span className="absolute top-2 start-[calc(50%+0.4rem)] min-w-4 rounded-full bg-gold px-1 text-center text-[0.6rem] leading-4 font-bold text-ink">{badge}</span>
              ) : null}
            </Link>
          </li>
        ))}
        <li>
          <button type="button" onClick={onMore} className="flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[0.7rem] text-ivory/70">
            <Menu className="size-5" />
            المزيد
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <div className="min-h-dvh bg-ivory lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar />
      </aside>

      <div className="min-w-0">
        <header className="on-dark sticky top-0 z-30 flex h-14 items-center justify-center bg-ink/95 px-3 text-ivory backdrop-blur-md lg:hidden">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoCoin float={false} className="size-8" />
            <span className="font-display text-xl">{data.settings.storeName}</span>
            <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[0.65rem] text-gold">الإدارة</span>
          </Link>
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

      <Sheet open={open} onClose={() => setOpen(false)} side="start" title="المزيد" className="!bg-ink !text-ivory [&>div:first-child]:border-white/10 [&_h2]:!text-ivory">
        <MoreSheet onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
