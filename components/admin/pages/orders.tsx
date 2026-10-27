"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, Inbox, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney } from "@/lib/commerce";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import type { OrderInquiry, OrderStatus } from "@/lib/types";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, ConfirmDialog, FormField, Modal, PageHeader } from "../ui";
import { useSave } from "../use-save";

export const STATUS_META: Record<OrderStatus, { label: string; tone: "neutral" | "green" | "gold" | "red" | "blue" }> = {
  new: { label: "New", tone: "gold" },
  contacted: { label: "Contacted", tone: "blue" },
  confirmed: { label: "Confirmed", tone: "green" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "red" },
};

function OrderDetail({ order, onClose }: { order: OrderInquiry; onClose: () => void }) {
  const { data } = useStore();
  const save = useSave();
  const money = (n: number) => formatMoney(n, { currency: order.currency, locale: data.settings.locale });
  const [note, setNote] = useState(order.adminNote);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setStatus = (status: OrderStatus) =>
    save((d) => ({ ...d, orders: d.orders.map((o) => (o.id === order.id ? { ...o, status } : o)) }), `${order.number} marked ${STATUS_META[status].label.toLowerCase()}`);

  const customerMsg = `Assalamu alaikum ${order.customer.name.split(" ")[0]}, thank you for your order ${order.number} with ${data.settings.storeName}. `;

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`Order ${order.number}`}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost mr-auto text-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" /> Delete
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={note === order.adminNote}
              onClick={() => save((d) => ({ ...d, orders: d.orders.map((o) => (o.id === order.id ? { ...o, adminNote: note } : o)) }), "Note saved")}
            >
              Save note
            </button>
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <Badge tone={STATUS_META[order.status].tone}>{STATUS_META[order.status].label}</Badge>
              {order.sample && <Badge>Sample</Badge>}
              <span>{new Date(order.createdAt).toLocaleString(data.settings.locale, { dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            <table className="w-full text-sm">
              <caption className="sr-only">Items</caption>
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="py-3">
                      <span className="font-medium text-ink">{l.name}</span>
                      {l.kind === "bundle" && <Badge tone="gold">Bundle</Badge>}
                      <span className="block text-xs text-muted">{[l.color, l.size].filter(Boolean).join(" · ")} {money(l.unitPrice)} each</span>
                    </td>
                    <td className="py-3 text-right tabular-nums">{l.quantity}</td>
                    <td className="py-3 text-right font-medium tabular-nums">{money(l.unitPrice * l.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
              {order.couponCode && <div className="flex justify-between text-success"><dt>Coupon {order.couponCode}</dt><dd className="tabular-nums">{order.discount ? `−${money(order.discount)}` : "Free delivery"}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="tabular-nums">{order.delivery ? money(order.delivery) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
            </dl>
            <FormField label="Internal note" hint="Only visible in the admin." htmlFor="admin-note">
              <textarea id="admin-note" className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Paid by transfer, delivering Thursday" />
            </FormField>
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl bg-sand/60 p-4 text-sm">
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Customer</h3>
              <p className="font-semibold text-ink">{order.customer.name}</p>
              <p><a className="text-forest underline-offset-2 hover:underline" href={`tel:${order.customer.phone.replace(/[^\d+]/g, "")}`}>{order.customer.phone}</a></p>
              <p className="mt-2 text-muted">{order.customer.address}{order.customer.city ? `, ${order.customer.city}` : ""}</p>
              {order.customer.notes && <p className="mt-2 rounded-lg bg-paper p-2 text-xs">“{order.customer.notes}”</p>}
            </div>
            <div>
              <label htmlFor="order-status" className="label">Status</label>
              <select id="order-status" className="field" value={order.status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <a href={whatsappLink(order.customer.phone, customerMsg)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
              <WhatsappIcon className="size-4" /> Message customer
            </a>
            <button
              type="button"
              className="btn btn-outline w-full border-line"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(buildOrderMessage(order, data.settings));
                  toast.success("Order summary copied");
                } catch {
                  toast.error("Copy isn't available in this browser");
                }
              }}
            >
              <Copy className="size-4" /> Copy order text
            </button>
            <p className="text-xs leading-relaxed text-muted">The customer completes this order on WhatsApp. Update the status here to keep track.</p>
          </aside>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this inquiry?"
        body={<>Order <strong>{order.number}</strong> from {order.customer.name} will be removed from the admin. This can&apos;t be undone.</>}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          if (await save((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== order.id) }), `${order.number} deleted`)) onClose();
        }}
      />
    </>
  );
}

export function OrdersPage() {
  const { data } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  const openId = params.get("open");
  const open = data.orders.find((o) => o.id === openId);
  const money = (n: number) => formatMoney(n, data.settings);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.orders
      .filter((o) => status === "all" || o.status === status)
      .filter((o) => !term || [o.number, o.customer.name, o.customer.phone, o.customer.city].join(" ").toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.orders, status, q]);

  const counts = (s: OrderStatus | "all") => (s === "all" ? data.orders.length : data.orders.filter((o) => o.status === s).length);
  const setOpen = (id: string | null) => router.replace(id ? `/admin/orders?open=${id}` : "/admin/orders", { scroll: false });

  return (
    <>
      <PageHeader
        title="Order inquiries"
        description="Every time a customer sends an order from checkout, a copy is saved here. Customers complete their order with you on WhatsApp: confirm stock, delivery and payment there, then update the status."
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Filter by status">
          {(["all", ...Object.keys(STATUS_META)] as (OrderStatus | "all")[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition-colors ${status === s ? "bg-ink text-ivory" : "bg-paper text-muted ring-1 ring-line hover:text-ink"}`}
            >
              {s === "all" ? "All" : STATUS_META[s].label}
              <span className={`text-xs ${status === s ? "text-gold" : ""}`}>{counts(s)}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" className="field !pl-9" placeholder="Search name, phone, order #" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search inquiries" />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Inbox className="size-6" />} title="No inquiries here" body={data.orders.length ? "Try a different filter." : "When customers check out, their orders appear here."} />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Order inquiries</caption>
            <thead className="hidden border-b border-line bg-sand/40 text-left text-xs text-muted md:table-header-group">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((o) => (
                <tr key={o.id} className="grid cursor-pointer grid-cols-[1fr_auto] gap-1 px-4 py-4 transition-colors hover:bg-sand/40 md:table-row md:p-0" onClick={() => setOpen(o.id)}>
                  <td className="md:px-5 md:py-4">
                    <button type="button" className="text-left font-semibold text-ink hover:underline" onClick={(e) => { e.stopPropagation(); setOpen(o.id); }}>
                      {o.number}
                    </button>
                    {o.sample && <span className="ml-2"><Badge>Sample</Badge></span>}
                  </td>
                  <td className="col-start-1 md:px-5 md:py-4">
                    <span className="block text-ink">{o.customer.name}</span>
                    <span className="block text-xs text-muted">{o.customer.phone}</span>
                  </td>
                  <td className="col-start-1 text-xs text-muted md:px-5 md:py-4 md:text-sm">{new Date(o.createdAt).toLocaleDateString(data.settings.locale, { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="col-start-2 row-start-1 justify-self-end md:px-5 md:py-4"><Badge tone={STATUS_META[o.status].tone}>{STATUS_META[o.status].label}</Badge></td>
                  <td className="col-start-2 row-start-2 text-right font-semibold tabular-nums md:px-5 md:py-4">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && <OrderDetail key={open.id} order={open} onClose={() => setOpen(null)} />}
    </>
  );
}
