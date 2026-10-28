import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/admin-auth";
import { jsonError, sameOrigin } from "@/lib/server/guard";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("طلب غير مسموح.", 403);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie("", 0));
  return res;
}
