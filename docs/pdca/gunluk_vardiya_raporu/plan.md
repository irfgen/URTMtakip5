# Plan: Günlük Vardiya Raporlama Sistemi

## 📋 Overview
**Feature**: Günlük Vardiya Raporu
**Proje**: ÜRTM Takip Sistemi
**Versiyon**: v14.dev1
**Tarih**: 2026-01-06
**Durum**: Implementation Planlama

---

## 🎯 Hypothesis (Varsayım)

Mevcut veritabanı yapısı (Tezgah, IsEmri, Vardiya, TezgahDurumLog) kullanılarak:
- Her tezgah için günlük vardiya bazlı üretim raporu
- Resimli iş emri kartları ile görsel yönetim
- Çalışma süresi hesaplama ile performans takibi

**Başarı Kriterleri**:
- Rapor yükleme süresi < 3 saniye (10 tezgah)
- Çalışma süresi hesaplama doğruluğu %99+
- Kullanıcı kabulü %90+

---

## 🏗️ Technical Approach

### Backend Architecture
```
gunlukVardiyaController.js
  ├── getGunlukVardiyaRaporu(tarih)
  │   ├── Service: VardiyaSuresiService
  │   │   ├── calculateCalismaSuresi(tezgah_id, tarih, vardiya)
  │   │   └── handleGeceYarisiVardiyasi()
  │   ├── Query: getIsEmirleriByTezgahTarih()
  │   └── Query: getTamamlananMiktar()
  └── Response: { tezgahlar: [...] }
```

### Frontend Architecture
```
GunlukVardiyaRaporu/
  ├── GunlukVardiyaRaporu.jsx (Main)
  │   ├── RaporHeader (Tarih seçici)
  │   └── TezgahListesi (Grid)
  │       └── TezgahVardiyaKarti
  │           ├── VardiyaBolmesi (Gündüz)
  │           │   └── IsEmriRaporKarti[]
  │           └── VardiyaBolmesi (Gece)
  │               └── IsEmriRaporKarti[]
```

---

## 📊 Expected Outcomes (Beklenen Sonuçlar)

### Fonksiyonel Gereksinimler
1. ✅ Tarih seçimi ile rapor görüntüleme
2. ✅ Tezgah bazlı vardiya ayrımı
3. ✅ İş emri kartları (resimli)
4. ✅ Çalışma süresi göstergesi
5. ✅ Tamamlanan/Aktif iş ayrımı

### Teknik Gereksinimler
1. ✅ API endpoint: `/api/raporlar/gunluk-vardiya`
2. ✅ Component: 6 yeni React component
3. ✅ Test coverage: %85+
4. ✅ Response time: < 3 saniye

### Riskler ve Mitigasyon
| Risk | Olasılık | Etki | Mitigasyon |
|------|----------|------|------------|
| Gece yarısı vardiya hesaplama hatası | Orta | Yüksek | Kapsamlı test senaryoları |
| Performans sorunu (çoklu tezgah) | Orta | Orta | Query optimizasyonu, caching |
| Resim yükleme gecikmesi | Düşük | Düşük | Thumbnail, lazy loading |

---

## 🚀 Implementation Strategy

### Phase 1: Backend Foundation (4 saat)
**Amaç**: API endpoint ve veri işleme logic'i oluştur

**Task'ler**:
1. Controller: `gunlukVardiyaController.js`
   - `getGunlukVardiyaRaporu()` function
   - Input validation (tarih formatı)
   - Error handling

2. Service: `vardiyaSuresiService.js`
   - `calculateCalismaSuresi()` - Vardiya süresi hesaplama
   - `handleGeceYarisiVardiyasi()` - Gece yarısı geçiş handling
   - `formatCalismaSuresi()` - Dakika → "X saat Y dakika"

3. Query functions
   - `getTezgahlar()` - Aktif tezgah listesi
   - `getVardiyalar()` - Aktif vardiya tanımları
   - `getIsEmirleriByTezgahTarih()` - İş emri listesi
   - `getTamamlananMiktar()` - İşlem kayıtlarından toplam

