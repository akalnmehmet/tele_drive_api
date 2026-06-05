import { z } from 'zod';

export const CreateVehicleDto = z.object({
  plate: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9\s-]+$/i, 'Geçersiz plaka formatı'),
  model: z.string().min(2).max(100),
  assignedEngineerId: z.string().uuid('Geçersiz mühendis ID').optional(),
});

export type CreateVehicleDto = z.infer<typeof CreateVehicleDto>;
