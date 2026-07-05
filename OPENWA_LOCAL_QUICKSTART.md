# OpenWA Local Setup — Hızlı Başlangıç

Bu kılavuz yerel makinada OpenWA + WhatsApp + Slack agentic bridge'i çalıştırmak için adımları içerir.

## Gereksinimler

- **Node.js 22 LTS** veya üzeri (https://nodejs.org)
- **npm 10+**
- **Chromium** (whatsapp-web.js için; Puppeteer otomatik indirir)
- **WhatsApp hesabı** (telefon ile QR tarama için)
- **Slack OAuth token** (agentic komutlar için; opsiyonel)

## Kurulum Adımları

### 1. Repository'yi klonla ve bağımlılıkları yükle

```bash
git clone https://github.com/zekk-s/openwa.git
cd openwa
npm install
```

### 2. `.env` dosyasını oluştur

Repo kökünde `.env` oluştur (`.env.minimal` şablonundan):

```bash
cp .env.minimal .env
```

Sonra `.env`'yi aç ve şu değerleri ekle/güncelle:

```env
# Server
PORT=2785
NODE_ENV=development

# Database (SQLite — yerel, dosya tabanlı)
DATABASE_TYPE=sqlite
DATABASE_NAME=./data/openwa.sqlite
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=false

# WhatsApp Engine (wwebjs + Chromium)
ENGINE_TYPE=whatsapp-web.js
SESSION_DATA_PATH=./data/sessions
PUPPETEER_HEADLESS=true
# PUPPETEER_EXECUTABLE_PATH is auto-detected; set if Chromium is in non-standard location

# Webhook (opsiyonel, testler için)
WEBHOOK_TIMEOUT=10000
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY=5000

# Storage (yerel dosya sistemi)
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./data/media

# Redis & Queue (minimal setup için off)
REDIS_ENABLED=false
QUEUE_ENABLED=false
CACHE_ENABLED=false

# Persistent admin API key (güvenli sakla)
API_MASTER_KEY=owa_k1_YOUR_OWN_GENERATED_KEY_HERE
```

> **API_MASTER_KEY hakkında:** Eğer kendi anahtarını üretmek istersen:
> ```bash
> npm run generate-api-key
> ```
> Komutunu çalıştır ve çıktıdaki değeri kopyala.

### 3. OpenWA'yı başlat

Dev modu (hot reload, dashboard bundled):

```bash
npm run dev
```

Veya API'yi ayrı başlat:

```bash
npm run start:dev
```

**Bekleme süresi:** İlk başlangıç 20–30 saniye alabilir (SQLite oluşturma, migrations, etc).

Server hazır olunca:
```
[Nest] ... - 07/04/2026, 2:45:00 PM     LOG [NestFactory] Application successfully started
```

### 4. Dashboard'a eriş

Tarayıcı açıp git:
```
http://localhost:2785
```

Dashboard'da **Sessions** sekmesine git → **+ Create** → WhatsApp oturumu oluştur.

### 5. WhatsApp'ı telefonunla bağla

Oluşturulan oturum QR kodunu gösterecek. **WhatsApp mobil uygulaması** aç:
- iOS/Android: **Settings** → **Linked devices** → **Link a device**
- QR kodunu tara

30 saniye içinde oturum "**ready**" durumuna geçmeli.

### 6. Test et

**Dashboard'da test mesajı gönder:**
- Sessions sekmesinden oturumu seç
- "Send Message" butonu → numaraya ve metne gir → Gönder
- Telefonunda mesajı alırsın

**Slack agentic bridge (opsiyonel):**
- MCP_ENABLED=true ekle `.env`'ye
- Slack OAuth token ekle (Claude Claude Code Slack connector)
- Slack DM'ye WhatsApp komutları gönder

---

## Ortam Değişkenleri — Tamam Referans

| Değişken | Açıklama | Örnek |
|---|---|---|
| `PORT` | API + Dashboard port | `2785` |
| `NODE_ENV` | Ortam modu | `development` / `production` |
| `DATABASE_TYPE` | Veritabanı | `sqlite` / `postgres` |
| `DATABASE_NAME` | SQLite dosya yolu | `./data/openwa.sqlite` |
| `ENGINE_TYPE` | WhatsApp motoru | `whatsapp-web.js` / `baileys` |
| `SESSION_DATA_PATH` | Oturum dosyaları deposu | `./data/sessions` |
| `PUPPETEER_HEADLESS` | Chromium UI olmadan | `true` |
| `PUPPETEER_EXECUTABLE_PATH` | Chromium konumu | `/usr/bin/chromium` |
| `STORAGE_TYPE` | Media depolama | `local` / `s3` / `minio` |
| `STORAGE_LOCAL_PATH` | Yerel media klasörü | `./data/media` |
| `REDIS_ENABLED` | Redis cache | `false` |
| `QUEUE_ENABLED` | BullMQ webhook retry queue | `false` |
| `CACHE_ENABLED` | Bellek cache | `false` |
| `API_MASTER_KEY` | Admin API anahtarı (güvenli sakla!) | `owa_k1_...` |
| `MCP_ENABLED` | MCP agent server (opsiyonel) | `false` / `true` |

---

## Sorun Giderme

### "Cannot find Chromium" hatası
- **Çözüm:** Puppeteer'ı yeniden yükle:
  ```bash
  npm install --force
  npx puppeteer install
  ```
- Veya elle Chromium yolunu `.env`'ye ekle:
  ```env
  PUPPETEER_EXECUTABLE_PATH=/opt/homebrew/bin/chromium  # macOS
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium            # Linux
  ```

### SQLite kilitli ("database is locked")
- **Çözüm:** Başka bir OpenWA instance çalışıyor olabilir:
  ```bash
  lsof -i :2785  # Port 2785'i kullanana bak
  kill -9 <PID>
  ```

### WhatsApp QR timeout
- **Çözüm:** Tarama süresi varsayılan 60 saniye; timeout olursa yeniden oluştur
- Dashboard → Sessions → sıfırla → QR yeniden göster

### Database migration errors
- **Çözüm:** Migrations'ı el ile çalıştır:
  ```bash
  npm run migration:run
  ```

---

## Docker'da Çalıştır (opsiyonel)

```bash
docker-compose up -d
```

Varsayılan port: `2785` → `http://localhost:2785`

---

## Sonraki Adımlar

- **API Docs:** http://localhost:2785/api/docs → Swagger UI → tüm endpoint'ler
- **Webhook'ları ayarla:** Sessions sekmesinde webhook URL + event filtresi (message.received, etc.)
- **Slack agentic bridge:** README.md → MCP section
- **Yardım:** Docs klasörü → `docs/00-START-HERE.md`

---

**Versiyon:** OpenWA 1.x · **Node.js:** 22 LTS · **Framework:** NestJS 11
