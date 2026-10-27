"use client";

import { useRef, useState } from "react";
import { Download, ExternalLink, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney } from "@/lib/commerce";
import { normalizeStoreData } from "@/lib/repository";
import { PLACEHOLDER_WHATSAPP } from "@/lib/seed";
import { isValidWhatsappNumber, normalizeWhatsappNumber, whatsappLink } from "@/lib/whatsapp";
import type { StoreSettings } from "@/lib/types";
import { ConfirmDialog, FormField, PageHeader, Panel } from "../ui";
import { useSave } from "../use-save";
import { SaveBar, useDraft } from "../use-draft";

const CURRENCIES: [string, string][] = [
  ["USD", "US Dollar"], ["EUR", "Euro"], ["GBP", "British Pound"], ["CAD", "Canadian Dollar"], ["AUD", "Australian Dollar"],
  ["AED", "UAE Dirham"], ["SAR", "Saudi Riyal"], ["QAR", "Qatari Riyal"], ["KWD", "Kuwaiti Dinar"], ["BHD", "Bahraini Dinar"], ["OMR", "Omani Rial"],
  ["EGP", "Egyptian Pound"], ["MAD", "Moroccan Dirham"], ["TRY", "Turkish Lira"], ["MYR", "Malaysian Ringgit"], ["IDR", "Indonesian Rupiah"],
  ["PKR", "Pakistani Rupee"], ["INR", "Indian Rupee"], ["BDT", "Bangladeshi Taka"], ["NGN", "Nigerian Naira"], ["KES", "Kenyan Shilling"], ["ETB", "Ethiopian Birr"], ["SOS", "Somali Shilling"], ["ZAR", "South African Rand"],
];
const LOCALES: [string, string][] = [["en-US", "English (US)"], ["en-GB", "English (UK)"], ["ar", "Arabic"], ["fr-FR", "French"], ["tr-TR", "Turkish"], ["ms-MY", "Malay"], ["id-ID", "Indonesian"]];

type Errors = Partial<Record<"storeName" | "whatsappNumber" | "instagramUrl" | "email" | "deliveryFee" | "freeDeliveryThreshold" | "lowStockThreshold", string>>;

