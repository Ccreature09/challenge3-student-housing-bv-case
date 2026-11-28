import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const cardClass =
  "group relative flex h-56 w-60 flex-col overflow-hidden rounded-2xl border border-primary/20 bg-primary p-4 text-left text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** A dashboard tile: a link when href is given, otherwise a button. */
export function ModuleCard({
  label,
  title,
  description,
  icon: Icon,
  href,
  onClick,
  badge,
}: {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: string;
}) {
  const content = (
    <>
      <span className="text-xs font-semibold tracking-widest text-sidebar-primary uppercase">{label}</span>
      <span className="text-xl font-semibold">{title}</span>
      {badge && (
        <span className="mt-2 w-fit rounded-full bg-primary-foreground/90 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {badge}
        </span>
      )}
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className="absolute right-0 bottom-6 left-0 mx-auto size-20 text-primary-foreground/70 transition-opacity group-hover:opacity-30"
      />
      <span className="mt-auto translate-y-4 text-sm opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        {description}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cardClass}>
      {content}
    </button>
  );
}
