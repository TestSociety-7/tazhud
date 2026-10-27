"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import type { StoreData } from "@/lib/types";

/** Local editable copy of part of the store, with dirty tracking. */
export function useDraft<T>(select: (d: StoreData) => T) {
  const { data, ready } = useStore();
  const source = JSON.stringify(select(data));
  const [baseline, setBaseline] = useState(source);
  const [draft, setDraft] = useState<T>(() => JSON.parse(source));
  const [syncedReady, setSyncedReady] = useState(ready);

  // Pick up saved data once it loads (and external changes when not editing).
  if ((ready && !syncedReady) || (source !== baseline && JSON.stringify(draft) === baseline)) {
    setSyncedReady(ready);
    setBaseline(source);
    setDraft(JSON.parse(source));
  }

  const dirty = JSON.stringify(draft) !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  return {
    draft,
    setDraft,
    dirty,
    discard: () => setDraft(JSON.parse(baseline)),
    markSaved: (v: T) => {
      const s = JSON.stringify(v);
      setBaseline(s);
      setDraft(JSON.parse(s));
    },
  };
}

export function SaveBar({ dirty, saving, onDiscard }: { dirty: boolean; saving?: boolean; onDiscard: () => void }) {
  return (
    <div className="sticky bottom-16 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-line bg-ivory/95 px-4 py-3 shadow-[0_-8px_24px_-18px_rgb(15_18_15/0.35)] backdrop-blur sm:-mx-8 sm:px-8 lg:bottom-0">
      <p className="text-sm text-muted" role="status">{dirty ? "تغييرات غير محفوظة" : "كل التغييرات محفوظة"}</p>
      <div className="flex gap-2">
        {dirty && (
          <button type="button" className="btn btn-ghost" onClick={onDiscard}>
            تراجع
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>
          {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
        </button>
      </div>
    </div>
  );
}
