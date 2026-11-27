"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  getAdminMaintenanceRequests,
  updateAdminMaintenanceRequest,
  type MaintenanceRequestDTO,
  type MaintenanceStatus,
} from "@/app/actions/maintenance"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statuses: MaintenanceStatus[] = ["Submitted", "In progress", "Resolved"]

const line = "border-b border-solid border-sky-300"

const fieldStyle = [
  "w-full rounded-lg border border-sky-400 bg-white px-3 py-2 text-sm",
  "outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200",
].join(" ")

function formatSubmittedDate(isoString: string) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return isoString
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function AdminPage() {
  const params = useParams<{ "admin-id": string }>()
  const adminId = params["admin-id"]

  const [requests, setRequests] = useState<MaintenanceRequestDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [draftStatus, setDraftStatus] = useState<MaintenanceStatus>("Submitted")
  const [draftResponse, setDraftResponse] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saved, setSaved] = useState(false)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    try {
      const data = await getAdminMaintenanceRequests(adminId)
      setRequests(data.requests)
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Could not load maintenance requests.",
      )
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRequests(), 0)
    return () => window.clearTimeout(timer)
  }, [loadRequests])

  const selected = requests.find((r) => r.id === selectedId) ?? null

  const counts = {
    Submitted: requests.filter((r) => r.status === "Submitted").length,
    "In progress": requests.filter((r) => r.status === "In progress").length,
    Resolved: requests.filter((r) => r.status === "Resolved").length,
  }

  function openRequest(r: MaintenanceRequestDTO) {
    setSelectedId(r.id)
    setDraftStatus(r.status)
    setDraftResponse(r.response)
    setSaveError("")
    setSaved(false)
  }

  async function saveUpdate() {
    if (selectedId === null) return
    setSaving(true)
    setSaveError("")
    setSaved(false)
    try {
      const updated = await updateAdminMaintenanceRequest(adminId, selectedId, {
        status: draftStatus,
        response: draftResponse,
      })
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedId ? updated : r)),
      )
      setDraftStatus(updated.status)
      setDraftResponse(updated.response)
      setSaved(true)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save update.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className={"flex items-center justify-between px-10 py-8 " + line}>
        <h1 className="text-2xl font-bold uppercase text-sky-900">
          {selected
            ? `Request #${selected.id.slice(0, 8)}`
            : "All maintenance requests"}
        </h1>

        {selected && (
          <Button
            variant="outline"
            onClick={() => setSelectedId(null)}
            className="h-12 rounded-2xl border-2 border-sky-400 px-6 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
          >
            ← All requests
          </Button>
        )}
      </div>

      {loadError && (
        <div className="px-10 py-4 text-sm text-red-600">{loadError}</div>
      )}

      {!selected && (
        <>
          <div className={"flex flex-wrap gap-6 px-10 py-6 " + line}>
            {statuses.map((s) => (
              <div
                key={s}
                className="flex w-48 flex-col items-center rounded-2xl border border-sky-400 px-6 py-4"
              >
                <span className="text-4xl font-light text-sky-900">
                  {counts[s]}
                </span>
                <span className="text-sm text-sky-700">{s}</span>
              </div>
            ))}
          </div>

          <div className={line}>
            <Table className="text-center">
              <TableHeader className="[&_tr]:border-b [&_tr]:border-sky-300">
                <TableRow className="hover:bg-transparent">
                  {["#", "Title", "Location", "Submitted", "Status"].map(
                    (h) => (
                      <TableHead
                        key={h}
                        className="h-16 text-center font-bold text-sky-900"
                      >
                        {h}
                      </TableHead>
                    ),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-sky-700">
                      Loading maintenance requests...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-sky-700">
                      There are no requests yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((r, index) => (
                    <TableRow
                      key={r.id}
                      onClick={() => openRequest(r)}
                      className={
                        "h-20 cursor-pointer hover:bg-sky-50/60 last:border-b-0 " +
                        line
                      }
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.location}</TableCell>
                      <TableCell>{formatSubmittedDate(r.submittedAt)}</TableCell>
                      <TableCell>
                        <span className="inline-block rounded-full border border-sky-400 px-6 py-2 text-sm text-sky-800">
                          {r.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {selected && (
        <div className="flex items-start gap-8 px-10 py-8">
          <div className="flex flex-1 flex-col gap-6 rounded-3xl border-2 border-sky-300 p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-sky-900">
                  {selected.title}
                </h2>
                <p className="mt-1 text-xs text-sky-700">
                  {selected.location} /{" "}
                  {selected.submittedBy?.name ?? "Unknown tenant"} / Submitted{" "}
                  {formatSubmittedDate(selected.submittedAt)}
                </p>
              </div>
              <span className="inline-block rounded-full border border-sky-400 px-6 py-2 text-sm text-sky-800">
                {selected.status}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-sky-900">
                Description
              </h3>
              <p className="whitespace-pre-wrap rounded-lg border border-sky-300 px-3 py-2 text-sm">
                {selected.description}
              </p>
            </div>

            {selected.hasPhoto && selected.photoUrl ? (
              <div className="overflow-hidden rounded-3xl border-2 border-sky-300 bg-sky-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.photoUrl}
                  alt={selected.title}
                  className="max-h-80 w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-3xl border-2 border-sky-300 bg-sky-50 text-sm font-semibold text-sky-700">
                NO PHOTO ATTACHED
              </div>
            )}
          </div>

          <div className="flex w-96 shrink-0 flex-col gap-5 rounded-3xl border-2 border-sky-300 p-6">
            <h2 className="text-center text-xl font-semibold text-sky-900">
              Update request
            </h2>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="status"
                className="text-sm font-semibold text-sky-900"
              >
                Status
              </label>
              <select
                id="status"
                value={draftStatus}
                onChange={(e) => {
                  setDraftStatus(e.target.value as MaintenanceStatus)
                  setSaved(false)
                }}
                className={fieldStyle}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="response"
                className="text-sm font-semibold text-sky-900"
              >
                Response to student
              </label>
              <textarea
                id="response"
                rows={5}
                placeholder="Write an update..."
                value={draftResponse}
                onChange={(e) => {
                  setDraftResponse(e.target.value)
                  setSaved(false)
                }}
                className={fieldStyle}
              />
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            {saved && <p className="text-sm text-green-600">Update saved.</p>}

            <div className="flex justify-center">
              <Button
                onClick={saveUpdate}
                disabled={saving}
                className="h-12 rounded-xl bg-sky-500 px-8 text-base text-white hover:bg-sky-600 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save update"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
