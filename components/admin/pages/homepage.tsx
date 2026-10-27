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
  categories: "Shop by category",
  newArrivals: "New arrivals",
  bestsellers: "Bestsellers",
  bundles: "Curated bundles",
  promo: "Promotion banner",
  story: "Brand story",
  follow: "Email & social follow",
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
        if (await save((d) => ({ ...d, homepage: clean }), "Homepage updated")) markSaved(clean);
        setSaving(false);
      }}
      noValidate
    >
      <PageHeader
        title="Homepage"
        description="Edit what customers see first: the announcement bar, hero, promotion, story and the order of sections."
        actions={<a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline border-line"><ExternalLink className="size-4" /> Preview store</a>}
      />

      <div className="space-y-6">
        <Panel title="Announcement bar" description="Rotating messages at the very top of every page.">
          <div className="space-y-4">
            <Toggle checked={h.announcement.enabled} onChange={(v) => patch("announcement", { enabled: v })} label="Show announcement bar" />
            {h.announcement.messages.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input className="field" value={m} onChange={(e) => patch("announcement", { messages: h.announcement.messages.map((x, j) => (j === i ? e.target.value : x)) })} aria-label={`Message ${i + 1}`} />
                <button type="button" className="icon-btn shrink-0 text-muted hover:text-danger" onClick={() => patch("announcement", { messages: h.announcement.messages.filter((_, j) => j !== i) })} aria-label={`Remove message ${i + 1}`}><Trash2 className="size-4" /></button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline border-line" onClick={() => patch("announcement", { messages: [...h.announcement.messages, ""] })}><Plus className="size-4" /> Add message</button>
            <FormField label="Link (optional)" htmlFor="ann-link" hint="Where the bar links to, e.g. /shop">
              <input id="ann-link" className="field" value={h.announcement.link} onChange={(e) => patch("announcement", { link: e.target.value })} />
            </FormField>
          </div>
        </Panel>

        <Panel title="Hero">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Eyebrow" htmlFor="h-eyebrow"><input id="h-eyebrow" className="field" value={h.hero.eyebrow} onChange={(e) => patch("hero", { eyebrow: e.target.value })} /></FormField>
            <FormField label="Headline" htmlFor="h-title"><input id="h-title" className="field" value={h.hero.title} onChange={(e) => patch("hero", { title: e.target.value })} /></FormField>
            <FormField label="Headline accent (gold italic)" htmlFor="h-accent"><input id="h-accent" className="field" value={h.hero.titleAccent} onChange={(e) => patch("hero", { titleAccent: e.target.value })} /></FormField>
            <FormField label="Subtitle" htmlFor="h-sub" className="md:col-span-2"><textarea id="h-sub" className="field" rows={2} value={h.hero.subtitle} onChange={(e) => patch("hero", { subtitle: e.target.value })} /></FormField>
            <FormField label="Primary button label" htmlFor="h-pl"><input id="h-pl" className="field" value={h.hero.primaryLabel} onChange={(e) => patch("hero", { primaryLabel: e.target.value })} /></FormField>
            <FormField label="Primary button link" htmlFor="h-ph"><input id="h-ph" className="field" value={h.hero.primaryHref} onChange={(e) => patch("hero", { primaryHref: e.target.value })} /></FormField>
            <FormField label="Secondary button label" htmlFor="h-sl" hint="Leave empty to hide."><input id="h-sl" className="field" value={h.hero.secondaryLabel} onChange={(e) => patch("hero", { secondaryLabel: e.target.value })} /></FormField>
            <FormField label="Secondary button link" htmlFor="h-sh"><input id="h-sh" className="field" value={h.hero.secondaryHref} onChange={(e) => patch("hero", { secondaryHref: e.target.value })} /></FormField>
            <div><p className="label">Main image</p><SingleImageInput label="Hero image URL" value={h.hero.image} onChange={(v) => patch("hero", { image: v })} /></div>
            <div><p className="label">Floating detail image</p><SingleImageInput label="Hero detail image URL" value={h.hero.secondaryImage} onChange={(v) => patch("hero", { secondaryImage: v })} /></div>
          </div>
        </Panel>

        <Panel title="Promotion banner" description="Pair it with a coupon code from the Coupons page.">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Eyebrow" htmlFor="p-eb"><input id="p-eb" className="field" value={h.promo.eyebrow} onChange={(e) => patch("promo", { eyebrow: e.target.value })} /></FormField>
            <FormField label="Title" htmlFor="p-t"><input id="p-t" className="field" value={h.promo.title} onChange={(e) => patch("promo", { title: e.target.value })} /></FormField>
            <FormField label="Body" htmlFor="p-b" className="md:col-span-2"><textarea id="p-b" className="field" rows={2} value={h.promo.body} onChange={(e) => patch("promo", { body: e.target.value })} /></FormField>
            <FormField label="Coupon code" htmlFor="p-c" hint={data.coupons.some((c) => c.code === h.promo.couponCode && c.active) || !h.promo.couponCode ? undefined : "This code isn't active on the Coupons page."}>
              <select id="p-c" className="field" value={h.promo.couponCode} onChange={(e) => patch("promo", { couponCode: e.target.value })}>
                <option value="">No code</option>
                {data.coupons.map((c) => <option key={c.id} value={c.code}>{c.code}{c.active ? "" : " (paused)"}</option>)}
              </select>
            </FormField>
            <FormField label="Button label" htmlFor="p-cl"><input id="p-cl" className="field" value={h.promo.ctaLabel} onChange={(e) => patch("promo", { ctaLabel: e.target.value })} /></FormField>
          </div>
        </Panel>

        <Panel title="Brand story">
          <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
            <div className="space-y-5">
              <FormField label="Title" htmlFor="s-t"><input id="s-t" className="field" value={h.story.title} onChange={(e) => patch("story", { title: e.target.value })} /></FormField>
              <FormField label="Text" htmlFor="s-b"><textarea id="s-b" className="field" rows={5} value={h.story.body} onChange={(e) => patch("story", { body: e.target.value })} /></FormField>
            </div>
            <div><p className="label">Image</p><SingleImageInput label="Story image URL" value={h.story.image} onChange={(v) => patch("story", { image: v })} /></div>
          </div>
        </Panel>

        <Panel title="Sections" description="Turn sections on or off, rename them and change their order.">
          <ul className="divide-y divide-line">
            {h.sections.map((s, i) => (
              <li key={s.key} className="grid gap-3 py-4 md:grid-cols-[auto_12rem_1fr_1fr_auto] md:items-center">
                <div className="flex gap-1">
                  <button type="button" className="icon-btn size-9" disabled={i === 0} onClick={() => moveSection(i, -1)} aria-label={`Move ${SECTION_LABEL[s.key]} up`}><ArrowUp className="size-4" /></button>
                  <button type="button" className="icon-btn size-9" disabled={i === h.sections.length - 1} onClick={() => moveSection(i, 1)} aria-label={`Move ${SECTION_LABEL[s.key]} down`}><ArrowDown className="size-4" /></button>
                </div>
                <p className="text-sm font-semibold text-ink">{SECTION_LABEL[s.key]}</p>
                <input className="field" value={s.title} onChange={(e) => setDraft({ ...h, sections: h.sections.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} aria-label={`${SECTION_LABEL[s.key]} title`} placeholder="Title" />
                <input className="field" value={s.subtitle} onChange={(e) => setDraft({ ...h, sections: h.sections.map((x, j) => (j === i ? { ...x, subtitle: e.target.value } : x)) })} aria-label={`${SECTION_LABEL[s.key]} subtitle`} placeholder="Small heading" />
                <Toggle checked={s.enabled} onChange={(v) => setDraft({ ...h, sections: h.sections.map((x, j) => (j === i ? { ...x, enabled: v } : x)) })} label={s.enabled ? "Shown" : "Hidden"} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <SaveBar dirty={dirty} saving={saving} onDiscard={discard} />
    </form>
  );
}
