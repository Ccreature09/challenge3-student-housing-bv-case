"use client";

import { Suspense, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  deleteAdminMaintenanceRequest,
  getAdminMaintenanceRequests,
  updateAdminMaintenanceRequest,
} from "@/app/actions/maintenance";
import { MaintenanceBoard } from "@/components/admin/maintenance-board";

/** Requests tenants submitted for one room. */
function RoomMaintenance() {
  const params = useParams<{ "admin-id": string; "house-id": string; "room-id": string }>();
  const adminId = params["admin-id"];
  const houseId = params["house-id"];
  const roomId = params["room-id"];
  const load = useCallback(() => getAdminMaintenanceRequests(adminId, houseId, roomId), [adminId, houseId, roomId]);
  const update = useCallback(
    (requestId: string, input: { status: string; response: string }) =>
      updateAdminMaintenanceRequest(adminId, requestId, input),
    [adminId],
  );
  const remove = useCallback((requestId: string) => deleteAdminMaintenanceRequest(adminId, requestId), [adminId]);
  return (
    <MaintenanceBoard
      title={(scopeTitle) => scopeTitle ?? "Room"}
      load={load}
      onUpdate={update}
      onDelete={remove}
      backHref={`/admin-dashboard/${adminId}/houses/${houseId}/rooms/${roomId}`}
      backLabel="Back to room"
    />
  );
}

export default function RoomMaintenancePage() {
  return (
    <Suspense fallback={null}>
      <RoomMaintenance />
    </Suspense>
  );
}
