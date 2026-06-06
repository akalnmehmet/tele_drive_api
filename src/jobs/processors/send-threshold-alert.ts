import { sendMail } from '../../common/utils/mailer';
import { logger } from '../../common/utils/logger';
import type { ThresholdAlertJobData } from '../queues';

export async function processThresholdAlert(data: ThresholdAlertJobData): Promise<void> {
  const { vehiclePlate, alertType, value, threshold, engineerEmail } = data;

  if (!engineerEmail) {
    logger.warn('Araça atanmış mühendis yok, eşik bildirimi atlandı', { vehicleId: data.vehicleId });
    return;
  }

  const isBattery = alertType === 'low_battery';

  const title   = isBattery ? '🔋 Düşük Batarya Uyarısı' : '🚨 Hız Eşiği Aşıldı';
  const subject = isBattery
    ? `🔋 Düşük Batarya — ${vehiclePlate} (%${value.toFixed(1)})`
    : `🚨 Hız Eşiği Aşıldı — ${vehiclePlate} (${value.toFixed(1)} km/h)`;

  const detail = isBattery
    ? `Batarya seviyesi <strong>%${value.toFixed(1)}</strong> olarak ölçüldü. Eşik değeri: <strong>%${threshold}</strong>.`
    : `Hız <strong>${value.toFixed(1)} km/h</strong> olarak ölçüldü. İzin verilen maksimum: <strong>${threshold} km/h</strong>.`;

  const bgColor     = isBattery ? '#FFF7ED' : '#FEF2F2';
  const borderColor = isBattery ? '#FED7AA' : '#FECACA';
  const textColor   = isBattery ? '#92400E' : '#991B1B';

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1E40AF;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="color:white;margin:0">${title}</h2>
      </div>
      <div style="background:${bgColor};border:1px solid ${borderColor};padding:20px">
        <p style="color:${textColor};font-size:16px;font-weight:bold">
          Araç <strong>${vehiclePlate}</strong> için eşik uyarısı.
        </p>
        <p style="color:#374151">${detail}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <tr><td style="padding:6px;color:#6B7280">Araç Plakası</td><td style="padding:6px;font-weight:bold">${vehiclePlate}</td></tr>
          <tr style="background:#F9FAFB"><td style="padding:6px;color:#6B7280">Uyarı Tipi</td><td style="padding:6px">${isBattery ? 'Düşük Batarya' : 'Hız Aşımı'}</td></tr>
          <tr><td style="padding:6px;color:#6B7280">Ölçülen Değer</td><td style="padding:6px;font-weight:bold;color:${textColor}">${isBattery ? `%${value.toFixed(1)}` : `${value.toFixed(1)} km/h`}</td></tr>
          <tr style="background:#F9FAFB"><td style="padding:6px;color:#6B7280">Eşik Değeri</td><td style="padding:6px">${isBattery ? `%${threshold}` : `${threshold} km/h`}</td></tr>
          <tr><td style="padding:6px;color:#6B7280">Zaman</td><td style="padding:6px">${new Date().toLocaleString('tr-TR')}</td></tr>
        </table>
      </div>
      <div style="background:#F3F4F6;padding:12px;text-align:center;border-radius:0 0 8px 8px">
        <small style="color:#9CA3AF">TeleDrive Otonom Araç Yönetim Sistemi</small>
      </div>
    </div>`;

  await sendMail({ to: engineerEmail, subject, html });

  logger.info('Eşik uyarısı gönderildi', {
    vehiclePlate,
    alertType,
    value,
    threshold,
    engineerEmail,
  });
}
