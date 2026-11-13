import Link from "next/link";
import { Suspense } from "react";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ house_id: string }>;
};

async function SidebarLinks({ params }: { params: LayoutProps["params"] }) {
  const { house_id } = await params;
  const base = `/tenant-dashboard/${house_id}`;

  const links = [
    { label: "Home", href: base },
    { label: "Request repair", href: `${base}/maintenance` },
  ];

  return (
    <nav className="mt-10 flex flex-col gap-5 px-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-xs font-semibold uppercase tracking-wide text-sky-500 hover:text-sky-700"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default function Layout({ children, params }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-white text-sky-500">
      <aside className="w-52 shrink-0 border-r border-sky-500">
        <div className="inline-block border-b border-sky-500 px-50 py-2 text-xs font-semibold uppercase">
          User
        </div>

        <Suspense fallback={<div className="mt-10 px-4 text-xs">...</div>}>
          <SidebarLinks params={params} />
        </Suspense>
      </aside>

      <div className="flex-1">{children}</div>
    </div>
  );
}