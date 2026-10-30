"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Gift, Home, Inbox, Package, Plus, Settings, Shapes, TicketPercent, TrendingUp, Undo2 } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney, stockState } from "@/lib/commerce";
import { PLACEHOLDER_WHATSAPP } from "@/lib/seed";
import { isValidWhatsappNumber } from "@/lib/whatsapp";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge, Panel } from "../ui";
import { CountUp, LogoCoin } from "@/components/ui/fx";
import { STATUS_META } from "./orders";
import { dateFormat, itemsLabel } from "@/lib/arabic";
import { SeasonPicker } from "../season-picker";
import { greeting } from "../welcome";

const DAY = 24 * 60 * 60 * 1000;
// Captured once per page load; only used after hydration (see `ready`).
const CLIENT_NOW = typeof window === "undefined" ? 0 : Date.now();

const short = (n: number) => new Intl.NumberFormat("ar", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Daily totals for the last `days` days, oldest first. Empty until the clock is known. */
function daily(orders: { createdAt: string; total: number; status: string }[], now: number, days: number, pick: (o: { total: number }) => number) {
  if (!now) return [];
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const first = start.getTime() - (days - 1) * DAY;
  const out = Array.from({ length: days }, () => 0);
  for (const o of orders) {
    const t = new Date(o.createdAt).getTime();
    if (t < first || t > now) continue;
    out[Math.min(days - 1, Math.floor((t - first) / DAY))] += pick(o);
  }
  return out;
}

/** A small single-series line: the card's title names it, so no legend. */
function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return <div className="mt-4 h-10" aria-hidden />;
  const max = Math.max(...values, 1);
  const w = 120;
  const h = 40;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - (v / max) * (h - 8)] as const);
  // Right-to-left reading: time runs from the right, so the newest day sits at the left edge.
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${(w - x).toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-10 w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label={label}>
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="spark-area" d={`${line} L0 ${h} L${w} ${h} Z`} fill="url(#spark-fill)" />
      <path className="spark-line" d={line} fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pathLength={400} />
      <circle cx={w - last[0]} cy={last[1]} r="3" fill="var(--color-ink)" stroke="var(--color-gold)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Seven thin bars, oldest on the right and newest on the left (RTL). Each bar names its value on hover. */
function Bars({ values, label, unit }: { values: number[]; label: string; unit: (n: number) => string }) {
  if (!values.length) return <div className="mt-4 h-10" aria-hidden />;
  const max = Math.max(...values, 1);
  return (
    <div className="mt-4 flex h-10 items-end gap-1" role="img" aria-label={label}>
      {values.map((v, i) => (
        <span
          key={i}
          title={`${values.length - 1 - i === 0 ? "اليوم" : `قبل ${values.length - 1 - i} يوم`}: ${unit(v)}`}
          className={`bar-grow block flex-1 rounded-t-[4px] ${i === values.length - 1 ? "bg-ink" : v ? "bg-ink/40" : "bg-ink/10"}`}
          style={{ height: `${Math.max(8, (v / max) * 100)}%`, animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}

function Meter({ part, whole, label, hot = false }: { part: number; whole: number; label: string; hot?: boolean }) {
  const pct = whole ? Math.round((part / whole) * 100) : 0;
  return (
    <div className="mt-4" role="img" aria-label={label}>
      <div className="h-2 overflow-hidden rounded-full bg-sand">
        <div className={`meter-grow h-full rounded-full ${hot ? "bg-gold" : "bg-ink"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[0.7rem] text-muted tabular-nums">{label}</p>
    </div>
  );
}

function Insight({
  label,
  value,
  format,
  icon,
  href,
  hot = false,
  children,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: React.ReactNode;
  href: string;
  hot?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`insight studio-tile block min-w-0 rounded-[1.4rem] border border-line p-4 sm:p-5 ${hot ? "insight-hot" : "bg-paper"}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={`text-xs font-bold ${hot ? "text-gold-soft" : "text-muted"}`}>{label}</span>
        <span className={`grid size-8 shrink-0 place-items-center rounded-full ${hot ? "bg-ink text-ivory" : "bg-sand text-gold"}`}>{icon}</span>
      </span>
      <span className="studio-title mt-3 block truncate text-[2.1rem] leading-none tabular-nums sm:text-5xl">
        <CountUp value={value} format={format} />
      </span>
      {children}
    </Link>
  );
}

const STORIES = [
  { href: "/admin/products/new", label: "منتج جديد", icon: Plus },
  { href: "/admin/orders", label: "الطلبات", icon: Inbox },
  { href: "/admin/returns", label: "الإرجاع", icon: Undo2 },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "الأقسام", icon: Shapes },
  { href: "/admin/bundles", label: "المجموعات", icon: Gift },
  { href: "/admin/coupons", label: "الخصم", icon: TicketPercent },
  { href: "/admin/homepage", label: "الواجهة", icon: Home },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

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
  const live = orders.filter((o) => o.status !== "cancelled");
  const salesDays = daily(live, now, 14, (o) => o.total);
  const orderDays = daily(orders, now, 7, () => 1);

  return (
    <>
      <section className="relative mb-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="story-ring is-live !size-20 shrink-0 sm:!size-24">
            <span className="story-face overflow-hidden">
              <LogoCoin hat float={false} className="size-full" />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gold-bright">{greeting(ready ? new Date(CLIENT_NOW).getHours() : -1)}</p>
            <h1 className="studio-title season-title truncate text-[1.85rem] sm:text-5xl">{data.settings.storeName}</h1>
            <dl className="mt-2 flex gap-5 text-xs text-muted">
              <div><dt className="sr-only">المنتجات</dt><dd><b className="font-latin block text-base font-extrabold text-ink tabular-nums">{short(products.length)}</b>منتج</dd></div>
              <div><dt className="sr-only">الطلبات</dt><dd><b className="font-latin block text-base font-extrabold text-ink tabular-nums">{short(orders.length)}</b>طلب</dd></div>
              <div><dt className="sr-only">الأقسام</dt><dd><b className="font-latin block text-base font-extrabold text-ink tabular-nums">{short(data.categories.length)}</b>قسم</dd></div>
            </dl>
          </div>
        </div>
        <p className="mt-4 text-sm text-text">
          {newOrders.length > 0 ? `عندك ${newOrders.length} ${newOrders.length === 1 ? "طلب جديد" : "طلبات جديدة"} بانتظارك.` : "لا توجد طلبات جديدة الآن."}
        </p>
      </section>

      <nav aria-label="اختصارات" className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="studio-list flex gap-2 pb-1">
          {STORIES.map(({ href, label, icon: Icon }, i) => {
            const badge = href === "/admin/orders" ? newOrders.length : 0;
            return (
              <li key={href}>
                <Link href={href} className="story">
                  <span className={`story-ring ${i === 0 || badge ? "is-live" : ""}`}>
                    <span className={`story-face ${i === 0 ? "!bg-ink !text-ivory" : ""}`}>
                      <Icon className="size-6" strokeWidth={i === 0 ? 2.75 : 2} />
                    </span>
                    {badge > 0 && <span className="story-badge tabular-nums">{badge}</span>}
                  </span>
                  <span className="w-full truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {needsWhatsapp && (
        <Link href="/admin/settings" className="studio-tile mb-6 flex items-center gap-3 rounded-[1.4rem] border border-gold/40 bg-gold/10 p-4 text-sm font-semibold text-gold-soft">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-white"><AlertTriangle className="size-5" /></span>
          <span className="flex-1">أضف رقم واتساب الحقيقي حتى تصلك طلبات الزبائن.</span>
          <ArrowLeft className="size-4 shrink-0" />
        </Link>
      )}

      <h2 className="studio-title mb-3 text-xl">الأرقام</h2>
      <div className="studio-list grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Insight hot label="طلبات جديدة" value={newOrders.length} icon={<Inbox className="size-4" />} href="/admin/orders">
          <Bars values={orderDays} label="عدد الطلبات في آخر 7 أيام" unit={(n) => `${n} طلب`} />
        </Insight>
        <Insight label="مبيعات آخر 30 يومًا" value={last30.reduce((s, o) => s + o.total, 0)} format={money} icon={<TrendingUp className="size-4" />} href="/admin/orders">
          <Sparkline values={salesDays} label="المبيعات اليومية في آخر 14 يومًا" />
        </Insight>
        <Insight label="منتجات منشورة" value={published.length} icon={<Package className="size-4" />} href="/admin/products">
          <Meter part={published.length} whole={products.length} label={`${published.length} من ${products.length} ظاهرة في المتجر`} />
        </Insight>
        <Insight label="مخزون منخفض" value={low.length} icon={<AlertTriangle className="size-4" />} href="/admin/products?stock=low">
          <Meter hot part={low.length} whole={products.length} label={low.length ? `${low.filter((p) => p.stock <= 0).length} نفدت تمامًا` : "كل شيء متوفر"} />
        </Insight>
      </div>

      <div className="mt-8">
        <SeasonPicker />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="أحدث الطلبات" actions={<Link href="/admin/orders" className="chip !text-gold-bright">عرض الكل</Link>}>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">لا توجد طلبات بعد. ستظهر هنا عندما يرسل الزبائن طلباتهم.</p>
          ) : (
            <ul className="studio-list -mx-2 space-y-1">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`} className="studio-tile flex min-h-16 items-center gap-3 rounded-2xl px-2 py-2 hover:bg-sand/60">
                    <span className={`story-ring !size-11 shrink-0 !p-[2px] ${o.status === "new" ? "is-live" : ""}`}>
                      <span className="story-face font-display text-sm font-bold ![--story-gap:var(--color-paper)] !border-2">{o.customer.name.trim().charAt(0)}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{o.customer.name}</p>
                      <p className="text-xs text-muted">{dateFormat(o.createdAt, { month: "short", day: "numeric" })} · {itemsLabel(o.lines.length)}</p>
                    </div>
                    <span className="flex flex-col items-end gap-1">
                      <span className="font-latin text-sm font-extrabold text-ink tabular-nums">{money(o.total)}</span>
                      <Badge tone={STATUS_META[o.status].tone}>{STATUS_META[o.status].label}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="مخزون يحتاج متابعة" actions={<Link href="/admin/products?stock=low" className="chip !text-gold-bright">إدارة</Link>}>
          {low.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">كل المنتجات متوفرة بكميات جيدة.</p>
          ) : (
            <ul className="studio-list -mx-2 space-y-1">
              {low.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="studio-tile flex min-h-16 items-center gap-3 rounded-2xl px-2 py-2 hover:bg-sand/60">
                    <SmartImage src={p.images[0]} alt="" className="h-14 w-11 shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{p.name}</span>
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
