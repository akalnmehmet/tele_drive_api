import { z } from 'zod';

export const SensorRangeQueryDto = z.object({
  from: z.string().datetime({ message: 'Geçerli bir ISO 8601 tarih girin' }).optional(),
  to:   z.string().datetime({ message: 'Geçerli bir ISO 8601 tarih girin' }).optional(),
});

export type SensorRangeQueryDto = z.infer<typeof SensorRangeQueryDto>;
