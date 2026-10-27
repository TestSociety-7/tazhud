# Tazhud — modest fashion storefront & studio admin

A mobile-first ecommerce site for **Tazhud**, a modest-fashion brand selling hijabs, abayas and modest clothing. Customers browse, build a bag and check out by sending a prefilled order message on **WhatsApp**. There is no online payment. A built-in admin lets the owner manage products, promotions, homepage content, contact details and order inquiries.

- **Stack:** Next.js 16 (App Router, Cache Components, `proxy.ts`), React 19, Tailwind CSS 4, TypeScript 6
- **Hosting:** Vercel (zero config)
- **Brand:** black-and-gold mandala logo, warm ivory, deep forest, muted sage and gold; Cormorant Garamond + Manrope

> **Important:** the project currently runs in **local demo mode**. Admin edits are saved in the browser that made them (localStorage). They are **not** shared with customers or other devices and are not secure storage. Read [Data persistence](#data-persistence) before launching.

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
- **Home:** rotating announcement bar, black-and-gold hero with parallax and mandala, value strip, shop-by-category, new arrivals, bestsellers, promotion banner with copyable code, curated bundles, brand story, email sign-up and Instagram/WhatsApp follow section. Section order, titles and visibility are editable in the admin.
- **Shop** (`/shop`): category filters, search, sort (featured, newest, bestselling, price), on-sale / in-stock / colour filters, bundles view, mobile filter sheet. Filters live in the URL so they can be shared.
- **Product pages** (`/product/[slug]`): swipeable gallery with thumbnails and hover zoom, colour and size selection with validation, stock status, quantity, sale pricing, “Ask on WhatsApp”, details accordions, related products and a sticky mobile add-to-bag bar.
- **Bag** (`/cart`) and slide-out bag drawer: quantity updates, remove, coupon codes (percent, fixed, free delivery, minimum spend, expiry), free-delivery progress, order summary.
- **Checkout** (`/checkout`): name, phone, address, city and notes with accessible validation. On submit WhatsApp opens with a formatted order message, and the inquiry is saved for the admin.
- **Policies** (`/policies`): delivery, returns, payment and care, editable in the admin.
- Accessible by design: semantic landmarks, skip link, labelled controls, visible gold focus rings, native `<dialog>` sheets with focus trapping, 44px touch targets, `prefers-reduced-motion` support, loading / empty / error / success states and image fallbacks.

### Admin (`/admin`)
- **Dashboard:** new inquiries, inquiry value (30 days), product count, low-stock items, a 14-day inquiry chart, most requested pieces, mailing-list sign-ups and a launch checklist.
- **Order inquiries:** filter by status, search, detail view with items and totals, status workflow (new → contacted → confirmed → completed / cancelled), internal notes, “Message customer” on WhatsApp, copy order text, delete. Customers always complete the order on WhatsApp.
- **Products:** create, edit, duplicate, publish/unpublish, delete (with undo). Name, tagline, description, details, price, sale price, images (URL or upload, reorderable), category, sizes (with presets), colours (with swatches), stock, SKU, featured / new arrival / bestseller flags and bundle membership. Unsaved-changes guard.
- **Categories, Bundles, Coupons:** full create / edit / delete with confirmations.
- **Homepage:** announcement messages, hero copy, buttons and images, promotion banner and its coupon, brand story, section order and visibility.
- **Store settings:** store name, tagline, address, hours, **WhatsApp number** (with test link), **Instagram link**, email, currency and number format, delivery fee, free-delivery threshold, low-stock threshold and store policies. Export / import all data as JSON and reset to starter content.

Every save, delete and publish action shows a confirmation toast; destructive actions ask first.

## Admin access

The admin is protected by a **single shared passcode**:

1. `proxy.ts` checks for a signed, `httpOnly` session cookie on every `/admin` route and redirects to `/admin/login` without it.
2. `POST /api/admin/login` compares the passcode with `ADMIN_PASSCODE` and sets the cookie (7 days). The cookie is HMAC-signed with `ADMIN_SESSION_SECRET`.
3. If `ADMIN_PASSCODE` is **not set**, the demo passcode `tazhud-demo` is used and shown on the sign-in page, and the admin shows a warning banner.

This keeps casual visitors out of the admin screens. It is **not** production-grade authentication: there are no individual accounts, roles, rate limiting or audit log, and because data is stored in the browser, the passcode does not protect any server-side data. For production, add a real auth provider (for example Clerk, Auth.js or Supabase Auth) when you connect a database, and protect the data API with it.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSCODE` | Strongly recommended | Admin passcode. Unset = demo passcode `tazhud-demo`. |
| `ADMIN_SESSION_SECRET` | Recommended | Long random string used to sign the admin cookie (`openssl rand -base64 32`). |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical URL for social sharing metadata. On Vercel the production URL is detected automatically. |

Set them in **Vercel → Project → Settings → Environment Variables**, then redeploy. Never commit real values; `.env*` files are git-ignored except `.env.example`.

## WhatsApp & Instagram

- The WhatsApp number ships as a **placeholder** (`+1 555 010 2030`). Change it in **Admin → Store settings → WhatsApp & social**. Enter the full international number (e.g. `+971 50 123 4567`); it is stored as digits only, as `wa.me` requires. Use **Test** to check it opens your chat.
- Instagram is set to [@tazhudd](https://www.instagram.com/tazhudd/).
- The order message format lives in `lib/whatsapp.ts` (`buildOrderMessage`).

In local demo mode these settings only change in the browser where you edit them. To change them for every visitor right now, edit the defaults in `lib/seed.ts` (`PLACEHOLDER_WHATSAPP`, `seedSettings`) and redeploy, or connect a database.

## Data persistence

All store data goes through one interface, `StoreRepository` in `lib/repository.ts`:

```ts
interface StoreRepository {
  load(): Promise<StoreData>;
  save(data: StoreData): Promise<void>;
  reset(): Promise<StoreData>;
  subscribe(onChange: (data: StoreData) => void): () => void;
}
```

The current implementation, `LocalStorageRepository`, is the **local demo mode**:

- Data is kept in the visiting browser's `localStorage` under `tazhud:store:v1`. The bag is stored under `tazhud:cart:v1`.
- **Customers see the starter catalogue** in `lib/seed.ts`. Admin edits appear on the storefront in the same browser (and other tabs of it) only.
- Order inquiries are recorded in the admin only when checkout happens in that same browser. Real customer orders arrive in your **WhatsApp**, which is the source of truth.
- Uploaded images are resized to 1200px JPEG data URLs; browsers allow roughly 5 MB of storage, so prefer hosted image URLs. A clear error appears if storage fills up.
- Data is not backed up. Use **Store settings → Export data** to keep a copy or move it to another browser.

### Moving to a shared database

1. Create a database (e.g. Vercel Postgres/Neon, Supabase or Firebase) and an image store (e.g. Vercel Blob).
2. Add API routes (or server actions) that read and write `StoreData` (or normalised tables), protected by real admin auth, plus a public read endpoint or server-side fetch for the storefront.
3. Implement `StoreRepository` with `fetch` calls to those routes and return it from `getRepository()`.
4. Replace `compressImage` uploads in `components/admin/image-input.tsx` with uploads to your image store.
5. Record checkout inquiries server-side so they appear for the owner on any device.

No UI changes are needed: every screen reads and writes through `useStore()`.

## Product photography

The starter catalogue uses **illustrated placeholder artwork** (`public/art`, generated by `scripts/generate-art.mjs`) so the site looks complete on first launch. Replace it with real photos per product in **Admin → Products** (paste an image URL or upload). Portrait 4:5 images around 1200×1500 work best. Any image that fails to load shows a styled fallback instead of a broken image.

The logo in `public/brand/tazhud-logo.jpg` is 150×150 px. A larger version (1000px+, ideally a transparent PNG or SVG) will look sharper; replace that file and `app/icon.png` / `app/apple-icon.png`.

## Deploying to Vercel

The project is a standard Next.js app; no `vercel.json` is needed.

1. In Vercel, **Add New → Project**, import the `tazhud` GitHub repository (framework is detected as Next.js).
2. Add `ADMIN_PASSCODE` and `ADMIN_SESSION_SECRET` under **Environment Variables** (Production and Preview).
3. Deploy. Every push to `main` deploys production; other branches get preview URLs.
4. Optionally add a custom domain under **Settings → Domains**.

## Project structure

```
app/
  (store)/          storefront routes: home, shop, product/[slug], cart, checkout, policies
  admin/login/      admin sign-in
  admin/(panel)/    admin routes behind proxy.ts
  api/admin/        login / logout route handlers
components/
  providers/        StoreProvider (data) and CartProvider (bag)
  store/            storefront UI
  admin/            admin shell, pages and form primitives
  ui/               shared primitives: SmartImage, Sheet, Reveal, Mandala, Price…
lib/
  types.ts          data model
  seed.ts           starter catalogue, settings and sample inquiries
  repository.ts     StoreRepository + local demo implementation
  commerce.ts       pricing, stock, coupons, delivery
  whatsapp.ts       wa.me links and order message
  admin-auth.ts     passcode + signed cookie helpers
proxy.ts            protects /admin
scripts/generate-art.mjs
```
