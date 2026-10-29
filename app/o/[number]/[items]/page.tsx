import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { seedProducts } from "@/lib/seed";
import { readCatalog } from "@/lib/server/storage";
import { ORDER_NUMBER_RE, parseOrderItems } from "@/lib/order-pictures";
import { SmartImage } from "@/components/ui/smart-image";

type Params = Promise<{ number: string; items: string }>;

async function load(params: Params) {
  const { number, items } = await params;
  const n = decodeURIComponent(number).toUpperCase();
  if (!ORDER_NUMBER_RE.test(n)) return null;
  const products = (await readCatalog())?.products ?? seedProducts;
  const list = parseOrderItems(items).flatMap((it) => {
    const p = products.find((x) => x.slug === it.slug);
    return p ? [{ product: p, quantity: it.quantity }] : [];
  });
  return list.length ? { number: n, list } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const order = await load(params);
  if (!order) return { title: "صور الطلب" };
  const pieces = order.list.reduce((n, x) => n + x.quantity, 0);
  return {
    title: `صور الطلب ${order.number}`,
    description: order.list.map((x) => x.product.name).join("، "),
    robots: { index: false, follow: false },
    openGraph: { title: `طلب ${order.number} · ${pieces} ${pieces === 1 ? "قطعة" : "قطع"}`, description: order.list.map((x) => x.product.name).join("، ") },
  };
}

export default function OrderPicturesPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="container-x py-24"><div className="skeleton mx-auto h-96 max-w-3xl rounded-2xl" /></div>}>
      <OrderPictures params={params} />
    </Suspense>
  );
}

async function OrderPictures({ params }: { params: Params }) {
  const order = await load(params);
  if (!order) notFound();
  return (
    <main className="container-x max-w-3xl py-10 sm:py-14">
      <Link href="/" className="font-display text-2xl text-ink">تزهّد</Link>
      <p className="eyebrow mt-8 text-gold-deep">صور الطلب</p>
      <h1 className="font-display mt-2 text-4xl text-ink">
        الطلب <span className="ltr inline-block">{order.number}</span>
      </h1>
      <p className="mt-2 text-sm text-muted">الأسعار والمقاسات والألوان في رسالة الطلب على واتساب.</p>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {order.list.map(({ product, quantity }) => (
          <li key={product.id}>
            <Link href={`/product/${product.slug}`} className="press group block">
              <div className="arch relative aspect-[4/5] overflow-hidden bg-sand">
                <SmartImage src={product.images[0]} alt={product.name} className="absolute inset-0" />
                <span className="absolute top-3 end-3 z-10 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-ivory">× {quantity}</span>
              </div>
              <p className="font-display mt-3 text-lg leading-tight text-ink group-hover:text-gold-deep">{product.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
