# PRD: Günlük Vardiya Raporlama Sistemi

**Proje**: ÜRTM Takip Sistemi
**Versiyon**: v14.dev1
**Tarih**: 2026-01-06
**Durum**: Tasarım Aşaması

---

## 📋 İş Buusiness Overview (İş Özeti)

### Problem
Üretim yönetimi, her bir tezgahın gündüz ve gece vardiyasında:
- Hangi iş emirlerinin atandığını
- Bu işlerin ne kadarının tamamlandığını
- Tezgahın toplam çalışma süresini
anlık ve günlük olarak takip edememektedir.

### Çözüm
Her tezgah için vardiya bazlı (gündüz/gece) günlük üretim raporu sunan bir sistem.

### İş Değeri
- **Üretim Takibi**: Anlık ve geçmiş üretim performansı görünürlüğü
- **Verimlilik Analizi**: Vardiya bazlı performans kıyaslaması
- **Kaynak Planlaması**: Tezgah kullanım optimizasyonu
- **Hızlı Karar**: Resimli iş emri kartları ile görsel yönetim

---

## 🎯 Kullanıcı Hikayeleri (User Stories)

### US-1: Günlük Rapor Görüntüleme
**Rol**: Üretim Planlayıcısı / Üretim Müdürü
**Story**: Her sabah bir önceki günün gündüz ve gece vardiyası raporunu görmek istiyorum.

**Acceptance Criteria**:
- Rapor sayfasında tezgahlar yukarıdan aşağıya sıralanır
- Her tezgahın sağında iki bölünmüş alan: Gündüz Vardiyası | Gece Vardiyası
- Her vardiya alanında o gün tezgaha atanan iş emirleri gösterilir
- Tamamlanan işler ve aktif olan işler ayrıştırılır

### US-2: İş Emri Kartları
**Rol**: Operatör / Vardiya Amiri
**Story**: İş emirlerini resimli kartlar halinde görmek, hızlıca anlamak istiyorum.

**Acceptance Criteria**:
- Her iş emri için görsel kart gösterilir
- Kartta iş emrinin teknik resmi/thumbnail'i yer alır
- Kart bilgileri: İş emri no, parça adı, adet, durum, tamamlanan miktar
- Tamamlanan işler yeşil, aktif işler mavi border ile gösterilir

### US-3: Çalışma Süresi Takibi
**Rol**: Üretim Müdürü
**Story**: Her tezgahın her vardiyada toplam kaç dakika çalıştığını görmek istiyorum.

**Acceptance Criteria**:
- Her vardiya alanında toplam çalışma süresi (dakika) gösterilir
- Çalışma süresi `TezgahDurumLog` tablosundan hesaplanır
- Format: "X dakika" veya "X saat Y dakika"

### US-4: Tarih Seçimi
**Rol**: Üretim Planlayıcısı
**Story**: İstediğim günün raporunu görüntülemek istiyorum.

**Acceptance Criteria**:
- Rapor sayfasında tarih seçici (date picker) bulunur
- Varsayılan olarak bir önceki gün seçilir
- Tarih değiştiğinde rapor yeniden yüklenir

---

## 🏗️ Teknik Mimari

### Backend API

#### GET `/api/raporlar/gunluk-vardiya?tarih=YYYY-MM-DD`

