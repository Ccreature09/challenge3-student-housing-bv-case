import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { UserError } from "@/lib/action-result";
import { requireUuid, text } from "@/lib/validation";
import { houses, maintenanceOrComplaints, rooms, users } from "@/supabase/migrations/schema";

// Shared by the admin and tenant maintenance actions. Authorization happens in the callers.

export const MAINTENANCE_STATUSES = ["Submitted", "In progress", "Resolved"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export type MaintenanceRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  status: MaintenanceStatus;
  response: string;
  submittedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
  hasPhoto: boolean;
};

/** roomId null = the house's common areas (kitchen, living room, ...). Returns a title for the scope. */
export async function requireMaintenanceScope(houseId: string, roomId: string | null) {
  requireUuid(houseId, "house");
  if (roomId === null) {
    const [house] = await db.select({ id: houses.id }).from(houses).where(eq(houses.id, houseId)).limit(1);
    if (!house) throw new UserError("This accommodation does not exist.");
    return "Common areas";
  }
  requireUuid(roomId, "room");
  const [room] = await db
    .select({ roomNumber: rooms.roomNumber })
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.houseId, houseId)))
    .limit(1);
  if (!room) throw new UserError("This room does not exist in this accommodation.");
  return `Room ${room.roomNumber}`;
}

export function maintenanceScopeFilter(houseId: string, roomId: string | null) {
  return and(
    eq(maintenanceOrComplaints.houseId, houseId),
    roomId === null ? isNull(maintenanceOrComplaints.roomId) : eq(maintenanceOrComplaints.roomId, roomId),
  );
}

export async function selectMaintenance(houseId: string, roomId: string | null): Promise<MaintenanceRow[]> {
  const rows = await db
    .select({
      id: maintenanceOrComplaints.id,
      title: maintenanceOrComplaints.title,
      description: maintenanceOrComplaints.description,
      location: maintenanceOrComplaints.location,
      status: maintenanceOrComplaints.status,
      response: maintenanceOrComplaints.response,
      createdAt: maintenanceOrComplaints.createdAt,
      resolvedAt: maintenanceOrComplaints.resolvedAt,
      hasPhoto: sql<boolean>`${maintenanceOrComplaints.photo} IS NOT NULL`,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(maintenanceOrComplaints)
    .leftJoin(users, eq(users.id, maintenanceOrComplaints.submittedBy))
    .where(maintenanceScopeFilter(houseId, roomId))
    .orderBy(desc(maintenanceOrComplaints.createdAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    location: row.location ?? "",
    status: (MAINTENANCE_STATUSES as readonly string[]).includes(row.status ?? "")
      ? (row.status as MaintenanceStatus)
      : "Submitted",
    response: row.response ?? "",
    submittedBy: row.firstName ? `${row.firstName} ${row.lastName}` : null,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    hasPhoto: row.hasPhoto,
  }));
}

export async function insertMaintenance(
  houseId: string,
  roomId: string | null,
  submittedBy: string,
  input: { title: string; location: string; description: string },
) {
  await db.insert(maintenanceOrComplaints).values({
    houseId,
    roomId,
    title: text(input.title, "Title", 150),
    location: text(input.location, "Location", 150),
    description: text(input.description, "Description", 5000),
    status: "Submitted",
    type: "maintenance",
    submittedBy,
  });
}
