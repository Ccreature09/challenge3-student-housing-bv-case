import { relations } from "drizzle-orm/relations";
import { users, calendarEvents, maintenanceOrComplaints, announcements, houses, rooms, roomAssignments } from "./schema";

export const calendarEventsRelations = relations(calendarEvents, ({one}) => ({
	user_assignedUserId: one(users, {
		fields: [calendarEvents.assignedUserId],
		references: [users.id],
		relationName: "calendarEvents_assignedUserId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [calendarEvents.createdBy],
		references: [users.id],
		relationName: "calendarEvents_createdBy_users_id"
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	calendarEvents_assignedUserId: many(calendarEvents, {
		relationName: "calendarEvents_assignedUserId_users_id"
	}),
	calendarEvents_createdBy: many(calendarEvents, {
		relationName: "calendarEvents_createdBy_users_id"
	}),
	maintenanceOrComplaints: many(maintenanceOrComplaints),
	announcements: many(announcements),
	roomAssignments: many(roomAssignments),
}));

export const maintenanceOrComplaintsRelations = relations(maintenanceOrComplaints, ({one}) => ({
	user: one(users, {
		fields: [maintenanceOrComplaints.submittedBy],
		references: [users.id]
	}),
}));

export const announcementsRelations = relations(announcements, ({one}) => ({
	user: one(users, {
		fields: [announcements.createdBy],
		references: [users.id]
	}),
}));

export const roomsRelations = relations(rooms, ({one, many}) => ({
	house: one(houses, {
		fields: [rooms.houseId],
		references: [houses.id]
	}),
	roomAssignments: many(roomAssignments),
}));

export const housesRelations = relations(houses, ({many}) => ({
	rooms: many(rooms),
}));

export const roomAssignmentsRelations = relations(roomAssignments, ({one}) => ({
	room: one(rooms, {
		fields: [roomAssignments.roomId],
		references: [rooms.id]
	}),
	user: one(users, {
		fields: [roomAssignments.studentId],
		references: [users.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	users: many(users),
}));
