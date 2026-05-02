---
name: PROJECT.md
description: ÜRTM Takip - Akıllı Üretim Yönetim Sistemi
type: project
---

# ÜRTM Takip — Akıllı Üretim Yönetim Sistemi

## What This Is

ÜRTM Takip, KOBİ boyutundaki imalat işletmeleri için geliştirilmiş **MES + MRP hibriti** kompleks üretim yönetim sistemidir. Üretim ile ilgili tüm süreçleri, işlemleri, kayıtları ve kontrolleri planlayan, yöneten ve izleyen entegre bir platformdur.

**Kapsam:** Üretim planlamadan depo/stok yönetimine, kalite kontrolünden raporlamaya, tezgah/istasyon yönetiminden iş emirlerine kadar imalat işletmelerinin tüm operasyonel ihtiyaçlarını karşılar — finans ve insan kaynakları hariç.

**Hedef Kitle:** Orta ölçekli imalat tesisleri, CNC işleme atölyeleri, montaj hatları, seri üretim yapan KOBİ'ler.

## Vision

Üretim sahasından gelen çok kanallı veri akışını (IOT cihazları, operatör panelleri, mailler, form girişleri) gerçek zamanlı toplayan, işleyen, anlamlandıran ve **otononom aksiyon alan akıllı üretim platformu**.

Mevcut sistem veri kaydı yapıyor — gelecek vizyon, AI ajanlarının veri toplama, işleme, karar verme ve aksiyon tetikleme döngüsünü tamamen otonom yönetmesidir.

## Core Value

**Akıllı Otonomi** — Sistem, üretim verilerini analiz eder, kararlar alır ve aksiyonları insan müdahalesi olmadan tetikler. Kritik kararlarda master ajan koordinasyonu ile çalışır, düşük öncelikli aksiyonları modül ajanları otonom gerçekleştirir.

## Problem

- **Veri karmaşası:** Üretim sahasından çok çeşitli kanallarla (IOT, operatör panelleri, mailler, formlar) akan verilerin anında kaydedilmesi ve işlenmesi zor
- **İnsan hatası:** Manuel veri girişi ve işlem tetikleme ile oluşan ihmakler ve gecikmeler
- **Reaktif yönetim:** Sorunlar oluştuktan sonra müdahale — proaktif önlem alma eksikliği
- **Bağlantısızlık:** Farklı sistemler ve cihazlar arasında veri akışı kopukluğu
- **Karar gecikmesi:** Yöneticilerin gerçek zamanlı veriye dayalı karar alamaması

## Why Now

- Mevcut `backend/multi-agent/` yapısı zaten master + modül ajan konseptinde
- 40 modüllük kapsamlı dokümantasyon mevcut — ajanların bilgi tabanı hazır
- ESP32 tabanlı IOT cihazları sahada aktif
- Agentic AI mimarisine geçiş için temel altyapı kuruldu (v1.0)
- `@anthropic-ai/claude-agent-sdk` entegre edilmiş

## Scope

### In Scope (Tüm Modüller — 40 Modül)

**Üretim Modülleri:**
1. İş Emirleri — Üretim iş emirlerinin oluşturulması, takibi ve yönetimi
2. Tezgahlar — Makine ve iş istasyonları yönetimi, ESP32 entegrasyonu
3. Üretim Planlama — V1 (BOM tabanlı) ve V2 (JSON tabanlı) çift planlama sistemi
4. BOM Yönetimi — Bill of Materials, malzeme listesi yönetimi
5. Parçalar — Parça katalog, teknik çizimler, QR kod yönetimi
6. Stok Kartları — Hammadde ve yarı mamul stok takibi

**Operasyonel Modüller:**
7. Sevkiyat — Teslimat yönetimi, resim dokümantasyonu
8. Fason İşler — Dış kaynak üretim, teklif yönetimi
9. Arıza-Bakım — Ekipman arıza ve bakım kayıtları
10. Raporlar — Üretim raporları, performans analizi
11. Notlar — Kategorili not sistemi
12. Vardiya Yönetimi — Vardiya planlama ve takibi

**Yönetim Modülleri:**
13. Makineler — Üretim ekipmanları yönetimi
14. Firma Yönetimi — Tedarikçi ve müşteri yönetimi
15. Grup Yönetimi — Parça ve makina gruplandırma
16. Siparişler — Makina ve ekipman siparişleri
17. Faturalar — Alış ve satış faturaları
18. İrsaliyeler — Mal teslim belgeleri

