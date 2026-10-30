"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, Inbox, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { bundleContents, formatMoney } from "@/lib/commerce";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { orderPicturesUrl } from "@/lib/order-pictures";
import { dateFormat, ordersLabel, piecesLabel } from "@/lib/arabic";
import type { OrderInquiry, OrderStatus } from "@/lib/types";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, ConfirmDialog, FormField, Modal, PageHeader } from "../ui";
import { useSave } from "../use-save";

export const STATUS_META: Record<OrderStatus, { label: string; tone: "neutral" | "green" | "gold" | "red" | "blue" }> = {
  new: { label: "جديد", tone: "gold" },
  contacted: { label: "تم التواصل", tone: "blue" },
  confirmed: { label: "مؤكد", tone: "green" },
  completed: { label: "مكتمل", tone: "neutral" },
  cancelled: { label: "ملغي", tone: "red" },
};

function OrderDetail({ order, onClose }: { order: OrderInquiry; onClose: () => void }) {
  const { data } = useStore();
  const save = useSave();
  const money = (n: number) => formatMoney(n, { currency: order.currency, locale: data.settings.locale });
  const bundleText = (id: string) => {
    const b = data.bundles.find((x) => x.id === id);
    return b ? bundleContents(b, data.products) : "";
  };
  const [note, setNote] = useState(order.adminNote);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setStatus = (status: OrderStatus) =>
    save((d) => ({ ...d, orders: d.orders.map((o) => (o.id === order.id ? { ...o, status } : o)) }), `${order.number}: ${STATUS_META[status].label}`);

  const customerMsg = `السلام عليكم ${order.customer.name.split(" ")[0]}، شكرًا لطلبكِ رقم ${order.number} من ${data.settings.storeName}. `;

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`الطلب ${order.number}`}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost me-auto text-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" /> حذف
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>إغلاق</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={note === order.adminNote}
              onClick={() => save((d) => ({ ...d, orders: d.orders.map((o) => (o.id === order.id ? { ...o, adminNote: note } : o)) }), "تم حفظ الملاحظة")}
            >
              حفظ الملاحظة
            </button>
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <Badge tone={STATUS_META[order.status].tone}>{STATUS_META[order.status].label}</Badge>
              {order.sample && <Badge>مثال</Badge>}
              <span>{dateFormat(order.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            <table className="w-full text-sm">
              <caption className="sr-only">القطع</caption>
              <thead>
                <tr className="border-b border-line text-start text-xs text-muted">
                  <th className="py-2 font-medium">القطعة</th>
                  <th className="py-2 text-end font-medium">الكمية</th>
                  <th className="py-2 text-end font-medium">المجموع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="py-3">
                      <span className="font-medium text-ink">{l.name}</span>
                      {l.kind === "bundle" && <> <Badge tone="gold">مجموعة</Badge></>}
                      {l.kind === "bundle" && bundleText(l.refId) && <span className="block text-xs text-text">{bundleText(l.refId)}</span>}
                      <span className="block text-xs text-muted">{[l.color, l.size, `${money(l.unitPrice)} للقطعة`].filter(Boolean).join(" · ")}</span>
                    </td>
                    <td className="py-3 text-end tabular-nums">{l.quantity}</td>
                    <td className="py-3 text-end font-medium tabular-nums">{money(l.unitPrice * l.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ms-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">المجموع الفرعي</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
              {order.couponCode && <div className="flex justify-between text-success"><dt>كود {order.couponCode}</dt><dd className="tabular-nums">{order.discount ? `−${money(order.discount)}` : "توصيل مجاني"}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">التوصيل</dt><dd className="tabular-nums">{order.delivery ? money(order.delivery) : "مجاني"}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink"><dt>الإجمالي</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
            </dl>
            <FormField label="ملاحظة داخلية" hint="تظهر في لوحة التحكم فقط." htmlFor="admin-note">
              <textarea id="admin-note" className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: الدفع بالتحويل، التوصيل يوم الخميس" />
            </FormField>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl bg-paper p-4 text-sm ring-1 ring-line">
              <h3 className="mb-2 text-xs font-semibold text-muted">الزبونة</h3>
              <p className="font-semibold text-ink">{order.customer.name}</p>
              <p><a className="font-semibold text-gold-bright underline-offset-2 hover:underline" href={`tel:${order.customer.phone.replace(/[^\d+]/g, "")}`}><span className="ltr inline-block">{order.customer.phone}</span></a></p>
              <p className="mt-2 text-muted">{order.customer.address}{order.customer.city ? `، ${order.customer.city}` : ""}</p>
              {order.customer.notes && <p className="mt-2 rounded-lg bg-sand p-2 text-xs">«{order.customer.notes}»</p>}
            </div>
            <fieldset>
              <legend className="label">الحالة</legend>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(STATUS_META) as OrderStatus[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={order.status === k}
                    onClick={() => order.status !== k && setStatus(k)}
                    className="studio-chip w-full"
                  >
                    {STATUS_META[k].label}
                  </button>
                ))}
              </div>
            </fieldset>
            <a href={whatsappLink(order.customer.phone, customerMsg)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
              <WhatsappIcon className="size-4" /> مراسلة الزبونة
            </a>
            <button
              type="button"
              className="btn btn-outline w-full border-line"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(buildOrderMessage(order, data.settings, orderPicturesUrl(order.number, order.lines, data.products, data.bundles), data));
                  toast.success("تم نسخ ملخص الطلب");
                } catch {
                  toast.error("النسخ غير متاح في هذا المتصفح");
                }
              }}
            >
              <Copy className="size-4" /> نسخ نص الطلب
            </button>
          </aside>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="حذف هذا الطلب؟"
        body={<>سيُحذف الطلب <strong>{order.number}</strong> من {order.customer.name} من لوحة التحكم. لا يمكن التراجع عن ذلك.</>}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          if (await save((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== order.id) }), `تم حذف ${order.number}`)) onClose();
        }}
      />
    </>
  );
}

