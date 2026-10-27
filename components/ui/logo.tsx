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

export function Logo({ name = "Tazhud", dark = false, href = "/" }: { name?: string; dark?: boolean; href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label={`${name} home`}>
      <LogoMark className="size-10 transition-transform duration-700 group-hover:rotate-[24deg] sm:size-11" />
      <span className={`font-display text-[1.6rem] leading-none tracking-wide ${dark ? "text-ivory" : "text-ink"}`}>
        {name}
      </span>
    </Link>
  );
}
