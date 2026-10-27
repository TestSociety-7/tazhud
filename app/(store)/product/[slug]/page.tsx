import type { Metadata } from "next";
import { Suspense } from "react";
import { seedProducts } from "@/lib/seed";
import { readCatalog } from "@/lib/server/storage";
import { ProductView } from "@/components/store/product-view";

async function products() {
  return (await readCatalog())?.products ?? seedProducts;
}

export async function generateStaticParams() {
  return (await products()).filter((p) => p.published).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = (await products()).find((x) => x.slug === slug);
  if (!p) return { title: "المنتج" };
  return {
    title: p.name,
    description: `${p.tagline}. ${p.description}`.slice(0, 160),
    openGraph: { title: p.name, description: p.tagline, images: p.images[0] ? [p.images[0]] : undefined },
  };
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="container-x py-24"><div className="arch skeleton mx-auto aspect-[4/5] max-w-md" /></div>}>
      {params.then(({ slug }) => (
        <ProductView slug={slug} />
      ))}
    </Suspense>
  );
}
