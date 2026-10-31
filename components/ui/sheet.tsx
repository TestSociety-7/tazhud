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
  side?: "start" | "end" | "top" | "bottom" | "responsive";
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
    end: "ms-auto h-full max-h-none w-full max-w-md sm:rounded-s-[2rem] starting:ltr:translate-x-full starting:rtl:-translate-x-full",
    start: "me-auto h-full max-h-none w-[88%] max-w-sm rounded-e-[2rem] starting:ltr:-translate-x-full starting:rtl:translate-x-full",
    top: "mx-auto mb-auto w-full max-w-none rounded-b-[2rem] starting:-translate-y-full",
    bottom: "mx-auto mt-auto w-full max-w-lg rounded-t-[2rem] max-h-[88dvh] starting:translate-y-full sm:mb-auto sm:rounded-[2rem]",
    // A glass sheet rising from the bottom on phones, a side drawer on larger screens.
    responsive:
      "mx-auto mt-auto w-full max-w-none max-h-[90dvh] rounded-t-[2rem] starting:translate-y-full sm:ms-auto sm:me-0 sm:mt-0 sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-s-[2rem] sm:starting:translate-y-0 sm:starting:ltr:translate-x-full sm:starting:rtl:-translate-x-full",
  }[side];
  const grab = side === "bottom" || side === "responsive";

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
      className={`sheet-glass fixed inset-0 m-0 flex max-h-dvh flex-col overflow-hidden p-0 text-text transition-transform duration-500 ease-[var(--ease-soft)] backdrop:bg-ink/40 backdrop:backdrop-blur-[3px] backdrop:transition-opacity backdrop:duration-500 starting:backdrop:opacity-0 ${position} ${className} [&:not([open])]:hidden`}
    >
      <div className={`relative flex items-center justify-between border-b border-line/70 px-5 ${grab ? "pt-5 pb-3.5" : "py-4"}`}>
        {grab && <span className="sheet-grab sm:hidden" aria-hidden />}
        {heading ?? <h2 className="font-display text-2xl text-ink">{title}</h2>}
        <button type="button" className="sheet-close icon-btn press -me-2" onClick={onClose} aria-label="إغلاق">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain">{children}</div>
      {footer && <div className="border-t border-line/70 bg-paper/70 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
    </dialog>
  );
}
