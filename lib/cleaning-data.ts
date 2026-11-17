export type CleaningStatus = "open" | "overdue" | "done";

export type CleaningArea = {
  id: string;
  houseId: string;
  name: string;
  floor: number;
};

export type CleaningTask = {
  id: string;
  houseId: string;
  houseName: string;
  spaceId: string;
  spaceName: string;
  floor: number;
  roomId: string;
  room: string;
  title: string;
  description: string | null;
  due: string;
  status: CleaningStatus;
  note: string | null;
  remindedAt: string | null;
};

export type CalendarCategory = "cleaning" | "waste" | "event" | "maintenance";

export type CalendarEntry = {
  id: string;
  date: string;
  category: CalendarCategory;
  label: string;
  title: string;
  detail: string;
  status?: CleaningStatus;
  building: string;
};

const otherEntries: CalendarEntry[] = [
  { id: "w1", date: "2026-11-10", category: "waste", label: "Waste pickup", title: "Waste pickup", detail: "Residual and plastic", building: "Building A" },
  { id: "w2", date: "2026-11-17", category: "waste", label: "Waste pickup", title: "Waste pickup", detail: "Residual and paper", building: "Building A" },
  { id: "w3", date: "2026-11-24", category: "waste", label: "Waste pickup", title: "Waste pickup", detail: "Residual and plastic", building: "Building A" },
  { id: "e1", date: "2026-11-14", category: "event", label: "BBQ 18:00", title: "Building BBQ", detail: "18:00 · Courtyard", building: "Building A" },
  { id: "m1", date: "2026-11-26", category: "maintenance", label: "Fire alarms", title: "Fire alarm test", detail: "Whole building · 10:00–12:00", building: "Building A" },
];

export const taskDescriptions: Record<string, string> = {
  Kitchen: "Wipe counters and hob, clean the sink, clear out old items from the shared fridge and take out the kitchen bin.",
  Bathroom: "Clean the shower, sink and mirror, mop the floor and replace the bin bag.",
  Toilet: "Clean the toilet bowl and seat, wipe the sink and refill toilet paper.",
  Hallway: "Vacuum the hallway and stairs and wipe the light switches and door handles.",
  Storage: "Tidy shelves, throw out unlabelled items and sweep the floor.",
};

export function calendarEntries(tasks: CleaningTask[] = []): CalendarEntry[] {
  const cleaning: CalendarEntry[] = tasks.map((task) => ({
    id: task.id,
    date: task.due,
    category: "cleaning",
    label: `${task.spaceName} F${task.floor}`,
    title: `${task.title} · Floor ${task.floor}`,
    detail: task.room,
    status: task.status,
    building: task.houseName,
  }));
  return [...cleaning, ...otherEntries];
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
