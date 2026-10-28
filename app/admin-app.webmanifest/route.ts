import { appManifest } from "@/lib/pwa";

/** The admin's own home-screen app. Kept outside /admin so it loads before sign-in. */
export function GET() {
  return new Response(JSON.stringify(appManifest("admin")), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" },
  });
}
