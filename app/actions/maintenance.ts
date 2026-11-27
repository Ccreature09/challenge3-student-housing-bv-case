"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { getAuthenticatedProfile } from "@/lib/server-auth";
import {
  houses,
  maintenanceOrComplaints,
  roomAssignments,
  rooms,
  users,
} from "@/supabase/migrations/schema";

export type MaintenanceStatus = "Submitted" | "In progress" | "Resolved";
export type MaintenanceFilter = "All" | MaintenanceStatus;

export type MaintenanceRequestDTO = {
  id: string;
  title: string;
  location: string;
  description: string;
  status: MaintenanceStatus;
  response: string;
  submittedAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
  hasPhoto: boolean;
  photoUrl: string | null;
  submittedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  houseId: string | null;
  houseName: string | null;
  roomNumber: number | null;
};

export type AdminMaintenanceOverview = {
  requests: MaintenanceRequestDTO[];
  counts: Record<MaintenanceStatus, number> & { total: number };
  houses: { id: string; name: string }[];
};

export type CreateMaintenanceInput = {
  title: string;
  location: string;
  description: string;
  photo?: {
    base64: string;
    mimeType?: string;
  } | null;
};

export type UpdateMaintenanceInput = {
  status: MaintenanceStatus;
  response?: string;
};

const MAINTENANCE_TYPE = "maintenance";
const VALID_STATUSES: readonly MaintenanceStatus[] = [
  "Submitted",
  "In progress",
  "Resolved",
];
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LOCATION_PREFIX = "Location: ";
const RESPONSE_MARKER = "\n\n[Admin response]: ";

function assertUuid(value: string, label: string) {
  if (!value || !UUID_REGEX.test(value)) {
    throw new Error(`Invalid ${label} identifier.`);
  }
}

function normalizeStatus(rawStatus: string | null): MaintenanceStatus {
  if (rawStatus && VALID_STATUSES.includes(rawStatus as MaintenanceStatus)) {
    return rawStatus as MaintenanceStatus;
  }
  return "Submitted";
}

function formatHouseLabel(house: {
  street: string | null;
  houseNumber: string;
  city: string | null;
}) {
  const streetPart = [house.street, house.houseNumber].filter(Boolean).join(" ");
  return [streetPart, house.city].filter(Boolean).join(", ");
}

function encodeDescription(
  location: string,
  body: string,
  response: string,
): string {
  const cleanLocation = location.trim();
  const cleanBody = body.trim();
  const cleanResponse = response.trim();

  const withLocation = cleanLocation
    ? `${LOCATION_PREFIX}${cleanLocation}\n\n${cleanBody}`
    : cleanBody;

  return cleanResponse
    ? `${withLocation}${RESPONSE_MARKER}${cleanResponse}`
    : withLocation;
}

function decodeDescription(rawDescription: string | null): {
  location: string;
  body: string;
  response: string;
} {
  const raw = rawDescription ?? "";
  let mainPart = raw;
  let response = "";

  const markerIndex = raw.lastIndexOf(RESPONSE_MARKER);
  if (markerIndex !== -1) {
    mainPart = raw.slice(0, markerIndex);
    response = raw.slice(markerIndex + RESPONSE_MARKER.length).trim();
  }

  let location = "";
  let body = mainPart;

  if (mainPart.startsWith(LOCATION_PREFIX)) {
    const splitIndex = mainPart.indexOf("\n\n");
    if (splitIndex !== -1) {
      location = mainPart.slice(LOCATION_PREFIX.length, splitIndex).trim();
      body = mainPart.slice(splitIndex + 2).trim();
    } else {
      location = mainPart.slice(LOCATION_PREFIX.length).trim();
      body = "";
    }
  }

  return { location, body: body.trim(), response };
}

async function authorizeAdmin(adminId: string) {
  assertUuid(adminId, "admin");
  const profile = await getAuthenticatedProfile();
  if (profile.role !== "admin") {
    throw new Error("Only admins can manage maintenance requests.");
  }
  if (adminId !== profile.id) {
    throw new Error("This admin dashboard does not belong to your account.");
  }
  return profile;
}

