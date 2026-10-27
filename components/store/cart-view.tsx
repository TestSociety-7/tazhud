"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { CartLineItem, CouponForm, OrderSummary } from "./cart-parts";

export function CartView() {
  const { lines, hydrated, count, clear } = useCart();
  const blocked = lines.some((l) => !l.available);

  if (!hydrated) {
    return (
      <div className="container-x py-16" aria-busy="true">
        <div className="skeleton h-12 w-64 rounded" />
        <div className="skeleton mt-8 h-40 rounded-2xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-x py-16">
        <EmptyState
          as="h1"
          icon={<ShoppingBag className="size-6" />}
          title="سلتكِ فارغة"
          body="عند إضافة القطع ستظهر هنا جاهزة للإرسال عبر واتساب."
          action={<Link href="/shop" className="btn btn-primary">ابدئي التسوق</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-x py-10 sm:py-14">
      <Link href="/shop" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowRight className="size-4" /> متابعة التسوق
      </Link>
      <h1 className="font-display mt-2 text-5xl text-ink">سلة التسوق <span className="text-3xl text-muted">({count})</span></h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
        <section aria-label="القطع في سلتكِ">
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((l) => <CartLineItem key={l.key} line={l} />)}
          </ul>
          <button type="button" className="mt-4 text-xs font-semibold text-muted underline-offset-4 hover:text-danger hover:underline" onClick={clear}>
            إفراغ السلة
          </button>
        </section>

        <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div className="card space-y-6 p-6">
            <h2 className="font-display text-3xl text-ink">الملخص</h2>
            <CouponForm />
            <OrderSummary />
            <Link href="/checkout" className={`btn btn-primary w-full min-h-12 ${blocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocked}>
              <WhatsappIcon className="size-4" /> إتمام الطلب عبر واتساب
            </Link>
            {blocked && <p className="error-text" role="alert">يرجى تعديل القطع المحددة قبل إتمام الطلب.</p>}
            <p className="flex items-start gap-2 text-xs text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" />
              لا يتم أي دفع عبر هذا الموقع. نؤكد طلبكِ والتوصيل وطريقة الدفع معكِ شخصيًا عبر واتساب.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
