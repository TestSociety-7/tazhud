import Link from "next/link";
import { PearlArt } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="page-wash dock-space">
      <div className="container-x rise flex flex-col items-center pt-12 text-center">
        <div className="relative grid place-items-center">
          <p className="big-404 pearl-text-deep select-none" aria-hidden>
            4<span className="inline-block w-[0.62em]" />4
          </p>
          <PearlArt className="!absolute !size-28">
            <span className="font-display text-lg text-forest">؟</span>
          </PearlArt>
        </div>
        <h1 className="font-display mt-6 text-[2rem] leading-tight text-ink">الصفحة غير موجودة</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">الصفحة التي تبحثين عنها نُقلت أو لم تعد موجودة.</p>
        <Link href="/shop" className="btn btn-primary press mt-7">تصفّحي المجموعة</Link>
      </div>
    </div>
  );
}