async function authorizeTenantInHouse(houseId: string) {
  assertUuid(houseId, "house");
  const profile = await getAuthenticatedProfile();
  if (profile.role !== "tenant") {
    throw new Error("Only tenants can access tenant maintenance requests.");
  }

  const [assignment] = await db
    .select({
      roomId: rooms.id,
      roomNumber: rooms.roomNumber,
      houseId: houses.id,
      street: houses.street,
      houseNumber: houses.houseNumber,
      city: houses.city,
    })
    .from(roomAssignments)
    .innerJoin(rooms, eq(roomAssignments.roomId, rooms.id))
    .innerJoin(houses, eq(rooms.houseId, houses.id))
    .where(
      and(
        eq(roomAssignments.studentId, profile.id),
        eq(rooms.houseId, houseId),
        sql`${roomAssignments.startDate} <= CURRENT_DATE`,
        or(
          sql`${roomAssignments.endDate} IS NULL`,
          sql`${roomAssignments.endDate} >= CURRENT_DATE`,
        ),
      ),
    )
    .limit(1);

  if (!assignment) {
    throw new Error("You do not have an active room assignment in this house.");
  }

  return { profile, assignment };
}

type TenantLocationInfo = {
  houseId: string;
  houseName: string;
  roomNumber: number;
};

async function getTenantLocationMap(
  studentIds: string[],
): Promise<Map<string, TenantLocationInfo>> {
  const map = new Map<string, TenantLocationInfo>();
  if (studentIds.length === 0) return map;

  const rows = await db
    .select({
      studentId: roomAssignments.studentId,
      houseId: houses.id,
      street: houses.street,
      houseNumber: houses.houseNumber,
      city: houses.city,
      roomNumber: rooms.roomNumber,
      startDate: roomAssignments.startDate,
      endDate: roomAssignments.endDate,
    })
    .from(roomAssignments)
    .innerJoin(rooms, eq(roomAssignments.roomId, rooms.id))
    .innerJoin(houses, eq(rooms.houseId, houses.id))
    .where(inArray(roomAssignments.studentId, studentIds))
    .orderBy(desc(roomAssignments.startDate));

  for (const row of rows) {
    if (!map.has(row.studentId)) {
      map.set(row.studentId, {
        houseId: row.houseId,
        houseName: formatHouseLabel(row),
        roomNumber: row.roomNumber,
      });
    }
  }

  return map;
}

function buildMaintenanceDTO(
  row: {
    id: string;
    title: string | null;
    description: string | null;
    status: string | null;
    createdAt: string;
    updatedAt: string | null;
    resolvedAt: string | null;
    submittedBy: string | null;
    hasPhoto: boolean;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  },
  locationInfo: TenantLocationInfo | undefined,
): MaintenanceRequestDTO {
  const parsed = decodeDescription(row.description);
  const fallbackLocation = locationInfo
    ? `${locationInfo.houseName} - Room ${String(locationInfo.roomNumber).padStart(3, "0")}`
    : "Unspecified";

  const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();

  return {
    id: row.id,
    title: row.title?.trim() || "Untitled request",
    location: parsed.location || fallbackLocation,
    description: parsed.body,
    status: normalizeStatus(row.status),
    response: parsed.response,
    submittedAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt,
    hasPhoto: row.hasPhoto,
    photoUrl: row.hasPhoto ? `/api/maintenance/${row.id}/photo` : null,
    submittedBy: row.submittedBy
      ? {
          id: row.submittedBy,
          name: fullName || row.email || "Unknown tenant",
          email: row.email ?? "",
        }
      : null,
    houseId: locationInfo?.houseId ?? null,
    houseName: locationInfo?.houseName ?? null,
    roomNumber: locationInfo?.roomNumber ?? null,
  };
}

async function parsePhotoBuffer(
  input: CreateMaintenanceInput | FormData,
): Promise<Buffer | null> {
  if (input instanceof FormData) {
    const file = input.get("photo");
    if (!file || !(file instanceof File) || file.size === 0) {
      return null;
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      throw new Error("Photo must be a JPEG, PNG, WebP, or GIF image.");
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error("Photo must be 5 MB or smaller.");
    }
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  if (!input.photo?.base64) {
    return null;
  }

  if (
    input.photo.mimeType &&
    !ALLOWED_IMAGE_MIME_TYPES.has(input.photo.mimeType)
  ) {
    throw new Error("Photo must be a JPEG, PNG, WebP, or GIF image.");
  }

  const base64Data = input.photo.base64.includes(",")
    ? input.photo.base64.split(",")[1]
    : input.photo.base64;

  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.byteLength === 0) {
    return null;
  }
  if (buffer.byteLength > MAX_PHOTO_BYTES) {
    throw new Error("Photo must be 5 MB or smaller.");
  }
  return buffer;
}

