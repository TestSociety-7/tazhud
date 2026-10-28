"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { toast } from "sonner";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * "Add to home screen". Android and desktop Chrome get the browser's own install
 * prompt; iPhone shows the two taps Safari needs. Hidden once the app is installed.
 */
export function InstallAppButton({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(true);
  const [ios, setIos] = useState(false);

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
    toast("للتثبيت على الآيفون", {
      description: "اضغط زر المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».",
      icon: <Share className="size-4" />,
      duration: 8000,
    });
  }

  return (
    <button type="button" onClick={install} className={className}>
      <Download className="size-4" /> تثبيت التطبيق على الهاتف
    </button>
  );
}
