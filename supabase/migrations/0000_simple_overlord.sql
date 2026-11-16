-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."contract_status" AS ENUM('pending', 'active', 'ended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('tenant', 'staff', 'admin');--> statement-breakpoint
CREATE TABLE "houses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"street" varchar(255) NOT NULL,
	"house_number" varchar(20) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"city" varchar(100) NOT NULL,
	"square_meters" numeric(8, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "houses_square_meters_check" CHECK (square_meters > (0)::numeric)
);
--> statement-breakpoint
ALTER TABLE "houses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(30),
	"role" "user_role" DEFAULT 'tenant' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_user_id_key" UNIQUE("auth_user_id"),
	CONSTRAINT "users_email_key" UNIQUE("email"),
	CONSTRAINT "users_phone_number_key" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"manager_id" uuid,
	"work_house_id" uuid,
	"job_title" varchar(100),
	"start_date" date,
	CONSTRAINT "employees_user_id_key" UNIQUE("user_id"),
	CONSTRAINT "employees_not_own_manager" CHECK (manager_id IS DISTINCT FROM id)
);
--> statement-breakpoint
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"room_number" integer NOT NULL,
	"square_meters" numeric(6, 2),
	"monthly_rent" numeric(10, 2) NOT NULL,
	CONSTRAINT "rooms_house_room_unique" UNIQUE("house_id","room_number"),
	CONSTRAINT "rooms_monthly_rent_check" CHECK (monthly_rent >= (0)::numeric),
	CONSTRAINT "rooms_square_meters_check" CHECK (square_meters > (0)::numeric)
);
--> statement-breakpoint
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"created_by_employee_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date,
	"monthly_rent" numeric(10, 2) NOT NULL,
	"deposit_amount" numeric(10, 2),
	"status" "contract_status" DEFAULT 'pending' NOT NULL,
	"signed_at" timestamp with time zone,
	CONSTRAINT "contracts_dates_valid" CHECK ((end_date IS NULL) OR (end_date >= start_date)),
	CONSTRAINT "contracts_deposit_amount_check" CHECK (deposit_amount >= (0)::numeric),
	CONSTRAINT "contracts_monthly_rent_check" CHECK (monthly_rent >= (0)::numeric)
);
--> statement-breakpoint
ALTER TABLE "contracts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_contract_id_key" UNIQUE("contract_id"),
	CONSTRAINT "reviews_rating_check" CHECK ((rating >= 1) AND (rating <= 5))
);
--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "warnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"issued_by_employee_id" uuid,
	"behavior" text NOT NULL,
	"warning_date" date DEFAULT CURRENT_DATE NOT NULL
);
--> statement-breakpoint
ALTER TABLE "warnings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "utility_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"billing_date" date NOT NULL,
	"gas_cost" numeric(10, 2),
	"electricity_cost" numeric(10, 2),
	CONSTRAINT "utility_bills_house_month_unique" UNIQUE("house_id","billing_date"),
	CONSTRAINT "utility_bills_electricity_cost_check" CHECK (electricity_cost >= (0)::numeric),
	CONSTRAINT "utility_bills_first_of_month" CHECK (billing_date = (date_trunc('month'::text, (billing_date)::timestamp with time zone))::date),
	CONSTRAINT "utility_bills_gas_cost_check" CHECK (gas_cost >= (0)::numeric)
);
--> statement-breakpoint
ALTER TABLE "utility_bills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_work_house_id_fkey" FOREIGN KEY ("work_house_id") REFERENCES "public"."houses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_issued_by_employee_id_fkey" FOREIGN KEY ("issued_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_employees_manager_id" ON "employees" USING btree ("manager_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_employees_work_house_id" ON "employees" USING btree ("work_house_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_rooms_house_id" ON "rooms" USING btree ("house_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contracts_created_by" ON "contracts" USING btree ("created_by_employee_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contracts_room_id" ON "contracts" USING btree ("room_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contracts_tenant_id" ON "contracts" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_warnings_issued_by" ON "warnings" USING btree ("issued_by_employee_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_warnings_tenant_id" ON "warnings" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_utility_bills_house_id" ON "utility_bills" USING btree ("house_id" uuid_ops);--> statement-breakpoint
CREATE POLICY "Users can read own profile" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((auth_user_id = auth.uid()));
*/