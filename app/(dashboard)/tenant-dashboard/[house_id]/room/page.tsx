"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Mail, Phone, UserRound, Wrench } from "lucide-react";
import { getMyRoom } from "@/app/actions/tenant";
import { ModuleCard } from "@/components/admin/module-card";
import { formatDate, formatMoney, useActionData } from "@/components/admin/use-action";

function MyRoom() {
  const houseId = useParams<{ house_id: string }>().house_id;
  const base = `/tenant-dashboard/${houseId}`;
  const load = useCallback(() => getMyRoom(houseId), [houseId]);
  const { data: room, error, loading } = useActionData(load);

  return (
    <main className="flex-1">
      <div className="flex items-center gap-4 border-b border-sky-300 px-8 py-6">
        <Link href={`${base}/home`} aria-label="Back to my house" className="rounded-lg p-2 text-sky-900 hover:bg-sky-50">
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs font-semibold tracking-widest text-sky-700 uppercase">{room?.houseName ?? "My room"}</p>
          <h1 className="text-2xl font-bold text-sky-900">
            {room ? `Room ${room.roomNumber}` : loading ? "Loading…" : "My room"}
          </h1>
          {room && <p className="text-sm text-stone-600">{formatMoney(room.monthlyRent)} per month</p>}
        </div>
      </div>

      {error && !room && (
        <p role="alert" className="m-8 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {room && (
        <div className="flex flex-col gap-8 px-8 py-8 lg:flex-row lg:items-start">
          <section aria-labelledby="tenant-heading" className="flex-1 space-y-5 rounded-2xl border-2 border-sky-300 p-6">
            <h2 id="tenant-heading" className="text-xl font-semibold text-sky-900">Living here</h2>
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-sky-100 text-sky-800">
                <UserRound className="size-7" />
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-900">{room.tenantName}</p>
                <p className="text-sm text-stone-600">
                  Since {formatDate(room.startDate)}
                  {room.endDate ? ` · until ${formatDate(room.endDate)}` : ""}
                </p>
              </div>
            </div>
            <dl className="grid gap-2 text-sm text-stone-800 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-sky-600" aria-hidden />
                <dt className="sr-only">Email</dt>
                <dd>{room.email}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-sky-600" aria-hidden />
                <dt className="sr-only">Phone</dt>
                <dd>{room.phoneNumber ?? "No phone number"}</dd>
              </div>
            </dl>
            <p className="border-t border-sky-200 pt-4 text-xs text-stone-500">
              Are these details wrong? Contact the housing office to update them.
            </p>
          </section>

          <div className="flex justify-center">
            <ModuleCard
              label="Repairs"
              title="Maintenance"
              description="Report a problem in your room and follow its progress."
              icon={Wrench}
              badge={`${room.openMaintenance} open`}
              href={`${base}/room/maintenance`}
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default function MyRoomPage() {
  return (
    <Suspense fallback={null}>
      <MyRoom />
    </Suspense>
  );
}
