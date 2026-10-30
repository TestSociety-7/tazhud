import Link from "next/link";
import { LostTag } from "@/components/store/atelier/lost-tag";

export default function GlobalNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-4 text-center">
      <div>
        <LostTag code="404" />
        <h1 className="font-display mt-8 text-3xl text-ink">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-muted">الصفحة التي تبحثين عنها نُقلت أو لم تعد موجودة.</p>
        <Link href="/" className="btn btn-primary mt-7">العودة إلى الرئيسية</Link>
      </div>
    </main>
  );
}
