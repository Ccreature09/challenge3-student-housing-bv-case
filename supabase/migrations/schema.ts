import { pgTable, check, uuid, varchar, numeric, timestamp, foreignKey, unique, pgPolicy, index, date, integer, smallint, text, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const contractStatus = pgEnum("contract_status", ['pending', 'active', 'ended', 'cancelled'])
export const userRole = pgEnum("user_role", ['tenant', 'staff', 'admin'])


export const houses = pgTable("houses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	street: varchar({ length: 255 }).notNull(),
	houseNumber: varchar("house_number", { length: 20 }).notNull(),
	postalCode: varchar("postal_code", { length: 20 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	squareMeters: numeric("square_meters", { precision: 8, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("houses_square_meters_check", sql`square_meters > (0)::numeric`),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authUserId: uuid("auth_user_id"),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 30 }),
	role: userRole().default('tenant').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [table.id],
			name: "users_auth_user_id_fkey"
		}).onDelete("set null"),
	unique("users_auth_user_id_key").on(table.authUserId),
	unique("users_email_key").on(table.email),
	unique("users_phone_number_key").on(table.phoneNumber),
	pgPolicy("Users can read own profile", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(auth_user_id = auth.uid())` }),
]);

export const employees = pgTable("employees", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	managerId: uuid("manager_id"),
	workHouseId: uuid("work_house_id"),
	jobTitle: varchar("job_title", { length: 100 }),
	startDate: date("start_date"),
}, (table) => [
	index("idx_employees_manager_id").using("btree", table.managerId.asc().nullsLast().op("uuid_ops")),
	index("idx_employees_work_house_id").using("btree", table.workHouseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.managerId],
			foreignColumns: [table.id],
			name: "employees_manager_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "employees_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workHouseId],
			foreignColumns: [houses.id],
			name: "employees_work_house_id_fkey"
		}).onDelete("set null"),
	unique("employees_user_id_key").on(table.userId),
	check("employees_not_own_manager", sql`manager_id IS DISTINCT FROM id`),
]);

export const rooms = pgTable("rooms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	houseId: uuid("house_id").notNull(),
	roomNumber: integer("room_number").notNull(),
	squareMeters: numeric("square_meters", { precision: 6, scale:  2 }),
	monthlyRent: numeric("monthly_rent", { precision: 10, scale:  2 }).notNull(),
}, (table) => [
	index("idx_rooms_house_id").using("btree", table.houseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.houseId],
			foreignColumns: [houses.id],
			name: "rooms_house_id_fkey"
		}).onDelete("cascade"),
	unique("rooms_house_room_unique").on(table.houseId, table.roomNumber),
	check("rooms_monthly_rent_check", sql`monthly_rent >= (0)::numeric`),
	check("rooms_square_meters_check", sql`square_meters > (0)::numeric`),
]);

export const contracts = pgTable("contracts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	roomId: uuid("room_id").notNull(),
	createdByEmployeeId: uuid("created_by_employee_id"),
	startDate: date("start_date").notNull(),
	endDate: date("end_date"),
	monthlyRent: numeric("monthly_rent", { precision: 10, scale:  2 }).notNull(),
	depositAmount: numeric("deposit_amount", { precision: 10, scale:  2 }),
	status: contractStatus().default('pending').notNull(),
	signedAt: timestamp("signed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_contracts_created_by").using("btree", table.createdByEmployeeId.asc().nullsLast().op("uuid_ops")),
	index("idx_contracts_room_id").using("btree", table.roomId.asc().nullsLast().op("uuid_ops")),
	index("idx_contracts_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.createdByEmployeeId],
			foreignColumns: [employees.id],
			name: "contracts_created_by_employee_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "contracts_room_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [users.id],
			name: "contracts_tenant_id_fkey"
		}).onDelete("restrict"),
	check("contracts_dates_valid", sql`(end_date IS NULL) OR (end_date >= start_date)`),
	check("contracts_deposit_amount_check", sql`deposit_amount >= (0)::numeric`),
	check("contracts_monthly_rent_check", sql`monthly_rent >= (0)::numeric`),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contractId: uuid("contract_id").notNull(),
	rating: smallint().notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [contracts.id],
			name: "reviews_contract_id_fkey"
		}).onDelete("cascade"),
	unique("reviews_contract_id_key").on(table.contractId),
	check("reviews_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const warnings = pgTable("warnings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	issuedByEmployeeId: uuid("issued_by_employee_id"),
	behavior: text().notNull(),
	warningDate: date("warning_date").default(sql`CURRENT_DATE`).notNull(),
}, (table) => [
	index("idx_warnings_issued_by").using("btree", table.issuedByEmployeeId.asc().nullsLast().op("uuid_ops")),
	index("idx_warnings_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.issuedByEmployeeId],
			foreignColumns: [employees.id],
			name: "warnings_issued_by_employee_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [users.id],
			name: "warnings_tenant_id_fkey"
		}).onDelete("cascade"),
]);

export const utilityBills = pgTable("utility_bills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	houseId: uuid("house_id").notNull(),
	billingDate: date("billing_date").notNull(),
	gasCost: numeric("gas_cost", { precision: 10, scale:  2 }),
	electricityCost: numeric("electricity_cost", { precision: 10, scale:  2 }),
}, (table) => [
	index("idx_utility_bills_house_id").using("btree", table.houseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.houseId],
			foreignColumns: [houses.id],
			name: "utility_bills_house_id_fkey"
		}).onDelete("cascade"),
	unique("utility_bills_house_month_unique").on(table.houseId, table.billingDate),
	check("utility_bills_electricity_cost_check", sql`electricity_cost >= (0)::numeric`),
	check("utility_bills_first_of_month", sql`billing_date = (date_trunc('month'::text, (billing_date)::timestamp with time zone))::date`),
	check("utility_bills_gas_cost_check", sql`gas_cost >= (0)::numeric`),
]);