**Response Format**:
```json
{
  "success": true,
  "data": {
    "tarih": "2026-01-05",
    "tezgahlar": [
      {
        "tezgah_id": 1,
        "tezgah_adi": "Tornalama-01",
        "gunduz_vardiya": {
          "vardiya_id": 1,
          "vardiya_adi": "Gündüz",
          "calisma_suresi_dakika": 420,
          "is_emirleri": [
            {
              "is_emri_id": 101,
              "is_emri_no": "IE-2026-00101",
              "parca_kodu": "P-1234",
              "parca_adi": "Mil Set",
              "adet": 100,
              "tamamlanan_adet": 100,
              "durum": "tamamlandi",
              "teknik_resim": "/uploads/parcalar/P-1234-thumb.png",
              "baslangic_saati": "08:00",
              "bitis_saati": "14:30"
            }
          ]
        },
        "gece_vardiya": {
          "vardiya_id": 2,
          "vardiya_adi": "Gece",
          "calisma_suresi_dakika": 390,
          "is_emirleri": [
            {
              "is_emri_id": 102,
              "is_emri_no": "IE-2026-00102",
              "parca_kodu": "P-5678",
              "parca_adi": "Kapak",
              "adet": 150,
              "tamamlanan_adet": 75,
              "durum": "aktif",
              "teknik_resim": "/uploads/parcalar/P-5678-thumb.png",
              "baslangic_saati": "20:00",
              "bitis_saati": null
            }
          ]
        }
      }
    ]
  }
}
```

### Veritabanı Sorguları

#### 1. Tezgah Listesi
```sql
SELECT tezgah_id, tezgah_tanimi
FROM tezgahlar
WHERE aktif = true
ORDER BY tezgah_tanimi;
```

#### 2. Vardiya Tanımları
```sql
SELECT * FROM vardiyalar
WHERE aktif = true
ORDER BY baslangic_saati;
```

#### 3. İş Emirleri (Tarih Bazlı)
```sql
SELECT
  ie.is_emri_id,
  ie.is_emri_no,
  ie.parca_kodu,
  p.parca_adi,
  ie.adet,
  ie.durum,
  p.teknik_resim,
  ie.created_at as atama_tarihi
FROM is_emirleri ie
LEFT JOIN parcalar p ON ie.parca_kodu = p.parca_kodu
WHERE
  ie.tezgah_id = :tezgah_id
  AND DATE(ie.created_at) = :tarih
ORDER BY ie.created_at;
```

#### 4. Çalışma Süresi Hesaplama
```sql
SELECT
  SUM(
    CASE
      WHEN durum = true AND lead_durum = false
      THEN TIMESTAMPDIFF(MINUTE, timestamp, lead_timestamp)
      ELSE 0
    END
  ) as toplam_calisma_dakika
FROM (
  SELECT
    timestamp,
    durum,
    LAG(timestamp) OVER (ORDER BY timestamp) as lead_timestamp,
    LAG(durum) OVER (ORDER BY timestamp) as lead_durum
  FROM tezgah_durum_logs
  WHERE
    tezgah_id = :tezgah_id
    AND DATE(timestamp) = :tarih
    AND (
      (TIME(timestamp) >= :vardiya_baslangic AND TIME(timestamp) < :vardiya_bitis)
      OR (:vardiya_baslangic > :vardiya_bitis AND
          (TIME(timestamp) >= :vardiya_baslangic OR TIME(timestamp) < :vardiya_bitis))
    )
) t;
```

#### 5. Tamamlanan İş Miktarı (İşlem Kayıtlarından)
```sql
SELECT
  is_emri_no,
  SUM(islenen_adet) as toplam_tamamlanan
FROM islem_kayitlari
WHERE
  tezgah_id = :tezgah_id
  AND DATE(islem_tarihi) = :tarih
GROUP BY is_emri_no;
```

---

## 🎨 Frontend Design

