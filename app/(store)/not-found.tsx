import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="container-x py-16">
      <EmptyState as="h1" title="الصفحة غير موجودة" body="الصفحة التي تبحثين عنها نُقلت أو لم تعد موجودة." action={<Link href="/shop" className="btn btn-primary">تصفّحي المجموعة</Link>} />
    </div>
  );
}
