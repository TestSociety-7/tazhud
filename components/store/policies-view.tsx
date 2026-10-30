"use client";

import { useStore } from "@/components/providers/store-provider";
import Link from "next/link";
import { Undo2 } from "lucide-react";

export function PoliciesView() {
  const { data } = useStore();
  const s = data.settings;
  return (
    <div className="container-x max-w-3xl py-8 sm:py-14">
      <p className="eyebrow text-gold-deep">المساعدة</p>
      <h1 className="season-title font-display mt-1 text-4xl text-ink sm:text-5xl">سياسات المتجر</h1>
      <nav aria-label="السياسات" className="mt-6 flex flex-wrap gap-2">
        {s.policies.map((p) => (
          <a key={p.id} href={`#${p.id}`} className="chip">{p.title}</a>
        ))}
      </nav>
      <div className="mt-10">
        {s.policies.map((p, i) => (
          <section key={p.id} id={p.id} className="scroll-mt-28">
            {i > 0 && <span className="stitch-mulberry stitch my-10" aria-hidden />}
            <h2 className="font-display text-3xl text-ink">{p.title}</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-muted">{p.body}</p>
            {p.id === "pol-returns" && (
              <Link href="/returns" className="press btn btn-primary mt-5">
                <Undo2 className="size-4" /> اطلبي إرجاع أو استبدال
              </Link>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
