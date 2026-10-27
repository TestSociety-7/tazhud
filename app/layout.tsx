import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource-variable/manrope";
import "./globals.css";
import { Toaster } from "sonner";
import { StoreProvider } from "@/components/providers/store-provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  ),
  title: {
    default: "Tazhud | Modest fashion, hijabs & abayas",
    template: "%s | Tazhud",
  },
  description:
    "Hijabs, abayas and modest clothing in soft, considered fabrics. Order easily on WhatsApp.",
  openGraph: {
    type: "website",
    siteName: "Tazhud",
    images: ["/brand/tazhud-logo.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f120f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <StoreProvider>{children}</StoreProvider>
        <Toaster
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
