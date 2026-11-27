import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const cardClass =
  "group relative flex h-56 w-60 flex-col overflow-hidden rounded-xl border-3 border-blue-900 bg-blue-400 p-4 text-left transition-colors hover:bg-blue-500 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-900";

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
      <span className="text-sm font-medium tracking-widest text-blue-900 uppercase">{label}</span>
      <span className="text-xl font-medium text-white">{title}</span>
      {badge && (
        <span className="mt-2 w-fit rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-blue-900">
          {badge}
        </span>
      )}
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className="absolute right-0 bottom-6 left-0 mx-auto size-20 text-white/80 transition-opacity group-hover:opacity-30"
      />
      <span className="mt-auto translate-y-4 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
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
