import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

type Status = "Submitted" | "In progress" | "Resolved"

type MaintenanceRequest = {
  id: number
  title: string
  location: string
  tenant: string
  submitted: string
  description: string
  status: Status
  response: string
}

const STATUSES: Status[] = ["Submitted", "In progress", "Resolved"]
const FILE = path.join(process.cwd(), "data", "requests.json")

// --- работа с файлом ---
async function load(): Promise<MaintenanceRequest[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf-8"))
  } catch {
    return [] // файла ещё нет
  }
}

async function save(items: MaintenanceRequest[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(items, null, 2))
}

// --- GET /api/requests: получить все заявки ---
export async function GET() {
  return NextResponse.json(await load())
}

// --- POST /api/requests: создать заявку ---
export async function POST(req: Request) {
  const body = await req.json()

  if (!body.title || !body.description) {
    return NextResponse.json(
      { error: "title and description are required" },
      { status: 400 }
    )
  }

  const items = await load()
  const newItem: MaintenanceRequest = {
    id: items.length ? Math.max(...items.map((r) => r.id)) + 1 : 1,
    title: String(body.title),
    location: String(body.location ?? ""),
    tenant: String(body.tenant ?? ""),
    submitted: new Date().toISOString().slice(0, 10),
    description: String(body.description),
    status: "Submitted",
    response: "",
  }

  items.push(newItem)
  await save(items)
  return NextResponse.json(newItem, { status: 201 })
}

// --- PATCH /api/requests: изменить статус и ответ ---
// В теле запроса: { id, status, response }
export async function PATCH(req: Request) {
  const body = await req.json()

  if (!STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const items = await load()
  const item = items.find((r) => r.id === Number(body.id))
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  item.status = body.status
  item.response = String(body.response ?? "").trim()
  await save(items)
  return NextResponse.json(item)
}