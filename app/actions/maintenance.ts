"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/server-auth";
import { runAction, UserError } from "@/lib/action-result";
import { oneOf, requireUuid, text } from "@/lib/validation";
import {
  insertMaintenance,
  MAINTENANCE_STATUSES,
  maintenanceScopeFilter,
  requireMaintenanceScope,
  selectMaintenance,
} from "@/lib/maintenance-queries";
import { maintenanceOrComplaints } from "@/supabase/migrations/schema";

export type { MaintenanceRow, MaintenanceStatus } from "@/lib/maintenance-queries";

export async function listMaintenance(adminId: string, houseId: string, roomId: string | null) {
  return runAction(async () => {
    await requireAdmin(adminId);
    const scopeTitle = await requireMaintenanceScope(houseId, roomId);
    return { scopeTitle, requests: await selectMaintenance(houseId, roomId) };
  });
}

export async function createMaintenance(
  adminId: string,
  houseId: string,
  roomId: string | null,
  input: { title: string; location: string; description: string },
) {
  return runAction(async () => {
    const admin = await requireAdmin(adminId);
    await requireMaintenanceScope(houseId, roomId);
    await insertMaintenance(houseId, roomId, admin.id, input);
    return null;
  });
}

export async function updateMaintenance(
  adminId: string,
  houseId: string,
  roomId: string | null,
  requestId: string,
  input: { status: string; response: string },
) {
  return runAction(async () => {
    await requireAdmin(adminId);
    await requireMaintenanceScope(houseId, roomId);
    requireUuid(requestId, "request");
    const status = oneOf(input.status, MAINTENANCE_STATUSES, "status");
    const now = new Date().toISOString();
    const updated = await db
      .update(maintenanceOrComplaints)
      .set({
        status,
        response: text(input.response, "Response", 5000, { optional: true }),
        updatedAt: now,
        resolvedAt: status === "Resolved" ? now : null,
      })
      .where(and(eq(maintenanceOrComplaints.id, requestId), maintenanceScopeFilter(houseId, roomId)))
      .returning({ id: maintenanceOrComplaints.id });
    if (updated.length === 0) throw new UserError("This request no longer exists.");
    return null;
  });
}
