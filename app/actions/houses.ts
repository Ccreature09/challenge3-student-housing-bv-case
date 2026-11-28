"use server";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/server-auth";
import { runAction, UserError } from "@/lib/action-result";
import { isoDate, requireUuid, text } from "@/lib/validation";
import {
  announcements,
  houses,
  maintenanceOrComplaints,
  roomAssignments,
  rooms,
  users,
} from "@/supabase/migrations/schema";

// An assignment is active when it has started and has not ended yet.
const activeAssignment = sql.raw(
  `("ROOM_ASSIGNMENTS"."start_date" <= CURRENT_DATE AND ("ROOM_ASSIGNMENTS"."end_date" IS NULL OR "ROOM_ASSIGNMENTS"."end_date" >= CURRENT_DATE))`,
);

export type HouseRow = {
  id: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  roomCount: number;
  occupiedCount: number;
};

export type RoomRow = {
  id: string;
  roomNumber: number;
  monthlyRent: number;
  tenantName: string | null;
  tenantId: string | null;
};

export async function listHouses(adminId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    const rows = await db
      .select({
        id: houses.id,
        street: houses.street,
        houseNumber: houses.houseNumber,
        postalCode: houses.postalCode,
        city: houses.city,
        // Correlated subqueries: written out in full because Drizzle leaves
        // column names unqualified in a single-table select.
        roomCount: sql<number>`(SELECT count(*)::int FROM "ROOMS" WHERE "ROOMS"."house_id" = "HOUSES"."id")`,
        occupiedCount: sql<number>`(
          SELECT count(DISTINCT "ROOM_ASSIGNMENTS"."room_id")::int
          FROM "ROOM_ASSIGNMENTS" JOIN "ROOMS" ON "ROOMS"."id" = "ROOM_ASSIGNMENTS"."room_id"
          WHERE "ROOMS"."house_id" = "HOUSES"."id" AND ${activeAssignment}
        )`,
      })
      .from(houses)
      .orderBy(asc(houses.city), asc(houses.street), asc(houses.houseNumber));

    return rows.map<HouseRow>((row) => ({
      ...row,
      street: row.street ?? "",
      postalCode: row.postalCode ?? "",
      city: row.city ?? "",
    }));
  });
}

export async function createHouse(
  adminId: string,
  input: { street: string; houseNumber: string; postalCode: string; city: string },
) {
  return runAction(async () => {
    await requireAdmin(adminId);
    const street = text(input.street, "Street", 150);
    const houseNumber = text(input.houseNumber, "House number", 20);
    const postalCode = text(input.postalCode, "Postal code", 20).toUpperCase();
    const city = text(input.city, "City", 100);

    const [existing] = await db
      .select({ id: houses.id })
      .from(houses)
      .where(
        and(
          sql`lower(${houses.street}) = lower(${street})`,
          sql`lower(${houses.houseNumber}) = lower(${houseNumber})`,
          sql`lower(${houses.city}) = lower(${city})`,
        ),
      )
      .limit(1);
    if (existing) throw new UserError("This accommodation already exists.");

    const [created] = await db
      .insert(houses)
      .values({ street, houseNumber, postalCode, city })
      .returning({ id: houses.id });
    return created.id;
  });
}

export async function getHouse(adminId: string, houseId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
    const [house] = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
    if (!house) throw new UserError("This accommodation does not exist.");

    const [[roomCount], [tenantCount], [maintenanceCount], [announcementCount]] =
      await Promise.all([
        db.select({ n: sql<number>`count(*)::int` }).from(rooms).where(eq(rooms.houseId, houseId)),
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
        db
          .select({ n: sql<number>`count(*)::int` })
          .from(announcements)
          .where(eq(announcements.houseId, houseId)),
      ]);
    const counts = {
      rooms: roomCount.n,
      tenants: tenantCount.n,
      openMaintenance: maintenanceCount.n,
      announcements: announcementCount.n,
    };

    return {
      id: house.id,
      name: `${house.street ?? ""} ${house.houseNumber}`.trim(),
      postalCode: house.postalCode ?? "",
      city: house.city ?? "",
      counts,
    };
  });
}

export async function listRooms(adminId: string, houseId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
    const rows = await db
      .select({
        id: rooms.id,
        roomNumber: rooms.roomNumber,
        monthlyRent: rooms.monthlyRent,
        tenantId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(rooms)
      .leftJoin(roomAssignments, and(eq(roomAssignments.roomId, rooms.id), activeAssignment))
      .leftJoin(users, eq(users.id, roomAssignments.studentId))
      .where(eq(rooms.houseId, houseId))
      .orderBy(asc(rooms.roomNumber));

    // A room could have overlapping assignments; show the first tenant only.
    const byRoom = new Map<string, RoomRow>();
    for (const row of rows) {
      if (byRoom.has(row.id)) continue;
      byRoom.set(row.id, {
        id: row.id,
        roomNumber: row.roomNumber,
        monthlyRent: Number(row.monthlyRent),
        tenantId: row.tenantId,
        tenantName: row.firstName ? `${row.firstName} ${row.lastName}` : null,
      });
    }
    return [...byRoom.values()];
  });
}

