"use client";

import { Suspense, useCallback } from "react";
import { useParams } from "next/navigation";
import { createMaintenance, listMaintenance, updateMaintenance } from "@/app/actions/maintenance";
import { MaintenanceBoard } from "@/components/admin/maintenance-board";

function RoomMaintenance() {
  const params = useParams<{ "admin-id": string; "house-id": string; "room-id": string }>();
  const adminId = params["admin-id"];
  const houseId = params["house-id"];
  const roomId = params["room-id"];
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
      isRoom={true}
      backHref={`/admin-dashboard/${params["admin-id"]}/houses/${params["house-id"]}/rooms/${params["room-id"]}`}
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
