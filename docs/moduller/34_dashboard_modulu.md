# 34. DASHBOARD Modülü

## Genel Bakış

Dashboard modülü, üretim sisteminin genel durumunu, KPI'ları ve gerçek zamanlı verileri görüntüleyen ana paneli sağlar.

**Frontend Sayfası:** `frontend/src/pages/Dashboard.jsx`
**Frontend Sayfası:** `frontend/src/pages/UretimPanosu.jsx`

---

## Modül Amacı

- Genel üretim durumu özeti
- KPI'lar (Key Performance Indicators)
- Tezgah durumları
- Kritik uyarılar
- Real-time güncellemeler

---

## KPI Göstergeleri

| KPI | Açıklama | Hesaplama |
|-----|----------|-----------|
| Günlük Üretim | Bugünkü üretilen adet | Σ tamamlanan_adet |
| Verimlilik | Gerçek/Planlanan | (Gerçek / Hedef) × 100 |
| Fire Oranı | Fire/Toplam | (Fire / Toplam) × 100 |
| Tezgah Kullanımı | Çalışan/Pasif | (Aktif / Toplam) × 100 |
| Aktif İş Emirleri | Bekleyen + Üretimde | count |
| Kritik Stok | Kritik seviyede stok | count |

---

## Gösterge Panelleri

### 1. Tezgah Durumu
- Aktif tezgahlar (yeşil)
- Boşta tezgahlar (sarı)
- Arızalı tezgahlar (kırmızı)

### 2. Üretim Durumu
- Bekleyen iş emirleri
- Üretimde olan işler
- Tamamlanan işler

### 3. Stok Durumu
- Kritik stok uyarıları
- Düşük stok göstergesi
- Son hareketler

### 4. Alarm ve Uyarılar
- Kritik durumlar
- Gecikmeler
- Bakım hatırlatmaları

---

## Grafikler

| Grafik | Tip | Açıklama |
|---------|-----|----------|
| Üretim Trend | Çizgi | Günlük/haftalık trend |
| Tezgah Dağılımı | Pasta | Durum dağılımı |
| Fire Analizi | Sütun | Fire oranı karşılaştırması |
| Vardiya Performansı | Sütun | Vardiya bazlı üretim |

---

## Real-time Veriler

Socket.IO ile anlık güncellemeler:
- Yeni iş emri oluştuğunda
- Tezgah durumu değiştiğinde
- Stok kritik seviyeye düştüğünde
- Alarm oluştuğunda

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Dashboard.jsx` | Ana dashboard sayfası |
| `UretimPanosu.jsx` | Üretim panosu |
| `KPIGosterge.jsx` | KPI kartları |
| `TezgahDurumPanel.jsx` | Tezgah durum özeti |
| `UretimGrafik.jsx` | Üretim grafikleri |
| `AlarmPaneli.jsx` | Alarm ve uyarılar |
| `SonIslemler.jsx` | Son işlemler listesi |

---

## Mobil Uyum

- Sade kart tasarımı
- Dokunmatik grafikler
- Hızlı erişim menüsü
- Bildirim desteği

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `dashboard:update` | Dashboard verileri güncellendi |
| `kpi:changed` | KPI değişti |
| `alert:new` | Yeni alarm oluştu |

---

## İlişkili Modüller

- **İş Emirleri** - Üretim verileri
- **Tezgahlar** - Tezgah durumları
- **Stok Kartları** - Stok durumu
- **Arıza-Bakım** - Alarmlar
- **Tamamlanan İşler** - Üretim istatistikleri

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-01 | İlk versiyon |
| 1.1 | 2024-05 | Real-time güncellemeler |
| 1.2 | 2024-09 | Grafik entegrasyonu |
| 1.3 | 2024-12 | Mobil uyum |
| 1.4 | 2025-02 | Alarm sistemi |