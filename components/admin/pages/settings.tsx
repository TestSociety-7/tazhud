"use client";

import { useRef, useState } from "react";
import { Download, ExternalLink, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney } from "@/lib/commerce";
import { normalizeStoreData } from "@/lib/repository";
import { itemsLabel } from "@/lib/arabic";
import { PLACEHOLDER_WHATSAPP } from "@/lib/seed";
import { isValidWhatsappNumber, normalizeWhatsappNumber, whatsappLink } from "@/lib/whatsapp";
import type { StoreSettings } from "@/lib/types";
import { ConfirmDialog, FormField, PageHeader, Panel } from "../ui";
import { useSave } from "../use-save";
import { SaveBar, useDraft } from "../use-draft";

const CURRENCIES: [string, string][] = [
  ["SAR", "ريال سعودي"], ["AED", "درهم إماراتي"], ["QAR", "ريال قطري"], ["KWD", "دينار كويتي"], ["BHD", "دينار بحريني"], ["OMR", "ريال عماني"],
  ["JOD", "دينار أردني"], ["EGP", "جنيه مصري"], ["IQD", "دينار عراقي"], ["LBP", "ليرة لبنانية"], ["MAD", "درهم مغربي"], ["TND", "دينار تونسي"], ["DZD", "دينار جزائري"], ["LYD", "دينار ليبي"],
  ["USD", "دولار أمريكي"], ["EUR", "يورو"], ["GBP", "جنيه إسترليني"], ["TRY", "ليرة تركية"], ["CAD", "دولار كندي"], ["AUD", "دولار أسترالي"], ["MYR", "رينغيت ماليزي"],
];
const LOCALES: [string, string][] = [["ar-u-nu-latn", "عربي بأرقام 123"], ["ar", "عربي بأرقام ١٢٣"], ["en-US", "إنجليزي"]];

type Errors = Partial<Record<"storeName" | "whatsappNumber" | "instagramUrl" | "email" | "deliveryFee" | "freeDeliveryThreshold" | "lowStockThreshold", string>>;

function validate(s: StoreSettings): Errors {
  const e: Errors = {};
  if (!s.storeName.trim()) e.storeName = "اكتب اسم المتجر.";
  if (!isValidWhatsappNumber(s.whatsappNumber)) e.whatsappNumber = "اكتب الرقم كاملًا مع رمز الدولة، مثل ‎+966 50 123 4567.";
  if (s.instagramUrl && !/^https:\/\/(www\.)?instagram\.com\/[^\s]+$/i.test(s.instagramUrl.trim())) e.instagramUrl = "اكتب الرابط كاملًا مثل https://www.instagram.com/tazhudd/";
  if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) e.email = "اكتب بريدًا صحيحًا أو اتركه فارغًا.";
  if (!(s.deliveryFee >= 0)) e.deliveryFee = "اكتب 0 أو أكثر.";
  if (!(s.freeDeliveryThreshold >= 0)) e.freeDeliveryThreshold = "اكتب 0 أو أكثر.";
  if (!Number.isInteger(s.lowStockThreshold) || s.lowStockThreshold < 0) e.lowStockThreshold = "اكتب رقمًا صحيحًا.";
  return e;
}

