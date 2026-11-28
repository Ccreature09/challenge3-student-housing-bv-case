"use server";

import { and, asc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/server-auth";
import { runAction, UserError } from "@/lib/action-result";
import { isoDate, oneOf, requireUuid } from "@/lib/validation";
import { selectHouseCleaningTasks } from "@/lib/cleaning-queries";

export type { CleaningTaskRow, CleaningStatus } from "@/lib/cleaning-queries";
import {
  cleaningAreas,
  cleaningTasks,
  houses,
  roomAssignments,
  rooms,
} from "@/supabase/migrations/schema";

function roomLabel(roomNumber: number) {
  return `Room ${String(roomNumber).padStart(3, "0")}`;
}

/** Rooms of the house that have a tenant today, ordered by room number. */
async function occupiedRooms(houseId: string) {
  const rows = await db
    .select({ id: rooms.id, roomNumber: rooms.roomNumber })
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
  const unique = new Map(rows.map((row) => [row.id, row]));
  return [...unique.values()];
}

export async function getHouseCleaningData(adminId: string, houseId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
    const [house] = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
    if (!house) throw new UserError("This accommodation does not exist.");

    const areaRows = await db
      .select({ id: cleaningAreas.id, name: cleaningAreas.name, floor: cleaningAreas.floor })
      .from(cleaningAreas)
      .where(eq(cleaningAreas.houseId, houseId))
      .orderBy(asc(cleaningAreas.floor), asc(cleaningAreas.name));

    return {
      houseName: `${house.street ?? ""} ${house.houseNumber}, ${house.city ?? ""}`.trim(),
      areas: areaRows,
      rooms: (await occupiedRooms(houseId)).map((room) => ({
        id: room.id,
        label: roomLabel(room.roomNumber),
      })),
      tasks: await selectHouseCleaningTasks(houseId),
    };
  });
}

const REPEATS = ["none", "weekly", "biweekly", "monthly"] as const;
type Repeat = (typeof REPEATS)[number];

type CreateCleaningInput = {
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
      Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()),
    );
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function createCleaningTasks(
  adminId: string,
  houseId: string,
  input: CreateCleaningInput,
) {
  return runAction(async () => {
    const admin = await requireAdmin(adminId);
    requireUuid(houseId, "house");
    if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 150) {
      throw new UserError("Enter a title of 1 to 150 characters.");
    }
    if (typeof input.description !== "string" || input.description.length > 2000) {
      throw new UserError("The description must be 2000 characters or fewer.");
    }
    const firstDue = isoDate(input.firstDue, "First due date");
    const repeat = oneOf(input.repeat, REPEATS, "repeat interval");
    const mode = oneOf(input.mode, ["rotate", "fixed"] as const, "assignment mode");

    const roomIds = (await occupiedRooms(houseId)).map((room) => room.id);
    if (roomIds.length === 0) {
      throw new UserError("There are no tenants with active room assignments in this house.");
    }

    const newAreaName = input.newAreaName?.trim();
    if (newAreaName) {
      if (
        newAreaName.length > 100 ||
        !Number.isInteger(input.floor) ||
        input.floor! < -10 ||
        input.floor! > 200
      ) {
        throw new UserError("Enter a shared-space name (up to 100 characters) and a valid floor.");
      }
    }
    const assignedRoomId = mode === "fixed" ? input.fixedRoomId : undefined;
    if (mode === "fixed" && (!assignedRoomId || !roomIds.includes(assignedRoomId))) {
      throw new UserError("Choose a room with an active tenant.");
    }

    const count = repeat === "none" ? 1 : 4;

    await db.transaction(async (tx) => {
      let areaId = input.areaId;
      if (newAreaName) {
        const [createdArea] = await tx
          .insert(cleaningAreas)
          .values({ houseId, name: newAreaName, floor: input.floor! })
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
                eq(cleaningAreas.houseId, houseId),
                eq(cleaningAreas.name, newAreaName),
                eq(cleaningAreas.floor, input.floor!),
              ),
            )
            .limit(1);
          areaId = existingArea?.id;
        }
      }
      if (!areaId) throw new UserError("Select or create a shared space.");
      requireUuid(areaId, "shared space");

      const [area] = await tx
        .select({ id: cleaningAreas.id })
        .from(cleaningAreas)
        .where(and(eq(cleaningAreas.id, areaId), eq(cleaningAreas.houseId, houseId)))
        .limit(1);
      if (!area) throw new UserError("The selected shared space does not belong to this house.");

      await tx.insert(cleaningTasks).values(
        Array.from({ length: count }, (_, occurrence) => ({
          areaId: area.id,
          assignedRoomId: assignedRoomId ?? roomIds[occurrence % roomIds.length],
          title: input.title.trim(),
          description: input.description.trim() || null,
          dueDate: addDueDate(firstDue, repeat, occurrence),
          status: "open" as const,
          createdByEmployeeId: admin.id,
        })),
      );
    });
    return count;
  });
}

export async function deleteCleaningTask(adminId: string, houseId: string, taskId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
    requireUuid(taskId, "cleaning task");
    const deleted = await db
      .delete(cleaningTasks)
      .where(
        and(
          eq(cleaningTasks.id, taskId),
          sql`${cleaningTasks.areaId} IN (SELECT ${cleaningAreas.id} FROM ${cleaningAreas} WHERE ${cleaningAreas.houseId} = ${houseId})`,
        ),
      )
      .returning({ id: cleaningTasks.id });
    if (deleted.length === 0) throw new UserError("This cleaning task no longer exists.");
    return null;
  });
}
