# Tasks: Günlük Vardiya Raporlama Sistemi

**Feature**: Günlük Vardiya Raporu
**Proje**: ÜRTM Takip Sistemi
**Versiyon**: v14.dev1
**Total Tasks**: 23
**Estimated Time**: 13 saat

---

## 📊 Task Summary

| Phase | Tasks | Status | Time |
|-------|-------|--------|------|
| **Phase 1: Backend** | 5 | ⏳ Pending | 4s |
| **Phase 2: Frontend** | 6 | ⏳ Pending | 6s |
| **Phase 3: Integration** | 4 | ⏳ Pending | 2s |
| **Phase 4: Documentation** | 4 | ⏳ Pending | 1s |
| **Total** | **19** | **⏳ Pending** | **13s** |

---

## Phase 1: Backend Foundation (4 saat)

### BE-GUNLUK-001: Controller - gunlukVardiyaController.js
**Priority**: 🔴 High
**Complexity**: Orta
**Estimated**: 2 saat
**Status**: ⏳ Pending

**Description**:
Günlük vardiya raporu API endpoint controller'ı oluştur.

**File**: `backend/src/controllers/gunlukVardiyaController.js`

**Tasks**:
1. Controller function: `getGunlukVardiyaRaporu(req, res)`
2. Input validation: `tarih` parameter (YYYY-MM-DD format)
3. Optional filters: `tezgah_id`, `vardiya_id`
4. Error handling: Invalid date, no data, server errors
5. Response format: `{ success: true, data: { tarih, tezgahlar: [...] } }`

**Dependencies**: None

**Acceptance Criteria**:
- [ ] Request validated (tarih format)
- [ ] Error responses consistent
- [ ] Success response matches PRD format
- [ ] HTTP status codes correct (200, 400, 500)

---

### BE-GUNLUK-002: Service - VardiyaSuresiService.js
**Priority**: 🔴 High
**Complexity**: Yüksek
**Estimated**: 3 saat
**Status**: ⏳ Pending

**Description**:
Vardiya çalışma süresi hesaplama logic'i oluştur (en kritik component).

**File**: `backend/src/services/vardiyaSuresiService.js`

**Tasks**:
1. Function: `calculateCalismaSuresi(tezgah_id, tarih, vardiya)`
2. TezgahDurumLog tablosundan sorgu
3. LAG window function ile durum değişikliklerini tespit
4. Vardiya saat filtreleme (başlangıç/bitiş)
5. **Gece yarısı handling**: Bitiş saati < başlangıç saati durumları
6. Format: `formatCalismaSuresi(dakika)` → "X saat Y dakika"

**Dependencies**: None

**Acceptance Criteria**:
- [ ] Çalışma süresi doğru hesaplanıyor (manuel test)
- [ ] Gece yarısı vardiya doğru çalışıyor (örn: 23:00-07:00)
- [ ] Format doğru (420 dakika → "7 saat 0 dakika")
- [ ] Null/empty data handling
- [ ] Performance: < 100ms per tezgah

**Edge Cases**:
- Vardiya hiç çalışmamış → 0 dakika
- Gece yarısı geçiş (23:00 → 07:00)
- Tezgah tüm gün çalışmış → 1440 dakika
- Log kaydı eksik → Warning log, 0 dön

---

### BE-GUNLUK-003: Query Functions - gunlukVardiyaQueries.js
**Priority**: 🟡 Medium
**Complexity**: Orta
**Estimated**: 1 saat
**Status**: ⏳ Pending

**Description**:
Veritabanı sorgu fonksiyonları oluştur.

**File**: `backend/src/queries/gunlukVardiyaQueries.js`

**Tasks**:
1. `getAktifTezgahlar()` - Aktif tezgah listesi
2. `getAktifVardiyalar()` - Aktif vardiya tanımları
3. `getIsEmirleriByTezgahTarih(tezgah_id, tarih)` - İş emri listesi
4. `getTamamlananMiktar(tezgah_id, tarih, is_emri_no)` - İşlem kayıtlarından toplam

**Dependencies**: None

