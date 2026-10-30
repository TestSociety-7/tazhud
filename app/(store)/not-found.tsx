import Link from "next/link";
import { LostTag } from "@/components/store/atelier/lost-tag";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-14 text-center sm:py-20">
      <LostTag code="404" />
      <h1 className="font-display mt-8 text-3xl text-ink sm:text-4xl">الصفحة غير موجودة</h1>
      <p className="mt-2 max-w-sm text-sm text-pretty text-muted">الصفحة التي تبحثين عنها نُقلت أو لم تعد موجودة.</p>
      <Link href="/shop" className="btn btn-primary mt-7">تصفّحي المجموعة</Link>
    </div>
  );
}
