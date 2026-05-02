# 6. STOK KARTLARI (Inventory Cards) Modülü

## Genel Bakış

Stok Kartları modülü, hammadde ve yarı mamul stoğunun takibini, kritik seviye uyarılarını ve tedarikçi bilgilerini yönetir.

**Route Dosyası:** `backend/src/routes/stokKartlariRoutes.js`
**Controller Dosyası:** `backend/src/controllers/stokKartlariController.js`
**Frontend Sayfası:** `frontend/src/pages/StokKartlari.jsx`

---

## Modül Amacı

- Stok kartı oluşturma ve yönetim
- Stok miktarı takibi (giriş/çıkış)
- Kritik seviye uyarıları
- Tedarikçi bilgileri
- Malzeme cinsi kategorileri
- Stok hareket geçmişi

---

## Veritabanı Tablosu

**Ana Tablo:** `stok_kartlari`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| stok_kodu | STRING | Stok kartı kodu |
| malzeme_adi | STRING | Malzeme adı |
| malzeme_cinsi | STRING | Malzeme cinsi/tip |
| birim | STRING | Birim (kg, adet, mt) |
| miktar | DECIMAL | Mevcut stok miktarı |
| birim_fiyat | DECIMAL | Birim fiyat |
| toplam_deger | DECIMAL | Toplam stok değeri |
| kritik_seviye | DECIMAL | Kritik stok seviyesi |
| max_seviye | DECIMAL | Maximum stok seviyesi |
| tedarikci_id | INTEGER | Tedarikçi ID |
| tedarik_suresi | INTEGER | Tedarik süresi (gün) |
| lokasyon | STRING | Depo lokasyonu |
| raf | STRING | Raf numarası |
| aktif | BOOLEAN | Aktif/Pasif |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

**Hareket Tablosu:** `stok_hareketleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| stok_karti_id | INTEGER | Stok kartı ID |
| hareket_turu | STRING | giris, cikis, duzeltme |
| miktar | DECIMAL | Hareket miktarı |
| islem_tarihi | DATETIME | İşlem tarihi |
| islem_aciklama | STRING | Açıklama |
| islem_yapan | STRING | İşlemi yapan kişi |
| referans_no | STRING | Referans numarası |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm stok kartlarını listele |
| `GET /:id` | Stok kartı detayı |
| `GET /:id/durum` | Stok durumu |
| `GET /search/:arama` | Stok arama |
| `GET /kritik-stok` | Kritik stok seviyesindekiler |
| `GET /istatistikler` | Stok istatistikleri |
| `GET /malzeme-cinsleri` | Malzeme cinsi listesi |
| `GET /firmalar` | Tedarikçi firma listesi |
| `GET /ara/ham-malzeme-olcu` | Ham malzeme ölçü arama |
| `GET /gecmis/:stokKartiId` | Stok hareket geçmişi |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni stok kartı oluştur |
| `POST /:id/stok-giris` | Stok girişi |
| `POST /:id/stok-cikis` | Stok çıkışı |
| `POST /import` | Excel'den import |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Stok kartı güncelle |
| `PATCH /:id/durum` | Durum güncelle |
| `PUT /:id/dusuk-stok` | Düşük stok uyarısı |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Stok kartı sil |

---

## Temel Fonksiyonlar

### 1. stokKartiOlustur(kartiData)
Yeni stok kartı oluşturur.
- Stok kodu üretir
- Kritik seviye varsayılan değer atar

### 2. stokGiris(stokKartiId, miktar, aciklama)
Stok girişi yapar.
- Miktar artırır
- Hareket kaydı oluşturur

### 3. stokCikis(stokKartiId, miktar, referans)
Stok çıkışı yapar.
- Miktar azaltır
- Yetersiz stok kontrolü
- Hareket kaydı oluşturur

### 4. kritikStokKontrol()
Tüm stok kartlarını kontrol eder.
- Kritik seviye altındakileri işaretler
- Uyarı oluşturur

### 5. toplamDegerHesapla(stokKartiId)
Stok kartının toplam değerini hesaplar.
- Miktar × Birim fiyat

### 6. malzemeCinsiListesi()
Tüm malzeme cinslerini döner.
- Benzersiz değerler
- Dropdown için

---

## Stok Durumları

| Durum | Açıklama | Renk |
|-------|----------|------|
| Normal | Kritik seviye üzerinde | Yeşil |
| Düşük | Kritik seviyeye yakın | Sarı |
| Kritik | Kritik seviyede veya altında | Kırmızı |
| Yüksek | Maximum seviye üzerinde | Mavi |

---

## Kritik Seviye Sistemi

### Hesaplama
```
Durum = 
  miktar <= kritik_seviye → "Kritik"
  miktar <= kritik_seviye * 1.2 → "Düşük"
  miktar >= max_seviye → "Yüksek"
  otherwise → "Normal"
