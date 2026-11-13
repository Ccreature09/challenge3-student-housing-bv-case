"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { MonthGrid, MonthNav, statusText } from "@/components/month-calendar";
import {
  buildings,
  calendarEntries,
  toISODate,
  type CalendarCategory,
  type CalendarEntry,
} from "@/lib/cleaning-data";

const categories: { id: CalendarCategory; label: string }[] = [
  { id: "cleaning", label: "Cleaning tasks" },
  { id: "waste", label: "Waste collection" },
  { id: "event", label: "Events" },
  { id: "maintenance", label: "Maintenance" },
];

function LandlordCalendarPageContent() {
  const params = useParams<{ "admin-id": string }>();
  const base = `/admin-dashboard/${params["admin-id"]}`;

  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [building, setBuilding] = useState("all");
  const [shown, setShown] = useState<Set<CalendarCategory>>(new Set(categories.map((c) => c.id)));

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of calendarEntries()) {
      if (!shown.has(e.category)) continue;
      if (building !== "all" && e.building !== building) continue;
      map.set(e.date, [...(map.get(e.date) ?? []), e]);
    }
    return map;
  }, [building, shown]);

  const selectedEntries = entriesByDate.get(toISODate(selected)) ?? [];

  function toggle(cat: CalendarCategory) {
    const next = new Set(shown);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setShown(next);
  }

  return (
    <div className="flex-1 bg-stone-100">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h2 className="text-2xl font-semibold text-stone-900">Calendar</h2>
        <p className="text-sm text-stone-600">
          Signed in as landlord ·{" "}
          <Link href="/login" className="font-semibold text-teal-700 underline">
            Log out
          </Link>
        </p>
      </div>

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <MonthNav month={month} today={today} onMonthChange={setMonth} onSelect={setSelected} />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 text-sm text-stone-700">
              Building
              <select
                className="h-11 rounded-lg border border-stone-400 bg-white px-3 text-sm text-stone-900"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
              >
                <option value="all">All buildings</option>
                {buildings.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              + Add event
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex-1">
            <MonthGrid
              month={month}
              today={today}
              selected={selected}
              onSelect={setSelected}
              entriesByDate={entriesByDate}
            />
          </div>

          <div className="w-full space-y-4 lg:w-70">
            <fieldset className="rounded-xl border border-stone-300 bg-white p-4">
              <legend className="px-1 text-sm font-semibold text-stone-900">Show on calendar</legend>
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-3 py-2 text-sm text-stone-800">
                  <input
                    type="checkbox"
                    className="size-4 accent-teal-700"
                    checked={shown.has(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                  {c.label}
                </label>
              ))}
            </fieldset>

            <div className="rounded-xl border border-stone-300 bg-white p-4">
              <h3 className="text-lg font-semibold text-stone-900">
                {selected.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(",", "")}
              </h3>
              <div className="mt-2 space-y-3">
                {selectedEntries.length === 0 && (
                  <p className="text-sm text-stone-500">Nothing planned for this day.</p>
                )}
                {selectedEntries.map((e) => (
                  <div key={e.id}>
                    <div className="text-sm font-semibold text-stone-900">{e.title}</div>
                    <div className="text-sm text-stone-600">
                      {e.detail}
                      {e.status && ` · ${statusText[e.status]}`}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-teal-700 px-3 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                >
                  Add event
                </button>
                <Link
                  href={`${base}/cleaning-schedule/new?date=${toISODate(selected)}`}
                  className="rounded-lg bg-teal-700 px-3 py-3 text-center text-sm font-semibold text-white hover:bg-teal-800"
                >
                  New task
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandlordCalendarPage() {
  return (
    <Suspense fallback={null}>
      <LandlordCalendarPageContent />
    </Suspense>
  );
}
