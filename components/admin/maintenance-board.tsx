"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { MaintenanceRow, MaintenanceStatus } from "@/app/actions/maintenance";
import type { ActionResult } from "@/lib/action-result";
import { DataTable, type Column } from "@/components/admin/data-table";
import { formatDate, useActionData } from "@/components/admin/use-action";

const statuses: MaintenanceStatus[] = ["Submitted", "In progress", "Resolved"];

const line = "border-b border-solid border-sky-300";
const fieldStyle =
  "w-full rounded-lg border border-sky-400 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200";
const statusPill = "inline-block rounded-full border border-sky-400 px-4 py-1 text-sm text-sky-800";

type RequestInput = { title: string; location: string; description: string };

/**
 * Maintenance requests of one scope (a house's common areas or one room),
 * based on the original maintenance page design and backed by the database.
 * Admins pass onUpdate to change status and reply; tenants only submit and read.
 * The callbacks must be stable (useCallback), because load is refetched when it changes.
 */
export function MaintenanceBoard({
  load,
  onCreate,
  onUpdate,
  isRoom,
  backHref,
  backLabel,
}: {
  load: () => Promise<ActionResult<{ scopeTitle: string; requests: MaintenanceRow[] }>>;
  onCreate: (input: RequestInput) => Promise<ActionResult>;
  onUpdate?: (requestId: string, input: { status: string; response: string }) => Promise<ActionResult>;
  isRoom: boolean;
  backHref: string;
  backLabel: string;
}) {
  const { data, error, loading, reload } = useActionData(load);
  const roomId = isRoom ? "room" : null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const requests = data?.requests ?? [];
  const selected = requests.find((request) => request.id === selectedId) ?? null;
  const counts = Object.fromEntries(
    statuses.map((status) => [status, requests.filter((request) => request.status === status).length]),
  ) as Record<MaintenanceStatus, number>;

  const heading = selected
    ? selected.title
    : creating
      ? "Log a request"
      : `Maintenance · ${data?.scopeTitle ?? (roomId ? "Room" : "Common areas")}`;

  const columns: Column<MaintenanceRow>[] = [
    { key: "title", header: "Title", render: (row) => <span className="font-medium">{row.title}</span>, sortValue: (row) => row.title },
    { key: "location", header: "Location", render: (row) => row.location || "—", sortValue: (row) => row.location },
    { key: "by", header: "Submitted by", render: (row) => row.submittedBy ?? "—", sortValue: (row) => row.submittedBy },
    { key: "submitted", header: "Submitted", render: (row) => formatDate(row.createdAt), sortValue: (row) => row.createdAt },
    { key: "status", header: "Status", render: (row) => <span className={statusPill}>{row.status}</span>, sortValue: (row) => statuses.indexOf(row.status) },
  ];

  return (
    <div className="flex-1">
      <div className={`flex items-center justify-between gap-4 px-10 py-8 ${line}`}>
        <div className="flex items-center gap-3">
          {!selected && !creating && (
            <Link href={backHref} aria-label={backLabel} className="rounded-lg p-2 text-sky-900 hover:bg-sky-50">
              <ChevronLeft className="size-5" />
            </Link>
          )}
          <h1 className="text-2xl font-bold text-sky-900 uppercase">{heading}</h1>
        </div>
        {selected || creating ? (
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setCreating(false);
            }}
            className="h-12 rounded-2xl border-2 border-sky-400 px-6 text-sky-700 hover:bg-sky-50"
          >
            ← All requests
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="h-12 rounded-2xl border-2 border-sky-400 px-6 text-sky-700 hover:bg-sky-50"
          >
            + New request
          </button>
        )}
      </div>

      {loading && <p className="px-10 py-6 text-sm text-stone-600">Loading requests…</p>}
      {error && (
        <p role="alert" className="mx-10 my-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {data && !selected && !creating && (
        <>
          <div className={`flex flex-wrap gap-6 px-10 py-6 ${line}`}>
            {statuses.map((status) => (
              <div key={status} className="flex w-48 flex-col items-center rounded-2xl border border-sky-400 px-6 py-4">
                <span className="text-4xl font-light text-sky-900">{counts[status]}</span>
                <span className="text-sm text-sky-700">{status}</span>
              </div>
            ))}
          </div>
          <div className="px-10 py-6">
            <DataTable
              rows={requests}
              rowKey={(row) => row.id}
              columns={columns}
              searchText={(row) => `${row.title} ${row.location} ${row.description} ${row.submittedBy ?? ""}`}
              searchPlaceholder="Search requests"
              filters={[
                {
                  key: "status",
                  label: "Status",
                  options: statuses.map((status) => ({ value: status, label: status })),
                  matches: (row, value) => row.status === value,
                },
              ]}
              onRowClick={(row) => setSelectedId(row.id)}
              rowLabel={(row) => `Open request ${row.title}`}
              emptyText="There are no requests yet."
            />
          </div>
        </>
      )}

      {creating && (
        <NewRequestForm
          defaultLocation={roomId ? data?.scopeTitle ?? "" : ""}
          locationHint={roomId ? "e.g. Window, radiator" : "e.g. Kitchen, living room, stairs"}
          onSubmit={async (values) => {
            const result = await onCreate(values);
            if (!result.ok) return result.error;
            setCreating(false);
            await reload();
            return null;
          }}
        />
      )}

      {selected && (
        <div className="flex flex-col items-start gap-8 px-10 py-8 lg:flex-row">
          <div className="flex w-full flex-1 flex-col gap-6 rounded-3xl border-2 border-sky-300 p-8">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs text-sky-700">
                {selected.location || "No location"} / {selected.submittedBy ?? "Unknown"} / Submitted {formatDate(selected.createdAt)}
                {selected.resolvedAt ? ` / Resolved ${formatDate(selected.resolvedAt)}` : ""}
              </p>
              <span className={statusPill}>{selected.status}</span>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-sky-900">Description</h2>
              <p className="rounded-lg border border-sky-300 px-3 py-2 text-sm whitespace-pre-line">{selected.description}</p>
            </div>
            {selected.hasPhoto && (
              <p className="rounded-2xl border-2 border-sky-300 bg-sky-50 p-4 text-sm text-sky-700">A photo was attached to this request.</p>
            )}
          </div>

          {onUpdate ? (
            <UpdateRequestForm
              key={selected.id}
              request={selected}
              onSave={async (values) => {
                const result = await onUpdate(selected.id, values);
                if (!result.ok) return result.error;
                await reload();
                return null;
              }}
            />
          ) : (
            <div className="flex w-full shrink-0 flex-col gap-3 rounded-3xl border-2 border-sky-300 p-6 lg:w-96">
              <h2 className="text-center text-xl font-semibold text-sky-900">Response from the housing office</h2>
              <p className="rounded-lg border border-sky-300 px-3 py-2 text-sm whitespace-pre-line text-stone-800">
                {selected.response || "No response yet. You will see it here once the housing office replies."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UpdateRequestForm({
  request,
  onSave,
}: {
  request: MaintenanceRow;
  onSave: (values: { status: string; response: string }) => Promise<string | null>;
}) {
  const [status, setStatus] = useState<MaintenanceStatus>(request.status);
  const [response, setResponse] = useState(request.response);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const error = await onSave({ status, response });
    setSaving(false);
    setMessage(error ? { ok: false, text: error } : { ok: true, text: "Update saved." });
  }

  return (
    <form onSubmit={save} className="flex w-full shrink-0 flex-col gap-5 rounded-3xl border-2 border-sky-300 p-6 lg:w-96">
      <h2 className="text-center text-xl font-semibold text-sky-900">Update request</h2>
      <label className="flex flex-col gap-2 text-sm font-semibold text-sky-900">
        Status
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as MaintenanceStatus);
            setMessage(null);
          }}
          className={fieldStyle}
        >
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-sky-900">
        Response to tenant
        <textarea
          rows={5}
          maxLength={5000}
          placeholder="Write an update…"
          value={response}
          onChange={(event) => {
            setResponse(event.target.value);
            setMessage(null);
          }}
          className={`${fieldStyle} font-normal`}
        />
      </label>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
      <div className="flex justify-center">
        <button type="submit" disabled={saving} className="h-12 rounded-xl bg-sky-500 px-8 text-base text-white hover:bg-sky-600 disabled:opacity-50">
          {saving ? "Saving…" : "Save update"}
        </button>
      </div>
    </form>
  );
}

function NewRequestForm({
  defaultLocation,
  locationHint,
  onSubmit,
}: {
  defaultLocation: string;
  locationHint: string;
  onSubmit: (values: { title: string; location: string; description: string }) => Promise<string | null>;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    const message = await onSubmit({
      title: String(form.get("title")),
      location: String(form.get("location")),
      description: String(form.get("description")),
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-6 px-10 py-8">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <label className="flex flex-col gap-2 text-sm font-semibold text-sky-900">
        Title
        <input name="title" required maxLength={150} className={`${fieldStyle} font-normal`} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-sky-900">
        Location
        <input name="location" required maxLength={150} defaultValue={defaultLocation} placeholder={locationHint} className={`${fieldStyle} font-normal`} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-sky-900">
        Description
        <textarea name="description" required rows={4} maxLength={5000} className={`${fieldStyle} font-normal`} />
      </label>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="h-12 rounded-xl bg-sky-500 px-8 text-base text-white hover:bg-sky-600 disabled:opacity-50">
          {saving ? "Saving…" : "Submit request"}
        </button>
      </div>
    </form>
  );
}
