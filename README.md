# TeleDrive API

> **Otonom Araç Telemetri ve Filo Yönetim REST API'si**

Gerçek zamanlı telemetri verisi toplayan, sensör arızalarını izleyen, BullMQ kuyrukları üzerinden asenkron rapor üreten ve JWT + TOTP 2FA ile güvenli kimlik doğrulama sağlayan production-ready bir API.

---

## Özellikler

- **Landing Page** — `GET /` ile API bilgisi ve endpoint listesi döner
- **JWT + TOTP 2FA** — Pre-auth / full-auth iki aşamalı akış, refresh token rotasyonu (bcrypt hash)
- **API Key Auth** — Araçlar `X-Api-Key` başlığıyla veri gönderir; kullanıcılar JWT kullanır
- **RBAC** — `fleet_manager` (tam yetki) ve `engineer` (sadece okuma) rolleri
- **Telemetri & Sensör Alımı** — GPS, hız, batarya; LiDAR, kamera, radar, GPS, IMU
- **Query Param Doğrulama** — Zod v4 ile hem body hem query parametreleri doğrulanır
- **Otomatik Arıza Tespiti** — Sensör `fault` durumuna geçtiğinde araç statüsü güncellenir + BullMQ ile bildirim
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
| PDF | PDFKit | — |
| Excel | ExcelJS | — |
| E-posta | Nodemailer | — |
| Logger | Winston | — |

---

## Proje Yapısı (55 TypeScript Dosyası)

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
│   │   └── redis.ts                           # IORedis bağlantısı
│   ├── jobs/
│   │   ├── queues.ts                          # BullMQ Queue tanımları
│   │   ├── processors/
│   │   │   ├── generate-report.ts             # PDF + Excel üretimi, date normalizasyonu
│   │   │   └── send-fault-alert.ts            # E-posta bildirimi
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
│   │   ├── vehicles/                          # Araç CRUD, API key yönetimi (5 dosya)
│   │   ├── telemetry/                         # Telemetri alımı ve sorgulama (5 dosya)
│   │   ├── sensors/                           # Sensör alımı, arıza tespiti (5 dosya)
│   │   ├── reports/                           # Rapor iş yönetimi (4 dosya)
│   │   └── users/                             # User entity + repository (2 dosya)
│   ├── app.ts                                 # Express app, middleware, landing page
│   └── main.ts                                # Bootstrap, worker başlatma, graceful shutdown
├── scripts/
│   ├── gen-docx.mjs                           # Teknik doküman üretici
│   ├── gen-readme.mjs                         # README üretici
│   └── gen-postman.mjs                        # Postman koleksiyonu üretici
├── .env.example                               # Örnek ortam değişkenleri
├── .gitignore
├── docker-compose.yml                         # PostgreSQL + Redis
├── postman_collection.json                    # 28 endpoint, 5 klasör
├── TeleDrive_API_Teknik_Dokuman_v1.docx       # Teknik tasarım dokümanı
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
```

### Üretim Derlemesi

```bash
npm run build
node dist/main.js
```

---

## API Referansı

**Temel URL (yerel):** `http://localhost:3000/api`

Tüm yanıtlar şu formattadır:
```json
{ "status": "success" | "error", "data": { ... } }
```

---

### Genel Endpoint'ler

| Metod | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| `GET` | `/` | Landing page — API bilgisi ve endpoint listesi | — |
| `GET` | `/health` | Sağlık kontrolü | — |