4. Route registration
   - `/api/raporlar/gunluk-vardiya`
   - Query parameters: `tarih`, `tezgah_id`, `vardiya_id`

5. Unit tests
   - Controller tests
   - Service tests (gece yarısı senaryosu)
   - Query tests

**Başarı Kriterleri**:
- API response time < 500ms
- Test coverage %90+

### Phase 2: Frontend Components (6 saat)
**Amaç**: UI component'leri ve state yönetimi

**Task'ler**:
1. Main Component: `GunlukVardiyaRaporu.jsx`
   - State: `secilenTarih`, `raporData`, `loading`, `error`
   - Effect: Tarih değişince API call
   - Layout: Grid container (tezgah cards)

2. Sub Component: `TezgahVardiyaKarti.jsx`
   - Props: `tezgah`, `gunduzVardiya`, `geceVardiya`
   - Layout: 2 column (Gündüz | Gece)
   - Responsive: Mobilde vertical stack

3. Sub Component: `VardiyaBolmesi.jsx`
   - Props: `vardiya`, `calismaSuresi`, `isEmirleri`
   - Empty state handling
   - Work duration display

4. Card Component: `IsEmriRaporKarti.jsx`
   - Props: `isEmri`
   - Image: Thumbnail/placeholder
   - Progress bar: LinearProgress
   - Status chip: Renk coding
   - Border: Durum bazlı

5. API Service: `gunlukVardiyaAPI.js`
   - `getGunlukVardiyaRaporu(tarih)`
   - Error handling
   - Loading state

6. Route: `App.jsx` update
   - `/raporlar/gunluk-vardiya` → `GunlukVardiyaRaporu`
   - Tab: "Günlük Vardiya Raporu"

**Başarı Kriterleri**:
- Component test coverage %85+
- Mobile responsive
- Loading/error states

### Phase 3: Integration & Testing (2 saat)
**Amaç**: End-to-end functionality

**Task'ler**:
1. Backend-Frontend integration
   - API testleri (Postman/Thunder Client)
   - Response format validation
   - Error handling test

2. E2E test senaryoları
   - Test-1: Boş vardiya
   - Test-2: Tamamlanan iş
   - Test-3: Aktif iş
   - Test-4: Gece yarısı vardiya
   - Test-5: Resimsiz iş emri

3. Responsive design test
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

4. Performance optimizasyon
   - Query execution time
   - API response time
   - Frontend render time

**Başarı Kriterleri**:
- E2E tests pass
- Responsive design working
- Performance < 3 saniye

### Phase 4: Documentation & Deployment (1 saat)
**Amaç**: Production readiness

**Task'ler**:
1. API documentation
   - Endpoint description
   - Request/Response examples
   - Error codes

2. User guide
   - Rapor nasıl kullanılır?
   - Tarih seçimi
   - İş emri kartı okuma

3. Code review
   - Peer review session
   - Bug fixes
   - Refactoring

4. Deployment
   - Backend deployment
   - Frontend build
   - Smoke tests

**Başarı Kriterleri**:
- Documentation complete
- No critical bugs
- Production stable

---

