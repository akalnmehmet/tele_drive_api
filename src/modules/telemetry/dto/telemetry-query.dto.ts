import { z } from 'zod';

export const TelemetryRangeQueryDto = z.object({
  from:   z.string().datetime({ message: 'Geçerli bir ISO 8601 tarih girin' }).optional(),
  to:     z.string().datetime({ message: 'Geçerli bir ISO 8601 tarih girin' }).optional(),
  limit:  z.string().regex(/^\d+$/, 'Sayısal değer olmalı').optional(),
  offset: z.string().regex(/^\d+$/, 'Sayısal değer olmalı').optional(),
});

export const TelemetryStatsQueryDto = z.object({
  from: z.string().datetime({ message: 'Geçerli bir ISO 8601 tarih girin' }).optional(),
  to:   z.string().datetime({ message: 'Geçerli bir ISO 8601 tarih girin' }).optional(),
});

export type TelemetryRangeQueryDto = z.infer<typeof TelemetryRangeQueryDto>;
export type TelemetryStatsQueryDto  = z.infer<typeof TelemetryStatsQueryDto>;
