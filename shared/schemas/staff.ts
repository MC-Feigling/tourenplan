import { z } from 'zod'
import {
  EMPLOYMENT_TYPES,
  LEAVE_TYPES,
  LICENSE_CLASSES,
  STAFF_JOB_ROLES,
  STAFF_QUALIFICATIONS,
} from '../constants/staff'
import {
  TACHO_TYPES,
  VEHICLE_CLASSES,
  VEHICLE_FEATURES,
  VEHICLE_STATUSES,
} from '../constants/vehicles'

export const staffMemberSchema = z.object({
  firstName: z.string().trim().min(1).max(64),
  lastName: z.string().trim().min(1).max(64),
  phone: z.string().trim().max(32).optional().default(''),
  email: z.string().trim().email().optional().or(z.literal('')).default(''),
  jobRole: z.enum(STAFF_JOB_ROLES),
  licenseClasses: z.array(z.enum(LICENSE_CLASSES)).default([]),
  qualifications: z.array(z.enum(STAFF_QUALIFICATIONS)).default([]),
  employmentType: z.enum(EMPLOYMENT_TYPES).default('full'),
  active: z.boolean().default(true),
  userId: z.string().nullable().optional(),
})

export const staffMemberUpdateSchema = staffMemberSchema.partial()

export const leaveRequestSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.enum(LEAVE_TYPES),
    note: z.string().trim().max(500).optional().default(''),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

export const vehicleSchema = z.object({
  plateNumber: z.string().trim().min(1).max(16),
  name: z.string().trim().min(1).max(64),
  seats: z.number().int().min(1).max(120),
  vehicleClass: z.enum(VEHICLE_CLASSES),
  status: z.enum(VEHICLE_STATUSES).default('available'),
  features: z.array(z.enum(VEHICLE_FEATURES)).default([]),
  tachoType: z.enum(TACHO_TYPES).default('none'),
  nextInspectionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  nextMaintenanceKm: z.number().int().min(0).nullable().optional(),
  notes: z.string().trim().max(1000).optional().default(''),
})

export const vehicleUpdateSchema = vehicleSchema.partial()
