# Tazhud — modest fashion storefront & studio admin

A mobile-first ecommerce site for **Tazhud (تزهّد)**, a modest-fashion brand selling hijabs, abayas and modest clothing. The whole site and admin are in **Arabic, right-to-left**. Customers browse, build a bag and check out by sending a prefilled order message on **WhatsApp**. There is no online payment. A built-in admin lets the owner manage products, promotions, homepage content, contact details and order inquiries.

- **Stack:** Next.js 16 (App Router, Cache Components, `proxy.ts`), React 19, Tailwind CSS 4, TypeScript 6
- **Hosting:** Vercel (zero config)
- **Brand:** black-and-gold mandala logo, warm ivory, deep forest, muted sage and gold; El Messiri (headings) + IBM Plex Sans Arabic (text), Cormorant Garamond for the Latin wordmark
- **Language:** Arabic, `dir="rtl"`, Western digits (`ar-u-nu-latn`). Storefront copy addresses customers in the feminine form.

> **Important:** admin edits are shared with every visitor **only when a Vercel Blob store is connected** (`BLOB_READ_WRITE_TOKEN`). Without it the site runs in **local demo mode**, where edits stay in the browser that made them. Read [Data persistence](#data-persistence) before launching.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional, see below
npm run dev                   # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run check` | Lint, typecheck and build in one go |
| `npm run generate:art` | Regenerates the illustrated placeholder artwork in `public/art` |

Requires Node.js 20.9 or newer.

## What's included

### Storefront
- **Home:** announcement bar, hero image and headline, a slow ribbon of store promises, categories, new arrivals, all products with category tabs, an optional promotion banner with a copyable code and a three-step “how to order” card. Section order, titles and visibility are editable in the admin. On phones the category and new-arrival carousels turn like a 3D wheel as they scroll (browsers with scroll-driven animations).
- **Signature motion:** a short opening the first time someone visits in a session (the logo coin turns in, then two gold-edged doors part), soft page fades, a thin gold reading-progress line under the header and a WhatsApp button that slides away while scrolling down. All of it is off with reduced motion and never blocks taps.
- **Seasons:** Original, Christmas (falling snow, header lights, swinging baubles, pine and berry accents) or Halloween (bats, a spider, cobweb, glowing pumpkins, pumpkin and night-purple colours), chosen with one tap on the admin dashboard.
- **Shop** (`/shop`): category filters, search, sort (suggested, newest, price), on-sale / in-stock / colour filters, mobile filter sheet. Filters live in the URL so they can be shared.
- **Product pages** (`/product/[slug]`): a back button on phones, an “added to bag” sheet asking “checkout or keep shopping” (keep shopping returns to the same list, tab and scroll position), swipeable gallery with thumbnails and hover zoom, colour and size selection with validation, stock status, quantity, sale pricing, “Ask on WhatsApp”, details accordions, related products and a sticky mobile add-to-bag bar.
- **Bag** (`/cart`) and slide-out bag drawer: quantity updates, remove, coupon codes when switched on in settings (percent, fixed, free delivery, minimum spend, expiry), free-delivery progress, order summary.
- **Checkout** (`/checkout`): name, phone, address, city and notes with accessible validation. On submit WhatsApp opens with a formatted order receipt (order number, items with colour/size, totals in ₪, delivery details), and the inquiry is saved for the admin.
- **Policies** (`/policies`): delivery, returns, payment and care (default text from `lib/seed.ts`).
- **Installable:** the store and the admin each have a web app manifest and icons, so both can be added to a phone home screen as separate apps.
- Accessible by design: semantic landmarks, skip link, labelled controls, visible gold focus rings, native `<dialog>` sheets with focus trapping, 44px touch targets, `prefers-reduced-motion` support, loading / empty / error / success states and image fallbacks.

### Admin (`/admin`)
- **Welcome:** each time the admin is opened (and right after signing in) a short greeting with the logo inside two gold rings turning in 3D, the time of day and the number of new orders. Tap to skip.
- **New-order notifications:** in Settings, “تفعيل الإشعارات” turns on push notifications for that phone or computer (on iPhone, install the admin to the home screen first). A notification arrives the moment a customer’s order is saved, even with the admin closed; tapping it opens the order. While the admin is open it also checks for new orders every 30 seconds, plays a soft chime, shows a toast and puts the count on the app icon. Needs Vercel Blob; the push keys are derived from `ADMIN_SESSION_SECRET`, so there is nothing else to configure. “إرسال إشعار تجريبي” checks it works.
- **Dashboard:** time-of-day greeting with the logo as a turning 3D coin (the same logo animation is used across the store and admin), animated counters for new orders, 30-day sales, products and low stock (cards tilt in 3D under the mouse), latest orders and low-stock items. Motion is switched off for visitors who ask for reduced motion.
- **Order inquiries:** filter by status, search, detail view with items and totals, status workflow (new → contacted → confirmed → completed / cancelled), internal notes, “Message customer” on WhatsApp, copy order text, delete one, or delete all orders (or all in the current status) after a confirmation. Customers always complete the order on WhatsApp.
- **Phone-first layout:** bottom tab bar (home, orders, quick “add product”, products, more; “more” holds only the remaining screens plus “install app”), bottom-sheet dialogs, sticky save bar and large touch targets.
- **Products:** create, edit, duplicate, show/hide, mark sold out, delete (with undo). On phones, swipe a product row to reveal “sold out” and “delete”. The editor is one simple column: photos, name, price, quantity and category (tap a chip), then colours and sizes, visibility, and an optional “more details” box. Status filters (visible, hidden, low, sold out), a select mode to hide/show/sell out/delete many at once, and “delete all sold-out” with a confirmation. “Save as draft” or “Save and publish”. Name, tagline, description, details, price, sale price, images (upload several at once from the gallery or camera, or paste a URL; reorderable), category, sizes (with presets), colours (with swatches and an optional photo per colour: choosing the colour on the product page slides to that photo and the bag shows it), stock, SKU and a “new arrival” flag. Unsaved-changes guard.
- **Categories, Coupons:** full create / edit / delete with confirmations.
- **Storefront (واجهة المتجر):** hero image, headline and button, announcement messages, promotion banner and its coupon, section order and visibility.
- **Settings:** store name, **WhatsApp number** (with test link), **Instagram link**, a coupons on/off switch (off hides the home promo banner and the coupon box), delivery fee, free-delivery threshold and delivery note. Prices are always in Israeli shekel (₪).

Every save, delete and publish action shows a confirmation toast; destructive actions ask first.

## Admin access

The admin is protected by a **single shared passcode**:

1. `proxy.ts` checks for a signed, `httpOnly`, `Secure`, `SameSite=Lax` session cookie (`__Host-` prefixed in production) on every `/admin` route and redirects to `/admin/login` without it. Every `/api/admin/*` route checks the same cookie on the server.
2. `POST /api/admin/login` compares the passcode in constant time and sets the cookie (7 days). The cookie is HMAC-signed with a key made from `ADMIN_SESSION_SECRET` and the passcode, so changing either signs every device out.
3. After 5 wrong passcodes an IP is locked out for 15 minutes (in-memory per server instance, so it slows guessing; the long passcode is what makes guessing hopeless).
4. In production, if `ADMIN_PASSCODE` is not set, sign-in is switched off. Locally the passcode `tazhud-demo` is used.
5. Requests that change data must come from the site's own pages (the `Origin` header is checked), which blocks cross-site request forgery.

Other protections: security headers on every page (Content-Security-Policy, HSTS, no framing, nosniff, strict referrer), admin pages and API answers are `no-store`; photo uploads accept only JPEG/PNG/WebP/AVIF up to 8 MB in `products/`; the public orders endpoint is rate-limited, checks origin and recalculates prices from the saved catalogue; links entered in the admin may only be site paths or http(s) URLs; orders are stored under an unguessable folder derived from `ADMIN_SESSION_SECRET`.

This is a single-passcode gate, not individual accounts. Use a long random passcode (16+ characters), and add a real auth provider (for example Clerk or Auth.js) if several people will manage the store.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSCODE` | Yes (production) | Admin passcode, 16+ random characters. Unset in production = admin sign-in is off; unset locally = `tazhud-demo`. |
| `ADMIN_SESSION_SECRET` | Recommended | Long random string used to sign the admin cookie (`openssl rand -base64 32`). |
| `BLOB_READ_WRITE_TOKEN` | For launch | Added automatically when you connect a Vercel Blob store to the project. Turns on shared storage. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Public address used for sharing previews and the sitemap. Defaults to `https://tazhud.store`. |

Set them in **Vercel → Project → Settings → Environment Variables**, then redeploy. Never commit real values; `.env*` files are git-ignored except `.env.example`.

## WhatsApp & Instagram

- The WhatsApp number ships as a **placeholder** (`+1 555 010 2030`). Change it in **Admin → Store settings → WhatsApp & social**. Enter the full international number (e.g. `+971 50 123 4567`); it is stored as digits only, as `wa.me` requires. Use **Test** to check it opens your chat.
- Instagram is set to [@tazhudd](https://www.instagram.com/tazhudd/).
- The order message format lives in `lib/whatsapp.ts` (`buildOrderMessage`).

With shared storage connected, these settings change for every visitor when you save. In local demo mode they only change in the browser where you edit them.

## Data persistence

All store data goes through one interface, `StoreRepository` in `lib/repository.ts`. `createRepository()` picks one of two implementations:

### Shared storage (Vercel Blob), used when `BLOB_READ_WRITE_TOKEN` is set

- **Catalogue** (products, categories, coupons, homepage, settings) is one JSON file, `store/catalog.json`. The storefront reads it on the server (cached, refreshed by tag as soon as the admin saves, so changes show within about a minute at most).
- **Product photos** upload straight from the admin to Blob (`/api/admin/upload`, admin session required; JPEG, PNG, WebP, AVIF or GIF up to 15 MB).
- **Order inquiries** from checkout are saved one file each in a folder whose name is derived from `ADMIN_SESSION_SECRET`, and are read only through the admin API. Customers still complete every order on WhatsApp, which stays the source of truth.
- Blob stores are public-read: anyone who knows a file's exact URL can open it. Order files sit under an unguessable folder name, but do not treat this as encrypted storage. Keep `ADMIN_SESSION_SECRET` secret and stable (changing it hides earlier orders).
- Until the admin saves for the first time, visitors see the starter catalogue in `lib/seed.ts`.

**To connect it:** Vercel → project `tazhud` → **Storage** → **Create Database** → **Blob** → connect it to the project for all environments → **Deployments → Redeploy**. The admin's settings page then says “التخزين المشترك مفعّل”.

### Local demo mode, used when there is no Blob token

- Data is kept in the visiting browser's `localStorage` under `tazhud:store:v3`. The bag is stored under `tazhud:cart:v1`.
- Customers see the starter catalogue. Admin edits appear only in the same browser. This is **not** shared, backed up or secure.
- Uploaded images are kept as data URLs in the browser (roughly 5 MB total), so this mode is only for trying things out.

Back up shared data from **Vercel → Storage → your Blob store**, where every file can be downloaded.

## Product photography

The starter catalogue uses **illustrated placeholder artwork** (`public/art`, generated by `scripts/generate-art.mjs`) so the site looks complete on first launch. Replace it with real photos per product in **Admin → Products** (upload from the phone gallery or camera, or paste an image URL). Portrait 4:5 images around 1200×1500 work best. Any image that fails to load shows a styled fallback instead of a broken image.

The logo in `public/brand/tazhud-logo.jpg` is 150×150 px. A larger version (1000px+, ideally a transparent PNG or SVG) will look sharper; replace that file and `app/icon.png` / `app/apple-icon.png`.

## Deploying to Vercel

The project is a standard Next.js app; no `vercel.json` is needed.

1. In Vercel, **Add New → Project**, import the `tazhud` GitHub repository (framework is detected as Next.js).
2. Add `ADMIN_PASSCODE` and `ADMIN_SESSION_SECRET` under **Environment Variables** (Production and Preview).
3. Create and connect a **Blob** store under **Storage** (see [Data persistence](#data-persistence)).
4. Deploy. Every push to `main` deploys production; other branches get preview URLs.
5. Optionally add a custom domain under **Settings → Domains**.

## Project structure

```
app/
  (store)/          storefront routes: home, shop, product/[slug], cart, checkout, policies
  admin/login/      admin sign-in
  admin/(panel)/    admin routes behind proxy.ts
  api/admin/        login, logout, data, catalogue, orders and image-upload routes (admin only)
  api/orders        public checkout inquiry
components/
  providers/        StoreProvider (data) and CartProvider (bag)
  store/            storefront UI
  admin/            admin shell, pages and form primitives
  ui/               shared primitives: SmartImage, Sheet, Reveal, Mandala, Price…
lib/
  types.ts          data model
  seed.ts           starter catalogue, settings and sample inquiries
  repository.ts     StoreRepository: shared (Blob) and local demo implementations
  server/           Blob storage helpers and admin API guard
  arabic.ts         Arabic plurals and date formatting
  commerce.ts       pricing, stock, coupons, delivery
  whatsapp.ts       wa.me links and order message
  admin-auth.ts     passcode + signed cookie helpers
proxy.ts            protects /admin
scripts/generate-art.mjs
```