function extractCreateFields(input: CreateMaintenanceInput | FormData) {
  const rawTitle =
    input instanceof FormData ? input.get("title") : input.title;
  const rawLocation =
    input instanceof FormData ? input.get("location") : input.location;
  const rawDescription =
    input instanceof FormData ? input.get("description") : input.description;

  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const location = typeof rawLocation === "string" ? rawLocation.trim() : "";
  const description =
    typeof rawDescription === "string" ? rawDescription.trim() : "";

  if (!title || title.length > 200) {
    throw new Error("Enter a title between 1 and 200 characters.");
  }
  if (!location || location.length > 200) {
    throw new Error("Enter a location between 1 and 200 characters.");
  }
  if (!description || description.length > 4000) {
    throw new Error("Enter a description between 1 and 4000 characters.");
  }

  return { title, location, description };
}

// ---------------------------------------------------------------------------
// Tenant Maintenance & Repairs Actions
// ---------------------------------------------------------------------------

export async function getTenantMaintenanceRequests(
  houseId: string,
  statusFilter: MaintenanceFilter = "All",
): Promise<MaintenanceRequestDTO[]> {
  const { profile, assignment } = await authorizeTenantInHouse(houseId);

  const conditions = [
    eq(maintenanceOrComplaints.type, MAINTENANCE_TYPE),
    eq(maintenanceOrComplaints.submittedBy, profile.id),
  ];

  if (statusFilter !== "All") {
    if (!VALID_STATUSES.includes(statusFilter)) {
      throw new Error("Invalid status filter.");
    }
    conditions.push(eq(maintenanceOrComplaints.status, statusFilter));
  }

  const rows = await db
    .select({
      id: maintenanceOrComplaints.id,
      title: maintenanceOrComplaints.title,
      description: maintenanceOrComplaints.description,
      status: maintenanceOrComplaints.status,
      createdAt: maintenanceOrComplaints.createdAt,
      updatedAt: maintenanceOrComplaints.updatedAt,
      resolvedAt: maintenanceOrComplaints.resolvedAt,
      submittedBy: maintenanceOrComplaints.submittedBy,
      hasPhoto: sql<boolean>`${maintenanceOrComplaints.photo} IS NOT NULL`,
    })
    .from(maintenanceOrComplaints)
    .where(and(...conditions))
    .orderBy(desc(maintenanceOrComplaints.createdAt));

  const locationInfo: TenantLocationInfo = {
    houseId: assignment.houseId,
    houseName: formatHouseLabel(assignment),
    roomNumber: assignment.roomNumber,
  };

  return rows.map((row) =>
    buildMaintenanceDTO(
      {
        ...row,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      },
      locationInfo,
    ),
  );
}

export async function getTenantMaintenanceRequestById(
  houseId: string,
  requestId: string,
): Promise<MaintenanceRequestDTO> {
  assertUuid(requestId, "request");
  const { profile, assignment } = await authorizeTenantInHouse(houseId);

  const [row] = await db
    .select({
      id: maintenanceOrComplaints.id,
      title: maintenanceOrComplaints.title,
      description: maintenanceOrComplaints.description,
      status: maintenanceOrComplaints.status,
      createdAt: maintenanceOrComplaints.createdAt,
      updatedAt: maintenanceOrComplaints.updatedAt,
      resolvedAt: maintenanceOrComplaints.resolvedAt,
      submittedBy: maintenanceOrComplaints.submittedBy,
      hasPhoto: sql<boolean>`${maintenanceOrComplaints.photo} IS NOT NULL`,
    })
    .from(maintenanceOrComplaints)
    .where(
      and(
        eq(maintenanceOrComplaints.id, requestId),
        eq(maintenanceOrComplaints.type, MAINTENANCE_TYPE),
        eq(maintenanceOrComplaints.submittedBy, profile.id),
      ),
    )
    .limit(1);

  if (!row) {
    throw new Error("Maintenance request not found.");
  }

  return buildMaintenanceDTO(
    {
      ...row,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
    },
    {
      houseId: assignment.houseId,
      houseName: formatHouseLabel(assignment),
      roomNumber: assignment.roomNumber,
    },
  );
}

