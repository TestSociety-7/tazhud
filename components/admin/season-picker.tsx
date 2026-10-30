"use client";

import { Check } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import type { Season } from "@/lib/types";
import { useSave } from "./use-save";

/** bg, card, accent, button, extra accent: drawn into each mini preview. */
const OPTIONS: { id: Season; label: string; note: string; swatch: [string, string, string, string, string]; icon: string }[] = [
  { id: "original", label: "الأصلي", note: "داكن مع الوردي النيون والأبيض", swatch: ["#0a0a0d", "#141419", "#ff5c7a", "#f6f6f8", "#b07cff"], icon: "✦" },
  { id: "christmas", label: "الكريسماس", note: "ثلج يتساقط وأضواء وزينة", swatch: ["#0a0a0d", "#141419", "#ff4d5e", "#9be3b4", "#f5cf6b"], icon: "❄" },
  { id: "halloween", label: "الهالوين", note: "خفافيش وقرع وألوان الليل", swatch: ["#0d0912", "#17111f", "#b07cff", "#ffa24c", "#b6e05a"], icon: "☾" },
];

/** A tiny phone screen in the season's colours. */
function Preview({ swatch: [bg, card, accent, button, extra], icon }: { swatch: string[]; icon: string }) {
  return (
    <span className="relative block aspect-[4/5] overflow-hidden rounded-[1.1rem]" style={{ background: bg }} aria-hidden>
      <span className="absolute -top-10 -end-10 size-32 rounded-full opacity-50 blur-2xl" style={{ background: accent }} />
      <span className="absolute -bottom-12 -start-10 size-28 rounded-full opacity-30 blur-2xl" style={{ background: extra }} />
      <span className="absolute inset-x-3 top-3 flex items-center gap-1.5">
        <span className="size-5 rounded-full p-[2px]" style={{ background: `linear-gradient(135deg, ${accent}, ${extra})` }}>
          <span className="block size-full rounded-full" style={{ background: card }} />
        </span>
        <span className="h-1.5 w-10 rounded-full opacity-80" style={{ background: button }} />
        <span className="ms-auto grid size-6 place-items-center rounded-full text-[0.65rem] font-bold" style={{ background: accent, color: bg }}>{icon}</span>
      </span>
      <span className="absolute inset-x-3 top-11 bottom-14 overflow-hidden rounded-xl" style={{ background: card }}>
        <span className="absolute inset-x-0 bottom-0 h-2/3" style={{ background: `linear-gradient(to top, ${accent}55, transparent)` }} />
        <span className="absolute start-2 bottom-2 h-1.5 w-12 rounded-full" style={{ background: button }} />
        <span className="absolute start-2 bottom-5 h-1.5 w-8 rounded-full opacity-60" style={{ background: button }} />
        <span className="absolute end-2 bottom-2 grid size-5 place-items-center rounded-full text-[0.6rem]" style={{ background: accent, color: bg }}>♥</span>
      </span>
      <span className="absolute inset-x-3 bottom-3 grid h-8 place-items-center rounded-full text-[0.65rem] font-extrabold" style={{ background: button, color: bg }}>
        اطلبي الآن
      </span>
    </span>
  );
}

/** One tap changes the look customers see. Saved straight away. */
export function SeasonPicker() {
  const { data } = useStore();
  const save = useSave();
  const current = data.settings.season;

  function pick(season: Season) {
    if (season === current) return;
    const name = OPTIONS.find((o) => o.id === season)?.label;
    void save((d) => ({ ...d, settings: { ...d.settings, season } }), `مظهر المتجر الآن: ${name}`);
  }

  return (
    <section aria-labelledby="season-h">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="season-h" className="studio-title text-xl">مظهر المتجر</h2>
          <p className="mt-0.5 text-xs text-muted">اختر الشكل الذي يراه الزبائن. لوحة الإدارة تتزيّن معه أيضًا.</p>
        </div>
        <span className="shrink-0 text-xs text-muted sm:hidden" aria-hidden>اسحب ←</span>
      </div>
      <div
        role="radiogroup"
        aria-label="مظهر المتجر"
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pt-2 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0"
      >
        {OPTIONS.map((o) => {
          const on = o.id === current;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(o.id)}
              className={`season-card relative w-[68%] shrink-0 snap-center rounded-[1.5rem] p-2 text-start sm:w-auto ${
                on ? "neon-ring bg-paper shadow-[0_24px_40px_-24px_var(--color-gold)]" : "bg-paper ring-1 ring-line hover:ring-gold/50"
              }`}
            >
              <Preview swatch={o.swatch} icon={o.icon} />
              <span className="flex items-center justify-between gap-2 px-1.5 pt-3">
                <span className="font-display text-lg font-extrabold text-ink">{o.label}</span>
                <span
                  className={`grid size-7 place-items-center rounded-full transition-all duration-500 ease-[var(--ease-spring)] ${
                    on ? "scale-100 bg-gold text-white" : "scale-90 bg-sand text-transparent ring-1 ring-line"
                  }`}
                >
                  <Check className="size-4" strokeWidth={3} />
                </span>
              </span>
              <span className="block px-1.5 pt-0.5 pb-1.5 text-xs leading-snug text-muted">{o.note}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
