import Link from "next/link";
import { Suspense } from "react";

import { AppSidebar } from "@/components/sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type PageProps = {
  params: Promise<{ house_id: string }>;
};

async function MaintenanceLinks({ params }: PageProps) {
  const { house_id } = await params;
  const base = `/tenant-dashboard/${house_id}/maintenance`;

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-50 text-center">
      <Link
        href={`${base}/myrequests`}
        className="rounded-xl border border-sky-500 px-6 py-5 text-7xl text-sky-500 transition hover:bg-sky-50 md:text-7xl"
      >
        My requests
      </Link>

      <Link
        href={`${base}/report`}
        className="rounded-xl border border-sky-500 px-6 py-5 text-7xl text-sky-500 transition hover:bg-sky-50 md:text-7xl"
      >
        Report a problem
      </Link>
    </div>
  );
}

export default function Page({ params }: PageProps) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-14 items-center gap-5 border-b px-10">
          <SidebarTrigger />
          <h1 className="font-semibold">Maintenance &amp; Repairs</h1>
        </header>

        <Suspense fallback={<p className="p-6">Loading maintenance links…</p>}>
          <MaintenanceLinks params={params} />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}