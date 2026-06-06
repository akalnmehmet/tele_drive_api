# TeleDrive API

> **Otonom Araç Telemetri ve Filo Yönetim REST API'si**

Gerçek zamanlı telemetri verisi toplayan, sensör arızalarını izleyen, batarya/hız eşiği aşımlarında otomatik uyarı tetikleyen, BullMQ kuyrukları üzerinden asenkron rapor üreten ve JWT + TOTP 2FA ile güvenli kimlik doğrulama sağlayan production-ready bir API.

---

## Özellikler

- **Swagger UI** — `GET /api/docs` ile interaktif API dokümantasyonu ve test arayüzü
- **Landing Page** — `GET /` ile API bilgisi ve endpoint listesi döner
- **JWT + TOTP 2FA** — Pre-auth / full-auth iki aşamalı akış, refresh token rotasyonu (bcrypt hash)
- **API Key Auth** — Araçlar `X-Api-Key` başlığıyla veri gönderir; kullanıcılar JWT kullanır
- **RBAC** — `fleet_manager` (tam yetki) ve `engineer` (sadece okuma) rolleri
- **Telemetri & Sensör Alımı** — GPS, hız, batarya; LiDAR, kamera, radar, GPS, IMU
- **Query Param Doğrulama** — Zod v4 ile hem body hem query parametreleri doğrulanır
- **Otomatik Arıza Tespiti** — Sensör `fault` durumuna geçtiğinde araç statüsü güncellenir + BullMQ ile bildirim
- **Batarya & Hız Eşiği Uyarıları** — Araç başına özelleştirilebilir `lowBatteryThreshold` / `maxSpeedThreshold`; ihlalde mühendise e-posta kuyruğa alınır
- **Sayfalama (Pagination)** — Araçlar ve raporlar `?limit` + `?offset` ile sorgulanabilir (maks. 100)
- **Sensör Tipi Filtresi** — Sensör geçmişi `?sensorType=lidar|camera|radar|gps|imu` ile filtrelenebilir
- **Kullanıcı Yönetimi** — `fleet_manager` tüm kullanıcıları listeleyebilir, rol atayabilir, silebilir
- **Dashboard** — Filo özet istatistikleri (araç sayıları, arıza durumu, düşük batarya listesi)
- **Asenkron Rapor Üretimi** — PDF (günlük sürüş) ve Excel (filo özeti) BullMQ worker'larıyla arka planda üretilir
- **Rate Limiting** — Auth (10/15dk), Telemetri (300/dk), Genel (100/15dk)
- **Graceful Shutdown** — SIGTERM/SIGINT'te worker'lar temiz kapatılır

---

## Teknoloji Yığını

| Katman | Teknoloji | Versiyon |
|--------|-----------|---------|
| Runtime | Node.js | 20+ |
| Dil | TypeScript (strict) | 5+ |
| Framework | Express.js | v5.2 |
| ORM | TypeORM | v1.0 |
| Veritabanı | PostgreSQL | 16 |
| Kuyruk | BullMQ + Redis | v5 / 7 |
| Auth | jsonwebtoken + custom TOTP | RFC 6238 |
| Validation | Zod | v4 |
| API Docs | swagger-jsdoc + swagger-ui-express | OpenAPI 3.0.3 |
| PDF | PDFKit | — |
| Excel | ExcelJS | — |
| E-posta | Nodemailer | — |
| Logger | Winston | — |

---

## Proje Yapısı

