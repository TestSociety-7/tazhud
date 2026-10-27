"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Slide-in panel built on the native <dialog>, which gives us focus trapping,
 * Escape-to-close and an inert background for free.
 */
export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  children,
  footer,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right" | "top";
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  // Close if the page that owns this sheet is hidden by navigation.
  useLayoutEffect(() => () => {
    document.documentElement.style.overflow = "";
  }, []);

  const position = {
    right: "ml-auto h-full max-h-none w-full max-w-md starting:translate-x-full",
    left: "mr-auto h-full max-h-none w-[88%] max-w-sm starting:-translate-x-full",
    top: "mx-auto mb-auto w-full max-w-none starting:-translate-y-full",
  }[side];

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`fixed inset-0 m-0 flex max-h-dvh flex-col bg-ivory p-0 text-text shadow-[var(--shadow-lift)] transition-transform duration-500 ease-[var(--ease-soft)] backdrop:bg-ink/45 backdrop:backdrop-blur-[2px] backdrop:transition-opacity backdrop:duration-500 starting:backdrop:opacity-0 ${position} ${className} [&:not([open])]:hidden`}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        <button type="button" className="icon-btn -mr-2" onClick={onClose} aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {footer && <div className="border-t border-line bg-paper px-5 py-4">{footer}</div>}
    </dialog>
  );
}
