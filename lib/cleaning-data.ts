// Mock data for the landlord cleaning schedule and calendar.
// Replace with real data fetching once a backend exists.

export type CleaningStatus = "open" | "overdue" | "done";

export type SharedSpace = {
  id: string;
  building: string;
  name: string;
  floor: number;
  rooms: string[];
};

export type CleaningTask = {
  id: string;
  spaceId: string;
  title: string;
  room: string;
  /** ISO date, yyyy-mm-dd */
  due: string;
  status: CleaningStatus;
  note?: string;
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

export const buildings = ["Building A", "Building B"];

export const sharedSpaces: SharedSpace[] = [
  { id: "kitchen-2", building: "Building A", name: "Kitchen", floor: 2, rooms: ["Room 203", "Room 204", "Room 205", "Room 206"] },
  { id: "kitchen-1", building: "Building A", name: "Kitchen", floor: 1, rooms: ["Room 101", "Room 102", "Room 104", "Room 105"] },
  { id: "bathroom-1", building: "Building A", name: "Bathroom", floor: 1, rooms: ["Room 101", "Room 102", "Room 104"] },
  { id: "bathroom-2", building: "Building A", name: "Bathroom", floor: 2, rooms: ["Room 203", "Room 207", "Room 208"] },
  { id: "toilet-1", building: "Building A", name: "Toilet", floor: 1, rooms: ["Room 101", "Room 102"] },
  { id: "hallway-2", building: "Building A", name: "Hallway", floor: 2, rooms: ["Room 203", "Room 204", "Room 205", "Room 206", "Room 207", "Room 208"] },
  { id: "storage-0", building: "Building B", name: "Storage", floor: 0, rooms: ["Room 011", "Room 012", "Room 013"] },
  { id: "kitchen-b1", building: "Building B", name: "Kitchen", floor: 1, rooms: ["Room 111", "Room 112", "Room 113"] },
];

export function spaceById(id: string) {
  return sharedSpaces.find((s) => s.id === id);
}

export function spaceLabel(space: SharedSpace, short = false) {
  return short ? `${space.name} F${space.floor}` : `${space.name} · Floor ${space.floor}`;
}

export const cleaningTasks: CleaningTask[] = [
  { id: "t1", spaceId: "kitchen-2", title: "Clean kitchen", room: "Room 203", due: "2026-11-13", status: "open" },
  { id: "t2", spaceId: "bathroom-1", title: "Clean bathroom", room: "Room 104", due: "2026-11-13", status: "open" },
  { id: "t3", spaceId: "bathroom-2", title: "Clean bathroom", room: "Room 207", due: "2026-11-08", status: "overdue" },
  { id: "t4", spaceId: "toilet-1", title: "Clean toilet", room: "Room 101", due: "2026-11-07", status: "overdue" },
  { id: "t5", spaceId: "hallway-2", title: "Vacuum hallway", room: "Room 205", due: "2026-11-09", status: "open" },
  { id: "t6", spaceId: "storage-0", title: "Tidy storage", room: "Room 012", due: "2026-11-11", status: "open" },
  { id: "t7", spaceId: "kitchen-1", title: "Clean kitchen", room: "Room 105", due: "2026-11-06", status: "done", note: "All done, the fridge was emptied as well." },
  { id: "t8", spaceId: "kitchen-2", title: "Clean kitchen", room: "Room 204", due: "2026-11-20", status: "open" },
  { id: "t9", spaceId: "kitchen-2", title: "Clean kitchen", room: "Room 205", due: "2026-11-27", status: "open" },
  { id: "t10", spaceId: "kitchen-b1", title: "Clean kitchen", room: "Room 112", due: "2026-11-12", status: "open" },
  { id: "t11", spaceId: "bathroom-1", title: "Clean bathroom", room: "Room 102", due: "2026-11-06", status: "done" },
  { id: "t12", spaceId: "bathroom-2", title: "Clean bathroom", room: "Room 203", due: "2026-11-01", status: "done" },
  { id: "t13", spaceId: "toilet-1", title: "Clean toilet", room: "Room 102", due: "2026-11-03", status: "done" },
  { id: "t14", spaceId: "hallway-2", title: "Vacuum hallway", room: "Room 204", due: "2026-11-02", status: "done" },
  { id: "t15", spaceId: "storage-0", title: "Tidy storage", room: "Room 011", due: "2026-11-04", status: "done" },
  { id: "t16", spaceId: "kitchen-1", title: "Clean kitchen", room: "Room 104", due: "2026-11-05", status: "done" },
  { id: "t17", spaceId: "kitchen-b1", title: "Clean kitchen", room: "Room 111", due: "2026-11-05", status: "done", note: "Bin was already full on arrival." },
  { id: "t18", spaceId: "bathroom-1", title: "Clean bathroom", room: "Room 101", due: "2026-11-04", status: "done" },
  { id: "t19", spaceId: "toilet-1", title: "Clean toilet", room: "Room 101", due: "2026-11-05", status: "done" },
  { id: "t20", spaceId: "hallway-2", title: "Vacuum hallway", room: "Room 203", due: "2026-11-06", status: "done" },
  { id: "t21", spaceId: "kitchen-b1", title: "Clean kitchen", room: "Room 113", due: "2026-11-02", status: "done" },
  { id: "t22", spaceId: "storage-0", title: "Tidy storage", room: "Room 013", due: "2026-11-18", status: "open" },
  { id: "t23", spaceId: "toilet-1", title: "Clean toilet", room: "Room 102", due: "2026-11-14", status: "open" },
  { id: "t24", spaceId: "bathroom-1", title: "Clean bathroom", room: "Room 102", due: "2026-11-20", status: "open" },
  { id: "t25", spaceId: "hallway-2", title: "Vacuum hallway", room: "Room 203", due: "2026-11-23", status: "open" },
  { id: "t26", spaceId: "bathroom-2", title: "Clean bathroom", room: "Room 203", due: "2026-11-29", status: "open" },
  { id: "t27", spaceId: "kitchen-2", title: "Clean kitchen", room: "Room 206", due: "2026-12-04", status: "open" },
  { id: "t28", spaceId: "bathroom-2", title: "Clean bathroom", room: "Room 208", due: "2026-11-15", status: "open" },
  { id: "t29", spaceId: "hallway-2", title: "Vacuum hallway", room: "Room 206", due: "2026-11-16", status: "open" },
];

/** What a task involves, per type of shared space. */
export const taskDescriptions: Record<string, string> = {
  Kitchen: "Wipe counters and hob, clean the sink, clear out old items from the shared fridge and take out the kitchen bin.",
  Bathroom: "Clean the shower, sink and mirror, mop the floor and replace the bin bag.",
  Toilet: "Clean the toilet bowl and seat, wipe the sink and refill toilet paper.",
  Hallway: "Vacuum the hallway and stairs and wipe the light switches and door handles.",
  Storage: "Tidy shelves, throw out unlabelled items and sweep the floor.",
};

/** The signed-in tenant. Mock until authentication exists. */
export const currentTenant = { name: "Sam", room: "Room 203", building: "Building A" };

const otherEntries: CalendarEntry[] = [
  { id: "w1", date: "2026-11-10", category: "waste", label: "Waste pickup", title: "Waste pickup", detail: "Residual and plastic", building: "Building A" },
  { id: "w2", date: "2026-11-17", category: "waste", label: "Waste pickup", title: "Waste pickup", detail: "Residual and paper", building: "Building A" },
  { id: "w3", date: "2026-11-24", category: "waste", label: "Waste pickup", title: "Waste pickup", detail: "Residual and plastic", building: "Building A" },
  { id: "e1", date: "2026-11-14", category: "event", label: "BBQ 18:00", title: "Building BBQ", detail: "18:00 · Courtyard", building: "Building A" },
  { id: "m1", date: "2026-11-26", category: "maintenance", label: "Fire alarms", title: "Fire alarm test", detail: "Whole building · 10:00–12:00", building: "Building A" },
];

export function calendarEntries(): CalendarEntry[] {
  const cleaning: CalendarEntry[] = cleaningTasks.map((t) => {
    const space = spaceById(t.spaceId)!;
    return {
      id: t.id,
      date: t.due,
      category: "cleaning",
      label: spaceLabel(space, true),
      title: `${t.title} · Floor ${space.floor}`,
      detail: t.room,
      status: t.status,
      building: space.building,
    };
  });
  return [...cleaning, ...otherEntries];
}

// ---- date helpers ----

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

/** e.g. "Fri 13 Nov" */
export function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
