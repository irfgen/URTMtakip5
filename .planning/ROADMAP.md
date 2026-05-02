# ROADMAP — ÜRTM Agentic AI System

## Milestone: Agentic AI Altyapısı

---

### Phase 1: Agentic Temel Altyapı

**Description:** action-definitions.json dosyasını master'a entegre et, consult endpointi oluştur, modül danışma modülü yaz

**Requirements:** REQ-001, REQ-002, REQ-003

**Status:** complete

**Dependencies:** None

**Plans:**
- `.planning/phases/01-agentic-temel/01-01-PLAN.md` — action-definitions.json entegrasyonu + consult endpoint

---

### Phase 2: Master Onay Mekanizması

**Description:** İki yönlü onay mekanizması: master onay bekleyici, alternatif aksiyon önerisi, timeout yönetimi

**Requirements:** REQ-004, REQ-005, REQ-006

**Status:** complete

**Dependencies:** Phase 1

**Plans:**
- `.planning/phases/02-master-onay/02-01-PLAN.md` — Master onay mekanizması ve timeout

---

### Phase 3: Modül Ajan Tam Yetki

**Description:** Modül ajanlarına veritabanı erişimi + API erişimi + otonom aksiyon yetkisi

**Requirements:** REQ-007, REQ-008

**Status:** complete

**Dependencies:** Phase 1, Phase 2

**Plans:**
- `.planning/phases/03-modul-yetki/03-01-PLAN.md` — Modül ajan tam yetki sistemi

---

### Phase 4: Test & Entegrasyon

**Description:** Sistemin test edilmesi ve mevcut sisteme entegrasyonu

**Requirements:** REQ-009, REQ-010

**Status:** pending

**Dependencies:** Phase 3

**Plans:**
- `.planning/phases/04-test-entegrasyon/04-01-PLAN.md` — Test ve entegrasyon

---

## Requirements Summary

| ID | Requirement | Phase |
|----|-------------|-------|
| REQ-001 | action-definitions.json dosyası oluşturuldu | 1 |
| REQ-002 | Master /api/master/consult endpointi eklendi | 1 |
| REQ-003 | Modül danışma modülü (consult-master.js) yazıldı | 1 |
| REQ-004 | Master onay mekanizması çalışıyor | 2 |
| REQ-005 | Alternatif aksiyon önerileri sunuluyor | 2 |
| REQ-006 | Timeout yönetimi aktif (30 sn bekleme) | 2 |
| REQ-007 | Modül ajanlar veritabanına erişebiliyor | 3 |
| REQ-008 | Modül ajanlar API endpointlerini çağırabiliyor | 3 |
| REQ-009 | Sistem test edildi ve çalışıyor | 4 |
| REQ-010 | Mevcut sisteme entegre edildi | 4 |