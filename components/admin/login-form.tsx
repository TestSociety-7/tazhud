"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { Mandala } from "@/components/ui/mandala";

export function LoginForm({ demoPasscode }: { demoPasscode: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode) {
      setError("Enter the admin passcode.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Sign in failed. Please try again.");
        setBusy(false);
        return;
      }
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="on-dark relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4 py-12 text-ivory">
      <div className="pattern-geo absolute inset-0 opacity-[0.07]" aria-hidden />
      <Mandala className="pointer-events-none absolute top-1/2 left-1/2 size-[46rem] -translate-x-1/2 -translate-y-1/2 text-gold/15 motion-safe:animate-spin-slow" />
      <main className="relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-20" />
          <h1 className="font-display mt-5 text-4xl">Studio admin</h1>
          <p className="mt-2 text-sm text-ivory/60">Sign in to manage products, orders and your storefront.</p>
        </div>
        <form onSubmit={submit} noValidate className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <label htmlFor="passcode" className="label !text-ivory">Passcode</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ivory/40" aria-hidden />
            <input
              id="passcode"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "pass-err" : demoPasscode ? "pass-hint" : undefined}
              className="field !border-white/15 !bg-black/20 !pr-11 !pl-9 !text-ivory"
              autoFocus
            />
            <button type="button" className="icon-btn absolute top-1/2 right-0.5 size-10 -translate-y-1/2 text-ivory/60" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide passcode" : "Show passcode"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {error && <p id="pass-err" className="error-text !text-[#f0a99c]" role="alert">{error}</p>}
          <button type="submit" className="btn btn-gold mt-5 w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          {demoPasscode && (
            <p id="pass-hint" className="mt-4 rounded-lg bg-gold/10 p-3 text-xs leading-relaxed text-gold-soft">
              Demo mode: no <code>ADMIN_PASSCODE</code> is set, so the passcode is <strong className="font-mono">{demoPasscode}</strong>. Set your own in Vercel before sharing the site.
            </p>
          )}
        </form>
        <Link href="/" className="mt-6 flex min-h-10 items-center justify-center gap-2 text-sm text-ivory/60 hover:text-ivory">
          <ArrowLeft className="size-4" /> Back to store
        </Link>
      </main>
    </div>
  );
}