**Teknik Modüller:**
19. CNC Link — ESP32 donanım entegrasyonu
20. Teknik Çizimler — CAD dosya yönetimi, OCR
21. Dizin Tarama — CAD dosya tarama ve eşleştirme
22. Yedekleme — Veritabanı ve dosya yedekleme
23. Import/Export — Excel/CSV veri aktarımı
24. Eşleştirme — Fatura-Stok eşleştirme

**Planlama Modülleri:**
25. Takvim/Zamanlama — Üretim zamanlama, timeline
26. Uygunsuzluklar — Kalite uygunsuzluk yönetimi
27. Dosya Yükleme — Dosya depolama ve yönetimi
28. Tedarik Talepleri — Stok tedarik talep yönetimi
29. Satışlar — Makina ve ürün satışları
30. Tamamlanan İşler — Üretim geçmişi kayıtları

**Sistem Modülleri:**
31. İşlem Kayıtları — Süreç logları ve denetim
32. Makina İndeks — Hiyerarşik veri ve arama
33. İç Sevkiyatlar — Şirket içi transferler
34. Dashboard — KPI paneli, gerçek zamanlı görünüm
35. CAD Import Client — SolidWorks otomasyonu
36. STEP BOM Analyzer — STEP dosya analizi, 3D'den parça çıkarma
37. Context — Proje bağlam ve notlar
38. PDCA — Sürekli iyileştirme döngüsü
39. n8n Workflows — Otomasyon workflow'ları
40. ContEng — Container deployment

### Out of Scope

- Finans muhasebe modülleri
- İnsan kaynakları modülleri
- E-ticaret / müşteri portalı (doğrudan)
- Mobil uygulama (şu an web tabanlı)

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                        │
│                    Dashboard / Formlar / Raporlar               │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ REST API   │  │ Socket.IO   │  │ Agent API   │             │
│  │ (Port 3000)│  │ (Real-time) │  │ (Port 3001) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (SQLite/Sequelize)                 │
│                   Tüm modül verileri, loglar                    │
└─────────────────────────────────────────────────────────────────┘
                              ↕
        ┌───────────────────────┼───────────────────────┐
        ↓                       ↓                       ↓
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  IOT (ESP32)│         │ Operatör    │         │  CAD/3D     │
│  Tezgahlar  │         │ Panelleri   │         │  Sistemleri │
│  CNC Link   │         │ (Form girişi)│         │ STEP/BOM    │
└─────────────┘         └─────────────┘         └─────────────┘
```

### Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Backend | Node.js + Express.js |
| Database | SQLite + Sequelize ORM |
| Frontend | React + Vite + Material-UI + Redux Toolkit |
| Real-time | Socket.IO |
| Agent Framework | @anthropic-ai/claude-agent-sdk |
| IoT Hardware | ESP32 + PlatformIO |
| CAD Integration | STEP_BOM_Analyzer (FreeCAD), CAD_Import_Client (SolidWorks) |
| File Processing | Sharp (images), Tesseract.js (OCR) |

### Multi-Agent Architecture

```
                    ┌──────────────────┐
                    │   Master Agent   │
                    │  (Koordinasyon)  │
                    └────────┬─────────┘
                             │
         ┌──────────────────┼──────────────────┐
         ↓                  ↓                  ↓
  ┌────────────┐     ┌────────────┐     ┌────────────┐
  │ Modül     │     │ Modül     │     │ Modül     │
  │ Ajani     │     │ Ajani     │     │ Ajani     │
  │ (stok_k.) │     │ (is_emri.)│     │ (tezgah.) │
  └────────────┘     └────────────┘     └────────────┘
         ↓                  ↓                  ↓
  ┌────────────┐     ┌────────────┐     ┌────────────┐
  │ Veritabanı │     │ API        │     │ IOT        │
  │ Erişimi   │     │ Erişimi    │     │ Cihazları │
  └────────────┘     └────────────┘     └────────────┘
