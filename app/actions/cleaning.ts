"use server";

import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { getAuthenticatedProfile } from "@/lib/server-auth";
import {
  cleaningAreas,
  cleaningTasks,
  contracts,
  employees,
  houses,
  rooms,
} from "@/supabase/migrations/schema";

type CleaningRow = {
  id: string;
  houseId: string;
  houseName: string;
  areaId: string;
  areaName: string;
  floor: number;
  roomId: string;
  roomNumber: number;
  title: string;
  description: string | null;
  due: string;
  status: "open" | "overdue" | "done";
  note: string | null;
  remindedAt: string | null;
};

function houseLabel(house: typeof houses.$inferSelect) {
  return `${house.street} ${house.houseNumber}, ${house.city}`;
}

function roomLabel(roomNumber: number) {
  return `Room ${String(roomNumber).padStart(3, "0")}`;
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function taskStatus(
  status: "open" | "done",
  due: string,
): CleaningRow["status"] {
  return status === "open" && due < todayISO() ? "overdue" : status;
}

async function authorizeAdmin(adminId: string) {
  const profile = await getAuthenticatedProfile();
  if (profile.role !== "admin" && profile.role !== "staff") {
    throw new Error("Only admins and staff can manage cleaning schedules.");
  }

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, profile.id))
    .limit(1);

  if (profile.role === "staff" && !employee?.workHouseId) {
    throw new Error("Your staff account is not assigned to a house.");
  }
  if (adminId !== profile.id && adminId !== employee?.id) {
    throw new Error("This admin dashboard does not belong to your account.");
  }

  return { profile, employee };
}

async function activeRoomIds(houseId: string) {
  const rows = await db
    .select({ roomId: contracts.roomId })
    .from(contracts)
    .innerJoin(rooms, eq(contracts.roomId, rooms.id))
    .where(
      and(
        eq(rooms.houseId, houseId),
        eq(contracts.status, "active"),
        sql`${contracts.startDate} <= CURRENT_DATE`,
        or(
          sql`${contracts.endDate} IS NULL`,
          sql`${contracts.endDate} >= CURRENT_DATE`,
        ),
      ),
    )
    .orderBy(asc(rooms.roomNumber));
  return [...new Set(rows.map((row) => row.roomId))];
}

async function getCleaningRows(houseIds?: string[]): Promise<CleaningRow[]> {
  if (houseIds && houseIds.length === 0) return [];

  const query = db
    .select({
      id: cleaningTasks.id,
      houseId: cleaningAreas.houseId,
      street: houses.street,
      houseNumber: houses.houseNumber,
      city: houses.city,
      areaId: cleaningAreas.id,
      areaName: cleaningAreas.name,
      floor: cleaningAreas.floor,
      roomId: rooms.id,
      roomNumber: rooms.roomNumber,
      title: cleaningTasks.title,
      description: cleaningTasks.description,
      due: cleaningTasks.dueDate,
      taskState: cleaningTasks.status,
      note: cleaningTasks.completionNote,
      remindedAt: cleaningTasks.lastRemindedAt,
    })
    .from(cleaningTasks)
    .innerJoin(cleaningAreas, eq(cleaningTasks.areaId, cleaningAreas.id))
    .innerJoin(rooms, eq(cleaningTasks.assignedRoomId, rooms.id))
    .innerJoin(houses, eq(cleaningAreas.houseId, houses.id))
    .orderBy(asc(cleaningTasks.dueDate));
  const rows = houseIds
    ? await query.where(inArray(cleaningAreas.houseId, houseIds))
    : await query;

  return rows.map((row) => ({
    id: row.id,
    houseId: row.houseId,
    houseName: `${row.street} ${row.houseNumber}, ${row.city}`,
    areaId: row.areaId,
    areaName: row.areaName,
    floor: row.floor,
    roomId: row.roomId,
    roomNumber: row.roomNumber,
    title: row.title,
    description: row.description,
    due: row.due,
    status: taskStatus(row.taskState, row.due),
    note: row.note,
    remindedAt: row.remindedAt,
  }));
}

export async function getAdminCleaningData(adminId: string) {
  const { employee } = await authorizeAdmin(adminId);
  const houseRows = employee?.workHouseId
    ? await db.select().from(houses).where(eq(houses.id, employee.workHouseId))
    : await db.select().from(houses);
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
    tasks: await getCleaningRows(houseIds),
  };
}

