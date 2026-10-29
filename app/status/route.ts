import { connection, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { blobToken, hasSharedStorage } from "@/lib/server/storage";

/** Setup check: is shared storage connected and reachable? Reveals no data. */
export async function GET() {
  await connection();
  let storageWorks = false;
  if (hasSharedStorage()) {
    try {
      await list({ limit: 1, prefix: "store/", token: blobToken() });
      storageWorks = true;
    } catch {
      storageWorks = false;
    }
  }
  return NextResponse.json(
    { ok: true, sharedStorage: hasSharedStorage(), storageWorks, sessionSecret: Boolean(process.env.ADMIN_SESSION_SECRET) },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
