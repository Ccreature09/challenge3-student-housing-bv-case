"use server";

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/server-auth";
import { runAction, UserError } from "@/lib/action-result";
import { oneOf, requireUuid, text } from "@/lib/validation";
import { authError, checkPassword, supabaseAdmin } from "@/lib/supabase-admin";
import { houses, roomAssignments, rooms, users } from "@/supabase/migrations/schema";

const ROLES = ["tenant", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];

export type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: Role;
  hasLogin: boolean;
  houseId: string | null;
  houseName: string | null;
  roomId: string | null;
  roomNumber: number | null;
};

export type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
};

function parseUser(input: UserInput) {
  const email = text(input.email, "Email", 255).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new UserError("Enter a valid email address.");
  }
  const phoneNumber = text(input.phoneNumber, "Phone number", 30, { optional: true });
  if (phoneNumber && !/^\+?[0-9 ()-]{6,30}$/.test(phoneNumber)) {
    throw new UserError("Enter a valid phone number.");
  }
  return {
    firstName: text(input.firstName, "First name", 100),
    lastName: text(input.lastName, "Last name", 100),
    email,
    phoneNumber,
    role: oneOf(input.role, ROLES, "role"),
  };
}

export async function listUsers(adminId: string) {
  return runAction(async () => {
    await requireAdmin(adminId);
    const rows = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        authUserId: users.authUserId,
        houseId: houses.id,
        street: houses.street,
        houseNumber: houses.houseNumber,
        roomId: rooms.id,
        roomNumber: rooms.roomNumber,
      })
      .from(users)
      .leftJoin(
        roomAssignments,
        and(
          eq(roomAssignments.studentId, users.id),
          sql`${roomAssignments.startDate} <= CURRENT_DATE AND (${roomAssignments.endDate} IS NULL OR ${roomAssignments.endDate} >= CURRENT_DATE)`,
        ),
      )
      .leftJoin(rooms, eq(rooms.id, roomAssignments.roomId))
      .leftJoin(houses, eq(houses.id, rooms.houseId))
      .where(isNull(users.deletedAt))
      .orderBy(asc(users.lastName), asc(users.firstName));

    const byUser = new Map<string, UserRow>();
    for (const row of rows) {
      if (byUser.has(row.id)) continue;
      byUser.set(row.id, {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phoneNumber: row.phoneNumber,
        role: row.role,
        hasLogin: row.authUserId !== null,
        houseId: row.houseId,
        houseName: row.houseId ? `${row.street ?? ""} ${row.houseNumber}`.trim() : null,
        roomId: row.roomId,
        roomNumber: row.roomNumber,
      });
    }
    return [...byUser.values()];
  });
}

/** Rejects an email or phone number that an active user already has, before any login is created. */
async function assertAvailable(email: string, phoneNumber: string | null, exceptId?: string) {
  const clash = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(
      and(
        isNull(users.deletedAt),
        phoneNumber
          ? sql`(lower(${users.email}) = ${email} OR ${users.phoneNumber} = ${phoneNumber})`
          : sql`lower(${users.email}) = ${email}`,
        exceptId ? sql`${users.id} <> ${exceptId}` : undefined,
      ),
    )
    .limit(1);
  if (clash.length) {
    throw new UserError(
      clash[0].email.toLowerCase() === email
        ? "Another user already has this email address."
        : "Another user already has this phone number.",
    );
  }
}

async function createLogin(
  values: { email: string; firstName: string; lastName: string },
  password: string,
) {
  const { data, error } = await supabaseAdmin().auth.admin.createUser({
    email: values.email,
    password,
    email_confirm: true, // the admin vouches for the address; no confirmation mail
    user_metadata: {
      first_name: values.firstName,
      last_name: values.lastName,
      must_change_password: true,
    },
  });
  if (error || !data.user) throw authError(error ?? { message: "No user returned." });
  return data.user.id;
}

async function deleteLogin(authUserId: string) {
  const { error } = await supabaseAdmin().auth.admin.deleteUser(authUserId);
  return error;
}

