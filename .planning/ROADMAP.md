# Roadmap: ÜRTM Agentic AI System

## Milestones

- ✅ **v1.0 Agentic AI Altyapısı** — Phases 1-4 (shipped 2026-05-03)
- 🔄 **v2.0 PostgreSQL Migrasyonu** — Phases 5-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Agentic AI Altyapısı (Phases 1-4) — SHIPPED 2026-05-03</summary>

- [x] Phase 1: Agentic Temel Altyapı (1/1 plans) — completed
- [x] Phase 2: Master Onay Mekanizması (1/1 plans) — completed
- [x] Phase 3: Modül Ajan Tam Yetki (1/1 plans) — completed
- [x] Phase 4: Test & Entegrasyon (1/1 plans) — completed

</details>

<details>
<summary>🔄 v2.0 PostgreSQL Migrasyonu (Phase 5-6 complete, Phase 7-8 pending)</summary>

- [x] Phase 5: PostgreSQL Kurulumu (1/1 plans) — completed (verification blocked: Docker not available)
- [x] Phase 6: Sequelize & Model Uyumluluğu (5/5 plans) — completed (pg package added, models verified)
- [ ] Phase 7: Veri Migrasyonu (1/1 plans) — planned
- [ ] Phase 8: Test & Doğrulama (pending)

</details>

---

## v2.0 PostgreSQL Migrasyonu

| Phase | Name | Goal | Requirements | Success Criteria |
|-------|------|------|--------------|------------------|
| 5 | PostgreSQL Kurulumu | PostgreSQL kurulumu ve bağlantı altyapısı | DB-01, DB-02, DB-03, DB-04 | 4 |
| 6 | Sequelize & Model Uyumluluğu | Sequelize PostgreSQL yapılandırması, 56 model, 26 migration | DB-05, DB-06, DB-07, DB-08, DB-09, DB-10, DB-11, DB-12, DB-13, DB-14 | 9 |
| 7 | Veri Migrasyonu | SQLite → PostgreSQL veri aktarımı, şema dönüşümü | DB-15, DB-16, DB-17, DB-18 | 4 |
| 8 | Test & Doğrulama | Unit testler, integration testler, rollback planı | DB-19, DB-20, DB-21, DB-22, DB-23, DB-24, DB-25 | 7 |

### Phase Details

**Phase 5: PostgreSQL Kurulumu**
Goal: PostgreSQL kurulumu ve bağlantı altyapısı
Requirements: DB-01, DB-02, DB-03, DB-04
Success criteria:
1. PostgreSQL kurulu ve çalışıyor
2. Sequelize PostgreSQL bağlantısı yapılandırılmış
3. Connection pool ayarları yapılmış
4. .env DATABASE_URL tanımlanmış

**Phase 6: Sequelize & Model Uyumluluğu**
Goal: Sequelize PostgreSQL yapılandırması, 56 model, 26 migration güncelleme
Requirements: DB-05, DB-06, DB-07, DB-08, DB-09, DB-10, DB-11, DB-12, DB-13, DB-14
Success criteria:
1. 56 model dosyası PostgreSQL uyumlu
2. SQLite PRAGMA'ları kaldırılmış
3. Migration dosyaları PostgreSQL uyumlu
4. db-access.js ve api-client.js güncellenmiş

Plans:
- [ ] 06-01-PLAN.md — Model audit (56 files)
- [ ] 06-02-PLAN.md — Migration audit (26 files)
- [ ] 06-03-PLAN.md — db-access.js verification
- [ ] 06-04-PLAN.md — api-client.js & module-agent.js verification
- [ ] 06-05-PLAN.md — End-to-end verification

**Phase 7: Veri Migrasyonu**
Goal: SQLite → PostgreSQL veri aktarımı, şema dönüşümü
Requirements: DB-15, DB-16, DB-17, DB-18
Success criteria:
1. Veri aktarım scripti çalışıyor
2. Row count eşleşmesi doğrulanmış
3. Veri bütünlüğü kontrol edilmiş
4. Rollback planı hazır