### Sayfa Düzeni

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Günlük Vardiya Raporu                     📅 05 Ocak 2026   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔧 Tornalama-01                                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ☀️ Gündüz Vardiyası (08:00-16:00)  |  🌙 Gece (16:00-24:00)│
│  │  ⏱️ 420 dakika çalışma         |  ⏱️ 390 dakika çalışma  │
│  ├────────────────────────────────┼─────────────────────────┤   │
│  │  ┌──────────────────────┐      │  ┌──────────────────┐   │   │
│  │  │  🖼️                 │      │  │  🖼️              │   │   │
│  │  │  [Resim]            │      │  │  [Resim]         │   │   │
│  │  │  IE-2026-00101      │      │  │  IE-2026-00102   │   │   │
│  │  │  Mil Set            │      │  │  Kapak           │   │   │
│  │  │  100/100 ✅         │      │  │  75/150 🔄       │   │   │
│  │  └──────────────────────┘      │  └──────────────────┘   │   │
│  │                                │                         │   │
│  │  [Boş alan]                    │  [Boş alan]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔧 CNC-02                                              │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ☀️ Gündüz Vardiyası (08:00-16:00)  |  🌙 Gece (16:00-24:00)│
│  │  ⏱️ 0 dakika çalışma           |  ⏱️ 120 dakika çalışma│
│  ├────────────────────────────────┼─────────────────────────┤   │
│  │  [Vardiya aktif değildi]      │  ┌──────────────────┐   │   │
│  │                                │  │  🖼️              │   │   │
│  │                                │  │  [Resim]         │   │   │
│  │                                │  │  IE-2026-00105   │   │   │
│  │                                │  │  ...             │   │   │
│  │                                │  └──────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Yapısı

```
GunlukVardiyaRaporu/
├── GunlukVardiyaRaporu.jsx          # Ana sayfa component
├── TezgahVardiyaKarti.jsx           # Tek tezgah vardiya görünümü
├── VardiyaBolmesi.jsx               # Gündüz/Gece vardiya alanı
├── IsEmriRaporKarti.jsx             # İş emri kartı (resimli)
├── RaporHeader.jsx                  # Tarih seçici + başlık
└── index.js                         # Export'lar
```

### Material-UI Komponentleri

- `Container`, `Grid` - Ana layout
- `Card`, `CardHeader`, `CardContent` - Kart yapısı
- `Divider` - Vardiya ayracı
- `Typography` - Metin stilleri
- `DatePicker` - Tarih seçimi
- `Box` - Flexbox layout'lar
- `Avatar` - İş emri resimleri için
- `Chip` - Durum etiketleri
- `LinearProgress` - İş emri ilerleme çubuğu

---

## 📊 Durum Yönetimi (Durum Kodları)

### İş Emri Durumları
- `tamamlandi` - İş %100 tamamlandı, yeşil border
- `aktif` - İş hala yapılıyor, mavi border
- `beklemede` - İş bir nedenle bekliyor, sarı border
- `iptal` - İş iptal edildi, kırmızı border + opacity

### Vardiya Durumları
- `aktif` - Vardiya çalışıyor, yeşil icon
- `planlanan` - Vardiya henüz başlamadı, gri icon
- `tamamlandi` - Vardiya bitti, mavi icon

---

## 🔌 API Endpoints

