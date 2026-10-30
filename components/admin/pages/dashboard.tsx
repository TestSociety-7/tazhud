"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Inbox, Package, TrendingUp } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney, stockState } from "@/lib/commerce";
import { PLACEHOLDER_WHATSAPP } from "@/lib/seed";
import { isValidWhatsappNumber } from "@/lib/whatsapp";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge, Panel } from "../ui";
import { CountUp } from "@/components/ui/fx";
import { STATUS_META } from "./orders";
import { dateFormat, itemsLabel } from "@/lib/arabic";
import { SeasonPicker } from "../season-picker";
import { greeting, WelcomeMark } from "../welcome";

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
    <Link
      href={href}
      className={`press group block min-w-0 rounded-2xl border p-4 transition-[box-shadow,border-color] duration-300 ease-[var(--ease-soft)] sm:p-5 ${
        dark ? "on-dark adm-cloth-flat adm-seam border-ink" : "border-line bg-paper text-ink hover:border-[#dcc3ca] hover:shadow-[var(--shadow-soft)]"
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${dark ? "text-gold-soft" : "text-muted"}`}>{label}</span>
        <span className={dark ? "text-gold-bright" : "text-forest/70"}>{icon}</span>
      </span>
      <span className={`mt-4 block break-words leading-none ${dark ? "text-ivory" : "text-ink"}`}>
        <span className="adm-num text-[1.7rem] sm:text-[2.1rem]">
          <CountUp value={value} format={format} />
        </span>
      </span>
    </Link>
  );
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
      {/* The cover of the order book: mulberry cloth, a saffron seam, today's work on a tag. */}
      <section className="on-dark adm-cloth adm-seam relative mb-6 overflow-hidden rounded-[1.4rem] px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-7">
        <div className="pointer-events-none absolute -top-24 -start-16 size-64 rounded-full bg-gold/15 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4 sm:gap-6">
          <div className="shrink-0">
            <WelcomeMark size="size-14 sm:size-20" pad="p-2.5 sm:p-3" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gold-bright">{greeting(ready ? new Date(CLIENT_NOW).getHours() : -1)}</p>
            <h1 className="season-title font-display mt-0.5 text-[1.9rem] leading-tight sm:text-[2.6rem]">أهلًا بك في {data.settings.storeName}</h1>
          </div>
        </div>
        <div className="relative mt-6 flex items-center gap-3">
          <p className="min-w-0 flex-1 text-sm text-ivory/75">
            {newOrders.length > 0 ? "طلبات بانتظار ردّك." : "لا توجد طلبات جديدة الآن."}
          </p>
          {newOrders.length > 0 && (
            <Link href="/admin/orders" className="swing-tag press min-h-11 shrink-0 !ps-7 !pe-4 text-base">
              <span className="adm-num">{newOrders.length}</span>
              <span className="font-sans text-xs font-semibold">{newOrders.length === 1 ? "طلب جديد" : "طلبات جديدة"}</span>
            </Link>
          )}
        </div>
      </section>

      {needsWhatsapp && (
        <Link href="/admin/settings" className="press stitch-box mb-6 flex min-h-14 items-center gap-3 rounded-2xl bg-gold-soft/50 p-4 text-sm text-gold-deep">
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

      <div className="mt-6">
        <SeasonPicker />
      </div>

      <div className="stagger mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="أحدث الطلبات" actions={<Link href="/admin/orders" className="-my-2 inline-flex min-h-11 items-center text-xs font-semibold text-forest">عرض الكل</Link>}>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">لا توجد طلبات بعد. ستظهر هنا عندما يرسل الزبائن طلباتهم.</p>
          ) : (
            <ul className="-my-2 divide-y divide-dashed divide-line">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`} className="press -mx-2 flex min-h-16 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sand/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{o.customer.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        <span className="adm-num ltr inline-block font-normal">{o.number}</span> · {dateFormat(o.createdAt, { month: "short", day: "numeric" })} · {itemsLabel(o.lines.length)}
                      </p>
                    </div>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="adm-num text-sm text-ink">{money(o.total)}</span>
                      <Badge tone={STATUS_META[o.status].tone}>{STATUS_META[o.status].label}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="مخزون يحتاج متابعة" actions={<Link href="/admin/products?stock=low" className="-my-2 inline-flex min-h-11 items-center text-xs font-semibold text-forest">إدارة</Link>}>
          {low.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">كل المنتجات متوفرة بكميات جيدة.</p>
          ) : (
            <ul className="-my-2 divide-y divide-dashed divide-line">
              {low.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="press -mx-2 flex min-h-16 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sand/40">
                    <SmartImage src={p.images[0]} alt="" className="h-12 w-10 shrink-0 rounded-md" />
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
