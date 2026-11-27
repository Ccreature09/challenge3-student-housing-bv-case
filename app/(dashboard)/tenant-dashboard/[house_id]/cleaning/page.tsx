"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { completeCleaningTask, getTenantCleaning } from "@/app/actions/tenant";
import { CleaningTaskTable } from "@/components/cleaning-task-table";
import { Modal } from "@/components/admin/modal";
import { useActionData } from "@/components/admin/use-action";
import { formatShortDate, parseISODate } from "@/lib/cleaning-data";

type Task = Extract<Awaited<ReturnType<typeof getTenantCleaning>>, { ok: true }>["data"]["tasks"][number];

/** The cleaning schedule for the house's shared spaces; tenants complete the tasks of their own room. */
function TenantCleaning() {
  const houseId = useParams<{ house_id: string }>().house_id;
  const load = useCallback(() => getTenantCleaning(houseId), [houseId]);
  const { data, error, loading, reload } = useActionData(load);
  const [completing, setCompleting] = useState<Task | null>(null);

  const myOpen = data?.tasks.filter((task) => task.mine && task.status !== "done") ?? [];

  return (
    <main className="flex-1">
      <div className="flex items-center gap-4 border-b border-border px-8 py-6">
        <Link href={`/tenant-dashboard/${houseId}/home`} aria-label="Back to my house" className="rounded-lg p-2 text-primary hover:bg-accent">
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Common spaces</p>
          <h1 className="text-2xl font-bold text-primary">Cleaning schedule</h1>
          <p className="text-sm text-muted-foreground">
            Who cleans the kitchen, bathrooms and other shared spaces, and when. Mark your room&apos;s tasks as done
            when you have finished them.
          </p>
        </div>
      </div>

      <div className="space-y-6 px-8 py-6">
        {loading && <p className="text-sm text-muted-foreground">Loading the schedule…</p>}
        {error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        )}

        {data && (
          <>
            <section aria-labelledby="my-tasks" className="rounded-2xl border-2 border-primary/30 bg-accent/40 p-5">
              <h2 id="my-tasks" className="text-lg font-semibold text-primary">
                Your tasks · Room {data.roomNumber}
              </h2>
              {myOpen.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">You have no open cleaning tasks. Nice work!</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {myOpen.map((task) => (
                    <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3">
                      <div>
                        <p className="font-medium">
                          {task.title} <span className="text-muted-foreground">· {task.areaName}, floor {task.floor}</span>
                        </p>
                        <p className={`text-sm ${task.status === "overdue" ? "font-semibold text-orange-800" : "text-muted-foreground"}`}>
                          {task.status === "overdue" ? "Overdue, was due " : "Due "}
                          {formatShortDate(parseISODate(task.dueDate))}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCompleting(task)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Mark as done
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="house-schedule" className="space-y-3">
              <h2 id="house-schedule" className="text-lg font-semibold text-primary">Whole house</h2>
              <CleaningTaskTable
                tasks={data.tasks}
                highlight={(task) => task.mine}
                extraFilters={[
                  {
                    key: "who",
                    label: "Show",
                    options: [{ value: "mine", label: "Only my room" }],
                    matches: (task, value) => value !== "mine" || task.mine,
                  },
                ]}
                actions={(task) =>
                  task.mine && task.status !== "done" ? (
                    <button
                      type="button"
                      onClick={() => setCompleting(task)}
                      className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent"
                    >
                      Mark as done
                    </button>
                  ) : null
                }
              />
            </section>
          </>
        )}
      </div>

      <Modal open={completing !== null} onClose={() => setCompleting(null)} title="Mark task as done" size="md">
        {completing && (
          <CompleteForm
            task={completing}
            onSubmit={async (note) => {
              const result = await completeCleaningTask(houseId, completing.id, note);
              if (!result.ok) return result.error;
              setCompleting(null);
              await reload();
              return null;
            }}
          />
        )}
      </Modal>
    </main>
  );
}

function CompleteForm({ task, onSubmit }: { task: Task; onSubmit: (note: string) => Promise<string | null> }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        const message = await onSubmit(String(new FormData(event.currentTarget).get("note") ?? ""));
        setSaving(false);
        if (message) setError(message);
      }}
      className="space-y-4"
    >
      <p className="text-sm">
        <strong>{task.title}</strong> · {task.areaName}, floor {task.floor} · due {formatShortDate(parseISODate(task.dueDate))}
      </p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <label className="block text-sm font-semibold">
        Note for the housing office (optional)
        <textarea
          name="note"
          rows={3}
          maxLength={2000}
          placeholder="e.g. We are out of cleaning spray."
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none"
        />
      </label>
      <button type="submit" disabled={saving} className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {saving ? "Saving…" : "Mark as done"}
      </button>
    </form>
  );
}

export default function TenantCleaningPage() {
  return (
    <Suspense fallback={null}>
      <TenantCleaning />
    </Suspense>
  );
}
