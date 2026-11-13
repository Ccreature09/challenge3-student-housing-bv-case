"use client"

import { useRef, useState } from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Status = "Submitted" | "In progress" | "Resolved"
type Filter = "All" | Status
type View = "requests" | "report"

type Request = {
  id: number
  title: string
  location: string
  submitted: string
  status: Status
}

// Чтобы увидеть примеры из макета, замени [] ниже на этот список:
// [
//   { id: 137, title: "Light out", location: "Hallway, 2nd floor", submitted: "8 Nov", status: "Submitted" },
//   { id: 213, title: "Loose cabinet door", location: "Kitchen", submitted: "5 Nov", status: "In progress" },
// ]

const filters: Filter[] = ["All", "Submitted", "In progress", "Resolved"]

// Двойная линия как на макете
const doubleLine = "border-b-4 border-double border-sky-300"

const fieldStyle = [
  "w-full rounded-lg border border-sky-400 bg-white px-3 py-2 text-sm",
  "outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200",
].join(" ")

const filterOn = [
  "rounded-full border-sky-500 px-6 uppercase",
  "bg-sky-500 text-white hover:bg-sky-600 hover:text-white",
].join(" ")

const filterOff = [
  "rounded-full border-sky-400 px-6 uppercase",
  "text-sky-700 hover:bg-sky-50 hover:text-sky-800",
].join(" ")

export default function MaintenancePage() {
  // Какой экран показан: таблица или форма
  const [view, setView] = useState<View>("requests")

  // Данные таблицы
  const [requests, setRequests] = useState<Request[]>([])
  const [filter, setFilter] = useState<Filter>("All")
  const shown = filter === "All" ? requests : requests.filter((r) => r.status === filter)

  // Данные формы
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [error, setError] = useState("")

  function resetForm() {
    setTitle("")
    setLocation("")
    setDescription("")
    setPhoto(null)
    setError("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const missing: string[] = []
    if (!title.trim()) missing.push("Title")
    if (!location.trim()) missing.push("Location")
    if (!description.trim()) missing.push("Description")

    if (missing.length > 0) {
      setError("Please fill in: " + missing.join(", "))
      return
    }

    // TODO: здесь позже отправим данные в базу (title, location, description, photo)
    const newRequest: Request = {
      id: Math.max(0, ...requests.map((r) => r.id)) + 1,
      title: title.trim(),
      location: location.trim(),
      submitted: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      status: "Submitted",
    }

    setRequests([newRequest, ...requests])
    resetForm()
    setFilter("All")
    setView("requests")
  }

  return (
    <div>
      {/* ВЕРХНЯЯ ПОЛОСА: заголовок | кнопка */}
      <div className={"flex " + doubleLine}>
        <div className="flex w-[36%] items-center justify-center border-r-4 border-double border-sky-300 px-8 py-10">
          <h1 className="text-2xl font-bold uppercase text-sky-900">
            {view === "requests" ? "My requests" : "Report a problem"}
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-end px-10 py-6">
          {view === "requests" ? (
            <Button
              variant="outline"
              onClick={() => setView("report")}
              className="h-16 rounded-2xl border-2 border-sky-400 px-8 text-lg text-sky-700 hover:bg-sky-50 hover:text-sky-800"
            >
              + new request
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setView("requests")
              }}
              className="h-16 rounded-2xl border-2 border-sky-400 px-8 text-lg text-sky-700 hover:bg-sky-50 hover:text-sky-800"
            >
              ← My requests
            </Button>
          )}
        </div>
      </div>

      {/* ЭКРАН 1: фильтры и таблица */}
      {view === "requests" && (
        <>
          <div className={"flex flex-wrap gap-4 px-6 py-5 " + doubleLine}>
            {filters.map((f) => (
              <Button
                key={f}
                variant="outline"
                onClick={() => setFilter(f)}
                className={filter === f ? filterOn : filterOff}
              >
                {f}
              </Button>
            ))}
          </div>

          <div className={doubleLine}>
            <Table className="text-center">
              <TableHeader>
                <TableRow className={doubleLine + " hover:bg-transparent"}>
                  {["#", "Title", "Location", "Submitted", "Status"].map((h) => (
                    <TableHead key={h} className="h-16 text-center font-bold text-sky-900">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-sky-700">
                      {requests.length === 0
                        ? "You have no requests yet. Press + new request to report a problem."
                        : "No requests with this status."}
                    </TableCell>
                  </TableRow>
                ) : (
                  shown.map((r) => (
                    <TableRow key={r.id} className={"h-20 hover:bg-sky-50/60 " + doubleLine}>
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

      {/* ЭКРАН 2: форма «Report a problem» */}
      {view === "report" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-10 py-8">
          <div className="flex max-w-xl flex-col gap-2">
            <label htmlFor="title" className="text-sm font-semibold text-sky-900">
              Title <span className="text-red-500">*</span>
            </label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldStyle} />
          </div>

          <div className="flex max-w-xl flex-col gap-2">
            <label htmlFor="location" className="text-sm font-semibold text-sky-900">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Room 12, Kitchen, Hallway 2nd floor"
              className={fieldStyle}
            />
          </div>

          <div className="flex max-w-xl flex-col gap-2">
            <label htmlFor="description" className="text-sm font-semibold text-sky-900">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldStyle}
            />
          </div>

          <div className="flex max-w-xl items-center gap-5 rounded-3xl border-2 border-sky-300 bg-sky-50 p-6">
            <Camera className="size-16 shrink-0 text-sky-400" strokeWidth={1.5} />
            <div className="flex flex-col items-start gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                className="border-sky-400 text-sky-700 hover:bg-sky-100 hover:text-sky-800"
                onClick={() => fileRef.current?.click()}
              >
                Add photo
              </Button>
              <span className="text-xs text-sky-700">{photo ? photo.name : "Optional"}</span>
            </div>
          </div>

          {error && <p className="max-w-xl text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <Button
              type="submit"
              className="h-12 rounded-xl bg-sky-500 px-8 text-base text-white hover:bg-sky-600"
            >
              Submit request
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}