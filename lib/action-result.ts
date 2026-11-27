// Server actions return this instead of throwing: Next.js hides the message of a
// thrown error in production builds, so the user would only see a generic failure.
export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const uniqueMessages: Record<string, string> = {
  users_email_key: "Another user already has this email address.",
  users_phone_number_key: "Another user already has this phone number.",
  users_auth_user_id_key: "This login is already linked to another user.",
  rooms_house_room_unique: "This house already has a room with that number.",
  cleaning_areas_house_name_floor_key:
    "This house already has a shared space with that name on that floor.",
};

type PgError = { code?: string; constraint_name?: string; message?: string };

function pgError(error: unknown): PgError | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as PgError & { cause?: unknown };
  if (candidate.code) return candidate;
  return candidate.cause ? pgError(candidate.cause) : null;
}

export function errorMessage(error: unknown): string {
  const pg = pgError(error);
  if (pg?.code === "23505") {
    return (
      (pg.constraint_name && uniqueMessages[pg.constraint_name]) ??
      "A record with these details already exists."
    );
  }
  if (pg?.code === "23503") {
    return "This record is still linked to other data and cannot be changed this way.";
  }
  if (pg?.code === "23514") return "One of the values is not allowed.";
  if (error instanceof UserError) return error.message;
  console.error(error);
  return "Something went wrong while talking to the database. Please try again.";
}

// Errors whose message is safe and useful to show to the user.
export class UserError extends Error {}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
