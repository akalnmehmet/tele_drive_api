import { z } from 'zod';

export const VehicleQueryDto = z.object({
  status: z.enum(['active', 'idle', 'fault', 'offline']).optional(),
  model:  z.string().optional(),
  limit:  z.string().regex(/^\d+$/, 'Sayısal değer olmalı').optional(),
  offset: z.string().regex(/^\d+$/, 'Sayısal değer olmalı').optional(),
});

export type VehicleQueryDto = z.infer<typeof VehicleQueryDto>;
