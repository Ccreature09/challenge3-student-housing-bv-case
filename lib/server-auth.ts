import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/supabase/migrations/schema";
import { UserError } from "@/lib/action-result";

export async function getAuthenticatedProfile() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error) throw new UserError("Your session has expired. Please sign in again.");
  if (!data.user) throw new UserError("Please sign in first.");

  const [profile] = await db
    .select()
    .from(users)
    .where(and(eq(users.authUserId, data.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (!profile) {
    throw new UserError("Your Supabase account is not linked to a housing profile.");
  }

  return profile;
}

/** The signed-in admin, who must own the admin dashboard in the URL. */
export async function requireAdmin(adminId: string) {
  const profile = await getAuthenticatedProfile();
  // The session is one cookie shared by every tab, so signing in as someone
  // else in another tab changes who this page runs as. Say who that is.
  const who = `${profile.firstName} ${profile.lastName} (${profile.role})`;
  if (profile.role !== "admin") {
    throw new UserError(
      `You are signed in as ${who}. Sign out and sign in with an admin account to use the admin dashboard.`,
    );
  }
  if (adminId !== profile.id) {
    throw new UserError(`This admin dashboard belongs to another account; you are signed in as ${who}.`);
  }
  return profile;
}