export function OrdersPage() {
  const { data } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const save = useSave();
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  const [confirmBulk, setConfirmBulk] = useState(false);
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
        title="الطلبات"
        description="كل طلب يصلك على واتساب يُحفظ هنا أيضًا. افتح الطلب لتغيير حالته أو مراسلة الزبونة."
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="group" aria-label="تصفية حسب الحالة">
          {(["all", ...Object.keys(STATUS_META)] as (OrderStatus | "all")[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className="studio-chip"
            >
              {s === "all" ? "الكل" : STATUS_META[s].label}
              <span className="studio-chip-count">{counts(s)}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" className="field !ps-9" placeholder="ابحث بالاسم أو الهاتف أو رقم الطلب" value={q} onChange={(e) => setQ(e.target.value)} aria-label="البحث في الطلبات" />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Inbox className="size-6" />} title="لا توجد طلبات هنا" body={data.orders.length ? "جرّب تصفية أخرى." : "عندما يرسل الزبائن طلباتهم ستظهر هنا."} />
        </div>
      ) : (
        <>
          <ul className="studio-list grid gap-3 md:grid-cols-2">
            {list.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setOpen(o.id)}
                  className="studio-tile card flex w-full flex-col gap-3 p-4 text-start"
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="ltr text-xs font-semibold text-muted">{o.number}</span>
                    <Badge tone={STATUS_META[o.status].tone}>{STATUS_META[o.status].label}</Badge>
                  </span>
                  <span className="flex w-full items-end justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-base font-bold text-ink">{o.customer.name}</span>
                      <span className="block text-xs text-muted">
                        {[o.customer.city, piecesLabel(o.lines.reduce((n, l) => n + l.quantity, 0)), dateFormat(o.createdAt, { day: "numeric", month: "short" })].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="studio-title shrink-0 text-2xl leading-none tabular-nums">{money(o.total)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <button type="button" className="press btn btn-sm btn-ghost text-danger" onClick={() => setConfirmBulk(true)}>
              <Trash2 className="size-4" /> {status === "all" ? `حذف كل الطلبات (${list.length})` : `حذف طلبات «${STATUS_META[status].label}» (${list.length})`}
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmBulk}
        title={status === "all" ? "حذف كل الطلبات؟" : `حذف طلبات «${STATUS_META[status as OrderStatus]?.label}»؟`}
        body={<>سيُحذف <strong>{ordersLabel(list.length)}</strong> من لوحة التحكم. لا يمكن التراجع عن ذلك. المنتجات لن تتأثر.</>}
        confirmLabel={`حذف ${ordersLabel(list.length)}`}
        onCancel={() => setConfirmBulk(false)}
        onConfirm={async () => {
          setConfirmBulk(false);
          const ids = new Set(list.map((o) => o.id));
          await save((d) => ({ ...d, orders: d.orders.filter((o) => !ids.has(o.id)) }), `تم حذف ${ordersLabel(ids.size)}`);
          setStatus("all");
        }}
      />

      {open && <OrderDetail key={open.id} order={open} onClose={() => setOpen(null)} />}
    </>
  );
}
