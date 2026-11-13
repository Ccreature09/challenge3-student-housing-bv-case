"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Status = "Submitted" | "In progress" | "Resolved"

type Request = {
  id: number
  title: string
  location: string
  tenant: string
  submitted: string
  description: string
  status: Status
  response: string
}

const statuses: Status[] = ["Submitted", "In progress", "Resolved"]

const line = "border-b border-solid border-sky-300"

const fieldStyle = [
  "w-full rounded-lg border border-sky-400 bg-white px-3 py-2 text-sm",
  "outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200",
].join(" ")

// Тестовые данные. Позже их нужно заменить на данные из базы или API
const initialRequests: Request[] = [
  {
    id: 213,
    title: "Loose cabinet door",
    location: "Kitchen",
    tenant: "V. L.",
    submitted: "5 Nov",
    description: "The door hangs off one hinge.",
    status: "In progress",
    response: "",
  },
  {
    id: 137,
    title: "Light out",
    location: "Hallway, 2nd floor",
    tenant: "A. K.",
    submitted: "8 Nov",
    description: "The light in the hallway does not turn on.",
    status: "Submitted",
    response: "",
  },
  {
    id: 98,
    title: "Leaking tap",
    location: "Bathroom",
    tenant: "M. S.",
    submitted: "1 Nov",
    description: "The tap drips all the time.",
    status: "Resolved",
    response: "Fixed on 3 Nov.",
  },
]

export default function AdminPage() {
  const [requests, setRequests] = useState<Request[]>(initialRequests)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Черновик формы обновления
  const [draftStatus, setDraftStatus] = useState<Status>("Submitted")
  const [draftResponse, setDraftResponse] = useState("")
  const [saved, setSaved] = useState(false)

  const selected = requests.find((r) => r.id === selectedId) ?? null

  const counts = {
    Submitted: requests.filter((r) => r.status === "Submitted").length,
    "In progress": requests.filter((r) => r.status === "In progress").length,
    Resolved: requests.filter((r) => r.status === "Resolved").length,
  }

  function openRequest(r: Request) {
    setSelectedId(r.id)
    setDraftStatus(r.status)
    setDraftResponse(r.response)
    setSaved(false)
  }

  function saveUpdate() {
    if (selectedId === null) return
    setRequests(
      requests.map((r) =>
        r.id === selectedId ? { ...r, status: draftStatus, response: draftResponse.trim() } : r
      )
    )
    setSaved(true)
  }

  return (
    <div>
      {/* Шапка */}
      <div className={"flex items-center justify-between px-10 py-8 " + line}>
        <h1 className="text-2xl font-bold uppercase text-sky-900">
          {selected ? "Request #" + selected.id : "All maintenance requests"}
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

      {/* Экран 1: список заявок */}
      {!selected && (
        <>
          <div className={"flex flex-wrap gap-6 px-10 py-6 " + line}>
            {statuses.map((s) => (
              <div
                key={s}
                className="flex w-48 flex-col items-center rounded-2xl border border-sky-400 px-6 py-4"
              >
                <span className="text-4xl font-light text-sky-900">{counts[s]}</span>
                <span className="text-sm text-sky-700">{s}</span>
              </div>
            ))}
          </div>

          <div className={line}>
            <Table className="text-center">
              <TableHeader className="[&_tr]:border-b [&_tr]:border-sky-300">
                <TableRow className="hover:bg-transparent">
                  {["#", "Title", "Location", "Submitted", "Status"].map((h) => (
                    <TableHead key={h} className="h-16 text-center font-bold text-sky-900">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-sky-700">
                      There are no requests yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((r) => (
                    <TableRow
                      key={r.id}
                      onClick={() => openRequest(r)}
                      className={"h-20 cursor-pointer hover:bg-sky-50/60 last:border-b-0 " + line}
                    >
                      <TableCell>{r.id}</TableCell>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.location}</TableCell>
                      <TableCell>{r.submitted}</TableCell>
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

      {/* Экран 2: одна заявка */}
      {selected && (
        <div className="flex items-start gap-8 px-10 py-8">
          {/* Левая карточка: информация о заявке */}
          <div className="flex flex-1 flex-col gap-6 rounded-3xl border-2 border-sky-300 p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-sky-900">{selected.title}</h2>
                <p className="mt-1 text-xs text-sky-700">
                  {selected.location} / {selected.tenant} / Submitted {selected.submitted}
                </p>
              </div>
              <span className="inline-block rounded-full border border-sky-400 px-6 py-2 text-sm text-sky-800">
                {selected.status}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-sky-900">Description</h3>
              <p className="rounded-lg border border-sky-300 px-3 py-2 text-sm">
                {selected.description}
              </p>
            </div>

            <div className="flex h-56 items-center justify-center rounded-3xl border-2 border-sky-300 bg-sky-50 text-sm font-semibold text-sky-700">
              PHOTO
            </div>
          </div>

          {/* Правая карточка: обновление заявки */}
          <div className="flex w-96 shrink-0 flex-col gap-5 rounded-3xl border-2 border-sky-300 p-6">
            <h2 className="text-center text-xl font-semibold text-sky-900">Update request</h2>

            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="text-sm font-semibold text-sky-900">
                Status
              </label>
              <select
                id="status"
                value={draftStatus}
                onChange={(e) => {
                  setDraftStatus(e.target.value as Status)
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
              <label htmlFor="response" className="text-sm font-semibold text-sky-900">
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

            {saved && <p className="text-sm text-green-600">Update saved.</p>}

            <div className="flex justify-center">
              <Button
                onClick={saveUpdate}
                className="h-12 rounded-xl bg-sky-500 px-8 text-base text-white hover:bg-sky-600"
              >
                Save update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}