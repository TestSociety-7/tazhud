"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PackageSearch, RotateCcw, ShoppingBag, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { useMoney } from "@/components/ui/price";
import { dateFormat, piecesLabel } from "@/lib/arabic";
import { CUSTOMER_STATUS, readMyOrders, type SavedOrder } from "@/lib/my-orders";
import { daysSince } from "@/lib/returns";
import { whatsappLink } from "@/lib/whatsapp";
import type { OrderStatus } from "@/lib/types";

export function MyOrdersView() {
  const { data } = useStore();
  const cart = useCart();
  const money = useMoney();
  const [orders, setOrders] = useState<SavedOrder[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, OrderStatus>>({});

  useEffect(() => {
    const list = readMyOrders();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- this phone's orders live in browser storage
    setOrders(list);
    if (!list.length) return;
    fetch("/api/orders/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: list.map((o) => ({ number: o.number, phone: o.phone })) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json?.statuses && setStatuses(json.statuses))
      .catch(() => {});
  }, []);

  const image = (refId: string) => {
    const b = data.bundles.find((x) => x.id === refId);
    if (b?.image) return b.image;
    const id = b ? b.items[0]?.productId : refId;
    return data.products.find((p) => p.id === id)?.images[0];
  };

  function orderAgain(o: SavedOrder) {
    let added = 0;
    for (const l of o.lines) {
      const b = l.kind === "bundle" ? data.bundles.find((x) => x.id === l.refId && x.active) : undefined;
      if (b) {
        cart.addBundle(b);
        added++;
        continue;
      }
      const p = data.products.find((x) => x.id === l.refId && x.published && x.stock > 0);
      if (!p) continue;
      cart.addProduct(p, { color: l.color, size: l.size, quantity: l.quantity });
      added++;
    }
    if (added) {
      toast.success("أُضيفت القطع إلى السلة");
      cart.setDrawerOpen(true);
    } else toast.error("هذه القطع غير متوفرة الآن");
  }

  if (orders === null) return <div className="container-x py-16"><div className="skeleton h-80 rounded-2xl" aria-busy="true" /></div>;

  return (
    <div className="container-x max-w-3xl py-8 sm:py-14">
      <p className="eyebrow text-gold-deep">حسابي</p>
      <h1 className="season-title font-display mt-1 text-4xl text-ink sm:text-5xl">طلباتي</h1>
      <p className="mt-2 text-sm text-muted">الطلبات التي أرسلتِها من هذا الجهاز.</p>

      {orders.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<ShoppingBag className="size-6" />}
            title="لا توجد طلبات على هذا الهاتف بعد"
            body="بعد أن ترسلي طلبكِ عبر واتساب سيظهر هنا، ومنه يمكنكِ طلب إرجاع أو استبدال."
            action={<Link href="/shop" className="btn btn-primary">تسوّقي الآن</Link>}
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => {
            const status = statuses[o.number];
            const meta = status ? CUSTOMER_STATUS[status] : null;
            const pieces = o.lines.reduce((n, l) => n + l.quantity, 0);
            const canReturn = status !== "cancelled" && daysSince(o.createdAt) <= data.settings.returnDays + 14;
            return (
              <li key={o.number} className="card overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4">
                  <div>
                    <p className="swing-tag swing-tag-dark -ms-1"><bdi dir="ltr">{o.number}</bdi></p>
                    <p className="mt-2 text-xs text-muted">{dateFormat(o.createdAt)} · {piecesLabel(pieces)}</p>
                  </div>
                  <div className="text-end">
                    {meta && <span className={`inline-block rounded-md px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>}
                    <p className="font-latin mt-1 text-xl font-bold text-ink tabular-nums">{money(o.total)}</p>
                  </div>
                </div>
                <ul className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-4">
                  {o.lines.map((l, i) => (
                    <li key={i} className="w-20 shrink-0">
                      <div className="relative">
                        <SmartImage src={image(l.refId)} alt="" className="pinked aspect-[4/5] w-20 rounded-t-lg [--z:3px]" fallbackLabel=" " />
                        {l.quantity > 1 && <span className="font-latin absolute top-1 end-1 rounded-sm bg-ink px-1.5 text-[0.68rem] font-bold text-gold-soft"><bdi dir="ltr">×{l.quantity}</bdi></span>}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[0.7rem] leading-snug text-text">{l.name}</p>
                      {(l.color || l.size) && <p className="truncate text-[0.65rem] text-muted">{[l.color, l.size].filter(Boolean).join(" · ")}</p>}
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-3 border-t border-dashed border-forest/20 text-xs font-semibold">
                  {canReturn ? (
                    <Link href={`/returns?n=${encodeURIComponent(o.number)}`} className="press flex min-h-14 flex-col items-center justify-center gap-1 text-forest hover:bg-sand/60">
                      <Undo2 className="size-4" /> إرجاع أو استبدال
                    </Link>
                  ) : (
                    <span className="flex min-h-14 flex-col items-center justify-center gap-1 text-muted/60">
                      <Undo2 className="size-4" /> إرجاع أو استبدال
                    </span>
                  )}
                  <a
                    href={whatsappLink(data.settings.whatsappNumber, `السلام عليكم ${data.settings.storeName}، لدي سؤال عن طلبي رقم ${o.number}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press flex min-h-14 flex-col items-center justify-center gap-1 border-x border-dashed border-forest/20 text-forest hover:bg-sand/60"
                  >
                    <WhatsappIcon className="size-4" /> اسألي عن الطلب
                  </a>
                  <button type="button" onClick={() => orderAgain(o)} className="press flex min-h-14 flex-col items-center justify-center gap-1 text-forest hover:bg-sand/60">
                    <RotateCcw className="size-4" /> اطلبي مجددًا
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/returns" className="card stitch-box-soft mt-6 flex items-center gap-4 p-5 transition-colors duration-300 hover:bg-sand/40">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand text-forest"><PackageSearch className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">طلبتِ من هاتف آخر؟</span>
          <span className="block text-xs text-muted">ابحثي برقم الطلب ورقم الهاتف لإرجاع أو استبدال قطعة.</span>
        </span>
      </Link>
    </div>
  );
}
