"use client";

import { useStore } from "@/components/providers/store-provider";
import type { Season } from "@/lib/types";

/**
 * Seasonal look for the storefront. The admin picks Original, Christmas or Halloween;
 * colours come from CSS variables under [data-season] and the decorations below are
 * purely visual (aria-hidden, no pointer events, off with reduced motion).
 */

// Fixed pseudo-random numbers so the server and the browser draw the same flakes.
function series(count: number, seed: number) {
  let s = seed;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: count }, () => [next(), next(), next(), next(), next()]);
}
const FLAKES = series(34, 7);
const BATS = series(5, 31);

export function useSeason(): Season {
  return useStore().data.settings.season ?? "original";
}

/** Wraps the storefront so every colour follows the chosen season. */
export function SeasonRoot({ children }: { children: React.ReactNode }) {
  const season = useSeason();
  return (
    <div data-season={season} className="contents">
      {children}
      <SeasonSky season={season} />
    </div>
  );
}

/** Falling snow at Christmas, bats crossing the screen at Halloween. */
export function SeasonSky({ season }: { season: Season }) {
  if (season === "christmas") return <Snow />;
  if (season === "halloween") return <Bats />;
  return null;
}

/** Short seasonal words, used by the hero, the ribbon and the admin. */
export const SEASON_WORDS: Record<Exclude<Season, "original">, { badge: string; ribbon: string; hello: string }> = {
  christmas: { badge: "أجواء الأعياد", ribbon: "أجواء الشتاء والأعياد في تزهّد", hello: "أجواء الأعياد مفعّلة في متجرك ❄️" },
  halloween: { badge: "ليلة الهالوين", ribbon: "ليلة الهالوين في تزهّد", hello: "أجواء الهالوين مفعّلة في متجرك 🎃" },
};

/** A small snowflake or pumpkin, used as a bullet and next to headings. */
export function SeasonIcon({ season, className = "size-3.5" }: { season: Season; className?: string }) {
  if (season === "christmas")
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3" />
      </svg>
    );
  if (season === "halloween")
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d="M12 6c-1-2 0-4 2-4" fill="none" stroke="#6b8f2a" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="8" cy="14" rx="5.5" ry="7" fill="currentColor" />
        <ellipse cx="16" cy="14" rx="5.5" ry="7" fill="currentColor" />
        <ellipse cx="12" cy="14" rx="5" ry="7.5" fill="currentColor" />
        <path d="M8 12l2 2H6zM16 12l2 2h-4zM8 17q4 3 8 0l-2 .5-1-1-1 1-1-1-1 1z" fill="#1d1526" />
      </svg>
    );
  return null;
}

function Snow() {
  return (
    <div className="season-snow" aria-hidden>
      {FLAKES.map(([x, size, dur, delay, drift], i) => (
        <i
          key={i}
          className={i % 5 === 0 ? "flake-star" : undefined}
          style={
            {
              "--x": `${(x * 100).toFixed(2)}%`,
              "--s": `${(i % 5 === 0 ? 12 + size * 8 : 4 + size * 5).toFixed(1)}px`,
              "--d": `${(10 + dur * 12).toFixed(1)}s`,
              "--delay": `${(-delay * 22).toFixed(1)}s`,
              "--drift": `${((drift - 0.5) * 120).toFixed(0)}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

const BAT_PATH =
  "M0 6C3 2 6 2 8 5c1-2 2-3 3-2l1-2 1 2c1-1 2 0 3 2 2-3 5-3 8 1-3-1-5 0-6 3-2-2-4-1-6 1-2-2-4-3-6-1-1-3-3-4-6-3Z";

function Bats() {
  return (
    <div className="season-bats" aria-hidden>
      {BATS.map(([y, size, dur, delay], i) => (
        <span
          key={i}
          style={
            {
              "--y": `${(8 + y * 55).toFixed(1)}vh`,
              "--s": `${(26 + size * 26).toFixed(0)}px`,
              "--d": `${(14 + dur * 12).toFixed(1)}s`,
              "--delay": `${(-delay * 26).toFixed(1)}s`,
            } as React.CSSProperties
          }
        >
          <svg viewBox="0 0 24 11">
            <path d={BAT_PATH} />
          </svg>
        </span>
      ))}
    </div>
  );
}

/** A string of lights along the bottom of the header (and a little spider at Halloween). */
export function SeasonTrim() {
  const season = useSeason();
  if (season === "original") return null;
  return (
    <div className="season-lights" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <i key={i} />
      ))}
      {season === "halloween" && (
        <span className="season-spider">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="10" r="4" />
            <circle cx="12" cy="16" r="5" />
            <path d="M8 13 2 9M8 15 1 15M8 17 2 21M16 13l6-4M16 15h7M16 17l6 4" strokeWidth="1.6" fill="none" stroke="currentColor" />
          </svg>
        </span>
      )}
    </div>
  );
}

/** Decoration hung inside the dark hero: baubles at Christmas, pumpkins and a web at Halloween. */
export function SeasonHeroDecor() {
  const season = useSeason();
  if (season === "christmas")
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0" aria-hidden>
        {[
          ["8%", "47%", "5.5rem", "#b3262d", "0s"],
          ["20%", "53%", "8rem", "#d4b26a", "-1.4s"],
          ["32%", "59%", "4rem", "#2c6a4a", "-0.7s"],
        ].map(([end, endLg, len, color, delay]) => (
          <span key={end} className="bauble" style={{ "--e": end, "--e-lg": endLg, "--len": len, "--c": color, animationDelay: delay } as React.CSSProperties} />
        ))}
      </div>
    );
  if (season === "halloween")
    return (
      <>
        <svg className="pointer-events-none absolute top-0 start-0 z-0 size-40 text-ink/20 sm:size-56" viewBox="0 0 100 100" aria-hidden>
          <g fill="none" stroke="currentColor" strokeWidth="0.7">
            <path d="M0 0 100 0M0 0 0 100M0 0 92 38M0 0 70 70M0 0 38 92" />
            {[18, 34, 52, 72].map((r) => (
              <path key={r} d={`M${r} 0 Q${r * 0.8} ${r * 0.22} ${r * 0.92} ${r * 0.38} Q${r * 0.62} ${r * 0.5} ${r * 0.7} ${r * 0.7} Q${r * 0.5} ${r * 0.62} ${r * 0.38} ${r * 0.92} Q${r * 0.22} ${r * 0.8} 0 ${r}`} />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 h-0" aria-hidden>
          <span className="pumpkin" style={{ insetInlineEnd: "6%" }} />
          <span className="pumpkin pumpkin-sm" style={{ insetInlineEnd: "16%", animationDelay: "-2s" }} />
        </div>
      </>
    );
  return null;
}