```
tele_drive_API/
├── src/
│   ├── common/
│   │   ├── errors/
│   │   │   ├── AppError.ts                    # Özel HTTP hata sınıfı
│   │   │   └── error-handler.middleware.ts    # Global Express hata yakalama
│   │   └── utils/
│   │       ├── logger.ts                      # Winston logger (JSON format)
│   │       ├── mailer.ts                      # Nodemailer (graceful fail)
│   │       └── totp.ts                        # RFC 6238 TOTP (custom impl.)
│   ├── config/
│   │   ├── env.ts                             # Zod ile env doğrulama
│   │   ├── database.ts                        # TypeORM DataSource
│   │   ├── redis.ts                           # IORedis bağlantısı
│   │   └── swagger.ts                         # OpenAPI 3.0.3 spec (swagger-jsdoc)
│   ├── jobs/
│   │   ├── queues.ts                          # BullMQ Queue tanımları
│   │   ├── processors/
│   │   │   ├── generate-report.ts             # PDF + Excel üretimi
│   │   │   ├── send-fault-alert.ts            # Sensör arıza bildirimi
│   │   │   └── send-threshold-alert.ts        # Batarya/hız eşiği bildirimi
│   │   └── workers/
│   │       ├── report.worker.ts               # Rapor worker'ı (concurrency: 2)
│   │       └── notification.worker.ts         # Bildirim worker'ı (concurrency: 5)
│   ├── middleware/
│   │   ├── authenticate.ts                    # JWT doğrulama
│   │   ├── authorize.ts                       # RBAC rol kontrolü
│   │   ├── api-key-auth.ts                    # X-Api-Key doğrulama
│   │   ├── validate.ts                        # Zod body/query validation
│   │   └── rate-limit.ts                      # Rate limiter'lar
│   ├── modules/
│   │   ├── auth/                              # Kayıt, giriş, 2FA, token rotasyonu (6 dosya)
│   │   ├── vehicles/                          # Araç CRUD, eşik yönetimi, API key (6 dosya)
│   │   ├── telemetry/                         # Telemetri alımı, sorgulama, stats (5 dosya)
│   │   ├── sensors/                           # Sensör alımı, arıza tespiti, tip filtresi (5 dosya)
│   │   ├── reports/                           # Rapor iş yönetimi, sayfalama (4 dosya)
│   │   ├── users/                             # Kullanıcı yönetimi (fleet_manager) (5 dosya)
│   │   └── dashboard/                         # Filo özet istatistikleri (3 dosya)
│   ├── app.ts                                 # Express app, middleware, Swagger UI, landing page
│   └── main.ts                                # Bootstrap, worker başlatma, graceful shutdown
├── scripts/
│   └── gen-docx-v2.mjs                        # Teknik doküman üretici
├── .env.example                               # Örnek ortam değişkenleri
├── .gitignore
├── docker-compose.yml                         # PostgreSQL + Redis
├── postman_collection.json                    # 29 endpoint, 6 klasör
├── TeleDrive_API_Teknik_Dokuman_v2.docx       # Teknik tasarım dokümanı
├── tsconfig.json
└── package.json
```

---

## Kurulum

### Gereksinimler

- Node.js >= 20
- Docker & Docker Compose

### 1. Repoyu Klonla

```bash
git clone https://github.com/<kullanici>/tele-drive-api.git
cd tele-drive-api
```

### 2. Bağımlılıkları Yükle

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarla

```bash
cp .env.example .env
```

`.env` dosyasını aç ve aşağıdaki değerleri doldur:

| Değişken | Açıklama |
|----------|----------|
| `JWT_SECRET` | En az 64 karakterlik rastgele string (zorunlu) |
| `DB_PORT` | Docker kullanıyorsan `5433`, aksi halde `5432` |
| `SMTP_*` | E-posta bildirimleri için (isteğe bağlı — yoksa uygulama çalışmaya devam eder) |

### 4. Docker ile Altyapıyı Başlat

```bash
docker compose up -d
# PostgreSQL → localhost:5433
# Redis      → localhost:6379
```

### 5. Geliştirme Sunucusunu Başlat

```bash
npm run dev
# → http://localhost:3000
# → http://localhost:3000/api/docs  (Swagger UI)
```

### Üretim Derlemesi

```bash
npm run build
node dist/main.js
```

---

## API Dokümantasyonu

Sunucu ayağa kalktıktan sonra interaktif Swagger UI'a erişin:

```
http://localhost:3000/api/docs
```

Sağ üstteki **Authorize** butonuna JWT token'ınızı (`Bearer <token>`) veya API anahtarınızı girin — tüm endpoint'leri doğrudan tarayıcıdan test edebilirsiniz.

**Temel URL:** `http://localhost:3000/api`

Tüm yanıtlar şu formattadır:
```json
{ "status": "success" | "error", "data": { ... } }
```

---

## Endpoint Özeti

### Genel

| Metod | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| `GET` | `/` | Landing page — API bilgisi ve endpoint listesi | — |
| `GET` | `/health` | Sağlık kontrolü | — |
| `GET` | `/api/docs` | Swagger UI (interaktif dokümantasyon) | — |

**Landing Page Yanıtı:**
```json
{
  "name": "TeleDrive API",
  "version": "1.0.0",
  "status": "🟢 online",
  "endpoints": {
    "auth":      "/api/auth",
    "vehicles":  "/api/vehicles",
    "telemetry": "/api/telemetry",
    "sensors":   "/api/sensors",
    "reports":   "/api/reports",
    "dashboard": "/api/dashboard",
    "users":     "/api/users",
    "docs":      "/api/docs"
  }
}
```

