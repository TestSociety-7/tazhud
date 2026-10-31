import { Star8 } from "./mandala";

/** A floating pearl with an orbit, used above empty and error messages. */
export function PearlArt({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`pearl-art ${className}`} aria-hidden>
      <span className="moon-glow inset-0" />
      <span className="pearl-halo back" />
      <span className="float-3d relative">
        <span className="pearl-orb">{children}</span>
      </span>
      <span className="pearl-halo front" />
      <i className="pearl-seed top-3 start-4" />
      <i className="pearl-seed bottom-5 end-2" />
      <i className="pearl-seed top-8 end-5" />
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
  as: Heading = "h2",
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  /** Use "h1" when the empty state is the whole page. */
  as?: "h1" | "h2";
}) {
  return (
    <div className="rise flex flex-col items-center px-6 py-14 text-center">
      <PearlArt className="mb-6">
        <span className="text-forest [&_svg]:size-7">{icon ?? <Star8 className="size-7" />}</span>
      </PearlArt>
      <Heading className="font-display text-[2rem] leading-tight text-ink text-balance">{title}</Heading>
      {body && <p className="mt-2 max-w-sm text-sm leading-relaxed text-pretty text-muted">{body}</p>}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
