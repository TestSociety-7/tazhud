/** A paper swing tag hanging from a pin on a thread: used on the 404 and error pages. */
export function LostTag({ code }: { code: string }) {
  return (
    <div className="lost-swing relative mx-auto flex w-max flex-col items-center" aria-hidden>
      <span className="pin-head relative z-10 size-3.5" />
      <span className="relative z-10 -mb-4 h-16 w-px bg-ink/50" />
      <span className="lost-tag font-latin grid h-28 w-20 place-items-center rounded-b-md bg-paper pt-5 text-3xl font-bold text-ink shadow-[var(--shadow-soft)]">
        {code}
      </span>
    </div>
  );
}
