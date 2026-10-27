"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Check, Tag, Trash2, X } from "lucide-react";
import { useCart, type ResolvedLine } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";
import { QuantityControl } from "@/components/ui/quantity";
import { Price, useMoney } from "@/components/ui/price";

export function CartLineItem({ line, compact = false, onNavigate }: { line: ResolvedLine; compact?: boolean; onNavigate?: () => void }) {
  const { setQuantity, remove } = useCart();
  const options = [line.color, line.size].filter(Boolean).join(" · ");
  const overStock = line.maxQuantity > 0 && line.quantity > line.maxQuantity;
  return (
    <li className="flex gap-4 py-5">
      <Link href={line.href} onClick={onNavigate} className="shrink-0" tabIndex={-1} aria-hidden>
        <SmartImage src={line.image} alt="" className={`${compact ? "h-28 w-22" : "h-36 w-28"} rounded-xl`} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={line.href} onClick={onNavigate} className="font-display text-xl leading-tight text-ink hover:underline">
              {line.name}
            </Link>
            {line.kind === "bundle" && <p className="eyebrow mt-1 text-gold-deep">Bundle</p>}
            {options && <p className="mt-1 text-xs text-muted">{options}</p>}
          </div>
          <button
            type="button"
            onClick={() => remove(line.key)}
            className="icon-btn -mt-2 -mr-2 size-10 text-muted hover:text-danger"
            aria-label={`Remove ${line.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <QuantityControl
            size="sm"
            value={line.quantity}
            max={Math.max(1, line.maxQuantity)}
            onChange={(n) => setQuantity(line.key, n)}
            label={`Quantity for ${line.name}`}
          />
          <Price price={line.lineTotal} compareAt={line.compareAt ? line.compareAt * line.quantity : undefined} size="sm" />
        </div>
        {(!line.available || overStock) && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger" role="alert">
            <AlertCircle className="size-3.5" />
            {line.maxQuantity === 0 ? "This piece is currently unavailable." : `Only ${line.maxQuantity} available. Please reduce the quantity.`}
          </p>
        )}
      </div>
    </li>
  );
}

export function CouponForm() {
  const { applyCoupon, coupon, couponCode, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (couponCode) {
    const ok = Boolean(coupon?.ok);
    return (
      <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm ${ok ? "border-sage bg-sage-soft/60" : "border-[#e2c58f] bg-[#fbf3e2]"}`}>
        <span className="flex min-w-0 items-center gap-2">
          {ok ? <Check className="size-4 shrink-0 text-success" /> : <AlertCircle className="size-4 shrink-0 text-[#855a14]" />}
          <span className="min-w-0">
            <strong className="font-semibold tracking-wide">{couponCode}</strong>
            <span className="block text-xs text-muted">{coupon?.message}</span>
          </span>
        </span>
        <button type="button" className="icon-btn size-9 shrink-0" onClick={removeCoupon} aria-label={`Remove code ${couponCode}`}>
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
        Promo code
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="coupon"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setMessage(null);
            }}
            className="field !pl-9 uppercase"
            placeholder="e.g. WELCOME10"
            autoComplete="off"
            aria-invalid={message ? !message.ok : undefined}
            aria-describedby={message ? "coupon-msg" : undefined}
          />
        </div>
        <button type="submit" className="btn btn-outline shrink-0" disabled={!code.trim()}>
          Apply
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
  const remaining = threshold > 0 ? Math.max(0, threshold - (subtotal - discount)) : 0;
  const freeByCoupon = Boolean(coupon?.ok && coupon.freeDelivery);

  return (
    <dl className={`space-y-2.5 text-sm ${className}`}>
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd className="font-medium tabular-nums">{money(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-success">
          <dt>Discount{coupon?.coupon ? ` (${coupon.coupon.code})` : ""}</dt>
          <dd className="font-medium tabular-nums">−{money(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">Delivery</dt>
        <dd className="font-medium tabular-nums">{lines.length === 0 ? "—" : delivery === 0 ? "Free" : money(delivery)}</dd>
      </div>
      {lines.length > 0 && remaining > 0 && !freeByCoupon && (
        <div className="rounded-lg bg-sand px-3 py-2 text-xs text-muted">
          Add <strong className="text-ink">{money(remaining)}</strong> more for free delivery.
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${Math.min(100, ((subtotal - discount) / threshold) * 100)}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-semibold text-ink">Total</dt>
        <dd className="font-display text-3xl text-ink tabular-nums">{money(total)}</dd>
      </div>
    </dl>
  );
}