**Acceptance Criteria**:
- [ ] Sorgular optimize edilmiş (index kullanımı)
- [ ] JOIN'ler doğru (Parca, Tezgah)
- [ ] Null handling (teknik_resim yoksa)
- [ ] Order by correct (created_at)

---

### BE-GUNLUK-004: Route Registration - gunlukVardiyaRoutes.js
**Priority**: 🟡 Medium
**Complexity**: Basit
**Estimated**: 30 dakika
**Status**: ⏳ Pending

**Description**:
API route'unu kaydet ve middleware'leri ekle.

**File**: `backend/src/routes/gunlukVardiyaRoutes.js`

**Tasks**:
1. Router definition: `router.get('/', getGunlukVardiyaRaporu)`
2. Import controller
3. Register in `backend/src/index.js`
4. Add authentication middleware (if required)
5. Add rate limiting (if required)

**Dependencies**: BE-GUNLUK-001

**Acceptance Criteria**:
- [ ] Route accessible: `GET /api/raporlar/gunluk-vardiya?tarih=2026-01-05`
- [ ] Query parameters work: `tarih`, `tezgah_id`, `vardiya_id`
- [ ] Error handling integrated
- [ ] Route registered in index.js

---

### BE-GUNLUK-005: Unit Tests - gunlukVardiyaController.test.js
**Priority**: 🟢 Low
**Complexity**: Orta
**Estimated**: 1 saat
**Status**: ⏳ Pending

**Description**:
Backend unit test'lerini yaz.

**File**: `backend/tests/gunlukVardiyaController.test.js`

**Test Cases**:
1. Valid date → Returns data
2. Invalid date → Returns 400 error
3. No data for date → Returns empty array
4. Service error → Returns 500 error
5. Tezgah filter works
6. Vardiya filter works

**Dependencies**: BE-GUNLUK-004

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Coverage %90+
- [ ] Edge cases covered

---

## Phase 2: Frontend Components (6 saat)

### FE-GUNLUK-004: API Service - gunlukVardiyaAPI.js
**Priority**: 🔴 High
**Complexity**: Basit
**Estimated**: 30 dakika
**Status**: ⏳ Pending

**Description**:
Frontend API service'ini oluştur.

**File**: `frontend/src/api/gunlukVardiyaAPI.js`

**Tasks**:
1. Function: `getGunlukVardiyaRaporu(tarih, tezgahId, vardiyaId)`
2. Axios HTTP GET request
3. Error handling
4. Return data

**Dependencies**: BE-GUNLUK-004 complete

**Acceptance Criteria**:
- [ ] Function makes correct API call
- [ ] Error handling works
- [ ] Response data format validated

---

### FE-GUNLUK-003: Component - IsEmriRaporKarti.jsx
**Priority**: 🔴 High
**Complexity**: Orta
**Estimated**: 1.5 saat
**Status**: ⏳ Pending

**Description**:
İş emri kartı component'i (resimli).

**File**: `frontend/src/components/Raporlar/IsEmriRaporKarti.jsx`

**Tasks**:
1. Props: `isEmri`, `onClick`
2. Thumbnail/placeholder image
3. İş emri bilgileri: No, parça adı, adet, durum
4. Progress bar: LinearProgress (tamamlanan/adet)
5. Status chip: Renk coding (yeşil/mavi/sarı/kırmızı)
6. Border: Durum bazlı (yeşil=completed, mavi=active)
7. Empty state handling

**Dependencies**: FE-GUNLUK-004

**Acceptance Criteria**:
- [ ] Card displays correctly
- [ ] Image loads or placeholder shown
- [ ] Progress bar accurate
- [ ] Status colors correct
- [ ] Hover effect (optional)
- [ ] Click handler works (detay sayfasına git)

---

### FE-GUNLUK-002: Component - VardiyaBolmesi.jsx
**Priority**: 🟡 Medium
**Complexity**: Orta
**Estimated**: 1.5 saat
**Status**: ⏳ Pending

**Description**:
Vardiya bölümü component'i (Gündüz/Gece alanı).

**File**: `frontend/src/components/Raporlar/VardiyaBolmesi.jsx`

