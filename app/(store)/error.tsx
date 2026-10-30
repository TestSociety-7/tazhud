"use client";

import { LostTag } from "@/components/store/atelier/lost-tag";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x flex flex-col items-center py-14 text-center sm:py-20">
      <LostTag code="!" />
      <h1 className="font-display mt-8 text-3xl text-ink sm:text-4xl">حدث خطأ ما</h1>
      <p className="mt-2 max-w-sm text-sm text-pretty text-muted">حاولي مرة أخرى. إذا استمرت المشكلة راسلينا على واتساب.</p>
      <button type="button" className="btn btn-primary mt-7" onClick={reset}>حاولي مجددًا</button>
    </div>
  );
}
