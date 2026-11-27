"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ShieldAlert } from "lucide-react";
import { getHousingDashboardPath, getMyProfile } from "@/app/actions/auth";

type Profile = { id: string; name: string; role: string };

/**
 * The login is one cookie shared by every tab: signing in as a tenant in one
 * tab turns an open admin tab into a tenant session too. Instead of letting
 * each module fail with an error, this checks that the signed-in account fits
 * the dashboard in the URL and otherwise explains it and offers a way out.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const params = useParams<{ "admin-id"?: string; house_id?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    const result = await getMyProfile();
    // Not signed in at all: the pages already say "Please sign in first".
    setProfile(result.ok ? result.data : null);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void check(), 0);
    // Re-check when coming back to the tab, in case another tab changed the login.
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check, pathname]);

  const adminId = params["admin-id"];
  const mismatch =
    profile !== null &&
    ((adminId !== undefined && (profile.role !== "admin" || profile.id !== adminId)) ||
      (params.house_id !== undefined && profile.role !== "tenant"));

  if (!mismatch || !profile) return children;

  async function openMyDashboard() {
    setBusy(true);
    const result = await getHousingDashboardPath();
    setBusy(false);
    if (result.ok) router.replace(result.data);
  }

  async function switchAccount() {
    setBusy(true);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url && key) await createBrowserClient(url, key).auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const expected = adminId ? "an admin account" : "a tenant account";
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div role="alert" className="max-w-lg space-y-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto size-10 text-primary" aria-hidden />
        <h2 className="text-xl font-semibold text-primary">You are signed in with a different account</h2>
        <p className="text-sm text-muted-foreground">
          This page needs {expected}
          {adminId && profile.role === "admin" ? " (the one this dashboard belongs to)" : ""}, but this browser is now
          signed in as <strong className="text-foreground">{profile.name}</strong> ({profile.role}). Signing in in another
          tab changes the account for every tab.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void switchAccount()}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Sign out and switch account
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void openMyDashboard()}
            className="rounded-lg border border-input px-5 py-2.5 text-sm font-semibold hover:bg-accent disabled:opacity-50"
          >
            Go to {profile.name.split(" ")[0]}&apos;s dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