### Backend Routes

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/raporlar/gunluk-vardiya` | GET | Tarih bazlı vardiya raporu |
| `/api/raporlar/gunluk-vardiya/ozet` | GET | Özet istatistikler (toplam adet, tamamlanan iş sayısı) |
| `/api/raporlar/gunluk-vardiya/export` | GET | PDF/Excel export |

### Query Parameters
- `tarih` (required): `YYYY-MM-DD` formatında tarih
- `tezgah_id` (optional): Belirli tezgah filtreleme
- `vardiya_id` (optional): Belirli vardiya filtreleme

---

## 🧪 Test Senaryoları

### Test-1: Boş Vardiya
**Senaryo**: Tezgah belirli bir vardiyada hiç çalışmamış
**Beklenti**: "Vardiya aktif değildi" mesajı gösterilir
**Çalışma süresi**: 0 dakika

### Test-2: Tamamlanan İş
**Senaryo**: İş emri tamamlanmış, başka işe geçilmiş
**Beklenti**: Tamamlanan iş yeşil border ile gösterilir
**İş emri kartında**: "100/100 ✅" etiketi

### Test-3: Aktif İş
**Senaryo**: İş emri hala yapılıyor
**Beklenti**: Aktif iş mavi border ile gösterilir
**İş emri kartında**: "75/150 🔄" etiketi + ilerleme çubuğu

### Test-4: Gece Yarısı Vardiyası
**Senaryo**: Gece vardiyası 23:00'de başlıyor, 07:00'de bitiyor
**Beklenti**: Tarih sınırı doğru hesaplanır (00:00'den sonra sonraki gün)

### Test-5: Resim Yükleneme
**Senaryo**: İş emrinin teknik resmi yok
**Beklenti**: Placeholder icon gösterilir (örn: `ImageIcon`)

---

## 📝 Implementation Task List

### Backend Tasks (Öncelik Sırası)

| ID | Task | Karmaşıklık | Tahmini Süre |
|----|------|-------------|--------------|
| BE-GUNLUK-001 | Controller: `gunlukVardiyaRaporu` function | Orta | 2 saat |
| BE-GUNLUK-002 | Service: Vardiya süresi hesaplama logic | Yüksek | 3 saat |
| BE-GUNLUK-003 | Query: İş emri atama ve tamamlanma sorgusu | Orta | 1 saat |
| BE-GUNLUK-004 | API Route: `/api/raporlar/gunluk-vardiya` | Basit | 30 dakika |
| BE-GUNLUK-005 | Unit Test: Backend controller tests | Orta | 1 saat |

### Frontend Tasks

| ID | Task | Karmaşıklık | Tahmini Süre |
|----|------|-------------|--------------|
| FE-GUNLUK-001 | Component: `GunlukVardiyaRaporu` main page | Orta | 2 saat |
| FE-GUNLUK-002 | Component: `TezgahVardiyaKarti` layout | Orta | 1.5 saat |
| FE-GUNLUK-003 | Component: `IsEmriRaporKarti` with image | Orta | 1.5 saat |
| FE-GUNLUK-004 | API Service: `gunlukVardiyaRaporu` | Basit | 30 dakika |
| FE-GUNLUK-005 | Route: `/raporlar/gunluk-vardiya` | Basit | 15 dakika |
| FE-GUNLUK-006 | Unit Test: Component tests | Orta | 1 saat |

### Documentation Tasks

| ID | Task | Karmaşıklık | Tahmini Süre |
|----|------|-------------|--------------|
| DOC-GUNLUK-001 | API dokümantasyon güncellemesi | Basit | 30 dakika |
| DOC-GUNLUK-002 | Kullanıcı kılavuzu ekleme | Basit | 30 dakika |

**Toplam Tahmini Süre**: ~18 saat

---

## 🚀 Implementation Phases

### Phase 1: Backend Foundation (4 saat)
1. Controller oluşturma
2. Vardiya süresi hesaplama service
3. İş emri sorguları
4. API route kaydı
5. Unit testler

### Phase 2: Frontend Components (6 saat)
1. Ana sayfa component
2. Tezgah vardiya kartı
3. İş emri kartı (resimli)
4. API service
5. Route ekleme
6. Component testleri

### Phase 3: Integration & Testing (2 saat)
1. Backend-Frontend entegrasyonu
2. E2E test senaryoları
3. Responsive design test
4. Performance optimizasyonu

### Phase 4: Documentation & Deployment (1 saat)
1. API dokümantasyonu
2. Kullanıcı kılavuzu
3. Production deployment

---

## ⚠️ Riskler ve Mitigasyon

### Risk-1: Vardiya Süresi Hesaplama Karmaşıklığı
**Risk**: Gece yarısı geçen vardiyaların süresi yanlış hesaplanabilir
**Mitigasyon**:
- Test senaryoları kapsamlı yazılır
- Vardiya bitiş saati < başlangıç saati durumları özel handling

### Risk-2: Performans
**Risk**: Çok sayıda tezgah ve iş emri olduğunda yavaş yanıt
**Mitigasyon**:
- Sorgular optimize edilir (index kullanımı)
- Caching mekanizması eklenebilir
- Lazy loading (iş emirleri pagination)

### Risk-3: Resim Dosyaları
**Risk**: Büyük resim dosyaları sayfa yükleme hızını düşürebilir
**Mitigasyon**:
- Thumbnail kullanımı zorunlu
- Image lazy loading
- WebP formatı tercih edilir

---

## 📸 UI Mockup (Wireframe)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ÜRTM Takip Sistemi           🔔 👤  Admin              │
├─────────────────────────────────────────────────────────────────────┤
│  📊 Raporlar │ 📋 İş Emirleri │ 🔧 Tezgahlar │ 📦 Parçalar │ ...  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📅 Günlük Vardiya Raporu                     [📅 Tarih Seçici]    │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  🔧 TORNALAMA-01                                              │ │
│  │  ┌─────────────────────────┬─────────────────────────────┐   │ │
│  │  │  ☀️ Gündüz (08:00-16:00)│  🌙 Gece (16:00-24:00)      │   │ │
│  │  │  ⏱️ 420 dakika          │  ⏱️ 390 dakika             │   │ │
│  │  ├─────────────────────────┼─────────────────────────────┤   │ │
│  │  │  ┌─────────────────┐   │  ┌───────────────────────┐  │   │ │
│  │  │  │  🖼️             │   │  │  🖼️                   │  │   │ │
│  │  │  │  [Thumbnail]    │   │  │  [Thumbnail]          │  │   │ │
│  │  │  │  ─────────────  │   │  │  ──────────────────    │  │   │ │
│  │  │  │  IE-2026-00101  │   │  │  IE-2026-00102        │  │   │ │
│  │  │  │  Mil Set        │   │  │  Kapak                │  │   │ │
│  │  │  │  ██████████ 100%│   │  │  ████████░░ 50%       │  │   │ │
│  │  │  │  100/100 ✅     │   │  │  75/150 🔄            │  │   │ │
│  │  │  └─────────────────┘   │  └───────────────────────┘  │   │ │
│  │  │                         │                            │   │ │
│  │  │  ┌─────────────────┐   │  [Vardiya boş]            │   │ │
│  │  │  │  🖼️             │   │                            │   │ │
│  │  │  │  [Thumbnail]    │   │                            │   │ │
│  │  │  │  IE-2026-00103  │   │                            │   │ │
│  │  │  │  ...            │   │                            │   │ │
│  │  │  └─────────────────┘   │                            │   │ │
│  │  └─────────────────────────┴─────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  🔧 CNC-02                                                    │ │
│  │  ┌─────────────────────────┬─────────────────────────────┐   │ │
│  │  │  ☀️ Gündüz (08:00-16:00)│  🌙 Gece (16:00-24:00)      │   │ │
│  │  │  ⏱️ 0 dakika            │  ⏱️ 120 dakika            │   │ │
│  │  ├─────────────────────────┼─────────────────────────────┤   │ │
│  │  │  💤 Vardiya aktif değildi│  ┌───────────────────────┐  │   │ │
│  │  │                         │  │  🖼️                   │  │   │ │
│  │  │                         │  │  [Thumbnail]          │  │   │ │
│  │  │                         │  │  IE-2026-00105        │  │   │ │
│  │  │                         │  │  ...                  │  │   │ │
│  │  │                         │  └───────────────────────┘  │   │ │
│  │  └─────────────────────────┴─────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Metrics (Başarı Kriterleri)

### KPI-1: Kullanıcı Kabulü
- **Hedef**: Üretim planlayıcılarının %90'ı sistemi günlük kullanır
- **Ölçüm**: 30 günlük kullanım istatistikleri

### KPI-2: Performans
- **Hedef**: Rapor yükleme süresi < 3 saniye (10 tezgah için)
- **Ölçüm**: Backend API response time logs

### KPI-3: Veri Doğruluğu
- **Hedef**: Çalışma süresi hesaplama doğruluğu %99+
- **Ölçüm**: Manuel kayıtlarla otomatik hesaplama karşılaştırması

---

## 📞 İletişim ve Onay

**PM Agent**: ✅ PRD hazır
**Sonraki Adım**: Kullanıcı onayı sonrası implementation başlar

**Soru**: Bu PRD'da eklemek veya değiştirmek istediğiniz bir şey var mı?
