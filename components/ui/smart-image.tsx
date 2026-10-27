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
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setState(src ? "loading" : "error");
  }

  // Catch images that finished (or failed) before hydration attached handlers.
  useEffect(() => {
    const img = ref.current;
    if (!img || !img.complete) return;
    setState(img.naturalWidth > 0 ? "loaded" : "error");
  }, [src]);

  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} overflow-hidden bg-sand ${className}`}>
      {state === "loading" && <div className="skeleton absolute inset-0" aria-hidden />}
      {state === "error" ? (
        <div className="pattern-geo absolute inset-0 grid place-items-center bg-sand text-muted" role="img" aria-label={alt}>
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <ImageOff className="size-6 opacity-60" aria-hidden />
            <span className="font-display text-lg leading-tight">{fallbackLabel ?? "Image coming soon"}</span>
          </div>
        </div>
      ) : (
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          data-loaded={state === "loaded"}
          className={`h-full w-full object-cover transition-opacity duration-700 ${state === "loaded" ? "opacity-100" : "opacity-0"} ${unveil ? "unveil" : ""} ${imgClassName}`}
        />
      )}
    </div>
  );
}
