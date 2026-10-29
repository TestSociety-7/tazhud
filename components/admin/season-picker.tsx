"use client";

import { Check } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import type { Season } from "@/lib/types";
import { Panel } from "./ui";
import { useSave } from "./use-save";

const OPTIONS: { id: Season; label: string; note: string; swatch: string[]; icon: string }[] = [
  { id: "original", label: "الأصلي", note: "الذهبي والأخضر المعتاد", swatch: ["#0f120f", "#b8955a", "#1f3a2e"], icon: "✦" },
  { id: "christmas", label: "الكريسماس", note: "ثلج يتساقط وأضواء وزينة", swatch: ["#174030", "#c0303a", "#e9c46a"], icon: "❄" },
  { id: "halloween", label: "الهالوين", note: "خفافيش وقرع وألوان الليل", swatch: ["#120d18", "#f08a24", "#9d5cd6"], icon: "☾" },
];

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
    <Panel title="مظهر المتجر" description="اختر الشكل الذي يراه الزبائن. لوحة الإدارة تتزيّن معه أيضًا.">
      <div role="radiogroup" aria-label="مظهر المتجر" className="grid grid-cols-3 gap-2 sm:gap-3">
        {OPTIONS.map((o) => {
          const on = o.id === current;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(o.id)}
              className={`press group relative overflow-hidden rounded-2xl border p-2 text-start transition-all duration-300 sm:p-3 ${
                on ? "border-gold bg-paper shadow-[0_14px_30px_-18px_rgb(127_98_48/0.8)]" : "border-line bg-paper/60 hover:border-gold/60"
              }`}
            >
              <span className="relative block aspect-[4/3] overflow-hidden rounded-xl" style={{ background: o.swatch[0] }} aria-hidden>
                <span className="absolute -bottom-3 start-1/2 h-14 w-10 -translate-x-1/2 rounded-t-full rtl:translate-x-1/2" style={{ background: o.swatch[2] }} />
                <span className="absolute top-2 end-2 grid size-6 place-items-center rounded-full text-xs" style={{ background: o.swatch[1], color: o.swatch[0] }}>
                  {o.icon}
                </span>
                <span className="absolute inset-x-2 top-2 h-1 w-8 rounded-full opacity-80" style={{ background: o.swatch[1] }} />
              </span>
              <span className="mt-2 flex items-center justify-between gap-1">
                <span className="text-sm font-semibold text-ink">{o.label}</span>
                {on && (
                  <span className="grid size-5 place-items-center rounded-full bg-gold text-ink">
                    <Check className="size-3.5" />
                  </span>
                )}
              </span>
              <span className="mt-0.5 hidden text-[0.7rem] leading-snug text-muted sm:block">{o.note}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
