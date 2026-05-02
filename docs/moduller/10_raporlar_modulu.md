# 10. RAPORLAR (Reports) Modülü

## Genel Bakış

Raporlar modülü, üretim performansı, makine verimliliği ve iş emri istatistiklerinin raporlanmasını sağlar.

**Route Dosyası:** `backend/src/routes/raporRoutes.js`
**Controller Dosyası:** `backend/src/controllers/raporController.js`
**Frontend Sayfası:** `frontend/src/pages/Raporlar.jsx`

---

## Modül Amacı

- Üretim raporları oluşturma
- Tezgah performans analizi
- İş emri istatistikleri
- Parça bazlı raporlama
- Vardiya bazlı değerlendirme
- Excel/PDF export

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /is-emri-ozet` | İş emri özet raporu |
| `GET /parca-performans` | Parça performans raporu |
| `GET /parca-bazli-is-emirleri` | Parça bazlı iş emirleri |
| `GET /tezgah-performans` | Tezgah performans raporu |
| `GET /planlama-gerceklesme` | Planlama vs gerçekleşme |
| `GET /tamamlanan-is-emirleri` | Tamamlanan iş emirleri |
| `GET /uretim-istatistikleri` | Üretim istatistikleri |
| `GET /vardiya-tezgah` | Vardiya-tezgah raporu |
| `GET /ozet` | Genel özet rapor |
| `GET /detayli/:raporTuru` | Detaylı rapor |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /rapor-olustur` | Özel rapor oluştur |
| `POST /export` | Raporu export et |

---

## Rapor Türleri

### 1. İş Emri Özet Raporu
- Toplam iş emri sayısı
- Durum dağılımı
- Tamamlanma oranı
- Ortalama süre

### 2. Parça Performans Raporu
- Parça bazında üretim adedi
- Fire oranları
- Maliyet analizi

### 3. Tezgah Performans Raporu
- Çalışma süresi
- Verimlilik yüzdesi
- Boşta kalma süresi
- Tamamlanan iş sayısı

### 4. Planlama vs Gerçekleşme
- Planlanan vs gerçekleşen
- Sapma yüzdesi
- Gecikme analizi

### 5. Vardiya Raporu
- Vardiya bazlı üretim
- Personel verimliliği
- Durum analizi

---

## Performans Metrikleri

| Metrik | Açıklama | Formül |
|--------|----------|--------|
| Verimlilik | Gerçek çalışma / Planlanan | (Çalışma / Toplam) × 100 |
| Fire Oranı | Fire / Toplam Üretim | (Fire / Toplam) × 100 |
| Tamamlanma | Tamamlanan / Toplam | (Tamamlanan / Toplam) × 100 |
| MTBF | Ortalama arızasız süre | Toplam Süre / Arıza Sayısı |
| MTTR | Ortalama onarım süresi | Toplam Onarım / Arıza Sayısı |

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Raporlar.jsx` | Ana raporlar sayfası |
| `RaporListesi.jsx` | Rapor türleri listesi |
| `RaporDetay.jsx` | Rapor detay görünümü |
| `RaporFiltreleme.jsx` | Filtreleme seçenekleri |
| `RaporGrafik.jsx` | Grafik gösterimi |
| `ExcelExport.jsx` | Excel export butonu |

---

## Grafik Türleri

| Tür | Kullanım Alanı |
|-----|----------------|
| Çizgi Grafik | Zaman bazlı trendler |
| Sütun Grafik | Karşılaştırmalar |
| Pasta Grafik | Dağılım oranları |
| Heatmap | Yoğunluk haritası |

---

## Export Formatları

| Format | Açıklama |
|--------|----------|
| Excel (.xlsx) | Detaylı veri, grafikli |
| PDF | Yazdırma için optimize |
| CSV | Basit veri aktarımı |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `rapor:generated` | Rapor oluşturuldu |
| `rapor:exported` | Rapor export edildi |

---

## İlişkili Modüller

- **İş Emirleri** - İş emri verileri
- **Tezgahlar** - Tezgah performansı
- **Vardiya Yönetimi** - Vardiya raporları
- **Parçalar** - Parça bazlı analiz
- **Arıza-Bakım** - Arıza istatistikleri

---

## Kullanım Senaryoları

### Senaryo 1: Haftalık Rapor
1. Kullanıcı raporlar sayfasını açar
2. "Haftalık Özet" seçer
3. Tarih aralığı seçer (bu hafta)
4. "Rapor Oluştur" tıklar
5. Sistem verileri işler
6. Grafikli rapor görüntüler

### Senaryo 2: Tezgah Analizi
1. Kullanıcı tezgah performans raporu seçer
2. Tezgah seçer
3. Dönem seçer (ay/yıl)
4. Detaylı analiz görüntülenir
5. Excel export yapılır

---

## Rapor Şablonları

### Günlük Rapor
- Bugünkü üretim özeti
- Tamamlanan iş emirleri
- Anlık stok durumu

### Haftalık Rapor
- Haftalık trend
- Karşılaştırmalı analiz
- Performans grafiği

### Aylık Rapor
- Aylık özet
- Yıllık trend
- Kümülatif analiz

### Yıllık Rapor
- Yıllık değerlendirme
- Hedef karşılaştırması
- İyileştirme önerileri

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Grafik entegrasyonu |
| 1.2 | 2024-09 | Excel export eklendi |
| 1.3 | 2024-12 | Şablon sistemi |
| 1.4 | 2025-02 | Real-time raporlama |