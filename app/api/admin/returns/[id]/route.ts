import { NextResponse } from "next/server";
import { adminGuard, jsonError, readBody } from "@/lib/server/guard";
import { deleteReturn, readReturn, writeReturn } from "@/lib/server/storage";
import { RETURN_STATUSES, type ReturnStatus } from "@/lib/types";

const RETURN_ID_RE = /^ret-[a-z0-9-]{4,40}$/i;

/** Changes a request's status or the admin's private note. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  const { id } = await params;
  if (!RETURN_ID_RE.test(id)) return jsonError("طلب غير صالح.", 400);
  const current = await readReturn(id);
  if (!current) return jsonError("لم يعد هذا الطلب موجودًا.", 404);
  let body: { status?: unknown; adminNote?: unknown };
  try {
    body = (await readBody(request, 4_000)) as typeof body;
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  const next = {
    ...current,
    status: RETURN_STATUSES.includes(body.status as ReturnStatus) ? (body.status as ReturnStatus) : current.status,
    adminNote: typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 1000) : current.adminNote,
  };
  await writeReturn(next);
  return NextResponse.json({ ok: true, request: next });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  const { id } = await params;
  if (!RETURN_ID_RE.test(id)) return jsonError("طلب غير صالح.", 400);
  await deleteReturn(id);
  return NextResponse.json({ ok: true });
}