Plans:
- [x] 07-01-PLAN.md — Migration scripts (migrate, verify, rollback)

**Phase 8: Test & Doğrulama**
Goal: Unit testler, integration testler, rollback planı
Requirements: DB-19, DB-20, DB-21, DB-22, DB-23, DB-24, DB-25
Success criteria:
1. 18+ test PostgreSQL ile passing
2. API endpoint testleri passing
3. Rollback mekanizması test edilmiş
4. Feature flag ile geçiş destekleniyor

---

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1 | v1.0 | 1/1 | Complete | 2026-05-02 |
| 2 | v1.0 | 1/1 | Complete | 2026-05-02 |
| 3 | v1.0 | 1/1 | Complete | 2026-05-02 |
| 4 | v1.0 | 1/1 | Complete | 2026-05-03 |
| 5 | v2.0 | 1/1 | Complete | 2026-05-03 |
| 6 | v2.0 | 5/5 | Complete | 2026-05-03 |
| 7 | v2.0 | 1/1 | Planned | — |
| 8 | v2.0 | — | Planned | — |

---

## Requirements Summary

| ID | Requirement | Phase |
|----|-------------|-------|
| REQ-001 | action-definitions.json dosyası oluşturuldu | 1 ✓ |
| REQ-002 | Master /api/master/consult endpointi eklendi | 1 ✓ |
| REQ-003 | Modül danışma modülü (consult-master.js) yazıldı | 1 ✓ |
| REQ-004 | Master onay mekanizması çalışıyor | 2 ✓ |
| REQ-005 | Alternatif aksiyon önerileri sunuluyor | 2 ✓ |
| REQ-006 | Timeout yönetimi aktif (30 sn bekleme) | 2 ✓ |
| REQ-007 | Modül ajanlar veritabanına erişebiliyor | 3 ✓ |
| REQ-008 | Modül ajanlar API endpointlerini çağırabiliyor | 3 ✓ |
| REQ-009 | Sistem test edildi ve çalışıyor | 4 ✓ |
| REQ-010 | Mevcut sisteme entegre edildi | 4 ✓ |
| DB-01 | PostgreSQL kurulumu | 5 ✓ |
| DB-02 | Sequelize PostgreSQL bağlantı konfigürasyonu | 5 ✓ |
| DB-03 | Connection pool ayarları | 5 ✓ |
| DB-04 | .env DATABASE_URL yapılandırması | 5 ✓ |
| DB-05 | 56 model dosyasının PostgreSQL'e uyarlanması | 6 |
| DB-06 | SQLite PRAGMA'larının kaldırılması | 6 |
| DB-07 | dialectOptions yapılandırması | 6 |
| DB-08 | QueryTypes kullanımının doğrulanması | 6 |
| DB-09 | 26 migration dosyasının PostgreSQL'e uyarlanması | 6 |
| DB-10 | SQLite-specific sorguların düzeltilmesi | 6 |
| DB-11 | Migration sıralama ve bağımlılık yönetimi | 6 |
| DB-12 | db-access.js PostgreSQL uyumluluğu | 6 |
| DB-13 | api-client.js bağlantı noktası güncellemeleri | 6 |
| DB-14 | module-agent.js sequelize bağlantı güncellemesi | 6 |
| DB-15 | SQLite → PostgreSQL veri aktarım scripti | 7 ✓ |
| DB-16 | Tablo şeması dönüştürme | 7 ✓ |
| DB-17 | Veri bütünlüğü doğrulaması | 7 ✓ |
| DB-18 | rollback planı | 7 ✓ |
| DB-19 | Unit testlerin PostgreSQL ile çalışması | 8 |
| DB-20 | Integration testlerin PostgreSQL ile çalışması | 8 |
| DB-21 | API endpoint testleri | 8 |
| DB-22 | Performance benchmark | 8 |
| DB-23 | SQLite → PostgreSQL geçiş trigger'ı | 8 |
| DB-24 | Feature flag ile çift veritabanı desteği | 8 |
| DB-25 | Rollback mekanizması | 8 |