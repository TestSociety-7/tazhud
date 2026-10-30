"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { CalendarClock, Check, PackageOpen, RefreshCw, Search, Tag, Undo2 } from "lucide-react";
import { PearlArt } from "@/components/ui/empty-state";
import { useStore } from "@/components/providers/store-provider";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { SmartImage } from "@/components/ui/smart-image";
import { useMoney } from "@/components/ui/price";
import { QuantityControl } from "@/components/ui/quantity";
import { buildReturnMessage, LAST_ORDER_KEY, RETURN_REASONS } from "@/lib/returns";
import { whatsappLink } from "@/lib/whatsapp";
import { readMyOrders } from "@/lib/my-orders";
import { dateFormat, daysLabel } from "@/lib/arabic";
import type { OrderLine, ReturnRequest } from "@/lib/types";

type FoundOrder = { number: string; createdAt: string; name: string; lines: (OrderLine & { image: string })[] };

export function ReturnsView() {
  const { data } = useStore();
  const s = data.settings;
  const money = useMoney();
  const uid = useId();
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState<{ order: FoundOrder; days: number; returnDays: number } | null>(null);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [type, setType] = useState<ReturnRequest["type"]>("exchange");
  const [reason, setReason] = useState("");
  const [wish, setWish] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState<ReturnRequest | null>(null);


  const helpLink = whatsappLink(s.whatsappNumber, `السلام عليكم ${s.storeName}، أرغب في إرجاع أو استبدال قطعة من طلبي.`);

  function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (number.trim().length < 4 || phone.replace(/\D/g, "").length < 7) {
      setError("اكتبي رقم الطلب ورقم الهاتف كما في رسالة واتساب.");
      return;
    }
    void find(number, phone);
  }

  async function find(number: string, phone: string) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/returns/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number, phone }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "تعذّر البحث الآن. راسلينا على واتساب.");
        return;
      }
      setFound(json);
      // One piece already ticked when the order has a single line.
      setQty(json.order.lines.length === 1 ? { 0: json.order.lines[0].quantity } : {});
    } catch {
      setError("لا يوجد اتصال. حاولي مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  // Fill in the order chosen in "My orders" (?n=), or the one this phone placed last.
  useEffect(() => {
    try {
      const wanted = new URLSearchParams(location.search).get("n");
      const mine = wanted ? readMyOrders().find((o) => o.number === wanted) : undefined;
      const saved = mine ?? (JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || "null") as { number?: string; phone?: string } | null);
      if (!saved) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading this device's last order after hydration
      setNumber(saved.number ?? "");
      setPhone(saved.phone ?? "");
      // Coming from "My orders": open that order straight away.
      if (mine) void find(mine.number, mine.phone);
    } catch {
      /* storage unavailable: the customer types them */
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const items = Object.entries(qty).filter(([, q]) => q > 0).map(([i, q]) => ({ index: Number(i), quantity: q }));
    if (!items.length) return setError("اختاري قطعة واحدة على الأقل.");
    if (!reason) return setError("اختاري سبب الطلب.");
    setBusy(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: found!.order.number, phone, items, type, reason, wish, notes }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "تعذّر إرسال الطلب. راسلينا على واتساب.");
        return;
      }
      setDone(json.request);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("لا يوجد اتصال. حاولي مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const link = whatsappLink(s.whatsappNumber, buildReturnMessage(done, s));
    return (
      <div className="page-wash container-x dock-space pt-8">
        <div className="glass-card rise mx-auto max-w-xl px-6 py-10 text-center sm:px-12">
          <PearlArt className="success-pop mx-auto">
            <Check className="size-8 text-success" strokeWidth={2.5} />
          </PearlArt>
          <h1 className="font-display mt-2 text-[2.1rem] text-ink">وصلنا طلبكِ</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted" role="status">
            رقم طلب {done.type === "exchange" ? "الاستبدال" : "الإرجاع"} <strong className="ltr font-latin inline-block text-ink">{done.number}</strong>. سنتواصل معكِ على واتساب لترتيب استلام القطع.
          </p>
          <ol className="rise mx-auto mt-8 max-w-sm space-y-3 text-start text-sm text-text">
            <li className="flex gap-3"><span className="font-latin grid size-6 shrink-0 place-items-center rounded-full bg-forest text-xs text-ivory">1</span>أرسلي الطلب على واتساب، ويمكنكِ إضافة صور للقطعة.</li>
            <li className="flex gap-3"><span className="font-latin grid size-6 shrink-0 place-items-center rounded-full bg-forest text-xs text-ivory">2</span>جهّزي القطع غير مستخدمة ومعها بطاقاتها.</li>
            <li className="flex gap-3"><span className="font-latin grid size-6 shrink-0 place-items-center rounded-full bg-forest text-xs text-ivory">3</span>نرتب معكِ الاستلام، ثم {done.type === "exchange" ? "نرسل لكِ القطعة البديلة" : "نعيد لكِ المبلغ"}.</li>
          </ol>
          <div className="mt-8 grid gap-3">
            <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp press min-h-13 text-base">
              <WhatsappIcon className="size-5" /> أرسلي الطلب على واتساب
            </a>
            <Link href="/shop" className="btn btn-ghost press text-forest">العودة إلى المتجر</Link>
          </div>
        </div>
      </div>
    );
  }

  const chosen = Object.values(qty).reduce((n, q) => n + q, 0);
  const late = found && found.days > found.returnDays;

  return (
    <div className="page-wash dock-space">
    <div className="container-x max-w-3xl pt-8 sm:pt-14">
      <p className="eyebrow text-gold-deep">المساعدة</p>
      <h1 className="season-title font-display mt-2 text-[2.6rem] leading-tight text-ink sm:text-5xl">إرجاع أو استبدال</h1>
      <p className="mt-2 text-sm text-muted">اختاري القطع من طلبكِ وسنرتب كل شيء معكِ على واتساب.</p>

      <ul className="rise mt-6 grid gap-2.5 sm:grid-cols-3">
        {[
          { icon: CalendarClock, text: `خلال ${daysLabel(s.returnDays)} من الاستلام` },
          { icon: Tag, text: "القطع غير مستخدمة ومعها بطاقاتها" },
          { icon: PackageOpen, text: "نرتب استلام القطع من عندكِ" },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="glass-card flex items-center gap-3 !rounded-2xl p-3 text-sm text-text">
            <span className="pearl-orb !size-10 shrink-0 text-forest"><Icon className="size-4" /></span>
            {text}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        الطرح والبونيهات لا تُرجع لأسباب صحية إلا إذا كان فيها عيب. <Link href="/policies#pol-returns" className="underline underline-offset-4">السياسة كاملة</Link>
      </p>

      {!found ? (
        <form onSubmit={lookup} noValidate className="glass-card rise mt-8 space-y-5 p-5 sm:p-8">
          <p className="flex items-center gap-3 font-display text-[1.75rem] text-ink"><span className="index-num">01</span> ابحثي عن طلبكِ</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-n`} className="label">رقم الطلب</label>
              <input id={`${uid}-n`} className="field ltr font-latin text-start" dir="ltr" placeholder="TZ-261029-1234" autoCapitalize="characters" value={number} onChange={(e) => setNumber(e.target.value)} />
              <p className="hint">تجدينه في رسالة الطلب على واتساب.</p>
            </div>
            <div>
              <label htmlFor={`${uid}-p`} className="label">رقم الهاتف</label>
              <input id={`${uid}-p`} className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="+972 50 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <p className="hint">الرقم الذي طلبتِ به.</p>
            </div>
          </div>
          {error && <p className="error-text" role="alert">{error}</p>}
          <button type="submit" className="press btn btn-primary min-h-12 w-full" disabled={busy}>
            <Search className="size-4" /> {busy ? "جارٍ البحث…" : "ابحثي عن طلبي"}
          </button>
          <p className="text-center text-xs text-muted">
            لا تجدين رقم الطلب؟{" "}
            <a href={helpLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest underline underline-offset-4">راسلينا على واتساب</a>
          </p>
        </form>
      ) : (
        <form onSubmit={submit} noValidate className="rise mt-8 space-y-4">
          <div className="on-dark flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] bg-[radial-gradient(120%_120%_at_85%_0%,var(--color-forest-2),var(--color-ink)_70%)] p-5 text-ivory shadow-[var(--shadow-lift)]">
            <div>
              <p className="text-xs text-ivory/60">طلب {found.order.name}</p>
              <p className="ltr font-latin pearl-text text-start text-lg font-bold" dir="ltr">{found.order.number}</p>
              <p className="text-xs text-ivory/60">{dateFormat(found.order.createdAt)}</p>
            </div>
            <button type="button" className="btn btn-sm btn-glass press" onClick={() => { setFound(null); setError(""); }}>طلب آخر</button>
          </div>

          {late && (
            <p className="rounded-2xl bg-gold/10 p-4 text-sm text-text ring-1 ring-inset ring-gold/35" role="status">
              مرّ {daysLabel(found.days)} على طلبكِ ومدة الإرجاع {daysLabel(found.returnDays)}. يمكنكِ إرسال الطلب وسنراجعه معكِ.
            </p>
          )}

          <fieldset className="glass-card p-5 sm:p-6">
            <legend className="sr-only">القطع</legend>
            <p aria-hidden className="flex items-center gap-3 font-display text-2xl text-ink"><span className="index-num">02</span> أي القطع؟</p>
            <ul className="mt-4 divide-y divide-line/70">
              {found.order.lines.map((l, i) => {
                const q = qty[i] ?? 0;
                return (
                  <li key={i} className="flex items-center gap-3 py-3">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input type="checkbox" className="size-5 shrink-0 accent-[var(--color-forest)]" checked={q > 0} onChange={(e) => setQty((x) => ({ ...x, [i]: e.target.checked ? l.quantity : 0 }))} />
                      <SmartImage src={l.image} alt="" className={`leaf h-18 w-14 shrink-0 shadow-[var(--shadow-soft)] transition-transform duration-500 ease-[var(--ease-spring)] ${q > 0 ? "scale-105" : "opacity-80"}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{l.name}</span>
                        <span className="block truncate text-xs text-muted">{[l.color, l.size].filter(Boolean).join(" · ")}{l.quantity > 1 ? ` · طلبتِ ${l.quantity}` : ""}</span>
                        <span className="font-latin block text-xs text-muted">{money(l.unitPrice)}</span>
                      </span>
                    </label>
                    {q > 0 && l.quantity > 1 && <QuantityControl size="sm" value={q} min={1} max={l.quantity} onChange={(v) => setQty((x) => ({ ...x, [i]: v }))} label={`عدد ${l.name}`} />}
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <fieldset className="glass-card space-y-5 p-5 sm:p-6">
            <legend className="sr-only">نوع الطلب والسبب</legend>
            <p aria-hidden className="flex items-center gap-3 font-display text-2xl text-ink"><span className="index-num">03</span> ماذا تفضّلين؟</p>
            <div role="radiogroup" aria-label="نوع الطلب" className="grid grid-cols-2 gap-3">
              {([
                ["exchange", "استبدال", "مقاس أو لون آخر", RefreshCw],
                ["refund", "إرجاع", "واسترداد المبلغ", Undo2],
              ] as const).map(([id, title, note, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={type === id}
                  onClick={() => setType(id)}
                  className={`press flex items-center gap-3 rounded-2xl p-3 text-start transition-[background-color,box-shadow] duration-300 ${type === id ? "bg-paper shadow-[inset_0_0_0_2px_var(--color-forest),0_12px_24px_-16px_rgb(35_42_92/0.6)]" : "bg-paper/60 shadow-[inset_0_0_0_1px_var(--color-line)]"}`}
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full transition-transform duration-500 ease-[var(--ease-spring)] ${type === id ? "scale-110 bg-forest text-ivory" : "bg-sand text-forest"}`}><Icon className="size-5" /></span>
                  <span>
                    <span className="block font-semibold text-ink">{title}</span>
                    <span className="block text-xs text-muted">{note}</span>
                  </span>
                </button>
              ))}
            </div>

            <div>
              <p className="label" id={`${uid}-r`}>السبب</p>
              <div role="radiogroup" aria-labelledby={`${uid}-r`} className="flex flex-wrap gap-2">
                {RETURN_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={reason === r}
                    onClick={() => setReason(r)}
                    className="chip"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {type === "exchange" && (
              <div>
                <label htmlFor={`${uid}-w`} className="label">ماذا تريدين بدلها؟</label>
                <input id={`${uid}-w`} className="field" maxLength={200} placeholder="مثلًا: نفس العباية بمقاس L" value={wish} onChange={(e) => setWish(e.target.value)} />
              </div>
            )}
            <div>
              <label htmlFor={`${uid}-x`} className="label">ملاحظات (اختياري)</label>
              <textarea id={`${uid}-x`} className="field" rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </fieldset>

          {error && <p className="error-text" role="alert">{error}</p>}
          <button type="submit" className="press btn btn-primary min-h-14 w-full text-base" disabled={busy}>
            {busy ? "جارٍ الإرسال…" : chosen ? `أرسلي طلب ${type === "exchange" ? "الاستبدال" : "الإرجاع"} · ${chosen} ${chosen === 1 ? "قطعة" : "قطع"}` : "أرسلي الطلب"}
          </button>
        </form>
      )}
    </div>
    </div>
  );
}
