"use client";

import { Suspense, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  deleteAdminMaintenanceRequest,
  getAdminMaintenanceRequests,
  updateAdminMaintenanceRequest,
} from "@/app/actions/maintenance";
import { MaintenanceBoard } from "@/components/admin/maintenance-board";

/** Requests tenants submitted for the shared spaces (kitchen, living room, …) of one house. */
function HouseMaintenance() {
  const params = useParams<{ "admin-id": string; "house-id": string }>();
  const adminId = params["admin-id"];
  const houseId = params["house-id"];
  const load = useCallback(() => getAdminMaintenanceRequests(adminId, houseId, null), [adminId, houseId]);
  const update = useCallback(
    (requestId: string, input: { status: string; response: string }) =>
      updateAdminMaintenanceRequest(adminId, requestId, input),
    [adminId],
  );
  const remove = useCallback((requestId: string) => deleteAdminMaintenanceRequest(adminId, requestId), [adminId]);
  return (
    <MaintenanceBoard
      title={() => "Shared spaces"}
      load={load}
      onUpdate={update}
      onDelete={remove}
      backHref={`/admin-dashboard/${adminId}/houses/${houseId}`}
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
