"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { getAuthenticatedProfile, requireAdmin } from "@/lib/server-auth";
import { runAction, UserError } from "@/lib/action-result";
import { oneOf, requireUuid, text } from "@/lib/validation";
import { houses, maintenanceOrComplaints, roomAssignments, rooms, users } from "@/supabase/migrations/schema";

// Maintenance & repairs. Tenants report problems (optionally with a photo) for
// their room or for the shared spaces of their house; the landlord follows them
// up by changing the status and replying. Landlords do not create requests.

const STATUSES = ["Submitted", "In progress", "Resolved"] as const;
export type MaintenanceStatus = (typeof STATUSES)[number];
export type MaintenanceFilter = "All" | MaintenanceStatus;
/** house = the house's shared spaces (kitchen, living room, ...); room = one room. */
export type MaintenanceScope = "house" | "room";

export type MaintenanceRequestDTO = {
  id: string;
  title: string;
  location: string;
  description: string;
  status: MaintenanceStatus;
  response: string;
  submittedAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
  hasPhoto: boolean;
  photoUrl: string | null;
  submittedBy: { id: string; name: string } | null;
  /** True when the signed-in tenant submitted it (and may cancel it while Submitted). */
  mine: boolean;
  houseId: string | null;
  houseName: string | null;
  roomId: string | null;
  roomNumber: number | null;
};

const TYPE = "maintenance";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const activeAssignment = sql`${roomAssignments.startDate} <= CURRENT_DATE AND (${roomAssignments.endDate} IS NULL OR ${roomAssignments.endDate} >= CURRENT_DATE)`;

/** The signed-in tenant's current room, which must be in this house. */
async function requireTenant(houseId: string) {
  requireUuid(houseId, "house");
  const profile = await getAuthenticatedProfile();
  if (profile.role !== "tenant") throw new UserError("Only tenants can report maintenance problems.");
  const [room] = await db
    .select({ roomId: rooms.id, roomNumber: rooms.roomNumber })
    .from(roomAssignments)
    .innerJoin(rooms, eq(rooms.id, roomAssignments.roomId))
    .where(and(eq(roomAssignments.studentId, profile.id), eq(rooms.houseId, houseId), activeAssignment))
    .limit(1);
  if (!room) throw new UserError("You do not live in this accommodation.");
  return { profile, ...room };
}

async function selectRequests(where: ReturnType<typeof and>, viewerId?: string) {
  const rows = await db
    .select({
      id: maintenanceOrComplaints.id,
      title: maintenanceOrComplaints.title,
      description: maintenanceOrComplaints.description,
      location: maintenanceOrComplaints.location,
      status: maintenanceOrComplaints.status,
      response: maintenanceOrComplaints.response,
      createdAt: maintenanceOrComplaints.createdAt,
      updatedAt: maintenanceOrComplaints.updatedAt,
      resolvedAt: maintenanceOrComplaints.resolvedAt,
      hasPhoto: sql<boolean>`${maintenanceOrComplaints.photo} IS NOT NULL`,
      submittedBy: maintenanceOrComplaints.submittedBy,
      firstName: users.firstName,
      lastName: users.lastName,
      houseId: maintenanceOrComplaints.houseId,
      street: houses.street,
      houseNumber: houses.houseNumber,
      roomId: maintenanceOrComplaints.roomId,
      roomNumber: rooms.roomNumber,
    })
    .from(maintenanceOrComplaints)
    .leftJoin(users, eq(users.id, maintenanceOrComplaints.submittedBy))
    .leftJoin(houses, eq(houses.id, maintenanceOrComplaints.houseId))
    .leftJoin(rooms, eq(rooms.id, maintenanceOrComplaints.roomId))
    .where(where)
    .orderBy(desc(maintenanceOrComplaints.createdAt));

  return rows.map<MaintenanceRequestDTO>((row) => ({
    id: row.id,
    title: row.title?.trim() || "Untitled request",
    location: row.location ?? (row.roomNumber !== null ? `Room ${row.roomNumber}` : "Shared space"),
    description: row.description ?? "",
    status: (STATUSES as readonly string[]).includes(row.status ?? "")
      ? (row.status as MaintenanceStatus)
      : "Submitted",
    response: row.response ?? "",
    submittedAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt,
    hasPhoto: row.hasPhoto,
    photoUrl: row.hasPhoto ? `/api/maintenance/${row.id}/photo` : null,
    submittedBy: row.submittedBy
      ? { id: row.submittedBy, name: row.firstName ? `${row.firstName} ${row.lastName}` : "Unknown" }
      : null,
    mine: Boolean(viewerId && row.submittedBy === viewerId),
    houseId: row.houseId,
    houseName: row.houseId ? `${row.street ?? ""} ${row.houseNumber ?? ""}`.trim() : null,
    roomId: row.roomId,
    roomNumber: row.roomNumber,
  }));
}

function scopeWhere(houseId: string, roomId: string | null) {
  return and(
    eq(maintenanceOrComplaints.type, TYPE),
    eq(maintenanceOrComplaints.houseId, houseId),
    roomId === null ? isNull(maintenanceOrComplaints.roomId) : eq(maintenanceOrComplaints.roomId, roomId),
  );
}