export async function createRoom(
  adminId: string,
  houseId: string,
  input: { roomNumber: string; monthlyRent: string },
) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
    const roomNumber = Number(input.roomNumber);
    if (!Number.isInteger(roomNumber) || roomNumber < 0 || roomNumber > 100000) {
      throw new UserError("Room number must be a whole number.");
    }
    const rent = Number(String(input.monthlyRent).replace(",", "."));
    if (!String(input.monthlyRent).trim() || !Number.isFinite(rent) || rent < 0 || rent > 99999999) {
      throw new UserError("Monthly rent must be a positive amount.");
    }
    const [house] = await db.select({ id: houses.id }).from(houses).where(eq(houses.id, houseId)).limit(1);
    if (!house) throw new UserError("This accommodation does not exist.");

    const [created] = await db
      .insert(rooms)
      .values({ houseId, roomNumber, monthlyRent: rent.toFixed(2), createdAt: new Date().toISOString() })
      .returning({ id: rooms.id });
    return created.id;
  });
}

export async function getRoom(adminId: string, houseId: string, roomId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
    requireUuid(roomId, "room");
    const [room] = await db
      .select({
        id: rooms.id,
        roomNumber: rooms.roomNumber,
        monthlyRent: rooms.monthlyRent,
        street: houses.street,
        houseNumber: houses.houseNumber,
        city: houses.city,
      })
      .from(rooms)
      .innerJoin(houses, eq(houses.id, rooms.houseId))
      .where(and(eq(rooms.id, roomId), eq(rooms.houseId, houseId)))
      .limit(1);
    if (!room) throw new UserError("This room does not exist in this accommodation.");

    const history = await db
      .select({
        assignmentId: roomAssignments.id,
        startDate: roomAssignments.startDate,
        endDate: roomAssignments.endDate,
        active: sql<boolean>`${activeAssignment}`,
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
      })
      .from(roomAssignments)
      .innerJoin(users, eq(users.id, roomAssignments.studentId))
      .where(eq(roomAssignments.roomId, roomId))
      .orderBy(desc(roomAssignments.startDate));

    // Tenants who do not currently live anywhere can be moved into this room.
    const available = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .where(
        and(
          eq(users.role, "tenant"),
          isNull(users.deletedAt),
          sql`NOT EXISTS (SELECT 1 FROM "ROOM_ASSIGNMENTS" WHERE "ROOM_ASSIGNMENTS"."student_id" = "USERS"."id" AND ${activeAssignment})`,
        ),
      )
      .orderBy(asc(users.lastName), asc(users.firstName));

    return {
      id: room.id,
      roomNumber: room.roomNumber,
      monthlyRent: Number(room.monthlyRent),
      houseName: `${room.street ?? ""} ${room.houseNumber}, ${room.city ?? ""}`.trim(),
      current: history.find((entry) => entry.active) ?? null,
      history,
      availableTenants: available,
    };
  });
}

export async function assignTenant(
  adminId: string,
  houseId: string,
  roomId: string,
  input: { studentId: string; startDate: string },
) {
  return runAction(async () => {
    const admin = await requireAdmin(adminId);
    requireUuid(houseId, "house");
    requireUuid(roomId, "room");
    const studentId = requireUuid(input.studentId, "tenant");
    const startDate = isoDate(input.startDate, "Start date");

    await db.transaction(async (tx) => {
      const [room] = await tx
        .select({ id: rooms.id })
        .from(rooms)
        .where(and(eq(rooms.id, roomId), eq(rooms.houseId, houseId)))
        .limit(1);
      if (!room) throw new UserError("This room does not exist in this accommodation.");

      const [tenant] = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, studentId), eq(users.role, "tenant"), isNull(users.deletedAt)))
        .limit(1);
      if (!tenant) throw new UserError("Choose an existing tenant.");

      const [overlap] = await tx
        .select({ id: roomAssignments.id })
        .from(roomAssignments)
        .where(
          and(
            sql`(${roomAssignments.roomId} = ${roomId} OR ${roomAssignments.studentId} = ${studentId})`,
            sql`(${roomAssignments.endDate} IS NULL OR ${roomAssignments.endDate} >= ${startDate})`,
          ),
        )
        .limit(1);
      if (overlap) {
        throw new UserError(
          "The room or the tenant already has a tenancy that runs past this start date. End it first.",
        );
      }

      await tx.insert(roomAssignments).values({
        roomId,
        studentId,
        startDate,
        createdByEmployeeId: admin.id,
      });
    });
    return null;
  });
}

export async function endTenancy(
  adminId: string,
  houseId: string,
  assignmentId: string,
  endDateInput: string,
) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
    requireUuid(assignmentId, "tenancy");
    const endDate = isoDate(endDateInput, "End date");

    const [assignment] = await db
      .select({ id: roomAssignments.id, startDate: roomAssignments.startDate })
      .from(roomAssignments)
      .innerJoin(rooms, eq(rooms.id, roomAssignments.roomId))
      .where(and(eq(roomAssignments.id, assignmentId), eq(rooms.houseId, houseId)))
      .limit(1);
    if (!assignment) throw new UserError("This tenancy does not exist.");
    if (endDate < assignment.startDate) {
      throw new UserError("The end date cannot be before the start date.");
    }

    await db.update(roomAssignments).set({ endDate }).where(eq(roomAssignments.id, assignmentId));
    return null;
  });
}
