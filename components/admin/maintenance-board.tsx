"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { MaintenanceRequestDTO, MaintenanceStatus } from "@/app/actions/maintenance";
import type { ActionResult } from "@/lib/action-result";
import { DataTable, type Column } from "@/components/admin/data-table";
import { formatDate, useActionData } from "@/components/admin/use-action";

const statuses: MaintenanceStatus[] = ["Submitted", "In progress", "Resolved"];

const line = "border-b border-solid border-border";
const fieldStyle =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

export const statusPill: Record<MaintenanceStatus, string> = {
  Submitted: "bg-amber-100 text-amber-900",
  "In progress": "bg-sky-100 text-primary",
  Resolved: "bg-green-100 text-green-800",
};

/**
 * The landlord's view of maintenance requests submitted by tenants: counts per
 * status, a searchable list, and a detail view to update status, reply or delete.
 * Landlords cannot create requests here. Callbacks must be stable (useCallback).
 */
export function MaintenanceBoard({
  title,
  load,
  onUpdate,
  onDelete,
  showHouse = false,
  backHref,
  backLabel,
}: {
  title: (scopeTitle: string | null) => string;
  load: () => Promise<ActionResult<{ scopeTitle: string | null; requests: MaintenanceRequestDTO[] }>>;
  onUpdate: (requestId: string, input: { status: string; response: string }) => Promise<ActionResult>;
  onDelete: (requestId: string) => Promise<ActionResult>;
  showHouse?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  const { data, error, loading, reload } = useActionData(load);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const requests = data?.requests ?? [];
  const selected = requests.find((request) => request.id === selectedId) ?? null;
  const counts = Object.fromEntries(
    statuses.map((status) => [status, requests.filter((request) => request.status === status).length]),
  ) as Record<MaintenanceStatus, number>;

  const columns: Column<MaintenanceRequestDTO>[] = [
    { key: "title", header: "Title", render: (row) => <span className="font-medium">{row.title}</span>, sortValue: (row) => row.title },
    ...(showHouse
      ? [{
          key: "house",
          header: "House",
          render: (row: MaintenanceRequestDTO) => row.houseName ?? "—",
          sortValue: (row: MaintenanceRequestDTO) => row.houseName,
        }]
      : []),
    {
      key: "place",
      header: "Where",
      render: (row) => (
        <>
          {row.roomNumber !== null ? `Room ${row.roomNumber}` : "Shared space"}
          <div className="text-xs text-muted-foreground">{row.location}</div>
        </>
      ),
      sortValue: (row) => row.roomNumber ?? -1,
    },
    { key: "by", header: "Tenant", render: (row) => row.submittedBy?.name ?? "—", sortValue: (row) => row.submittedBy?.name ?? null },
    { key: "submitted", header: "Submitted", render: (row) => formatDate(row.submittedAt), sortValue: (row) => row.submittedAt },
    {
      key: "status",
      header: "Status",
      render: (row) => <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill[row.status]}`}>{row.status}</span>,
      sortValue: (row) => statuses.indexOf(row.status),
    },
  ];

  async function remove(request: MaintenanceRequestDTO) {
    if (!window.confirm(`Delete the request "${request.title}"? This cannot be undone.`)) return;
    const result = await onDelete(request.id);
    if (!result.ok) return window.alert(result.error);
    setSelectedId(null);
    await reload();
  }

  return (
    <div className="flex-1">
      <div className={`flex items-center justify-between gap-4 px-8 py-6 ${line}`}>
        <div className="flex items-center gap-3">
          {selected ? (
            <button type="button" onClick={() => setSelectedId(null)} aria-label="Back to all requests" className="rounded-lg p-2 text-primary hover:bg-accent">
              <ChevronLeft className="size-5" />
            </button>
          ) : (
            backHref && (
              <Link href={backHref} aria-label={backLabel} className="rounded-lg p-2 text-primary hover:bg-accent">
                <ChevronLeft className="size-5" />
              </Link>
            )
          )}
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Maintenance requests from tenants</p>
            <h1 className="text-2xl font-bold text-primary">{selected ? selected.title : title(data?.scopeTitle ?? null)}</h1>
          </div>
        </div>
      </div>

      {loading && <p className="px-8 py-6 text-sm text-muted-foreground">Loading requests…</p>}
      {error && (
        <p role="alert" className="mx-8 my-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {data && !selected && (
        <>
          <div className={`flex flex-wrap gap-4 px-8 py-6 ${line}`}>
            {statuses.map((status) => (
              <div key={status} className="flex w-44 flex-col items-center rounded-2xl border border-border bg-card px-6 py-4">
                <span className="text-4xl font-light text-primary">{counts[status]}</span>
                <span className="text-sm text-muted-foreground">{status}</span>
              </div>
            ))}
          </div>
          <div className="px-8 py-6">
            <DataTable
              rows={requests}
              rowKey={(row) => row.id}
              columns={columns}
              searchText={(row) =>
                `${row.title} ${row.location} ${row.description} ${row.submittedBy?.name ?? ""} ${row.houseName ?? ""}`
              }
              searchPlaceholder="Search requests"
              filters={[
                {
                  key: "status",
                  label: "Status",
                  options: statuses.map((status) => ({ value: status, label: status })),
                  matches: (row, value) => row.status === value,
                },
                {
                  key: "place",
                  label: "Where",
                  options: [
                    { value: "room", label: "Rooms" },
                    { value: "shared", label: "Shared spaces" },
                  ],
                  matches: (row, value) => (value === "room") === (row.roomId !== null),
                },
              ]}
              onRowClick={(row) => setSelectedId(row.id)}
              rowLabel={(row) => `Open request ${row.title}`}
              emptyText="No tenant has reported a problem here yet."
            />
          </div>
        </>
      )}

      {selected && (
        <div className="flex flex-col items-start gap-8 px-8 py-8 lg:flex-row">
          <div className="flex w-full flex-1 flex-col gap-6 rounded-3xl border-2 border-border bg-card p-8">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                {selected.houseName ? `${selected.houseName} / ` : ""}
                {selected.roomNumber !== null ? `Room ${selected.roomNumber}` : "Shared space"} / {selected.location} /{" "}
                {selected.submittedBy?.name ?? "Unknown"} / Submitted {formatDate(selected.submittedAt)}
                {selected.resolvedAt ? ` / Resolved ${formatDate(selected.resolvedAt)}` : ""}
              </p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-primary">Description</h2>
              <p className="rounded-lg border border-border px-3 py-2 text-sm whitespace-pre-line">{selected.description}</p>
            </div>
            {selected.photoUrl && (
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.photoUrl} alt={`Photo for ${selected.title}`} className="max-h-96 w-full object-contain" />
              </div>
            )}
            <button
              type="button"
              onClick={() => void remove(selected)}
              className="self-start rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Delete request
            </button>
          </div>

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
        </div>
      )}
    </div>
  );
}

function UpdateRequestForm({
  request,
  onSave,
}: {
  request: MaintenanceRequestDTO;
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
    setMessage(error ? { ok: false, text: error } : { ok: true, text: "Update saved. The tenant can see it now." });
  }

  return (
    <form onSubmit={save} className="flex w-full shrink-0 flex-col gap-5 rounded-3xl border-2 border-border bg-card p-6 lg:w-96">
      <h2 className="text-center text-xl font-semibold text-primary">Update request</h2>
      <label className="flex flex-col gap-2 text-sm font-semibold">
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
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Response to tenant
        <textarea
          rows={5}
          maxLength={2000}
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
      <button type="submit" disabled={saving} className="h-11 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {saving ? "Saving…" : "Save update"}
      </button>
    </form>
  );
}
