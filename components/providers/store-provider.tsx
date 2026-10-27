"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getRepository } from "@/lib/repository";
import { createSeedData } from "@/lib/seed";
import type { StoreData } from "@/lib/types";

type Mutator = (draft: StoreData) => StoreData;

export interface SaveResult {
  ok: boolean;
  error?: string;
}

interface StoreContextValue {
  data: StoreData;
  /** False until saved data has been read from the repository. */
  ready: boolean;
  storageLabel: string;
  isLocalOnly: boolean;
  update: (mutate: Mutator) => Promise<SaveResult>;
  resetToDemo: () => Promise<SaveResult>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const repo = getRepository();
  // Server render and first client render use the starter content, so the
  // markup matches; saved edits are applied right after hydration.
  const [data, setData] = useState<StoreData>(createSeedData);
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);

  useEffect(() => {
    let alive = true;
    repo.load().then((loaded) => {
      if (!alive) return;
      dataRef.current = loaded;
      setData(loaded);
      setReady(true);
    });
    const unsubscribe = repo.subscribe((next) => {
      dataRef.current = next;
      setData(next);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [repo]);

  const update = useCallback(
    async (mutate: Mutator): Promise<SaveResult> => {
      const previous = dataRef.current;
      const next = mutate(previous);
      dataRef.current = next;
      setData(next);
      try {
        await repo.save(next);
        return { ok: true };
      } catch (err) {
        dataRef.current = previous;
        setData(previous);
        return { ok: false, error: err instanceof Error ? err.message : "Could not save changes." };
      }
    },
    [repo],
  );

  const resetToDemo = useCallback(async (): Promise<SaveResult> => {
    try {
      const seed = await repo.reset();
      dataRef.current = seed;
      setData(seed);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Could not reset." };
    }
  }, [repo]);

  const value = useMemo(
    () => ({ data, ready, update, resetToDemo, storageLabel: repo.label, isLocalOnly: repo.isLocalOnly }),
    [data, ready, update, resetToDemo, repo],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
