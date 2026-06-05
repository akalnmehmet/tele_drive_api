import { z } from 'zod';

export const IngestTelemetryDto = z.object({
  speed: z
    .number()
    .min(0, 'Hız negatif olamaz')
    .max(300, 'Hız 300 km/s\'yi geçemez'),
  latitude: z
    .number()
    .min(-90)
    .max(90, 'Enlem -90 ile 90 arasında olmalı'),
  longitude: z
    .number()
    .min(-180)
    .max(180, 'Boylam -180 ile 180 arasında olmalı'),
  batteryLevel: z
    .number()
    .min(0)
    .max(100, 'Batarya seviyesi 0-100 arasında olmalı'),
  recordedAt: z
    .string()
    .datetime({ message: 'Geçerli bir ISO 8601 tarih girin' })
    .optional(),
});

export type IngestTelemetryDto = z.infer<typeof IngestTelemetryDto>;
