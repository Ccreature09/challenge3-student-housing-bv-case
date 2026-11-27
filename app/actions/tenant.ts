"use server";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { getAuthenticatedProfile } from "@/lib/server-auth";
import { runAction, UserError } from "@/lib/action-result";
import { oneOf, requireUuid } from "@/lib/validation";
import { insertMaintenance, selectMaintenance } from "@/lib/maintenance-queries";
import {
  announcements,
  houses,
  maintenanceOrComplaints,
  roomAssignments,
  rooms,
  users,
} from "@/supabase/migrations/schema";
import type { AnnouncementRow, Priority } from "@/app/actions/announcements";

// Everything a tenant can see is limited to the house they live in and their own room.

const activeAssignment = sql`${roomAssignments.startDate} <= CURRENT_DATE AND (${roomAssignments.endDate} IS NULL OR ${roomAssignments.endDate} >= CURRENT_DATE)`;

/** The signed-in tenant and their current room, which must be in the house of the URL. */
async function requireTenant(houseId: string) {
  requireUuid(houseId, "house");
  const profile = await getAuthenticatedProfile();
  if (profile.role !== "tenant") throw new UserError("Only tenants can use the tenant dashboard.");

  const [tenancy] = await db
    .select({
      assignmentId: roomAssignments.id,
      startDate: roomAssignments.startDate,
      endDate: roomAssignments.endDate,
      roomId: rooms.id,
      roomNumber: rooms.roomNumber,
      monthlyRent: rooms.monthlyRent,
      street: houses.street,
      houseNumber: houses.houseNumber,
      postalCode: houses.postalCode,
      city: houses.city,
    })
    .from(roomAssignments)
    .innerJoin(rooms, eq(rooms.id, roomAssignments.roomId))
    .innerJoin(houses, eq(houses.id, rooms.houseId))
    .where(and(eq(roomAssignments.studentId, profile.id), eq(rooms.houseId, houseId), activeAssignment))
    .limit(1);
  if (!tenancy) throw new UserError("You do not live in this accommodation.");

  return {
    profile,
    ...tenancy,
    houseName: `${tenancy.street ?? ""} ${tenancy.houseNumber}`.trim(),
  };
}

export async function getTenantHome(houseId: string) {
  return runAction(async () => {
    const tenant = await requireTenant(houseId);
    const [[housemates], [openRequests], [announcementCount]] = await Promise.all([
      db
        .select({ n: sql<number>`count(DISTINCT ${roomAssignments.studentId})::int` })
        .from(roomAssignments)
        .innerJoin(rooms, eq(rooms.id, roomAssignments.roomId))
        .where(and(eq(rooms.houseId, houseId), activeAssignment)),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(maintenanceOrComplaints)
        .where(
          and(
            eq(maintenanceOrComplaints.houseId, houseId),
            isNull(maintenanceOrComplaints.roomId),
            sql`coalesce(${maintenanceOrComplaints.status}, 'Submitted') <> 'Resolved'`,
          ),
        ),
      db.select({ n: sql<number>`count(*)::int` }).from(announcements).where(eq(announcements.houseId, houseId)),
    ]);
    return {
      firstName: tenant.profile.firstName,
      houseName: tenant.houseName,
      postalCode: tenant.postalCode ?? "",
      city: tenant.city ?? "",
      roomNumber: tenant.roomNumber,
      counts: {
        housemates: Math.max(0, housemates.n - 1),
        openMaintenance: openRequests.n,
        announcements: announcementCount.n,
      },
    };
  });
}

/** Other tenants of the house: names and room numbers only, no contact details. */
export async function listHousemates(houseId: string) {
  return runAction(async () => {
    const tenant = await requireTenant(houseId);
    const rows = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        roomNumber: rooms.roomNumber,
      })
      .from(roomAssignments)
      .innerJoin(rooms, eq(rooms.id, roomAssignments.roomId))
      .innerJoin(users, eq(users.id, roomAssignments.studentId))
      .where(and(eq(rooms.houseId, houseId), activeAssignment, isNull(users.deletedAt)))
      .orderBy(asc(rooms.roomNumber));
    return rows.map((row) => ({ ...row, isMe: row.id === tenant.profile.id }));
  });
}

export async function listHouseAnnouncements(houseId: string) {
  return runAction(async () => {
    await requireTenant(houseId);
    const rows = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        description: announcements.description,
        priority: announcements.priority,
        createdAt: announcements.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(announcements)
      .leftJoin(users, eq(users.id, announcements.createdBy))
      .where(eq(announcements.houseId, houseId))
      .orderBy(desc(announcements.createdAt));
    return rows.map<AnnouncementRow>((row) => ({
      id: row.id,
      title: row.title ?? "",
      description: row.description ?? "",
      priority: (["low", "normal", "high"].includes(row.priority ?? "") ? row.priority : "normal") as Priority,
      createdAt: row.createdAt,
      author: row.firstName ? `${row.firstName} ${row.lastName}` : null,
    }));
  });
}

export async function getMyRoom(houseId: string) {
  return runAction(async () => {
    const tenant = await requireTenant(houseId);
    const [open] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(maintenanceOrComplaints)
      .where(
        and(
          eq(maintenanceOrComplaints.roomId, tenant.roomId),
          sql`coalesce(${maintenanceOrComplaints.status}, 'Submitted') <> 'Resolved'`,
        ),
      );
    return {
      roomNumber: tenant.roomNumber,
      monthlyRent: Number(tenant.monthlyRent),
      startDate: tenant.startDate,
      endDate: tenant.endDate,
      houseName: `${tenant.houseName}, ${tenant.city ?? ""}`.replace(/, $/, ""),
      tenantName: `${tenant.profile.firstName} ${tenant.profile.lastName}`,
      email: tenant.profile.email,
      phoneNumber: tenant.profile.phoneNumber,
      openMaintenance: open.n,
    };
  });
}

type Scope = "house" | "room";

/** Requests for the house's common areas, or for the tenant's own room. */
export async function listTenantMaintenance(houseId: string, scope: Scope) {
  return runAction(async () => {
    const tenant = await requireTenant(houseId);
    const roomId = oneOf(scope, ["house", "room"] as const, "scope") === "room" ? tenant.roomId : null;
    return {
      scopeTitle: roomId ? `Room ${tenant.roomNumber}` : "Common areas",
      requests: await selectMaintenance(houseId, roomId),
    };
  });
}

export async function createTenantMaintenance(
  houseId: string,
  scope: Scope,
  input: { title: string; location: string; description: string },
) {
  return runAction(async () => {
    const tenant = await requireTenant(houseId);
    const roomId = oneOf(scope, ["house", "room"] as const, "scope") === "room" ? tenant.roomId : null;
    await insertMaintenance(houseId, roomId, tenant.profile.id, input);
    return null;
  });
}
