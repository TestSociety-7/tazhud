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
      <div className="pinked-all mb-6 grid size-16 -rotate-3 place-items-center bg-sand text-forest [--z:4px]">
        <span className="grid size-[3.25rem] place-items-center rounded-sm outline-1 -outline-offset-1 outline-dashed outline-forest/25">
          {icon ?? <Star8 className="size-6" />}
        </span>
      </div>
      <Heading className="font-display text-3xl text-ink">{title}</Heading>
      {body && <p className="mt-2 max-w-sm text-sm text-pretty text-muted">{body}</p>}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
