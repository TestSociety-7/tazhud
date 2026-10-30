# Atelier — Tazhud design notes

**Idea:** the tailor's workroom. Tazhud sells cloth you wear (hijabs, khimars, prayer clothes), so the site is built from the
things around a cutting table: a hanging length of fabric, pins, a saffron running stitch, pinking-shear zigzag edges,
paper swing tags and a measuring tape. Light, calm and phone-first. Different from babytoti.store (warm brown, kids,
bottom nav bar): mulberry and chalk rose, no bottom nav bar, grown-up and quiet.

## Signature
The home hero is a real piece of cloth (WebGL cloth simulation) printed with the hero product photo, hanging from a brass
rod. It sways when the page scrolls and ripples when a finger swipes across it. Everything else stays quiet.

## Tokens (names unchanged so the seasons still work)
| token | value | role |
|---|---|---|
| ivory | #f6eeee | chalk rose page |
| paper | #fffafa | cards, sheets |
| sand | #eddfe1 | soft fills |
| line | #e4d0d5 | borders |
| ink / ink-2 | #2a0f1d / #3d1428 | mulberry-black text and dark panels |
| forest / forest-2 | #6d2347 / #85305a | mulberry, the primary colour |
| gold family | #d39b2a saffron thread, bright #e9b949, soft #f5e1b0, deep #8f6210 | stitches, accents. Use gold-deep for text on light. |
| sage / sage-soft | #9fb3a1 / #e1e8df | quiet secondary |

Fonts: **Marhey** (`font-display`, tailor's chalk handwriting, titles only), **IBM Plex Sans Arabic** (body),
**Courier Prime** (`font-latin`, typewriter tags: prices, codes, order numbers).

## Shared classes (app/styles/atelier.css)
- `.stitch` (saffron running stitch line), `.stitch-mulberry`, `.stitch-draw` (sews in when its `[data-reveal]` shows)
- `.stitch-box` / `.stitch-box-soft` (dashed stitch just inside a panel's edge)
- `.pinked` (zigzag bottom edge), `.pinked-all` (zigzag on all sides, for coupons/swatches)
- `.swing-tag` (+ `.swing-tag-dark`) paper price tag with a punched hole
- `.woven-label` mulberry ribbon label (badges like "جديد")
- `.pin-head` (set `--pin` for colour)
- `.swatch` card base, `.chalk` display heading
- `.btn-primary` / `.btn-gold` now carry an inner dashed stitch. Buttons are soft rectangles (0.95rem), not pills.
- `.arch` is now a cut cloth piece (rounded top corners), not a mihrab arch.

## Motion
Personality: premium and calm, like fabric settling. Signature easing `--ease-soft: cubic-bezier(0.32, 0.72, 0, 1)`.
Durations 180ms (press), 360ms (cards, sheets), 600ms (reveals). Entrances longer than exits. Stagger total under 400ms.
Reduced motion: the cloth is replaced by a still photo, stitches are shown drawn, nothing sways.
