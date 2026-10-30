"use client";

import { Check } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import type { Season } from "@/lib/types";
import { Panel } from "./ui";
import { useSave } from "./use-save";

/** Each look's fixed colours, only used to draw its small preview. */
type Look = { page: string; ink: string; primary: string; accent: string; extra: string };

const OPTIONS: { id: Season; label: string; note: string; look: Look; tilt: string }[] = [
  {
    id: "original",
    label: "الأصلي",
    note: "لؤلؤي وكحلي وذهبي وردي",
    look: { page: "#f4f1f6", ink: "#0c1024", primary: "#232a5c", accent: "#c4907f", extra: "#9c8cf2" },
    tilt: "14deg",
  },
  {
    id: "christmas",
    label: "الكريسماس",
    note: "ثلج وأضواء وزينة",
    look: { page: "#f4f1f6", ink: "#0c1024", primary: "#174030", accent: "#c0303a", extra: "#e9c46a" },
    tilt: "0deg",
  },
  {
    id: "halloween",
    label: "الهالوين",
    note: "خفافيش وقرع وألوان الليل",
    look: { page: "#f4f1f6", ink: "#120d18", primary: "#3b2452", accent: "#f08a24", extra: "#9d5cd6" },
    tilt: "-14deg",
  },
];

/** A tiny phone screen drawn in the season's colours. */
function Preview({ id, look }: { id: Season; look: Look }) {
  const vars = { "--sv-page": look.page, "--sv-ink": look.ink } as React.CSSProperties;
  return (
    <span className="season-screen block" style={vars} aria-hidden>
      {/* Hero */}
      <span className="absolute inset-x-0 top-0 block h-[58%] overflow-hidden" style={{ background: `radial-gradient(90% 70% at 80% 10%, ${look.primary}, ${look.ink} 75%)` }}>
        <span className="absolute inset-x-2 top-2 flex items-center justify-between">
          <span className="block size-2.5 rounded-full" style={{ background: id === "original" ? "linear-gradient(135deg,#f7dbe4,#ddd6fb,#cdeeee)" : look.accent }} />
          <span className="block h-1 w-6 rounded-full bg-white/40" />
        </span>
        {/* Moon / pearl */}
        <span
          className="absolute top-[26%] start-1/2 block size-[42%] -translate-x-1/2 rounded-full rtl:translate-x-1/2"
          style={{
            background:
              id === "halloween"
                ? `radial-gradient(circle at 35% 30%, #ffd9a8, ${look.accent} 70%)`
                : id === "christmas"
                  ? `radial-gradient(circle at 35% 30%, #fff, ${look.extra} 80%)`
                  : "radial-gradient(circle at 32% 28%, #fff, #f6dfd5 35%, #ddd6fb 65%, #ecb9a5)",
            boxShadow: `0 0 18px 2px ${id === "original" ? "rgb(246 223 213 / 0.55)" : `${look.accent}88`}`,
          }}
        />
        <span className="absolute inset-x-3 bottom-2.5 block h-1.5 rounded-full bg-white/70" />
        <span className="absolute start-3 bottom-5 block h-1 w-1/2 rounded-full bg-white/35" />
        {id === "christmas" && (
          <span className="sv-snow absolute inset-0">
            {[12, 30, 52, 70, 86, 42].map((x, i) => (
              <i key={x} style={{ left: `${x}%`, top: 0, animationDelay: `${-i * 0.55}s` }} />
            ))}
          </span>
        )}
        {id === "halloween" && (
          <>
            <span className="sv-stars absolute inset-0">
              {[10, 28, 64, 82].map((x, i) => (
                <i key={x} style={{ left: `${x}%`, top: `${12 + (i % 2) * 18}%`, animationDelay: `${-i * 0.6}s` }} />
              ))}
            </span>
            <svg viewBox="0 0 24 12" className="absolute top-[14%] end-[14%] w-5 fill-black/80">
              <path d="M12 4c-1-2-3-3-5-2 1 1 1 2 0 3-2-1-4 0-5 2 2 0 3 1 4 2 1-1 3-1 4 0l2-2 2 2c1-1 3-1 4 0 1-1 2-2 4-2-1-2-3-3-5-2-1-1-1-2 0-3-2-1-4 0-5 2z" />
            </svg>
          </>
        )}
        {id === "original" && (
          <span className="absolute top-1/2 start-1/2 block h-[22%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/45 rtl:translate-x-1/2 [transform:rotate(-12deg)]" />
        )}
      </span>
      {/* Product tiles and a button */}
      <span className="absolute inset-x-2 bottom-2 top-[62%] grid grid-cols-2 gap-1.5">
        <span className="leaf block bg-white shadow-sm" style={{ boxShadow: `inset 0 -10px 0 ${look.primary}22` }} />
        <span className="leaf block bg-white shadow-sm" style={{ boxShadow: `inset 0 -10px 0 ${look.accent}33` }} />
        <span className="col-span-2 block h-2.5 self-end rounded-full" style={{ background: id === "original" ? "linear-gradient(115deg,#f7dbe4,#ddd6fb,#cdeeee,#f9e7d3)" : look.accent }} />
      </span>
      <span className="sv-gloss" />
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
    <Panel title="مظهر المتجر" description="اضغط على الشكل الذي تريده. يتغيّر المتجر ولوحة الإدارة معًا.">
      <div role="radiogroup" aria-label="مظهر المتجر" className="season-stage grid grid-cols-3 gap-2.5 sm:gap-5">
        {OPTIONS.map((o) => {
          const on = o.id === current;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(o.id)}
              className="season-card group relative flex flex-col items-center text-center"
              style={{ "--ry": o.tilt } as React.CSSProperties}
            >
              <span className={`relative block w-full max-w-[9.5rem] rounded-[1.4rem] p-1 transition-colors ${on ? "pearl-ring" : ""}`}>
                <Preview id={o.id} look={o.look} />
                {on && (
                  <span className="season-check absolute -top-1.5 -end-1.5 z-10 grid size-7 place-items-center rounded-full bg-forest text-ivory shadow-[0_0_0_3px_var(--color-paper),0_6px_14px_-4px_var(--color-forest)]">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className={`mt-2.5 text-sm font-semibold ${on ? "text-ink" : "text-muted"}`}>{o.label}</span>
              <span className="mt-0.5 text-[0.68rem] leading-snug text-muted">{o.note}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