export async function createMaintenanceRequest(
  houseId: string,
  input: CreateMaintenanceInput | FormData,
): Promise<MaintenanceRequestDTO> {
  const { profile, assignment } = await authorizeTenantInHouse(houseId);
  const { title, location, description } = extractCreateFields(input);
  const photoBuffer = await parsePhotoBuffer(input);
  const now = new Date().toISOString();

  const [created] = await db
    .insert(maintenanceOrComplaints)
    .values({
      title,
      description: encodeDescription(location, description, ""),
      photo: photoBuffer,
      status: "Submitted",
      type: MAINTENANCE_TYPE,
      submittedBy: profile.id,
      updatedAt: now,
      resolvedAt: null,
    })
    .returning({
      id: maintenanceOrComplaints.id,
      title: maintenanceOrComplaints.title,
      description: maintenanceOrComplaints.description,
      status: maintenanceOrComplaints.status,
      createdAt: maintenanceOrComplaints.createdAt,
      updatedAt: maintenanceOrComplaints.updatedAt,
      resolvedAt: maintenanceOrComplaints.resolvedAt,
      submittedBy: maintenanceOrComplaints.submittedBy,
      hasPhoto: sql<boolean>`${maintenanceOrComplaints.photo} IS NOT NULL`,
    });

  revalidatePath(`/tenant-dashboard/${houseId}/maintenance`);

  return buildMaintenanceDTO(
    {
      ...created,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
    },
    {
      houseId: assignment.houseId,
      houseName: formatHouseLabel(assignment),
      roomNumber: assignment.roomNumber,
    },
  );
}

