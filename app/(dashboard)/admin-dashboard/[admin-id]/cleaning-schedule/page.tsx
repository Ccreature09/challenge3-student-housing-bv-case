"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  buildings,
  cleaningTasks,
  formatShortDate,
  isSameDay,
  parseISODate,
  sharedSpaces,
  spaceById,
  spaceLabel,
  type CleaningStatus,
} from "@/lib/cleaning-data";

const PAGE_SIZE = 7;

const selectClass =
  "h-11 rounded-lg border border-stone-400 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/40";

const statusStyles: Record<CleaningStatus, { label: string; className: string }> = {
  open: { label: "○ Open", className: "bg-blue-50 text-blue-900" },
  overdue: { label: "! Overdue", className: "bg-orange-100 text-orange-800" },
  done: { label: "✓ Done", className: "bg-green-100 text-green-800" },
};

function StatusBadge({ status }: { status: CleaningStatus }) {
  const s = statusStyles[status];
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}

function CleaningSchedulePageContent() {
  const params = useParams<{ "admin-id": string }>();
  const base = `/admin-dashboard/${params["admin-id"]}/cleaning-schedule`;

  const [building, setBuilding] = useState("all");
  const [space, setSpace] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [reminded, setReminded] = useState<Set<string>>(new Set());
  const [openNote, setOpenNote] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const weekStart = startOfWeek(today);

  const visibleSpaces = sharedSpaces.filter((s) => building === "all" || s.building === building);

  const filtered = useMemo(
    () =>
      cleaningTasks
        .filter((t) => {
          const s = spaceById(t.spaceId)!;
          if (building !== "all" && s.building !== building) return false;
          if (space !== "all" && t.spaceId !== space) return false;
          if (status !== "all" && t.status !== status) return false;
          return true;
        })
        // Overdue and open first, then by due date
        .sort((a, b) => {
          const rank = { overdue: 0, open: 1, done: 2 };
          return rank[a.status] - rank[b.status] || a.due.localeCompare(b.due);
        }),
    [building, space, status],
  );

  const counts = {
    open: filtered.filter((t) => t.status === "open").length,
    overdue: filtered.filter((t) => t.status === "overdue").length,
    doneThisWeek: filtered.filter((t) => t.status === "done" && parseISODate(t.due) >= weekStart).length,
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function updateFilter(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(0);
    };
  }

  return (
    <div className="flex-1 bg-stone-100">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h2 className="text-2xl font-semibold text-stone-900">Cleaning schedule</h2>
        <Link
          href={`${base}/new`}
          className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
        >
          + New task
        </Link>
      </div>

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-4 text-sm text-stone-700">
          <label className="flex items-center gap-3">
            Building
            <select
              className={selectClass}
              value={building}
              onChange={(e) => {
                setBuilding(e.target.value);
                setSpace("all");
                setPage(0);
              }}
            >
              <option value="all">All buildings</option>
              {buildings.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3">
            Shared space
            <select className={selectClass} value={space} onChange={updateFilter(setSpace)}>
              <option value="all">All spaces</option>
              {visibleSpaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {spaceLabel(s)}
                  {building === "all" ? ` (${s.building})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3">
            Status
            <select className={selectClass} value={status} onChange={updateFilter(setStatus)}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="overdue">Overdue</option>
              <option value="done">Done</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Open" value={counts.open} className="text-blue-900" />
          <StatCard label="Done this week" value={counts.doneThisWeek} className="text-green-800" />
          <StatCard label="Overdue" value={counts.overdue} className="text-orange-800" />
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-left text-xs font-semibold text-stone-700">
                <tr>
                  <th className="px-4 py-4">Shared space</th>
                  <th className="px-4 py-4">Task</th>
                  <th className="px-4 py-4">Assigned to</th>
                  <th className="px-4 py-4">Due</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-stone-500">
                      No cleaning tasks match these filters.
                    </td>
                  </tr>
                )}
                {rows.map((task) => {
                  const s = spaceById(task.spaceId)!;
                  const due = parseISODate(task.due);
                  const overdue = task.status === "overdue";
                  return (
                    <tr key={task.id} className={`border-t border-stone-200 ${overdue ? "bg-orange-50" : ""}`}>
                      <td className="px-4 py-3 text-stone-800">{spaceLabel(s)}</td>
                      <td className="px-4 py-3 font-semibold text-stone-900">{task.title}</td>
                      <td className="px-4 py-3 text-stone-800">{task.room}</td>
                      <td className={`px-4 py-3 ${overdue ? "font-semibold text-orange-800" : "text-stone-800"}`}>
                        {formatShortDate(due)}
                        {isSameDay(due, today) && " (today)"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {task.status === "overdue" && (
                          <button
                            type="button"
                            disabled={reminded.has(task.id)}
                            onClick={() => setReminded((r) => new Set(r).add(task.id))}
                            className="rounded-lg border border-orange-800 px-3 py-2 text-sm font-medium text-orange-800 hover:bg-orange-100 disabled:border-stone-300 disabled:text-stone-500 disabled:hover:bg-transparent"
                          >
                            {reminded.has(task.id) ? "Reminder sent" : "Remind tenant"}
                          </button>
                        )}
                        {task.status === "open" && (
                          <Link
                            href={`${base}/new?space=${task.spaceId}`}
                            className="inline-block rounded-lg border border-stone-400 px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-100"
                          >
                            Reassign
                          </Link>
                        )}
                        {task.status === "done" && (
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => setOpenNote(openNote === task.id ? null : task.id)}
                              className="rounded-lg border border-stone-400 px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-100"
                            >
                              View note
                            </button>
                            {openNote === task.id && (
                              <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-stone-300 bg-white p-3 text-left text-sm text-stone-700 shadow-lg">
                                {task.note ?? "The tenant did not leave a note."}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 text-sm text-stone-600">
            <span>
              {filtered.length === 0
                ? "Showing 0 of 0"
                : `Showing ${currentPage * PAGE_SIZE + 1} to ${currentPage * PAGE_SIZE + rows.length} of ${filtered.length}`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                className="rounded-lg border border-stone-400 px-3 py-2 font-medium text-stone-900 hover:bg-stone-100 disabled:border-stone-200 disabled:text-stone-400 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
                className="rounded-lg border border-stone-400 px-3 py-2 font-medium text-stone-900 hover:bg-stone-100 disabled:border-stone-200 disabled:text-stone-400 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-xl border border-stone-300 bg-white p-4">
      <div className="text-sm text-stone-700">{label}</div>
      <div className={`text-3xl font-bold ${className}`}>{value}</div>
    </div>
  );
}

export default function CleaningSchedulePage() {
  return (
    <Suspense fallback={null}>
      <CleaningSchedulePageContent />
    </Suspense>
  );
}
