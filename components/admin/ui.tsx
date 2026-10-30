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
        <h1 className="adm-title season-title text-[2rem] sm:text-[2.5rem]">{title}</h1>
        <span className="adm-title-stitch" aria-hidden />
        {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted text-pretty">{description}</p>}
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
    <section className={`adm-sheet min-w-0 p-5 sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4 border-b-[1.5px] border-dashed border-line pb-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
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
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 ease-[var(--ease-soft)] before:absolute before:-inset-2 before:content-[''] disabled:opacity-50 ${checked ? "bg-forest" : "bg-line"}`}
      >
        <span className={`inline-block size-5 rounded-full bg-paper shadow-[0_1px_3px_rgb(42_15_29/0.35)] transition-transform duration-300 ease-[var(--ease-soft)] ${checked ? "-translate-x-6" : "-translate-x-1"}`} />
      </button>
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "green" | "gold" | "red" | "blue"; children: React.ReactNode }) {
  // Sewn-in labels: saffron for "needs you", mulberry for "in progress", green done, red stopped.
  const tones = {
    neutral: "adm-label-neutral",
    green: "adm-label-green",
    gold: "adm-label-gold",
    red: "adm-label-red",
    blue: "adm-label-mulberry",
  };
  return <span className={`adm-label ${tones[tone]}`}>{children}</span>;
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
      className={`m-auto mb-0 max-h-[92dvh] w-full sm:mb-auto sm:w-[calc(100%-1.5rem)] ${widths[size]} flex-col overflow-hidden rounded-t-[1.4rem] bg-ivory p-0 text-text shadow-[var(--shadow-lift)] backdrop:bg-ink/55 backdrop:backdrop-blur-[2px] open:flex open:animate-fade-up sm:rounded-[1.25rem]`}
    >
      <span className="adm-handle" aria-hidden />
      <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-dashed border-line px-5 pt-2 pb-3 sm:pt-4">
        <h2 className="adm-title min-w-0 truncate text-[1.6rem]">{title}</h2>
        <button type="button" className="icon-btn -me-2" onClick={onClose} aria-label="إغلاق">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
      {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-paper px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&>*]:flex-1 sm:[&>*]:flex-none">{footer}</div>}
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
    <div className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${tone === "dark" ? "on-dark adm-cloth-flat border-ink" : "border-line bg-paper"}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-semibold ${tone === "dark" ? "text-gold" : "text-muted"}`}>{label}</p>
        {icon && <span className={tone === "dark" ? "text-gold" : "text-forest"}>{icon}</span>}
      </div>
      <p
        className={`adm-num mt-3 leading-none break-words tabular-nums ${String(value).length > 6 ? "text-2xl sm:text-3xl" : "text-4xl"} ${tone === "dark" ? "text-ivory" : "text-ink"}`}
      >
        {value}
      </p>
      {hint && <p className={`mt-2 text-xs ${tone === "dark" ? "text-ivory/60" : "text-muted"}`}>{hint}</p>}
    </div>
  );
}
