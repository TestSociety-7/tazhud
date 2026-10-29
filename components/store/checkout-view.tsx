"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Plus, RefreshCw, ShieldCheck, ShoppingBag, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { buildOrderMessage, isValidWhatsappNumber, whatsappLink } from "@/lib/whatsapp";
import { newId, newOrderNumber } from "@/lib/commerce";
import { piecesLabel } from "@/lib/arabic";
import type { OrderInquiry } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { useMoney } from "@/components/ui/price";
import { CouponForm, OrderSummary } from "./cart-parts";
import { LAST_ORDER_KEY } from "@/lib/returns";

/** Delivery details kept on this phone (only if the customer agrees) to fill the form next time. */
const DETAILS_KEY = "tz-checkout-details";

type Fields = { name: string; phone: string; address: string; city: string; notes: string };
type Errors = Partial<Record<keyof Fields, string>>;

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "يرجى إدخال الاسم الكامل.";
  const digits = f.phone.replace(/\D/g, "");
  if (!PHONE_RE.test(f.phone.trim()) || digits.length < 7 || digits.length > 15) e.phone = "يرجى إدخال رقم هاتف صحيح مع رمز الدولة إن كنتِ خارج البلد.";
  if (f.address.trim().length < 6) e.address = "يرجى إدخال عنوان التوصيل كاملًا.";
  if (f.city.trim().length < 2) e.city = "يرجى إدخال المدينة أو المنطقة.";
  if (f.notes.length > 500) e.notes = "يرجى ألا تتجاوز الملاحظات 500 حرف.";
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
  const [remember, setRemember] = useState(true);
  const [showNotes, setShowNotes] = useState(false);

  // Fill in the details saved on this device last time.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) || "null") as Partial<Fields> | null;
      if (!saved) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading saved details after hydration
      setFields((f) => ({ ...f, name: saved.name ?? "", phone: saved.phone ?? "", address: saved.address ?? "", city: saved.city ?? "" }));
    } catch {
      /* storage unavailable */
    }
  }, []);

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
    const order: OrderInquiry = {
      id: newId("ord"),
      number: newOrderNumber(),
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

    try {
      if (remember) localStorage.setItem(DETAILS_KEY, JSON.stringify({ name: order.customer.name, phone: order.customer.phone, address: order.customer.address, city: order.customer.city }));
      else localStorage.removeItem(DETAILS_KEY);
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ number: order.number, phone: order.customer.phone }));
    } catch {
      /* storage unavailable: nothing to remember */
    }

    const res = await update((d) => ({ ...d, orders: [order, ...d.orders] }));
    if (!res.ok) toast.warning("رسالة واتساب جاهزة، لكن تعذّر حفظ نسخة من الطلب. أرسلي الرسالة لإتمام طلبكِ.");
    cart.clear();
    setSent({ order, link });
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (sent) {
    return (
      <div className="container-x py-14">
        <div className="card relative mx-auto max-w-xl overflow-hidden px-6 py-12 text-center sm:px-12">
          <CheckCircle2 className="relative mx-auto size-12 text-success" />
          <h1 className="font-display relative mt-4 text-4xl text-ink">بقيت خطوة واحدة يا {sent.order.customer.name.split(" ")[0]}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted" role="status">
            تم تجهيز طلبكِ <strong className="text-ink ltr inline-block">{sent.order.number}</strong> كرسالة واتساب. اضغطي <strong>إرسال</strong> في واتساب لإتمامه، وسنؤكد معكِ التوفر والتوصيل وطريقة الدفع.
          </p>
          <p className="font-display mt-6 text-3xl text-ink">{money(sent.order.total)}</p>
          <div className="mt-8 grid gap-3">
            <a href={sent.link} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp min-h-12">
              <WhatsappIcon className="size-5" /> افتحي واتساب للإرسال
            </a>
            <Link href="/shop" className="btn btn-ghost">متابعة التسوق</Link>
          </div>
          <p className="mt-6 text-xs text-muted">
            احتفظي برقم الطلب. إذا احتجتِ لاحقًا إلى إرجاع أو استبدال قطعة، <Link href="/returns" className="font-semibold text-forest underline underline-offset-4">من هنا</Link>.
          </p>
          <p className="mt-6 text-xs text-muted">لم يفتح واتساب؟ استخدمي الزر أعلاه، أو راسلينا على <span className="ltr inline-block">+{data.settings.whatsappNumber}</span> مع رقم طلبكِ.</p>
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
          as="h1"
          icon={<ShoppingBag className="size-6" />}
          title="لا يوجد ما يمكن طلبه بعد"
          body="أضيفي بعض القطع إلى سلتكِ أولًا."
          action={<Link href="/shop" className="btn btn-primary">تصفّحي المجموعة</Link>}
        />
      </div>
    );
  }

  const fid = (k: keyof Fields) => `${uid}-${k}`;
  const describedBy = (k: keyof Fields, hint?: boolean) => (errors[k] ? `${fid(k)}-err` : hint ? `${fid(k)}-hint` : undefined);

  return (
    <div className="container-x py-10 sm:py-14">
      <Link href="/cart" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowRight className="size-4" /> العودة إلى السلة
      </Link>
      <h1 className="season-title font-display mt-2 text-5xl text-ink">إتمام الطلب</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        املئي بيانات التوصيل. عند المتابعة سيفتح واتساب وفيه طلبكِ مكتوبًا وجاهزًا للإرسال، ثم نؤكد كل التفاصيل معكِ شخصيًا. لا يتم أي دفع عبر هذا الموقع.
      </p>

      {/* On phones the order sits below the form, so a short summary comes first. */}
      <details className="card group mt-6 overflow-hidden lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
          <span className="flex -space-x-3 rtl:space-x-reverse">
            {cart.lines.slice(0, 3).map((l) => (
              <SmartImage key={l.key} src={l.image} alt="" className="size-9 rounded-full ring-2 ring-paper" />
            ))}
          </span>
          <span className="flex-1 text-sm text-text">
            {piecesLabel(cart.lines.reduce((n, l) => n + l.quantity, 0))} في طلبكِ
          </span>
          <strong className="tabular-nums text-ink">{money(cart.total)}</strong>
          <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="space-y-3 border-t border-line px-4 py-4">
          {cart.lines.map((l) => (
            <li key={l.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{l.quantity} × {l.name}{l.size ? ` · ${l.size}` : ""}</span>
              <span className="tabular-nums">{money(l.lineTotal)}</span>
            </li>
          ))}
          <li><Link href="/cart" className="text-xs font-semibold text-forest underline underline-offset-4">تعديل السلة</Link></li>
        </ul>
      </details>

      <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[1fr_26rem] lg:gap-14">
        <form ref={formRef} onSubmit={submit} noValidate className="space-y-6" aria-describedby={`${uid}-form-note`}>
          <fieldset className="card space-y-5 p-6 sm:p-8">
            <legend className="sr-only">بياناتكِ</legend>
            <p aria-hidden className="font-display text-3xl text-ink">بياناتكِ</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id={fid("name")} label="الاسم الكامل" error={errors.name}>
                <input id={fid("name")} className="field" autoComplete="name" value={fields.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} required />
              </Field>
              <Field id={fid("phone")} label="رقم الهاتف (واتساب)" error={errors.phone} hint="سنؤكد طلبكِ على هذا الرقم.">
                <input id={fid("phone")} className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="+972 50 123 4567" value={fields.phone} onChange={set("phone")} aria-invalid={!!errors.phone} aria-describedby={describedBy("phone", true)} required />
              </Field>
            </div>
            <Field id={fid("address")} label="عنوان التوصيل" error={errors.address}>
              <input id={fid("address")} className="field" autoComplete="street-address" placeholder="المنطقة، الشارع، البناية، الشقة" value={fields.address} onChange={set("address")} aria-invalid={!!errors.address} aria-describedby={describedBy("address")} required />
            </Field>
            <Field id={fid("city")} label="المدينة / المنطقة" error={errors.city}>
              <input id={fid("city")} className="field" autoComplete="address-level2" value={fields.city} onChange={set("city")} aria-invalid={!!errors.city} aria-describedby={describedBy("city")} required />
            </Field>
            {showNotes || fields.notes || errors.notes ? (
              <Field id={fid("notes")} label="ملاحظات الطلب (اختياري)" error={errors.notes} hint="وقت التوصيل المناسب، تغليف هدية…">
                <textarea id={fid("notes")} className="field" rows={3} maxLength={500} value={fields.notes} onChange={set("notes")} aria-invalid={!!errors.notes} aria-describedby={describedBy("notes", true)} autoFocus={showNotes && !fields.notes} />
              </Field>
            ) : (
              <button type="button" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-forest" onClick={() => setShowNotes(true)}>
                <Plus className="size-4" /> إضافة ملاحظة للطلب
              </button>
            )}
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
              <input type="checkbox" className="size-4 accent-[var(--color-forest)]" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              تذكّري بياناتي على هذا الجهاز للطلب القادم
            </label>
          </fieldset>

          {!storeNumberOk && (
            <p className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger" role="alert">
              رقم واتساب المتجر غير مضبوط بعد، لذلك لا يمكن إرسال الطلبات حاليًا. يرجى المحاولة لاحقًا.
            </p>
          )}

          <button type="submit" className="btn btn-whatsapp min-h-14 w-full text-base" disabled={submitting || blocked || !storeNumberOk}>
            <WhatsappIcon className="size-5" />
            {submitting ? "جارٍ تجهيز رسالتكِ…" : `أرسلي الطلب عبر واتساب · ${money(cart.total)}`}
          </button>
          <p id={`${uid}-form-note`} className="text-center text-xs text-muted">
            بالمتابعة سيفتح واتساب وفيه طلبكِ. لن يُخصم أي مبلغ هنا.
          </p>
          <ul className="grid grid-cols-3 gap-2 text-center text-[0.7rem] leading-snug text-muted">
            <li className="flex flex-col items-center gap-1"><Wallet className="size-4 text-forest" />لا دفع الآن</li>
            <li className="flex flex-col items-center gap-1"><ShieldCheck className="size-4 text-forest" />نؤكد معكِ قبل التوصيل</li>
            <li className="flex flex-col items-center gap-1"><RefreshCw className="size-4 text-forest" />إرجاع أو استبدال خلال {data.settings.returnDays} أيام</li>
          </ul>
        </form>

        <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div className="card space-y-6 p-6">
            <h2 className="font-display text-3xl text-ink">طلبكِ</h2>
            <ul className="space-y-4">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3">
                  <div className="relative">
                    <SmartImage src={l.image} alt="" className="h-20 w-16 rounded-lg" />
                    <span className="absolute -top-2 -end-2 grid size-6 place-items-center rounded-full bg-ink text-[0.7rem] font-bold text-ivory">{l.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                    <p className="truncate text-xs text-muted">{[l.color, l.size].filter(Boolean).join(" · ") || (l.kind === "bundle" ? "مجموعة" : "")}</p>
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
