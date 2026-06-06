import { z } from 'zod';
import { VehicleStatus } from '../vehicle.entity';

export const UpdateVehicleDto = z.object({
  plate: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9\s-]+$/i, 'Geçersiz plaka formatı')
    .optional(),
  model: z.string().min(2).max(100).optional(),
  status: z.enum(['active', 'idle', 'fault', 'offline']).optional(),
  assignedEngineerId: z.string().uuid('Geçersiz mühendis ID').nullable().optional(),
  lowBatteryThreshold: z.number().min(0).max(100).optional(),
  maxSpeedThreshold:   z.number().min(0).nullable().optional(),
});

export type UpdateVehicleDto = z.infer<typeof UpdateVehicleDto>;
