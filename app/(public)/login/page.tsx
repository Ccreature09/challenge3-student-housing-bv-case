"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getCleaningDashboardPath } from "@/app/actions/cleaning";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw new Error(signInError.message);

      const path = await getCleaningDashboardPath();
      router.replace(path);
      router.refresh();
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
    
    <div className="flex flex-col items-center mb-12 bg-white-400 font-bold text-black">
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

    <main className="flex items-center justify-center bg-white-200 px-4 py-5">
      <form
        onSubmit={signIn}
        className="w-full max-w-md space-y-5 rounded-4xl border border-blue-400 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Sign in</h1>
          <p className="mt-1 text-sm text-stone-600">
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
            className="mb-2 block text-sm font-semibold text-stone-800"
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
            className="h-11 w-full rounded-lg border border-stone-400 px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/40"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-stone-800"
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
            className="h-11 w-full rounded-lg border border-stone-400 px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/40"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
    </>
  );
  
}
