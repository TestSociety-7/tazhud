"use client";

import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import type { StoreData } from "@/lib/types";

/** Wraps store updates with consistent success / error toasts. */
export function useSave() {
  const { update } = useStore();
  return async (mutate: (d: StoreData) => StoreData, success: string, opts?: { undo?: () => void }) => {
    const res = await update(mutate);
    if (res.ok) {
      toast.success(success, opts?.undo ? { action: { label: "Undo", onClick: opts.undo } } : undefined);
    } else {
      toast.error("Couldn't save", { description: res.error });
    }
    return res.ok;
  };
}
