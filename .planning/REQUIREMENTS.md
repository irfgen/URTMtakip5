---
name: REQUIREMENTS.md
description: v2.0 PostgreSQL Migration Requirements
type: requirements
---

# Requirements: v2.0 — PostgreSQL Migrasyonu

## DB-01: PostgreSQL Kurulum ve Bağlantı
- [ ] **DB-01**: PostgreSQL kurulumu (Docker compose veya native)
- [ ] **DB-02**: Sequelize PostgreSQL bağlantı konfigürasyonu
- [ ] **DB-03**: Connection pool ayarları (max: 20, min: 5)
- [ ] **DB-04**: .env DATABASE_URL yapılandırması

## DB-05: Sequelize Model Uyumluluğu
- [ ] **DB-05**: 56 model dosyasının PostgreSQL'e uyarlanması
- [ ] **DB-06**: SQLite PRAGMA'larının kaldırılması (database.js)
- [ ] **DB-07**: dialectOptions yapılandırması (PostgreSQL flags)
- [ ] **DB-08**: QueryTypes kullanımının doğrulanması (PostgreSQL uyumlu)

## DB-09: Migration Dosyaları
- [ ] **DB-09**: 26 migration dosyasının PostgreSQL'e uyarlanması
- [ ] **DB-10**: SQLite-specific sorguların düzeltilmesi
- [ ] **DB-11**: Migration sıralama ve bağımlılık yönetimi

## DB-12: Agent Modülleri Uyumluluğu
- [ ] **DB-12**: db-access.js PostgreSQL uyumluluğu
- [ ] **DB-13**: api-client.js bağlantı noktası güncellemeleri
- [ ] **DB-14**: module-agent.js sequelize bağlantı güncellemesi

## DB-15: Veri Migrasyonu
- [ ] **DB-15**: SQLite → PostgreSQL veri aktarım scripti
- [ ] **DB-16**: Tablo şeması dönüştürme (serial → UUID, vb.)
- [ ] **DB-17**: Veri bütünlüğü doğrulaması (row count, checksums)
- [ ] **DB-18**: rollback planı (sorun durumunda geri dönüş)

## DB-19: Test ve Doğrulama
- [ ] **DB-19**: Unit testlerin PostgreSQL ile çalışması
- [ ] **DB-20**: Integration testlerin PostgreSQL ile çalışması
- [ ] **DB-21**: API endpoint testleri (18+ test)
- [ ] **DB-22**: Performance benchmark (SQLite vs PostgreSQL)

## DB-23: Geriye Uyumluluk
- [ ] **DB-23**: SQLite → PostgreSQL geçiş trigger'ı
- [ ] **DB-24**: Feature flag ile hem SQLite hem PostgreSQL desteği (geçiş sürecinde)
- [ ] **DB-25**: Kolay geri alma (rollback) mekanizması

## Out of Scope

- PostgreSQL replication ve HA yapılandırması (v2.1+)
- Connection pooling optimizasyonu derinliği (v2.1+)
- Veritabanı backup ayarları (mevcut yedekleme sistemi ile entegre edilecek)

## Traceability

| REQ-ID | Phase | Plan |
|--------|-------|------|
| DB-01, DB-02, DB-03, DB-04 | 5 | 05-01 |
| DB-05, DB-06, DB-07, DB-08 | 6 | 06-01 |
| DB-09, DB-10, DB-11 | 6 | 06-02 |
| DB-12, DB-13, DB-14 | 6 | 06-03 |
| DB-15, DB-16, DB-17, DB-18 | 7 | 07-01 |
| DB-19, DB-20, DB-21, DB-22 | 8 | 08-01 |
| DB-23, DB-24, DB-25 | 8 | 08-02 |
