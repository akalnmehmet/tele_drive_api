import { AppDataSource } from '../../config/database';
import { Vehicle, VehicleStatus } from '../vehicles/vehicle.entity';
import { TelemetryReading } from '../telemetry/telemetry.entity';
import { SensorReading, SensorStatus } from '../sensors/sensor-reading.entity';

// ── Yanıt tipi ────────────────────────────────────────────────────────────────
export interface VehicleCounts {
  total:   number;
  active:  number;
  idle:    number;
  fault:   number;
  offline: number;
}

export interface Telemetry24h {
  totalReadings: number;
  avgSpeedKmh:   number | null;
  avgBattery:    number | null;
}

export interface LowBatteryVehicle {
  vehicleId:    string;
  plate:        string;
  batteryLevel: number;
  threshold:    number;
  recordedAt:   string;
}

export interface RecentFault {
  sensorReadingId: string;
  vehicleId:       string;
  plate:           string;
  sensorType:      string;
  recordedAt:      string;
}

export interface DashboardData {
  generatedAt:        string;
  vehicleCounts:      VehicleCounts;
  telemetry24h:       Telemetry24h;
  lowBatteryVehicles: LowBatteryVehicle[];
  recentFaults:       RecentFault[];
  fleetHealthScore:   number;
}

// ── Yardımcı sorgular ─────────────────────────────────────────────────────────

