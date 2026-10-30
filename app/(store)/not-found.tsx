import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="container-x tabbar-pad relative overflow-hidden py-10 text-center">
      <p className="big-404 neon-text mt-4" aria-hidden>404</p>
      <EmptyState as="h1" title="الصفحة غير موجودة" body="الصفحة التي تبحثين عنها نُقلت أو لم تعد موجودة." action={<Link href="/shop" className="btn btn-primary">تصفّحي المجموعة</Link>} />
    </div>
  );
}
