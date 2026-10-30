"use client";

import { useStore } from "@/components/providers/store-provider";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export function PoliciesView() {
  const { data } = useStore();
  const s = data.settings;
  return (
    <div className="page-wash dock-space">
      <div className="container-x max-w-3xl pt-8 sm:pt-14">
        <p className="eyebrow text-gold-deep">المساعدة</p>
        <h1 className="season-title font-display mt-2 text-[2.6rem] leading-tight text-ink sm:text-5xl">سياسات المتجر</h1>
        <nav aria-label="السياسات" className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap">
          {s.policies.map((p) => (
            <a key={p.id} href={`#${p.id}`} className="chip shrink-0">{p.title}</a>
          ))}
        </nav>
        <div className="mt-8 space-y-4">
          {s.policies.map((p, i) => (
            <Reveal as="section" key={p.id} id={p.id} className="glass-card scroll-mt-28 p-5 sm:p-7">
              <p className="index-num">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="font-display mt-1 text-[1.75rem] leading-tight text-ink">{p.title}</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-muted">{p.body}</p>
              {p.id === "pol-returns" && (
                <Link href="/returns" className="press btn btn-primary mt-5">
                  <Undo2 className="size-4" /> اطلبي إرجاع أو استبدال
                </Link>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
