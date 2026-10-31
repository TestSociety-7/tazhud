"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, ExternalLink, Inbox, Package, Plus, TicketPercent, TrendingUp } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney, stockState } from "@/lib/commerce";
import { PLACEHOLDER_WHATSAPP } from "@/lib/seed";
import { isValidWhatsappNumber } from "@/lib/whatsapp";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge, Panel, shine } from "../ui";
import { CountUp, Tilt } from "@/components/ui/fx";
import { STATUS_META } from "./orders";
import { dateFormat, itemsLabel } from "@/lib/arabic";
import { SeasonPicker } from "../season-picker";
import { greeting, WelcomeMark } from "../welcome";

const DAY = 24 * 60 * 60 * 1000;
// Captured once per page load; only used after hydration (see `ready`).
const CLIENT_NOW = typeof window === "undefined" ? 0 : Date.now();
const timeFormat = (t: number) => new Date(t).toLocaleTimeString("ar-u-nu-latn", { hour: "numeric", minute: "2-digit" });

function Stat({
  label,
  value,
  format,
  icon,
  href,
  dark = false,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: React.ReactNode;
  href: string;
  dark?: boolean;
}) {
  return (
    <Tilt className="rounded-[1.6rem]" max={9}>
      <Link href={href} {...shine} className={`stat3d shine-follow press ${dark ? "on-dark" : "text-ink"}`} data-dark={dark}>
        <span className="pop flex items-start justify-between gap-2">
          <span className="stat-orb">{icon}</span>
          <ArrowLeft className={`stat-arrow mt-1 size-4 ${dark ? "text-ivory/50" : "text-muted/60"}`} aria-hidden />
        </span>
        <p className={`pop font-display mt-5 text-[2rem] leading-none tabular-nums break-words sm:text-[2.6rem] ${dark ? "pearl-text" : ""}`}>
          <CountUp value={value} format={format} />
        </p>
        <p className={`mt-2 text-[0.8rem] font-medium ${dark ? "text-ivory/70" : "text-muted"}`}>{label}</p>
      </Link>
    </Tilt>
  );
}

