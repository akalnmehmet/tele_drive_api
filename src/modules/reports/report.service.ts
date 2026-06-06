import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../../config/database';
import { ReportJob, ReportStatus, ReportType } from './report-job.entity';
import { VehicleRepository } from '../vehicles/vehicle.repository';
import { AppError } from '../../common/errors/AppError';
import { reportQueue } from '../../jobs/queues';
import { logger } from '../../common/utils/logger';
import type { CreateReportDto } from './dto/create-report.dto';

const repo = () => AppDataSource.getRepository(ReportJob);

export const ReportService = {
  // ── Rapor isteği oluştur + kuyruğa ekle ─────────────────────────────────
  async create(dto: CreateReportDto, requestedById: string): Promise<ReportJob> {
    // Araç kontrolü
    if (dto.vehicleId) {
      const vehicle = await VehicleRepository.findOne({ where: { id: dto.vehicleId } });
      if (!vehicle) throw new AppError('Araç bulunamadı', 404);
    }

    const reportJob = repo().create({
      type:          dto.type as ReportType,
      vehicleId:     dto.vehicleId ?? null,
      requestedById,
      dateFrom:      new Date(dto.dateFrom),
      dateTo:        new Date(dto.dateTo),
      status:        ReportStatus.PENDING,
    });

    const saved = await repo().save(reportJob);

    // BullMQ kuyruğuna ekle
    await reportQueue.add('generate', { reportJobId: saved.id });
    logger.info('Rapor kuyruğa eklendi', { reportJobId: saved.id, type: dto.type });

    return saved;
  },

  // ── Kullanıcının raporları ────────────────────────────────────────────────
  async findByUser(
    requestedById: string,
    limit = 20,
    offset = 0,
  ): Promise<{ reports: ReportJob[]; total: number; limit: number; offset: number }> {
    const [reports, total] = await repo().findAndCount({
      where: { requestedById },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
    });
    return { reports, total, limit, offset };
  },

  // ── Tek rapor durumu ──────────────────────────────────────────────────────
  async findById(id: string, requestedById: string): Promise<ReportJob> {
    const job = await repo().findOne({ where: { id, requestedById } });
    if (!job) throw new AppError('Rapor bulunamadı', 404);
    return job;
  },

  // ── Dosya indirme ─────────────────────────────────────────────────────────
  async getFilePath(id: string, requestedById: string): Promise<string> {
    const job = await repo().findOne({ where: { id, requestedById } });
    if (!job) throw new AppError('Rapor bulunamadı', 404);

    if (job.status !== ReportStatus.DONE) {
      throw new AppError(
        `Rapor henüz hazır değil (durum: ${job.status})`,
        job.status === ReportStatus.FAILED ? 422 : 202,
      );
    }

    if (!job.filePath || !fs.existsSync(job.filePath)) {
      throw new AppError('Rapor dosyası bulunamadı', 404);
    }

    return job.filePath;
  },
};
