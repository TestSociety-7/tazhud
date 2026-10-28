import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdmin, jsonError, sameOrigin } from "@/lib/server/guard";
import { hasSharedStorage } from "@/lib/server/storage";

/** Issues short-lived tokens so the admin can upload product photos straight to Vercel Blob. */
export async function POST(request: Request) {
  if (!hasSharedStorage()) return jsonError("التخزين المشترك غير متصل.", 503);
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  // Token requests come from the admin's browser; completion callbacks come
  // from Vercel and are verified by handleUpload itself.
  if (body.type === "blob.generate-client-token") {
    if (!sameOrigin(request)) return jsonError("طلب غير مسموح.", 403);
    if (!(await isAdmin())) return jsonError("انتهت جلسة الدخول. سجّل الدخول مجددًا.", 401);
  }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Photos only, only in the products folder, never replacing an existing file.
        if (!/^products\/[\w.-]{1,80}\.(jpe?g|png|webp|avif)$/i.test(pathname)) throw new Error("اسم ملف غير صالح.");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
          allowOverwrite: false,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("upload", err);
    return jsonError("تعذّر رفع الصورة. حاول مجددًا.", 400);
  }
}
