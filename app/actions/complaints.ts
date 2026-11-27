"use server";

import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { getAuthenticatedProfile } from "@/lib/server-auth";
import {
  users,
  maintenanceOrComplaints
  houses,
  rooms,
  roomAssignments,
  announcements,
  calendarEvents
} from "@/supabase/migrations/schema";
import { NextResponse } from "next/server";
import Complaints from "@/page";

export async function GET(request: Request) {
    try {
        const body = await request.json();

        const title = body.title;
        const location = body.location;
        const description = body.description;
        const photo = body.photo;

        if (
            typeof title !== "string" ||
            typeof location !== "string" ||
            typeof description !== "string" ||
            typeof photo !== "string" ||
            !title.trim() ||
            !location.trim() ||
            !description.trim() ||
            !photo.trim()
        ) {
            return NextResponse.json(
                { message: "Please provide a title, location, and description"},
                { status: 400 }
            );

            await db.insert(complaints).values({
                title: title.trim(),
                location: location.trim(),
                description: description.trim(),
                photo: photo.trim()
            })
        }
    }


}