async function readPhoto(form: FormData): Promise<Buffer | null> {
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!IMAGE_TYPES.has(file.type)) throw new UserError("The photo must be a JPEG, PNG, WebP or GIF image.");
  if (file.size > MAX_PHOTO_BYTES) throw new UserError("The photo must be 5 MB or smaller.");
  return Buffer.from(await file.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

/**
 * Requests a tenant can see: scope "house" = all shared-space requests of their
 * house (housemates see each other's), scope "room" = the requests for their room.
 */
export async function getTenantMaintenanceRequests(houseId: string, scope: MaintenanceScope) {
  return runAction(async () => {
    const tenant = await requireTenant(houseId);
    const roomId = oneOf(scope, ["house", "room"] as const, "scope") === "room" ? tenant.roomId : null;
    return {
      roomNumber: tenant.roomNumber,
      requests: await selectRequests(scopeWhere(houseId, roomId), tenant.profile.id),
    };
  });
}

/** FormData fields: scope ("house" | "room"), title, location, description, photo (optional file). */
export async function createMaintenanceRequest(houseId: string, form: FormData) {
  return runAction(async () => {
    const tenant = await requireTenant(houseId);
    const scope = oneOf(form.get("scope"), ["house", "room"] as const, "place");
    const photo = await readPhoto(form);
    const now = new Date().toISOString();
    await db.insert(maintenanceOrComplaints).values({
      houseId,
      roomId: scope === "room" ? tenant.roomId : null,
      title: text(form.get("title"), "Title", 150),
      location: text(form.get("location"), "Location", 150),
      description: text(form.get("description"), "Description", 4000),
      photo,
      status: "Submitted",
      type: TYPE,
      submittedBy: tenant.profile.id,
      updatedAt: now,
    });
    return null;
  });
}

/** A tenant may withdraw their own request while nobody has picked it up yet. */
export async function deleteTenantMaintenanceRequest(houseId: string, requestId: string) {
  return runAction(async () => {
    const tenant = await requireTenant(houseId);
    requireUuid(requestId, "request");
    const deleted = await db
      .delete(maintenanceOrComplaints)
      .where(
        and(
          eq(maintenanceOrComplaints.id, requestId),
          eq(maintenanceOrComplaints.houseId, houseId),
          eq(maintenanceOrComplaints.submittedBy, tenant.profile.id),
          eq(maintenanceOrComplaints.status, "Submitted"),
        ),
      )
      .returning({ id: maintenanceOrComplaints.id });
    if (deleted.length === 0) {
      throw new UserError("Only your own requests that are still 'Submitted' can be cancelled.");
    }
    return null;
  });
}

// ---------------------------------------------------------------------------
// Landlord
// ---------------------------------------------------------------------------

/** Requests submitted by tenants. roomId null = the house's shared spaces. */
export async function getAdminMaintenanceRequests(adminId: string, houseId: string, roomId: string | null) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
    let scopeTitle = "Shared spaces";
    if (roomId !== null) {
      requireUuid(roomId, "room");
      const [room] = await db
        .select({ roomNumber: rooms.roomNumber })
        .from(rooms)
        .where(and(eq(rooms.id, roomId), eq(rooms.houseId, houseId)))
        .limit(1);
      if (!room) throw new UserError("This room does not exist in this accommodation.");
      scopeTitle = `Room ${room.roomNumber}`;
    }
    const requests = await selectRequests(and(scopeWhere(houseId, roomId), eq(users.role, "tenant")));
    return { scopeTitle, requests };
  });
}

/** All tenant requests of every house, for the landlord's overview page. */
export async function getAllMaintenanceRequests(adminId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    return selectRequests(and(eq(maintenanceOrComplaints.type, TYPE), eq(users.role, "tenant")));
  });
}

export async function updateAdminMaintenanceRequest(
  adminId: string,
  requestId: string,
  input: { status: string; response: string },
) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(requestId, "request");
    const status = oneOf(input.status, STATUSES, "status");
    const now = new Date().toISOString();
    const updated = await db
      .update(maintenanceOrComplaints)
      .set({
        status,
        response: text(input.response, "Response", 2000, { optional: true }),
        updatedAt: now,
        resolvedAt: status === "Resolved" ? now : null,
      })
      .where(and(eq(maintenanceOrComplaints.id, requestId), eq(maintenanceOrComplaints.type, TYPE)))
      .returning({ id: maintenanceOrComplaints.id });
    if (updated.length === 0) throw new UserError("This request no longer exists.");
    return null;
  });
}

export async function deleteAdminMaintenanceRequest(adminId: string, requestId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(requestId, "request");
    const deleted = await db
      .delete(maintenanceOrComplaints)
      .where(and(eq(maintenanceOrComplaints.id, requestId), eq(maintenanceOrComplaints.type, TYPE)))
      .returning({ id: maintenanceOrComplaints.id });
    if (deleted.length === 0) throw new UserError("This request no longer exists.");
    return null;
  });
}
