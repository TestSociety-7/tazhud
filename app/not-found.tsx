import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center overflow-hidden bg-ivory px-4 text-center">
      <div>
        <p className="big-404 neon-text">404</p>
        <h1 className="reel-title mt-4 text-3xl">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-muted">الصفحة التي تبحثين عنها نُقلت أو لم تعد موجودة.</p>
        <Link href="/" className="pop btn btn-neon mt-7 min-h-12 px-7">العودة إلى الرئيسية</Link>
      </div>
    </main>
  );
}
