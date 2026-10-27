import type { Metadata } from "next";
import { Suspense } from "react";
import { seedProducts } from "@/lib/seed";
import { ProductView } from "@/components/store/product-view";

export function generateStaticParams() {
  return seedProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = seedProducts.find((x) => x.slug === slug);
  if (!p) return { title: "Product" };
  return {
    title: p.name,
    description: `${p.tagline}. ${p.description}`.slice(0, 160),
    openGraph: { title: p.name, description: p.tagline },
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
