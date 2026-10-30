# Reels — Tazhud's second design option (2026)

Tazhud is an Arabic RTL modest-wear shop (khimars, prayer clothes) that takes orders over WhatsApp. Almost every visitor is on a phone, and many arrive from Instagram.
The owner already has one new option, called "Pearl & Moon", which is navy, pearl and silk. This second option must feel completely different. The idea is **a shop that feels like Instagram Reels or TikTok**. It is dark, immersive and full-screen, swipe-first, with bold type, neon rose accents and fast springy motion. The UI should feel native to a phone, like a 2026 social app, not like a website.

## Tokens: the light and dark names are swapped on purpose
- `bg-ivory` is now the **dark page** (#0a0a0d). `bg-paper` is the dark card (#141419), `bg-sand` a lighter dark fill (#1d1d24), and `border-line` (#2b2b35).
- `text-ink` / `bg-ink` is now **near-white** (#f6f6f8). `text-text` is the body text (light) and `text-muted` is grey.
- So the old "dark bands" (`bg-ink text-ivory`, `.on-dark`) now render as **bright white bands with dark text**. Decide each one: keep it as a bright accent, or change it to a dark surface (`bg-paper`/`bg-sand` with `text-ink`).
- `forest` is the primary button colour, now **white** (`.btn-primary` gives white with dark text).
- The `gold` family is now **neon rose** (#ff5c7a; bright #ff86a0, soft #ffd3dc, deep #ff3d64). Also available: `volt` (#c8ff3e, lime, for small highlights only) and `sky` (#5cc8ff).
- Never hard-code white/black or the old greens and golds where a token fits, because the Christmas and Halloween seasons recolor the tokens. Plain `white`/`black` with opacity is fine for overlays on photos.

## Fonts
- `font-display` is Alexandria: bold, geometric, social-app headlines. Use heavy weights (700–900) and tight leading for big titles.
- The body font is IBM Plex Sans Arabic.
- `font-latin` is Alexandria too (numbers, prices).
- Never use letter-spacing on Arabic.

## Shared classes (app/styles/reels.css, owned by the lead — reuse them, don't edit)
- `.glass-dark`: a blurred dark panel, for UI over photos.
- `.chip`: a pill tag.
- `.neon-text`: rose gradient text.
- `.neon-ring`: an animated rose/violet outline. It needs a rounded box.
- `.btn-neon`: rose gradient CTA with glow.
- `.pop`: springy scale on tap.
- `.heart-burst`: the double-tap heart animation.
- From globals: `.btn .btn-primary` (white), `.btn-gold` (rose gradient), `.btn-outline`, `.btn-ghost`, `.press`, `.card`, `.field`, `.label`, `.hint`, `.arch` (now 1.4rem rounded photo), `<Reveal>`, `.stagger`, `.admin-enter`.
- Season hooks to keep on the elements that already use them: `.season-title`, `.season-rule`, `.season-band`, `.season-chip`, `.season-footer-edge`, `.logo-mark`, and the `data-season` wrappers.

## Rules
- **Phone first.** Test at 390×844. Use full-bleed photos, thumb-zone actions, 44px+ tap targets and no horizontal page scroll.
- **Motion** uses transform/opacity only and springy easing (`var(--ease-spring)` for taps, `var(--ease-soft)` for moves), at 150–500ms. Respect `prefers-reduced-motion`.
- **Keep every feature and all logic working.** Change markup, classes and styles only, except where a new layout needs a small change.
- **Keep Arabic copy as is.**
- **No console errors or hydration warnings.**
- **Put new page-specific CSS in your own file.** Use `app/styles/store-pages.css` for storefront pages and `app/styles/admin.css` for admin. Do not edit `app/globals.css` or `app/styles/reels.css`.
- **The phone bottom bar.** The lead adds a fixed black tab bar on phones, about 4.25rem tall plus the safe area. It shows on most store pages and is hidden on /product/*, /cart and /checkout. Pages where it shows need bottom padding (`pb-24` or more on phones). Pages where it's hidden put their own sticky action bar at the very bottom.
