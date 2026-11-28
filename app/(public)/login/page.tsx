"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getHousingDashboardPath } from "@/app/actions/auth";
import { ChangePasswordForm } from "@/components/change-password-form";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Set when the account still has the temporary password an admin gave it.
  const [mustChangeTo, setMustChangeTo] = useState<string | null>(null);

  function openDashboard(path: string) {
    router.replace(path);
    router.refresh();
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabasePublishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabasePublishableKey) {
        throw new Error(
          "Supabase Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        );
      }

      const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (signInError) throw new Error(signInError.message);

      const result = await getHousingDashboardPath();
      if (!result.ok) {
        const { error: signOutError } = await supabase.auth.signOut();
        throw new Error(
          signOutError
            ? `${result.error} Could not end the session: ${signOutError.message}`
            : result.error,
        );
      }

      if (data.user?.user_metadata?.must_change_password) {
        setMustChangeTo(result.data);
        setSubmitting(false);
        return;
      }
      openDashboard(result.data);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Could not sign in.",
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center mb-12 bg-card-400 font-bold text-black">
        <header className="flex flex-col items-center gap-2 ">
          <img
            src="/images/lightlogo.png"
            alt="logo"
            width="600"
            height="400"
          />
          <p className="mb-1">Your ideal Housing Management Platform</p>
        </header>
      </div>

      <main className="flex items-center justify-center bg-card-200 px-4 py-5">
        {mustChangeTo ? (
          <div className="w-full max-w-md space-y-5 rounded-4xl border border-border bg-card p-8 shadow-sm">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Choose your own password
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                You signed in with a temporary password from the housing office.
                Replace it before you continue.
              </p>
            </div>
            <ChangePasswordForm
              submitLabel="Save and continue"
              onDone={() => openDashboard(mustChangeTo)}
            />
          </div>
        ) : (
          <form
            onSubmit={signIn}
            className="w-full max-w-md space-y-5 rounded-4xl border border-border bg-card p-8 shadow-sm"
          >
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Use your housing account to log in.
              </p>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </p>
            )}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-lg border border-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-lg border border-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
