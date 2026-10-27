"use client";

import { EmptyState } from "@/components/ui/empty-state";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x py-16">
      <EmptyState
        title="Something went wrong"
        body="Please try again. If the problem continues, message us on WhatsApp."
        action={<button type="button" className="btn btn-primary" onClick={reset}>Try again</button>}
      />
    </div>
  );
}
