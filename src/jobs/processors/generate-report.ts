import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { AppDataSource } from '../../config/database';
import { ReportJob, ReportStatus, ReportType } from '../../modules/reports/report-job.entity';
import { TelemetryReading } from '../../modules/telemetry/telemetry.entity';
import { Vehicle } from '../../modules/vehicles/vehicle.entity';
import { env } from '../../config/env';
import { logger } from '../../common/utils/logger';
import { notificationQueue } from '../queues';

const reportJobRepo     = () => AppDataSource.getRepository(ReportJob);
const telemetryRepo     = () => AppDataSource.getRepository(TelemetryReading);
const vehicleRepo       = () => AppDataSource.getRepository(Vehicle);

// ─── PDF Üretimi ──────────────────────────────────────────────────────────────

async function generatePDF(
  job: ReportJob,
  readings: TelemetryReading[],
  vehicle: Vehicle,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc  = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Başlık
    doc.fontSize(20).font('Helvetica-Bold')
       .text('TeleDrive — Günlük Sürüş Raporu', { align: 'center' });
    doc.moveDown();

    // Araç bilgileri
    doc.fontSize(13).font('Helvetica-Bold').text('Araç Bilgileri');
    doc.fontSize(11).font('Helvetica')
       .text(`Plaka : ${vehicle.plate}`)
       .text(`Model : ${vehicle.model}`)
       .text(`Rapor Aralığı : ${job.dateFrom.toISOString().split('T')[0]} → ${job.dateTo.toISOString().split('T')[0]}`);
    doc.moveDown();

    // İstatistikler
    const speeds    = readings.map(r => r.speed);
    const batteries = readings.map(r => r.batteryLevel);
    const avgSpeed  = speeds.length ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1) : 'N/A';
    const maxSpeed  = speeds.length ? Math.max(...speeds).toFixed(1) : 'N/A';
    const minBatt   = batteries.length ? Math.min(...batteries).toFixed(1) : 'N/A';
    const avgBatt   = batteries.length ? (batteries.reduce((a, b) => a + b, 0) / batteries.length).toFixed(1) : 'N/A';

    doc.fontSize(13).font('Helvetica-Bold').text('Özet İstatistikler');
    doc.fontSize(11).font('Helvetica')
       .text(`Toplam kayıt sayısı : ${readings.length}`)
       .text(`Ortalama hız        : ${avgSpeed} km/h`)
       .text(`Maksimum hız        : ${maxSpeed} km/h`)
       .text(`Min. batarya        : ${minBatt}%`)
       .text(`Ort. batarya        : ${avgBatt}%`);
    doc.moveDown();

    // Son 20 kayıt tablosu
    if (readings.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('Son Kayıtlar (max 20)');
      doc.moveDown(0.5);

      const slice = readings.slice(0, 20);
      const colWidths = [130, 70, 80, 80, 70];
      const headers   = ['Zaman', 'Hız', 'Enlem', 'Boylam', 'Batarya'];
      let x = 50;
      const y = doc.y;

      doc.fontSize(9).font('Helvetica-Bold');
      headers.forEach((h, i) => { doc.text(h, x, y, { width: colWidths[i] }); x += colWidths[i]; });

      doc.moveTo(50, y + 14).lineTo(490, y + 14).stroke();
      doc.font('Helvetica');

      slice.forEach((r, idx) => {
        const rowY = y + 18 + idx * 14;
        x = 50;
        const cells = [
          new Date(r.recordedAt).toISOString().replace('T', ' ').slice(0, 19),
          `${r.speed.toFixed(1)}`,
          `${Number(r.latitude).toFixed(5)}`,
          `${Number(r.longitude).toFixed(5)}`,
          `${r.batteryLevel.toFixed(1)}%`,
        ];
        cells.forEach((c, i) => { doc.text(c, x, rowY, { width: colWidths[i] }); x += colWidths[i]; });
      });
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// ─── Excel Üretimi ────────────────────────────────────────────────────────────

async function generateExcel(
  vehicles: Vehicle[],
  outputPath: string,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'TeleDrive API';
  wb.created = new Date();

  const ws = wb.addWorksheet('Filo Özeti');

  ws.columns = [
    { header: 'Plaka',   key: 'plate',   width: 15 },
    { header: 'Model',   key: 'model',   width: 20 },
    { header: 'Durum',   key: 'status',  width: 12 },
    { header: 'Oluşturulma', key: 'createdAt', width: 22 },
  ];

  // Başlık satırı stillendir
  ws.getRow(1).eachCell(cell => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.alignment = { horizontal: 'center' };
  });

  vehicles.forEach(v => {
    ws.addRow({
      plate:     v.plate,
      model:     v.model,
      status:    v.status,
      createdAt: new Date(v.createdAt).toLocaleString('tr-TR'),
    });
  });

  // Zebra renklendirme
  ws.eachRow((row, idx) => {
    if (idx > 1) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFEFF6FF' : 'FFFFFFFF' } };
      });
    }
  });

  await wb.xlsx.writeFile(outputPath);
}

