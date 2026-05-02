---
name: PROJECT.md
description: ÜRTM Takip Agentic AI System
type: project
---

# ÜRTM Takip Agentic AI Sistemi

## Vision

ÜRTM Takip manufacturing tracking systemini tamamen otonom, akıllı bir agentic AI sistemine dönüştürmek. Sahanın veri akışını izleyen, hataları otomatik düzelten, personelin ihmaklerini telafi eden ve kritik kararlarda master ajan koordinasyonuyla aksiyon alan çok ajanlı bir yapı.

## What This Is

ÜRTM Takip manufacturing tracking sistemini agentic AI sistemine dönüştüren çok ajanlı altyapı. Master agent koordinasyonu ile modül ajanların otonom aksiyon alabildiği, veritabanı ve API erişimi olan sistem.

## Core Value

Otonom karar alma — modül ajanlar kritik aksiyonları master onayı ile alır, düşük öncelikli aksiyonları otonom gerçekleştirir.

## Requirements

### Validated

- [x] REQ-001: action-definitions.json dosyası oluşturuldu — v1.0
- [x] REQ-002: Master /api/master/consult endpointi eklendi — v1.0
- [x] REQ-003: Modül danışma modülü (consult-master.js) yazıldı — v1.0
- [x] REQ-004: Master onay mekanizması çalışıyor — v1.0
- [x] REQ-005: Alternatif aksiyon önerileri sunuluyor — v1.0
- [x] REQ-006: Timeout yönetimi aktif (30 sn bekleme) — v1.0
- [x] REQ-007: Modül ajanlar veritabanına erişebiliyor — v1.0
- [x] REQ-008: Modül ajanlar API endpointlerini çağırabiliyor — v1.0
- [x] REQ-009: Sistem test edildi ve çalışıyor — v1.0
- [x] REQ-010: Mevcut sisteme entegre edildi — v1.0

### Active

(None — v1.0 shipped)

### Out of Scope

- Yeni modül dokümanları oluşturmak (mevcut olan yeterli)
- Frontend değişikliği
- Yeni veritabanı tabloları

## Context

**Shipped:** v1.0 (2026-05-03)
**Phases:** 4 | **Plans:** 4 | **Tasks:** 16
**Files created:** db-access.js, api-client.js, module-agent.js, test/*.test.js
**Test suite:** 18 tests passing (db-access, api-client, module-agent integration)
**Tech stack:** Node.js, Express, Sequelize, SQLite, Socket.IO

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| action-definitions.json ile merkezi aksiyon yönetimi | Modül ajanların hangi aksiyonları master onayı gerektirdiğini bilmesi | ✓ Validated |
| Sequelize QueryTypes kullanımı | SQL injection koruması ve type-safe database operations | ✓ Validated |
| X-Module-Agent header ile ajan kimlik doğrulama | API endpointlerinde modül ajanlarını tanımlama | ✓ Validated |
| requires_approval flag ile yüksek öncelikli aksiyonları koruma | Elevation of privilege mitigation | ✓ Validated |

## Next Milestone Goals

- Modül ajan implements (stok_kartlari, is_emirleri, tezgahlar)
- Production deployment
- Real-world testing

---
*Last updated: 2026-05-03 after v1.0 milestone*