"use client";

import { Suspense, useMemo, useState } from "react";
import { MonthGrid, MonthNav, statusText } from "@/components/month-calendar";
import {
  calendarEntries,
  cleaningTasks,
  currentTenant,
  formatShortDate,
  isSameDay,
  parseISODate,
  sharedSpaces,
  spaceById,
  spaceLabel,
  taskDescriptions,
  toISODate,
  type CalendarEntry,
  type CleaningStatus,
  type CleaningTask,
} from "@/lib/cleaning-data";

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

const card = "rounded-xl border border-stone-300 bg-white p-5";

function TenantCleaningScheduleContent() {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [onlyMine, setOnlyMine] = useState(false);

  // Tasks the tenant marked as done in this session (no backend yet).
  const [completed, setCompleted] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");

  const withLocalStatus = (t: CleaningTask): CleaningTask =>
    t.id in completed ? { ...t, status: "done", note: completed[t.id] || t.note } : t;

  const buildingTasks = cleaningTasks
    .filter((t) => spaceById(t.spaceId)!.building === currentTenant.building)
    .map(withLocalStatus);

  const myTasks = buildingTasks
    .filter((t) => t.room === currentTenant.room)
    .sort((a, b) => a.due.localeCompare(b.due));
  const myTodo = myTasks.filter((t) => t.status !== "done");
  const nextTask = myTodo.find((t) => t.status === "overdue") ?? myTodo[0];
  const myDone = myTasks.filter((t) => t.status === "done").reverse();

  const mySpaces = sharedSpaces.filter(
    (s) => s.building === currentTenant.building && s.rooms.includes(currentTenant.room),
  );

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of calendarEntries()) {
      if (e.building !== currentTenant.building) continue;
      let entry = e;
      if (e.category === "cleaning") {
        if (onlyMine && e.detail !== currentTenant.room) continue;
        if (e.id in completed) entry = { ...e, status: "done" };
      }
      map.set(entry.date, [...(map.get(entry.date) ?? []), entry]);
    }
    return map;
  }, [onlyMine, completed]);

  const selectedEntries = entriesByDate.get(toISODate(selected)) ?? [];
  const isMine = (e: CalendarEntry) => e.category === "cleaning" && e.detail === currentTenant.room;

  function markDone() {
    if (!nextTask) return;
    // TODO: send to the backend so the landlord sees the status and note.
    setCompleted((c) => ({ ...c, [nextTask.id]: note.trim() }));
    setConfirming(false);
    setNote("");
  }

  function dueLabel(task: CleaningTask) {
    const due = parseISODate(task.due);
    return `${formatShortDate(due)}${isSameDay(due, today) ? " (today)" : ""}`;
  }

  return (
    <div className="flex-1 bg-stone-100">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h2 className="text-2xl font-semibold text-stone-900">Cleaning schedule</h2>
        <p className="text-sm text-stone-600">
          {currentTenant.room} · {currentTenant.building}
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          {/* Your next task */}
          <section className={`${card} flex-1`}>
            <h3 className="text-sm font-semibold text-stone-600">Your next task</h3>
            {nextTask ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-xl font-semibold text-stone-900">{nextTask.title}</span>
                  <StatusBadge status={nextTask.status} />
                </div>
                <p className="mt-1 text-sm text-stone-700">
                  {spaceLabel(spaceById(nextTask.spaceId)!)} · Due{" "}
                  <span className={nextTask.status === "overdue" ? "font-semibold text-orange-800" : ""}>
                    {dueLabel(nextTask)}
                  </span>
                </p>
                <p className="mt-3 text-sm text-stone-700">
                  {taskDescriptions[spaceById(nextTask.spaceId)!.name]}
                </p>

                {confirming ? (
                  <div className="mt-4 space-y-3">
                    <label htmlFor="note" className="block text-sm font-semibold text-stone-800">
                      Note for your landlord (optional)
                    </label>
                    <textarea
                      id="note"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. The bin was already full when I started."
                      className="w-full rounded-lg border border-stone-400 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/40"
                    />
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={markDone}
                        className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
                      >
                        Confirm done
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

          {/* Your tasks */}
          <section className={`${card} w-full lg:w-96`}>
            <h3 className="text-base font-semibold text-stone-900">Your tasks</h3>
            <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200">
              {[...myTodo, ...myDone.slice(0, 3)].map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <div className="font-semibold text-stone-900">{t.title}</div>
                    <div className="text-stone-600">
                      {spaceLabel(spaceById(t.spaceId)!)} · {dueLabel(t)}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Rota per shared space */}
        <section className={card}>
          <h3 className="text-base font-semibold text-stone-900">Who cleans next</h3>
          <p className="mt-1 text-xs text-stone-600">Upcoming turns for the shared spaces you use.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {mySpaces.map((space) => {
              const upcoming = buildingTasks
                .filter((t) => t.spaceId === space.id && t.status !== "done")
                .sort((a, b) => a.due.localeCompare(b.due))
                .slice(0, 4);
              return (
                <div key={space.id} className="rounded-lg border border-stone-200">
                  <div className="border-b border-stone-200 px-4 py-2 text-sm font-semibold text-stone-900">
                    {spaceLabel(space)}
                  </div>
                  <ul className="divide-y divide-stone-200 text-sm">
                    {upcoming.length === 0 && <li className="px-4 py-2 text-stone-500">Nothing planned yet.</li>}
                    {upcoming.map((t) => {
                      const mine = t.room === currentTenant.room;
                      return (
                        <li
                          key={t.id}
                          className={`flex justify-between px-4 py-2 ${mine ? "bg-teal-50 font-semibold text-teal-900" : "text-stone-800"}`}
                        >
                          <span>{formatShortDate(parseISODate(t.due))}</span>
                          <span>{mine ? "You" : t.room}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Calendar */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <MonthNav month={month} today={today} onMonthChange={setMonth} onSelect={setSelected} />
            <label className="flex items-center gap-3 text-sm text-stone-800">
              <input
                type="checkbox"
                className="size-4 accent-teal-700"
                checked={onlyMine}
                onChange={(e) => setOnlyMine(e.target.checked)}
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
                {selectedEntries.map((e) => (
                  <div key={e.id}>
                    <div className="text-sm font-semibold text-stone-900">
                      {e.title}
                      {isMine(e) && <span className="ml-2 text-xs font-semibold text-teal-700">Your task</span>}
                    </div>
                    <div className="text-sm text-stone-600">
                      {e.detail}
                      {e.status && ` · ${statusText[e.status]}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function TenantCleaningSchedulePage() {
  return (
    <Suspense fallback={null}>
      <TenantCleaningScheduleContent />
    </Suspense>
  );
}
