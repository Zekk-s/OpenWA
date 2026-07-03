# 26 · AI-Agentic WhatsApp Playbook — Aşamalı Odak Planı / Staged Focus Plan

> **Kime göre / Tailored for:** Slack ve Discord üzerinde zaten bot/app çalıştıran,
> aynı "agentic" kullanımı **WhatsApp'a** taşımak isteyen bir operatör-geliştirici.
> Amaç dağılmadan, **her aşamada neye odaklanacağını** bilerek değerli ve verimli
> bir yetenek kurmak.
>
> **What this is:** an additive, staged roadmap for building AI-agent capabilities
> on WhatsApp with OpenWA — the same pattern you already run as Slack/Discord bots,
> mapped onto OpenWA's real primitives (MCP tools, webhooks, plugins/sandbox,
> Integration Fabric, n8n). It deletes nothing and adds no code; it tells you where
> to concentrate, in what order, and what to *not* do yet.

İlgili dokümanlar: [24 · MCP Integration](./24-mcp-integration.md) ·
[19 · Plugin Architecture](./19-plugin-architecture.md) ·
[23 · Plugin Sandboxing](./23-plugin-sandboxing.md) ·
[25 · Integration Fabric](./25-integration-fabric.md) ·
[22 · n8n Integration](./22-n8n-integration.md) · odak haritası: [00 · Start Here](./00-START-HERE.md).

---

## 26.1 Zihinsel model / The mental model

Slack ya da Discord'da bir bot üç şeyden ibarettir: **(1)** bir olay gelir (event),
**(2)** agent düşünür, **(3)** bir aksiyon/mesaj döner. WhatsApp'ta OpenWA ile
**aynı üçlü** vardır; sadece parçaların adı değişir:

| Katman | Slack / Discord | OpenWA (WhatsApp) |
| ------ | --------------- | ----------------- |
| **Gelen olay (trigger)** | Events API / Gateway | Webhook olayları (`message.received`, `message.reaction`, `group.join`, `session.ready`, …) veya Integration Fabric ingress |
| **Agent'ın eli (actions)** | Web API / REST | **MCP araçları** (`POST /mcp`, ~39 curated tool) veya REST, veya bir **plugin** içinden `ctx` |
| **Giden aksiyon** | `chat.postMessage` vb. | `MessageSendText` / `MessageSendImage` / `MessageReply` / `SessionSendChatState` … |
| **Kimlik & yetki** | Bot token + scopes | API key + **role** + **per-session scope** (REST **ve** MCP aynı kapıdan geçer) |
| **Özel mantık** | Bot backend | **Plugin + sandbox** (izole worker, capability tabanlı) |

> **Tek cümle:** *Gelen = webhook/ingress · Düşünen = agent (MCP veya plugin) ·
> Giden = MCP send araçları.* Bütün aşamalar bu üçgeni sağlamlaştırmaktan ibarettir.

### İki farklı "agent" şekli — hangisini seçmeli?

| Yaklaşım | Ne zaman | Artı / Eksi |
| -------- | -------- | ----------- |
| **MCP (pull)** — Claude/Cursor gibi bir agent istemcisi `POST /mcp`'ye bağlanır | Sen/insan bir agent'ı "WhatsApp'ı sürsün" diye kullanırken; masaüstü/IDE agent'ı | En hızlı başlangıç, sıfır kod. Otonom inbound tetikleme *yok* (agent'ı sen çağırırsın). Bkz. [24](./24-mcp-integration.md) |
| **Plugin (push)** — gelen olayda kendi kodun çalışır | Otonom, olay-tetiklemeli otomasyon (auto-reply, triage) | Tam kontrol, sandbox güvenliği. Kod yazarsın. Bkz. [19](./19-plugin-architecture.md), [23](./23-plugin-sandboxing.md) |
| **Integration Fabric / webhook + dış servis** — olay dışarı gider, dış agent döner | Mevcut Slack/Discord backend'ini beyin olarak kullanmak | Var olan botunu tekrar kullanırsın; ağ/latency ekler. Bkz. [25](./25-integration-fabric.md) |
| **n8n** — düşük-kod akış | Hızlı prototip, iş akışı otomasyonu | Görsel, hızlı; karmaşık mantıkta sınırlı. Bkz. [22](./22-n8n-integration.md) |

