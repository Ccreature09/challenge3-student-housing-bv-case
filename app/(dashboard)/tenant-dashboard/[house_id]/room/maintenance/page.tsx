"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { TenantMaintenance } from "@/components/admin/tenant-maintenance";

function RoomMaintenance() {
  return <TenantMaintenance houseId={useParams<{ house_id: string }>().house_id} scope="room" />;
}

export default function RoomMaintenancePage() {
  return (
    <Suspense fallback={null}>
      <RoomMaintenance />
    </Suspense>
  );
}
