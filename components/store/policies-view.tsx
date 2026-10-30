"use client";

import { useStore } from "@/components/providers/store-provider";
import Link from "next/link";
import { Undo2 } from "lucide-react";

export function PoliciesView() {
  const { data } = useStore();
  const s = data.settings;
  return (
    <div className="tabbar-pad mx-auto w-full max-w-3xl pt-6 sm:px-6 sm:pt-14 lg:px-10">
      <div className="px-4 sm:px-0">
        <p className="chip">المساعدة</p>
        <h1 className="season-title reel-title mt-3 text-[2.6rem] sm:text-6xl">سياسات المتجر</h1>
      </div>
      <nav aria-label="السياسات" className="sticky top-[var(--store-bar)] z-20 mt-5 bg-ivory/80 backdrop-blur-xl lg:top-[var(--header-h)]">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5 sm:px-0">
          {s.policies.map((p) => (
            <a key={p.id} href={`#${p.id}`} className="opt-chip shrink-0">{p.title}</a>
          ))}
        </div>
      </nav>
      <div className="mt-4 space-y-3 px-4 sm:px-0">
        {s.policies.map((p) => (
          <section key={p.id} id={p.id} className="panel scroll-mt-36 p-5 sm:p-7">
            <h2 className="reel-title text-2xl">{p.title}</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed whitespace-pre-line text-text/80">{p.body}</p>
            {p.id === "pol-returns" && (
              <Link href="/returns" className="pop btn btn-neon mt-5">
                <Undo2 className="size-4" /> اطلبي إرجاع أو استبدال
              </Link>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
