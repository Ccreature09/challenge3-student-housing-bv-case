"use server";

import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { getAuthenticatedProfile } from "@/lib/server-auth";
import { roomAssignments, rooms } from "@/supabase/migrations/schema";

export async function getHousingDashboardPath() {
  const profile = await getAuthenticatedProfile();

  if (profile.role === "tenant") {
    const [assignment] = await db
      .select({ houseId: rooms.houseId })
      .from(roomAssignments)
      .innerJoin(rooms, eq(roomAssignments.roomId, rooms.id))
      .where(
        and(
          eq(roomAssignments.studentId, profile.id),
          sql`${roomAssignments.startDate} <= CURRENT_DATE`,
          or(
            sql`${roomAssignments.endDate} IS NULL`,
            sql`${roomAssignments.endDate} >= CURRENT_DATE`,
          ),
        ),
      )
      .limit(1);

    if (!assignment) {
      throw new Error("No active room assignment is linked to your account.");
    }

    return `/tenant-dashboard/${assignment.houseId}/cleaning-schedule`;
  }

  if (profile.role === "admin") {
    return `/admin-dashboard/${profile.id}/home`;
  }

  throw new Error("Your account does not have access to a dashboard.");
}
