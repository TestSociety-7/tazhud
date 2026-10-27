import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdmin, jsonError } from "@/lib/server/guard";
import { hasSharedStorage } from "@/lib/server/storage";

/** Issues short-lived tokens so the admin can upload product photos straight to Vercel Blob. */
export async function POST(request: Request) {
  if (!hasSharedStorage()) return jsonError("التخزين المشترك غير متصل.", 503);
  const body = (await request.json()) as HandleUploadBody;
  // Token requests come from the admin's browser; completion callbacks come
  // from Vercel and are verified by handleUpload itself.
  if (body.type === "blob.generate-client-token" && !(await isAdmin())) {
    return jsonError("انتهت جلسة الدخول. سجّل الدخول مجددًا.", 401);
  }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
        maximumSizeInBytes: 15 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "تعذّر رفع الصورة.", 400);
  }
}
