"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * "Add to home screen". Android and desktop Chrome get the browser's own install
 * prompt; iPhone shows the two taps Safari needs. Hidden once the app is installed.
 */
export function InstallAppButton({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(true);
  const [ios, setIos] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the browser after hydration
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!prompt && !ios)) return null;

  async function install() {
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setPrompt(null);
      return;
    }
    // Shown beside the button (not as a toast) so it also appears above an open menu.
    setHint((h) => !h);
  }

  return (
    <span className="relative inline-flex">
      <button type="button" onClick={install} className={className} aria-expanded={ios ? hint : undefined}>
        <Download className="size-4" /> تثبيت التطبيق على الهاتف
      </button>
      {hint && (
        <span role="status" className="absolute bottom-full end-0 z-20 mb-2 flex w-64 gap-2 rounded-xl bg-paper p-3 text-start text-xs leading-relaxed text-ink shadow-[var(--shadow-lift)]">
          <Share className="mt-0.5 size-4 shrink-0 text-forest" />
          <span>للتثبيت على الآيفون: اضغطي زر المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».</span>
        </span>
      )}
    </span>
  );
}
