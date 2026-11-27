"use client";

import { useCallback } from "react";
import { createTenantMaintenance, listTenantMaintenance } from "@/app/actions/tenant";
import { MaintenanceBoard } from "@/components/admin/maintenance-board";

/** The tenant's maintenance page: their house's common areas, or their own room. */
export function TenantMaintenance({ houseId, scope }: { houseId: string; scope: "house" | "room" }) {
  const load = useCallback(() => listTenantMaintenance(houseId, scope), [houseId, scope]);
  const create = useCallback(
    (input: { title: string; location: string; description: string }) =>
      createTenantMaintenance(houseId, scope, input),
    [houseId, scope],
  );
  const base = `/tenant-dashboard/${houseId}`;
  return (
    <MaintenanceBoard
      load={load}
      onCreate={create}
      isRoom={scope === "room"}
      backHref={scope === "room" ? `${base}/room` : `${base}/home`}
      backLabel={scope === "room" ? "Back to my room" : "Back to my house"}
    />
  );
}
