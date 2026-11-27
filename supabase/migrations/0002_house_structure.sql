-- Links announcements and maintenance requests to houses/rooms, and creates the
-- cleaning tables (0001_cleaning.sql referenced lowercase table names and an
-- "employees" table that do not exist in the database, so it was never applied).
-- Every statement is idempotent so the file can be run more than once.

-- Announcements belong to a house.
ALTER TABLE "ANNOUNCEMENTS" ADD COLUMN IF NOT EXISTS "house_id" uuid;
DO $$ BEGIN
  ALTER TABLE "ANNOUNCEMENTS" ADD CONSTRAINT "ANNOUNCEMENTS_house_id_fkey"
    FOREIGN KEY ("house_id") REFERENCES "HOUSES"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "idx_announcements_house_id" ON "ANNOUNCEMENTS" ("house_id");

-- Maintenance requests belong to a house; room_id is NULL for common areas
-- (kitchen, living room, ...), which are described in "location".
DO $$ BEGIN
  ALTER TABLE "MAINTENANCE_OR_COMPLAINTS" ADD CONSTRAINT "MAINTENANCE_OR_COMPLAINTS_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN invalid_table_definition OR duplicate_object THEN NULL; END $$;
ALTER TABLE "MAINTENANCE_OR_COMPLAINTS" ADD COLUMN IF NOT EXISTS "house_id" uuid;
ALTER TABLE "MAINTENANCE_OR_COMPLAINTS" ADD COLUMN IF NOT EXISTS "room_id" uuid;
ALTER TABLE "MAINTENANCE_OR_COMPLAINTS" ADD COLUMN IF NOT EXISTS "location" varchar(150);
ALTER TABLE "MAINTENANCE_OR_COMPLAINTS" ADD COLUMN IF NOT EXISTS "response" text;
ALTER TABLE "MAINTENANCE_OR_COMPLAINTS" ALTER COLUMN "submitted_by" DROP DEFAULT;
DO $$ BEGIN
  ALTER TABLE "MAINTENANCE_OR_COMPLAINTS" ADD CONSTRAINT "MAINTENANCE_OR_COMPLAINTS_house_id_fkey"
    FOREIGN KEY ("house_id") REFERENCES "HOUSES"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "MAINTENANCE_OR_COMPLAINTS" ADD CONSTRAINT "MAINTENANCE_OR_COMPLAINTS_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "ROOMS"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "idx_maintenance_house_id" ON "MAINTENANCE_OR_COMPLAINTS" ("house_id");
CREATE INDEX IF NOT EXISTS "idx_maintenance_room_id" ON "MAINTENANCE_OR_COMPLAINTS" ("room_id");

-- Cleaning schedule.
DO $$ BEGIN
  CREATE TYPE "public"."cleaning_status" AS ENUM('open', 'done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "cleaning_areas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "house_id" uuid NOT NULL REFERENCES "HOUSES"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "floor" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "cleaning_areas_house_name_floor_key" UNIQUE ("house_id", "name", "floor")
);
ALTER TABLE "cleaning_areas" ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "idx_cleaning_areas_house_id" ON "cleaning_areas" ("house_id");

CREATE TABLE IF NOT EXISTS "cleaning_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "area_id" uuid NOT NULL REFERENCES "cleaning_areas"("id") ON DELETE CASCADE,
  "assigned_room_id" uuid NOT NULL REFERENCES "ROOMS"("id") ON DELETE CASCADE,
  "title" varchar(150) NOT NULL,
  "description" text,
  "due_date" date NOT NULL,
  "status" "cleaning_status" DEFAULT 'open' NOT NULL,
  "completion_note" text,
  "completed_at" timestamp with time zone,
  "last_reminded_at" timestamp with time zone,
  "created_by_employee_id" uuid REFERENCES "USERS"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "cleaning_tasks_completion_state_check" CHECK (
    (status = 'open' AND completed_at IS NULL) OR (status = 'done' AND completed_at IS NOT NULL)
  )
);
ALTER TABLE "cleaning_tasks" ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "idx_cleaning_tasks_area_id" ON "cleaning_tasks" ("area_id");
CREATE INDEX IF NOT EXISTS "idx_cleaning_tasks_assigned_room_id" ON "cleaning_tasks" ("assigned_room_id");
CREATE INDEX IF NOT EXISTS "idx_cleaning_tasks_due_date" ON "cleaning_tasks" ("due_date");