**Tasks**:
1. Props: `vardiya`, `calismaSuresi`, `isEmirleri`, `tur` (gunduz/gece)
2. Header: Vardiya adı + saat aralığı + icon (☀️/🌙)
3. Work duration display: ⏱️ "X saat Y dakika"
4. İş emri kartları listesi (grid/flex)
5. Empty state: "Vardiya aktif değildi" message
6. Loading state: Skeleton/shimmer effect

**Dependencies**: FE-GUNLUK-003

**Acceptance Criteria**:
- [ ] Header displays correctly
- [ ] Work duration formatted properly
- [ ] İş emri kartları render
- [ ] Empty state shown when no jobs
- [ ] Responsive (mobile stack)

---

### FE-GUNLUK-001: Component - TezgahVardiyaKarti.jsx
**Priority**: 🟡 Medium
**Complexity**: Orta
**Estimated**: 1.5 saat
**Status**: ⏳ Pending

**Description**:
Tek tezgah vardiya kartı component'i.

**File**: `frontend/src/components/Raporlar/TezgahVardiyaKarti.jsx`

**Tasks**:
1. Props: `tezgah`, `gunduzVardiya`, `geceVardiya`
2. Card layout: Header + 2 column (Gündüz | Gece)
3. Divider: Vertical ayrım çizgisi
4. Tezgah icon: 🔧
5. Responsive: Mobile'de vertical stack
6. Collapse/expand (optional)

**Dependencies**: FE-GUNLUK-002

**Acceptance Criteria**:
- [ ] Card displays tezgah info
- [ ] Gündüz/Gece sections render
- [ ] Responsive works (mobile)
- [ ] Divider visible
- [ ] Empty state for both shifts

---

### FE-GUNLUK-000: Component - GunlukVardiyaRaporu.jsx (Main)
**Priority**: 🔴 High
**Complexity**: Orta
**Estimated**: 2 saat
**Status**: ⏳ Pending

**Description**:
Ana sayfa component'i.

**File**: `frontend/src/pages/GunlukVardiyaRaporu.jsx`

**Tasks**:
1. State: `secilenTarih`, `raporData`, `loading`, `error`
2. Effect: `secilenTarih` değişince API call
3. Header: Title + DatePicker
4. Content: Tezgah cards grid
5. Loading state: CircularProgress/Skeleton
6. Error state: Alert message
7. Empty state: "Bu tarih için rapor yok"

**Dependencies**: FE-GUNLUK-001

**Acceptance Criteria**:
- [ ] DatePicker works
- [ ] API call on date change
- [ ] Loading state shown
- [ ] Error handling
- [ ] Tezgah cards render
- [ ] Default date: Yesterday

---

### FE-GUNLUK-005: Route Registration - App.jsx
**Priority**: 🟢 Low
**Complexity**: Basit
**Estimated**: 15 dakika
**Status**: ⏳ Pending

**Description**:
Route'u kaydet ve tab ekle.

**File**: `frontend/src/App.jsx` ve `frontend/src/pages/Raporlar.jsx`

**Tasks**:
1. Import: `GunlukVardiyaRaporu`
2. Add to Raporlar tabs: "Günlük Vardiya Raporu"
3. Tab click shows component

**Dependencies**: FE-GUNLUK-000

**Acceptance Criteria**:
- [ ] New tab appears
- [ ] Clicking tab shows component
- [ ] Tab icon correct (📊)

---

### FE-GUNLUK-006: Unit Tests - Component Tests
**Priority**: 🟢 Low
**Complexity**: Orta
**Estimated**: 1 saat
**Status**: ⏳ Pending

**Description**:
Frontend component test'lerini yaz.

**Files**: `frontend/tests/components/GunlukVardiyaRaporu.test.jsx`

**Test Cases**:
1. Main component renders
2. DatePicker works
3. API call on date change
4. Loading state shows
5. Error handling
6. IsEmriRaporKarti displays data
7. VardiyaBolmesi empty state

**Dependencies**: FE-GUNLUK-005

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Coverage %85+
- [ ] Mock API works

---

## Phase 3: Integration & Testing (2 saat)

### INT-GUNLUK-001: Backend-Frontend Integration
**Priority**: 🔴 High
**Complexity**: Orta
**Estimated**: 30 dakika
**Status**: ⏳ Pending

