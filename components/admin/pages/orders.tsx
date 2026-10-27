"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, Inbox, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney } from "@/lib/commerce";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { dateFormat } from "@/lib/arabic";
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
                      <span className="block text-xs text-muted">{[l.color, l.size].filter(Boolean).join(" · ")} · {money(l.unitPrice)} للقطعة</span>
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
            <div className="rounded-xl bg-sand/60 p-4 text-sm">
              <h3 className="mb-2 text-xs font-semibold text-muted">الزبونة</h3>
              <p className="font-semibold text-ink">{order.customer.name}</p>
              <p><a className="text-forest underline-offset-2 hover:underline" href={`tel:${order.customer.phone.replace(/[^\d+]/g, "")}`}><span className="ltr inline-block">{order.customer.phone}</span></a></p>
              <p className="mt-2 text-muted">{order.customer.address}{order.customer.city ? `، ${order.customer.city}` : ""}</p>
              {order.customer.notes && <p className="mt-2 rounded-lg bg-paper p-2 text-xs">«{order.customer.notes}»</p>}
            </div>
            <div>
              <label htmlFor="order-status" className="label">الحالة</label>
              <select id="order-status" className="field" value={order.status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <a href={whatsappLink(order.customer.phone, customerMsg)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
              <WhatsappIcon className="size-4" /> مراسلة الزبونة
            </a>
            <button
              type="button"
              className="btn btn-outline w-full border-line"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(buildOrderMessage(order, data.settings));
                  toast.success("تم نسخ ملخص الطلب");
                } catch {
                  toast.error("النسخ غير متاح في هذا المتصفح");
                }
              }}
            >
              <Copy className="size-4" /> نسخ نص الطلب
            </button>
            <p className="text-xs leading-relaxed text-muted">تُكمل الزبونة الطلب عبر واتساب. حدّث الحالة هنا لتتابع الطلبات.</p>
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
        title="الطلبات"
        description="عندما ترسل الزبونة طلبًا من صفحة الإتمام تُحفظ نسخة هنا. أكّد التوفر والتوصيل والدفع عبر واتساب ثم حدّث الحالة."
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="تصفية حسب الحالة">
          {(["all", ...Object.keys(STATUS_META)] as (OrderStatus | "all")[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition-colors ${status === s ? "bg-ink text-ivory" : "bg-paper text-muted ring-1 ring-line hover:text-ink"}`}
            >
              {s === "all" ? "الكل" : STATUS_META[s].label}
              <span className={`text-xs ${status === s ? "text-gold" : ""}`}>{counts(s)}</span>
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
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">الطلبات</caption>
            <thead className="hidden border-b border-line bg-sand/40 text-start text-xs text-muted md:table-header-group">
              <tr>
                <th className="px-5 py-3 font-medium">الطلب</th>
                <th className="px-5 py-3 font-medium">الزبونة</th>
                <th className="px-5 py-3 font-medium">التاريخ</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 text-end font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((o) => (
                <tr key={o.id} className="grid cursor-pointer grid-cols-[1fr_auto] gap-1 px-4 py-4 transition-colors hover:bg-sand/40 md:table-row md:p-0" onClick={() => setOpen(o.id)}>
                  <td className="md:px-5 md:py-4">
                    <button type="button" className="ltr font-semibold text-ink hover:underline" onClick={(e) => { e.stopPropagation(); setOpen(o.id); }}>
                      {o.number}
                    </button>
                    {o.sample && <span className="ms-2"><Badge>مثال</Badge></span>}
                  </td>
                  <td className="col-start-1 md:px-5 md:py-4">
                    <span className="block text-ink">{o.customer.name}</span>
                    <span className="ltr block text-xs text-muted">{o.customer.phone}</span>
                  </td>
                  <td className="col-start-1 text-xs text-muted md:px-5 md:py-4 md:text-sm">{dateFormat(o.createdAt)}</td>
                  <td className="col-start-2 row-start-1 justify-self-end md:px-5 md:py-4"><Badge tone={STATUS_META[o.status].tone}>{STATUS_META[o.status].label}</Badge></td>
                  <td className="col-start-2 row-start-2 text-end font-semibold tabular-nums md:px-5 md:py-4">{money(o.total)}</td>
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
