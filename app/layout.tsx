import type { Metadata, Viewport } from "next";
import "@fontsource-variable/alexandria";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "تزهّد | أزياء محتشمة، طرح وعبايات",
    template: "%s | تزهّد",
  },
  description: "طرح وعبايات وأزياء محتشمة بأقمشة ناعمة ومختارة بعناية. اطلبي بسهولة عبر واتساب.",
  appleWebApp: { capable: true, title: "تزهّد", statusBarStyle: "black" },
  openGraph: {
    type: "website",
    siteName: "تزهّد Tazhud",
    locale: "ar_AR",
    images: ["/brand/tazhud-logo.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
        <Toaster
          dir="rtl"
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: "!rounded-2xl !border-line !bg-paper !text-text !font-sans !shadow-[var(--shadow-lift)]",
              description: "!text-muted",
            },
          }}
        />
      </body>
    </html>
  );
}
