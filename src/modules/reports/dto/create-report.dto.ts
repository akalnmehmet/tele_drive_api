import { z } from 'zod';

export const CreateReportDto = z.object({
  type: z.enum(['daily_pdf', 'fleet_excel']),
  vehicleId: z.string().uuid('Geçersiz araç ID').optional(),
  dateFrom: z
    .string()
    .date('YYYY-MM-DD formatında tarih girin'),
  dateTo: z
    .string()
    .date('YYYY-MM-DD formatında tarih girin'),
}).refine(
  (data) => {
    if (data.type === 'daily_pdf' && !data.vehicleId) {
      return false;
    }
    return true;
  },
  { message: 'daily_pdf raporu için vehicleId gerekli', path: ['vehicleId'] },
).refine(
  (data) => new Date(data.dateFrom) <= new Date(data.dateTo),
  { message: '"dateFrom" tarihi "dateTo" tarihinden büyük olamaz', path: ['dateFrom'] },
);

export type CreateReportDto = z.infer<typeof CreateReportDto>;
