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
  Gift,
  TicketPercent,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { LogoMark } from "@/components/ui/logo";
import { Sheet } from "@/components/ui/sheet";

const NAV = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "الطلبات", icon: Inbox },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "الأقسام", icon: Shapes },
  { href: "/admin/bundles", label: "المجموعات", icon: Gift },
  { href: "/admin/coupons", label: "أكواد الخصم", icon: TicketPercent },
  { href: "/admin/homepage", label: "الصفحة الرئيسية للمتجر", icon: Home },
  { href: "/admin/settings", label: "إعدادات المتجر", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
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
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
                active ? "bg-white/10 font-semibold text-ivory" : "text-ivory/70 hover:bg-white/5 hover:text-ivory"
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { data } = useStore();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    toast.success("تم تسجيل الخروج");
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <div className="on-dark flex h-full flex-col bg-ink p-4 text-ivory">
      <Link href="/admin" onClick={onNavigate} className="mb-8 flex items-center gap-3 px-2 pt-2">
        <LogoMark className="size-10" />
        <span>
          <span className="font-display block text-2xl leading-none">{data.settings.storeName}</span>
          <span className="text-xs text-gold">لوحة التحكم</span>
        </span>
      </Link>
      <nav aria-label="قائمة لوحة التحكم" className="flex-1 overflow-y-auto">
        <NavList onNavigate={onNavigate} />
      </nav>
      <div className="space-y-1 border-t border-white/10 pt-4">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-ivory/70 hover:bg-white/5 hover:text-ivory">
          <ExternalLink className="size-[1.1rem]" /> عرض المتجر
        </a>
        <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-ivory/70 hover:bg-white/5 hover:text-ivory">
          <LogOut className="size-[1.1rem]" /> تسجيل الخروج
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
              className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[0.7rem] ${active ? "text-gold" : "text-ivory/70"}`}
            >
              {primary ? (
                <span className="grid size-10 place-items-center rounded-full bg-gold text-ink shadow-lg">
                  <Icon className="size-5" />
                </span>
              ) : (
                <Icon className="size-5" />
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

export function AdminShell({ children, demoPasscode }: { children: React.ReactNode; demoPasscode: boolean }) {
  const [open, setOpen] = useState(false);
  const { isLocalOnly, storageLabel } = useStore();
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <div className="min-h-dvh bg-ivory lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <SidebarContent />
      </aside>

      <div className="min-w-0">
        <header className="on-dark sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-3 text-ivory lg:hidden">
          <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label="فتح القائمة">
            <Menu className="size-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark className="size-8" />
            <span className="font-display text-xl">لوحة التحكم</span>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="عرض المتجر">
            <ExternalLink className="size-5" />
          </a>
        </header>

        {(isLocalOnly || demoPasscode) && (
          <div className="border-b border-gold/30 bg-gold-soft/40 px-4 py-2.5 text-xs leading-relaxed text-[#5c4519] sm:px-8">
            <strong>{storageLabel}.</strong>{" "}
            {isLocalOnly && "التغييرات تُحفظ في هذا المتصفح فقط، ولا تظهر للزبائن أو على الأجهزة الأخرى حتى يتم ربط التخزين المشترك في Vercel. "}
            {demoPasscode && "لوحة التحكم تستخدم كلمة المرور التجريبية. اضبط ADMIN_PASSCODE في Vercel قبل مشاركة الموقع. "}
            <Link href="/admin/settings#data" className="font-semibold underline underline-offset-2">التفاصيل</Link>
          </div>
        )}

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-8 sm:py-10 lg:pb-10">
          {/* Admin screens read the current time and browser storage, so they render on request. */}
          <Suspense fallback={<div className="skeleton h-96 rounded-2xl" aria-busy="true" />}>{children}</Suspense>
        </main>
      </div>

      <BottomBar onMore={() => setOpen(true)} />

      <Sheet open={open} onClose={() => setOpen(false)} side="start" title="القائمة" className="!bg-ink !text-ivory [&>div:first-child]:border-white/10 [&_h2]:!text-ivory">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
