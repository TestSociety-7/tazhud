"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney } from "@/lib/commerce";
import { whatsappLink } from "@/lib/whatsapp";
import { dateFormat, piecesLabel } from "@/lib/arabic";
import { daysSince, RETURN_STATUS_META, RETURN_TYPE_LABEL } from "@/lib/returns";
import { RETURN_STATUSES, type ReturnRequest, type ReturnStatus } from "@/lib/types";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, ConfirmDialog, FormField, Modal, PageHeader } from "../ui";

async function send(id: string, method: "PATCH" | "DELETE", body?: unknown) {
  const res = await fetch(`/api/admin/returns/${encodeURIComponent(id)}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "تعذّر الحفظ.");
  return json as { request?: ReturnRequest };
}

function ReturnDetail({ item, onClose, onChange, onDelete }: { item: ReturnRequest; onClose: () => void; onChange: (r: ReturnRequest) => void; onDelete: () => void }) {
  const { data } = useStore();
  const money = (n: number) => formatMoney(n, data.settings);
  const [note, setNote] = useState(item.adminNote);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const order = data.orders.find((o) => o.id === item.orderId);
  const total = item.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const msg = `السلام عليكم ${item.customer.name.split(" ")[0]}، بخصوص طلب ${RETURN_TYPE_LABEL[item.type]} رقم ${item.number} من ${data.settings.storeName}. `;

  async function patch(body: Partial<Pick<ReturnRequest, "status" | "adminNote">>, done: string) {
    setBusy(true);
    try {
      const { request } = await send(item.id, "PATCH", body);
      if (request) onChange(request);
      toast.success(done);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`${RETURN_TYPE_LABEL[item.type]} ${item.number}`}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost me-auto text-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" /> حذف
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>إغلاق</button>
            <button type="button" className="btn btn-primary" disabled={busy || note === item.adminNote} onClick={() => patch({ adminNote: note }, "تم حفظ الملاحظة")}>
              حفظ الملاحظة
            </button>
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <Badge tone={RETURN_STATUS_META[item.status].tone}>{RETURN_STATUS_META[item.status].label}</Badge>
              <span>{dateFormat(item.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
              <span>
                · الطلب الأصلي{" "}
                {order ? (
                  <Link href={`/admin/orders?open=${order.id}`} className="ltr inline-block font-semibold text-forest underline underline-offset-2">{item.orderNumber}</Link>
                ) : (
                  <span className="ltr inline-block">{item.orderNumber}</span>
                )}{" "}
                قبل {daysSince(item.orderDate, Date.parse(item.createdAt))} يوم
              </span>
            </div>
            <ul className="divide-y divide-line rounded-xl border border-line bg-paper">
              {item.lines.map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span>
                    <span className="font-medium text-ink">{l.name}</span>
                    <span className="block text-xs text-muted">{[l.color, l.size].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="text-end tabular-nums">
                    × {l.quantity}
                    <span className="block text-xs text-muted">{money(l.unitPrice * l.quantity)}</span>
                  </span>
                </li>
              ))}
              <li className="flex justify-between p-3 text-sm font-semibold text-ink">
                <span>قيمة القطع</span>
                <span className="tabular-nums">{money(total)}</span>
              </li>
            </ul>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-sand/60 p-3"><dt className="text-xs text-muted">النوع</dt><dd className="font-semibold text-ink">{RETURN_TYPE_LABEL[item.type]}</dd></div>
              <div className="rounded-xl bg-sand/60 p-3"><dt className="text-xs text-muted">السبب</dt><dd className="font-semibold text-ink">{item.reason}</dd></div>
              {item.wish && <div className="rounded-xl bg-sand/60 p-3 sm:col-span-2"><dt className="text-xs text-muted">تريد بدلها</dt><dd className="text-ink">{item.wish}</dd></div>}
              {item.notes && <div className="rounded-xl bg-sand/60 p-3 sm:col-span-2"><dt className="text-xs text-muted">ملاحظات الزبونة</dt><dd className="text-ink">«{item.notes}»</dd></div>}
            </dl>
            <FormField label="ملاحظة داخلية" hint="تظهر في لوحة التحكم فقط." htmlFor="ret-note">
              <textarea id="ret-note" className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: الاستلام يوم الأحد، أُعيد المبلغ نقدًا" />
            </FormField>
          </div>
          <aside className="space-y-5">
            <div className="rounded-xl bg-sand/60 p-4 text-sm">
              <h3 className="mb-2 text-xs font-semibold text-muted">الزبونة</h3>
              <p className="font-semibold text-ink">{item.customer.name}</p>
              <a className="text-forest underline-offset-2 hover:underline" href={`tel:${item.customer.phone.replace(/[^\d+]/g, "")}`}><span className="ltr inline-block">{item.customer.phone}</span></a>
            </div>
            <fieldset>
              <legend className="label">الحالة</legend>
              <div className="grid grid-cols-2 gap-2">
                {RETURN_STATUSES.map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={item.status === k}
                    disabled={busy}
                    onClick={() => item.status !== k && patch({ status: k }, `${item.number}: ${RETURN_STATUS_META[k].label}`)}
                    className={`press min-h-10 rounded-full border text-sm transition-colors ${item.status === k ? "border-ink bg-ink font-semibold text-ivory" : "border-line bg-paper text-text hover:border-gold"}`}
                  >
                    {RETURN_STATUS_META[k].label}
                  </button>
                ))}
              </div>
            </fieldset>
            <a href={whatsappLink(item.customer.phone, msg)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
              <WhatsappIcon className="size-4" /> مراسلة الزبونة
            </a>
          </aside>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="حذف هذا الطلب؟"
        body={<>سيُحذف طلب {RETURN_TYPE_LABEL[item.type]} <strong>{item.number}</strong> من لوحة التحكم. لا يمكن التراجع عن ذلك.</>}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          try {
            await send(item.id, "DELETE");
            toast.success(`تم حذف ${item.number}`);
            onDelete();
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </>
  );
}

export function ReturnsPage() {
  const { data, isLocalOnly } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<ReturnRequest[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<ReturnStatus | "all">("all");
  const openId = params.get("open");
  const open = items?.find((r) => r.id === openId);
  const setOpen = (id: string | null) => router.replace(id ? `/admin/returns?open=${id}` : "/admin/returns", { scroll: false });
  const money = (n: number) => formatMoney(n, data.settings);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const res = await fetch("/api/admin/returns", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setItems(((await res.json()) as { returns: ReturnRequest[] }).returns);
    } catch {
      setFailed(true);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (isLocalOnly) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the list once the screen opens
    void load();
  }, [load, isLocalOnly]);

  const list = (items ?? []).filter((r) => status === "all" || r.status === status);
  const count = (s: ReturnStatus | "all") => (s === "all" ? items?.length ?? 0 : (items ?? []).filter((r) => r.status === s).length);

  return (
    <>
      <PageHeader
        title="الإرجاع والاستبدال"
        description="طلبات الزبونات لإرجاع قطع أو استبدالها. افتح الطلب لتغيير حالته أو مراسلة الزبونة."
        actions={
          !isLocalOnly && (
            <button type="button" className="press btn btn-outline border-line" onClick={() => void load()}>
              <RefreshCw className="size-4" /> تحديث
            </button>
          )
        }
      />

      {isLocalOnly ? (
        <EmptyState icon={<Undo2 className="size-6" />} title="تحتاج إلى التخزين المشترك" body="تظهر طلبات الإرجاع هنا بعد ربط Vercel Blob بالموقع." />
      ) : items === null ? (
        <div className="skeleton h-64 rounded-2xl" aria-busy="true" />
      ) : (
        <>
          <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="group" aria-label="تصفية حسب الحالة">
            {(["all", ...RETURN_STATUSES] as (ReturnStatus | "all")[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition-colors ${status === s ? "bg-ink text-ivory" : "bg-paper text-muted ring-1 ring-line hover:text-ink"}`}
              >
                {s === "all" ? "الكل" : RETURN_STATUS_META[s].label}
                <span className="tabular-nums opacity-70">{count(s)}</span>
              </button>
            ))}
          </div>

          {failed ? (
            <EmptyState icon={<Undo2 className="size-6" />} title="تعذّر التحميل" body="تحقق من الاتصال ثم اضغط تحديث." />
          ) : list.length === 0 ? (
            <EmptyState
              icon={<Undo2 className="size-6" />}
              title={items.length ? "لا توجد طلبات بهذه الحالة" : "لا توجد طلبات إرجاع بعد"}
              body="عندما تطلب زبونة إرجاع أو استبدال قطعة من صفحة «إرجاع أو استبدال» يظهر طلبها هنا ويصلك إشعار."
            />
          ) : (
            <ul className="stagger grid gap-3">
              {list.map((r) => {
                const pieces = r.lines.reduce((n, l) => n + l.quantity, 0);
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => setOpen(r.id)} className="press card flex w-full flex-wrap items-center gap-3 p-4 text-start transition-shadow hover:shadow-[var(--shadow-soft)]">
                      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${r.type === "exchange" ? "bg-sand text-forest" : "bg-gold/15 text-gold-deep"}`}>
                        {r.type === "exchange" ? <RefreshCw className="size-5" /> : <Undo2 className="size-5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">{r.customer.name}</span>
                          <Badge tone={RETURN_STATUS_META[r.status].tone}>{RETURN_STATUS_META[r.status].label}</Badge>
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {RETURN_TYPE_LABEL[r.type]} · {piecesLabel(pieces)} · {r.reason}
                        </span>
                      </span>
                      <span className="text-end text-xs text-muted">
                        <span className="block font-semibold text-ink tabular-nums">{money(r.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0))}</span>
                        {dateFormat(r.createdAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {open && (
        <ReturnDetail
          key={open.id}
          item={open}
          onClose={() => setOpen(null)}
          onChange={(next) => setItems((xs) => xs?.map((x) => (x.id === next.id ? next : x)) ?? null)}
          onDelete={() => {
            setItems((xs) => xs?.filter((x) => x.id !== open.id) ?? null);
            setOpen(null);
          }}
        />
      )}
    </>
  );
}
