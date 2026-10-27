"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { bundleDetails } from "@/lib/commerce";
import type { Bundle } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { Price, useMoney } from "@/components/ui/price";

export function BundleCard({ bundle }: { bundle: Bundle }) {
  const { data } = useStore();
  const { addBundle, setDrawerOpen } = useCart();
  const money = useMoney();
  const { items, value, savings, available } = bundleDetails(bundle, data.products);

  return (
    <article id={bundle.slug} className="group card flex h-full scroll-mt-28 flex-col overflow-hidden transition-shadow duration-500 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <SmartImage
          src={bundle.image}
          alt={bundle.name}
          className="absolute inset-0"
          imgClassName="transition-transform duration-[1.4s] ease-[var(--ease-soft)] group-hover:scale-[1.04]"
          fallbackLabel={bundle.name}
        />
        {savings > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-ink px-3 py-1 text-[0.7rem] font-bold tracking-wider text-gold-soft">
            Save {money(savings)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-2xl text-ink">{bundle.name}</h3>
        <p className="mt-2 text-sm text-pretty text-muted">{bundle.description}</p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {items.map((it) => (
            <li key={it.productId} className="flex items-center gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sand text-[0.7rem] font-bold text-forest">{it.quantity}×</span>
              <Link href={`/product/${it.product.slug}`} className="hover:underline">
                {it.product.name}
              </Link>
            </li>
          ))}
        </ul>
        {bundle.note && <p className="mt-3 text-xs text-gold-deep">{bundle.note}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <Price price={bundle.price} compareAt={value} />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!available}
            onClick={() => {
              addBundle(bundle);
              toast.success(`${bundle.name} added to your bag`, { action: { label: "View bag", onClick: () => setDrawerOpen(true) } });
            }}
          >
            <ShoppingBag className="size-4" /> {available ? "Add bundle" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}
