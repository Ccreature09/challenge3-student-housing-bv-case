"use client";

import { Suspense, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  deleteAdminMaintenanceRequest,
  getAllMaintenanceRequests,
  updateAdminMaintenanceRequest,
} from "@/app/actions/maintenance";
import { MaintenanceBoard } from "@/components/admin/maintenance-board";

/** Every request tenants submitted, across all accommodations. */
function AllMaintenance() {
  const adminId = useParams<{ "admin-id": string }>()["admin-id"];
  const load = useCallback(async () => {
    const result = await getAllMaintenanceRequests(adminId);
    return result.ok ? { ok: true as const, data: { scopeTitle: null, requests: result.data } } : result;
  }, [adminId]);
  const update = useCallback(
    (requestId: string, input: { status: string; response: string }) =>
      updateAdminMaintenanceRequest(adminId, requestId, input),
    [adminId],
  );
  const remove = useCallback((requestId: string) => deleteAdminMaintenanceRequest(adminId, requestId), [adminId]);
  return (
    <MaintenanceBoard
      title={() => "All accommodations"}
      load={load}
      onUpdate={update}
      onDelete={remove}
      showHouse
      backHref={`/admin-dashboard/${adminId}/home`}
      backLabel="Back to dashboard"
    />
  );
}

export default function AllMaintenancePage() {
  return (
    <Suspense fallback={null}>
      <AllMaintenance />
    </Suspense>
  );
}
