"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { isSameDay, toISODate, type CalendarEntry } from "@/lib/cleaning-data";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const statusText = { open: "○ Open", overdue: "! Overdue", done: "✓ Done" };

function chipClass(entry: CalendarEntry) {
  if (entry.category === "cleaning") {
    if (entry.status === "done") return "bg-green-100 text-green-800";
    if (entry.status === "overdue") return "bg-orange-100 text-orange-800";
    return "bg-teal-50 text-teal-900";
  }
  if (entry.category === "waste") return "bg-amber-100 text-amber-900";
  if (entry.category === "event") return "bg-purple-100 text-purple-900";
  return "bg-blue-50 text-blue-900";
}

function chipLabel(entry: CalendarEntry) {
  if (entry.status === "done") return `✓ ${entry.label}`;
  if (entry.status === "overdue") return `! ${entry.label}`;
  return entry.label;
}

/** All days shown in the month grid, starting on Monday. */
function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)));
  const days: Date[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  return days;
}

const navButton =
  "flex h-11 items-center justify-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 hover:bg-stone-100";

/** Previous / month name / next / Today controls. */
export function MonthNav({
  month,
  today,
  onMonthChange,
  onSelect,
}: {
  month: Date;
  today: Date;
  onMonthChange: (month: Date) => void;
  onSelect: (day: Date) => void;
}) {
  const shift = (delta: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Previous month" className={`${navButton} w-11`} onClick={() => shift(-1)}>
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-40 text-center text-lg font-semibold text-stone-900">
        {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </span>
      <button type="button" aria-label="Next month" className={`${navButton} w-11`} onClick={() => shift(1)}>
        <ChevronRight className="size-4" />
      </button>
      <button
        type="button"
        className={`${navButton} px-5`}
        onClick={() => {
          onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
          onSelect(today);
        }}
      >
        Today
      </button>
    </div>
  );
}

/** Month grid with event chips; clicking a day selects it. */
export function MonthGrid({
  month,
  today,
  selected,
  onSelect,
  entriesByDate,
  highlight,
}: {
  month: Date;
  today: Date;
  selected: Date;
  onSelect: (day: Date) => void;
  entriesByDate: Map<string, CalendarEntry[]>;
  /** Optional: entries for which this returns true get a bold ring (e.g. the tenant's own tasks). */
  highlight?: (entry: CalendarEntry) => boolean;
}) {
  return (
    <div className="rounded-xl border border-stone-300 bg-white p-3">
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-stone-600">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l border-t border-stone-200">
        {monthGrid(month).map((day) => {
          const iso = toISODate(day);
          const entries = entriesByDate.get(iso) ?? [];
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selected);
          return (
            <button
              type="button"
              key={iso}
              onClick={() => onSelect(day)}
              className={`relative flex min-h-22 flex-col items-stretch gap-1 border-b border-r border-stone-200 p-2 text-left text-xs ${
                inMonth ? "bg-white hover:bg-stone-50" : "bg-stone-100 text-stone-400"
              } ${isSelected ? "outline-2 -outline-offset-2 outline-teal-700" : ""}`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-teal-700 font-semibold text-white" : inMonth ? "text-stone-800" : ""
                }`}
              >
                {day.getDate()}
              </span>
              {entries.slice(0, 2).map((e) => (
                <span
                  key={e.id}
                  title={`${e.title} · ${e.detail}`}
                  className={`truncate rounded px-1.5 py-0.5 ${chipClass(e)} ${
                    highlight?.(e) ? "font-semibold ring-1 ring-current" : ""
                  }`}
                >
                  {chipLabel(e)}
                </span>
              ))}
              {entries.length > 2 && <span className="px-1.5 text-stone-500">+{entries.length - 2} more</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
