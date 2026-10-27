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
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Order inquiries", icon: Inbox },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Shapes },
  { href: "/admin/bundles", label: "Bundles", icon: Gift },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/settings", label: "Store settings", icon: Settings },
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
    toast.success("Signed out");
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <div className="on-dark flex h-full flex-col bg-ink p-4 text-ivory">
      <Link href="/admin" onClick={onNavigate} className="mb-8 flex items-center gap-3 px-2 pt-2">
        <LogoMark className="size-10" />
        <span>
          <span className="font-display block text-2xl leading-none">{data.settings.storeName}</span>
          <span className="text-[0.65rem] tracking-[0.2em] text-gold uppercase">Studio admin</span>
        </span>
      </Link>
      <nav aria-label="Admin" className="flex-1">
        <NavList onNavigate={onNavigate} />
      </nav>
      <div className="space-y-1 border-t border-white/10 pt-4">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-ivory/70 hover:bg-white/5 hover:text-ivory">
          <ExternalLink className="size-[1.1rem]" /> View store
        </a>
        <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-ivory/70 hover:bg-white/5 hover:text-ivory">
          <LogOut className="size-[1.1rem]" /> Sign out
        </button>
      </div>
    </div>
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
          <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label="Open admin menu">
            <Menu className="size-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark className="size-8" />
            <span className="font-display text-xl">Admin</span>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="View store">
            <ExternalLink className="size-5" />
          </a>
        </header>

        {(isLocalOnly || demoPasscode) && (
          <div className="border-b border-gold/30 bg-gold-soft/40 px-4 py-2.5 text-xs leading-relaxed text-[#5c4519] sm:px-8">
            <strong>{storageLabel}.</strong>{" "}
            {isLocalOnly && "Changes are saved in this browser only. They show on the storefront in this browser, but not on other devices or for customers. "}
            {demoPasscode && "The admin is using the demo passcode. Set ADMIN_PASSCODE before sharing this site. "}
            <Link href="/admin/settings#data" className="font-semibold underline underline-offset-2">Learn more</Link>
          </div>
        )}

        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
          {/* Admin screens read the current time and browser storage, so they render on request. */}
          <Suspense fallback={<div className="skeleton h-96 rounded-2xl" aria-busy="true" />}>{children}</Suspense>
        </main>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} side="left" title="Admin menu" className="!bg-ink !text-ivory [&>div:first-child]:border-white/10 [&_h2]:!text-ivory">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
