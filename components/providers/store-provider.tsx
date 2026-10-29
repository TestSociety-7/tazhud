"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { catalogToStoreData, createRepository, type Catalog } from "@/lib/repository";
import type { OrderInquiry, StoreData } from "@/lib/types";

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
  /** Adds orders that arrived on the server, without saving anything back. */
  receiveOrders: (orders: OrderInquiry[]) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

interface StoreProviderProps {
  children: React.ReactNode;
  /** True when Vercel Blob storage is connected. */
  shared: boolean;
  scope: "store" | "admin";
  /** Catalogue rendered by the server (shared mode only). */
  initialCatalog?: Catalog | null;
}

export function StoreProvider({ children, shared, scope, initialCatalog = null }: StoreProviderProps) {
  // Server render and first client render use the same data so the markup
  // matches. In local mode, saved browser edits are applied after hydration.
  const [initial] = useState(() => catalogToStoreData(initialCatalog));
  const [repo] = useState(() => createRepository({ shared, scope, initial }));
  const [data, setData] = useState<StoreData>(initial);
  const [ready, setReady] = useState(shared && scope === "store");
  const dataRef = useRef(data);

  useEffect(() => {
    let alive = true;
    repo
      .load()
      .then((loaded) => {
        if (!alive) return;
        dataRef.current = loaded;
        setData(loaded);
        setReady(true);
      })
      .catch((err) => {
        console.error(err);
        if (alive) setReady(true);
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
        await repo.save(next, previous);
        return { ok: true };
      } catch (err) {
        dataRef.current = previous;
        setData(previous);
        return { ok: false, error: err instanceof Error ? err.message : "تعذّر حفظ التغييرات." };
      }
    },
    [repo],
  );

  const resetToDemo = useCallback(async (): Promise<SaveResult> => {
    try {
      const seed = await repo.reset(dataRef.current);
      dataRef.current = seed;
      setData(seed);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "تعذّرت إعادة الضبط." };
    }
  }, [repo]);

  const receiveOrders = useCallback((orders: OrderInquiry[]) => {
    const current = dataRef.current;
    const known = new Set(current.orders.map((o) => o.id));
    const fresh = orders.filter((o) => !known.has(o.id));
    if (!fresh.length) return;
    const next = { ...current, orders: [...fresh, ...current.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
    dataRef.current = next;
    setData(next);
  }, []);

  const value = useMemo(
    () => ({ data, ready, update, resetToDemo, receiveOrders, storageLabel: repo.label, isLocalOnly: repo.isLocalOnly }),
    [data, ready, update, resetToDemo, receiveOrders, repo],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
