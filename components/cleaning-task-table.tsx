"use client";

import type { CleaningStatus, CleaningTaskRow } from "@/app/actions/cleaning";
import { DataTable, type Column } from "@/components/admin/data-table";
import { formatShortDate, parseISODate, toISODate } from "@/lib/cleaning-data";

export const cleaningStatusStyle: Record<CleaningStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-sky-100 text-primary" },
  overdue: { label: "Overdue", className: "bg-orange-100 text-orange-800" },
  done: { label: "Done", className: "bg-green-100 text-green-800" },
};

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

/**
 * The cleaning schedule of a house's shared spaces with Open / Overdue / Done
 * this week counters, search, filters and sorting. Used by landlord and tenant.
 */
export function CleaningTaskTable<T extends CleaningTaskRow>({
  tasks,
  actions,
  extraFilters = [],
  highlight,
}: {
  tasks: T[];
  actions?: (task: T) => React.ReactNode;
  extraFilters?: React.ComponentProps<typeof DataTable<T>>["filters"];
  /** Rows to emphasise, e.g. the tenant's own tasks. */
  highlight?: (task: T) => boolean;
}) {
  const weekStart = toISODate(startOfWeek(new Date()));
  const counts = {
    open: tasks.filter((task) => task.status === "open").length,
    overdue: tasks.filter((task) => task.status === "overdue").length,
    doneThisWeek: tasks.filter(
      (task) => task.status === "done" && (task.completedAt ?? "").slice(0, 10) >= weekStart,
    ).length,
  };
  const spaces = [...new Map(tasks.map((task) => [task.areaId, `${task.areaName} · Floor ${task.floor}`]))];
  const roomsInUse = [...new Map(tasks.map((task) => [task.roomId, task.roomNumber]))].sort((a, b) => a[1] - b[1]);

  const columns: Column<T>[] = [
    {
      key: "due",
      header: "Due",
      render: (task) => (
        <span className={task.status === "overdue" ? "font-semibold text-orange-800" : ""}>
          {formatShortDate(parseISODate(task.dueDate))}
        </span>
      ),
      sortValue: (task) => task.dueDate,
    },
    {
      key: "task",
      header: "Task",
      render: (task) => (
        <>
          <span className="font-medium">{task.title}</span>
          {highlight?.(task) && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Your room</span>
          )}
          {task.description && <div className="text-xs text-muted-foreground">{task.description}</div>}
        </>
      ),
      sortValue: (task) => task.title,
    },
    {
      key: "space",
      header: "Shared space",
      render: (task) => `${task.areaName} · Floor ${task.floor}`,
      sortValue: (task) => `${task.areaName} ${task.floor}`,
    },
    {
      key: "room",
      header: "Assigned to",
      render: (task) => (
        <>
          Room {task.roomNumber}
          {task.assignee && <div className="text-xs text-muted-foreground">{task.assignee}</div>}
        </>
      ),
      sortValue: (task) => task.roomNumber,
    },
    {
      key: "status",
      header: "Status",
      render: (task) => (
        <>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cleaningStatusStyle[task.status].className}`}>
            {cleaningStatusStyle[task.status].label}
          </span>
          {task.completionNote && (
            <div className="mt-1 max-w-56 text-xs text-muted-foreground">“{task.completionNote}”</div>
          )}
        </>
      ),
      sortValue: (task) => ["overdue", "open", "done"].indexOf(task.status),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Counter label="Open" value={counts.open} className="text-primary" />
        <Counter label="Overdue" value={counts.overdue} className="text-orange-800" />
        <Counter label="Done this week" value={counts.doneThisWeek} className="text-green-800" />
      </div>
      <DataTable
        rows={tasks}
        rowKey={(task) => task.id}
        columns={columns}
        searchText={(task) =>
          `${task.title} ${task.description ?? ""} ${task.areaName} room ${task.roomNumber} ${task.assignee ?? ""}`
        }
        searchPlaceholder="Search tasks, spaces or people"
        filters={[
          ...extraFilters,
          {
            key: "status",
            label: "Status",
            options: [
              { value: "open", label: "Open" },
              { value: "overdue", label: "Overdue" },
              { value: "done", label: "Done" },
            ],
            matches: (task, value) => task.status === value,
          },
          {
            key: "space",
            label: "Shared space",
            options: spaces.map(([value, label]) => ({ value, label })),
            matches: (task, value) => task.areaId === value,
          },
          {
            key: "room",
            label: "Room",
            options: roomsInUse.map(([value, number]) => ({ value, label: `Room ${number}` })),
            matches: (task, value) => task.roomId === value,
          },
        ]}
        actions={actions}
        emptyText="No cleaning tasks are planned for this house yet."
      />
    </div>
  );
}

function Counter({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-3xl font-bold ${className}`}>{value}</div>
    </div>
  );
}
