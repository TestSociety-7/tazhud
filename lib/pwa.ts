import type { MetadataRoute } from "next";

const icons: MetadataRoute.Manifest["icons"] = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

/** Home-screen app settings. The store and the admin install as two separate apps. */
export function appManifest(app: "store" | "admin"): MetadataRoute.Manifest {
  const admin = app === "admin";
  return {
    id: admin ? "/admin" : "/",
    name: admin ? "تزهّد · لوحة التحكم" : "تزهّد | أزياء محتشمة",
    short_name: admin ? "إدارة تزهّد" : "تزهّد",
    description: admin ? "إدارة المنتجات والطلبات في متجر تزهّد." : "طرح وعبايات وأزياء محتشمة. اطلبي بسهولة عبر واتساب.",
    start_url: admin ? "/admin" : "/",
    scope: admin ? "/admin" : "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: "#0f120f",
    theme_color: "#0f120f",
    icons,
  };
}
