import Link from "next/link";
import { PearlArt } from "@/components/ui/empty-state";

export default function GlobalNotFound() {
  return (
    <main className="page-wash grid min-h-dvh place-items-center bg-ivory px-4 text-center">
      <div className="rise flex flex-col items-center">
        <div className="relative grid place-items-center">
          <p className="big-404 pearl-text-deep select-none" aria-hidden>
            4<span className="inline-block w-[0.62em]" />4
          </p>
          <PearlArt className="!absolute !size-28">
            <span className="font-display text-lg text-forest">؟</span>
          </PearlArt>
        </div>
        <p className="sr-only">404</p>
        <h1 className="font-display mt-6 text-3xl text-ink">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-muted">الصفحة التي تبحثين عنها نُقلت أو لم تعد موجودة.</p>
        <Link href="/" className="btn btn-primary press mt-7">العودة إلى الرئيسية</Link>
      </div>
    </main>
  );
}