## 📝 Task Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Backend Foundation                                 │
│ ├─ BE-GUNLUK-001 (Controller)                              │
│ │  └─ Depends on: None                                     │
│ ├─ BE-GUNLUK-002 (Service)                                 │
│ │  └─ Depends on: None (parallel with Controller)          │
│ ├─ BE-GUNLUK-003 (Query)                                   │
│ │  └─ Depends on: None (parallel with Controller)          │
│ ├─ BE-GUNLUK-004 (Route)                                   │
│ │  └─ Depends on: BE-GUNLUK-001, BE-GUNLUK-002, BE-GUNLUK-003│
│ └─ BE-GUNLUK-005 (Test)                                    │
│    └─ Depends on: BE-GUNLUK-004                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Frontend Components                                │
│ ├─ FE-GUNLUK-004 (API Service)                             │
│ │  └─ Depends on: BE-GUNLUK-004 complete                   │
│ ├─ FE-GUNLUK-003 (IsEmriRaporKarti)                        │
│ │  └─ Depends on: FE-GUNLUK-004                            │
│ ├─ FE-GUNLUK-002 (VardiyaBolmesi)                          │
│ │  └─ Depends on: FE-GUNLUK-003                            │
│ ├─ FE-GUNLUK-001 (TezgahVardiyaKarti)                      │
│ │  └─ Depends on: FE-GUNLUK-002, FE-GUNLUK-003            │
│ ├─ FE-GUNLUK-000 (GunlukVardiyaRaporu Main)               │
│ │  └─ Depends on: FE-GUNLUK-001                            │
│ ├─ FE-GUNLUK-005 (Route)                                   │
│ │  └─ Depends on: FE-GUNLUK-000                            │
│ └─ FE-GUNLUK-006 (Test)                                    │
│    └─ Depends on: FE-GUNLUK-005                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Integration & Testing                              │
│ ├─ Integration Test (Backend ↔ Frontend)                   │
│ ├─ E2E Tests (5 senaryo)                                   │
│ ├─ Responsive Design Test                                  │
│ └─ Performance Optimization                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Documentation & Deployment                        │
│ ├─ API Documentation                                       │
│ ├─ User Guide                                              │
│ ├─ Code Review                                             │
│ └─ Deployment                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Quality Gates (Kalite Kapıları)

### Gate 1: Backend Complete
- [ ] API endpoint returns valid JSON
- [ ] Vardiya süresi hesaplama doğru (manuel test)
- [ ] Gece yarısı vardiya doğru çalışıyor
- [ ] Unit tests pass (%90+ coverage)
- [ ] Response time < 500ms

### Gate 2: Frontend Complete
- [ ] Component'ler render ediyor
- [ ] API integration çalışıyor
- [ ] Loading/error states gösteriliyor
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Component tests pass (%85+ coverage)

### Gate 3: Integration Complete
- [ ] E2E tests pass (5/5 senaryo)
- [ ] Performance < 3 saniye
- [ ] No console errors
- [ ] Cross-browser compatible (Chrome, Edge)

### Gate 4: Production Ready
- [ ] Documentation complete
- [ ] Code review approved
- [ ] Smoke tests pass
- [ ] No critical bugs

---

## 📈 Success Metrics (Başarı Metrikleri)

### KPI-1: Performance
- **Hedef**: Rapor yükleme süresi < 3 saniye
- **Ölçüm**: `performance.now()` timestamp

### KPI-2: Quality
- **Hedef**: Test coverage %85+
- **Ölçüm**: Jest/Vitest coverage report

### KPI-3: Accuracy
- **Hedef**: Çalışma süresi hesaplama %99+ doğru
- **Ölçüm**: Manuel hesaplama karşılaştırması

### KPI-4: User Experience
- **Hedef**: Kullanıcı kabulü %90+
- **Ölçüm**: 30 günlük kullanım istatistiği

---

## 🔄 Iteration Plan (İterasyon Planı)

### Iteration 1: Backend MVP (Day 1)
- Controller + Service + Query
- API endpoint working
- Manual test başarılı

### Iteration 2: Frontend MVP (Day 1-2)
- Main component + sub components
- API integration
- Basic UI working

### Iteration 3: Testing & Polish (Day 2)
- Unit tests + E2E tests
- Performance optimization
- Bug fixes

### Iteration 4: Documentation (Day 3)
- API docs + User guide
- Code review
- Deployment

---

## 📞 Communication Plan

### Daily Standup
- **Saat**: 09:30
- **Format**: Yesterday, Today, Blockers
- **Duration**: 15 dakika

### Weekly Review
- **Gün**: Cuma
- **Content**: Progress demo, Risk assessment, Next week plan
- **Duration**: 30 dakika

---

**Plan Status**: ✅ Ready for Implementation
**Next Step**: Phase 1 - Backend Foundation
