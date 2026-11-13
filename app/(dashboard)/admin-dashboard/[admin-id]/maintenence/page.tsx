import Link from "next/link";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ house_id: string }>;
};

const buttonClass =
  "rounded-xl border border-sky-500 px-6 py-4 text-3xl text-sky-500 transition hover:bg-sky-50";

async function MaintenanceLinks({ params }: PageProps) {
  const { house_id } = await params;
  const base = `/tenant-dashboard/${house_id}/maintenance`;

  return (
    <>
      <Link href={`${base}/requests`} className={buttonClass}>
        My requests
      </Link>
      <Link href={`${base}/report`} className={buttonClass}>
        Report a problem
      </Link>
    </>
  );
}

export default function Page({ params }: PageProps) {
  return (
    <main className="flex flex-col items-center gap-16 pt-32">
      <Suspense fallback={<p>Loading...</p>}>
        <MaintenanceLinks params={params} />
      </Suspense>
    </main>
  );
}