"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
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
      title={`سلة التسوق${count ? ` (${count})` : ""}`}
      footer={
        lines.length > 0 ? (
          <div className="space-y-4">
            <OrderSummary />
            <div className="grid gap-2">
              <Link href="/checkout" onClick={close} className={`btn btn-primary w-full ${blocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocked}>
                إتمام الطلب عبر واتساب
              </Link>
              <Link href="/cart" onClick={close} className="btn btn-ghost w-full">
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
            <Link href="/shop" onClick={close} className="btn btn-primary">
              ابدئي التسوق
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line px-5">
          {lines.map((l) => (
            <CartLineItem key={l.key} line={l} compact onNavigate={close} />
          ))}
        </ul>
      )}
    </Sheet>
  );
}
