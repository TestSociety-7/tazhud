"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { HomepageContent } from "@/lib/types";
import { SingleImageInput } from "../image-input";
import { FormField, PageHeader, Panel, Toggle } from "../ui";
import { useSave } from "../use-save";
import { SaveBar, useDraft } from "../use-draft";
import { useStore } from "@/components/providers/store-provider";

const SECTION_LABEL: Record<string, string> = {
  categories: "تسوّقي حسب القسم",
  newArrivals: "وصل حديثًا",
  bestsellers: "الأكثر مبيعًا",
  bundles: "الباقات",
  promo: "شريط العرض",
  story: "قصة العلامة",
  follow: "النشرة والمتابعة",
};

export function HomepageEditor() {
  const { data } = useStore();
  const save = useSave();
  const { draft, setDraft, dirty, discard, markSaved } = useDraft((d) => d.homepage);
  const [saving, setSaving] = useState(false);
  const h = draft as HomepageContent;
  const patch = <K extends keyof HomepageContent>(k: K, v: Partial<HomepageContent[K]>) =>
    setDraft({ ...h, [k]: Array.isArray(v) ? v : { ...(h[k] as object), ...v } });

  const moveSection = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= h.sections.length) return;
    const s = [...h.sections];
    [s[i], s[j]] = [s[j], s[i]];
    setDraft({ ...h, sections: s });
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const clean = { ...h, announcement: { ...h.announcement, messages: h.announcement.messages.map((m) => m.trim()).filter(Boolean) } };
        if (await save((d) => ({ ...d, homepage: clean }), "تم تحديث الصفحة الرئيسية")) markSaved(clean);
        setSaving(false);
      }}
      noValidate
    >
      <PageHeader
        title="الصفحة الرئيسية"
        description="عدّل ما تراه العميلات أولًا: شريط الإعلان، الواجهة، العرض، القصة وترتيب الأقسام."
        actions={<a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline border-line"><ExternalLink className="size-4" /> معاينة المتجر</a>}
      />

      <div className="space-y-6">
        <Panel title="شريط الإعلان" description="رسائل متغيّرة أعلى كل صفحة.">
          <div className="space-y-4">
            <Toggle checked={h.announcement.enabled} onChange={(v) => patch("announcement", { enabled: v })} label="إظهار شريط الإعلان" />
            {h.announcement.messages.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input className="field" value={m} onChange={(e) => patch("announcement", { messages: h.announcement.messages.map((x, j) => (j === i ? e.target.value : x)) })} aria-label={`الرسالة ${i + 1}`} />
                <button type="button" className="icon-btn shrink-0 text-muted hover:text-danger" onClick={() => patch("announcement", { messages: h.announcement.messages.filter((_, j) => j !== i) })} aria-label={`حذف الرسالة ${i + 1}`}><Trash2 className="size-4" /></button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline border-line" onClick={() => patch("announcement", { messages: [...h.announcement.messages, ""] })}><Plus className="size-4" /> إضافة رسالة</button>
            <FormField label="رابط (اختياري)" htmlFor="ann-link" hint="الصفحة التي يفتحها الشريط، مثلًا /shop">
              <input id="ann-link" className="field ltr" dir="ltr" value={h.announcement.link} onChange={(e) => patch("announcement", { link: e.target.value })} />
            </FormField>
          </div>
        </Panel>

        <Panel title="الواجهة الرئيسية">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="عنوان صغير" htmlFor="h-eyebrow"><input id="h-eyebrow" className="field" value={h.hero.eyebrow} onChange={(e) => patch("hero", { eyebrow: e.target.value })} /></FormField>
            <FormField label="العنوان الرئيسي" htmlFor="h-title"><input id="h-title" className="field" value={h.hero.title} onChange={(e) => patch("hero", { title: e.target.value })} /></FormField>
            <FormField label="كلمة مميّزة (باللون الذهبي)" htmlFor="h-accent"><input id="h-accent" className="field" value={h.hero.titleAccent} onChange={(e) => patch("hero", { titleAccent: e.target.value })} /></FormField>
            <FormField label="النص الفرعي" htmlFor="h-sub" className="md:col-span-2"><textarea id="h-sub" className="field" rows={2} value={h.hero.subtitle} onChange={(e) => patch("hero", { subtitle: e.target.value })} /></FormField>
            <FormField label="نص الزر الأساسي" htmlFor="h-pl"><input id="h-pl" className="field" value={h.hero.primaryLabel} onChange={(e) => patch("hero", { primaryLabel: e.target.value })} /></FormField>
            <FormField label="رابط الزر الأساسي" htmlFor="h-ph"><input id="h-ph" className="field ltr" dir="ltr" value={h.hero.primaryHref} onChange={(e) => patch("hero", { primaryHref: e.target.value })} /></FormField>
            <FormField label="نص الزر الثاني" htmlFor="h-sl" hint="اتركه فارغًا لإخفائه."><input id="h-sl" className="field" value={h.hero.secondaryLabel} onChange={(e) => patch("hero", { secondaryLabel: e.target.value })} /></FormField>
            <FormField label="رابط الزر الثاني" htmlFor="h-sh"><input id="h-sh" className="field ltr" dir="ltr" value={h.hero.secondaryHref} onChange={(e) => patch("hero", { secondaryHref: e.target.value })} /></FormField>
            <div><p className="label">الصورة الرئيسية</p><SingleImageInput label="رابط الصورة الرئيسية" value={h.hero.image} onChange={(v) => patch("hero", { image: v })} /></div>
            <div><p className="label">الصورة الصغيرة</p><SingleImageInput label="رابط الصورة الصغيرة" value={h.hero.secondaryImage} onChange={(v) => patch("hero", { secondaryImage: v })} /></div>
          </div>
        </Panel>

        <Panel title="شريط العرض" description="اربطه بكود خصم من صفحة أكواد الخصم.">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="عنوان صغير" htmlFor="p-eb"><input id="p-eb" className="field" value={h.promo.eyebrow} onChange={(e) => patch("promo", { eyebrow: e.target.value })} /></FormField>
            <FormField label="العنوان" htmlFor="p-t"><input id="p-t" className="field" value={h.promo.title} onChange={(e) => patch("promo", { title: e.target.value })} /></FormField>
            <FormField label="النص" htmlFor="p-b" className="md:col-span-2"><textarea id="p-b" className="field" rows={2} value={h.promo.body} onChange={(e) => patch("promo", { body: e.target.value })} /></FormField>
            <FormField label="كود الخصم" htmlFor="p-c" hint={data.coupons.some((c) => c.code === h.promo.couponCode && c.active) || !h.promo.couponCode ? undefined : "هذا الكود غير مفعّل في صفحة أكواد الخصم."}>
              <select id="p-c" className="field" value={h.promo.couponCode} onChange={(e) => patch("promo", { couponCode: e.target.value })}>
                <option value="">بدون كود</option>
                {data.coupons.map((c) => <option key={c.id} value={c.code}>{c.code}{c.active ? "" : " (موقوف)"}</option>)}
              </select>
            </FormField>
            <FormField label="نص الزر" htmlFor="p-cl"><input id="p-cl" className="field" value={h.promo.ctaLabel} onChange={(e) => patch("promo", { ctaLabel: e.target.value })} /></FormField>
          </div>
        </Panel>

        <Panel title="قصة العلامة">
          <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
            <div className="space-y-5">
              <FormField label="العنوان" htmlFor="s-t"><input id="s-t" className="field" value={h.story.title} onChange={(e) => patch("story", { title: e.target.value })} /></FormField>
              <FormField label="النص" htmlFor="s-b"><textarea id="s-b" className="field" rows={5} value={h.story.body} onChange={(e) => patch("story", { body: e.target.value })} /></FormField>
            </div>
            <div><p className="label">الصورة</p><SingleImageInput label="رابط صورة القصة" value={h.story.image} onChange={(v) => patch("story", { image: v })} /></div>
          </div>
        </Panel>

        <Panel title="أقسام الصفحة" description="أظهر أو أخفِ الأقسام، وغيّر أسماءها وترتيبها.">
          <ul className="divide-y divide-line">
            {h.sections.map((s, i) => (
              <li key={s.key} className="grid gap-3 py-4 md:grid-cols-[auto_12rem_1fr_1fr_auto] md:items-center">
                <div className="flex gap-1">
                  <button type="button" className="icon-btn size-9" disabled={i === 0} onClick={() => moveSection(i, -1)} aria-label={`تقديم ${SECTION_LABEL[s.key]}`}><ArrowUp className="size-4" /></button>
                  <button type="button" className="icon-btn size-9" disabled={i === h.sections.length - 1} onClick={() => moveSection(i, 1)} aria-label={`تأخير ${SECTION_LABEL[s.key]}`}><ArrowDown className="size-4" /></button>
                </div>
                <p className="text-sm font-semibold text-ink">{SECTION_LABEL[s.key]}</p>
                <input className="field" value={s.title} onChange={(e) => setDraft({ ...h, sections: h.sections.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} aria-label={`عنوان ${SECTION_LABEL[s.key]}`} placeholder="العنوان" />
                <input className="field" value={s.subtitle} onChange={(e) => setDraft({ ...h, sections: h.sections.map((x, j) => (j === i ? { ...x, subtitle: e.target.value } : x)) })} aria-label={`العنوان الصغير لـ${SECTION_LABEL[s.key]}`} placeholder="عنوان صغير" />
                <Toggle checked={s.enabled} onChange={(v) => setDraft({ ...h, sections: h.sections.map((x, j) => (j === i ? { ...x, enabled: v } : x)) })} label={s.enabled ? "ظاهر" : "مخفي"} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <SaveBar dirty={dirty} saving={saving} onDiscard={discard} />
    </form>
  );
}
