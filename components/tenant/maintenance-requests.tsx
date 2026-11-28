"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ChevronLeft, Lightbulb } from "lucide-react";
import {
  createMaintenanceRequest,
  deleteTenantMaintenanceRequest,
  getTenantMaintenanceRequests,
  type MaintenanceFilter,
  type MaintenanceScope,
} from "@/app/actions/maintenance";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { statusPill } from "@/components/admin/maintenance-board";
import { formatDate, useActionData } from "@/components/admin/use-action";

// Vlad's tenant maintenance page, shared by the "shared spaces" and "my room" views.

const filters: MaintenanceFilter[] = ["All", "Submitted", "In progress", "Resolved"];
const line = "border-b border-solid border-border";
const fieldStyle =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

export function MaintenanceRequests({ houseId, scope }: { houseId: string; scope: MaintenanceScope }) {
  const load = useCallback(() => getTenantMaintenanceRequests(houseId, scope), [houseId, scope]);
  const { data, error: loadError, loading, reload } = useActionData(load);
  const [view, setView] = useState<"requests" | "report">("requests");
  const [filter, setFilter] = useState<MaintenanceFilter>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requests = data?.requests ?? [];
  const shown = filter === "All" ? requests : requests.filter((r) => r.status === filter);
  const selected = requests.find((r) => r.id === selectedId) ?? null;
  const base = `/tenant-dashboard/${houseId}`;
  const place = scope === "room" ? `Room ${data?.roomNumber ?? ""}`.trim() : "Shared spaces";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("scope", scope);
    if (photo) formData.set("photo", photo);
    setSubmitting(true);
    setError("");
    const result = await createMaintenanceRequest(houseId, formData);
    setSubmitting(false);
    if (!result.ok) return setError(result.error);
    form.reset();
    setPhoto(null);
    setFilter("All");
    setView("requests");
    await reload();
  }

  async function cancelRequest(id: string) {
    if (!window.confirm("Cancel this request?")) return;
    const result = await deleteTenantMaintenanceRequest(houseId, id);
    if (!result.ok) return window.alert(result.error);
    setSelectedId(null);
    await reload();
  }

  return (
    <div className="flex-1">
      <div className={`flex flex-wrap items-center justify-between gap-4 px-8 py-6 ${line}`}>
        <div className="flex items-center gap-3">
          <Link
            href={scope === "room" ? `${base}/room` : `${base}/home`}
            aria-label={scope === "room" ? "Back to my room" : "Back to my house"}
            className="rounded-lg p-2 text-primary hover:bg-accent"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Maintenance · {place}
            </p>
            <h1 className="text-2xl font-bold text-primary">
              {view === "report" ? "Report a problem" : scope === "room" ? "Repairs in my room" : "Shared-space repairs"}
            </h1>
            {view === "requests" && (
              <p className="text-sm text-muted-foreground">
                {scope === "room"
                  ? "Problems reported for your room."
                  : "Problems in the kitchen, living room and other shared spaces, reported by anyone in your house."}
              </p>
            )}
          </div>
        </div>
        {view === "requests" ? (
          <Button onClick={() => { setSelectedId(null); setView("report"); }} className="h-11 rounded-xl px-6">
            + New request
          </Button>
        ) : (
          <Button variant="outline" onClick={() => { setError(""); setView("requests"); }} className="h-11 rounded-xl px-6">
            ← All requests
          </Button>
        )}
      </div>

      {loadError && <p role="alert" className="px-8 py-4 text-sm text-red-700">{loadError}</p>}

      {view === "requests" && (
        <>
          <div className={`flex flex-wrap gap-3 px-8 py-4 ${line}`}>
            {filters.map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                onClick={() => { setFilter(f); setSelectedId(null); }}
                className="rounded-full px-5"
              >
                {f}
              </Button>
            ))}
          </div>
          <div className={`px-8 py-4 ${line}`}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {["Title", "Location", "Reported by", "Submitted", "Status"].map((h) => (
                    <TableHead key={h} className="font-bold text-primary">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="h-16 text-muted-foreground">Loading requests…</TableCell></TableRow>
                ) : shown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-16 text-muted-foreground">
                      {requests.length === 0 ? "No requests yet. Press + New request to report a problem." : "No requests with this status."}
                    </TableCell>
                  </TableRow>
                ) : (
                  shown.map((r) => (
                    <TableRow
                      key={r.id}
                      tabIndex={0}
                      onClick={() => setSelectedId((prev) => (prev === r.id ? null : r.id))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") setSelectedId((prev) => (prev === r.id ? null : r.id));
                      }}
                      aria-selected={selectedId === r.id}
                      className="h-14 cursor-pointer"
                    >
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.location}</TableCell>
                      <TableCell>{r.mine ? "You" : r.submittedBy?.name ?? "—"}</TableCell>
                      <TableCell>{formatDate(r.submittedAt)}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill[r.status]}`}>{r.status}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {selected && (
            <div className="mx-8 my-6 flex flex-col gap-4 rounded-3xl border-2 border-border bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-primary">{selected.title}</h2>
                <div className="flex gap-2">
                  {selected.mine && selected.status === "Submitted" && (
                    <Button variant="destructive" onClick={() => void cancelRequest(selected.id)}>Cancel request</Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm">{selected.description}</p>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Response from the housing office</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {selected.response || "No response yet."}
                </p>
              </div>
              {selected.photoUrl && (
                <div className="overflow-hidden rounded-2xl border border-border bg-background">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.photoUrl} alt={`Photo for ${selected.title}`} className="max-h-72 w-full object-contain" />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {view === "report" && (
        <form onSubmit={handleSubmit} className="flex flex-col items-start gap-10 px-8 py-8 lg:flex-row">
          <div className="flex w-full max-w-xl flex-col gap-6">
            <p className="rounded-lg bg-accent px-4 py-2 text-sm">
              This request is for <strong>{scope === "room" ? `your room (${place})` : "a shared space in your house"}</strong>.
            </p>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Title <span className="sr-only">(required)</span>
              <input name="title" required maxLength={150} className={`${fieldStyle} font-normal`} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Location
              <input
                name="location"
                required
                maxLength={150}
                defaultValue={scope === "room" ? place : ""}
                placeholder={scope === "room" ? "e.g. Window, radiator" : "e.g. Kitchen, living room, stairs"}
                className={`${fieldStyle} font-normal`}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Description
              <textarea name="description" required rows={4} maxLength={4000} className={`${fieldStyle} font-normal`} />
            </label>

            <div className="flex items-center gap-5 rounded-3xl border-2 border-border bg-accent/50 p-6">
              <Camera className="size-14 shrink-0 text-primary/60" strokeWidth={1.5} aria-hidden />
              <div className="flex flex-col items-start gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  {photo ? "Change photo" : "Add photo"}
                </Button>
                <span className="text-xs text-muted-foreground">{photo ? photo.name : "Optional, up to 5 MB"}</span>
              </div>
            </div>

            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting} className="h-11 rounded-xl px-8">
                {submitting ? "Submitting…" : "Submit request"}
              </Button>
            </div>
          </div>

          <div className="flex w-full max-w-xs items-start gap-3 rounded-2xl border border-border bg-accent/50 p-4 text-sm">
            <Lightbulb className="size-5 shrink-0 text-primary" aria-hidden />
            <p>
              <span className="font-semibold">Tip:</span> describe the problem as clearly as you can and mention the exact
              place. A photo helps us fix it faster.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
