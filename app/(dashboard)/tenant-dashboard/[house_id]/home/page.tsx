"use client";

import { Suspense, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { BedDouble, Megaphone, Users, Wrench } from "lucide-react";
import { getTenantHome, listHouseAnnouncements, listHousemates } from "@/app/actions/tenant";
import type { Priority } from "@/app/actions/announcements";
import { Modal } from "@/components/admin/modal";
import { ModuleCard } from "@/components/admin/module-card";
import { formatDate, useActionData } from "@/components/admin/use-action";

const priorityBadge: Record<Priority, string> = {
  low: "bg-stone-100 text-stone-700",
  normal: "bg-sky-100 text-sky-900",
  high: "bg-red-100 text-red-800",
};

function TenantHome() {
  const houseId = useParams<{ house_id: string }>().house_id;
  const base = `/tenant-dashboard/${houseId}`;
  const load = useCallback(() => getTenantHome(houseId), [houseId]);
  const { data: home, error, loading } = useActionData(load);
  const [popup, setPopup] = useState<"housemates" | "announcements" | null>(null);

  return (
    <main className="flex-1">
      <div className="border-b border-sky-300 px-8 py-6">
        <p className="text-xs font-semibold tracking-widest text-sky-700 uppercase">My house</p>
        <h1 className="text-2xl font-bold text-sky-900">{home ? home.houseName : loading ? "Loading…" : "My house"}</h1>
        {home && (
          <p className="text-sm text-stone-600">
            {home.postalCode} {home.city} · Welcome, {home.firstName}. You live in room {home.roomNumber}.
          </p>
        )}
      </div>

      {error && !home && (
        <p role="alert" className="m-8 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {home && (
        <div className="flex flex-wrap justify-center gap-6 px-8 py-10">
          <ModuleCard
            label="My space"
            title="My room"
            description="Your room details and repair requests for your room."
            icon={BedDouble}
            badge={`Room ${home.roomNumber}`}
            href={`${base}/room`}
          />
          <ModuleCard
            label="People"
            title="Housemates"
            description="Who lives in which room in your house."
            icon={Users}
            badge={`${home.counts.housemates} housemates`}
            onClick={() => setPopup("housemates")}
          />
          <ModuleCard
            label="Repairs"
            title="Maintenance"
            description="Report and follow problems in shared areas such as the kitchen."
            icon={Wrench}
            badge={`${home.counts.openMaintenance} open`}
            href={`${base}/maintenance`}
          />
          <ModuleCard
            label="Information"
            title="Announcements"
            description="News and notices from the housing office for your house."
            icon={Megaphone}
            badge={`${home.counts.announcements} posted`}
            onClick={() => setPopup("announcements")}
          />
        </div>
      )}

      <Modal open={popup === "housemates"} onClose={() => setPopup(null)} title="Housemates" size="md">
        {popup === "housemates" && <Housemates houseId={houseId} />}
      </Modal>
      <Modal open={popup === "announcements"} onClose={() => setPopup(null)} title="Announcements" size="lg">
        {popup === "announcements" && <Announcements houseId={houseId} />}
      </Modal>
    </main>
  );
}

function Housemates({ houseId }: { houseId: string }) {
  const load = useCallback(() => listHousemates(houseId), [houseId]);
  const { data, error, loading } = useActionData(load);
  if (loading) return <p className="text-sm text-stone-600">Loading housemates…</p>;
  if (!data) return <p role="alert" className="text-sm text-red-700">{error}</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs font-semibold text-sky-900">
        <tr className="border-b border-sky-200">
          <th className="py-2">Room</th>
          <th className="py-2">Name</th>
        </tr>
      </thead>
      <tbody>
        {data.map((mate) => (
          <tr key={mate.id} className="border-b border-sky-100">
            <td className="py-2 text-stone-700">Room {mate.roomNumber}</td>
            <td className="py-2 font-medium text-stone-900">
              {mate.firstName} {mate.lastName}
              {mate.isMe && <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-900">You</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Announcements({ houseId }: { houseId: string }) {
  const load = useCallback(() => listHouseAnnouncements(houseId), [houseId]);
  const { data, error, loading } = useActionData(load);
  if (loading) return <p className="text-sm text-stone-600">Loading announcements…</p>;
  if (!data) return <p role="alert" className="text-sm text-red-700">{error}</p>;
  if (data.length === 0) return <p className="text-sm text-stone-500">There are no announcements for your house.</p>;
  return (
    <ul className="space-y-3">
      {data.map((row) => (
        <li key={row.id} className="rounded-xl border border-sky-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-stone-900">{row.title}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${priorityBadge[row.priority]}`}>
              {row.priority}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {formatDate(row.createdAt)}
            {row.author ? ` · ${row.author}` : ""}
          </p>
          <p className="mt-2 text-sm whitespace-pre-line text-stone-700">{row.description}</p>
        </li>
      ))}
    </ul>
  );
}

export default function TenantHomePage() {
  return (
    <Suspense fallback={null}>
      <TenantHome />
    </Suspense>
  );
}
