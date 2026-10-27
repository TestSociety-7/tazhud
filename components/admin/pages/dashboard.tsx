"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Inbox, Mail, Package, TrendingUp } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney, stockState } from "@/lib/commerce";
import { PLACEHOLDER_WHATSAPP } from "@/lib/seed";
import { isValidWhatsappNumber } from "@/lib/whatsapp";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge, PageHeader, Panel, StatCard } from "../ui";
import { STATUS_META } from "./orders";

const DAY = 24 * 60 * 60 * 1000;
// Captured once per page load; only used after hydration (see `ready`).
const CLIENT_NOW = typeof window === "undefined" ? 0 : Date.now();

export function Dashboard() {
  const { data, ready } = useStore();
  const money = (n: number) => formatMoney(n, data.settings);
  const products = data.products;
  const published = products.filter((p) => p.published);
  const low = products.filter((p) => stockState(p.stock, data.settings.lowStockThreshold) !== "in").sort((a, b) => a.stock - b.stock);
  const orders = data.orders;
  const newOrders = orders.filter((o) => o.status === "new");
  const active = orders.filter((o) => o.status !== "cancelled");
  const confirmed = orders.filter((o) => o.status === "confirmed" || o.status === "completed");

  // Anchor charts on the most recent inquiry so sample data still looks meaningful.
  const latest = orders.reduce((m, o) => Math.max(m, new Date(o.createdAt).getTime()), 0);
  const end = ready ? Math.max(latest, CLIENT_NOW) : latest;
  const days = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(end - (13 - i) * DAY);
    start.setHours(0, 0, 0, 0);
    const s = start.getTime();
    const dayOrders = active.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= s && t < s + DAY;
    });
    return { date: start, count: dayOrders.length, value: dayOrders.reduce((v, o) => v + o.total, 0) };
  });
  const maxValue = Math.max(1, ...days.map((d) => d.value));
  const last30 = active.filter((o) => new Date(o.createdAt).getTime() > end - 30 * DAY);

  const productTally = new Map<string, { name: string; qty: number; value: number }>();
  for (const o of active)
    for (const l of o.lines) {
      const t = productTally.get(l.name) ?? { name: l.name, qty: 0, value: 0 };
      t.qty += l.quantity;
      t.value += l.quantity * l.unitPrice;
      productTally.set(l.name, t);
    }
  const top = [...productTally.values()].sort((a, b) => b.value - a.value).slice(0, 5);

  const setup = [
    {
      done: data.settings.whatsappNumber !== PLACEHOLDER_WHATSAPP && isValidWhatsappNumber(data.settings.whatsappNumber),
      label: "Add your real WhatsApp number",
      href: "/admin/settings#contact",
    },
    { done: Boolean(data.settings.instagramUrl), label: "Link your Instagram profile", href: "/admin/settings#contact" },
    {
      done: products.some((p) => p.images.some((i) => !i.startsWith("/art/"))),
      label: "Upload real product photography",
      href: "/admin/products",
    },
    { done: data.coupons.some((c) => c.active), label: "Create a promotion code", href: "/admin/coupons" },
  ];

  return (
    <>
      <PageHeader
        title="Assalamu alaikum"
        description="Here's how the store is looking. Orders are completed with customers on WhatsApp; inquiries appear here when a customer sends their order from checkout in this browser."
        actions={
          <Link href="/admin/products/new" className="btn btn-primary">
            Add product
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard tone="dark" label="New inquiries" value={newOrders.length} hint={`${orders.length} total`} icon={<Inbox className="size-5" />} />
        <StatCard label="Inquiry value · 30d" value={money(last30.reduce((s, o) => s + o.total, 0))} hint={`${last30.length} inquiries`} icon={<TrendingUp className="size-5" />} />
        <StatCard label="Products" value={published.length} hint={`${products.length - published.length} hidden`} icon={<Package className="size-5" />} />
        <StatCard label="Low / sold out" value={low.length} hint={`Threshold: ${data.settings.lowStockThreshold}`} icon={<AlertTriangle className="size-5" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Inquiries, last 14 days" description={`Confirmed and completed: ${money(confirmed.reduce((s, o) => s + o.total, 0))}`}>
          <div className="flex h-44 items-end gap-1.5" role="img" aria-label="Bar chart of inquiry value per day over the last 14 days">
            {days.map((d) => (
              <div key={d.date.toISOString()} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className={`w-full rounded-t-md transition-colors ${d.value ? "bg-forest group-hover:bg-gold" : "bg-line"}`}
                  style={{ height: `${d.value ? Math.max(6, (d.value / maxValue) * 100) : 3}%` }}
                />
                <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-[0.65rem] whitespace-nowrap text-ivory group-hover:block">
                  {d.count} · {money(d.value)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[0.65rem] text-muted">
            <span>{days[0].date.toLocaleDateString(data.settings.locale, { month: "short", day: "numeric" })}</span>
            <span>{days[13].date.toLocaleDateString(data.settings.locale, { month: "short", day: "numeric" })}</span>
          </div>
        </Panel>

        <Panel title="Getting ready to launch">
          <ul className="space-y-2">
            {setup.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm hover:bg-sand/60">
                  {s.done ? <CheckCircle2 className="size-5 text-success" /> : <span className="size-5 rounded-full border-2 border-gold" />}
                  <span className={s.done ? "text-muted line-through" : "font-medium text-ink"}>{s.label}</span>
                  {!s.done && <ArrowRight className="ml-auto size-4 text-muted" />}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Recent inquiries" actions={<Link href="/admin/orders" className="text-xs font-semibold text-forest">View all</Link>}>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No inquiries yet. They appear when customers check out.</p>
          ) : (
            <ul className="divide-y divide-line">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`} className="flex min-h-14 items-center gap-3 py-2 hover:bg-sand/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {o.customer.name} <span className="text-xs font-normal text-muted">· {o.number}</span>
                      </p>
                      <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString(data.settings.locale, { month: "short", day: "numeric" })} · {o.lines.length} item{o.lines.length === 1 ? "" : "s"}</p>
                    </div>
                    <Badge tone={STATUS_META[o.status].tone}>{STATUS_META[o.status].label}</Badge>
                    <span className="w-20 text-right text-sm font-semibold tabular-nums">{money(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Stock to watch" actions={<Link href="/admin/products?stock=low" className="text-xs font-semibold text-forest">Manage</Link>}>
          {low.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-line">
              {low.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex min-h-14 items-center gap-3 py-2 hover:bg-sand/40">
                    <SmartImage src={p.images[0]} alt="" className="size-11 shrink-0 rounded-lg" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.name}</span>
                    <Badge tone={p.stock <= 0 ? "red" : "gold"}>{p.stock <= 0 ? "Sold out" : `${p.stock} left`}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Most requested pieces" description="From order inquiries, excluding cancelled">
          {top.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No data yet.</p>
          ) : (
            <ol className="space-y-3">
              {top.map((t, i) => (
                <li key={t.name} className="text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="truncate"><span className="mr-2 text-muted">{i + 1}.</span>{t.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{money(t.value)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-sand">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${(t.value / top[0].value) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Mailing list" description="Emails collected from the storefront sign-up forms in this browser">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-full bg-sand text-forest"><Mail className="size-5" /></span>
            <div>
              <p className="font-display text-4xl leading-none text-ink">{data.subscribers.length}</p>
              <p className="text-xs text-muted">subscribers</p>
            </div>
          </div>
          {data.subscribers.length > 0 && (
            <ul className="mt-4 max-h-40 space-y-1 overflow-y-auto text-sm">
              {data.subscribers.slice(0, 20).map((s) => (
                <li key={s.email} className="flex justify-between gap-2 text-muted">
                  <span className="truncate text-ink">{s.email}</span>
                  <span className="shrink-0 text-xs">{new Date(s.createdAt).toLocaleDateString(data.settings.locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
