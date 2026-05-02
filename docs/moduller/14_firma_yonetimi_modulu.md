# 14. FİRMA YÖNETİMİ (Company Management) Modülü

## Genel Bakış

Firma Yönetimi modülü, tedarikçi ve müşteri firmalarının bilgilerini, performans takibini ve iletişim bilgilerini yönetir.

**Route Dosyası:** `backend/src/routes/firmaRoutes.js`
**Controller Dosyası:** `backend/src/controllers/firmaController.js`

---

## Modül Amacı

- Firma tanımlama ve kayıt
- Tedarikçi yönetimi
- Müşteri yönetimi
- Performans değerlendirme
- İletişim bilgileri
- İstatistikler

---

## Veritabanı Tablosu

**Firmalar Tablosu:** `firmalar`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| firma_adi | STRING | Firma adı |
| firma_turu | STRING | tedarikci, musteri, her ikisi |
| vergi_no | STRING | Vergi numarası |
| vergi_dairesi | STRING | Vergi dairesi |
| adres | TEXT | Adres |
| sehir | STRING | Şehir |
| ulke | STRING | Ülke |
| telefon | STRING | Telefon |
| email | STRING | E-posta |
| web | STRING | Web sitesi |
| yetkili_kişi | STRING | Yetkili kişi |
| yetkili_telefon | STRING | Yetkili telefon |
| yetkili_email | STRING | Yetkili e-posta |
| banka_bilgileri | TEXT | Banka bilgileri |
| notlar | TEXT | Notlar |
| durum | BOOLEAN | Aktif/Pasif |
| toplam_alim | DECIMAL | Toplam alım |
| toplam_satis | DECIMAL | Toplam satış |
| puan | DECIMAL | Performans puanı |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm firmaları listele |
| `GET /:id` | Firma detayı |
| `GET /:id/istatistikler` | Firma istatistikleri |
| `GET /firma-performans` | Firma performans raporu |
| `GET /ara` | Firma arama |
| `GET /tedarikciler` | Sadece tedarikçiler |
| `GET /musteriler` | Sadece müşteriler |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni firma oluştur |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Firma güncelle |
| `PATCH /:id/durum` | Aktif/Pasif durumu değiştir |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Firma sil |

---

## Firma Türleri

| Tür | Açıklama |
|-----|----------|
| tedarikci | Tedarikçi firma |
| musteri | Müşteri firma |
| her ikisi | Hem tedarikçi hem müşteri |

---

## Temel Fonksiyonlar

### 1. firmaOlustur(firmaData)
Yeni firma kaydı oluşturur.

### 2. firmaGuncelle(firmaId, yeniData)
Firma bilgilerini günceller.

### 3. performansHesapla(firmaId)
Firma performans puanını hesaplar.
- Teslim süresi
- Kalite
- Fiyat performansı

### 4. istatistikGetir(firmaId)
Firma istatistiklerini döner.
- Toplam alış/satış
- İşlem sayısı
- Ortalama işlem tutarı

### 5. firmaAra(aramaKelime)
Firmalar arasında arama yapar.

---

## Performans Metrikleri

| Metrik | Açıklama |
|--------|----------|
| Teslimat Performansı | Zamanında teslimat % |
| Kalite Puanı | Kalite derecelendirmesi |
| Fiyat Uygunluğu | Piyasa karşılaştırması |
| Genel Puan | Ağırlıklı toplam |

---

## Durum

| Durum | Açıklama |
|-------|----------|
| aktif | Firma aktif |
| pasif | Firma pasif |

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `FirmaYonetimModal.jsx` | Firma yönetim modal |
| `FirmaEkleModal.jsx` | Firma ekleme modal |
| `FirmaListesi.jsx` | Firma listesi |
| `FirmaDetay.jsx` | Firma detay görünümü |
| `FirmaPerformans.jsx` | Performans kartı |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `firma:created` | Yeni firma eklendi |
| `firma:updated` | Firma güncellendi |
| `firma:deleted` | Firma silindi |

---

## İlişkili Modüller

- **Fason İşler** - Tedarikçi bağlantısı
- **Sevkiyat** - Müşteri bilgileri
- **Siparişler** - Sipariş bağlantısı
- **Faturalar** - Fatura bilgileri
- **Stok Kartları** - Tedarikçi bilgisi

---

## Kullanım Senaryoları

### Senaryo 1: Yeni Tedarikçi Ekleme
1. Admin "Yeni Firma" seçer
2. "Tedarikçi" türünü seçer
3. Firma bilgilerini girer
4. Vergi no, adres, yetkili bilgileri
5. Banka bilgilerini girer
6. Kaydeder

### Senaryo 2: Performans Değerlendirme
1. Tedarikçi seçilir
2. "Performans" sekmesi açılır
3. Teslim süresi, kalite notları görülür
4. Otomatik puan hesaplaması yapılır

---

## Validasyon Kuralları

- `firma_adi` zorunlu
- `firma_turu` geçerli değer olmalı
- `vergi_no` benzersiz (opsiyonel)
- `email` geçerli format
- `telefon` geçerli format

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| FR001 | Firma bulunamadı | Geçersiz ID |
| FR002 | Vergi no mevcut | Aynı vergi no var |
| FR003 | Geçersiz email | Email formatı hatalı |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-01 | İlk versiyon |
| 1.1 | 2024-05 | Performans puanı eklendi |
| 1.2 | 2024-09 | Arama özelliği eklendi |
| 1.3 | 2024-12 | İstatistikler eklendi |