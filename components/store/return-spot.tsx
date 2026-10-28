"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { readSpot, rememberSpot, requestRestore, takeRestoreRequest } from "@/lib/return-spot";

/**
 * Notes the spot whenever a product link is opened from a list, and scrolls back to it
 * when the shopper returns (browser back, the back button or "continue shopping").
 */
export function ReturnSpotKeeper() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='/product/']");
      if (a) rememberSpot(a.getAttribute("href") ?? "");
    };
    const onPop = () => requestRestore();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useEffect(() => {
    if (!takeRestoreRequest()) return;
    const spot = readSpot();
    const here = pathname + (search ? `?${search}` : "");
    if (!spot || spot.href !== here) return;
    // The list may still be growing (images, "show more"), so keep trying briefly.
    const until = performance.now() + 2500;
    let raf = 0;
    const tick = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      window.scrollTo({ top: Math.min(spot.y, max), behavior: "instant" });
      if (max < spot.y && performance.now() < until) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pathname, search]);

  return null;
}

/** Takes the shopper back to the list she came from, at the same place. */
export function useBackToList() {
  const router = useRouter();
  const pathname = usePathname();
  return () => {
    const spot = readSpot();
    if (spot && spot.to === pathname && history.length > 1) {
      requestRestore();
      router.back();
    } else if (spot) {
      requestRestore();
      router.push(spot.href, { scroll: false });
    } else {
      router.push("/shop");
    }
  };
}

export function BackToListButton({ className = "" }: { className?: string }) {
  const back = useBackToList();
  return (
    <button type="button" onClick={back} className={`press inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-paper/90 px-4 text-sm font-semibold text-ink shadow-[var(--shadow-soft)] backdrop-blur ${className}`}>
      <ArrowRight className="size-4" /> رجوع
    </button>
  );
}
