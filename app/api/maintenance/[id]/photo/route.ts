import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { getAuthenticatedProfile } from "@/lib/server-auth";
import { maintenanceOrComplaints } from "@/supabase/migrations/schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function detectImageMimeType(buffer: Buffer): string {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 6 &&
    buffer.subarray(0, 4).toString("ascii") === "GIF8"
  ) {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: "Invalid request ID." },
      { status: 400 },
    );
  }

  let profile: Awaited<ReturnType<typeof getAuthenticatedProfile>>;
  try {
    profile = await getAuthenticatedProfile();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Authentication required.",
      },
      { status: 401 },
    );
  }

  const [row] = await db
    .select({
      photo: maintenanceOrComplaints.photo,
      submittedBy: maintenanceOrComplaints.submittedBy,
    })
    .from(maintenanceOrComplaints)
    .where(
      and(
        eq(maintenanceOrComplaints.id, id),
        eq(maintenanceOrComplaints.type, "maintenance"),
      ),
    )
    .limit(1);

  if (!row || !row.photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const isPrivileged = profile.role === "admin" || profile.role === "staff";
  if (!isPrivileged && row.submittedBy !== profile.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const mimeType = detectImageMimeType(row.photo);

  return new NextResponse(new Uint8Array(row.photo), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(row.photo.byteLength),
      "Cache-Control": "private, max-age=300",
    },
  });
}