/** Araç durumlarını gruplandırarak sayar */
async function getVehicleCounts(): Promise<VehicleCounts> {
  const rows: { status: string; count: string }[] =
    await AppDataSource.getRepository(Vehicle)
      .createQueryBuilder('v')
      .select('v.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('v.status')
      .getRawMany();

  const counts: VehicleCounts = { total: 0, active: 0, idle: 0, fault: 0, offline: 0 };
  for (const row of rows) {
    const n = Number(row.count);
    counts.total += n;
    if (row.status === VehicleStatus.ACTIVE)  counts.active  = n;
    if (row.status === VehicleStatus.IDLE)    counts.idle    = n;
    if (row.status === VehicleStatus.FAULT)   counts.fault   = n;
    if (row.status === VehicleStatus.OFFLINE) counts.offline = n;
  }
  return counts;
}

/** Son 24 saatin telemetri istatistikleri */
async function getTelemetryStats(since: Date): Promise<Telemetry24h> {
  const raw = await AppDataSource.getRepository(TelemetryReading)
    .createQueryBuilder('t')
    .select('COUNT(*)',              'totalReadings')
    .addSelect('AVG(t.speed)',       'avgSpeed')
    .addSelect('AVG(t.battery_level)', 'avgBattery')
    .where('t.recorded_at >= :since', { since })
    .getRawOne();

  return {
    totalReadings: Number(raw?.totalReadings ?? 0),
    avgSpeedKmh:  raw?.avgSpeed  != null ? Math.round(parseFloat(raw.avgSpeed)  * 10) / 10 : null,
    avgBattery:   raw?.avgBattery != null ? Math.round(parseFloat(raw.avgBattery) * 10) / 10 : null,
  };
}

/**
 * Her aracın en son telemetri kaydını çeker;
 * batarya seviyesi aracın lowBatteryThreshold değerinin altında olanları döner.
 * DISTINCT ON — PostgreSQL özgü, raw SQL ile yapılır.
 */
async function getLowBatteryVehicles(): Promise<LowBatteryVehicle[]> {
  const sql = `
    WITH latest AS (
      SELECT DISTINCT ON (vehicle_id)
             vehicle_id,
             battery_level,
             recorded_at
      FROM   telemetry_readings
      ORDER  BY vehicle_id, recorded_at DESC
    )
    SELECT  l.vehicle_id           AS "vehicleId",
            v.plate,
            l.battery_level::float AS "batteryLevel",
            l.recorded_at          AS "recordedAt",
            v.low_battery_threshold AS "threshold"
    FROM    latest l
    JOIN    vehicles v ON v.id = l.vehicle_id
    WHERE   l.battery_level < v.low_battery_threshold
    ORDER   BY l.battery_level ASC
  `;
  const rows: { vehicleId: string; plate: string; batteryLevel: number; threshold: number; recordedAt: Date }[] =
    await AppDataSource.query(sql);

  return rows.map((r) => ({
    vehicleId:    r.vehicleId,
    plate:        r.plate,
    batteryLevel: Math.round(r.batteryLevel * 10) / 10,
    threshold:    r.threshold,
    recordedAt:   new Date(r.recordedAt).toISOString(),
  }));
}

/** Son 24 saatte gerçekleşen sensör arızaları (maks 50 kayıt) */
async function getRecentFaults(since: Date): Promise<RecentFault[]> {
  const sql = `
    SELECT  s.id              AS "sensorReadingId",
            s.vehicle_id      AS "vehicleId",
            v.plate,
            s.sensor_type     AS "sensorType",
            s.recorded_at     AS "recordedAt"
    FROM    sensor_readings s
    JOIN    vehicles v ON v.id = s.vehicle_id
    WHERE   s.status = $1
      AND   s.recorded_at >= $2
    ORDER   BY s.recorded_at DESC
    LIMIT   50
  `;
  const rows: {
    sensorReadingId: string;
    vehicleId:       string;
    plate:           string;
    sensorType:      string;
    recordedAt:      Date;
  }[] = await AppDataSource.query(sql, [SensorStatus.FAULT, since]);

  return rows.map((r) => ({
    sensorReadingId: r.sensorReadingId,
    vehicleId:       r.vehicleId,
    plate:           r.plate,
    sensorType:      r.sensorType,
    recordedAt:      new Date(r.recordedAt).toISOString(),
  }));
}

// ── Filo sağlık skoru ─────────────────────────────────────────────────────────

/**
 * 0–100 arasında bir skor hesaplar.
 * 100 = mükemmel; 0 = tüm filo arızalı / çevrimdışı.
 *
 * Ceza kalemleri:
 *   - Arızalı araç oranı  → maks -40 puan
 *   - Çevrimdışı araç oranı → maks -30 puan
 *   - Düşük bataryalı araç oranı → maks -20 puan
 *   - Son 24h arıza gören benzersiz araçlar → araç başı -2, maks -10
 */
function computeHealthScore(
  counts: VehicleCounts,
  lowBattery: LowBatteryVehicle[],
  faults: RecentFault[],
): number {
  const total = counts.total;
  if (total === 0) return 100;

  const faultPenalty      = Math.min(40, (counts.fault   / total) * 40);
  const offlinePenalty    = Math.min(30, (counts.offline  / total) * 30);
  const lowBatPenalty     = Math.min(20, (lowBattery.length / total) * 20);
  const uniqueFaultVehicles = new Set(faults.map((f) => f.vehicleId)).size;
  const recentFaultPenalty  = Math.min(10, uniqueFaultVehicles * 2);

  const score = 100 - faultPenalty - offlinePenalty - lowBatPenalty - recentFaultPenalty;
  return Math.max(0, Math.round(score));
}

// ── Ana servis metodu ─────────────────────────────────────────────────────────

export const DashboardService = {
  async getSnapshot(): Promise<DashboardData> {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [vehicleCounts, telemetry24h, lowBatteryVehicles, recentFaults] =
      await Promise.all([
        getVehicleCounts(),
        getTelemetryStats(since24h),
        getLowBatteryVehicles(),
        getRecentFaults(since24h),
      ]);

    const fleetHealthScore = computeHealthScore(vehicleCounts, lowBatteryVehicles, recentFaults);

    return {
      generatedAt:        new Date().toISOString(),
      vehicleCounts,
      telemetry24h,
      lowBatteryVehicles,
      recentFaults,
      fleetHealthScore,
    };
  },
};
