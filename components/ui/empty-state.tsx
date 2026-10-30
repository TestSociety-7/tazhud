import { Star8 } from "./mandala";

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
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="neon-ring mb-6 grid size-20 animate-fade-up place-items-center rounded-full bg-sand text-gold-bright shadow-[0_0_40px_-10px_var(--color-gold)] [&_svg]:size-7">
        {icon ?? <Star8 className="size-6" />}
      </div>
      <Heading className="reel-title text-3xl text-balance">{title}</Heading>
      {body && <p className="mt-2 max-w-sm text-sm text-pretty text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