```

### Uyarı mekanizması
- Kritik stok email bildirimi
- Dashboard uyarı widget'ı
- Mobil bildirim

---

## Alt Modüller

### 1. Makina Stokları
**Dosya:** `makinaStokRoutes.js`
**Açıklama:** Makinalara özel stok yönetimi

| Endpoint | Açıklama |
|----------|----------|
| `GET /makina-stok` | Makina stokları |
| `POST /makina-stok` | Stok ekle |
| `POST /makina-stok/stoktan-dus` | Stoktan düş |
| `DELETE /makina-stok/:id` | Stok sil |

### 2. Stok Takip Listeleri
**Dosya:** `stokTakipListeleri.js`
**Açıklama:** Özel stok takip listeleri

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `StokKartlari.jsx` | Ana stok kartları sayfası |
| `StokKartiListesi.jsx` | Stok kartı listesi |
| `StokKartiForm.jsx` | Stok kartı formu |
| `StokKartiDetay.jsx` | Stok kartı detay |
| `KritikStokUyarisi.jsx` | Kritik stok uyarı component |
| `StokHareketGecmisi.jsx` | Hareket geçmişi |
| `StokGirisForm.jsx` | Stok giriş formu |
| `StokCikisForm.jsx` | Stok çıkış formu |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `stok:created` | Yeni stok kartı oluşturuldu |
| `stok:updated` | Stok güncellendi |
| `stok:giris` | Stok girişi yapıldı |
| `stok:cikis` | Stok çıkışı yapıldı |
| `stok:kritik` | Kritik stok uyarısı |

---

## İlişkili Modüller

- **Parçalar** - Parça bağlantısı
- **İş Emirleri** - Hammadde tüketimi
- **BOM Yönetimi** - Malzeme ihtiyaçları
- **Fason İşler** - Ham malzeme gönderimi
- **Tedarik Talepleri** - Otomatik talep oluşturma

---

## Kullanım Senaryoları

### Senaryo 1: Stok Çıkışı (İş Emri)
1. Sistem iş emri başlatıldığında otomatik çağırır
2. BOM'daki malzemeler için stok çıkışı yapar
3. Yetersiz stok durumunda uyarı verir

### Senaryo 2: Kritik Stok Uyarısı
1. Sistem periyodik olarak stok kontrolü yapar
2. Kritik seviyenin altına düşen stokları tespit eder
3. Email ve dashboard bildirimi gönderir
4. Otomatik tedarik talebi oluşturulabilir

### Senaryo 3: Manuel Stok Düzeltme
1. Kullanıcı sayım sonrası fark tespit eder
2. Stok kartını açar
3. "Düzeltme" seçer
4. Fark miktarını girer (+/-)
5. Açıklama ve onay

---

## Validasyon Kuralları

- `stok_kodu` benzersiz olmalı
- `malzeme_adi` zorunlu
- `miktar` >= 0
- `birim_fiyat` >= 0
- `kritik_seviye` < `max_seviye`

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| SK001 | Stok kartı bulunamadı | Geçersiz ID |
| SK002 | Yetersiz stok | Çıkış miktarı mevcuttan fazla |
| SK003 | Geçersiz miktar | Miktar negatif veya sıfır |
| SK004 | Kritik seviye hatası | Kritik > Max |

---

## Raporlar

### Stok Durumu Raporu
- Tüm stok kartları özeti
- Değer hesaplaması
- Kritik stok listesi

### Stok Hareket Raporu
- Tarih aralığına göre hareketler
- İşlem bazlı filtreleme
- Toplam giriş/çıkış özeti

### Kritik Stok Raporu
- Kritik seviyedeki kartlar
- Tedarik süresi bilgisi
- Önerilen sipariş miktarı

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-01 | İlk versiyon |
| 1.1 | 2024-05 | Kritik seviye sistemi |
| 1.2 | 2024-08 | Hareket takibi eklendi |
| 1.3 | 2024-11 | Kritik stok uyarıları |
| 1.4 | 2025-01 | Otomatik tedarik entegrasyonu |