"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const MIN_LENGTH = 8;
const fieldClass =
  "h-11 w-full rounded-lg border border-stone-400 px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/40";

function browserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase Auth is not configured.");
  return createBrowserClient(url, key);
}

/**
 * Lets the signed-in user replace their password. The current password is
 * checked first so an unattended session cannot be taken over.
 */
export function ChangePasswordForm({
  onDone,
  submitLabel = "Change password",
}: {
  onDone: () => void;
  submitLabel?: string;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = String(form.get("current"));
    const next = String(form.get("next"));
    const repeat = String(form.get("repeat"));
    setError("");
    if (next.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (next !== repeat) return setError("The new passwords do not match.");
    if (next === current) return setError("Choose a password that differs from the current one.");

    setSaving(true);
    try {
      const supabase = browserClient();
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) throw new Error("Your session has expired. Please sign in again.");
      const check = await supabase.auth.signInWithPassword({ email, password: current });
      if (check.error) throw new Error("The current password is not correct.");
      const { error: updateError } = await supabase.auth.updateUser({
        password: next,
        data: { must_change_password: false },
      });
      if (updateError) throw new Error(updateError.message);
      onDone();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not change the password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <label className="block text-sm font-semibold text-stone-800">
        Current password
        <input name="current" type="password" autoComplete="current-password" required className={`${fieldClass} mt-2`} />
      </label>
      <label className="block text-sm font-semibold text-stone-800">
        New password
        <input name="next" type="password" autoComplete="new-password" required minLength={MIN_LENGTH} className={`${fieldClass} mt-2`} />
      </label>
      <label className="block text-sm font-semibold text-stone-800">
        Repeat new password
        <input name="repeat" type="password" autoComplete="new-password" required minLength={MIN_LENGTH} className={`${fieldClass} mt-2`} />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
