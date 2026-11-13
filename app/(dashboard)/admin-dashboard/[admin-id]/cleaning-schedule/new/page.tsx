"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  buildings,
  formatShortDate,
  parseISODate,
  sharedSpaces,
  spaceById,
  spaceLabel,
  toISODate,
} from "@/lib/cleaning-data";

type Repeat = "none" | "weekly" | "biweekly" | "monthly";

const fieldClass =
  "h-11 w-full rounded-lg border border-stone-400 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/40";
const labelClass = "mb-2 block text-sm font-semibold text-stone-800";

const PREVIEW_COUNT = 4;

function addRepeat(date: Date, repeat: Repeat, times: number) {
  const d = new Date(date);
  if (repeat === "weekly") d.setDate(d.getDate() + 7 * times);
  if (repeat === "biweekly") d.setDate(d.getDate() + 14 * times);
  if (repeat === "monthly") d.setMonth(d.getMonth() + times);
  return d;
}

function NewCleaningTaskForm() {
  const params = useParams<{ "admin-id": string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const listUrl = `/admin-dashboard/${params["admin-id"]}/cleaning-schedule`;

  const initialSpace =
    spaceById(searchParams.get("space") ?? "") ?? sharedSpaces[0];
  const initialDate = searchParams.get("date") ?? toISODate(new Date());

  const [building, setBuilding] = useState(initialSpace.building);
  const [spaceId, setSpaceId] = useState(initialSpace.id);
  const [title, setTitle] = useState(
    `Clean ${initialSpace.name.toLowerCase()}`,
  );
  const [description, setDescription] = useState("");
  const [firstDue, setFirstDue] = useState(initialDate);
  const [repeat, setRepeat] = useState<Repeat>("weekly");
  const [mode, setMode] = useState<"rotate" | "fixed">("rotate");
  const [fixedRoom, setFixedRoom] = useState(initialSpace.rooms[0]);

  const spacesInBuilding = sharedSpaces.filter((s) => s.building === building);
  const space = spaceById(spaceId)!;

  function selectSpace(id: string) {
    const next = spaceById(id)!;
    setSpaceId(id);
    setFixedRoom(next.rooms[0]);
  }

  const preview = useMemo(() => {
    if (!firstDue) return [];
    const start = parseISODate(firstDue);
    const count = repeat === "none" ? 1 : PREVIEW_COUNT;
    return Array.from({ length: count }, (_, i) => ({
      date: addRepeat(start, repeat, i),
      room: mode === "rotate" ? space.rooms[i % space.rooms.length] : fixedRoom,
    }));
  }, [firstDue, repeat, mode, fixedRoom, space]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: persist the task once a backend is available.
    router.push(listUrl);
  }

  return (
    <div className="flex-1 bg-stone-100">
      <div className="flex items-center gap-4 border-b bg-white px-6 py-4">
        <Link
          href={listUrl}
          aria-label="Back to cleaning schedule"
          className="rounded-lg p-2 text-stone-900 hover:bg-stone-100"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h2 className="text-2xl font-semibold text-stone-900">
          New cleaning task
        </h2>
      </div>

      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 rounded-xl border border-stone-300 bg-white p-6 lg:max-w-2xl"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="building" className={labelClass}>
                Building
              </label>
              <select
                id="building"
                className={fieldClass}
                value={building}
                onChange={(e) => {
                  setBuilding(e.target.value);
                  selectSpace(
                    sharedSpaces.find((s) => s.building === e.target.value)!.id,
                  );
                }}
              >
                {buildings.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="space" className={labelClass}>
                Shared space
              </label>
              <select
                id="space"
                className={fieldClass}
                value={spaceId}
                onChange={(e) => selectSpace(e.target.value)}
              >
                {spacesInBuilding.map((s) => (
                  <option key={s.id} value={s.id}>
                    {spaceLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="title" className={labelClass}>
              Title
            </label>
            <input
              id="title"
              required
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Wipe counters and hob, clean the sink, clear out old items from the shared fridge and take out the kitchen bin."
              className="w-full rounded-lg border border-stone-400 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/40"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="due" className={labelClass}>
                First due date
              </label>
              <input
                id="due"
                type="date"
                required
                className={fieldClass}
                value={firstDue}
                onChange={(e) => setFirstDue(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="repeat" className={labelClass}>
                Repeat
              </label>
              <select
                id="repeat"
                className={fieldClass}
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as Repeat)}
              >
                <option value="none">Does not repeat</option>
                <option value="weekly">Every week</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Every month</option>
              </select>
            </div>
          </div>

          <fieldset>
            <legend className={labelClass}>Who cleans</legend>
            <div className="space-y-1">
              <label className="flex items-center gap-3 py-2 text-sm text-stone-800">
                <input
                  type="radio"
                  name="mode"
                  className="size-4 accent-teal-700"
                  checked={mode === "rotate"}
                  onChange={() => setMode("rotate")}
                />
                Rotate between the rooms that use this space
              </label>
              <label className="flex items-center gap-3 py-2 text-sm text-stone-800">
                <input
                  type="radio"
                  name="mode"
                  className="size-4 accent-teal-700"
                  checked={mode === "fixed"}
                  onChange={() => setMode("fixed")}
                />
                Always the same room
              </label>
              {mode === "fixed" && (
                <select
                  aria-label="Room"
                  className={`${fieldClass} ml-7 max-w-xs`}
                  value={fixedRoom}
                  onChange={(e) => setFixedRoom(e.target.value)}
                >
                  {space.rooms.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              )}
            </div>
          </fieldset>

          <div className="flex items-center justify-end gap-6 pt-2">
            <Link
              href={listUrl}
              className="text-sm font-semibold text-stone-800 underline"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Create task
            </button>
          </div>
        </form>

        <aside className="w-full rounded-xl border border-stone-300 bg-white p-5 lg:w-85">
          <h3 className="text-base font-semibold text-stone-900">
            Preview: next assignments
          </h3>
          <p className="mt-2 text-xs text-stone-600">
            {mode === "rotate"
              ? `Based on the rooms that use ${spaceLabel(space)}.`
              : `${fixedRoom} cleans ${spaceLabel(space)} every time.`}
          </p>
          <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200">
            {preview.length === 0 && (
              <li className="px-4 py-3 text-sm text-stone-500">
                Pick a first due date.
              </li>
            )}
            {preview.map((p, i) => (
              <li
                key={i}
                className="flex justify-between px-4 py-3 text-sm text-stone-800"
              >
                <span>{formatShortDate(p.date)}</span>
                <span className={i === 0 ? "font-semibold text-stone-900" : ""}>
                  {p.room}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-teal-50 px-4 py-3 text-xs text-teal-900">
            Each assignment also adds an entry to the tenants&apos; calendar and
            dashboard.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default function NewCleaningTaskPage() {
  return (
    <Suspense fallback={null}>
      <NewCleaningTaskForm />
    </Suspense>
  );
}
