"use client";

import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { MonthGrid, MonthNav, statusText } from "@/components/month-calendar";
import { getTenantCleaningData, markCleaningTaskDone } from "@/app/actions/cleaning";
import {
  calendarEntries,
  formatShortDate,
  isSameDay,
  parseISODate,
  taskDescriptions,
  toISODate,
  type CalendarEntry,
  type CleaningTask,
  type CleaningStatus,
} from "@/lib/cleaning-data";

type TenantData = Awaited<ReturnType<typeof getTenantCleaningData>>;

const statusBadge: Record<CleaningStatus, string> = {
  open: "bg-blue-50 text-blue-900",
  overdue: "bg-orange-100 text-orange-800",
  done: "bg-green-100 text-green-800",
};

function StatusBadge({ status }: { status: CleaningStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[status]}`}>
      {statusText[status]}
    </span>
  );
}

function mapTask(task: TenantData["tasks"][number]): CleaningTask {
  return {
    id: task.id,
    houseId: task.houseId,
    houseName: task.houseName,
    spaceId: task.areaId,
    spaceName: task.areaName,
    floor: task.floor,
    roomId: task.roomId,
    room: `Room ${String(task.roomNumber).padStart(3, "0")}`,
    title: task.title,
    description: task.description,
    due: task.due,
    status: task.status,
    note: task.note,
    remindedAt: task.remindedAt,
  };
}

const card = "rounded-xl border border-stone-300 bg-white p-5";

function TenantCleaningScheduleContent() {
  const { house_id: houseId } = useParams<{ house_id: string }>();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [onlyMine, setOnlyMine] = useState(false);
  const [data, setData] = useState<TenantData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    try {
      setData(await getTenantCleaningData(houseId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your cleaning schedule.");
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const tasks = useMemo(() => (data?.tasks ?? []).map(mapTask), [data]);
  const myTasks = useMemo(
    () => tasks.filter((task) => task.roomId === data?.roomId).sort((a, b) => a.due.localeCompare(b.due)),
    [data?.roomId, tasks],
  );
  const myTodo = myTasks.filter((task) => task.status !== "done");
  const nextTask = myTodo.find((task) => task.status === "overdue") ?? myTodo[0];
  const myDone = myTasks.filter((task) => task.status === "done").reverse();
  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of calendarEntries(tasks)) {
      if (entry.building !== data?.houseName) continue;
      if (entry.category === "cleaning" && onlyMine && entry.detail !== data.room) continue;
      map.set(entry.date, [...(map.get(entry.date) ?? []), entry]);
    }
    return map;
  }, [data, onlyMine, tasks]);
  const selectedEntries = entriesByDate.get(toISODate(selected)) ?? [];
  const isMine = (entry: CalendarEntry) => entry.category === "cleaning" && entry.detail === data?.room;

  async function markDone() {
    if (!nextTask || saving) return;
    setSaving(true);
    setError("");
    try {
      await markCleaningTaskDone(nextTask.id, note);
      setConfirming(false);
      setNote("");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update the task.");
    } finally {
      setSaving(false);
    }
  }

  function dueLabel(task: CleaningTask) {
    const due = parseISODate(task.due);
    return `${formatShortDate(due)}${isSameDay(due, today) ? " (today)" : ""}`;
  }

  if (loading) {
    return <div className="flex-1 bg-stone-100 p-6 text-sm text-stone-700">Loading cleaning schedule…</div>;
  }

  return (
    <div className="flex-1 bg-stone-100">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h2 className="text-2xl font-semibold text-stone-900">Cleaning schedule</h2>
        {data && <p className="text-sm text-stone-600">{data.room} · {data.houseName}</p>}
      </div>

      <div className="space-y-5 p-6">
        {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {!error && data && (
          <>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <section className={`${card} flex-1`}>
                <h3 className="text-sm font-semibold text-stone-600">Your next task</h3>
                {nextTask ? (
                  <>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-xl font-semibold text-stone-900">{nextTask.title}</span>
                      <StatusBadge status={nextTask.status} />
                    </div>
                    <p className="mt-1 text-sm text-stone-700">
                      {nextTask.spaceName} · Floor {nextTask.floor} · Due{" "}
                      <span className={nextTask.status === "overdue" ? "font-semibold text-orange-800" : ""}>
                        {dueLabel(nextTask)}
                      </span>
                    </p>
                    <p className="mt-3 text-sm text-stone-700">
                      {nextTask.description || taskDescriptions[nextTask.spaceName] || ""}
                    </p>
                    {nextTask.remindedAt && (
                      <p className="mt-2 text-sm font-medium text-orange-800">
                        Your housing team sent a reminder on {formatShortDate(new Date(nextTask.remindedAt))}.
                      </p>
                    )}
                    {confirming ? (
                      <div className="mt-4 space-y-3">
                        <label htmlFor="note" className="block text-sm font-semibold text-stone-800">
                          Note for your landlord (optional)
                        </label>
                        <textarea
                          id="note"
                          rows={2}
                          maxLength={2000}
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="e.g. The bin was already full when I started."
                          className="w-full rounded-lg border border-stone-400 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/40"
                        />
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void markDone()}
                            className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                          >
                            {saving ? "Saving…" : "Confirm done"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="text-sm font-semibold text-stone-800 underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="mt-4 rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
                      >
                        Mark as done
                      </button>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-stone-700">You have no cleaning tasks coming up. Nice work!</p>
                )}
              </section>

              <section className={`${card} w-full lg:w-96`}>
                <h3 className="text-base font-semibold text-stone-900">Your tasks</h3>
                <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200">
                  {[...myTodo, ...myDone.slice(-3).reverse()].map((task) => (
                    <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <div className="font-semibold text-stone-900">{task.title}</div>
                        <div className="text-stone-600">{task.spaceName} · {dueLabel(task)}</div>
                      </div>
                      <StatusBadge status={task.status} />
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className={card}>
              <h3 className="text-base font-semibold text-stone-900">Who cleans next</h3>
              <p className="mt-1 text-xs text-stone-600">Upcoming turns for the shared spaces in your house.</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {data.areas.map((area) => {
                  const upcoming = tasks
                    .filter((task) => task.spaceId === area.id && task.status !== "done")
                    .sort((a, b) => a.due.localeCompare(b.due))
                    .slice(0, 4);
                  return (
                    <div key={area.id} className="rounded-lg border border-stone-200">
                      <div className="border-b border-stone-200 px-4 py-2 text-sm font-semibold text-stone-900">
                        {area.name} · Floor {area.floor}
                      </div>
                      <ul className="divide-y divide-stone-200 text-sm">
                        {upcoming.length === 0 && <li className="px-4 py-2 text-stone-500">Nothing planned yet.</li>}
                        {upcoming.map((task) => {
                          const mine = task.roomId === data.roomId;
                          return (
                            <li key={task.id} className={`flex justify-between px-4 py-2 ${mine ? "bg-teal-50 font-semibold text-teal-900" : "text-stone-800"}`}>
                              <span>{formatShortDate(parseISODate(task.due))}</span>
                              <span>{mine ? "You" : task.room}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
                {data.areas.length === 0 && <p className="text-sm text-stone-500">No shared spaces have been scheduled yet.</p>}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <MonthNav month={month} today={today} onMonthChange={setMonth} onSelect={setSelected} />
                <label className="flex items-center gap-3 text-sm text-stone-800">
                  <input
                    type="checkbox"
                    className="size-4 accent-teal-700"
                    checked={onlyMine}
                    onChange={(event) => setOnlyMine(event.target.checked)}
                  />
                  Only show my cleaning tasks
                </label>
              </div>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="flex-1">
                  <MonthGrid
                    month={month}
                    today={today}
                    selected={selected}
                    onSelect={setSelected}
                    entriesByDate={entriesByDate}
                    highlight={isMine}
                  />
                </div>
                <div className={`${card} w-full lg:w-70`}>
                  <h3 className="text-lg font-semibold text-stone-900">{formatShortDate(selected)}</h3>
                  <div className="mt-2 space-y-3">
                    {selectedEntries.length === 0 && <p className="text-sm text-stone-500">Nothing planned for this day.</p>}
                    {selectedEntries.map((entry) => (
                      <div key={entry.id}>
                        <div className="text-sm font-semibold text-stone-900">
                          {entry.title}
                          {isMine(entry) && <span className="ml-2 text-xs font-semibold text-teal-700">Your task</span>}
                        </div>
                        <div className="text-sm text-stone-600">
                          {entry.detail}{entry.status && ` · ${statusText[entry.status]}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function TenantCleaningSchedulePage() {
  return <Suspense fallback={null}><TenantCleaningScheduleContent /></Suspense>;
}
