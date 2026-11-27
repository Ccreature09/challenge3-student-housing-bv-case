"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, DoorOpen, Megaphone, Sparkles, Users, Wrench } from "lucide-react";
import { createRoom, getHouse, listRooms, type RoomRow } from "@/app/actions/houses";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Modal } from "@/components/admin/modal";
import { ModuleCard } from "@/components/admin/module-card";
import { formatMoney, useActionData } from "@/components/admin/use-action";

type Params = { "admin-id": string; "house-id": string };

function HouseDashboard() {
  const params = useParams<Params>();
  const adminId = params["admin-id"];
  const houseId = params["house-id"];
  const base = `/admin-dashboard/${adminId}/houses/${houseId}`;
  const load = useCallback(() => getHouse(adminId, houseId), [adminId, houseId]);
  const { data: house, error, loading, reload } = useActionData(load);
  const [popup, setPopup] = useState<"rooms" | "announcements" | null>(null);

  function close() {
    setPopup(null);
    void reload(); // counts on the tiles may have changed
  }

  return (
    <main className="flex-1">
      <div className="flex items-center gap-4 border-b border-sky-300 px-8 py-6">
        <Link
          href={`/admin-dashboard/${adminId}/home`}
          aria-label="Back to dashboard"
          className="rounded-lg p-2 text-sky-900 hover:bg-sky-50"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs font-semibold tracking-widest text-sky-700 uppercase">Accommodation</p>
          <h1 className="text-2xl font-bold text-sky-900">
            {house ? house.name : loading ? "Loading…" : "Accommodation"}
          </h1>
          {house && (
            <p className="text-sm text-stone-600">
              {house.postalCode} {house.city}
            </p>
          )}
        </div>
      </div>

      {error && !house && (
        <p role="alert" className="m-8 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {house && (
        <div className="flex flex-wrap justify-center gap-6 px-8 py-10">
          <ModuleCard
            label="Units"
            title="Rooms"
            description="See every room, add new ones and open a room's dashboard."
            icon={DoorOpen}
            badge={`${house.counts.rooms} rooms`}
            onClick={() => setPopup("rooms")}
          />
          <ModuleCard
            label="People"
            title="Users"
            description="Tenants currently living in this accommodation."
            icon={Users}
            badge={`${house.counts.tenants} tenants`}
            href={`/admin-dashboard/${adminId}/users?house=${houseId}`}
          />
          <ModuleCard
            label="Repairs"
            title="Maintenance"
            description="Requests for common areas such as the kitchen and living room."
            icon={Wrench}
            badge={`${house.counts.openMaintenance} open`}
            href={`${base}/maintenance`}
          />
          <ModuleCard
            label="Information"
            title="Announcements"
            description="Post, edit and remove announcements for this accommodation."
            icon={Megaphone}
            badge={`${house.counts.announcements} posted`}
            onClick={() => setPopup("announcements")}
          />
          <ModuleCard
            label="Cleaning"
            title="Cleaning schedule"
            description="Schedule which rooms clean the shared spaces and when."
            icon={Sparkles}
            href={`${base}/cleaning`}
          />
        </div>
      )}

      <Modal
        open={popup === "rooms"}
        onClose={close}
        title={`Rooms${house ? ` · ${house.name}` : ""}`}
        description="Fill in the first row and press + to add a room. Click a room to open its dashboard."
        size="xl"
      >
        {popup === "rooms" && <RoomsTable adminId={adminId} houseId={houseId} base={base} />}
      </Modal>

      <Modal
        open={popup === "announcements"}
        onClose={close}
        title={`Announcements${house ? ` · ${house.name}` : ""}`}
        size="lg"
      >
        {popup === "announcements" && <AnnouncementsManager adminId={adminId} houseId={houseId} />}
      </Modal>
    </main>
  );
}

function RoomsTable({ adminId, houseId, base }: { adminId: string; houseId: string; base: string }) {
  const router = useRouter();
  const load = useCallback(() => listRooms(adminId, houseId), [adminId, houseId]);
  const { data, error, loading, reload } = useActionData(load);

  const columns: Column<RoomRow>[] = [
    {
      key: "roomNumber",
      header: "Room number",
      render: (row) => <span className="font-medium text-stone-900">Room {row.roomNumber}</span>,
      sortValue: (row) => row.roomNumber,
      create: { name: "roomNumber", label: "Room number", type: "number", step: "1", required: true },
    },
    {
      key: "rent",
      header: "Monthly rent",
      render: (row) => formatMoney(row.monthlyRent),
      sortValue: (row) => row.monthlyRent,
      create: { name: "monthlyRent", label: "Monthly rent (€)", type: "number", step: "0.01", required: true },
    },
    {
      key: "tenant",
      header: "Tenant",
      render: (row) => row.tenantName ?? <span className="text-stone-400">—</span>,
      sortValue: (row) => row.tenantName,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.tenantId ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}
        >
          {row.tenantId ? "Occupied" : "Vacant"}
        </span>
      ),
      sortValue: (row) => (row.tenantId ? 1 : 0),
      className: "w-32",
    },
  ];

  if (loading) return <p className="text-sm text-stone-600">Loading rooms…</p>;
  if (!data) return <p role="alert" className="text-sm text-red-700">{error}</p>;

  return (
    <DataTable
      rows={data}
      rowKey={(row) => row.id}
      columns={columns}
      searchText={(row) => `room ${row.roomNumber} ${row.tenantName ?? ""}`}
      searchPlaceholder="Search by room number or tenant"
      filters={[
        {
          key: "status",
          label: "Status",
          options: [
            { value: "occupied", label: "Occupied" },
            { value: "vacant", label: "Vacant" },
          ],
          matches: (row, value) => (value === "occupied") === Boolean(row.tenantId),
        },
      ]}
      createLabel="Add room"
      onCreate={async (values) => {
        const result = await createRoom(adminId, houseId, {
          roomNumber: values.roomNumber,
          monthlyRent: values.monthlyRent,
        });
        if (!result.ok) return result.error;
        await reload();
        return null;
      }}
      onRowClick={(row) => router.push(`${base}/rooms/${row.id}`)}
      rowLabel={(row) => `Open room ${row.roomNumber}`}
      emptyText="This accommodation has no rooms yet. Add the first one in the row above."
    />
  );
}

export default function HouseDashboardPage() {
  return (
    <Suspense fallback={null}>
      <HouseDashboard />
    </Suspense>
  );
}
