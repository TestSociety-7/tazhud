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
  side = "end",
  title,
  children,
  footer,
  heading,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  /** "start" opens from the reading side (right in Arabic), "end" from the other. */
  side?: "start" | "end" | "top" | "bottom";
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Replaces the plain title in the header bar (the title is still the dialog's name). */
  heading?: React.ReactNode;
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
    end: "ms-auto h-full max-h-none w-full max-w-md starting:ltr:translate-x-full starting:rtl:-translate-x-full",
    start: "me-auto h-full max-h-none w-[88%] max-w-sm starting:ltr:-translate-x-full starting:rtl:translate-x-full",
    top: "mx-auto mb-auto w-full max-w-none starting:-translate-y-full",
    bottom: "mx-auto mt-auto w-full max-w-lg rounded-t-3xl max-h-[88dvh] starting:translate-y-full sm:mb-auto sm:rounded-3xl",
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
      className={`fixed inset-0 m-0 flex max-h-dvh flex-col overflow-hidden bg-paper p-0 text-text shadow-[var(--shadow-lift),inset_0_0_0_1px_rgb(255_255_255/0.06)] transition-transform duration-500 ease-[var(--ease-soft)] backdrop:bg-black/65 backdrop:backdrop-blur-[6px] backdrop:transition-opacity backdrop:duration-500 starting:backdrop:opacity-0 ${position} ${className} [&:not([open])]:hidden`}
    >
      {side === "bottom" && <span className="grip mt-2.5 sm:hidden" aria-hidden />}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        {heading ?? <h2 className="reel-title text-xl">{title}</h2>}
        <button type="button" className="pop icon-btn -me-2 bg-white/[0.07] text-ink" onClick={onClose} aria-label="إغلاق">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain">{children}</div>
      {footer && <div className="border-t border-white/[0.06] bg-ivory/60 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{footer}</div>}
    </dialog>
  );
}
