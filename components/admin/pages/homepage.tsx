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
  categories: "الأقسام",
  newArrivals: "وصل حديثًا",
  promo: "شريط العرض",
};

export function HomepageEditor() {
  const { data } = useStore();
  const save = useSave();
  const { draft, setDraft, dirty, discard, markSaved } = useDraft((d) => d.homepage);
  const [saving, setSaving] = useState(false);
  const h = draft as HomepageContent;
  const sections = h.sections.filter((s) => s.key in SECTION_LABEL);
  const patch = <K extends keyof HomepageContent>(k: K, v: Partial<HomepageContent[K]>) =>
    setDraft({ ...h, [k]: Array.isArray(v) ? v : { ...(h[k] as object), ...v } });

  const moveSection = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const s = [...sections];
    [s[i], s[j]] = [s[j], s[i]];
    setDraft({ ...h, sections: s });
  };
  const setSection = (i: number, v: Partial<HomepageContent["sections"][number]>) =>
    setDraft({ ...h, sections: sections.map((x, j) => (j === i ? { ...x, ...v } : x)) });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const clean = {
          ...h,
          sections,
          announcement: { ...h.announcement, messages: h.announcement.messages.map((m) => m.trim()).filter(Boolean) },
        };
        if (await save((d) => ({ ...d, homepage: clean }), "تم تحديث واجهة المتجر")) markSaved(clean);
        setSaving(false);
      }}
      noValidate
    >
      <PageHeader
        title="واجهة المتجر"
        description="ما تراه الزبونة أولًا عند فتح الموقع."
        actions={
          <a href="/" target="_blank" rel="noopener noreferrer" className="press btn btn-outline border-line">
            <ExternalLink className="size-4" /> معاينة
          </a>
        }
      />

      <div className="stagger space-y-6">
        <Panel title="الصورة الرئيسية والعنوان">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:row-span-3">
              <p className="label">الصورة</p>
              <SingleImageInput label="رابط الصورة الرئيسية" value={h.hero.image} onChange={(v) => patch("hero", { image: v })} />
            </div>
            <FormField label="العنوان" htmlFor="h-title">
              <input id="h-title" className="field" value={h.hero.title} onChange={(e) => patch("hero", { title: e.target.value })} />
            </FormField>
            <FormField label="كلمة باللون الذهبي (اختياري)" htmlFor="h-accent">
              <input id="h-accent" className="field" value={h.hero.titleAccent} onChange={(e) => patch("hero", { titleAccent: e.target.value })} />
            </FormField>
            <FormField label="نص قصير" htmlFor="h-sub">
              <textarea id="h-sub" className="field" rows={2} value={h.hero.subtitle} onChange={(e) => patch("hero", { subtitle: e.target.value })} />
            </FormField>
            <FormField label="نص الزر" htmlFor="h-pl">
              <input id="h-pl" className="field" value={h.hero.primaryLabel} onChange={(e) => patch("hero", { primaryLabel: e.target.value })} />
            </FormField>
          </div>
        </Panel>

        <Panel title="شريط الإعلان" description="سطر صغير أعلى كل الصفحات.">
          <div className="space-y-4">
            <Toggle checked={h.announcement.enabled} onChange={(v) => patch("announcement", { enabled: v })} label="إظهار شريط الإعلان" />
            {h.announcement.messages.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="field"
                  value={m}
                  onChange={(e) => patch("announcement", { messages: h.announcement.messages.map((x, j) => (j === i ? e.target.value : x)) })}
                  aria-label={`الرسالة ${i + 1}`}
                />
                <button
                  type="button"
                  className="icon-btn shrink-0 text-muted hover:text-danger"
                  onClick={() => patch("announcement", { messages: h.announcement.messages.filter((_, j) => j !== i) })}
                  aria-label={`حذف الرسالة ${i + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <button type="button" className="press btn btn-sm btn-outline border-line" onClick={() => patch("announcement", { messages: [...h.announcement.messages, ""] })}>
              <Plus className="size-4" /> إضافة رسالة
            </button>
          </div>
        </Panel>

        <Panel title="شريط العرض" description="يظهر مع كود خصم تختاره من صفحة أكواد الخصم.">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="العنوان" htmlFor="p-t">
              <input id="p-t" className="field" value={h.promo.title} onChange={(e) => patch("promo", { title: e.target.value })} />
            </FormField>
            <FormField
              label="كود الخصم"
              htmlFor="p-c"
              hint={data.coupons.some((c) => c.code === h.promo.couponCode && c.active) || !h.promo.couponCode ? undefined : "هذا الكود غير مفعّل."}
            >
              <select id="p-c" className="field" value={h.promo.couponCode} onChange={(e) => patch("promo", { couponCode: e.target.value })}>
                <option value="">بدون كود</option>
                {data.coupons.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code}
                    {c.active ? "" : " (موقوف)"}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="النص" htmlFor="p-b" className="md:col-span-2">
              <input id="p-b" className="field" value={h.promo.body} onChange={(e) => patch("promo", { body: e.target.value })} />
            </FormField>
          </div>
        </Panel>

        <Panel title="ترتيب الصفحة" description="أظهر أو أخفِ الأجزاء وغيّر ترتيبها.">
          <ul className="divide-y divide-line">
            {sections.map((s, i) => (
              <li key={s.key} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex gap-1">
                  <button type="button" className="icon-btn size-9" disabled={i === 0} onClick={() => moveSection(i, -1)} aria-label={`تقديم ${SECTION_LABEL[s.key]}`}>
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" className="icon-btn size-9" disabled={i === sections.length - 1} onClick={() => moveSection(i, 1)} aria-label={`تأخير ${SECTION_LABEL[s.key]}`}>
                    <ArrowDown className="size-4" />
                  </button>
                </div>
                {s.key === "promo" ? (
                  <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{SECTION_LABEL[s.key]}</p>
                ) : (
                  <input
                    className="field min-w-0 flex-1"
                    value={s.title}
                    onChange={(e) => setSection(i, { title: e.target.value })}
                    aria-label={`عنوان ${SECTION_LABEL[s.key]}`}
                    placeholder={SECTION_LABEL[s.key]}
                  />
                )}
                <Toggle checked={s.enabled} onChange={(v) => setSection(i, { enabled: v })} label={s.enabled ? "ظاهر" : "مخفي"} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <SaveBar dirty={dirty} saving={saving} onDiscard={discard} />
    </form>
  );
}
