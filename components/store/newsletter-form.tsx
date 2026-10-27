"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const { update } = useStore();
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setError("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }
    setStatus("saving");
    const res = await update((d) =>
      d.subscribers.some((s) => s.email === value)
        ? d
        : { ...d, subscribers: [{ email: value, createdAt: new Date().toISOString() }, ...d.subscribers] },
    );
    if (res.ok) {
      setStatus("done");
      setEmail("");
    } else {
      setStatus("error");
      setError(res.error ?? "حدث خطأ ما. حاولي مجددًا.");
    }
  }

  if (status === "done") {
    return (
      <p role="status" className={`flex items-center gap-2 text-sm ${dark ? "text-gold-soft" : "text-success"}`}>
        <Check className="size-4" /> شكرًا لكِ! ستصلكِ أخبار القطع الجديدة وعودة المنتجات.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <label htmlFor={id} className="sr-only">
        البريد الإلكتروني
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="بريدكِ الإلكتروني"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? `${id}-err` : undefined}
          className={`field flex-1 ${dark ? "!border-white/15 !bg-white/5 !text-ivory placeholder:!text-ivory/50 focus:!bg-white/10" : ""}`}
        />
        <button type="submit" className={`btn ${dark ? "btn-gold" : "btn-primary"}`} disabled={status === "saving"}>
          {status === "saving" ? "جارٍ الاشتراك…" : "اشتركي"}
        </button>
      </div>
      {status === "error" && (
        <p id={`${id}-err`} className={`error-text ${dark ? "!text-[#f0a99c]" : ""}`} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
