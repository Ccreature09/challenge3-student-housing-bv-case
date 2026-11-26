"use client";

import { Suspense, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { createHouse, listHouses, type HouseRow } from "@/app/actions/houses";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Modal } from "@/components/admin/modal";
import { ModuleCard } from "@/components/admin/module-card";
import { useActionData } from "@/components/admin/use-action";

function AdminHome() {
  const adminId = useParams<{ "admin-id": string }>()["admin-id"];
  const base = `/admin-dashboard/${adminId}`;
  const [open, setOpen] = useState(false);

  return (
    <main className="flex-1 p-8">
      <header className="mb-10 text-center">
        <img src="/images/lightlogo.png" alt="Student Housing logo" width={400} height={300} className="mx-auto" />
        <p className="text-3xl font-medium text-gray-700">Student Housing Management Platform</p>
      </header>

      <div className="flex flex-wrap justify-center gap-6">
        <ModuleCard
          label="Properties"
          title="Accommodations"
          description="Find, add and open the houses and apartments you manage."
          icon={Building2}
          onClick={() => setOpen(true)}
        />
        <ModuleCard
          label="People"
          title="Users"
          description="Create, update and remove tenants, staff and admins."
          icon={Users}
          href={`${base}/users`}
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Accommodations"
        description="Fill in the first row and press + to add an accommodation. Click a row to open it."
        size="xl"
      >
        {open && <AccommodationsTable adminId={adminId} base={base} />}
      </Modal>
    </main>
  );
}

function AccommodationsTable({ adminId, base }: { adminId: string; base: string }) {
  const router = useRouter();
  const load = useCallback(() => listHouses(adminId), [adminId]);
  const { data, error, loading, reload } = useActionData(load);

  const columns: Column<HouseRow>[] = [
    {
      key: "street",
      header: "Street",
      render: (row) => <span className="font-medium text-stone-900">{row.street}</span>,
      sortValue: (row) => row.street,
      create: { name: "street", label: "Street", required: true },
    },
    {
      key: "houseNumber",
      header: "Number",
      render: (row) => row.houseNumber,
      sortValue: (row) => row.houseNumber,
      create: { name: "houseNumber", label: "House number", placeholder: "12A", required: true },
      className: "w-28",
    },
    {
      key: "postalCode",
      header: "Postal code",
      render: (row) => row.postalCode,
      sortValue: (row) => row.postalCode,
      create: { name: "postalCode", label: "Postal code", placeholder: "5611 AB", required: true },
      className: "w-32",
    },
    {
      key: "city",
      header: "City",
      render: (row) => row.city,
      sortValue: (row) => row.city,
      create: { name: "city", label: "City", required: true },
    },
    {
      key: "rooms",
      header: "Rooms",
      render: (row) => row.roomCount,
      sortValue: (row) => row.roomCount,
      className: "w-24",
    },
    {
      key: "occupancy",
      header: "Occupied",
      render: (row) => (row.roomCount === 0 ? "—" : `${row.occupiedCount} / ${row.roomCount}`),
      sortValue: (row) => (row.roomCount === 0 ? -1 : row.occupiedCount / row.roomCount),
      className: "w-28",
    },
  ];

  const cities = [...new Set((data ?? []).map((row) => row.city).filter(Boolean))].sort();

  if (loading) return <p className="text-sm text-stone-600">Loading accommodations…</p>;
  if (!data) return <p role="alert" className="text-sm text-red-700">{error}</p>;

  return (
    <>
      {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
      <DataTable
        rows={data}
        rowKey={(row) => row.id}
        columns={columns}
        searchText={(row) => `${row.street} ${row.houseNumber} ${row.postalCode} ${row.city}`}
        searchPlaceholder="Search by street, number, postal code or city"
        filters={[
          {
            key: "city",
            label: "City",
            options: cities.map((city) => ({ value: city, label: city })),
            matches: (row, value) => row.city === value,
          },
          {
            key: "occupancy",
            label: "Occupancy",
            options: [
              { value: "vacant", label: "Has vacant rooms" },
              { value: "full", label: "Fully occupied" },
              { value: "empty", label: "No rooms yet" },
            ],
            matches: (row, value) =>
              value === "empty"
                ? row.roomCount === 0
                : value === "full"
                  ? row.roomCount > 0 && row.occupiedCount >= row.roomCount
                  : row.occupiedCount < row.roomCount,
          },
        ]}
        createLabel="Add accommodation"
        onCreate={async (values) => {
          const result = await createHouse(adminId, {
            street: values.street,
            houseNumber: values.houseNumber,
            postalCode: values.postalCode,
            city: values.city,
          });
          if (!result.ok) return result.error;
          await reload();
          return null;
        }}
        onRowClick={(row) => router.push(`${base}/houses/${row.id}`)}
        rowLabel={(row) => `Open ${row.street} ${row.houseNumber}, ${row.city}`}
        emptyText="No accommodations yet. Add the first one in the row above."
      />
    </>
  );
}

export default function AdminHomePage() {
  return (
    <Suspense fallback={null}>
      <AdminHome />
    </Suspense>
  );
}
