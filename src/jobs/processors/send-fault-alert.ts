import { sendMail } from '../../common/utils/mailer';
import { logger } from '../../common/utils/logger';
import type { FaultAlertJobData, ReportReadyJobData } from '../queues';

// ─── Sensör arızası e-postası ────────────────────────────────────────────────

export async function processFaultAlert(data: FaultAlertJobData): Promise<void> {
  const { vehiclePlate, sensorType, engineerEmail } = data;

  if (!engineerEmail) {
    logger.warn('Araça atanmış mühendis yok, bildirim atlandı', { vehicleId: data.vehicleId });
    return;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1E40AF;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="color:white;margin:0">⚠️ TeleDrive — Kritik Sensör Arızası</h2>
      </div>
      <div style="background:#FEF2F2;border:1px solid #FECACA;padding:20px">
        <p style="color:#991B1B;font-size:16px;font-weight:bold">
          Araç <strong>${vehiclePlate}</strong> üzerinde <strong>${sensorType.toUpperCase()}</strong> sensörü arıza verdi.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <tr><td style="padding:6px;color:#6B7280">Araç Plakası</td><td style="padding:6px;font-weight:bold">${vehiclePlate}</td></tr>
          <tr style="background:#FEE2E2"><td style="padding:6px;color:#6B7280">Sensör Tipi</td><td style="padding:6px;font-weight:bold">${sensorType}</td></tr>
          <tr><td style="padding:6px;color:#6B7280">Kayıt ID</td><td style="padding:6px;font-family:monospace;font-size:12px">${data.readingId}</td></tr>
          <tr style="background:#FEE2E2"><td style="padding:6px;color:#6B7280">Zaman</td><td style="padding:6px">${new Date().toLocaleString('tr-TR')}</td></tr>
        </table>
        <p style="margin-top:16px;color:#374151">Lütfen en kısa sürede aracı kontrol edin.</p>
      </div>
      <div style="background:#F3F4F6;padding:12px;text-align:center;border-radius:0 0 8px 8px">
        <small style="color:#9CA3AF">TeleDrive Otonom Araç Yönetim Sistemi</small>
      </div>
    </div>`;

  await sendMail({
    to:      engineerEmail,
    subject: `⚠️ Sensör Arızası — ${vehiclePlate} / ${sensorType.toUpperCase()}`,
    html,
  });
}

// ─── Rapor hazır e-postası ───────────────────────────────────────────────────

export async function processReportReady(data: ReportReadyJobData): Promise<void> {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1E40AF;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="color:white;margin:0">📊 TeleDrive — Raporunuz Hazır</h2>
      </div>
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;padding:20px">
        <p style="color:#166534;font-size:16px">
          Talep ettiğiniz rapor başarıyla oluşturuldu.
        </p>
        <p style="color:#374151">
          <strong>Dosya:</strong> ${data.fileName}<br>
          <strong>Oluşturulma zamanı:</strong> ${new Date().toLocaleString('tr-TR')}
        </p>
        <p style="color:#6B7280;font-size:13px">
          Raporu API üzerinden indirmek için:<br>
          <code style="background:#E5E7EB;padding:2px 6px;border-radius:4px">GET /api/reports/&lt;id&gt;/download</code>
        </p>
      </div>
      <div style="background:#F3F4F6;padding:12px;text-align:center;border-radius:0 0 8px 8px">
        <small style="color:#9CA3AF">TeleDrive Otonom Araç Yönetim Sistemi</small>
      </div>
    </div>`;

  await sendMail({
    to:      data.to,
    subject: data.subject,
    html,
    attachments: [{ filename: data.fileName, path: data.filePath }],
  });
}
