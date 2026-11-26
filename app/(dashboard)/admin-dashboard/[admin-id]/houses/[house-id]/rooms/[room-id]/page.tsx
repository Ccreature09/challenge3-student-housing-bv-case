"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Mail, Phone, UserRound, Wrench } from "lucide-react";
import { toISODate } from "@/lib/cleaning-data";
import { assignTenant, endTenancy, getRoom } from "@/app/actions/houses";
import { ModuleCard } from "@/components/admin/module-card";
import { formatDate, formatMoney, useActionData } from "@/components/admin/use-action";

type Params = { "admin-id": string; "house-id": string; "room-id": string };

const fieldClass =
  "h-10 w-full rounded-lg border border-sky-300 bg-white px-3 text-sm text-stone-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200";

function RoomDashboard() {
  const params = useParams<Params>();
  const adminId = params["admin-id"];
  const houseId = params["house-id"];
  const roomId = params["room-id"];
  const houseUrl = `/admin-dashboard/${adminId}/houses/${houseId}`;
  const load = useCallback(() => getRoom(adminId, houseId, roomId), [adminId, houseId, roomId]);
  const { data: room, error, loading, reload } = useActionData(load);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const today = toISODate(new Date());

  async function assign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setActionError("");
    const result = await assignTenant(adminId, houseId, roomId, {
      studentId: String(form.get("studentId")),
      startDate: String(form.get("startDate")),
    });
    if (!result.ok) setActionError(result.error);
    await reload();
    setBusy(false);
  }

  async function end(event: React.FormEvent<HTMLFormElement>, assignmentId: string) {
    event.preventDefault();
    const endDate = String(new FormData(event.currentTarget).get("endDate"));
    setBusy(true);
    setActionError("");
    const result = await endTenancy(adminId, houseId, assignmentId, endDate);
    if (!result.ok) setActionError(result.error);
    await reload();
    setBusy(false);
  }

  const current = room?.current ?? null;
  const upcoming = room?.history.find((entry) => !entry.active && entry.startDate > today) ?? null;

  return (
    <main className="flex-1">
      <div className="flex items-center gap-4 border-b border-sky-300 px-8 py-6">
        <Link href={houseUrl} aria-label="Back to accommodation" className="rounded-lg p-2 text-sky-900 hover:bg-sky-50">
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs font-semibold tracking-widest text-sky-700 uppercase">{room?.houseName ?? "Room"}</p>
          <h1 className="text-2xl font-bold text-sky-900">
            {room ? `Room ${room.roomNumber}` : loading ? "Loading…" : "Room"}
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
            {actionError && (
              <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800">{actionError}</p>
            )}

            {current ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-full bg-sky-100 text-sky-800">
                    <UserRound className="size-7" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-stone-900">{current.firstName} {current.lastName}</p>
                    <p className="text-sm text-stone-600">
                      Since {formatDate(current.startDate)}
                      {current.endDate ? ` · until ${formatDate(current.endDate)}` : ""}
                    </p>
                  </div>
                </div>
                <dl className="grid gap-2 text-sm text-stone-800 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-sky-600" aria-hidden />
                    <dt className="sr-only">Email</dt>
                    <dd><a href={`mailto:${current.email}`} className="text-sky-700 hover:underline">{current.email}</a></dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-sky-600" aria-hidden />
                    <dt className="sr-only">Phone</dt>
                    <dd>{current.phoneNumber ?? "No phone number"}</dd>
                  </div>
                </dl>
                <form onSubmit={(event) => void end(event, current.assignmentId)} className="flex flex-wrap items-end gap-3 border-t border-sky-200 pt-4">
                  <label className="text-sm font-semibold text-sky-900">
                    End tenancy on
                    <input
                      name="endDate"
                      type="date"
                      required
                      min={current.startDate}
                      defaultValue={current.endDate ?? today}
                      className={`${fieldClass} mt-1 w-48`}
                    />
                  </label>
                  <button type="submit" disabled={busy} className="h-10 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                    Save end date
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-stone-600">
                  {upcoming
                    ? `Nobody lives here right now. ${upcoming.firstName} ${upcoming.lastName} moves in on ${formatDate(upcoming.startDate)}.`
                    : "This room is vacant."}
                </p>
                {!upcoming && (
                  room.availableTenants.length === 0 ? (
                    <p className="text-sm text-stone-600">
                      Every tenant already has a room.{" "}
                      <Link href={`/admin-dashboard/${adminId}/users`} className="text-sky-700 underline">Add a tenant</Link> first.
                    </p>
                  ) : (
                    <form onSubmit={(event) => void assign(event)} className="flex flex-wrap items-end gap-3">
                      <label className="min-w-60 flex-1 text-sm font-semibold text-sky-900">
                        Tenant
                        <select name="studentId" required className={`${fieldClass} mt-1`}>
                          {room.availableTenants.map((tenant) => (
                            <option key={tenant.id} value={tenant.id}>
                              {tenant.firstName} {tenant.lastName} ({tenant.email})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm font-semibold text-sky-900">
                        Moves in on
                        <input name="startDate" type="date" required defaultValue={today} className={`${fieldClass} mt-1 w-48`} />
                      </label>
                      <button type="submit" disabled={busy} className="h-10 rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                        Assign tenant
                      </button>
                    </form>
                  )
                )}
              </div>
            )}

            {room.history.length > 0 && (
              <div className="border-t border-sky-200 pt-4">
                <h3 className="mb-2 text-sm font-semibold text-sky-900">Tenancy history</h3>
                <ul className="space-y-1 text-sm text-stone-700">
                  {room.history.map((entry) => (
                    <li key={entry.assignmentId} className="flex justify-between gap-4">
                      <span>{entry.firstName} {entry.lastName}</span>
                      <span className="text-stone-500">
                        {formatDate(entry.startDate)} – {entry.endDate ? formatDate(entry.endDate) : "now"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <div className="flex justify-center">
            <ModuleCard
              label="Repairs"
              title="Maintenance"
              description="Maintenance and repair requests for this room."
              icon={Wrench}
              href={`${houseUrl}/rooms/${roomId}/maintenance`}
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default function RoomDashboardPage() {
  return (
    <Suspense fallback={null}>
      <RoomDashboard />
    </Suspense>
  );
}
