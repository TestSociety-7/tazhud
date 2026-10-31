"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { CartLineItem, OrderSummary } from "./cart-parts";

export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, lines, count } = useCart();
  const { data } = useStore();
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }
  const close = () => setDrawerOpen(false);
  const blocked = lines.some((l) => !l.available);

  return (
    <Sheet
      open={drawerOpen}
      onClose={close}
      side="responsive"
      title={`سلة التسوق${count ? ` (${count})` : ""}`}
      heading={
        <h2 className="flex items-center gap-2.5 font-display text-2xl text-ink">
          سلة التسوق
          {count > 0 && <span key={count} className="badge-pearl qty-pop font-latin grid min-w-7 place-items-center rounded-full px-2 py-0.5 text-xs font-bold">{count}</span>}
        </h2>
      }
      footer={
        lines.length > 0 ? (
          <div className="space-y-4">
            <OrderSummary />
            <div className="grid gap-2">
              <Link href="/checkout" onClick={close} className={`btn btn-primary press min-h-12 w-full ${blocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocked}>
                <WhatsappIcon className="size-4" /> إتمام الطلب عبر واتساب
              </Link>
              <Link href="/cart" onClick={close} className="btn btn-ghost press w-full text-forest">
                {data.settings.couponsEnabled ? "عرض السلة وإضافة كود خصم" : "عرض السلة"}
              </Link>
            </div>
          </div>
        ) : null
      }
    >
      {lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title="سلتكِ فارغة"
          body="تصفّحي المجموعة وأضيفي القطع التي أحببتِها."
          action={
            <Link href="/shop" onClick={close} className="btn btn-primary press">
              ابدئي التسوق
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line/70 px-5">
          {lines.map((l) => (
            <CartLineItem key={l.key} line={l} compact onNavigate={close} />
          ))}
        </ul>
      )}
    </Sheet>
  );
}
