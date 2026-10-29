import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { adminGuard, jsonError } from "@/lib/server/guard";
import { blobToken } from "@/lib/server/storage";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, { ext: string; magic: (b: Uint8Array) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/webp": { ext: "webp", magic: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
};

/**
 * Saves one product photo (already resized in the browser) to Vercel Blob.
 * Works with either a Blob read-write token or Vercel's built-in OIDC access.
 */
export async function POST(request: Request) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  const type = TYPES[(request.headers.get("content-type") ?? "").split(";")[0].trim()];
  if (!type) return jsonError("الصيغ المسموحة: JPG أو PNG أو WebP.", 415);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES) return jsonError("الصورة كبيرة جدًا.", 413);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return jsonError("الصورة كبيرة جدًا.", 413);
  if (!type.magic(bytes)) return jsonError("هذا الملف ليس صورة صالحة.", 415);
  try {
    const blob = await put(`products/photo.${type.ext}`, Buffer.from(bytes), {
      access: "public",
      addRandomSuffix: true,
      contentType: Object.keys(TYPES).find((k) => TYPES[k] === type),
      token: blobToken(),
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("upload", err);
    return jsonError("تعذّر رفع الصورة. حاول مجددًا.", 502);
  }
}