**Landing Page Yanıtı:**
```json
{
  "name": "TeleDrive API",
  "description": "Otonom Araç Telemetri ve Filo Yönetim REST API",
  "version": "1.0.0",
  "status": "🟢 online",
  "timestamp": "2026-06-05T10:00:00.000Z",
  "endpoints": {
    "auth": "/api/auth",
    "vehicles": "/api/vehicles",
    "telemetry": "/api/telemetry",
    "sensors": "/api/sensors",
    "reports": "/api/reports"
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
| `GET` | `/` | Araçları listele | Tüm JWT |
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
Yanıtta `apiKey` alanı bulunur — **yalnızca bir kez gösterilir, güvenli saklayın.**

**Query Parametreleri (`GET /`):**
- `status` — `active` | `idle` | `fault` | `offline`
- `model` — model adına göre filtrele

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

**Sorgulama Query Parametreleri** (Zod ile doğrulanır):

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
| `GET` | `/api/vehicles/:id/sensors` | Tüm sensörler | JWT |
| `GET` | `/api/vehicles/:id/sensors/faults` | Arızalı sensörler | JWT |
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

**`/sensors/history` Query Parametreleri** (Zod ile doğrulanır):
- `from` / `to` — ISO 8601 datetime string (isteğe bağlı)

---

### Raporlar — `/api/reports`

| Metod | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| `POST` | `/` | Rapor başlat | JWT |
| `GET` | `/` | Raporları listele | JWT |
| `GET` | `/:id` | Rapor durumu | JWT |
| `GET` | `/:id/download` | Dosyayı indir | JWT |

**Rapor Tipleri:**

```json
// PDF — belirli araç için günlük sürüş raporu
{
  "type": "daily_pdf",
  "vehicleId": "uuid",
  "dateFrom": "2026-06-01",
  "dateTo": "2026-06-05"
}

// Excel — tüm filo özeti
{
  "type": "fleet_excel",
  "dateFrom": "2026-06-01",
  "dateTo": "2026-06-05"
}
```

**Rapor Durumları:** `pending` → `processing` → `done` / `failed`

> `done` olduğunda `GET /:id/download` ile dosyayı indirin.

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
  ├── POST /api/telemetry (X-Api-Key)  →  TelemetryReading kaydedilir
  │
  └── POST /api/sensors  (X-Api-Key)  →  SensorReading kaydedilir
              │
              └── status: "fault"?
                    ├── Vehicle.status → FAULT
                    └── BullMQ → notifications queue
                                    └── Nodemailer → mühendise e-posta
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

Tüm değişkenler için `.env.example` dosyasına bakın.

**Kritik Değişkenler:**

| Değişken | Açıklama |
|----------|----------|
| `JWT_SECRET` | En az 64 karakter — üretimde mutlaka değiştirin |
| `DB_PORT` | Docker: `5433`, yerel PostgreSQL yoksa: `5432` |
| `SMTP_HOST` | Yoksa bildirimler graceful olarak atlanır, uygulama çalışmaya devam eder |
| `REPORTS_DIR` | PDF/Excel dosyalarının kaydedileceği klasör (varsayılan: `./tmp/reports`) |

---

## Postman Koleksiyonu

`postman_collection.json` dosyasını Postman'a import edin:

1. **Import** → `postman_collection.json` seç
2. **Register** → **Login** çalıştır (token otomatik kaydedilir)
3. **Create Vehicle** çalıştır (`vehicleId` + `vehicleApiKey` otomatik set edilir)
4. Tüm 28 endpoint kullanıma hazır

**Klasörler:** Auth (8) · Vehicles (7) · Telemetry (4) · Sensors (5) · Reports (5)

**Collection Variables:** `baseUrl` · `accessToken` · `refreshToken` · `preAuthToken` · `vehicleId` · `vehicleApiKey` · `reportId`

---

## Teknik Notlar

### TypeORM Date Normalizasyonu

PostgreSQL `DATE` kolonları TypeORM'dan TypeScript'e `string` olarak döner. Bu nedenle rapor processor'da `.toISOString()` doğrudan çağrılmaz:

```typescript
// YANLIŞ — TypeError atar
job.dateFrom.toISOString()

// DOĞRU — normalize et
new Date(job.dateFrom).toISOString()
```

### BullMQ Bağlantısı

BullMQ kendi `ioredis` sürümünü bundle'a dahil eder. Dışarıdan `Redis` instance geçmek tip çakışması yaratır. Bu yüzden raw connection options kullanılır:

```typescript
{ connection: { host: env.REDIS_HOST, port: env.REDIS_PORT } }
```

### Custom TOTP

`otplib` v13 Node.js 20'de API uyumsuzluğu nedeniyle kullanılamadığından `src/common/utils/totp.ts` içinde RFC 6238'e uygun custom implementasyon geliştirilmiştir. Node.js `crypto` modülü kullanılır, dış bağımlılık yoktur.

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