/** Creates the housing profile and its Supabase Auth login with a temporary password. */
export async function createUser(adminId: string, input: UserInput & { password: string }) {
  return runAction(async () => {
    await requireAdmin(adminId);
    const values = parseUser(input);
    const password = checkPassword(input.password);
    await assertAvailable(values.email, values.phoneNumber);
    // A user deleted earlier keeps their row; bring it back instead of adding a second one.
    const [deleted] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, values.email), sql`${users.deletedAt} IS NOT NULL`))
      .limit(1);

    const authUserId = await createLogin(values, password);
    try {
      if (deleted) {
        await db
          .update(users)
          .set({ ...values, authUserId, deletedAt: null })
          .where(eq(users.id, deleted.id));
        return deleted.id;
      }
      const [created] = await db
        .insert(users)
        .values({ ...values, authUserId })
        .returning({ id: users.id });
      return created.id;
    } catch (error) {
      await deleteLogin(authUserId); // do not leave a login without a profile
      throw error;
    }
  });
}

/**
 * Updates the profile and keeps the login in step. A non-empty password resets
 * the login's password (or creates a login for a user who has none); the user
 * is asked to change it at their next sign-in.
 */
export async function updateUser(
  adminId: string,
  userId: string,
  input: UserInput & { password?: string },
) {
  return runAction(async () => {
    const admin = await requireAdmin(adminId);
    requireUuid(userId, "user");
    const values = parseUser(input);
    const password = input.password ? checkPassword(input.password) : null;
    if (userId === admin.id && values.role !== "admin") {
      throw new UserError("You cannot remove the admin role from your own account.");
    }
    await assertAvailable(values.email, values.phoneNumber, userId);

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ email: users.email, authUserId: users.authUserId })
        .from(users)
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .for("update")
        .limit(1);
      if (!existing) throw new UserError("This user no longer exists.");

      let authUserId = existing.authUserId;
      if (authUserId) {
        const changes: Parameters<ReturnType<typeof supabaseAdmin>["auth"]["admin"]["updateUserById"]>[1] = {
          user_metadata: { first_name: values.firstName, last_name: values.lastName },
        };
        if (values.email !== existing.email.toLowerCase()) {
          changes.email = values.email;
          changes.email_confirm = true;
        }
        if (password) {
          changes.password = password;
          changes.user_metadata = { ...changes.user_metadata, must_change_password: true };
        }
        const { error } = await supabaseAdmin().auth.admin.updateUserById(authUserId, changes);
        if (error) throw authError(error);
      } else if (password) {
        authUserId = await createLogin(values, password);
      }

      // If the profile update fails, remove a login created just now. (A changed
      // email or password on an existing login stays changed.)
      try {
        await tx.update(users).set({ ...values, authUserId }).where(eq(users.id, userId));
      } catch (error) {
        if (authUserId && !existing.authUserId) await deleteLogin(authUserId);
        throw error;
      }
    });
    return null;
  });
}

/**
 * Soft delete: room assignments and announcements keep pointing at the user,
 * so the row stays and is hidden. An active tenancy is ended today and the
 * login is removed, so the person can no longer sign in.
 */
export async function deleteUser(adminId: string, userId: string) {
  return runAction(async () => {
    const admin = await requireAdmin(adminId);
    requireUuid(userId, "user");
    if (userId === admin.id) throw new UserError("You cannot delete your own account.");

    const authUserId = await db.transaction(async (tx) => {
      const [deleted] = await tx
        .select({ authUserId: users.authUserId })
        .from(users)
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .for("update")
        .limit(1);
      if (!deleted) throw new UserError("This user no longer exists.");
      await tx
        .update(users)
        .set({ deletedAt: new Date().toISOString(), authUserId: null })
        .where(eq(users.id, userId));

      // Tenancies that started earlier end today; future ones end on their start date.
      await tx
        .update(roomAssignments)
        .set({ endDate: sql`GREATEST(CURRENT_DATE, ${roomAssignments.startDate})` })
        .where(
          and(
            eq(roomAssignments.studentId, userId),
            sql`(${roomAssignments.endDate} IS NULL OR ${roomAssignments.endDate} > CURRENT_DATE)`,
          ),
        );
      return deleted.authUserId;
    });

    // After the commit: deleting the login updates USERS through its foreign key,
    // which would wait on the row lock held inside the transaction.
    if (authUserId) {
      const error = await deleteLogin(authUserId);
      if (error) {
        throw new UserError(
          `The user was removed, but their login could not be deleted (${error.message}). They can no longer use the app; delete the login in Supabase Auth.`,
        );
      }
    }
    return null;
  });
}