function validate(s: StoreSettings): Errors {
  const e: Errors = {};
  if (!s.storeName.trim()) e.storeName = "Enter the store name.";
  if (!isValidWhatsappNumber(s.whatsappNumber)) e.whatsappNumber = "Enter the full number with country code, e.g. +971 50 123 4567.";
  if (s.instagramUrl && !/^https:\/\/(www\.)?instagram\.com\/[^\s]+$/i.test(s.instagramUrl.trim())) e.instagramUrl = "Use a full link like https://www.instagram.com/yourname/";
  if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) e.email = "Enter a valid email or leave it empty.";
  if (!(s.deliveryFee >= 0)) e.deliveryFee = "Enter 0 or more.";
  if (!(s.freeDeliveryThreshold >= 0)) e.freeDeliveryThreshold = "Enter 0 or more.";
  if (!Number.isInteger(s.lowStockThreshold) || s.lowStockThreshold < 0) e.lowStockThreshold = "Enter a whole number.";
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
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    const clean: StoreSettings = { ...s, whatsappNumber: normalizeWhatsappNumber(s.whatsappNumber), instagramUrl: s.instagramUrl.trim() };
    if (await save((d) => ({ ...d, settings: clean }), "Store settings saved")) markSaved(clean);
    setSaving(false);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tazhud-store-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Store data exported");
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.version !== 1 || !Array.isArray(parsed.products)) throw new Error("This file isn't a Tazhud store export.");
      const res = await update(() => normalizeStoreData(parsed));
      if (!res.ok) throw new Error(res.error);
      toast.success("Store data imported", { description: `${parsed.products.length} products loaded.` });
    } catch (err) {
      toast.error("Import failed", { description: err instanceof Error ? err.message : "Unreadable file" });
    }
  }

  const placeholderNumber = normalizeWhatsappNumber(s.whatsappNumber) === PLACEHOLDER_WHATSAPP;

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader title="Store settings" description="Contact details, WhatsApp ordering, currency, delivery and policies. Changes show on the storefront as soon as you save." />

      <div className="space-y-6">
        <Panel title="Store details">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Store name" htmlFor="s-storeName" error={errors.storeName}><input id="s-storeName" className="field" value={s.storeName} onChange={(e) => set("storeName", e.target.value)} aria-invalid={!!errors.storeName} /></FormField>
            <FormField label="Tagline" htmlFor="s-tagline"><input id="s-tagline" className="field" value={s.tagline} onChange={(e) => set("tagline", e.target.value)} /></FormField>
            <FormField label="Address" htmlFor="s-address"><input id="s-address" className="field" value={s.address} onChange={(e) => set("address", e.target.value)} /></FormField>
            <FormField label="Opening hours" htmlFor="s-hours"><input id="s-hours" className="field" value={s.hours} onChange={(e) => set("hours", e.target.value)} /></FormField>
          </div>
        </Panel>

        <section id="contact" className="scroll-mt-24">
          <Panel title="WhatsApp & social" description="Checkout opens WhatsApp with the order addressed to this number.">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="WhatsApp number" htmlFor="s-whatsappNumber" error={errors.whatsappNumber} hint={placeholderNumber ? "This is a placeholder. Replace it with your real WhatsApp Business number." : "Include the country code. Spaces and + are fine."}>
                <div className="flex gap-2">
                  <input id="s-whatsappNumber" className="field" type="tel" inputMode="tel" value={s.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} aria-invalid={!!errors.whatsappNumber || placeholderNumber} />
                  <a className="btn btn-outline shrink-0 border-line" href={whatsappLink(s.whatsappNumber, "Test message from the Tazhud admin")} target="_blank" rel="noopener noreferrer" aria-disabled={!isValidWhatsappNumber(s.whatsappNumber)}>
                    Test <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </FormField>
              <FormField label="Phone (display)" htmlFor="s-phone"><input id="s-phone" className="field" value={s.phone} onChange={(e) => set("phone", e.target.value)} /></FormField>
              <FormField label="Instagram link" htmlFor="s-instagramUrl" error={errors.instagramUrl}><input id="s-instagramUrl" className="field" value={s.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} aria-invalid={!!errors.instagramUrl} /></FormField>
              <FormField label="Instagram handle" htmlFor="s-ig"><input id="s-ig" className="field" value={s.instagramHandle} onChange={(e) => set("instagramHandle", e.target.value)} /></FormField>
              <FormField label="Email" htmlFor="s-email" error={errors.email}><input id="s-email" type="email" className="field" value={s.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} /></FormField>
            </div>
          </Panel>
        </section>

        <Panel title="Currency & delivery">
          <div className="grid gap-5 md:grid-cols-3">
            <FormField label="Currency" htmlFor="s-currency" hint={`Example: ${formatMoney(1234.5, s)}`}>
              <select id="s-currency" className="field" value={s.currency} onChange={(e) => set("currency", e.target.value)}>
                {CURRENCIES.map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}
              </select>
            </FormField>
            <FormField label="Number format" htmlFor="s-locale">
              <select id="s-locale" className="field" value={s.locale} onChange={(e) => set("locale", e.target.value)}>
                {LOCALES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
            </FormField>
            <FormField label="Low-stock alert at" htmlFor="s-lowStockThreshold" error={errors.lowStockThreshold}>
              <input id="s-lowStockThreshold" className="field" inputMode="numeric" value={Number.isNaN(s.lowStockThreshold) ? "" : s.lowStockThreshold} onChange={(e) => set("lowStockThreshold", num(e.target.value))} aria-invalid={!!errors.lowStockThreshold} />
            </FormField>
            <FormField label="Delivery fee" htmlFor="s-deliveryFee" error={errors.deliveryFee}>
              <input id="s-deliveryFee" className="field" inputMode="decimal" value={Number.isNaN(s.deliveryFee) ? "" : s.deliveryFee} onChange={(e) => set("deliveryFee", num(e.target.value))} aria-invalid={!!errors.deliveryFee} />
            </FormField>
            <FormField label="Free delivery over" htmlFor="s-freeDeliveryThreshold" error={errors.freeDeliveryThreshold} hint="0 turns this off.">
              <input id="s-freeDeliveryThreshold" className="field" inputMode="decimal" value={Number.isNaN(s.freeDeliveryThreshold) ? "" : s.freeDeliveryThreshold} onChange={(e) => set("freeDeliveryThreshold", num(e.target.value))} aria-invalid={!!errors.freeDeliveryThreshold} />
            </FormField>
            <FormField label="Delivery note" htmlFor="s-deliveryNote" className="md:col-span-3"><input id="s-deliveryNote" className="field" value={s.deliveryNote} onChange={(e) => set("deliveryNote", e.target.value)} /></FormField>
          </div>
        </Panel>

        <Panel title="Policies" description="Shown on the policies page and linked from the footer.">
          <div className="space-y-5">
            {s.policies.map((p, i) => (
              <div key={p.id} className="rounded-xl border border-line p-4">
                <div className="flex gap-2">
                  <input className="field font-semibold" value={p.title} onChange={(e) => set("policies", s.policies.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} aria-label={`Policy ${i + 1} title`} />
                  <button type="button" className="icon-btn shrink-0 text-muted hover:text-danger" onClick={() => set("policies", s.policies.filter((_, j) => j !== i))} aria-label={`Remove ${p.title}`}><Trash2 className="size-4" /></button>
                </div>
                <textarea className="field mt-2" rows={3} value={p.body} onChange={(e) => set("policies", s.policies.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} aria-label={`${p.title} text`} />
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline border-line" onClick={() => set("policies", [...s.policies, { id: `pol-${Date.now().toString(36)}`, title: "New policy", body: "" }])}><Plus className="size-4" /> Add policy</button>
          </div>
        </Panel>

        <section id="data" className="scroll-mt-24">
          <Panel title="Data & storage" description={storageLabel}>
            <div className="space-y-4 text-sm leading-relaxed text-muted">
              {isLocalOnly && (
                <p className="rounded-xl bg-gold-soft/40 p-4 text-[#5c4519]">
                  <strong>Demo mode:</strong> everything you edit here is stored in this browser (localStorage). It is <strong>not</strong> shared with customers or other devices, is not backed up, and is cleared if browser data is cleared. Customers see the starter catalogue built into the site. To publish edits for everyone, connect a database as described in the README, or export your data and send it to your developer.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-outline border-line" onClick={exportData}><Download className="size-4" /> Export data (JSON)</button>
                <button type="button" className="btn btn-outline border-line" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Import data</button>
                <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importData(f); }} />
                <button type="button" className="btn btn-ghost text-danger" onClick={() => setConfirmReset(true)}><RotateCcw className="size-4" /> Reset to starter content</button>
              </div>
            </div>
          </Panel>
        </section>
      </div>

      <SaveBar dirty={dirty} saving={saving} onDiscard={() => { discard(); setErrors({}); }} />

      <ConfirmDialog
        open={confirmReset}
        title="Reset all store data?"
        body="Products, categories, coupons, bundles, homepage, settings and inquiries saved in this browser will be replaced with the starter content. Export first if you want a backup."
        confirmLabel="Reset everything"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false);
          const r = await resetToDemo();
          if (r.ok) toast.success("Starter content restored");
          else toast.error("Reset failed", { description: r.error });
        }}
      />
    </form>
  );
}
