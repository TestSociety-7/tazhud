"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { buildOrderMessage, isValidWhatsappNumber, whatsappLink } from "@/lib/whatsapp";
import { newId } from "@/lib/commerce";
import type { OrderInquiry } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { Mandala } from "@/components/ui/mandala";
import { useMoney } from "@/components/ui/price";
import { CouponForm, OrderSummary } from "./cart-parts";

type Fields = { name: string; phone: string; address: string; city: string; notes: string };
type Errors = Partial<Record<keyof Fields, string>>;

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Please enter your full name.";
  const digits = f.phone.replace(/\D/g, "");
  if (!PHONE_RE.test(f.phone.trim()) || digits.length < 7 || digits.length > 15) e.phone = "Please enter a valid phone number, including country code if outside your country.";
  if (f.address.trim().length < 6) e.address = "Please enter your full delivery address.";
  if (f.city.trim().length < 2) e.city = "Please enter your city or area.";
  if (f.notes.length > 500) e.notes = "Please keep notes under 500 characters.";
  return e;
}

function Field({
  id, label, error, hint, children,
}: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error ? <p id={`${id}-err`} className="error-text" role="alert">{error}</p> : hint ? <p id={`${id}-hint`} className="hint">{hint}</p> : null}
    </div>
  );
}

