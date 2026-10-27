"use client";

import { useStore } from "@/components/providers/store-provider";
import { OrnamentDivider } from "@/components/ui/mandala";
import { whatsappLink } from "@/lib/whatsapp";

export function PoliciesView() {
  const { data } = useStore();
  const s = data.settings;
  return (
    <div className="container-x max-w-3xl py-14">
      <p className="eyebrow text-gold-deep">المساعدة</p>
      <h1 className="font-display mt-2 text-5xl text-ink">سياسات المتجر</h1>
      <nav aria-label="السياسات" className="mt-6 flex flex-wrap gap-2">
        {s.policies.map((p) => (
          <a key={p.id} href={`#${p.id}`} className="btn btn-sm btn-outline border-line">{p.title}</a>
        ))}
      </nav>
      <OrnamentDivider className="my-10" />
      <div className="space-y-12">
        {s.policies.map((p) => (
          <section key={p.id} id={p.id} className="scroll-mt-28">
            <h2 className="font-display text-3xl text-ink">{p.title}</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-muted">{p.body}</p>
          </section>
        ))}
        <section className="card p-6">
          <h2 className="font-display text-2xl text-ink">لديكِ سؤال آخر؟</h2>
          <p className="mt-2 text-sm text-muted">
            راسلينا على{" "}
            <a className="font-semibold text-forest underline underline-offset-4" href={whatsappLink(s.whatsappNumber)} target="_blank" rel="noopener noreferrer">واتساب</a>
            {s.email && (<>{" "}أو عبر البريد <a className="font-semibold text-forest underline underline-offset-4" href={`mailto:${s.email}`}>{s.email}</a></>)}. {s.hours}.
          </p>
        </section>
      </div>
    </div>
  );
}
