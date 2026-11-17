"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { getAdminCleaningData, sendCleaningReminder } from "@/app/actions/cleaning";
import {
  formatShortDate,
  parseISODate,
  type CleaningStatus,
  type CleaningTask,
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
  const badge = statusStyles[status];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>;
}

type AdminData = Awaited<ReturnType<typeof getAdminCleaningData>>;

function mapTask(task: AdminData["tasks"][number]): CleaningTask {
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

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function CleaningSchedulePageContent() {
  const params = useParams<{ "admin-id": string }>();
  const adminId = params["admin-id"];
  const base = `/admin-dashboard/${adminId}/cleaning-schedule`;
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState<string | null>(null);
  const [building, setBuilding] = useState("all");
  const [space, setSpace] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const weekStart = startOfWeek(today);

  const loadData = useCallback(async () => {
    setError("");
    try {
      setData(await getAdminCleaningData(adminId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load cleaning schedules.");
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const tasks = useMemo(() => (data?.tasks ?? []).map(mapTask), [data]);
  const visibleSpaces = data?.areas.filter((area) => building === "all" || area.houseId === building) ?? [];
  const filtered = tasks
    .filter((task) => {
      if (building !== "all" && task.houseId !== building) return false;
      if (space !== "all" && task.spaceId !== space) return false;
      if (status !== "all" && task.status !== status) return false;
      return true;
    })
    .sort((a, b) => {
      const rank = { overdue: 0, open: 1, done: 2 };
      return rank[a.status] - rank[b.status] || a.due.localeCompare(b.due);
    });

  const counts = {
    open: filtered.filter((task) => task.status === "open").length,
    overdue: filtered.filter((task) => task.status === "overdue").length,
    doneThisWeek: filtered.filter((task) => task.status === "done" && parseISODate(task.due) >= weekStart).length,
  };
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function updateFilter(setter: (value: string) => void) {
    return (event: React.ChangeEvent<HTMLSelectElement>) => {
      setter(event.target.value);
      setPage(0);
    };
  }

  async function remind(taskId: string) {
    setReminding(taskId);
    setError("");
    try {
      await sendCleaningReminder(adminId, taskId);
      await loadData();
    } catch (reminderError) {
      setError(reminderError instanceof Error ? reminderError.message : "Could not record the reminder.");
    } finally {
      setReminding(null);
    }
  }

  return (
    <div className="flex-1 bg-stone-100">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h2 className="text-2xl font-semibold text-stone-900">Cleaning schedule</h2>
        <Link href={`${base}/new`} className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800">
          + New task
        </Link>
      </div>

      <div className="space-y-4 p-6">
        {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {loading && <p className="text-sm text-stone-700">Loading cleaning schedules…</p>}
        {!loading && data && (
          <>
            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-700">
              <label className="flex items-center gap-3">
                House
                <select
                  className={selectClass}
                  value={building}
                  onChange={(event) => {
                    setBuilding(event.target.value);
                    setSpace("all");
                    setPage(0);
                  }}
                >
                  <option value="all">All houses</option>
                  {data.houses.map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-3">
                Shared space
                <select className={selectClass} value={space} onChange={updateFilter(setSpace)}>
                  <option value="all">All spaces</option>
                  {visibleSpaces.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name} · Floor {area.floor}
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
                      <th className="px-4 py-4">House / shared space</th>
                      <th className="px-4 py-4">Task</th>
                      <th className="px-4 py-4">Assigned to</th>
                      <th className="px-4 py-4">Due</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-500">No cleaning tasks match these filters.</td></tr>
                    )}
                    {rows.map((task) => {
                      const overdue = task.status === "overdue";
                      return (
                        <tr key={task.id} className={`border-t border-stone-200 ${overdue ? "bg-orange-50" : ""}`}>
                          <td className="px-4 py-3 text-stone-800">{task.houseName}<div className="text-xs text-stone-500">{task.spaceName} · Floor {task.floor}</div></td>
                          <td className="px-4 py-3 font-semibold text-stone-900">{task.title}</td>
                          <td className="px-4 py-3 text-stone-800">{task.room}</td>
                          <td className={`px-4 py-3 ${overdue ? "font-semibold text-orange-800" : "text-stone-800"}`}>{formatShortDate(parseISODate(task.due))}</td>
                          <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                          <td className="px-4 py-3 text-right">
                            {task.status !== "done" && (
                              <button
                                type="button"
                                disabled={reminding === task.id}
                                onClick={() => void remind(task.id)}
                                className="rounded-lg border border-orange-800 px-3 py-2 text-sm font-medium text-orange-800 hover:bg-orange-100 disabled:border-stone-300 disabled:text-stone-500"
                              >
                                {reminding === task.id ? "Saving…" : task.remindedAt ? "Reminder recorded" : "Remind tenant"}
                              </button>
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
                <span>{filtered.length === 0 ? "Showing 0 of 0" : `Showing ${currentPage * PAGE_SIZE + 1} to ${currentPage * PAGE_SIZE + rows.length} of ${filtered.length}`}</span>
                <div className="flex gap-2">
                  <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-stone-400 px-3 py-2 font-medium text-stone-900 disabled:border-stone-200 disabled:text-stone-400">Previous</button>
                  <button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-stone-400 px-3 py-2 font-medium text-stone-900 disabled:border-stone-200 disabled:text-stone-400">Next</button>
                </div>
              </div>
            </div>
          </>
        )}
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
  return <Suspense fallback={null}><CleaningSchedulePageContent /></Suspense>;
}
