import { connection, NextResponse } from "next/server";
import { hasSharedStorage } from "@/lib/server/storage";

/** Setup check: is shared storage connected, and which setting names exist (never their values). */
export async function GET() {
  await connection();
  const names = Object.keys(process.env).filter((k) => /BLOB|READ_WRITE_TOKEN|^ADMIN_/.test(k)).sort();
  return NextResponse.json(
    { ok: true, sharedStorage: hasSharedStorage(), settings: names },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
