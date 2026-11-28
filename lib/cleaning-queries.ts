import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cleaningAreas, cleaningTasks, roomAssignments, rooms, users } from "@/supabase/migrations/schema";

export type CleaningStatus = "open" | "overdue" | "done";

export type CleaningTaskRow = {
  id: string;
  title: string;
  description: string | null;
  areaId: string;
  areaName: string;
  floor: number;
  roomId: string;
  roomNumber: number;
  /** Tenant(s) living in the assigned room today. */
  assignee: string | null;
  dueDate: string;
  status: CleaningStatus;
  completedAt: string | null;
  completionNote: string | null;
};

/** All cleaning tasks of a house's shared spaces, soonest first. Open tasks past their due date are "overdue". */
export async function selectHouseCleaningTasks(houseId: string): Promise<CleaningTaskRow[]> {
  const rows = await db
    .select({
      id: cleaningTasks.id,
      title: cleaningTasks.title,
      description: cleaningTasks.description,
      areaId: cleaningAreas.id,
      areaName: cleaningAreas.name,
      floor: cleaningAreas.floor,
      roomId: rooms.id,
      roomNumber: rooms.roomNumber,
      assignee: sql<string | null>`(
        SELECT string_agg(${users.firstName} || ' ' || ${users.lastName}, ', ')
        FROM ${roomAssignments} JOIN ${users} ON ${users.id} = ${roomAssignments.studentId}
        WHERE ${roomAssignments.roomId} = ${rooms.id}
          AND ${roomAssignments.startDate} <= CURRENT_DATE
          AND (${roomAssignments.endDate} IS NULL OR ${roomAssignments.endDate} >= CURRENT_DATE)
      )`,
      dueDate: cleaningTasks.dueDate,
      state: cleaningTasks.status,
      overdue: sql<boolean>`${cleaningTasks.dueDate} < CURRENT_DATE`,
      completedAt: cleaningTasks.completedAt,
      completionNote: cleaningTasks.completionNote,
    })
    .from(cleaningTasks)
    .innerJoin(cleaningAreas, eq(cleaningAreas.id, cleaningTasks.areaId))
    .innerJoin(rooms, eq(rooms.id, cleaningTasks.assignedRoomId))
    .where(and(eq(cleaningAreas.houseId, houseId)))
    .orderBy(asc(cleaningTasks.dueDate), asc(cleaningAreas.name));

  return rows.map(({ state, overdue, ...row }) => ({
    ...row,
    status: state === "done" ? "done" : overdue ? "overdue" : "open",
  }));
}
