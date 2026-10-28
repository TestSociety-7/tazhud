"use client";

import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PLACEHOLDER_WHATSAPP } from "@/lib/seed";
import { isValidWhatsappNumber, normalizeWhatsappNumber, whatsappLink } from "@/lib/whatsapp";
import type { StoreSettings } from "@/lib/types";
import { FormField, PageHeader, Panel } from "../ui";
import { useSave } from "../use-save";
import { SaveBar, useDraft } from "../use-draft";

type Errors = Partial<Record<"storeName" | "whatsappNumber" | "instagramUrl" | "deliveryFee" | "freeDeliveryThreshold", string>>;

const INSTAGRAM_RE = /^https:\/\/(www\.)?instagram\.com\/([^\s/?#]+)\/?/i;

function validate(s: StoreSettings): Errors {
  const e: Errors = {};
  if (!s.storeName.trim()) e.storeName = "اكتب اسم المتجر.";
  if (!isValidWhatsappNumber(s.whatsappNumber)) e.whatsappNumber = "اكتب الرقم كاملًا مع رمز الدولة، مثل ‎+972 50 123 4567.";
  if (s.instagramUrl && !INSTAGRAM_RE.test(s.instagramUrl.trim())) e.instagramUrl = "اكتب الرابط كاملًا مثل https://www.instagram.com/tazhudd/";
  if (!(s.deliveryFee >= 0)) e.deliveryFee = "اكتب 0 أو أكثر.";
  if (!(s.freeDeliveryThreshold >= 0)) e.freeDeliveryThreshold = "اكتب 0 أو أكثر.";
  return e;
}

export function SettingsPage() {
  const save = useSave();
  const { draft, setDraft, dirty, discard, markSaved } = useDraft((d) => d.settings);
  const s = draft as StoreSettings;
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => {
    setDraft({ ...s, [k]: v });
    if (k in errors) setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const num = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))));

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
    const instagramUrl = s.instagramUrl.trim();
    const handle = instagramUrl.match(INSTAGRAM_RE)?.[2];
    const clean: StoreSettings = {
      ...s,
      storeName: s.storeName.trim(),
      whatsappNumber: normalizeWhatsappNumber(s.whatsappNumber),
      instagramUrl,
      instagramHandle: handle ? `@${handle}` : s.instagramHandle,
    };
    if (await save((d) => ({ ...d, settings: clean }), "تم حفظ الإعدادات")) markSaved(clean);
    setSaving(false);
  }

  const placeholderNumber = normalizeWhatsappNumber(s.whatsappNumber) === PLACEHOLDER_WHATSAPP;

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader title="الإعدادات" description="رقم واتساب، إنستغرام، التوصيل والسياسات." />

      <div className="stagger space-y-6">
        <Panel title="المتجر والتواصل">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="اسم المتجر" htmlFor="s-storeName" error={errors.storeName}>
              <input id="s-storeName" className="field" value={s.storeName} onChange={(e) => set("storeName", e.target.value)} aria-invalid={!!errors.storeName} />
            </FormField>
            <FormField
              label="رقم واتساب"
              htmlFor="s-whatsappNumber"
              error={errors.whatsappNumber}
              hint={placeholderNumber ? "ضع رقم واتساب الخاص بالمتجر." : "مع رمز الدولة. الطلبات تصل إلى هذا الرقم."}
            >
              <div className="flex gap-2">
                <input
                  id="s-whatsappNumber"
                  className="field"
                  type="tel"
                  inputMode="tel"
                  value={s.whatsappNumber}
                  onChange={(e) => set("whatsappNumber", e.target.value)}
                  aria-invalid={!!errors.whatsappNumber || placeholderNumber}
                />
                <a
                  className="press btn btn-outline shrink-0 border-line"
                  href={whatsappLink(s.whatsappNumber, "رسالة تجربة من لوحة تحكم تزهّد")}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!isValidWhatsappNumber(s.whatsappNumber)}
                >
                  تجربة <ExternalLink className="size-3.5" />
                </a>
              </div>
            </FormField>
            <FormField label="رابط إنستغرام" htmlFor="s-instagramUrl" error={errors.instagramUrl} className="md:col-span-2">
              <input id="s-instagramUrl" type="url" className="field" value={s.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} aria-invalid={!!errors.instagramUrl} />
            </FormField>
          </div>
        </Panel>

        <Panel title="التوصيل" description="المبالغ بالشيكل (₪).">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="رسوم التوصيل" htmlFor="s-deliveryFee" error={errors.deliveryFee}>
              <input
                id="s-deliveryFee"
                className="field"
                inputMode="decimal"
                value={Number.isNaN(s.deliveryFee) ? "" : s.deliveryFee}
                onChange={(e) => set("deliveryFee", num(e.target.value))}
                aria-invalid={!!errors.deliveryFee}
              />
            </FormField>
            <FormField label="توصيل مجاني للطلبات فوق" htmlFor="s-freeDeliveryThreshold" error={errors.freeDeliveryThreshold} hint="اكتب 0 لإيقاف التوصيل المجاني.">
              <input
                id="s-freeDeliveryThreshold"
                className="field"
                inputMode="decimal"
                value={Number.isNaN(s.freeDeliveryThreshold) ? "" : s.freeDeliveryThreshold}
                onChange={(e) => set("freeDeliveryThreshold", num(e.target.value))}
                aria-invalid={!!errors.freeDeliveryThreshold}
              />
            </FormField>
            <FormField label="ملاحظة التوصيل" htmlFor="s-deliveryNote" className="sm:col-span-2" hint="تظهر للزبونة عند إتمام الطلب.">
              <input id="s-deliveryNote" className="field" value={s.deliveryNote} onChange={(e) => set("deliveryNote", e.target.value)} />
            </FormField>
          </div>
        </Panel>

        <Panel title="السياسات" description="تظهر في صفحة «التوصيل والاستبدال».">
          <div className="space-y-4">
            {s.policies.map((p, i) => (
              <div key={p.id} className="rounded-xl border border-line p-3 sm:p-4">
                <div className="flex gap-2">
                  <input
                    className="field font-semibold"
                    value={p.title}
                    onChange={(e) => set("policies", s.policies.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                    aria-label={`عنوان السياسة ${i + 1}`}
                  />
                  <button
                    type="button"
                    className="icon-btn shrink-0 text-muted hover:text-danger"
                    onClick={() => set("policies", s.policies.filter((_, j) => j !== i))}
                    aria-label={`حذف ${p.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <textarea
                  className="field mt-2"
                  rows={3}
                  value={p.body}
                  onChange={(e) => set("policies", s.policies.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
                  aria-label={`نص ${p.title}`}
                />
              </div>
            ))}
            <button
              type="button"
              className="press btn btn-sm btn-outline border-line"
              onClick={() => set("policies", [...s.policies, { id: `pol-${Date.now().toString(36)}`, title: "سياسة جديدة", body: "" }])}
            >
              <Plus className="size-4" /> إضافة سياسة
            </button>
          </div>
        </Panel>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        onDiscard={() => {
          discard();
          setErrors({});
        }}
      />
    </form>
  );
}
