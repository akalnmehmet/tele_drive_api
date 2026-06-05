# TeleDrive API

> **Otonom Araç Telemetri ve Filo Yönetim REST API'si**

Gerçek zamanlı telemetri verisi toplayan, sensör arızalarını izleyen, BullMQ kuyrukları üzerinden asenkron rapor üreten ve JWT + TOTP 2FA ile güvenli kimlik doğrulama sağlayan production-ready bir API.

---

## Özellikler

- **JWT + TOTP 2FA** — Pre-auth / full-auth iki aşamalı akış, refresh token rotasyonu (bcrypt hash)
- **API Key Auth** — Araçlar `X-Api-Key` başlığıyla veri gönderir; kullanıcılar JWT kullanır
- **RBAC** — `fleet_manager` (tam yetki) ve `engineer` (sadece okuma) rolleri
- **Telemetri & Sensör Alımı** — GPS, hız, batarya; LiDAR, kamera, radar, IMU
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

## Proje Yapısı

```
tele_drive_API/
├── src/
│   ├── common/
│   │   └── utils/
│   │       ├── logger.ts              # Winston logger
│   │       ├── totp.ts                # RFC 6238 TOTP (custom impl.)
│   │       └── app-error.ts           # Özel hata sınıfı
│   ├── config/
│   │   ├── env.ts                     # Zod ile env doğrulama
│   │   ├── database.ts                # TypeORM DataSource
│   │   └── redis.ts                   # IORedis bağlantısı
│   ├── jobs/
│   │   ├── queues.ts                  # BullMQ Queue tanımları
│   │   ├── processors/
│   │   │   ├── generate-report.ts     # PDF + Excel üretimi
│   │   │   └── send-fault-alert.ts    # E-posta bildirimi
│   │   └── workers/
│   │       ├── report.worker.ts       # Rapor worker'ı
│   │       └── notification.worker.ts # Bildirim worker'ı
│   ├── middleware/
│   │   ├── authenticate.ts            # JWT doğrulama
│   │   ├── authorize.ts               # RBAC rol kontrolü
│   │   ├── api-key-auth.ts            # X-Api-Key doğrulama
│   │   ├── validate.ts                # Zod body/query validation
│   │   ├── rate-limit.ts              # Rate limiter'lar
│   │   └── error-handler.ts           # Global hata yakalama
│   ├── modules/
│   │   ├── auth/                      # Kayıt, giriş, 2FA, token rotasyonu
│   │   ├── vehicles/                  # Araç CRUD, API key yönetimi
│   │   ├── telemetry/                 # Telemetri alımı ve sorgulama
│   │   ├── sensors/                   # Sensör alımı, arıza tespiti
│   │   ├── reports/                   # Rapor iş yönetimi
│   │   └── users/                     # User entity
│   ├── app.ts                         # Express app kurulumu
│   └── main.ts                        # Bootstrap, worker başlatma
├── .env.example                       # Örnek ortam değişkenleri
├── docker-compose.yml                 # PostgreSQL + Redis
├── postman_collection.json            # Hazır Postman koleksiyonu
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
| `SMTP_*` | E-posta bildirimleri için (isteğe bağlı) |

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

**Temel URL:** `http://localhost:3000/api`

Tüm yanıtlar şu formattadır:
```json
{ "status": "success" | "error", "data": { ... } }
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
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "totpRequired": false
  }
}
```

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

**Sorgulama Query Parametreleri:**
- `from` / `to` — ISO 8601 tarih (varsayılan: son 24 saat)
- `limit` — maks kayıt sayısı (varsayılan: 100, maks: 1000)
- `offset` — sayfalama

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

---

## Kimlik Doğrulama Akışları

### Standart (2FA'sız)

```
POST /register  →  kullanıcı oluşturulur
POST /login     →  accessToken (15dk) + refreshToken (7gün)
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
                                    └── E-posta: mühendise bildirim
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
| `SMTP_HOST` | Yoksa bildirimler graceful olarak atlanır |
| `REPORTS_DIR` | PDF/Excel dosyalarının kaydedileceği klasör |

---

## Postman Koleksiyonu

`postman_collection.json` dosyasını Postman'a import edin:

1. **Import** → `postman_collection.json` seç
2. **Register** → **Login** çalıştır (token otomatik kaydedilir)
3. **Create Vehicle** çalıştır (`vehicleId` + `vehicleApiKey` otomatik set edilir)
4. Tüm 28 endpoint kullanıma hazır

**Collection Variables:** `baseUrl` · `accessToken` · `refreshToken` · `preAuthToken` · `vehicleId` · `vehicleApiKey` · `reportId`

---

## Geliştirme Komutları

```bash
npm run dev      # ts-node-dev ile hot-reload geliştirme
npm run build    # TypeScript → dist/ derle
```

---

## Lisans

MIT