**Description**:
Backend ve frontend entegrasyon test.

**Tasks**:
1. Start backend (port 3000)
2. Start frontend (port 5173)
3. Test API endpoint: Postman/Thunder Client
4. Test frontend: Manual browser test
5. Verify response format matches

**Dependencies**: BE-GUNLUK-005, FE-GUNLUK-005 complete

**Acceptance Criteria**:
- [ ] API returns valid JSON
- [ ] Frontend displays data correctly
- [ ] No console errors
- [ ] Response format matches PRD

---

### INT-GUNLUK-002: E2E Tests (5 Scenarios)
**Priority**: 🔴 High
**Complexity**: Orta
**Estimated**: 1 saat
**Status**: ⏳ Pending

**Description**:
End-to-end test senaryoları.

**Test Cases**:
1. **Test-1: Boş Vardiya**
   - Setup: Tezgah o gün çalışmamış
   - Expected: "Vardiya aktif değildi" message
   - Duration: 0 dakika

2. **Test-2: Tamamlanan İş**
   - Setup: İş emri %100 tamamlandı
   - Expected: Yeşil border, "100/100 ✅"
   - Progress bar: 100%

3. **Test-3: Aktif İş**
   - Setup: İş emri hala yapılıyor
   - Expected: Mavi border, "75/150 🔄"
   - Progress bar: 50%

4. **Test-4: Gece Yarısı Vardiyası**
   - Setup: Vardiya 23:00-07:00
   - Expected: Tarih sınırı doğru
   - Duration: Correct calculation

5. **Test-5: Resimsiz İş Emri**
   - Setup: İş emrinin teknik resmi yok
   - Expected: Placeholder icon shown
   - No broken image

**Dependencies**: INT-GUNLUK-001

**Acceptance Criteria**:
- [ ] All 5 scenarios pass
- [ ] Results documented
- [ ] Screenshots taken (for documentation)

---

### INT-GUNLUK-003: Responsive Design Test
**Priority**: 🟡 Medium
**Complexity**: Basit
**Estimated**: 30 dakika
**Status**: ⏳ Pending

**Description**:
Responsive design test.

**Devices**:
- Desktop: 1920x1080
- Tablet: 768x1024
- Mobile: 375x667

**Tests**:
- [ ] Layout works on all devices
- [ ] Tezgah cards stack vertically on mobile
- [ ] Vardiya sections stack on mobile
- [ ] DatePicker accessible
- [ ] No horizontal scroll
- [ ] Touch targets minimum 44px

**Dependencies**: INT-GUNLUK-002

---

### INT-GUNLUK-004: Performance Optimization
**Priority**: 🟡 Medium
**Complexity**: Orta
**Estimated**: 30 dakika
**Status**: ⏳ Pending

**Description**:
Performance optimizasyonu.

**Metrics**:
- Target: < 3 saniye total load time
- API response: < 500ms
- Frontend render: < 500ms
- Image load: Lazy loading

**Tasks**:
1. Query optimization (index check)
2. Image lazy loading
3. Component memoization (useMemo)
4. Pagination (if needed)

**Dependencies**: INT-GUNLUK-003

**Acceptance Criteria**:
- [ ] Total load time < 3 saniye
- [ ] API response < 500ms
- [ ] No re-renders (React DevTools)

---

## Phase 4: Documentation & Deployment (1 saat)

### DOC-GUNLUK-001: API Documentation
**Priority**: 🟢 Low
**Complexity**: Basit
**Estimated**: 30 dakika
**Status**: ⏳ Pending

**Description**:
API dokümantasyon güncelleme.

**File**: `docs/API_Documentation.md`

**Tasks**:
1. Endpoint description
2. Request parameters
3. Response format
4. Error codes
5. Example requests/cURL

**Dependencies**: INT-GUNLUK-004

---

### DOC-GUNLUK-002: User Guide
**Priority**: 🟢 Low
**Complexity**: Basit
**Estimated**: 30 dakika
**Status**: ⏳ Pending

**Description**:
Kullanıcı kılavuzu.

**File**: `docs/GunlukVardiyaRaporu_KullanimKilavuzu.md`

