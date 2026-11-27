"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  createCleaningTasks,
  deleteCleaningTask,
  getHouseCleaningData,
} from "@/app/actions/cleaning";
import { CleaningTaskTable } from "@/components/cleaning-task-table";
import { formatShortDate, parseISODate, toISODate } from "@/lib/cleaning-data";

type HouseData = Extract<
  Awaited<ReturnType<typeof getHouseCleaningData>>,
  { ok: true }
>["data"];
type Repeat = "none" | "weekly" | "biweekly" | "monthly";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40";
const labelClass = "mb-2 block text-sm font-semibold text-foreground";
const PREVIEW_COUNT = 4;

function addRepeat(date: Date, repeat: Repeat, times: number) {
  const result = new Date(date);
  if (repeat === "weekly") result.setDate(result.getDate() + 7 * times);
  if (repeat === "biweekly") result.setDate(result.getDate() + 14 * times);
  if (repeat === "monthly") {
    const day = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + times);
    result.setDate(
      Math.min(
        day,
        new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate(),
      ),
    );
  }
  return result;
}

function NewCleaningTaskForm() {
  const params = useParams<{ "admin-id": string; "house-id": string }>();
  const adminId = params["admin-id"];
  const houseId = params["house-id"];
  const listUrl = `/admin-dashboard/${adminId}/houses/${houseId}`;
  const [data, setData] = useState<HouseData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [areaId, setAreaId] = useState("");
  const [newArea, setNewArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [floor, setFloor] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [firstDue, setFirstDue] = useState(toISODate(new Date()));
  const [repeat, setRepeat] = useState<Repeat>("weekly");
  const [mode, setMode] = useState<"rotate" | "fixed">("rotate");
  const [fixedRoomId, setFixedRoomId] = useState("");

  const loadData = useCallback(async () => {
    const result = await getHouseCleaningData(adminId, houseId);
    if (result.ok) {
      setData(result.data);
      setError("");
      setFixedRoomId((current) =>
        result.data.rooms.some((room) => room.id === current)
          ? current
          : (result.data.rooms[0]?.id ?? ""),
      );
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [adminId, houseId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const areasInHouse = useMemo(() => data?.areas ?? [], [data?.areas]);
  const roomsInHouse = useMemo(() => data?.rooms ?? [], [data?.rooms]);
  const preview = useMemo(() => {
    if (!firstDue || roomsInHouse.length === 0) return [];
    const start = parseISODate(firstDue);
    const count = repeat === "none" ? 1 : PREVIEW_COUNT;
    return Array.from({ length: count }, (_, occurrence) => ({
      date: addRepeat(start, repeat, occurrence),
      room:
        mode === "rotate"
          ? roomsInHouse[occurrence % roomsInHouse.length]?.label
          : roomsInHouse.find((room) => room.id === fixedRoomId)?.label,
    }));
  }, [firstDue, repeat, mode, fixedRoomId, roomsInHouse]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const result = await createCleaningTasks(adminId, houseId, {
      areaId: newArea ? undefined : areaId,
      newAreaName: newArea ? newAreaName : undefined,
      floor: newArea ? floor : undefined,
      title,
      description,
      firstDue,
      repeat,
      mode,
      fixedRoomId: mode === "fixed" ? fixedRoomId : undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(
      result.data === 1
        ? "The cleaning task was created."
        : `${result.data} cleaning assignments were created.`,
    );
    setTitle("");
    setDescription("");
    setNewArea(false);
    setNewAreaName("");
    setAreaId("");
    await loadData(); // a newly added shared space appears in the list
  }

  return (
    <div className="flex-1 bg-muted/40">
      <div className="flex items-center gap-4 border-b bg-card px-6 py-4">
        <Link
          href={listUrl}
          aria-label="Back to accommodation"
          className="rounded-lg p-2 text-foreground hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Cleaning schedule
          </h2>
          {data && <p className="text-sm text-muted-foreground">{data.houseName}</p>}
        </div>
      </div>

      {data && (
        <section aria-labelledby="schedule-heading" className="space-y-4 p-6">
          <h3 id="schedule-heading" className="text-lg font-semibold text-foreground">
            Schedule
          </h3>
          <CleaningTaskTable
            tasks={data.tasks}
            actions={(task) => (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm(`Delete "${task.title}" due ${formatShortDate(parseISODate(task.dueDate))}?`)) return;
                  const result = await deleteCleaningTask(adminId, houseId, task.id);
                  if (!result.ok) setError(result.error);
                  await loadData();
                }}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          />
        </section>
      )}

      <h3 className="px-6 text-lg font-semibold text-foreground">Plan a new task</h3>
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 rounded-xl border border-input bg-card p-6 lg:max-w-2xl"
        >
          <h3 className="text-lg font-semibold text-foreground">
            New cleaning task
          </h3>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          {success && (
            <p
              role="status"
              className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
            >
              {success}
            </p>
          )}
          {loading && (
            <p className="text-sm text-muted-foreground">
              Loading shared spaces and rooms…
            </p>
          )}
          {!loading && data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="area" className={labelClass}>
                    Shared space
                  </label>
                  <select
                    id="area"
                    className={fieldClass}
                    value={newArea ? "new" : areaId}
                    onChange={(event) => {
                      setNewArea(event.target.value === "new");
                      setAreaId(
                        event.target.value === "new" ? "" : event.target.value,
                      );
                      const area = areasInHouse.find(
                        (item) => item.id === event.target.value,
                      );
                      setTitle(area ? `Clean ${area.name.toLowerCase()}` : "");
                    }}
                  >
                    <option value="">Select a shared space</option>
                    {areasInHouse.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name} · Floor {area.floor}
                      </option>
                    ))}
                    <option value="new">+ Add a shared space</option>
                  </select>
                </div>
              </div>

              {newArea && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="area-name" className={labelClass}>
                      Shared-space name
                    </label>
                    <input
                      id="area-name"
                      required
                      maxLength={100}
                      className={fieldClass}
                      value={newAreaName}
                      onChange={(event) => setNewAreaName(event.target.value)}
                      placeholder="Kitchen"
                    />
                  </div>
                  <div>
                    <label htmlFor="floor" className={labelClass}>
                      Floor
                    </label>
                    <input
                      id="floor"
                      required
                      type="number"
                      step="1"
                      className={fieldClass}
                      value={floor}
                      onChange={(event) => setFloor(Number(event.target.value))}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="title" className={labelClass}>
                  Title
                </label>
                <input
                  id="title"
                  required
                  maxLength={150}
                  className={fieldClass}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="description" className={labelClass}>
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  maxLength={2000}
                  placeholder="Describe the cleaning work to complete."
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
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
                    onChange={(event) => setFirstDue(event.target.value)}
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
                    onChange={(event) =>
                      setRepeat(event.target.value as Repeat)
                    }
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
                  <label className="flex items-center gap-3 py-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="mode"
                      className="size-4 accent-primary"
                      checked={mode === "rotate"}
                      onChange={() => setMode("rotate")}
                    />
                    Rotate between rooms with active tenants
                  </label>
                  <label className="flex items-center gap-3 py-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="mode"
                      className="size-4 accent-primary"
                      checked={mode === "fixed"}
                      onChange={() => setMode("fixed")}
                    />
                    Always the same room
                  </label>
                  {mode === "fixed" && (
                    <select
                      aria-label="Room"
                      className={`${fieldClass} ml-7 max-w-xs`}
                      value={fixedRoomId}
                      onChange={(event) => setFixedRoomId(event.target.value)}
                    >
                      {roomsInHouse.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {roomsInHouse.length === 0 && (
                    <p className="py-2 text-sm text-orange-800">
                      There are no tenants with active contracts in this house.
                    </p>
                  )}
                </div>
              </fieldset>

              <div className="flex items-center justify-end gap-6 pt-2">
                <Link
                  href={listUrl}
                  className="text-sm font-semibold text-foreground underline"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || roomsInHouse.length === 0}
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Creating…" : "Create task"}
                </button>
              </div>
            </>
          )}
        </form>

        <aside className="w-full rounded-xl border border-input bg-card p-5 lg:w-85">
          <h3 className="text-base font-semibold text-foreground">
            Preview: next assignments
          </h3>
          <p className="mt-2 text-xs text-muted-foreground">
            {mode === "rotate"
              ? "Assignments rotate through rooms with active tenants."
              : "The selected room is assigned every time."}
          </p>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {preview.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                Choose a due date. The house needs rooms with active tenants.
              </li>
            )}
            {preview.map((item, index) => (
              <li
                key={index}
                className="flex justify-between px-4 py-3 text-sm text-foreground"
              >
                <span>{formatShortDate(item.date)}</span>
                <span
                  className={index === 0 ? "font-semibold text-foreground" : ""}
                >
                  {item.room}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-accent px-4 py-3 text-xs text-accent-foreground">
            Repeating schedules create the four assignments shown in this
            preview.
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
