import { pgTable, foreignKey, timestamp, varchar, uuid, index, unique, check, integer, numeric, date, text, pgPolicy, pgEnum, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const contractStatus = pgEnum("contract_status", ['pending', 'active', 'ended', 'cancelled'])
export const userRole = pgEnum("user_role", ['tenant', 'staff', 'admin'])
export const cleaningStatus = pgEnum("cleaning_status", ['open', 'done'])
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
	dataType: () => "bytea",
});

export const calendarEvents = pgTable("CALENDAR_EVENTS", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	title: varchar(),
	status: varchar(),
	description: varchar(),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	id: uuid().defaultRandom().primaryKey().notNull(),
	assignedUserId: uuid("assigned_user_id").default(sql`auth.uid()`),
	createdBy: uuid("created_by"),
}, (table) => [
	foreignKey({
			columns: [table.assignedUserId],
			foreignColumns: [users.id],
			name: "CALENDAR_EVENTS_assigned_user_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "CALENDAR_EVENTS_created_by_fkey"
		}),
]);

export const maintenanceOrComplaints = pgTable("MAINTENANCE_OR_COMPLAINTS", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	title: varchar(),
	description: varchar(),
	// TODO: failed to parse database type 'bytea'
	photo: bytea("photo"),
	status: varchar(),
	type: varchar(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	submittedBy: uuid("submitted_by").defaultRandom(),
	id: uuid().defaultRandom().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.submittedBy],
			foreignColumns: [users.id],
			name: "MAINTENANCE_OR_COMPLAINTS_submitted_by_fkey"
		}),
]);

export const announcements = pgTable("ANNOUNCEMENTS", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	title: varchar(),
	description: varchar(),
	priority: varchar(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdBy: uuid("created_by"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "ANNOUNCEMENTS_created_by_fkey"
		}),
]);

export const houses = pgTable("HOUSES", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	houseNumber: varchar("house_number", { length: 20 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	postalCode: varchar("postal_code"),
	street: varchar(),
	city: varchar(),
});

export const rooms = pgTable("ROOMS", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	houseId: uuid("house_id").notNull(),
	roomNumber: integer("room_number").notNull(),
	monthlyRent: numeric("monthly_rent", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_rooms_house_id").using("btree", table.houseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.houseId],
			foreignColumns: [houses.id],
			name: "rooms_house_id_fkey"
		}).onDelete("cascade"),
	unique("rooms_house_room_unique").on(table.houseId, table.roomNumber),
	check("rooms_monthly_rent_check", sql`monthly_rent >= (0)::numeric`),
]);

export const roomAssignments = pgTable("ROOM_ASSIGNMENTS", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	roomId: uuid("room_id").notNull(),
	createdByEmployeeId: uuid("created_by_employee_id"),
	startDate: date("start_date").notNull(),
	endDate: date("end_date"),
}, (table) => [
	index("idx_contracts_created_by").using("btree", table.createdByEmployeeId.asc().nullsLast().op("uuid_ops")),
	index("idx_contracts_room_id").using("btree", table.roomId.asc().nullsLast().op("uuid_ops")),
	index("idx_contracts_tenant_id").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "contracts_room_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "contracts_tenant_id_fkey"
		}).onDelete("restrict"),
	check("contracts_dates_valid", sql`(end_date IS NULL) OR (end_date >= start_date)`),
]);

export const cleaningAreas = pgTable("cleaning_areas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	houseId: uuid("house_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	floor: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_cleaning_areas_house_id").using("btree", table.houseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.houseId],
		foreignColumns: [houses.id],
		name: "cleaning_areas_house_id_fkey",
	}).onDelete("cascade"),
	unique("cleaning_areas_house_name_floor_key").on(table.houseId, table.name, table.floor),
]);

export const cleaningTasks = pgTable("cleaning_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	areaId: uuid("area_id").notNull(),
	assignedRoomId: uuid("assigned_room_id").notNull(),
	title: varchar({ length: 150 }).notNull(),
	description: text(),
	dueDate: date("due_date").notNull(),
	status: cleaningStatus().default("open").notNull(),
	completionNote: text("completion_note"),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	lastRemindedAt: timestamp("last_reminded_at", { withTimezone: true, mode: 'string' }),
	createdByEmployeeId: uuid("created_by_employee_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_cleaning_tasks_area_id").using("btree", table.areaId.asc().nullsLast().op("uuid_ops")),
	index("idx_cleaning_tasks_assigned_room_id").using("btree", table.assignedRoomId.asc().nullsLast().op("uuid_ops")),
	index("idx_cleaning_tasks_due_date").using("btree", table.dueDate.asc().nullsLast().op("date_ops")),
	foreignKey({
		columns: [table.areaId],
		foreignColumns: [cleaningAreas.id],
		name: "cleaning_tasks_area_id_fkey",
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.assignedRoomId],
		foreignColumns: [rooms.id],
		name: "cleaning_tasks_assigned_room_id_fkey",
	}).onDelete("cascade"),
	check("cleaning_tasks_completion_state_check", sql`(status = 'open' AND completed_at IS NULL) OR (status = 'done' AND completed_at IS NOT NULL)`),
]);

export const users = pgTable("USERS", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authUserId: uuid("auth_user_id"),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 30 }),
	role: userRole().default('tenant').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("users_auth_user_id_key").on(table.authUserId),
	unique("users_email_key").on(table.email),
	unique("users_phone_number_key").on(table.phoneNumber),
	pgPolicy("Allow server to read users", { as: "permissive", for: "select", to: ["anon"], using: sql`true` }),
	pgPolicy("Users can read own profile", { as: "permissive", for: "select", to: ["authenticated"] }),
]);