---

### Auth — `/api/auth`

| Metod | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| `POST` | `/register` | Yeni kullanıcı kaydı | — |
| `POST` | `/login` | Giriş yap | — |
| `POST` | `/refresh` | Access token yenile | — |
| `POST` | `/logout` | Oturumu kapat | JWT |
| `GET`  | `/me` | Aktif kullanıcı bilgisi | JWT |
| `POST` | `/2fa/setup` | TOTP QR kodu üret | JWT |
| `POST` | `/2fa/enable` | TOTP'yi aktifleştir | JWT |
| `POST` | `/2fa/verify` | TOTP kodunu doğrula | Pre-auth JWT |

**Register:**
```json
POST /api/auth/register
{
  "email": "admin@teledrive.io",
  "password": "Admin1234!",
  "role": "fleet_manager"
}
```
> Şifre: min 8 karakter, en az 1 büyük harf, en az 1 rakam

**Login Yanıtı (2FA'sız):**
```json
{
  "data": {
    "preAuthToken": "eyJ...",
    "refreshToken": "eyJ...",
    "totpRequired": false
  }
}
```
> `totpRequired: false` ise `preAuthToken` doğrudan tüm korumalı endpoint'lerde `Bearer` token olarak kullanılabilir.

**Login Yanıtı (2FA'lı):**
```json
{ "data": { "preAuthToken": "eyJ...", "totpRequired": true } }
```
Ardından: `POST /2fa/verify` — `Authorization: Bearer <preAuthToken>` + `{ "token": "123456" }`

---

### Araçlar — `/api/vehicles`

| Metod | Yol | Açıklama | Rol |
|-------|-----|----------|-----|
| `GET` | `/` | Araçları listele (sayfalama + filtre) | Tüm JWT |
| `POST` | `/` | Araç oluştur | fleet_manager |
| `GET` | `/:id` | Araç detayı | Tüm JWT |
| `PATCH` | `/:id` | Araç güncelle | fleet_manager |
| `DELETE` | `/:id` | Araç sil | fleet_manager |
| `GET` | `/:id/status` | Anlık durum | Tüm JWT |
| `POST` | `/:id/rotate-api-key` | API anahtarı yenile | fleet_manager |

**Araç Oluştur:**
```json
POST /api/vehicles
Authorization: Bearer <accessToken>
{
  "plate": "34TDR001",
  "model": "Tesla Model 3",
  "assignedEngineerId": "uuid (isteğe bağlı)"
}
```
> Yanıtta `apiKey` alanı bulunur — **yalnızca bir kez gösterilir, güvenli saklayın.**

**Araç Güncelle (eşik değerleri dahil):**
```json
PATCH /api/vehicles/:id
{
  "lowBatteryThreshold": 25,
  "maxSpeedThreshold": 120
}
```
> `maxSpeedThreshold: null` → hız kontrolü devre dışı

**`GET /` Query Parametreleri:**

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `status` | string | `active` \| `idle` \| `fault` \| `offline` |
| `model` | string | Model adına göre filtre |
| `limit` | integer | Sayfa boyutu (varsayılan: 20, maks: 100) |
| `offset` | integer | Sayfa başlangıcı (varsayılan: 0) |

**Yanıt:**
```json
{
  "data": {
    "vehicles": [...],
    "total": 47,
    "limit": 20,
    "offset": 0
  }
}
```

---

### Telemetri — `/api/telemetry` & `/api/vehicles/:id/telemetry`

| Metod | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| `POST` | `/api/telemetry` | Veri gönder (araç) | X-Api-Key |
| `GET` | `/api/vehicles/:id/telemetry` | Zaman aralığı sorgusu | JWT |
| `GET` | `/api/vehicles/:id/telemetry/latest` | Son kayıt | JWT |
| `GET` | `/api/vehicles/:id/telemetry/stats` | Hız/batarya istatistikleri | JWT |

**Telemetri Gönder:**
```json
POST /api/telemetry
X-Api-Key: td_abc123...
{
  "speed": 72.5,
  "latitude": 41.015137,
  "longitude": 28.979530,
  "batteryLevel": 84.3,
  "recordedAt": "2026-06-05T10:00:00Z"
}
```

> ⚠️ Telemetri alındığında eşik kontrolü yapılır:
> - `batteryLevel < lowBatteryThreshold` → `low_battery` uyarısı kuyruğa alınır
> - `speed > maxSpeedThreshold` → `high_speed` uyarısı kuyruğa alınır
> - Araç `FAULT` durumundaysa statüsü `ACTIVE`/`IDLE`'a düşürülmez

**Sorgulama Query Parametreleri:**

| Parametre | Tip | Varsayılan | Kural |
|-----------|-----|-----------|-------|
| `from` | ISO 8601 string | Son 24 saat | `datetime()` formatı zorunlu |
| `to` | ISO 8601 string | Şimdi | `datetime()` formatı zorunlu |
| `limit` | sayı string | 100 | Maks: 1000 |
| `offset` | sayı string | 0 | Sayfalama |

---

### Sensörler — `/api/sensors` & `/api/vehicles/:id/sensors`

| Metod | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| `POST` | `/api/sensors` | Sensör verisi gönder | X-Api-Key |
| `GET` | `/api/vehicles/:id/sensors` | Her sensör tipinin son kaydı | JWT |
| `GET` | `/api/vehicles/:id/sensors/faults` | Sadece arızalı sensörler | JWT |
| `GET` | `/api/vehicles/:id/sensors/history` | Geçmiş kayıtlar | JWT |

**Sensör Tipleri:** `lidar` · `camera` · `radar` · `gps` · `imu`

**Sensör Durumları:** `ok` · `degraded` · `fault`

> ⚠️ `fault` durumu gönderildiğinde araç statüsü otomatik `FAULT`'a çekilir ve mühendise e-posta bildirimi kuyruğa alınır.

```json
POST /api/sensors
X-Api-Key: td_abc123...
{
  "sensorType": "camera",
  "status": "fault",
  "value": { "error": "lens_blocked" }
}
```

**`/sensors/history` Query Parametreleri:**

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `from` / `to` | ISO 8601 datetime | Zaman aralığı (isteğe bağlı) |
| `sensorType` | string | `lidar` \| `camera` \| `radar` \| `gps` \| `imu` — tip filtresi |
| `limit` | integer | Maks: 1000 (varsayılan: 200) |

> `GET /sensors` — PostgreSQL `DISTINCT ON` ile her sensör tipinin gerçekten **en son** kaydını getirir.

---

### Raporlar — `/api/reports`

| Metod | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| `POST` | `/` | Rapor başlat (asenkron) | JWT |
| `GET` | `/` | Raporları listele (sayfalama) | JWT |
| `GET` | `/:id` | Rapor durumu | JWT |
| `GET` | `/:id/download` | Dosyayı indir | JWT |

**Rapor Tipleri:**
```json
// PDF — belirli araç için günlük sürüş raporu
{ "type": "daily_pdf", "vehicleId": "uuid", "dateFrom": "2026-06-01", "dateTo": "2026-06-05" }

// Excel — tüm filo özeti
{ "type": "fleet_excel", "dateFrom": "2026-06-01", "dateTo": "2026-06-05" }
```

**`GET /` Query Parametreleri:** `?limit=20&offset=0` (maks. 100)

**Rapor Durumları:** `pending` → `processing` → `done` / `failed`

---

### Kullanıcı Yönetimi — `/api/users`

> Tüm endpoint'ler `fleet_manager` rolü gerektirir.

| Metod | Yol | Açıklama |
|-------|-----|----------|
| `GET` | `/` | Tüm kullanıcıları listele |
| `GET` | `/:id` | Kullanıcı detayı (şifresiz) |
| `PATCH` | `/:id` | Rol güncelle |
| `DELETE` | `/:id` | Kullanıcı sil |

> Kendi hesabını silme veya kendi rolünü değiştirme girişimi `400` döner.

---

### Dashboard — `/api/dashboard`

| Metod | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| `GET` | `/` | Filo özet snapshot | JWT (her iki rol) |

**Yanıt:**
```json
{
  "data": {
    "totalVehicles": 20,
    "activeVehicles": 12,
    "faultVehicles": 3,
    "offlineVehicles": 2,
    "lowBatteryVehicles": [
      { "id": "uuid", "plate": "34TDR01", "batteryLevel": 14.2, "threshold": 20 }
    ],
    "recentFaults": [...]
  }
}
```

---

## Kimlik Doğrulama Akışları

### Standart (2FA'sız)

```
POST /register  →  kullanıcı oluşturulur
POST /login     →  preAuthToken (15dk) + refreshToken (7gün)
                         ↓ token süresi dolunca
POST /refresh   →  yeni accessToken + yeni refreshToken (rotasyon)
POST /logout    →  refreshToken geçersizleştirilir
```

### 2FA Aktivasyonu

```
POST /2fa/setup   →  { qrUri, secret }
                     QR'ı Google Authenticator / Authy ile tara
POST /2fa/enable  →  { "token": "123456" }  →  2FA aktif
```

### 2FA ile Giriş

```
POST /login      →  { preAuthToken, totpRequired: true }
POST /2fa/verify →  Bearer <preAuthToken> + { "token": "123456" }
                 →  { accessToken, refreshToken }
```

---

## Araç Veri Akışı

```
Araç Cihazı
  │
  ├── POST /api/telemetry (X-Api-Key)
  │     ├── TelemetryReading kaydedilir
  │     ├── batteryLevel < lowBatteryThreshold?
  │     │     └── BullMQ → threshold-alert (low_battery) → mühendise e-posta
  │     └── speed > maxSpeedThreshold?
  │           └── BullMQ → threshold-alert (high_speed) → mühendise e-posta
  │
  └── POST /api/sensors (X-Api-Key)
        ├── SensorReading kaydedilir
        └── status: "fault"?
              ├── Vehicle.status → FAULT
              └── BullMQ → fault-alert → mühendise e-posta
```

---

## Hız Limitleri

| Grup | Limit |
|------|-------|
| Auth (`/api/auth`) | 10 istek / 15 dakika |
| Telemetri & Sensör | 300 istek / dakika |
| Genel | 100 istek / 15 dakika |

---

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `JWT_SECRET` | En az 64 karakter — üretimde mutlaka değiştirin |
| `DB_HOST` / `DB_PORT` | PostgreSQL bağlantısı (Docker: `5433`) |
| `REDIS_HOST` / `REDIS_PORT` | Redis bağlantısı |
| `SMTP_HOST` | Yoksa bildirimler graceful olarak atlanır |
| `REPORTS_DIR` | PDF/Excel dosya dizini (varsayılan: `./tmp/reports`) |

Tüm değişkenler için `.env.example` dosyasına bakın.

---

## Postman Koleksiyonu

`postman_collection.json` dosyasını Postman'a import edin:

1. **Import** → `postman_collection.json` seç
2. **Register** → **Login** çalıştır (token otomatik kaydedilir)
3. **Create Vehicle** çalıştır (`vehicleId` + `vehicleApiKey` otomatik set edilir)
4. Tüm 29 endpoint kullanıma hazır

**Klasörler:** Auth (8) · Vehicles (7) · Telemetry (4) · Sensors (5) · Reports (4) · Users (4) · Dashboard (1)

**Collection Variables:** `baseUrl` · `accessToken` · `refreshToken` · `preAuthToken` · `vehicleId` · `vehicleApiKey` · `reportId`

---

## Teknik Notlar

### TypeORM Date Normalizasyonu

PostgreSQL `DATE` kolonları TypeORM'dan TypeScript'e `string` olarak döner:

```typescript
// YANLIŞ — TypeError atar
job.dateFrom.toISOString()

// DOĞRU
new Date(job.dateFrom).toISOString()
```

### BullMQ Bağlantısı

BullMQ kendi `ioredis` sürümünü bundle'a dahil eder. Raw connection options kullanılır:

```typescript
{ connection: { host: env.REDIS_HOST, port: env.REDIS_PORT } }
```

### Custom TOTP

`otplib` v13 Node.js 20'de API uyumsuzluğu yaratır. `src/common/utils/totp.ts` içinde RFC 6238'e uygun custom implementasyon geliştirilmiştir (Node.js `crypto` modülü, dış bağımlılık yok).

### PostgreSQL DISTINCT ON

`GET /api/vehicles/:id/sensors` — her sensör tipi için gerçekten en son kaydı getirmek üzere TypeORM query builder yerine raw SQL `DISTINCT ON (sensor_type)` kullanılır:

```sql
SELECT DISTINCT ON (sensor_type) *
FROM sensor_readings
WHERE vehicle_id = $1
ORDER BY sensor_type, recorded_at DESC
```

### Express v5 Uyumluluğu

Express v5'te `req.query` read-only getter'dır. Zod doğrulamasından gelen veri şu şekilde uygulanır:

```typescript
// req.query = result.data  ← Express v5'te hata verir
Object.assign(req.query, result.data)  // ✅ mevcut nesneyi mutate et
```

---

## Geliştirme Komutları

```bash
npm run dev       # ts-node-dev ile hot-reload geliştirme
npm run build     # TypeScript → dist/ derle
npx tsc --noEmit  # Tip kontrolü (derleme yapmadan)
```

---

## Lisans

MIT