**Öneri:** Slack/Discord botların zaten varsa, uzun vadede **beyni tek yerde** tut
(mevcut backend'in) ve WhatsApp'ı yeni bir *kanal* olarak bağla — inbound için
webhook/Fabric, outbound için MCP/REST. Böylece üç platformda tek persona, tek
politika olur (bkz. Aşama 4).

---

## 26.2 Kullanım senaryoları / Scenario catalogue

Slack/Discord'da tanıdık olan kalıpların WhatsApp karşılığı:

| # | Senaryo | Slack/Discord'daki karşılığı | OpenWA kaldıraçları |
| - | ------- | ---------------------------- | ------------------- |
| S1 | **Gözlem & özet** — gelenleri sınıflandır, günlük digest | Kanal özeti botu | `message.received` webhook → agent → Slack'e digest |
| S2 | **Triage & yönlendirme** — niyet/etiket, insana ata | Ticket routing botu | Read tools + `label` + insana hand-off |
| S3 | **Bildirim/alarm (outbound)** — sistem → WhatsApp uyarısı | Slack alert botu | `MessageSendText` (MCP/REST) |
| S4 | **Komut botu** — "!durum", "/sipariş 123" | Slash-command botu | Webhook + parse → agent → reply |
| S5 | **SSS / bilgi tabanı (RAG)** — sorulara kaynaklı yanıt | Q&A botu | Plugin/agent + RAG + `MessageReply` |
| S6 | **İnsan-onaylı yanıt** — taslak üret, onayla, gönder | Slack "approve" akışı | Read + gated write + Slack onay köprüsü |
| S7 | **Dar kapsamlı otonom yanıt** — belirli akışta tam otomatik | Sınırlı auto-responder | Smart-filtered webhook + auto-reply |
| S8 | **Çok kanallı köprü** — WhatsApp ↔ Slack/Discord tek beyin | Cross-post/bridge | Fabric/webhook + tek agent politikası |

---

## 26.3 Aşamalar / The phases

> **Odak kuralı (en önemli kısım):** Aynı anda **tek aşama.** Bir aşamanın çıkış
> kriterini karşılamadan bir sonrakine geçme. Otonomiye erken atlama en pahalı
> hatadır. Her aşama önceki aşamanın güven zeminine oturur.

### Aşama 0 — Temel & Güvenlik / Foundation & Safety

**Odak:** Herhangi bir otonomiden *önce* tek bir WhatsApp session'ını stabilize et
ve agent borularını güvenli kur. Burada mesaj göndermek yok.

**Yap:**
- Engine seç: `ENGINE_TYPE=whatsapp-web.js` (varsayılan) — Chromium yoksa `baileys`.
- Tek session'ı QR/telefon eşleştirmesiyle stabil hale getir (bkz. `docs/examples/session-phone-number-pairing.md`).
- MCP'yi **salt-okunur** aç:

  ```bash
  MCP_ENABLED=true
  MCP_READONLY=true                 # önce yalnızca okuma araçları
  MCP_RATE_LIMIT_MAX=60             # anahtar başına pencere içi tavan
  MCP_RATE_LIMIT_WINDOW_MS=60000
  ```
- Agent için **ayrı, en az yetkili, session-scoped** bir API key üret (`OPERATOR`,
  admin değil, `allowedIps` **yok** — MCP'de gerçek istemci IP'si olmadığı için
  IP kısıtlı anahtar reddedilir). Bkz. [04 · Security](./04-security-design.md),
  README → MCP.
- MCP istemcini bağla (ör. Claude Code `.mcp.json`):

  ```json
  {
    "mcpServers": {
      "openwa": {
        "type": "http",
        "url": "http://localhost:2785/mcp",
        "headers": { "Authorization": "Bearer <SESSION_SCOPED_KEY>" }
      }
    }
  }
  ```

**Çıkış kriteri:** Agent `SessionFindAll` / `SessionGetChats` ile *okuyabiliyor*,
hiçbir gönderim yapamıyor. **Yapma:** `/mcp`'yi internete açma, admin key kullanma,
write açma.

---

### Aşama 1 — Gözlem & Triage / Read-only Agent (S1, S2)

**Odak:** Sıfır gönderim riskiyle değer çıkar. Agent okur, sınıflandırır, özetler.

**Yap:**
- Read araçları: `SessionGetChats`, `MessageList`, `MessageHistory`, `ContactFindOne`,
  `MessageGetReactions`.
- Otonom besleme için **webhook** kur (`message.received`) ve gelenleri mevcut
  Slack/Discord hattına it — tıpkı Slack Events gibi:

  ```bash
  curl -X POST http://localhost:2785/api/sessions/{sessionId}/webhooks \
    -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
    -d '{"url":"https://your-backend/wa-inbound","events":["message.received"],"secret":"<hmac>"}'
  ```
  İmza doğrulaması: `docs/examples/webhook-signature-verification.md`.
- İlk somut çıktı: **günlük digest** + **lead/niyet etiketleme**, sonucu zaten
  kullandığın Slack/Discord kanalına düş.

**Çıkış kriteri:** Ölçülebilir triage (ör. mesajların %X'i otomatik kategorize).
**Köprü:** WhatsApp özetleri mevcut botlarının kanalına akıyor — tek gözlem noktası.

---

### Aşama 2 — İnsan-Onaylı Gönderim / Assisted Reply (S6)

**Odak:** Önce taslak, sonra onay. Write açılır ama arada bir insan kapısı kalır.

**Yap:**
- Yazma için **ayrı** bir anahtar/agent'ta `MCP_READONLY=false`. Agent
  `MessageSendText`/`MessageReply` *taslağı* üretir, gönderimi insan onaylar.
- Pratik köprü: agent önerilen yanıtı **Slack thread'ine** yazar; 👍 gelince senin
  Slack botun OpenWA `MessageSendText`'i çağırır. (Onay UX'in zaten var.)
- Muhafızlar: alıcı allowlist'i, sessiz saatler, `MCP_RATE_LIMIT_MAX` ile
  dakikalık tavan, her gönderimin **audit log**'a düşmesi ([04](./04-security-design.md)).

**Çıkış kriteri:** Yanıt süresi düşerken *istenmeyen* gönderim = 0.

---

### Aşama 3 — Dar Kapsamlı Otonom Yanıt / Scoped Autonomous Responder (S4, S7)

**Odak:** Tam otomatik yanıt — ama yalnızca dar, iyi tanımlı bir şeritte.

**Yap:**
- Tetik: `message.received` webhook'una **smart filter** koy; sadece belirli
  gönderen/anahtar-kelime, grup-dışı vb. tetiklesin:

  ```json
  { "conditions": [
      { "field": "isGroup", "operator": "is", "value": [false] },
      { "field": "body", "operator": "contains", "value": ["sipariş", "order"] }
  ] }
  ```
- Yanıt yolu: bir **plugin** (olay-tetiklemeli, sandbox içinde) veya dış backend →
  MCP. Yazıyor hissi için `SessionSendChatState`.
- Muhafızlar: filtreler + allow/block listeleri + **düşük güvende insana devret**
  (fallback) + audit. Kaçış kapısı olmadan otonomi açma.

**Çıkış kriteri:** Sınırlı, izlenebilir auto-reply + net insana-devir yolu.

---

### Aşama 4 — Çok Kanallı Orkestrasyon / Multi-channel Orchestration (S8)

**Odak:** WhatsApp'ı mevcut Slack + Discord botlarınla **tek agent beynine** birleştir.

**Yap:**
- Köprü: WhatsApp ↔ Slack/Discord; ortak bağlam ve bilgi tabanı, tek persona.
- Seçenekler: yapıştırıcı için **n8n** ([22](./22-n8n-integration.md)), inbound için
  **Integration Fabric** ([25](./25-integration-fabric.md)) veya bir **plugin**.
- Senaryo: üç platformda tek destek gelen-kutusu; tutarlı ton; platformlar arası
  hand-off (WhatsApp'ta başlayan konuşma Slack'te insana devrolur).

**Çıkış kriteri:** Kanaldan bağımsız tek politika/persona; çift-yanıt/çakışma yok.

---

### Aşama 5 — İleri Yetenek / Advanced Capability (S5)

**Odak:** Dayanıklı, gözlemlenebilir, genişletilebilir.

**Yap:**
- **RAG/bilgi temellendirme**; sandbox içinde **plugin tabanlı özel araçlar**;
  `MessageSendTemplate`, medya (`MessageSendImage/Document/Audio`).
- Dayanıklılık: `QUEUE_ENABLED=true` ile webhook retry (BullMQ); `metrics`/`audit`
  ile gözlemlenebilirlik; gerekiyorsa çok-session ölçek ([13](./13-horizontal-scaling.md)).
- Session başına politika: farklı numaralar için farklı persona/yetki.

**Çıkış kriteri:** Ölçülen, güvenilir, bakımı yapılabilir yetenek.

---

## 26.4 Aşama özet tablosu / Phase summary

| Aşama | Odak | Ana kaldıraç | Yazma? | Çıkış kriteri |
| ----- | ---- | ------------ | ------ | ------------- |
| 0 | Temel & güvenlik | MCP read-only + scoped key | ✗ | Okur, gönderemez |
| 1 | Gözlem & triage | Webhook + read tools | ✗ | Ölçülebilir triage |
| 2 | Onaylı yanıt | Gated write + Slack onayı | ⚠ insan-kapılı | İstenmeyen gönderim = 0 |
| 3 | Dar otonom yanıt | Smart-filtered webhook + plugin | ✓ dar | Kaçış kapılı auto-reply |
| 4 | Çok kanallı | Fabric/n8n + tek beyin | ✓ | Tek politika, çakışmasız |
| 5 | İleri | RAG + plugin + queue/metrics | ✓ | Dayanıklı & ölçülü |

---

## 26.5 Güvenlik muhafızları (her aşamada) / Guardrails

- **En az yetki:** agent anahtarı admin değil, **session-scoped**, `OPERATOR` tavanı,
  `allowedIps` yok. Rotasyon = yeni anahtar üret + eskisini sil.
- **Önce read-only:** `MCP_READONLY=true` ile başla; write'ı yalnız gerekince ve
  ayrı bir anahtarla aç.
- **Hız sınırı:** `MCP_RATE_LIMIT_MAX` / `MCP_RATE_LIMIT_WINDOW_MS` ile agent'ı sınırla.
- **İçeriye açma:** `/mcp`'yi fronting auth proxy olmadan internete **açma**
  (bugün statik API key; public exposure için OAuth 2.1 planlı). Bkz. [24](./24-mcp-integration.md).
- **Denetim:** her agent aksiyonu audit log'a düşsün; gönderimlerde allowlist +
  sessiz saatler.
- **İzolasyon:** özel mantık için plugin **sandbox**'ını kullan; capability'leri dar tut.

---

## 26.6 Dağılmamak için / Staying concentrated

Bu repo çok araç içerir ([00 · Start Here](./00-START-HERE.md)); bu playbook'un amacı
onları *aynı anda* düşünmemen. Basit kurallar:

1. **Tek aşama, tek session, tek senaryo** ile başla (öneri: S1 gözlem).
2. Çıkış kriterini yazılı tut; karşılamadan sonraki aşamaya **geçme**.
3. Minimal ile koş (SQLite + local); Redis/Postgres/S3/queue'yu ancak Aşama 5'te
   gerçekten gerekince aç.
4. Beyni tek yerde tut — üç platform (Slack/Discord/WhatsApp) tek persona, tek politika.
5. Her yeni yetenek **opt-in** olsun; mevcut davranışı bozma (bu deponun kuralı).

---

<div align="center">

**Başlangıç / Start:** Aşama 0 → MCP read-only + scoped key · tam indeks: [docs/README.md](./README.md)

</div>
