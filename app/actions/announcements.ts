"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/server-auth";
import { runAction, UserError } from "@/lib/action-result";
import { oneOf, requireUuid, text } from "@/lib/validation";
import { announcements, houses, users } from "@/supabase/migrations/schema";

const PRIORITIES = ["low", "normal", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export type AnnouncementRow = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  createdAt: string;
  author: string | null;
};

export type AnnouncementInput = { title: string; description: string; priority: string };

function parse(input: AnnouncementInput) {
  return {
    title: text(input.title, "Title", 150),
    description: text(input.description, "Message", 5000),
    priority: oneOf(input.priority, PRIORITIES, "priority"),
  };
}

async function requireHouse(houseId: string) {
  requireUuid(houseId, "house");
  const [house] = await db.select({ id: houses.id }).from(houses).where(eq(houses.id, houseId)).limit(1);
  if (!house) throw new UserError("This accommodation does not exist.");
}

export async function listAnnouncements(adminId: string, houseId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
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
      priority: (PRIORITIES as readonly string[]).includes(row.priority ?? "")
        ? (row.priority as Priority)
        : "normal",
      createdAt: row.createdAt,
      author: row.firstName ? `${row.firstName} ${row.lastName}` : null,
    }));
  });
}

export async function createAnnouncement(adminId: string, houseId: string, input: AnnouncementInput) {
  return runAction(async () => {
    const admin = await requireAdmin(adminId);
    await requireHouse(houseId);
    await db.insert(announcements).values({ ...parse(input), houseId, createdBy: admin.id });
    return null;
  });
}

export async function updateAnnouncement(
  adminId: string,
  houseId: string,
  announcementId: string,
  input: AnnouncementInput,
) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
    requireUuid(announcementId, "announcement");
    const updated = await db
      .update(announcements)
      .set(parse(input))
      .where(and(eq(announcements.id, announcementId), eq(announcements.houseId, houseId)))
      .returning({ id: announcements.id });
    if (updated.length === 0) throw new UserError("This announcement no longer exists.");
    return null;
  });
}

export async function deleteAnnouncement(adminId: string, houseId: string, announcementId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    requireUuid(houseId, "house");
    requireUuid(announcementId, "announcement");
    await db
      .delete(announcements)
      .where(and(eq(announcements.id, announcementId), eq(announcements.houseId, houseId)));
    return null;
  });
}
