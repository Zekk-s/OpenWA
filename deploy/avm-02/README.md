# OpenWA — avm-02 Kalıcı Kurulum

avm-02 üzerinde, mevcut reverse proxy (n8n.* / mcp.* gibi subdomain'lerin arkasındaki
Traefik veya Nginx Proxy Manager) ile birlikte **kalıcı** OpenWA kurulumu.
Ana `docker-compose.yml` değişmez; bu klasördeki override dosyası üzerine biner.

## Kurulum (avm-02'de, ~5 dakika)

```bash
# 1) Klonla
git clone https://github.com/Zekk-s/OpenWA.git
cd OpenWA

# 2) .env oluştur ve anahtarı üret
cp deploy/avm-02/.env.example .env
sed -i "s/owa_k1_CHANGE_ME/owa_k1_$(openssl rand -hex 32)/" .env
# İhtiyaca göre düzenle: PROXY_NETWORK, WA_DOMAIN, MCP_READONLY
nano .env

# 3) Proxy ağı yoksa oluştur (varsa .env'de PROXY_NETWORK'e mevcut adını yaz)
docker network create proxy 2>/dev/null || true

# 4) Başlat
docker compose -f docker-compose.yml -f deploy/avm-02/docker-compose.override.yml up -d --build

# 5) Sağlık kontrolü
curl -s http://127.0.0.1:2785/api/health/ready
```

## Reverse proxy — subdomain bağlama (ör. `wa.<domain>`)

**Nginx Proxy Manager:** Yeni *Proxy Host* → Domain: `wa.<domain>` →
Forward Hostname: `openwa-api`, Port: `2785` (NPM ile OpenWA aynı `proxy` ağında
olmalı) → SSL sekmesinden Let's Encrypt.

**Traefik:** `.env`'de `TRAEFIK_ENABLE=true` ve `WA_DOMAIN=wa.<domain>` yap,
`docker compose ... up -d` ile yeniden uygula. Router etiketleri override
dosyasında hazır.

**Proxy'siz LAN erişimi:** override dosyasındaki `ports: !override` bloğunu aç
(`!override` etiketi Docker Compose **v2.24+** gerektirir — `docker compose version`
ile kontrol et).

## WhatsApp'ı bağla (tek seferlik)

1. Tarayıcı: `https://wa.<domain>` (veya `http://avm-02:2785`)
2. Dashboard'a `API_MASTER_KEY` ile gir → **Sessions** → **+ Create**
3. QR'ı telefonla tara: WhatsApp → **Ayarlar → Bağlı Cihazlar → Cihaz Bağla**
4. Oturum **ready** olunca bitti — `AUTO_START_SESSIONS=true` sayesinde
   reboot'ta otomatik geri gelir (oturum verisi `openwa_openwa-data`
   volume'ünde kalıcıdır).

## Agentic kullanım

- **MCP endpoint:** `https://wa.<domain>/mcp` — Claude / n8n MCP client buraya
  bağlanır. Kimlik: `Authorization: Bearer <API-anahtarı>`.
- **Güvenlik:** MCP varsayılan **read-only**. Mesaj gönderme gibi yazma
  araçları için `.env`'de `MCP_READONLY=false`. Agent'a `API_MASTER_KEY`
  verme — dashboard'dan oturum-kapsamlı, en fazla `OPERATOR` rollü ayrı bir
  anahtar üret ve onu kullan.
- **n8n webhook:** n8n'de bir *Webhook* node aç; URL'sini dashboard'da
  Sessions → oturum → Webhook alanına gir
  (ör. `https://n8n.<domain>/webhook/openwa`). Gelen her WhatsApp mesajı
  `message.received` event'i olarak n8n akışını tetikler.

## Güncelleme / bakım

```bash
cd OpenWA && git pull
docker compose -f docker-compose.yml -f deploy/avm-02/docker-compose.override.yml up -d --build

# Loglar
docker logs -f openwa-api

# Yedek (oturumlar + SQLite + medya tek volume'de)
docker run --rm -v openwa_openwa-data:/data -v "$PWD:/backup" alpine \
  tar czf /backup/openwa-backup-$(date +%F).tar.gz -C /data .
```
