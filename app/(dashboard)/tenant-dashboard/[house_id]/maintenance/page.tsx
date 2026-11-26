"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { TenantMaintenance } from "@/components/admin/tenant-maintenance";

function HouseMaintenance() {
  return <TenantMaintenance houseId={useParams<{ house_id: string }>().house_id} scope="house" />;
}

export default function HouseMaintenancePage() {
  return (
    <Suspense fallback={null}>
      <HouseMaintenance />
    </Suspense>
  );
}
