"use server";

import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { getAuthenticatedProfile } from "@/lib/server-auth";
import {
  cleaningAreas,
  cleaningTasks,
  houses,
  roomAssignments,
  rooms,
} from "@/supabase/migrations/schema";

function houseLabel(house: typeof houses.$inferSelect) {
  return `${house.street} ${house.houseNumber}, ${house.city}`;
}

function roomLabel(roomNumber: number) {
  return `Room ${String(roomNumber).padStart(3, "0")}`;
}

async function authorizeAdmin(adminId: string) {
  const profile = await getAuthenticatedProfile();
  if (profile.role !== "admin") {
    throw new Error("Only admins can manage cleaning schedules.");
  }
  if (adminId !== profile.id) {
    throw new Error("This admin dashboard does not belong to your account.");
  }

  return profile;
}

async function activeRoomIds(houseId: string) {
  const rows = await db
    .select({ roomId: roomAssignments.roomId })
    .from(roomAssignments)
    .innerJoin(rooms, eq(roomAssignments.roomId, rooms.id))
    .where(
      and(
        eq(rooms.houseId, houseId),
        sql`${roomAssignments.startDate} <= CURRENT_DATE`,
        or(
          sql`${roomAssignments.endDate} IS NULL`,
          sql`${roomAssignments.endDate} >= CURRENT_DATE`,
        ),
      ),
    )
    .orderBy(asc(rooms.roomNumber));
  return [...new Set(rows.map((row) => row.roomId))];
}

export async function getAdminCleaningData(adminId: string) {
  await authorizeAdmin(adminId);
  const houseRows = await db.select().from(houses);
  const houseIds = houseRows.map((house) => house.id);
  const areaRows = houseIds.length
    ? await db
        .select()
        .from(cleaningAreas)
        .where(inArray(cleaningAreas.houseId, houseIds))
    : [];
  const occupiedRoomIds = (
    await Promise.all(houseIds.map((houseId) => activeRoomIds(houseId)))
  ).flat();
  const roomRows = occupiedRoomIds.length
    ? await db.select().from(rooms).where(inArray(rooms.id, occupiedRoomIds))
    : [];

  return {
    houses: houseRows.map((house) => ({
      id: house.id,
      name: houseLabel(house),
    })),
    areas: areaRows.map(({ id, houseId, name, floor }) => ({
      id,
      houseId,
      name,
      floor,
    })),
    rooms: roomRows.map(({ id, houseId, roomNumber }) => ({
      id,
      houseId,
      label: roomLabel(roomNumber),
    })),
  };
}

type Repeat = "none" | "weekly" | "biweekly" | "monthly";

type CreateCleaningInput = {
  houseId: string;
  areaId?: string;
  newAreaName?: string;
  floor?: number;
  title: string;
  description: string;
  firstDue: string;
  repeat: Repeat;
  mode: "rotate" | "fixed";
  fixedRoomId?: string;
};

function addDueDate(start: string, repeat: Repeat, occurrence: number) {
  const [year, month, day] = start.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (repeat === "weekly") date.setDate(day + 7 * occurrence);
  if (repeat === "biweekly") date.setDate(day + 14 * occurrence);
  if (repeat === "monthly") {
    date.setDate(1);
    date.setMonth(date.getMonth() + occurrence);
    date.setDate(
      Math.min(
        day,
        new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
      ),
    );
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function createCleaningTasks(
  adminId: string,
  input: CreateCleaningInput,
) {
  await authorizeAdmin(adminId);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.houseId,
    )
  ) {
    throw new Error("Choose a valid house.");
  }
  if (
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.length > 150
  ) {
    throw new Error("Enter a title of 1 to 150 characters.");
  }
  if (
    typeof input.description !== "string" ||
    input.description.length > 2000
  ) {
    throw new Error("The description must be 2000 characters or fewer.");
  }
  const parsedDueDate = /^\d{4}-\d{2}-\d{2}$/.test(input.firstDue)
    ? new Date(`${input.firstDue}T00:00:00`)
    : new Date(Number.NaN);
  if (
    Number.isNaN(parsedDueDate.getTime()) ||
    parsedDueDate.toISOString().slice(0, 10) !== input.firstDue
  ) {
    throw new Error("Choose a valid due date.");
  }
  if (!["none", "weekly", "biweekly", "monthly"].includes(input.repeat)) {
    throw new Error("Choose a valid repeat interval.");
  }
  if (!["rotate", "fixed"].includes(input.mode)) {
    throw new Error("Choose a valid assignment mode.");
  }

  const roomIds = await activeRoomIds(input.houseId);
  if (roomIds.length === 0)
    throw new Error(
      "There are no tenants with active room assignments in this house.",
    );

  if (input.newAreaName?.trim()) {
    if (
      input.newAreaName.length > 100 ||
      !Number.isInteger(input.floor) ||
      input.floor! < -10 ||
      input.floor! > 200
    ) {
      throw new Error(
        "Enter a shared-space name (up to 100 characters) and a valid floor.",
      );
    }
  }
  const assignedRoomId = input.mode === "fixed" ? input.fixedRoomId : undefined;
  if (
    input.mode === "fixed" &&
    (!assignedRoomId || !roomIds.includes(assignedRoomId))
  ) {
    throw new Error("Choose a room with an active tenant.");
  }

  const count = input.repeat === "none" ? 1 : 4;

  await db.transaction(async (tx) => {
    const [house] = await tx
      .select({ id: houses.id })
      .from(houses)
      .where(eq(houses.id, input.houseId))
      .limit(1);
    if (!house) throw new Error("The selected house no longer exists.");

    let areaId = input.areaId;
    if (input.newAreaName?.trim()) {
      const [createdArea] = await tx
        .insert(cleaningAreas)
        .values({
          houseId: input.houseId,
          name: input.newAreaName.trim(),
          floor: input.floor!,
        })
        .onConflictDoNothing()
        .returning({ id: cleaningAreas.id });
      if (createdArea) {
        areaId = createdArea.id;
      } else {
        const [existingArea] = await tx
          .select({ id: cleaningAreas.id })
          .from(cleaningAreas)
          .where(
            and(
              eq(cleaningAreas.houseId, input.houseId),
              eq(cleaningAreas.name, input.newAreaName.trim()),
              eq(cleaningAreas.floor, input.floor!),
            ),
          )
          .limit(1);
        areaId = existingArea?.id;
      }
    }
    if (!areaId) throw new Error("Select or create a shared space.");

    const [area] = await tx
      .select({ id: cleaningAreas.id })
      .from(cleaningAreas)
      .where(
        and(
          eq(cleaningAreas.id, areaId),
          eq(cleaningAreas.houseId, input.houseId),
        ),
      )
      .limit(1);
    if (!area)
      throw new Error(
        "The selected shared space does not belong to this house.",
      );

    await tx.insert(cleaningTasks).values(
      Array.from({ length: count }, (_, occurrence) => ({
        areaId: area.id,
        assignedRoomId: assignedRoomId ?? roomIds[occurrence % roomIds.length],
        title: input.title.trim(),
        description: input.description.trim() || null,
        dueDate: addDueDate(input.firstDue, input.repeat, occurrence),
        status: "open" as const,
      })),
    );
  });
}
