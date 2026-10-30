import { ImageResponse } from "next/og";
import { seedProducts } from "@/lib/seed";
import { readCatalog } from "@/lib/server/storage";
import { ORDER_NUMBER_RE, parseOrderItems } from "@/lib/order-pictures";
import { SITE_URL } from "@/lib/site";

export const alt = "صور القطع في الطلب";
// Kept small so WhatsApp (which skips large preview pictures) always shows it.
export const size = { width: 900, height: 473 };
const k = 0.75;
export const contentType = "image/png";

/** Fetches a picture as a data address so the image renderer never has to fetch it itself. */
async function asData(src: string) {
  try {
    const url = new URL(src.startsWith("http") ? src : `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`);
    // Only this site and its own photo storage, never any other address.
    if (url.protocol !== "https:" || (url.origin !== new URL(SITE_URL).origin && !url.hostname.endsWith(".public.blob.vercel-storage.com"))) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok || Number(res.headers.get("content-length") ?? 0) > 4_000_000) return null;
    const type = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    if (!/^image\/(png|jpeg)$/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4_000_000) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const INK = "#2a0f1d";
const GOLD = "#d39b2a";
const IVORY = "#f6eeee";

/** The picture WhatsApp shows above the order message: every ordered piece side by side. */
export default async function Image({ params }: { params: Promise<{ number: string; items: string }> }) {
  const { number, items } = await params;
  const n = decodeURIComponent(number).toUpperCase();
  const products = (await readCatalog())?.products ?? seedProducts;
  const list = ORDER_NUMBER_RE.test(n)
    ? parseOrderItems(items).flatMap((it) => {
        const p = products.find((x) => x.slug === it.slug);
        return p?.images[0] ? [{ src: p.images[0], quantity: it.quantity }] : [];
      })
    : [];
  const shown = list.slice(0, 4);
  const [logo, ...pictures] = await Promise.all([asData("/brand/tazhud-logo.jpg"), ...shown.map((x) => asData(x.src))]);
  const pieces = list.reduce((s, x) => s + x.quantity, 0);
  const tileW = Math.round((shown.length <= 1 ? 400 : shown.length === 2 ? 330 : shown.length === 3 ? 230 : 168) * k);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: INK, padding: 36 * k }}>
        <div style={{ flex: 1, display: "flex", border: `2px solid ${GOLD}`, borderRadius: 28 * k, padding: `${28 * k}px ${36 * k}px`, alignItems: "center", gap: 36 * k }}>
          <div style={{ width: 270 * k, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 * k }}>
            {logo ? (
              <img src={logo} width={150 * k} height={150 * k} alt="" style={{ borderRadius: 999 * k, border: `3px solid ${GOLD}` }} />
            ) : null}
            <div style={{ display: "flex", color: GOLD, fontSize: 30 * k, letterSpacing: 10 * k }}>TAZHUD</div>
            <div style={{ display: "flex", color: IVORY, fontSize: 30 * k }}>{ORDER_NUMBER_RE.test(n) ? n : ""}</div>
            <div style={{ display: "flex", color: "rgba(247,242,233,0.6)", fontSize: 24 * k }}>{pieces ? `${pieces} PCS` : ""}</div>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 * k }}>
            {shown.map((x, i) =>
              pictures[i] ? (
                <div key={i} style={{ position: "relative", display: "flex", width: tileW, height: Math.round(tileW * 1.25), borderRadius: `${tileW}px ${tileW}px 20px 20px`, overflow: "hidden", background: IVORY, border: `2px solid ${GOLD}` }}>
                  <img src={pictures[i]!} alt="" width={tileW} height={Math.round(tileW * 1.25)} style={{ objectFit: "cover" }} />
                  {x.quantity > 1 ? (
                    <div style={{ position: "absolute", bottom: 14 * k, left: 14 * k, display: "flex", background: INK, color: IVORY, fontSize: 26 * k, padding: `${4 * k}px ${14 * k}px`, borderRadius: 999 * k }}>{`×${x.quantity}`}</div>
                  ) : null}
                </div>
              ) : null,
            )}
            {list.length > 4 ? <div style={{ display: "flex", color: GOLD, fontSize: 40 * k }}>{`+${list.length - 4}`}</div> : null}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
