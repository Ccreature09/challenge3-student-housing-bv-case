import { relations } from "drizzle-orm/relations";
import { usersInAuth, users, employees, houses, rooms, contracts, reviews, warnings, utilityBills } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [users.authUserId],
		references: [usersInAuth.id]
	}),
	employees: many(employees),
	contracts: many(contracts),
	warnings: many(warnings),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	users: many(users),
}));

export const employeesRelations = relations(employees, ({one, many}) => ({
	employee: one(employees, {
		fields: [employees.managerId],
		references: [employees.id],
		relationName: "employees_managerId_employees_id"
	}),
	employees: many(employees, {
		relationName: "employees_managerId_employees_id"
	}),
	user: one(users, {
		fields: [employees.userId],
		references: [users.id]
	}),
	house: one(houses, {
		fields: [employees.workHouseId],
		references: [houses.id]
	}),
	contracts: many(contracts),
	warnings: many(warnings),
}));

export const housesRelations = relations(houses, ({many}) => ({
	employees: many(employees),
	rooms: many(rooms),
	utilityBills: many(utilityBills),
}));

export const roomsRelations = relations(rooms, ({one, many}) => ({
	house: one(houses, {
		fields: [rooms.houseId],
		references: [houses.id]
	}),
	contracts: many(contracts),
}));

export const contractsRelations = relations(contracts, ({one, many}) => ({
	employee: one(employees, {
		fields: [contracts.createdByEmployeeId],
		references: [employees.id]
	}),
	room: one(rooms, {
		fields: [contracts.roomId],
		references: [rooms.id]
	}),
	user: one(users, {
		fields: [contracts.tenantId],
		references: [users.id]
	}),
	reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	contract: one(contracts, {
		fields: [reviews.contractId],
		references: [contracts.id]
	}),
}));

export const warningsRelations = relations(warnings, ({one}) => ({
	employee: one(employees, {
		fields: [warnings.issuedByEmployeeId],
		references: [employees.id]
	}),
	user: one(users, {
		fields: [warnings.tenantId],
		references: [users.id]
	}),
}));

export const utilityBillsRelations = relations(utilityBills, ({one}) => ({
	house: one(houses, {
		fields: [utilityBills.houseId],
		references: [houses.id]
	}),
}));