import "server-only";

import { createClient } from "@supabase/supabase-js";
import { UserError } from "@/lib/action-result";

/**
 * Supabase client with the project's secret key, for the Auth Admin API
 * (creating logins and setting passwords). Never import this in client code.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // New projects call it the secret key (sb_secret_…); older ones the service_role key.
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new UserError(
      "Login accounts cannot be created: add SUPABASE_SECRET_KEY (Supabase → Project Settings → API Keys → secret key) to .env.local and restart the server.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const MIN_PASSWORD_LENGTH = 8;

export function checkPassword(value: unknown): string {
  if (typeof value !== "string" || value.length < MIN_PASSWORD_LENGTH) {
    throw new UserError(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (value.length > 72) throw new UserError("The password must be 72 characters or fewer.");
  return value;
}

/** Maps Supabase Auth errors to messages for the admin. */
export function authError(error: { message: string; code?: string; status?: number }): UserError {
  if (error.code === "email_exists" || /already (been )?registered/i.test(error.message)) {
    return new UserError("A login with this email address already exists in Supabase Auth.");
  }
  if (error.code === "weak_password") {
    return new UserError(`The password is too weak: ${error.message}`);
  }
  return new UserError(`Supabase Auth: ${error.message}`);
}