export function CheckoutView() {
  const { data, update } = useStore();
  const cart = useCart();
  const money = useMoney();
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState<Fields>({ name: "", phone: "", address: "", city: "", notes: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{ order: OrderInquiry; link: string } | null>(null);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const storeNumberOk = isValidWhatsappNumber(data.settings.whatsappNumber);
  const blocked = cart.lines.some((l) => !l.available);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(fields);
    setErrors(errs);
    const firstKey = (Object.keys(errs) as (keyof Fields)[])[0];
    if (firstKey) {
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(`${uid}-${firstKey}`)}`)?.focus();
      return;
    }
    if (blocked || cart.lines.length === 0) return;

    setSubmitting(true);
    const seq = data.orderSequence + 1;
    const order: OrderInquiry = {
      id: newId("ord"),
      number: `TZ-${seq}`,
      createdAt: new Date().toISOString(),
      status: "new",
      customer: {
        name: fields.name.trim(),
        phone: fields.phone.trim(),
        address: fields.address.trim(),
        city: fields.city.trim(),
        notes: fields.notes.trim(),
      },
      lines: cart.lines.map((l) => ({
        kind: l.kind,
        refId: l.refId,
        name: l.name,
        color: l.color,
        size: l.size,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
      subtotal: cart.subtotal,
      discount: cart.discount,
      delivery: cart.delivery,
      total: cart.total,
      couponCode: cart.coupon?.ok && cart.coupon.coupon ? cart.coupon.coupon.code : "",
      currency: data.settings.currency,
      adminNote: "",
    };
    const link = whatsappLink(data.settings.whatsappNumber, buildOrderMessage(order, data.settings));

    // Open WhatsApp synchronously inside the click so popup blockers allow it.
    const win = window.open(link, "_blank");
    if (win) win.opener = null;

    const res = await update((d) => ({ ...d, orders: [order, ...d.orders], orderSequence: seq }));
    if (!res.ok) toast.warning("Your WhatsApp message is ready, but we couldn't save a copy in this browser.");
    cart.clear();
    setSent({ order, link });
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (sent) {
    return (
      <div className="container-x py-14">
        <div className="card relative mx-auto max-w-xl overflow-hidden px-6 py-12 text-center sm:px-12">
          <Mandala className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 text-gold/25" />
          <CheckCircle2 className="relative mx-auto size-12 text-success" />
          <h1 className="font-display relative mt-4 text-4xl text-ink">Almost done, {sent.order.customer.name.split(" ")[0]}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted" role="status">
            Your order <strong className="text-ink">{sent.order.number}</strong> has been prepared as a WhatsApp message. Press <strong>send</strong> in WhatsApp to place it, and we&apos;ll confirm availability, delivery and payment with you.
          </p>
          <p className="font-display mt-6 text-3xl text-ink">{money(sent.order.total)}</p>
          <div className="mt-8 grid gap-3">
            <a href={sent.link} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp min-h-12">
              <WhatsappIcon className="size-5" /> Open WhatsApp to send
            </a>
            <Link href="/shop" className="btn btn-ghost">Continue shopping</Link>
          </div>
          <p className="mt-6 text-xs text-muted">WhatsApp didn&apos;t open? Use the button above, or message us on +{data.settings.whatsappNumber} with your order number.</p>
        </div>
      </div>
    );
  }

  if (!cart.hydrated) {
    return <div className="container-x py-16"><div className="skeleton h-96 rounded-2xl" aria-busy="true" /></div>;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="container-x py-16">
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title="Nothing to check out yet"
          body="Add a few pieces to your bag first."
          action={<Link href="/shop" className="btn btn-primary">Browse the collection</Link>}
        />
      </div>
    );
  }

  const fid = (k: keyof Fields) => `${uid}-${k}`;
  const describedBy = (k: keyof Fields, hint?: boolean) => (errors[k] ? `${fid(k)}-err` : hint ? `${fid(k)}-hint` : undefined);

  return (
    <div className="container-x py-10 sm:py-14">
      <Link href="/cart" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to bag
      </Link>
      <h1 className="font-display mt-2 text-5xl text-ink">Checkout</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Fill in your delivery details. When you continue, WhatsApp opens with your order written out, ready to send. We confirm everything personally. No payment is taken on this site.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_26rem] lg:gap-14">
        <form ref={formRef} onSubmit={submit} noValidate className="space-y-6" aria-describedby={`${uid}-form-note`}>
          <fieldset className="card space-y-5 p-6 sm:p-8">
            <legend className="sr-only">Your details</legend>
            <p aria-hidden className="font-display text-3xl text-ink">Your details</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id={fid("name")} label="Full name" error={errors.name}>
                <input id={fid("name")} className="field" autoComplete="name" value={fields.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} required />
              </Field>
              <Field id={fid("phone")} label="Phone (WhatsApp)" error={errors.phone} hint="We'll confirm your order on this number.">
                <input id={fid("phone")} className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="+1 555 010 1234" value={fields.phone} onChange={set("phone")} aria-invalid={!!errors.phone} aria-describedby={describedBy("phone", true)} required />
              </Field>
            </div>
            <Field id={fid("address")} label="Delivery address" error={errors.address}>
              <input id={fid("address")} className="field" autoComplete="street-address" placeholder="House, street, building, apartment" value={fields.address} onChange={set("address")} aria-invalid={!!errors.address} aria-describedby={describedBy("address")} required />
            </Field>
            <Field id={fid("city")} label="City / area" error={errors.city}>
              <input id={fid("city")} className="field" autoComplete="address-level2" value={fields.city} onChange={set("city")} aria-invalid={!!errors.city} aria-describedby={describedBy("city")} required />
            </Field>
            <Field id={fid("notes")} label="Order notes (optional)" error={errors.notes} hint="Colour preferences for bundles, delivery timing, gift wrap…">
              <textarea id={fid("notes")} className="field" rows={4} maxLength={500} value={fields.notes} onChange={set("notes")} aria-invalid={!!errors.notes} aria-describedby={describedBy("notes", true)} />
            </Field>
          </fieldset>

          {!storeNumberOk && (
            <p className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger" role="alert">
              The store&apos;s WhatsApp number isn&apos;t set up correctly yet, so orders can&apos;t be sent. Please try again later.
            </p>
          )}

          <button type="submit" className="btn btn-whatsapp min-h-14 w-full text-base" disabled={submitting || blocked || !storeNumberOk}>
            <WhatsappIcon className="size-5" />
            {submitting ? "Preparing your message…" : `Send order on WhatsApp · ${money(cart.total)}`}
          </button>
          <p id={`${uid}-form-note`} className="text-center text-xs text-muted">
            By continuing you&apos;ll open WhatsApp with your order. Nothing is charged here.
          </p>
        </form>

        <aside aria-label="Order summary" className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div className="card space-y-6 p-6">
            <h2 className="font-display text-3xl text-ink">Your order</h2>
            <ul className="space-y-4">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3">
                  <div className="relative">
                    <SmartImage src={l.image} alt="" className="h-20 w-16 rounded-lg" />
                    <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-ink text-[0.7rem] font-bold text-ivory">{l.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                    <p className="truncate text-xs text-muted">{[l.color, l.size].filter(Boolean).join(" · ") || (l.kind === "bundle" ? "Bundle" : "")}</p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">{money(l.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <CouponForm />
            <OrderSummary />
          </div>
        </aside>
      </div>
    </div>
  );
}