export async function deleteTenantMaintenanceRequest(
  houseId: string,
  requestId: string,
): Promise<{ id: string }> {
  assertUuid(requestId, "request");
  const { profile } = await authorizeTenantInHouse(houseId);

  const [existing] = await db
    .select({
      id: maintenanceOrComplaints.id,
      status: maintenanceOrComplaints.status,
    })
    .from(maintenanceOrComplaints)
    .where(
      and(
        eq(maintenanceOrComplaints.id, requestId),
        eq(maintenanceOrComplaints.type, MAINTENANCE_TYPE),
        eq(maintenanceOrComplaints.submittedBy, profile.id),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error("Maintenance request not found.");
  }

  if (normalizeStatus(existing.status) !== "Submitted") {
    throw new Error(
      "Only requests with status 'Submitted' can be cancelled by a tenant.",
    );
  }

  await db
    .delete(maintenanceOrComplaints)
    .where(
      and(
        eq(maintenanceOrComplaints.id, requestId),
        eq(maintenanceOrComplaints.type, MAINTENANCE_TYPE),
        eq(maintenanceOrComplaints.submittedBy, profile.id),
      ),
    );

  revalidatePath(`/tenant-dashboard/${houseId}/maintenance`);
  return { id: requestId };
}

// ---------------------------------------------------------------------------
// Admin Maintenance & Repairs Actions
// ---------------------------------------------------------------------------

export async function getAdminMaintenanceRequests(
  adminId: string,
  options?: { status?: MaintenanceFilter; houseId?: string },
): Promise<AdminMaintenanceOverview> {
  await authorizeAdmin(adminId);

  const statusFilter = options?.status ?? "All";
  if (statusFilter !== "All" && !VALID_STATUSES.includes(statusFilter)) {
    throw new Error("Invalid status filter.");
  }

  if (options?.houseId) {
    assertUuid(options.houseId, "house");
  }

  const [rows, houseRows] = await Promise.all([
    db
      .select({
        id: maintenanceOrComplaints.id,
        title: maintenanceOrComplaints.title,
        description: maintenanceOrComplaints.description,
        status: maintenanceOrComplaints.status,
        createdAt: maintenanceOrComplaints.createdAt,
        updatedAt: maintenanceOrComplaints.updatedAt,
        resolvedAt: maintenanceOrComplaints.resolvedAt,
        submittedBy: maintenanceOrComplaints.submittedBy,
        hasPhoto: sql<boolean>`${maintenanceOrComplaints.photo} IS NOT NULL`,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(maintenanceOrComplaints)
      .leftJoin(users, eq(maintenanceOrComplaints.submittedBy, users.id))
      .where(eq(maintenanceOrComplaints.type, MAINTENANCE_TYPE))
      .orderBy(desc(maintenanceOrComplaints.createdAt)),
    db.select().from(houses),
  ]);

  const submitterIds = [
    ...new Set(
      rows
        .map((row) => row.submittedBy)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const locationMap = await getTenantLocationMap(submitterIds);

  const allDtos = rows.map((row) =>
    buildMaintenanceDTO(
      row,
      row.submittedBy ? locationMap.get(row.submittedBy) : undefined,
    ),
  );

  const houseFiltered = options?.houseId
    ? allDtos.filter((dto) => dto.houseId === options.houseId)
    : allDtos;

  const counts = {
    Submitted: houseFiltered.filter((r) => r.status === "Submitted").length,
    "In progress": houseFiltered.filter((r) => r.status === "In progress")
      .length,
    Resolved: houseFiltered.filter((r) => r.status === "Resolved").length,
    total: houseFiltered.length,
  };

  const requests =
    statusFilter === "All"
      ? houseFiltered
      : houseFiltered.filter((r) => r.status === statusFilter);

  return {
    requests,
    counts,
    houses: houseRows.map((house) => ({
      id: house.id,
      name: formatHouseLabel(house),
    })),
  };
}

export async function getAdminMaintenanceRequestById(
  adminId: string,
  requestId: string,
): Promise<MaintenanceRequestDTO> {
  await authorizeAdmin(adminId);
  assertUuid(requestId, "request");

  const [row] = await db
    .select({
      id: maintenanceOrComplaints.id,
      title: maintenanceOrComplaints.title,
      description: maintenanceOrComplaints.description,
      status: maintenanceOrComplaints.status,
      createdAt: maintenanceOrComplaints.createdAt,
      updatedAt: maintenanceOrComplaints.updatedAt,
      resolvedAt: maintenanceOrComplaints.resolvedAt,
      submittedBy: maintenanceOrComplaints.submittedBy,
      hasPhoto: sql<boolean>`${maintenanceOrComplaints.photo} IS NOT NULL`,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(maintenanceOrComplaints)
    .leftJoin(users, eq(maintenanceOrComplaints.submittedBy, users.id))
    .where(
      and(
        eq(maintenanceOrComplaints.id, requestId),
        eq(maintenanceOrComplaints.type, MAINTENANCE_TYPE),
      ),
    )
    .limit(1);

  if (!row) {
    throw new Error("Maintenance request not found.");
  }

  const locationMap = row.submittedBy
    ? await getTenantLocationMap([row.submittedBy])
    : new Map<string, TenantLocationInfo>();

  return buildMaintenanceDTO(
    row,
    row.submittedBy ? locationMap.get(row.submittedBy) : undefined,
  );
}

export async function updateAdminMaintenanceRequest(
  adminId: string,
  requestId: string,
  input: UpdateMaintenanceInput,
): Promise<MaintenanceRequestDTO> {
  await authorizeAdmin(adminId);
  assertUuid(requestId, "request");

  if (!VALID_STATUSES.includes(input.status)) {
    throw new Error("Choose a valid status: Submitted, In progress, or Resolved.");
  }

  if (input.response !== undefined && input.response.length > 2000) {
    throw new Error("Response must be 2000 characters or fewer.");
  }

  const [existing] = await db
    .select({
      id: maintenanceOrComplaints.id,
      description: maintenanceOrComplaints.description,
      submittedBy: maintenanceOrComplaints.submittedBy,
    })
    .from(maintenanceOrComplaints)
    .where(
      and(
        eq(maintenanceOrComplaints.id, requestId),
        eq(maintenanceOrComplaints.type, MAINTENANCE_TYPE),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error("Maintenance request not found.");
  }

  const parsed = decodeDescription(existing.description);
  const nextResponse =
    input.response !== undefined ? input.response.trim() : parsed.response;
  const nextDescription = encodeDescription(
    parsed.location,
    parsed.body,
    nextResponse,
  );

  const now = new Date().toISOString();
  const resolvedAt = input.status === "Resolved" ? now : null;

  await db
    .update(maintenanceOrComplaints)
    .set({
      status: input.status,
      description: nextDescription,
      updatedAt: now,
      resolvedAt,
    })
    .where(
      and(
        eq(maintenanceOrComplaints.id, requestId),
        eq(maintenanceOrComplaints.type, MAINTENANCE_TYPE),
      ),
    );

  revalidatePath(`/admin-dashboard/${adminId}/maintenance`);

  return getAdminMaintenanceRequestById(adminId, requestId);
}

export async function deleteAdminMaintenanceRequest(
  adminId: string,
  requestId: string,
): Promise<{ id: string }> {
  await authorizeAdmin(adminId);
  assertUuid(requestId, "request");

  const deleted = await db
    .delete(maintenanceOrComplaints)
    .where(
      and(
        eq(maintenanceOrComplaints.id, requestId),
        eq(maintenanceOrComplaints.type, MAINTENANCE_TYPE),
      ),
    )
    .returning({ id: maintenanceOrComplaints.id });

  if (deleted.length === 0) {
    throw new Error("Maintenance request not found.");
  }

  revalidatePath(`/admin-dashboard/${adminId}/maintenance`);
  return { id: requestId };
}
