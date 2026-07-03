# 00 · START HERE — Odak Haritası / Focus Map

> **Amaç / Purpose:** Bu repo zamanla birçok aracı bir araya getirdi ve bu yüzden
> dikkat dağıtıcı olabiliyor. Bu sayfa hiçbir şeyi silmez — sadece "neyin ne işe
> yaradığını ve ne zaman ona bakmam gerektiğini" tek bir yerde toplayan **ek bir
> yönlendirme katmanıdır**. Numaralı `docs/` setinin (bkz. [docs/README.md](./README.md))
> önüne konan bir giriş kapısıdır, onun yerine geçmez.
>
> This is an additive orientation layer. It deletes nothing; it just answers
> "what is each piece for, and when do I actually need it?" so you can focus on
> one subsystem at a time.

---

## 1. Tek cümlede proje / The project in one line

Kendi sunucunda çalışan, WhatsApp'ı REST API + WebSocket olayları üzerinden açan,
dashboard'lu, eklenti ve AI-agent (MCP) destekli açık kaynak **WhatsApp API Gateway**.

## 2. "Şimdi ne yapmak istiyorum?" → nereye bak

| İhtiyacın (ne yapmak istiyorsun?) | Başlangıç noktası |
| --------------------------------- | ----------------- |
| Sadece çalıştırıp mesaj göndermek | `README.md` → Quick Start · `docs/07-api-collection.md` |
| Ortamı/`.env` ayarlamak | `.env.minimal` (en az) · `.env.example` (tümü) · `docs/10-devops-infrastructure.md` |
| Docker ile kurmak | `docker-compose.yml` (prod) · `docker-compose.dev.yml` (dev) · `docs/10-devops-infrastructure.md` |
| REST endpoint'lerini öğrenmek | `docs/06-api-specification.md` + Swagger `/api/docs` |
| Kod yazmak / katkı vermek | `CLAUDE.md` (§2–§5) · `docs/08-development-guidelines.md` |
| Mimariyi anlamak | `docs/03-system-architecture.md` |
| WhatsApp motorunu değiştirmek | `ENGINE_TYPE` · `src/engine/` · `docs/03-system-architecture.md` |
| Eklenti yazmak | `docs/19-plugin-architecture.md` · `docs/23-plugin-sandboxing.md` |
| AI agent'a bağlamak (Claude/Cursor) | `README.md` → MCP · `docs/24-mcp-integration.md` |
| n8n ile otomasyon | `docs/22-n8n-integration.md` · `docs/examples/n8n-appointment-booking.md` |
| Webhook kurmak/doğrulamak | `docs/examples/webhook-signature-verification.md` · API spec |
| SDK kullanmak | `sdk/README.md` (java · javascript · php · python) |
| Sorun gidermek | `docs/12-troubleshooting-faq.md` · `docs/11-operational-runbooks.md` |
| Veritabanı/veri taşımak | `docs/05-database-design.md` · `docs/14-migration-guide.md` |
| Ölçeklemek | `docs/13-horizontal-scaling.md` |

## 3. Bu repodaki "araçlar" — her biri ayrı bir kutu

Bir konuya odaklanırken **diğerlerini görmezden gel.** Hepsi opsiyoneldir; minimal
kurulum (SQLite + yerel depolama) her şeyi kapatınca da çalışır.

| Araç / Tool | Ne işe yarar | Nerede | Varsayılan |
| ----------- | ------------ | ------ | ---------- |
| **Core Gateway** | Sessions, messages, groups, contacts, webhooks — ürünün kalbi | `src/modules/*` | Açık |
| **Engine katmanı** | WhatsApp backend'i (wwebjs / Baileys) | `src/engine`, `src/plugins/engines` | `whatsapp-web.js` |
| **Dashboard** | React yönetim arayüzü | `dashboard/` | API ile aynı portta |
| **Plugins + Sandbox** | Davranışı izole worker'larla genişletme | `src/core/plugins` | Opt-in |
| **MCP Server** | AI agent'ların WhatsApp'ı sürmesi | `src/modules/mcp`, `src/core/agent-tools` | `MCP_ENABLED=false` |
| **Integration Fabric** | Gelen (inbound) webhook altyapısı | `src/modules/integration` | Opt-in |
| **Queue** | BullMQ ile webhook retry | `src/modules/queue` | `QUEUE_ENABLED=false` |
| **n8n nodes** | İş akışı otomasyonu | bkz. `docs/22` | Harici |
| **SDK'ler** | 4 dilde istemci | `sdk/` | Harici |
| **Metrics/Audit/Stats** | Gözlemlenebilirlik ve denetim | `src/modules/{metrics,audit,stats}` | Açık (hafif) |

## 4. Dikkat dağınıklığına karşı çalışma disiplini / Focus rules

- **Tek seferde tek kutu.** Yukarıdaki tablodan bir satır seç; o oturumda sadece
  onunla ilgilen. Diğer alt sistemler opt-in olduğu için onları düşünmen gerekmez.
- **Minimal ile başla.** Yeni bir şey denerken `.env.minimal` + SQLite ile başla;
  Redis/Postgres/S3/MCP'yi ancak gerçekten gerekince aç.
- **Additive kal.** Bir şeyi "temizlemek" için silme; mevcut davranışı bozma.
  Yeni yetenekler de opt-in olmalı (bu reponun kuralı bu).
- **Referansı takip et, kopyalama.** Bu sayfa sadece yönlendirir; gerçek ayrıntı
  her zaman numaralı `docs/` dosyalarında ve kodda.

## 5. Hızlı komutlar / Quick commands

```bash
npm install            # kurulum (dashboard dahil)
npm run dev            # API + dashboard, hot reload
npm run lint           # lint  ·  npm run format  # biçimlendir
npm test               # unit  ·  npm run test:e2e  # e2e
docker compose up -d   # prod (API + bundled dashboard, port 2785)
```

Detaylar ve tüm komutlar: [`CLAUDE.md`](../CLAUDE.md) §2.

---

<div align="center">

**Sonraki adım / Next:** ihtiyacına göre §2 tablosundan bir satır seç · tam indeks: [docs/README.md](./README.md)

</div>
