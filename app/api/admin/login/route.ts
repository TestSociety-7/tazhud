import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPasscode, createSessionToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  let passcode = "";
  try {
    const body = (await request.json()) as { passcode?: unknown };
    passcode = typeof body.passcode === "string" ? body.passcode : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!passcode || !(await checkPasscode(passcode))) {
    // Small delay slows down guessing.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: false, error: "That passcode isn't right." }, { status: 401 });
  }

  const { token, maxAge } = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}