/** Ticks every half minute so the clock in the hero stays current. */
function useClock() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function Dashboard() {
  const { data, ready } = useStore();
  const money = (n: number) => formatMoney(n, data.settings);
  const products = data.products;
  const published = products.filter((p) => p.published);
  const low = products.filter((p) => stockState(p.stock, data.settings.lowStockThreshold) !== "in").sort((a, b) => a.stock - b.stock);
  const orders = data.orders;
  const newOrders = orders.filter((o) => o.status === "new");
  const now = ready ? CLIENT_NOW : 0;
  const last30 = orders.filter((o) => o.status !== "cancelled" && new Date(o.createdAt).getTime() > now - 30 * DAY);
  const clock = useClock();
  const needsWhatsapp = data.settings.whatsappNumber === PLACEHOLDER_WHATSAPP || !isValidWhatsappNumber(data.settings.whatsappNumber);

  return (
    <>
      <section className="on-dark admin-hero mb-5 p-5 sm:p-8">
        <div className="relative flex items-center gap-3 sm:gap-6">
          <WelcomeMark size="size-16 sm:size-20" pad="p-5 sm:p-6" orbit="3.6rem" enter={false} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] font-semibold text-gold-bright">
              <span>{greeting(ready ? new Date(clock || CLIENT_NOW).getHours() : -1)}</span>
              {ready && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2 py-0.5 text-[0.68rem] text-ivory/75 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]">
                  <span className="live-pulse" aria-hidden />
                  <span className="tabular-nums">{timeFormat(clock || CLIENT_NOW)}</span>
                </span>
              )}
            </p>
            <h1 className="font-display mt-1 text-[1.9rem] leading-tight text-balance sm:text-[2.6rem]">
              أهلًا بك في <span className="pearl-text">{data.settings.storeName}</span>
            </h1>
            <p className="mt-1 text-sm text-ivory/70">
              {newOrders.length > 0 ? `عندك ${newOrders.length} ${newOrders.length === 1 ? "طلب جديد" : "طلبات جديدة"} بانتظارك.` : "لا توجد طلبات جديدة الآن."}
            </p>
          </div>
        </div>
      </section>

      <nav aria-label="اختصارات" className="no-scrollbar -mx-4 mb-5 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <Link href="/admin/products/new" className="quick-tile shrink-0">
          <span className="pearl-icon size-10 rounded-[0.9rem]"><Plus className="size-5" /></span> منتج جديد
        </Link>
        <Link href="/admin/orders" className="quick-tile shrink-0">
          <span className="pearl-icon size-10 rounded-[0.9rem]"><Inbox className="size-5" /></span> الطلبات
        </Link>
        <Link href="/admin/coupons" className="quick-tile shrink-0">
          <span className="pearl-icon size-10 rounded-[0.9rem]"><TicketPercent className="size-5" /></span> كود خصم
        </Link>
        <a href="/" target="_blank" rel="noopener noreferrer" className="quick-tile shrink-0">
          <span className="pearl-icon size-10 rounded-[0.9rem]"><ExternalLink className="size-5" /></span> عرض المتجر
        </a>
      </nav>

      {needsWhatsapp && (
        <Link href="/admin/settings" className="press mb-5 flex min-h-14 items-center gap-3 rounded-[1.4rem] bg-gold-soft/70 p-4 text-sm font-medium text-gold-deep shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-gold),transparent_60%)]">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/70"><AlertTriangle className="size-5" /></span>
          <span className="flex-1">أضف رقم واتساب الحقيقي حتى تصلك طلبات الزبائن.</span>
          <ArrowLeft className="size-4 shrink-0" />
        </Link>
      )}

      <div className="stagger grid grid-cols-2 gap-3 [perspective:900px] sm:gap-4 lg:grid-cols-4">
        <Stat dark label="طلبات جديدة" value={newOrders.length} icon={<Inbox className="size-5" />} href="/admin/orders" />
        <Stat label="مبيعات آخر 30 يومًا" value={last30.reduce((s, o) => s + o.total, 0)} format={money} icon={<TrendingUp className="size-5" />} href="/admin/orders" />
        <Stat label="منتجات منشورة" value={published.length} icon={<Package className="size-5" />} href="/admin/products" />
        <Stat label="مخزون منخفض" value={low.length} icon={<AlertTriangle className="size-5" />} href="/admin/products?stock=low" />
      </div>

      <div className="mt-5">
        <SeasonPicker />
      </div>

      <div className="stagger mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="أحدث الطلبات" actions={<Link href="/admin/orders" className="press rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-forest">عرض الكل</Link>}>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">لا توجد طلبات بعد. ستظهر هنا عندما يرسل الزبائن طلباتهم.</p>
          ) : (
            <ul className="-mx-2 space-y-1">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`} className="press flex min-h-16 items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-sand/60">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sage-soft font-display text-lg text-forest" aria-hidden>{o.customer.name.trim().charAt(0)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{o.customer.name}</p>
                      <p className="text-xs text-muted">{dateFormat(o.createdAt, { month: "short", day: "numeric" })} · {itemsLabel(o.lines.length)}</p>
                    </div>
                    <Badge tone={STATUS_META[o.status].tone}>{STATUS_META[o.status].label}</Badge>
                    <span className="w-20 text-end text-sm font-semibold text-ink tabular-nums">{money(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="مخزون يحتاج متابعة" actions={<Link href="/admin/products?stock=low" className="press rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-forest">إدارة</Link>}>
          {low.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">كل المنتجات متوفرة بكميات جيدة.</p>
          ) : (
            <ul className="-mx-2 space-y-1">
              {low.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="press flex min-h-16 items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-sand/60">
                    <SmartImage src={p.images[0]} alt="" className="leaf size-12 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.name}</span>
                    <Badge tone={p.stock <= 0 ? "red" : "gold"}>{p.stock <= 0 ? "نفدت" : `بقي ${p.stock}`}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