export function SettingsPage() {
  const { data, resetToDemo, storageLabel, isLocalOnly, update } = useStore();
  const save = useSave();
  const { draft, setDraft, dirty, discard, markSaved } = useDraft((d) => d.settings);
  const s = draft as StoreSettings;
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => {
    setDraft({ ...s, [k]: v });
    if (k in errors) setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(s);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`s-${first}`)?.focus();
      toast.error("يرجى تصحيح الحقول المظلّلة");
      return;
    }
    setSaving(true);
    const clean: StoreSettings = { ...s, whatsappNumber: normalizeWhatsappNumber(s.whatsappNumber), instagramUrl: s.instagramUrl.trim() };
    if (await save((d) => ({ ...d, settings: clean }), "تم حفظ إعدادات المتجر")) markSaved(clean);
    setSaving(false);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tazhud-store-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("تم تصدير بيانات المتجر");
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.version !== 1 || !Array.isArray(parsed.products)) throw new Error("هذا الملف ليس نسخة من بيانات متجر تزهّد.");
      const imported = normalizeStoreData(parsed);
      // In shared mode, keep real customer orders and subscribers; only the catalogue is replaced.
      const res = await update((d) => (isLocalOnly ? imported : { ...imported, orders: d.orders, subscribers: d.subscribers, orderSequence: d.orderSequence }));
      if (!res.ok) throw new Error(res.error);
      toast.success("تم استيراد البيانات", { description: `تم تحميل ${itemsLabel(parsed.products.length)}.` });
    } catch (err) {
      toast.error("فشل الاستيراد", { description: err instanceof Error ? err.message : "تعذّرت قراءة الملف" });
    }
  }

  const placeholderNumber = normalizeWhatsappNumber(s.whatsappNumber) === PLACEHOLDER_WHATSAPP;

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader title="إعدادات المتجر" description="بيانات التواصل، الطلب عبر واتساب، العملة، التوصيل والسياسات." />

      <div className="space-y-6">
        <Panel title="بيانات المتجر">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="اسم المتجر" htmlFor="s-storeName" error={errors.storeName}><input id="s-storeName" className="field" value={s.storeName} onChange={(e) => set("storeName", e.target.value)} aria-invalid={!!errors.storeName} /></FormField>
            <FormField label="الشعار النصي" htmlFor="s-tagline"><input id="s-tagline" className="field" value={s.tagline} onChange={(e) => set("tagline", e.target.value)} /></FormField>
            <FormField label="العنوان" htmlFor="s-address"><input id="s-address" className="field" value={s.address} onChange={(e) => set("address", e.target.value)} /></FormField>
            <FormField label="أوقات العمل" htmlFor="s-hours"><input id="s-hours" className="field" value={s.hours} onChange={(e) => set("hours", e.target.value)} /></FormField>
          </div>
        </Panel>

        <section id="contact" className="scroll-mt-24">
          <Panel title="واتساب ووسائل التواصل" description="عند إتمام الطلب يُفتح واتساب برسالة الطلب إلى هذا الرقم.">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="رقم واتساب" htmlFor="s-whatsappNumber" error={errors.whatsappNumber} hint={placeholderNumber ? "هذا رقم تجريبي. ضع رقم واتساب الحقيقي للمتجر." : "مع رمز الدولة. المسافات وعلامة + مقبولة."}>
                <div className="flex gap-2">
                  <input id="s-whatsappNumber" className="field" type="tel" inputMode="tel" value={s.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} aria-invalid={!!errors.whatsappNumber || placeholderNumber} />
                  <a className="btn btn-outline shrink-0 border-line" href={whatsappLink(s.whatsappNumber, "رسالة تجربة من لوحة تحكم تزهّد")} target="_blank" rel="noopener noreferrer" aria-disabled={!isValidWhatsappNumber(s.whatsappNumber)}>
                    تجربة <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </FormField>
              <FormField label="رقم الهاتف (للعرض)" htmlFor="s-phone"><input id="s-phone" className="field ltr" dir="ltr" value={s.phone} onChange={(e) => set("phone", e.target.value)} /></FormField>
              <FormField label="رابط إنستغرام" htmlFor="s-instagramUrl" error={errors.instagramUrl}><input id="s-instagramUrl" type="url" className="field" value={s.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} aria-invalid={!!errors.instagramUrl} /></FormField>
              <FormField label="اسم حساب إنستغرام" htmlFor="s-ig"><input id="s-ig" className="field ltr" dir="ltr" value={s.instagramHandle} onChange={(e) => set("instagramHandle", e.target.value)} /></FormField>
              <FormField label="البريد الإلكتروني" htmlFor="s-email" error={errors.email}><input id="s-email" type="email" className="field" value={s.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} /></FormField>
            </div>
          </Panel>
        </section>

        <Panel title="العملة والتوصيل">
          <div className="grid gap-5 md:grid-cols-3">
            <FormField label="العملة" htmlFor="s-currency" hint={`مثال: ${formatMoney(1234.5, s)}`}>
              <select id="s-currency" className="field" value={s.currency} onChange={(e) => set("currency", e.target.value)}>
                {CURRENCIES.map(([c, n]) => <option key={c} value={c}>{n} · {c}</option>)}
              </select>
            </FormField>
            <FormField label="طريقة عرض الأرقام" htmlFor="s-locale">
              <select id="s-locale" className="field" value={s.locale} onChange={(e) => set("locale", e.target.value)}>
                {LOCALES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
            </FormField>
            <FormField label="تنبيه انخفاض المخزون عند" htmlFor="s-lowStockThreshold" error={errors.lowStockThreshold}>
              <input id="s-lowStockThreshold" className="field" inputMode="numeric" value={Number.isNaN(s.lowStockThreshold) ? "" : s.lowStockThreshold} onChange={(e) => set("lowStockThreshold", num(e.target.value))} aria-invalid={!!errors.lowStockThreshold} />
            </FormField>
            <FormField label="رسوم التوصيل" htmlFor="s-deliveryFee" error={errors.deliveryFee}>
              <input id="s-deliveryFee" className="field" inputMode="decimal" value={Number.isNaN(s.deliveryFee) ? "" : s.deliveryFee} onChange={(e) => set("deliveryFee", num(e.target.value))} aria-invalid={!!errors.deliveryFee} />
            </FormField>
            <FormField label="توصيل مجاني للطلبات فوق" htmlFor="s-freeDeliveryThreshold" error={errors.freeDeliveryThreshold} hint="0 يعني إيقاف التوصيل المجاني.">
              <input id="s-freeDeliveryThreshold" className="field" inputMode="decimal" value={Number.isNaN(s.freeDeliveryThreshold) ? "" : s.freeDeliveryThreshold} onChange={(e) => set("freeDeliveryThreshold", num(e.target.value))} aria-invalid={!!errors.freeDeliveryThreshold} />
            </FormField>
            <FormField label="ملاحظة التوصيل" htmlFor="s-deliveryNote" className="md:col-span-3"><input id="s-deliveryNote" className="field" value={s.deliveryNote} onChange={(e) => set("deliveryNote", e.target.value)} /></FormField>
          </div>
        </Panel>

        <Panel title="السياسات" description="تظهر في صفحة السياسات ورابطها في أسفل الموقع.">
          <div className="space-y-5">
            {s.policies.map((p, i) => (
              <div key={p.id} className="rounded-xl border border-line p-4">
                <div className="flex gap-2">
                  <input className="field font-semibold" value={p.title} onChange={(e) => set("policies", s.policies.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} aria-label={`عنوان السياسة ${i + 1}`} />
                  <button type="button" className="icon-btn shrink-0 text-muted hover:text-danger" onClick={() => set("policies", s.policies.filter((_, j) => j !== i))} aria-label={`حذف ${p.title}`}><Trash2 className="size-4" /></button>
                </div>
                <textarea className="field mt-2" rows={3} value={p.body} onChange={(e) => set("policies", s.policies.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} aria-label={`نص ${p.title}`} />
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline border-line" onClick={() => set("policies", [...s.policies, { id: `pol-${Date.now().toString(36)}`, title: "سياسة جديدة", body: "" }])}><Plus className="size-4" /> إضافة سياسة</button>
          </div>
        </Panel>

        <section id="data" className="scroll-mt-24">
          <Panel title="البيانات والتخزين" description={storageLabel}>
            <div className="space-y-4 text-sm leading-relaxed text-muted">
              {isLocalOnly ? (
                <p className="rounded-xl bg-gold-soft/40 p-4 text-[#5c4519]">
                  <strong>الوضع التجريبي:</strong> كل ما تعدّله هنا محفوظ في هذا المتصفح فقط (localStorage). <strong>لا</strong> تراه العميلات ولا يظهر على أجهزة أخرى، ولا توجد نسخة احتياطية، ويُمسح إذا مُسحت بيانات المتصفح. لنشر التعديلات للجميع اربط مخزن Vercel Blob بالمشروع كما في ملف README ثم أعد النشر.
                </p>
              ) : (
                <p className="rounded-xl bg-success/10 p-4 text-ink">
                  <strong>التخزين المشترك مفعّل:</strong> المنتجات والصور والإعدادات محفوظة في Vercel Blob وتظهر لكل الزوار خلال دقيقة تقريبًا من الحفظ. الطلبات تُحفظ في مجلد خاص لا يظهر في المتجر. صَدِّر نسخة احتياطية من وقت لآخر.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-outline border-line" onClick={exportData}><Download className="size-4" /> تصدير البيانات (JSON)</button>
                <button type="button" className="btn btn-outline border-line" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> استيراد البيانات</button>
                <input ref={fileRef} aria-label="ملف البيانات للاستيراد" type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importData(f); }} />
                <button type="button" className="btn btn-ghost text-danger" onClick={() => setConfirmReset(true)}><RotateCcw className="size-4" /> استعادة المحتوى الأولي</button>
              </div>
            </div>
          </Panel>
        </section>
      </div>

      <SaveBar dirty={dirty} saving={saving} onDiscard={() => { discard(); setErrors({}); }} />

      <ConfirmDialog
        open={confirmReset}
        title="استعادة المحتوى الأولي؟"
        body={isLocalOnly ? "سيتم استبدال المنتجات والأقسام والأكواد والباقات والصفحة الرئيسية والإعدادات والطلبات المحفوظة في هذا المتصفح بالمحتوى الأولي. صدّر نسخة أولًا إذا أردت الاحتفاظ بها." : "سيتم استبدال المنتجات والأقسام والأكواد والباقات والصفحة الرئيسية والإعدادات بالمحتوى الأولي لكل الزوار. الطلبات لن تُحذف. صدّر نسخة أولًا إذا أردت الاحتفاظ بها."}
        confirmLabel="استعادة"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false);
          const r = await resetToDemo();
          if (r.ok) toast.success("تمت استعادة المحتوى الأولي");
          else toast.error("فشلت الاستعادة", { description: r.error });
        }}
      />
    </form>
  );
}
