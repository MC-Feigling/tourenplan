import { sql } from 'drizzle-orm'
import { boolean, integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core'
import { USER_ROLES } from '../../shared/constants/roles'

const epochSecondsDefault = sql`floor(extract(epoch from now()))::integer`

export const depots = pgTable('depots', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull().default(''),
  createdAt: integer('created_at').notNull().default(epochSecondsDefault),
})

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  role: text('role').notNull().default('driver'),
  depotId: text('depot_id').references(() => depots.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull().default(epochSecondsDefault),
})

export const staffMembers = pgTable('staff_members', {
  id: text('id').primaryKey(),
  depotId: text('depot_id').references(() => depots.id, { onDelete: 'set null' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  jobRole: text('job_role').notNull().default('driver'),
  licenseClasses: jsonb('license_classes').notNull().default([]),
  qualifications: jsonb('qualifications').notNull().default([]),
  employmentType: text('employment_type').notNull().default('full'),
  active: boolean('active').notNull().default(true),
  createdAt: integer('created_at').notNull().default(epochSecondsDefault),
  updatedAt: integer('updated_at').notNull().default(epochSecondsDefault),
})

export const leaveRequests = pgTable('leave_requests', {
  id: text('id').primaryKey(),
  staffMemberId: text('staff_member_id')
    .notNull()
    .references(() => staffMembers.id, { onDelete: 'cascade' }),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  type: text('type').notNull().default('vacation'),
  note: text('note').notNull().default(''),
  createdAt: integer('created_at').notNull().default(epochSecondsDefault),
})

export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey(),
  depotId: text('depot_id').references(() => depots.id, { onDelete: 'set null' }),
  plateNumber: text('plate_number').notNull().unique(),
  name: text('name').notNull(),
  seats: integer('seats').notNull(),
  vehicleClass: text('vehicle_class').notNull().default('coach'),
  status: text('status').notNull().default('available'),
  features: jsonb('features').notNull().default([]),
  tachoType: text('tacho_type').notNull().default('none'),
  nextInspectionDate: text('next_inspection_date'),
  nextMaintenanceKm: integer('next_maintenance_km'),
  notes: text('notes').notNull().default(''),
  createdAt: integer('created_at').notNull().default(epochSecondsDefault),
  updatedAt: integer('updated_at').notNull().default(epochSecondsDefault),
})

export const lineTemplates = pgTable('line_templates', {
  id: text('id').primaryKey(),
  depotId: text('depot_id').references(() => depots.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  lineLengthKm: integer('line_length_km').notNull(),
  weekdays: jsonb('weekdays').notNull().default([]),
  defaultDepartureTime: text('default_departure_time').notNull().default('06:00'),
  defaultStops: jsonb('default_stops').notNull().default([]),
  active: boolean('active').notNull().default(true),
  createdAt: integer('created_at').notNull().default(epochSecondsDefault),
  updatedAt: integer('updated_at').notNull().default(epochSecondsDefault),
})

export const tours = pgTable('tours', {
  id: text('id').primaryKey(),
  depotId: text('depot_id').references(() => depots.id, { onDelete: 'set null' }),
  type: text('type').notNull(),
  name: text('name').notNull(),
  date: text('date').notNull(),
  status: text('status').notNull().default('draft'),
  complianceProfile: text('compliance_profile').notNull(),
  lineLengthKm: integer('line_length_km'),
  lineTemplateId: text('line_template_id').references(() => lineTemplates.id, { onDelete: 'set null' }),
  vehicleId: text('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  driverId: text('driver_id').references(() => staffMembers.id, { onDelete: 'set null' }),
  notes: text('notes').notNull().default(''),
  createdAt: integer('created_at').notNull().default(epochSecondsDefault),
  updatedAt: integer('updated_at').notNull().default(epochSecondsDefault),
})

export const tourStops = pgTable('tour_stops', {
  id: text('id').primaryKey(),
  tourId: text('tour_id')
    .notNull()
    .references(() => tours.id, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(),
  locationName: text('location_name').notNull(),
  address: text('address').notNull().default(''),
  lat: text('lat'),
  lng: text('lng'),
  plannedArrival: text('planned_arrival').notNull(),
  plannedDeparture: text('planned_departure').notNull(),
  stopType: text('stop_type').notNull().default('pickup'),
  drivingMinutesFromPrev: integer('driving_minutes_from_prev').notNull().default(0),
})

export type UserRow = typeof users.$inferSelect
export type DepotRow = typeof depots.$inferSelect
export type StaffMemberRow = typeof staffMembers.$inferSelect
export type LeaveRequestRow = typeof leaveRequests.$inferSelect
export type VehicleRow = typeof vehicles.$inferSelect
export type LineTemplateRow = typeof lineTemplates.$inferSelect
export type TourRow = typeof tours.$inferSelect
export type TourStopRow = typeof tourStops.$inferSelect

export function isUserRole(value: string): value is (typeof USER_ROLES)[number] {
  return (USER_ROLES as readonly string[]).includes(value)
}