// ─── Ana processor ───────────────────────────────────────────────────────────

export async function processReportJob(reportJobId: string): Promise<void> {
  const repo = reportJobRepo();
  const reportJob = await repo.findOne({
    where: { id: reportJobId },
    relations: { vehicle: true, requestedBy: true },
  });

  if (!reportJob) {
    logger.error('ReportJob bulunamadı', { reportJobId });
    return;
  }

  // İşleme başla
  reportJob.status = ReportStatus.PROCESSING;
  await repo.save(reportJob);

  try {
    if (!fs.existsSync(env.REPORTS_DIR)) {
      fs.mkdirSync(env.REPORTS_DIR, { recursive: true });
    }

    const timestamp = Date.now();
    let filePath: string;

    if (reportJob.type === ReportType.DAILY_PDF) {
      // Araç telemetri verilerini çek
      if (!reportJob.vehicleId) throw new Error('PDF raporu için araç ID gerekli');

      const vehicle = await vehicleRepo().findOne({ where: { id: reportJob.vehicleId } });
      if (!vehicle) throw new Error(`Araç bulunamadı: ${reportJob.vehicleId}`);

      const readings = await telemetryRepo()
        .createQueryBuilder('t')
        .where('t.vehicle_id = :vid', { vid: reportJob.vehicleId })
        .andWhere('t.recorded_at BETWEEN :from AND :to', {
          from: reportJob.dateFrom,
          to:   reportJob.dateTo,
        })
        .orderBy('t.recorded_at', 'DESC')
        .getMany();

      // TypeORM date tipi string döndürebilir — normalize et
      const dateFrom = new Date(reportJob.dateFrom);
      const dateTo   = new Date(reportJob.dateTo);
      const reportJobNorm = { ...reportJob, dateFrom, dateTo };

      filePath = path.join(env.REPORTS_DIR, `report_${vehicle.plate}_${timestamp}.pdf`);
      await generatePDF(reportJobNorm as ReportJob, readings, vehicle, filePath);

      logger.info('PDF raporu üretildi', { filePath, readings: readings.length });

    } else {
      // FLEET_EXCEL — tüm filo
      const vehicles = await vehicleRepo().find({ order: { createdAt: 'DESC' } });
      filePath = path.join(env.REPORTS_DIR, `fleet_summary_${timestamp}.xlsx`);
      await generateExcel(vehicles, filePath);

      logger.info('Excel raporu üretildi', { filePath, vehicles: vehicles.length });
    }

    // Başarı
    reportJob.status   = ReportStatus.DONE;
    reportJob.filePath = filePath;
    await repo.save(reportJob);

    // Kullanıcıya e-posta bildir
    await notificationQueue.add('report-ready', {
      to:       reportJob.requestedBy.email,
      subject:  `TeleDrive — Raporunuz Hazır`,
      filePath,
      fileName: path.basename(filePath),
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Rapor üretim hatası', { reportJobId, error: message });
    reportJob.status       = ReportStatus.FAILED;
    reportJob.errorMessage = message;
    await repo.save(reportJob);
    throw err; // BullMQ retry için tekrar fırlat
  }
}
