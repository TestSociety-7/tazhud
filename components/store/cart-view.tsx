"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { useMoney } from "@/components/ui/price";
import { CartLineItem, CouponForm, OrderSummary } from "./cart-parts";

export function CartView() {
  const { lines, hydrated, count, clear, total } = useCart();
  const money = useMoney();
  const blocked = lines.some((l) => !l.available);

  if (!hydrated) {
    return (
      <div className="container-x py-16" aria-busy="true">
        <div className="skeleton-pearl h-12 w-64 rounded-full" />
        <div className="skeleton-pearl mt-8 h-40 rounded-[1.75rem]" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="page-wash container-x py-10">
        <EmptyState
          as="h1"
          icon={<ShoppingBag className="size-6" />}
          title="سلتكِ فارغة"
          body="عند إضافة القطع ستظهر هنا جاهزة للإرسال عبر واتساب."
          action={<Link href="/shop" className="btn btn-primary press">ابدئي التسوق</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page-wash bar-space">
      <div className="container-x pt-6 sm:pt-10">
        <Link href="/shop" className="glass press inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink">
          <ArrowRight className="size-4" /> متابعة التسوق
        </Link>
        <div className="mt-4 flex items-end justify-between gap-3">
          <h1 className="season-title font-display text-[2.6rem] leading-tight text-ink sm:text-5xl">سلة التسوق</h1>
          <span className="badge-pearl font-latin mb-2 grid min-w-9 place-items-center rounded-full px-2.5 py-1 text-sm font-bold" aria-label={`${count} قطع`}>{count}</span>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-14">
          <section aria-label="القطع في سلتكِ">
            <ul className="rise space-y-3">
              {lines.map((l) => <CartLineItem key={l.key} line={l} />)}
            </ul>
            <button type="button" className="mt-4 inline-flex min-h-10 items-center px-1 text-xs font-semibold text-muted underline-offset-4 hover:text-danger hover:underline" onClick={clear}>
              إفراغ السلة
            </button>
          </section>

          <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <div className="glass-card space-y-6 p-5 sm:p-6">
              <h2 className="font-display text-[1.75rem] text-ink">الملخص</h2>
              <CouponForm />
              <OrderSummary />
              <Link href="/checkout" className={`btn btn-primary press min-h-12 w-full ${blocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocked}>
                <WhatsappIcon className="size-4" /> إتمام الطلب عبر واتساب
              </Link>
              {blocked && <p className="error-text" role="alert">يرجى تعديل القطع المحددة قبل إتمام الطلب.</p>}
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" />
                لا يتم أي دفع عبر هذا الموقع. نؤكد طلبكِ والتوصيل وطريقة الدفع معكِ شخصيًا عبر واتساب.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Phones: total and the next step always under the thumb. */}
      <div className="buybar glass p-2 ps-5" data-shown="true">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] text-muted">الإجمالي</p>
            <p className="font-latin text-lg leading-tight font-bold text-ink tabular-nums">{money(total)}</p>
          </div>
          <Link href="/checkout" aria-disabled={blocked} className={`btn btn-primary press min-h-12 rounded-[1.25rem] px-5 ${blocked ? "pointer-events-none opacity-50" : ""}`}>
            <WhatsappIcon className="size-4" /> إتمام الطلب
          </Link>
        </div>
      </div>
    </div>
  );
}