export async function getTenantCleaningData(houseId: string) {
  const profile = await getAuthenticatedProfile();
  if (profile.role !== "tenant") {
    throw new Error("Only tenants can view this cleaning schedule.");
  }

  const [contract] = await db
    .select({
      roomId: rooms.id,
      roomNumber: rooms.roomNumber,
      houseId: houses.id,
      street: houses.street,
      houseNumber: houses.houseNumber,
      city: houses.city,
    })
    .from(contracts)
    .innerJoin(rooms, eq(contracts.roomId, rooms.id))
    .innerJoin(houses, eq(rooms.houseId, houses.id))
    .where(
      and(
        eq(contracts.tenantId, profile.id),
        eq(rooms.houseId, houseId),
        eq(contracts.status, "active"),
        sql`${contracts.startDate} <= CURRENT_DATE`,
        or(
          sql`${contracts.endDate} IS NULL`,
          sql`${contracts.endDate} >= CURRENT_DATE`,
        ),
      ),
    )
    .limit(1);

  if (!contract) {
    throw new Error("No active tenancy was found for this house.");
  }

  const areaRows = await db
    .select({
      id: cleaningAreas.id,
      name: cleaningAreas.name,
      floor: cleaningAreas.floor,
    })
    .from(cleaningAreas)
    .where(eq(cleaningAreas.houseId, houseId));

  return {
    tenantName: profile.firstName,
    roomId: contract.roomId,
    room: roomLabel(contract.roomNumber),
    houseName: `${contract.street} ${contract.houseNumber}, ${contract.city}`,
    areas: areaRows,
    tasks: await getCleaningRows([houseId]),
  };
}

export async function getCleaningDashboardPath() {
  const profile = await getAuthenticatedProfile();
  if (profile.role === "tenant") {
    const [contract] = await db
      .select({ houseId: rooms.houseId })
      .from(contracts)
      .innerJoin(rooms, eq(contracts.roomId, rooms.id))
      .where(
        and(
          eq(contracts.tenantId, profile.id),
          eq(contracts.status, "active"),
          sql`${contracts.startDate} <= CURRENT_DATE`,
          or(
            sql`${contracts.endDate} IS NULL`,
            sql`${contracts.endDate} >= CURRENT_DATE`,
          ),
        ),
      )
      .limit(1);
    if (!contract)
      throw new Error("No active tenancy is linked to your account.");
    return `/tenant-dashboard/${contract.houseId}/cleaning-schedule`;
  }
  if (profile.role === "admin" || profile.role === "staff") {
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.userId, profile.id))
      .limit(1);
    return `/admin-dashboard/${employee?.id ?? profile.id}/cleaning-schedule`;
  }
  throw new Error("Your account does not have access to cleaning schedules.");
}

export async function markCleaningTaskDone(taskId: string, note: string) {
  const profile = await getAuthenticatedProfile();
  if (profile.role !== "tenant") {
    throw new Error("Only tenants can complete cleaning tasks.");
  }
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      taskId,
    )
  ) {
    throw new Error("Invalid cleaning task.");
  }
  if (note.length > 2000)
    throw new Error("The completion note must be 2000 characters or fewer.");

  const result = await db
    .update(cleaningTasks)
    .set({
      status: "done",
      completedAt: new Date().toISOString(),
      completionNote: note.trim() || null,
    })
    .where(
      and(
        eq(cleaningTasks.id, taskId),
        eq(cleaningTasks.status, "open"),
        sql`EXISTS (
          SELECT 1
          FROM ${contracts}
          WHERE ${contracts.tenantId} = ${profile.id}
            AND ${contracts.roomId} = ${cleaningTasks.assignedRoomId}
            AND ${contracts.status} = 'active'
            AND ${contracts.startDate} <= CURRENT_DATE
            AND (${contracts.endDate} IS NULL OR ${contracts.endDate} >= CURRENT_DATE)
        )`,
      ),
    )
    .returning({ id: cleaningTasks.id });

  if (result.length === 0) {
    throw new Error(
      "This task is no longer open or is not assigned to your room.",
    );
  }
}

export async function sendCleaningReminder(adminId: string, taskId: string) {
  const { employee } = await authorizeAdmin(adminId);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      taskId,
    )
  ) {
    throw new Error("Invalid cleaning task.");
  }

  const [task] = await db
    .select({ id: cleaningTasks.id, houseId: cleaningAreas.houseId })
    .from(cleaningTasks)
    .innerJoin(cleaningAreas, eq(cleaningTasks.areaId, cleaningAreas.id))
    .where(and(eq(cleaningTasks.id, taskId), eq(cleaningTasks.status, "open")))
    .limit(1);
  if (!task) throw new Error("Only open cleaning tasks can be reminded.");
  if (employee?.workHouseId && employee.workHouseId !== task.houseId) {
    throw new Error("You cannot send reminders for this house.");
  }

  await db
    .update(cleaningTasks)
    .set({ lastRemindedAt: new Date().toISOString() })
    .where(eq(cleaningTasks.id, task.id));
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
  const { employee } = await authorizeAdmin(adminId);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.houseId,
    )
  ) {
    throw new Error("Choose a valid house.");
  }
  if (employee?.workHouseId && employee.workHouseId !== input.houseId) {
    throw new Error("You cannot create tasks for this house.");
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
      "There are no tenants with active contracts in this house.",
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

  const [employeeRow] = employee
    ? [employee]
    : await db
        .select()
        .from(employees)
        .where(eq(employees.userId, (await getAuthenticatedProfile()).id))
        .limit(1);
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
        createdByEmployeeId: employeeRow?.id ?? null,
      })),
    );
  });
}
