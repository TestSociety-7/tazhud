import Link from "next/link";
import { LogoCoin } from "@/components/ui/fx";

export function Logo({ name = "تزهّد", dark = false, href = "/" }: { name?: string; dark?: boolean; href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label={`${name}، الصفحة الرئيسية`}>
      <LogoCoin hat float={false} className="size-10 sm:size-11" />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.55rem] leading-none font-semibold ${dark ? "text-ivory" : "text-ink"}`}>{name}</span>
        <span className={`font-latin mt-1 text-[0.7rem] tracking-[0.3em] uppercase ${dark ? "text-gold-soft/80" : "text-gold-deep"}`}>Tazhud</span>
      </span>
    </Link>
  );
}