**Tasks**:
1. Rapor nasıl kullanılır?
2. Tarih seçimi
3. İş emri kartı okuma
4. Sorun giderme

**Dependencies**: INT-GUNLUK-004

---

### DOC-GUNLUK-003: Code Review
**Priority**: 🟢 Low
**Complexity**: Basit
**Estimated**: 30 dakika
**Status**: ⏳ Pending

**Description**:
Code review session.

**Tasks**:
1. Peer review
2. Bug fixes
3. Refactoring
4. Documentation comments

**Dependencies**: DOC-GUNLUK-001, DOC-GUNLUK-002

---

### DOC-GUNLUK-004: Deployment
**Priority**: 🔴 High
**Complexity**: Basit
**Estimated**: 30 dakika
**Status**: ⏳ Pending

**Description**:
Production deployment.

**Tasks**:
1. Backend build/test
2. Frontend build
3. Smoke tests
4. Deploy to production

**Dependencies**: DOC-GUNLUK-003

**Acceptance Criteria**:
- [ ] No critical bugs
- [ ] Smoke tests pass
- [ ] Production stable

---

## 📊 Task Statistics

### Complexity Breakdown
| Complexity | Count | Percentage |
|------------|-------|------------|
| Basit | 6 | 32% |
| Orta | 10 | 53% |
| Yüksek | 3 | 15% |

### Priority Breakdown
| Priority | Count | Percentage |
|----------|-------|------------|
| 🔴 High | 9 | 47% |
| 🟡 Medium | 6 | 32% |
| 🟢 Low | 4 | 21% |

### Time Distribution
| Phase | Time | Percentage |
|-------|------|------------|
| Backend | 4s | 31% |
| Frontend | 6s | 46% |
| Integration | 2s | 15% |
| Documentation | 1s | 8% |

---

## ✅ Task Execution Order

### Parallel Execution Groups

**Group 1: Backend Foundation (Parallel)**
- BE-GUNLUK-001 (Controller) + BE-GUNLUK-002 (Service) + BE-GUNLUK-003 (Query)
- Estimated: 3s (parallel work)

**Group 2: Backend Completion (Sequential)**
- BE-GUNLUK-004 (Route) → BE-GUNLUK-005 (Test)
- Estimated: 1.5s

**Group 3: Frontend Foundation (Sequential)**
- FE-GUNLUK-004 (API) → FE-GUNLUK-003 (Card) → FE-GUNLUK-002 (Section) → FE-GUNLUK-001 (Main) → FE-GUNLUK-005 (Route)
- Estimated: 5s

**Group 4: Testing & Documentation (Parallel)**
- FE-GUNLUK-006 (Test) + INT-GUNLUK-001 (Integration)
- Estimated: 1.5s

**Group 5: Finalization (Sequential)**
- INT-GUNLUK-002 (E2E) → INT-GUNLUK-003 (Responsive) → INT-GUNLUK-004 (Performance)
- Estimated: 1.5s

**Group 6: Deployment (Parallel)**
- DOC-GUNLUK-001 (API docs) + DOC-GUNLUK-002 (User guide)
- Estimated: 1s (parallel)

**Group 7: Final (Sequential)**
- DOC-GUNLUK-003 (Review) → DOC-GUNLUK-004 (Deploy)
- Estimated: 1s

**Total Optimistic Time**: ~10 saat (parallel execution)
**Total Conservative Time**: ~13 saat (sequential execution)

---

## 🎯 Critical Path

1. BE-GUNLUK-002 (Service) **→** Most critical, complex
2. BE-GUNLUK-001 (Controller) **→** Depends on Service
3. BE-GUNLUK-004 (Route) **→** Blocks frontend
4. FE-GUNLUK-004 (API) **→** Depends on Route
5. FE-GUNLUK-000 (Main) **→** Blocks E2E tests
6. INT-GUNLUK-002 (E2E) **→** Must pass before deploy
7. DOC-GUNLUK-004 (Deploy) **→** Final step

---

**Task List Status**: ✅ Ready for Execution
**Next Action**: Start BE-GUNLUK-002 (VardiyaSuresiService)
