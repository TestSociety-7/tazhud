"use client";

/* eslint-disable @next/next/no-img-element -- images come from admin-entered URLs on any host or uploaded data URLs, so next/image's host allow-list doesn't fit. */
import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

interface SmartImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Load eagerly (above-the-fold images). */
  priority?: boolean;
  /** Reveal with a gentle unveil once loaded. */
  unveil?: boolean;
  fallbackLabel?: string;
}

/**
 * Image with a shimmer while loading and a styled fallback if it fails,
 * so a broken URL never leaves a hole in the layout.
 */
export function SmartImage({ src, alt, className = "", imgClassName = "", priority, unveil, fallbackLabel }: SmartImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");
  const [retried, setRetried] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setRetried(false);
    setState(src ? "loading" : "error");
  }
  // One quiet second try (skipping any stale cached copy) before showing the fallback.
  const shown = retried && src && !src.startsWith("data:") ? `${src}${src.includes("?") ? "&" : "?"}retry=1` : src;

  function failed() {
    if (!retried && src && !src.startsWith("data:")) setRetried(true);
    else setState("error");
  }

  // Catch images that finished (or failed) before hydration attached handlers. Safari can
  // report a finished SVG as 0 wide until it is decoded, so ask it to decode before giving up.
  useEffect(() => {
    const img = ref.current;
    if (!img || !img.complete) return;
    if (img.naturalWidth > 0) {
      setState("loaded");
      return;
    }
    let alive = true;
    img.decode().then(
      () => alive && setState("loaded"),
      () => alive && failed(),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per address
  }, [shown]);

  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} overflow-hidden bg-sand ${className}`}>
      {state === "loading" && <div className="skeleton absolute inset-0" aria-hidden />}
      {state === "error" ? (
        <div className="stitch-box-soft absolute inset-0 grid place-items-center bg-sand text-muted" role="img" aria-label={alt}>
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <ImageOff className="size-6 opacity-60" aria-hidden />
            <span className="font-display text-lg leading-tight">{fallbackLabel ?? "الصورة قريبًا"}</span>
          </div>
        </div>
      ) : (
        <img
          ref={ref}
          src={shown}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onLoad={() => setState("loaded")}
          onError={failed}
          data-loaded={state === "loaded"}
          className={`h-full w-full object-cover transition-opacity duration-700 ${state === "loaded" ? "opacity-100" : "opacity-0"} ${unveil ? "unveil" : ""} ${imgClassName}`}
        />
      )}
    </div>
  );
}
