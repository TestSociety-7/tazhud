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
    top: "pinked mx-auto mb-auto w-full max-w-none pb-[7px] [--z:7px] starting:-translate-y-full",
    bottom: "mx-auto mt-auto w-full max-w-lg rounded-t-[1.4rem] max-h-[88dvh] starting:translate-y-full sm:mb-auto sm:rounded-[1.4rem]",
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
      className={`fixed inset-0 m-0 flex max-h-dvh flex-col overflow-hidden bg-ivory p-0 text-text shadow-[var(--shadow-lift)] transition-transform duration-500 ease-[var(--ease-soft)] backdrop:bg-ink/45 backdrop:backdrop-blur-[2px] backdrop:transition-opacity backdrop:duration-500 starting:backdrop:opacity-0 ${position} ${className} [&:not([open])]:hidden`}
    >
      {side === "bottom" && <span className="mx-auto mt-2.5 -mb-1 block h-1 w-10 shrink-0 rounded-full bg-line sm:hidden" aria-hidden />}
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        {heading ?? <h2 className="font-display text-2xl text-ink">{title}</h2>}
        <button type="button" className="icon-btn -me-2" onClick={onClose} aria-label="إغلاق">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain">{children}</div>
      {footer && <div className="border-t border-line bg-paper px-5 py-4">{footer}</div>}
    </dialog>
  );
}
