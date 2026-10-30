"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <span className="admin-title-mark" aria-hidden />
        <h1 className="font-display text-[2.1rem] leading-tight text-ink sm:text-[2.7rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  actions,
  className = "",
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card min-w-0 p-5 sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && <h2 className="font-display text-xl leading-tight text-ink">{title}</h2>}
            {description && <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function FormField({
  label,
  hint,
  error,
  children,
  htmlFor,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ? <p className="error-text" role="alert">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-[3.4rem] shrink-0 items-center rounded-full transition-[background-color,box-shadow] duration-300 disabled:opacity-50 ${
          checked ? "bg-forest shadow-[inset_0_1px_3px_rgb(0_0_0/0.3),0_6px_14px_-8px_var(--color-forest)]" : "bg-sand shadow-[inset_0_1px_3px_rgb(12_16_36/0.15),inset_0_0_0_1px_var(--color-line)]"
        }`}
      >
        <span
          className={`inline-block size-6 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#f4f1f6_60%,#ddd6fb)] shadow-[0_2px_6px_rgb(12_16_36/0.3)] transition-transform duration-500 ease-[var(--ease-spring)] ${checked ? "-translate-x-[1.65rem]" : "-translate-x-1"}`}
        />
      </button>
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "green" | "gold" | "red" | "blue"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-sand text-muted",
    green: "bg-mint/60 text-success",
    gold: "bg-gold-soft text-gold-deep",
    red: "bg-danger/10 text-danger",
    blue: "bg-iris/15 text-forest-2",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] leading-none font-semibold whitespace-nowrap shadow-[inset_0_0_0_1px_rgb(255_255_255/0.6)] ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Modal built on <dialog>. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`admin-modal m-auto mb-0 max-h-[92dvh] w-full sm:mb-auto sm:w-[calc(100%-1.5rem)] ${widths[size]} flex-col overflow-hidden rounded-t-[2rem] bg-ivory p-0 text-text shadow-[0_-20px_60px_-20px_rgb(12_16_36/0.5)] sm:rounded-[2rem] sm:shadow-[var(--shadow-lift)] open:flex`}
    >
      <span className="sheet-grip" aria-hidden />
      <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-3 sm:pt-5">
        <h2 className="font-display text-2xl leading-tight text-ink">{title}</h2>
        <button type="button" className="icon-btn -me-2 bg-sand/70" onClick={onClose} aria-label="إغلاق">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-5">{children}</div>
      {footer && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-line/70 bg-paper/90 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur [&>*]:flex-1 sm:[&>*]:flex-none">{footer}</div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "حذف",
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            إلغاء
          </button>
          <button type="button" className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-muted">{body}</div>
    </Modal>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "dark";
}) {
  return (
    <div className={`stat3d ${tone === "dark" ? "on-dark" : "text-ink"}`} data-dark={tone === "dark"}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-semibold ${tone === "dark" ? "text-gold-soft" : "text-muted"}`}>{label}</p>
        {icon && <span className="stat-orb">{icon}</span>}
      </div>
      <p
        className={`font-display mt-3 leading-none break-words tabular-nums ${String(value).length > 6 ? "text-2xl sm:text-3xl" : "text-4xl"} ${tone === "dark" ? "text-ivory" : "text-ink"}`}
      >
        {value}
      </p>
      {hint && <p className={`mt-2 text-xs ${tone === "dark" ? "text-ivory/60" : "text-muted"}`}>{hint}</p>}
    </div>
  );
}

/** Light that follows the finger or pointer across a `.shine-follow` element. */
export const shine = {
  onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    el.style.setProperty("--shine", "1");
  },
  onPointerLeave(e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.style.setProperty("--shine", "0");
  },
};
