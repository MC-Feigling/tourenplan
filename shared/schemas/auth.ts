import { z } from 'zod'
import { CHANGE_PASSWORD_MIN_LENGTH } from '../constants/auth'

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(CHANGE_PASSWORD_MIN_LENGTH).max(128),
  })
  .refine((body) => body.newPassword !== body.currentPassword, {
    message: 'password_unchanged',
    path: ['newPassword'],
  })
