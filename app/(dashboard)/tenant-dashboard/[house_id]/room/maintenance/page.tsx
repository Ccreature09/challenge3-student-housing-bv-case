"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { MaintenanceRequests } from "@/components/tenant/maintenance-requests";

function RoomMaintenance() {
  return <MaintenanceRequests houseId={useParams<{ house_id: string }>().house_id} scope="room" />;
}

export default function RoomMaintenancePage() {
  return (
    <Suspense fallback={null}>
      <RoomMaintenance />
    </Suspense>
  );
}
