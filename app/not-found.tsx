import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-4 text-center">
      <div>
        <p className="font-display text-6xl text-gold-deep">404</p>
        <h1 className="font-display mt-4 text-3xl text-ink">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-muted">الصفحة التي تبحثين عنها نُقلت أو لم تعد موجودة.</p>
        <Link href="/" className="btn btn-primary mt-6">العودة إلى الرئيسية</Link>
      </div>
    </main>
  );
}
