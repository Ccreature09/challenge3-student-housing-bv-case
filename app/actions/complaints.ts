"use server";

import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { getAuthenticatedProfile } from "@/lib/server-auth";
import {
  users,
  maintenanceOrComplaints,
  houses,
  rooms,
  roomAssignments,
  announcements,
  calendarEvents
} from "@/supabase/migrations/schema";
import { NextResponse } from "next/server";
import Complaints from "@/page";

export async function POST(request: Request) {
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

            return NextResponse.json(
            { message: "Complaint saved successfully" },
            { status: 201 }
            );

        } catch (error) {
            console.error(error);

            return NextResponse.json(
                { message: "Something went wrong. Please try again later!"},
                { status: 500 }
            );
        }

            await db.insert(maintenanceOrComplaints).values({ //this has to be placed after the validation, as if the validation fails, the function runs an error before reaching an insert. But if it succeeds, the if block gets skipped entirely
                title: title.trim(),
                location: location.trim(),
                description: description.trim(),
                photo: photo.trim()
            });
    }


}
