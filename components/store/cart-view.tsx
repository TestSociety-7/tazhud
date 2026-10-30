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
      <div className="container-x py-10" aria-busy="true">
        <div className="skeleton h-12 w-56 rounded-full" />
        <div className="skeleton mt-8 h-36 rounded-3xl" />
        <div className="skeleton mt-3 h-36 rounded-3xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-x py-16 actionbar-pad">
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
    <div className="container-x actionbar-pad pt-5 sm:pt-12">
      <Link href="/shop" className="pop inline-flex min-h-10 items-center gap-2 rounded-full bg-white/[0.06] ps-3 pe-4 text-sm font-semibold text-text hover:text-ink">
        <ArrowRight className="size-4" /> متابعة التسوق
      </Link>
      <h1 className="season-title reel-title mt-4 flex items-center gap-3 text-[2.6rem] sm:text-6xl">سلة التسوق <span key={count} className="count-pill bump !h-9 !min-w-9 !text-base">{count}</span></h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-14">
        <section aria-label="القطع في سلتكِ">
          <ul className="stagger space-y-3">
            {lines.map((l) => <CartLineItem key={l.key} line={l} card />)}
          </ul>
          <button type="button" className="mt-4 min-h-10 text-xs font-semibold text-muted underline-offset-4 hover:text-danger hover:underline" onClick={clear}>
            إفراغ السلة
          </button>
        </section>

        <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div className="panel space-y-6 p-5 sm:p-6">
            <h2 className="reel-title text-2xl">الملخص</h2>
            <CouponForm />
            <OrderSummary />
            <Link href="/checkout" className={`btn btn-neon pop hidden min-h-13 w-full text-base lg:flex ${blocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocked}>
              <WhatsappIcon className="size-4" /> إتمام الطلب عبر واتساب
            </Link>
            {blocked && <p className="error-text" role="alert">يرجى تعديل القطع المحددة قبل إتمام الطلب.</p>}
            <p className="flex items-start gap-2 text-xs text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
              لا يتم أي دفع عبر هذا الموقع. نؤكد طلبكِ والتوصيل وطريقة الدفع معكِ شخصيًا عبر واتساب.
            </p>
          </div>
        </aside>
      </div>

      {/* Phones: the total and the next step stay in the thumb zone. */}
      <div className="action-bar lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted">الإجمالي</p>
            <p key={total} className="bump font-display text-xl font-extrabold text-ink tabular-nums">{money(total)}</p>
          </div>
          <Link href="/checkout" className={`btn btn-neon pop min-h-12 flex-1 text-base ${blocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocked}>
            <WhatsappIcon className="size-4" /> إتمام الطلب عبر واتساب
          </Link>
        </div>
      </div>
    </div>
  );
}
