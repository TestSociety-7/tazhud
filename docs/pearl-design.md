# Pearl & Moon — Tazhud design language (2026 redesign)

Tazhud is an Arabic RTL modest-wear shop (khimars, prayer clothes). Customers order through WhatsApp. Most visitors are on phones.
This style must look clearly different from the old one (ivory/forest/gold, mihrab arches, mandalas) and from the
owner's other site babytoti.store (warm brown, playful kids shop).

## Mood
Moonlit silk and mother-of-pearl. Calm, luxurious, modern. Midnight navy surfaces, pearl-white pages, rose-gold
and iridescent (pink → lavender → mint → peach) highlights. Motion feels like fabric: soft, springy, layered depth.

## Tokens (Tailwind classes keep the old names so seasons keep working)
- `bg-ivory` pearl page background (#f4f1f6), `bg-paper` cards (#fcfbfd), `bg-sand` muted fill, `border-line`
- `bg-ink` / `text-ink` midnight (#0c1024), `ink-2` slightly lighter navy
- `forest` = deep indigo (#232a5c) for primary buttons / strong accents, `forest-2` lighter
- `gold`, `gold-bright`, `gold-soft`, `gold-deep` = rose gold family
- `iris` (#9c8cf2) lavender, `mint` (#bfe9e3)
- Do NOT hard-code the old greens/golds (#1f3a2e, #b8955a, #0f120f…). Use tokens so the Christmas/Halloween seasons can recolor.

## Fonts
- `font-display` = Reem Kufi (modern geometric Kufi) for headings
- body = Readex Pro
- `font-latin` = Manrope (numbers, Latin words)
- `[font-family:var(--font-callig)]` = Aref Ruqaa calligraphy, ONLY for one or two hero-sized accent words.
- Never use letter-spacing on Arabic text.

## Shared classes (app/styles/pearl.css, already written — reuse them)
- `.glass` (light frosted panel), `.glass-dark` (navy frosted panel)
- `.pearl-text` (shimmering text on dark), `.pearl-text-deep` (on light)
- `.pearl-ring` (animated iridescent outline, needs a rounded box)
- `.btn .btn-pearl` (glossy pearl CTA), `.btn .btn-glass` (on dark), existing `.btn-primary` (indigo gradient), `.btn-gold`, `.btn-outline`, `.btn-ghost`
- `.leaf` / `.arch` = leaf shape (2rem/0.75rem alternating corners) — the product photo shape. `.arch-full` = tall capsule top. `.capsule` = full pill.
- `.shine-follow` + set `--mx`, `--my` (percent) and `--shine: 1` from pointer events → light follows the finger.
- `.float-3d`, `.moon-glow`, `.orbit-bead`, `.index-num`
- existing: `.press` (tap scale), `.tilt` + `<Tilt>` (3D lean, mouse only), `<Reveal>` (scroll reveal), `.stagger`, `.admin-enter`, `.card`, `.field`, `.label`, `.hint`
- Season hooks that must stay on the elements that use them: `.season-title`, `.season-rule`, `.season-band`, `.season-chip`, `.season-footer-edge`, `.logo-mark`, `data-season` wrappers.

## Rules
- Phone first (test at 390×844). Big tap targets (≥44px), thumb-reachable primary actions, no horizontal page scroll.
- Motion: transform/opacity only, 200–600ms, `var(--ease-soft)` or `var(--ease-spring)`. Respect `prefers-reduced-motion`.
- Keep every feature and every piece of logic working: only change markup/classes/styles unless a change is needed for the new layout.
- Keep Arabic copy as is unless it is visual decoration.
- No console errors or hydration warnings.
- Put new page-specific CSS in your own file (`app/styles/store-pages.css` for storefront pages, `app/styles/admin.css` for admin). Do not edit `app/globals.css` or `app/styles/pearl.css` (owned by the lead).
