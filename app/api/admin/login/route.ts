import { NextResponse } from "next/server";
import { adminPasscode, checkPasscode, createSessionToken, sessionCookie } from "@/lib/admin-auth";
import { jsonError, readBody, sameOrigin } from "@/lib/server/guard";
import { blockedFor, clear, clientIp, hit } from "@/lib/server/rate-limit";

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("طلب غير مسموح.", 403);
  if (!adminPasscode()) return jsonError("الدخول متوقف: لم تُضبط كلمة مرور لوحة التحكم بعد.", 503);

  const ip = clientIp(request);
  const wait = blockedFor("login", ip, MAX_FAILS);
  if (wait) {
    return jsonError(`محاولات كثيرة. حاول مجددًا بعد ${Math.ceil(wait / 60)} دقيقة.`, 429);
  }

  let passcode = "";
  try {
    const body = (await readBody(request, 2_000)) as { passcode?: unknown };
    passcode = typeof body.passcode === "string" ? body.passcode : "";
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }

  if (!(await checkPasscode(passcode))) {
    hit("login", ip, LOCK_MS);
    // A short pause on every wrong try slows guessing further.
    await new Promise((r) => setTimeout(r, 800));
    return jsonError("كلمة المرور غير صحيحة.", 401);
  }

  clear("login", ip);
  const { token, maxAge } = await createSessionToken();
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(sessionCookie(token, maxAge));
  return res;
}
