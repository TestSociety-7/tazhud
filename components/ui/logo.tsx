/* eslint-disable @next/next/no-img-element -- small static brand mark */
import Link from "next/link";

export function LogoMark({ className = "size-11" }: { className?: string }) {
  return (
    <img
      src="/brand/tazhud-logo.jpg"
      alt=""
      width={150}
      height={150}
      className={`rounded-full ring-1 ring-gold/50 ${className}`}
    />
  );
}

export function Logo({ name = "تزهّد", dark = false, href = "/" }: { name?: string; dark?: boolean; href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label={`${name}، الصفحة الرئيسية`}>
      <LogoMark className="size-10 transition-transform duration-700 group-hover:rotate-[24deg] sm:size-11" />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.55rem] leading-none font-semibold ${dark ? "text-ivory" : "text-ink"}`}>{name}</span>
        <span className={`font-latin mt-1 text-[0.7rem] tracking-[0.3em] uppercase ${dark ? "text-gold-soft/80" : "text-gold-deep"}`}>Tazhud</span>
      </span>
    </Link>
  );
}
