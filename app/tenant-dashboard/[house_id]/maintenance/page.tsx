import Link from "next/link";
import { Suspense } from "react";
type PageProps = {
  params: Promise<{ house_id: string }>;
};

async function MaintenanceContent({ params }: PageProps) {
  const { house_id } = await params;

  return <p>House: {house_id}</p>;
}

export default function Page({ params }: PageProps) {
  return (
    <main className="flex flex-col gap-12 mx-auto ">
      <div className="flex mt-24 p-5 border-2 ">
        <Link href={"/tenant-dashboard/df/maintenance/requests"}>
          <p>Requests</p>
        </Link>
      </div>
      <div className="flex mt-24 p-5 border-2 ">
        <Link href={"/tenant-dashboard/df/maintenance/requests"}>
          <p>Report a problem</p>
        </Link>
      </div>

      {/* <Suspense fallback={<p>Loading house details...</p>}>
        <MaintenanceContent params={params} />
      </Suspense> */}
    </main>
  );
}
