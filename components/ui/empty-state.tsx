import { Star8 } from "./mandala";

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-5 grid size-16 place-items-center rounded-full bg-sand text-gold">
        {icon ?? <Star8 className="size-6" />}
      </div>
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      {body && <p className="mt-2 max-w-sm text-sm text-pretty text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
