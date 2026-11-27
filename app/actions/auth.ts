"use server";

import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { getAuthenticatedProfile } from "@/lib/server-auth";
import { runAction, UserError } from "@/lib/action-result";
import { roomAssignments, rooms } from "@/supabase/migrations/schema";

export async function getHousingDashboardPath() {
  return runAction(async () => {
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
        throw new UserError("You do not have a room yet. Ask the housing office to assign you one.");
      }
      return `/tenant-dashboard/${assignment.houseId}/home`;
    }

    if (profile.role === "admin") {
      return `/admin-dashboard/${profile.id}/home`;
    }

    throw new UserError("Your account does not have access to a dashboard.");
  });
}

/** Name and role of the signed-in user, for the sidebar. */
export async function getMyProfile() {
  return runAction(async () => {
    const profile = await getAuthenticatedProfile();
    return {
      name: `${profile.firstName} ${profile.lastName}`,
      role: profile.role,
      email: profile.email,
    };
  });
}
