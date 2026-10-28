"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Inbox, Package, TrendingUp } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney, stockState } from "@/lib/commerce";
import { PLACEHOLDER_WHATSAPP } from "@/lib/seed";
import { isValidWhatsappNumber } from "@/lib/whatsapp";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge, Panel } from "../ui";
import { CountUp, LogoCoin, Tilt } from "@/components/ui/fx";
import { STATUS_META } from "./orders";
import { dateFormat, itemsLabel } from "@/lib/arabic";

const DAY = 24 * 60 * 60 * 1000;
// Captured once per page load; only used after hydration (see `ready`).
const CLIENT_NOW = typeof window === "undefined" ? 0 : Date.now();

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
    <Tilt className="rounded-2xl">
      <Link
        href={href}
        className={`press block min-w-0 rounded-2xl border p-4 [transform-style:preserve-3d] sm:p-5 ${dark ? "on-dark sheen border-ink bg-ink text-ivory" : "border-line bg-paper text-ink"}`}
      >
        <span className={`tilt-pop grid size-10 place-items-center rounded-xl ${dark ? "bg-gold text-ink" : "bg-sand text-forest"}`}>{icon}</span>
        <p className="tilt-pop font-display mt-4 text-3xl leading-none tabular-nums break-words sm:text-4xl">
          <CountUp value={value} format={format} />
        </p>
        <p className={`mt-2 text-xs font-medium ${dark ? "text-gold-soft" : "text-muted"}`}>{label}</p>
      </Link>
    </Tilt>
  );
}

function greeting(hour: number) {
  if (hour < 0) return "مرحبًا";
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "نهارك سعيد";
  return "مساء الخير";
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
  const needsWhatsapp = data.settings.whatsappNumber === PLACEHOLDER_WHATSAPP || !isValidWhatsappNumber(data.settings.whatsappNumber);

  return (
    <>
      <section className="on-dark relative mb-6 overflow-hidden rounded-3xl bg-ink p-5 text-ivory sm:p-8">
        <div className="pattern-geo absolute inset-0 opacity-[0.06]" aria-hidden />
        <div className="pointer-events-none absolute -top-20 -end-16 size-56 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4 sm:gap-6">
          <LogoCoin className="size-16 sm:size-20" />
          <div className="min-w-0">
            <p className="text-sm text-gold">{greeting(ready ? new Date(CLIENT_NOW).getHours() : -1)}</p>
            <h1 className="font-display mt-0.5 text-3xl leading-tight sm:text-4xl">أهلًا بك في {data.settings.storeName}</h1>
            <p className="mt-1 text-sm text-ivory/70">
              {newOrders.length > 0 ? `عندك ${newOrders.length} ${newOrders.length === 1 ? "طلب جديد" : "طلبات جديدة"} بانتظارك.` : "لا توجد طلبات جديدة الآن."}
            </p>
          </div>
        </div>
      </section>

      {needsWhatsapp && (
        <Link href="/admin/settings" className="press mb-6 flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold-soft/40 p-4 text-sm text-[#5c4519]">
          <AlertTriangle className="size-5 shrink-0" />
          <span className="flex-1">أضف رقم واتساب الحقيقي حتى تصلك طلبات الزبائن.</span>
          <ArrowLeft className="size-4 shrink-0" />
        </Link>
      )}

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat dark label="طلبات جديدة" value={newOrders.length} icon={<Inbox className="size-5" />} href="/admin/orders" />
        <Stat label="مبيعات آخر 30 يومًا" value={last30.reduce((s, o) => s + o.total, 0)} format={money} icon={<TrendingUp className="size-5" />} href="/admin/orders" />
        <Stat label="منتجات منشورة" value={published.length} icon={<Package className="size-5" />} href="/admin/products" />
        <Stat label="مخزون منخفض" value={low.length} icon={<AlertTriangle className="size-5" />} href="/admin/products?stock=low" />
      </div>

      <div className="stagger mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="أحدث الطلبات" actions={<Link href="/admin/orders" className="text-xs font-semibold text-forest">عرض الكل</Link>}>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">لا توجد طلبات بعد. ستظهر هنا عندما يرسل الزبائن طلباتهم.</p>
          ) : (
            <ul className="divide-y divide-line">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`} className="press flex min-h-14 items-center gap-3 py-2 hover:bg-sand/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{o.customer.name}</p>
                      <p className="text-xs text-muted">{dateFormat(o.createdAt, { month: "short", day: "numeric" })} · {itemsLabel(o.lines.length)}</p>
                    </div>
                    <Badge tone={STATUS_META[o.status].tone}>{STATUS_META[o.status].label}</Badge>
                    <span className="w-20 text-end text-sm font-semibold tabular-nums">{money(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="مخزون يحتاج متابعة" actions={<Link href="/admin/products?stock=low" className="text-xs font-semibold text-forest">إدارة</Link>}>
          {low.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">كل المنتجات متوفرة بكميات جيدة.</p>
          ) : (
            <ul className="divide-y divide-line">
              {low.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="press flex min-h-14 items-center gap-3 py-2 hover:bg-sand/40">
                    <SmartImage src={p.images[0]} alt="" className="size-11 shrink-0 rounded-lg" />
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
