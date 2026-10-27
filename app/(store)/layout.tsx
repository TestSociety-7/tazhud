import { CartProvider } from "@/components/providers/cart-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { hasSharedStorage, readCatalog } from "@/lib/server/storage";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const shared = hasSharedStorage();
  const catalog = shared ? await readCatalog() : null;
  return (
    <StoreProvider shared={shared} scope="store" initialCatalog={catalog}>
      <CartProvider>
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:top-3 focus:start-3"
        >
          تخطّي إلى المحتوى
        </a>
        <AnnouncementBar />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <CartDrawer />
      </CartProvider>
    </StoreProvider>
  );
}