```

**Agent Yetenekleri:**
- Veritabanı okuma/yazma (direct)
- API endpoint çağırma (internal)
- Otonom aksiyon kararı (action-definitions.json ile)
- Master'a danışma (kritik kararlarda)
- WebSocket üzerinden anlık bildirim

### Data Channels (Veri Kanalları)

| Kanal | Veri Tipi | Aktif mi? |
|-------|----------|-----------|
| ESP32 IOT Cihazları | Tezgah durumu, işlem süreleri, hata kodları | Evet |
| Operatör Panelleri | Manuel form girişleri | Evet |
| Web Formları | Kullanıcı veri girişi | Evet |
| Email | Tedarik bilgileri, sipariş onayları | Kısmi |
| CAD Sistemleri | Parça tanımları, BOM verileri | Kısmi |
| Excel Import | Toplu veri aktarımı | Evet |

## Module Relationships (Modül İlişkileri)

```
İş Emirleri ←→ Tezgahlar ←→ Arıza-Bakım
     ↓              ↓              ↓
  Parçalar   ←→   BOM    ←→   Stok Kartları
     ↓              ↓              ↓
Üretim Planı ←→  Raporlar  ←→  Dashboard
```

## Agentic AI Entegrasyonu

### Agent Types

1. **Master Agent** — Koordinasyon, kritik kararlar, onay yönetimi
2. **Module Agents** — Her modül için ayrı ajan, otonom aksiyon alır
3. **Data Collection Agents** — IOT cihazlarından veri toplar
4. **Analysis Agents** — Verileri analiz eder, pattern tanır

### Otonom Aksiyon Örnekleri

**Stok Yönetimi:**
- Sipariş girildi → Reçete analiz edilir → Stok kontrolü → Kritik parçalar için tedarik/imalat talebi oluşturulur

**Üretim Planlama:**
- İş emri bitiş zamanı yaklaşıyor → Tezgah müsaitlik kontrolü → Operatöre bildirim → Gerekirse yeniden planlama

**Kalite Kontrol:**
- Uygunsuzluk tespit → Batch karantinaya alınır → Kalite ekibi bilgilendirilir → PDCA döngüsü başlatılır

**Stok Takibi:**
- Stok kritik seviyeye düştü → Otomatik tedarik talebi → Yönetici bilgilendirilir

## Requirements

### Validated (v1.0)

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

### Active (v2.0 Planning)

- [ ] Modül ajan implementasyonları (stok_kartlari, is_emirleri, tezgahlar)
- [ ] Otonom aksiyon tanımları (her modül için)
- [ ] IOT veri toplama otomasyonu
- [ ] Real-time karar destek sistemi

## Context

**Current State:**
- v1.0 Agentic AI altyapısı tamamlandı (master agent, module agent base class, db-access, api-client)
- 40 modül dokümante edilmiş
- ESP32 tabanlı tezgah takibi aktif
- BOM ve üretim planlama sistemi çalışıyor

**Tech Stack:**
- Backend: Node.js + Express + Sequelize
- Frontend: React + Vite + MUI + Redux
- Database: SQLite
- Real-time: Socket.IO
- Agent Framework: @anthropic-ai/claude-agent-sdk

**Testing:**
- 18 unit test (db-access, api-client, module-agent)
- Tüm API endpointleri doğrulanmış

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| action-definitions.json ile merkezi aksiyon yönetimi | Modül ajanların hangi aksiyonları master onayı gerektirdiğini bilmesi | ✓ Validated |
| Sequelize QueryTypes kullanımı | SQL injection koruması ve type-safe database operations | ✓ Validated |
| X-Module-Agent header ile ajan kimlik doğrulama | API endpointlerinde modül ajanlarını tanımlama | ✓ Validated |
| requires_approval flag ile yüksek öncelikli aksiyonları koruma | Elevation of privilege mitigation | ✓ Validated |

## Next Milestone Goals (v2.0)

1. **Modül Ajan Implementasyonları**
   - stok_kartlari ajanı — stok analizi, kritik seviye uyarısı, tedarik talebi
   - is_emirleri ajanı — iş emri takibi, gecikme uyarısı, yeniden planlama
   - tezgahlar ajanı — durum izleme, verimlilik analizi, bakım zamanlama

2. **Otonom Aksiyon Tanımları**
   - Her modül için action-definitions.json güncelleme
   - Otonom vs master-onay karar sınırları belirleme

3. **IOT Entegrasyonu**
   - ESP32 verilerini modül ajanlara aktarma
   - Real-time veri pipeline'ı kurma

4. **Kullanıcı Arayüzü**
   - Agent dashboard — ajan kararlarını izleme
   - Onay/red işlemleri için formlar

---
*Last updated: 2026-05-03*
*Version: v1.0 (Agentic AI Foundation)*
*Next: v2.0 (Module Agent Implementation)*