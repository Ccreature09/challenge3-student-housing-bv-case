CREATE TYPE "public"."cleaning_status" AS ENUM('open', 'done');
--> statement-breakpoint
CREATE TABLE "cleaning_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"floor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cleaning_areas_house_name_floor_key" UNIQUE("house_id", "name", "floor")
);
--> statement-breakpoint
CREATE TABLE "cleaning_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid NOT NULL,
	"assigned_room_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" text,
	"due_date" date NOT NULL,
	"status" "cleaning_status" DEFAULT 'open' NOT NULL,
	"completion_note" text,
	"completed_at" timestamp with time zone,
	"last_reminded_at" timestamp with time zone,
	"created_by_employee_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cleaning_tasks_completion_state_check" CHECK ((status = 'open' AND completed_at IS NULL) OR (status = 'done' AND completed_at IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "cleaning_areas" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "cleaning_tasks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "cleaning_areas" ADD CONSTRAINT "cleaning_areas_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."cleaning_areas"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_assigned_room_id_fkey" FOREIGN KEY ("assigned_room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_cleaning_areas_house_id" ON "cleaning_areas" USING btree ("house_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX "idx_cleaning_tasks_area_id" ON "cleaning_tasks" USING btree ("area_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX "idx_cleaning_tasks_assigned_room_id" ON "cleaning_tasks" USING btree ("assigned_room_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX "idx_cleaning_tasks_due_date" ON "cleaning_tasks" USING btree ("due_date" date_ops);
