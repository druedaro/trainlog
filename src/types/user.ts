import { z } from 'zod';

export type Gender = 'masculino' | 'femenino' | 'otro' | 'prefiero no decirlo';

export const userProfileSchema = z.object({
  uid: z.string(),
  name: z.string()
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .transform(val => val.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m] || m)),
  gender: z.enum(['masculino', 'femenino', 'otro', 'prefiero no decirlo']),
  age: z.number().min(13).max(120).optional(),
  birthDate: z.string().optional(),
  createdAt: z.number(),
  onboardingCompleted: z.boolean().optional(),
  achievements: z.array(z.string()).optional(),
  personalContext: z.string()
    .max(400, 'El contexto vital no puede exceder los 400 caracteres')
    .transform(val => val.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m] || m))
    .optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
