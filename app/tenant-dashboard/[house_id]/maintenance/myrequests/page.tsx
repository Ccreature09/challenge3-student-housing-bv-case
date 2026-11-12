"use client"

import { useState } from "react"
import Link from "next/link"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Status = "Submitted" | "In progress" | "Resolved"
type Filter = "All" | Status

const requests = [
  { id: 1, title: "Light out", location: "Hallway, 2nd floor", submitted: "8 Nov", status: "Submitted" as Status },
  { id: 2, title: "Loose cabinet door", location: "Kitchen", submitted: "5 Nov", status: "In progress" as Status },
  { id: 3, title: "Broken window", location: "Living room", submitted: "11 Nov", status: "Resolved" as Status },
]

const filters: Filter[] = ["All", "Submitted", "In progress", "Resolved"]

export default function Page() {
  const [filter, setFilter] = useState<Filter>("All")
  const shown = filter === "All" ? requests : requests.filter((r) => r.status === filter)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex border-b border-sky-300 bg-sky-50">
          <div className="flex w-1/2,5 items-center border-r border-sky-300 px-35 py-10">
          <SidebarTrigger className="absolute left-3 top-3" />  
            <h1 className="text-2xl font-bold uppercase text-sky-900">My requests</h1>
          </div>
          <div className="flex flex-1 items-center justify-end px-10 py-6">
            <Button asChild className="h-16 rounded-xl bg-sky-500 px-10 text-white text-xl hover:bg-sky-600"
            >
              <Link href="/maintenance/new">+ new request</Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 border-b-2 border-sky-200 px-6 py-5">
          {filters.map((f) => (
            <Button
              key={f}
              variant="outline"
              onClick={() => setFilter(f)}
              className={`rounded-full border-sky-400 px-6 uppercase ${
                filter === f
                  ? "bg-sky-500 text-white hover:bg-sky-600 hover:text-white"
                  : "text-sky-700 hover:bg-sky-50 hover:text-sky-800"
              }`}
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Таблица */}
        <Table className="text-center">
          <TableHeader>
            <TableRow className="border-b-2 border-sky-300 bg-sky-50 hover:bg-sky-50">
              {["#", "Title", "Location", "Submitted", "Status"].map((h) => (
                <TableHead key={h} className="h-14 text-center font-bold text-sky-900">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <TableRow key={r.id} className="h-20 border-b-2 border-sky-200 hover:bg-sky-50/60">
                <TableCell>{r.id}</TableCell>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.location}</TableCell>
                <TableCell>{r.submitted}</TableCell>
                <TableCell>
                  <span className="inline-block rounded-full border border-sky-400 bg-sky-100 px-6 py-2 text-sm text-sky-800">
                    {r.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SidebarInset>
    </SidebarProvider>
  )
}