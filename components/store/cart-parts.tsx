"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Check, Tag, Trash2, X } from "lucide-react";
import { useCart, type ResolvedLine } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";
import { QuantityControl } from "@/components/ui/quantity";
import { Price, useMoney } from "@/components/ui/price";

export function CartLineItem({ line, compact = false, card = false, onNavigate }: { line: ResolvedLine; compact?: boolean; /** Show as its own rounded panel (cart page). */ card?: boolean; onNavigate?: () => void }) {
  const { setQuantity, remove } = useCart();
  const options = [line.color, line.size].filter(Boolean).join(" · ");
  const overStock = line.maxQuantity > 0 && line.quantity > line.maxQuantity;
  return (
    <li className={`flex gap-3.5 ${card ? "panel p-3" : "py-4"}`}>
      <Link href={line.href} onClick={onNavigate} className="shrink-0" tabIndex={-1} aria-hidden>
        <SmartImage src={line.image} alt="" className={`${compact ? "h-28 w-22" : "h-32 w-24 sm:h-36 sm:w-28"} rounded-2xl`} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={line.href} onClick={onNavigate} className="font-display text-base leading-snug font-bold text-ink hover:text-gold-bright sm:text-lg">
              {line.name}
            </Link>
            {line.kind === "bundle" && <p className="chip mt-1.5 !min-h-6 !bg-gold/15 !text-gold-soft">مجموعة</p>}
            {options && <p className="mt-1 text-xs text-muted">{options}</p>}
          </div>
          <button
            type="button"
            onClick={() => remove(line.key)}
            className="pop icon-btn -mt-1 -me-1 size-10 text-muted hover:bg-danger/10 hover:text-danger"
            aria-label={`إزالة ${line.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <QuantityControl
            size="sm"
            value={line.quantity}
            max={Math.max(1, line.maxQuantity)}
            onChange={(n) => setQuantity(line.key, n)}
            label={`كمية ${line.name}`}
          />
          <Price price={line.lineTotal} compareAt={line.compareAt ? line.compareAt * line.quantity : undefined} size="sm" />
        </div>
        {(!line.available || overStock) && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger" role="alert">
            <AlertCircle className="size-3.5" />
            {!line.available && line.maxQuantity >= line.quantity
              ? line.kind === "bundle" ? "هذه المجموعة غير متوفرة حاليًا. احذفيها من السلة." : "هذه القطعة غير متوفرة حاليًا. احذفيها من السلة."
              : line.maxQuantity === 0 ? "هذه القطعة غير متوفرة حاليًا." : `المتوفر ${line.maxQuantity} فقط. يرجى تقليل الكمية.`}
          </p>
        )}
      </div>
    </li>
  );
}

export function CouponForm() {
  const { data } = useStore();
  const { applyCoupon, coupon, couponCode, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!data.settings.couponsEnabled) return null;
  if (couponCode) {
    const ok = Boolean(coupon?.ok);
    return (
      <div className={`flex animate-fade-up items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-sm ${ok ? "border-success/30 bg-success/10" : "border-gold/40 bg-gold/10"}`}>
        <span className="flex min-w-0 items-center gap-2">
          {ok ? <Check className="size-4 shrink-0 text-success" /> : <AlertCircle className="size-4 shrink-0 text-gold-bright" />}
          <span className="min-w-0">
            <strong className="font-mono font-semibold tracking-wide text-ink">{couponCode}</strong>
            <span className="block text-xs text-muted">{coupon?.message}</span>
          </span>
        </span>
        <button type="button" className="icon-btn size-9 shrink-0" onClick={removeCoupon} aria-label={`إزالة الكود ${couponCode}`}>
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const r = applyCoupon(code);
        setMessage({ ok: r.ok, text: r.message });
        if (r.ok || r.coupon) setCode("");
      }}
      noValidate
    >
      <label htmlFor="coupon" className="label">
        كود الخصم
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="coupon"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setMessage(null);
            }}
            className="field ltr !rounded-full !ps-9 uppercase"
            placeholder="مثال: WELCOME10"
            autoComplete="off"
            aria-invalid={message ? !message.ok : undefined}
            aria-describedby={message ? "coupon-msg" : undefined}
          />
        </div>
        <button type="submit" className="btn btn-primary pop shrink-0" disabled={!code.trim()}>
          تطبيق
        </button>
      </div>
      {message && (
        <p id="coupon-msg" role="status" className={message.ok ? "hint !text-success" : "error-text"}>
          {message.text}
        </p>
      )}
    </form>
  );
}

export function OrderSummary({ className = "" }: { className?: string }) {
  const { subtotal, discount, delivery, total, coupon, lines } = useCart();
  const { data } = useStore();
  const money = useMoney();
  const threshold = data.settings.freeDeliveryThreshold;
  // Free delivery is judged after the discount, so a percent code raises what is still needed.
  const pct = coupon?.ok && coupon.coupon?.type === "percent" && discount > 0 && coupon.coupon.value < 100 ? coupon.coupon.value / 100 : 0;
  const remaining = threshold > 0 && subtotal - discount < threshold ? Math.ceil(pct ? threshold / (1 - pct) - subtotal : threshold - (subtotal - discount)) : 0;
  const freeByCoupon = Boolean(coupon?.ok && coupon.freeDelivery);

  return (
    <dl className={`space-y-2.5 text-sm ${className}`}>
      <div className="flex justify-between">
        <dt className="text-muted">المجموع الفرعي</dt>
        <dd className="font-medium tabular-nums">{money(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-success">
          <dt>الخصم{coupon?.coupon ? ` (${coupon.coupon.code})` : ""}</dt>
          <dd className="font-medium tabular-nums">−{money(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">التوصيل</dt>
        <dd className="font-medium tabular-nums">{lines.length === 0 ? "—" : delivery === 0 ? "مجاني" : money(delivery)}</dd>
      </div>
      {lines.length > 0 && remaining > 0 && !freeByCoupon && (
        <div className="rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs text-muted">
          أضيفي <strong className="text-ink">{money(remaining)}</strong> للحصول على توصيل مجاني.
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-[image:var(--neon)] shadow-[0_0_10px_var(--color-gold)] transition-[width] duration-700" style={{ width: `${Math.min(100, ((subtotal - discount) / threshold) * 100)}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-white/[0.08] pt-3">
        <dt className="font-semibold text-ink">الإجمالي</dt>
        <dd key={total} className="bump font-display text-2xl font-extrabold text-ink tabular-nums">{money(total)}</dd>
      </div>
    </dl>
  );
}
