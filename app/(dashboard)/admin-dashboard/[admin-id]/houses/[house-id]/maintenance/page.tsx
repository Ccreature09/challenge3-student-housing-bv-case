"use client";

import { Suspense, useCallback } from "react";
import { useParams } from "next/navigation";
import { createMaintenance, listMaintenance, updateMaintenance } from "@/app/actions/maintenance";
import { MaintenanceBoard } from "@/components/admin/maintenance-board";

function HouseMaintenance() {
  const params = useParams<{ "admin-id": string; "house-id": string }>();
  const adminId = params["admin-id"];
  const houseId = params["house-id"];
  const roomId = null;
  const load = useCallback(() => listMaintenance(adminId, houseId, roomId), [adminId, houseId, roomId]);
  const create = useCallback(
    (input: { title: string; location: string; description: string }) =>
      createMaintenance(adminId, houseId, roomId, input),
    [adminId, houseId, roomId],
  );
  const update = useCallback(
    (requestId: string, input: { status: string; response: string }) =>
      updateMaintenance(adminId, houseId, roomId, requestId, input),
    [adminId, houseId, roomId],
  );
  return (
    <MaintenanceBoard
      load={load}
      onCreate={create}
      onUpdate={update}
      isRoom={false}
      backHref={`/admin-dashboard/${params["admin-id"]}/houses/${params["house-id"]}`}
      backLabel="Back to accommodation"
    />
  );
}

export default function HouseMaintenancePage() {
  return (
    <Suspense fallback={null}>
      <HouseMaintenance />
    </Suspense>
  );
}
