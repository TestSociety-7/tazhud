"use client";

import { EmptyState } from "@/components/ui/empty-state";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page-wash container-x dock-space pt-10">
      <EmptyState
        as="h1"
        title="حدث خطأ ما"
        body="حاولي مرة أخرى. إذا استمرت المشكلة راسلينا على واتساب."
        action={<button type="button" className="btn btn-primary press" onClick={reset}>حاولي مجددًا</button>}
      />
    </div>
  );
}
