"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { MaintenanceRequests } from "@/components/tenant/maintenance-requests";

function SharedSpaceMaintenance() {
  return <MaintenanceRequests houseId={useParams<{ house_id: string }>().house_id} scope="house" />;
}

export default function SharedSpaceMaintenancePage() {
  return (
    <Suspense fallback={null}>
      <SharedSpaceMaintenance />
    </Suspense>
  );
}
