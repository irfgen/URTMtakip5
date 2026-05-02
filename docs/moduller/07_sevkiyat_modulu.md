# 7. SEVKİYAT (Shipping) Modülü

## Genel Bakış

Sevkiyat modülü, tamamlanan üretimin müşteriye sevkini, teslimat takibini ve resim dokümantasyonunu yönetir.

**Route Dosyası:** `backend/src/routes/sevkiyat.js`
**Controller Dosyası:** `backend/src/controllers/sevkiyatController.js`
**Frontend Sayfası:** `frontend/src/pages/Sevkiyat.jsx`

---

## Modül Amacı

- Sevkiyat oluşturma ve yönetim
- Kalem bazlı sevk takibi
- Resim dokümantasyonu
- Teslimat durumu takibi
- Toplu sevkiyat desteği
- QR kod desteği

---

## Veritabanı Tablosu

**Ana Tablo:** `sevkiyat`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| sevkiyat_no | STRING | Sevkiyat numarası |
| tarih | DATETIME | Sevkiyat tarihi |
| musteri | STRING | Müşteri adı |
| adres | TEXT | Teslimat adresi |
| tel | STRING | Telefon |
| durum | STRING | hazirlaniyor, yola_cikti, teslim_edildi, iptal |
| toplam_kalem | INTEGER | Toplam kalem sayısı |
| toplam_adet | INTEGER | Toplam adet |
| teslim_eden | STRING | Teslim eden kişi |
| teslim_alan | STRING | Teslim alan kişi |
| teslim_tarihi | DATETIME | Teslim tarihi |
| notlar | TEXT | Notlar |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

**Kalemler Tablosu:** `sevkiyat_kalemleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| sevkiyat_id | INTEGER | Sevkiyat ID |
| parca_kodu | STRING | Parça kodu |
| parca_adi | STRING | Parça adı |
| adet | INTEGER | Sevk edilecek adet |
| birim | STRING | Birim |
| fis_no | STRING | Fiş/fatura numarası |
| durum | STRING | beklemede, sevkedildi, iptal |
| created_at | DATETIME | Oluşturulma tarihi |

**Resimler Tablosu:** `sevkiyat_resimler`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| sevkiyat_id | INTEGER | Sevkiyat ID |
| kalem_id | INTEGER | Kalem ID (nullable) |
| resim_yolu | STRING | Resim dosya yolu |
| resim_turu | STRING | tur: sevkiyat, kalem, temsil |
| aciklama | STRING | Açıklama |
| olusturma_tarihi | DATETIME | Oluşturulma tarihi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm sevkiyatları listele |
| `GET /:id` | Sevkiyat detayı |
| `GET /:sevkiyatId/resimler` | Sevkiyat resimleri |
| `GET /:sevkiyatId/kalemler` | Sevkiyat kalemleri |
| `GET /:sevkiyatId/kalem/:kalemId/resimler` | Kalem resimleri |
| `GET /raporlar` | Sevkiyat raporları |
| `GET /lokasyonlar` | Lokasyon listesi |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni sevkiyat oluştur |
| `POST /:id/resimler` | Resim yükle |
| `POST /:id/kalem/:kalemId/resimler` | Kalem resmi yükle |
| `POST /toplu` | Toplu sevkiyat oluştur |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Sevkiyat güncelle |
| `PUT /:id/tamamla` | Sevkiyatı tamamla |
| `PUT /:id/kapat` | Sevkiyatı kapat |
| `PUT /:id/teslim-al` | Teslim al |
| `PUT /:sevkiyat_id/kalemler/:kalem_id` | Kalem güncelle |
| `PUT /:sevkiyatId/kalem/:kalemId/resimler/:resimId/temsil` | Temsil resim yap |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Sevkiyat sil |
| `DELETE /:sevkiyat_id/kalemler/:kalem_id` | Kalem sil |
| `DELETE /:sevkiyatId/resim/:resimId` | Resim sil |

---

## Alt Modüller

### 1. Sevkiyat Kalemleri
**Dosya:** `sevkiyat-kalemleri.js`

Sevkiyat kalemlerinin yönetimi.

### 2. Sevkiyat Lokasyonları
**Dosya:** `sevkiyat-lokasyonlar.js`

Depo/teslimat lokasyonları.

| Endpoint | Açıklama |
|----------|----------|
| `GET /lokasyonlar` | Lokasyonları listele |
| `POST /lokasyonlar` | Yeni lokasyon ekle |
| `PUT /lokasyonlar/:id` | Güncelle |
| `DELETE /lokasyonlar/:id` | Sil |

### 3. Sevkiyat Raporları
**Dosya:** `sevkiyat-raporlar.js`

Sevkiyat istatistikleri ve raporları.

### 4. Toplu Sevkiyat
**Dosya:** `toplu-sevkiyat.js`

Birden fazla siparişi birleştiren sevkiyat.

| Endpoint | Açıklama |
|----------|----------|
| `GET /toplu/:topluId/kalemler` | Toplu sevkiyat kalemleri |
| `POST /toplu/:topluId/kalemler` | Kalem ekle |
| `PUT /toplu_id/kalemler/:kalem_id` | Kalem güncelle |
| `DELETE /toplu_id/kalemler/:kalem_id` | Kalem sil |

### 5. Otomasyon
**Dosya:** `shipmentAutomationRoutes.js`

Otomatik sevkiyat oluşturma.

---

## Temel Fonksiyonlar

### 1. sevkiyatOlustur(sevkiyatData)
Yeni sevkiyat oluşturur.
- Sevkiyat numarası üretir
- Tarih atar

### 2. kalemEkle(sevkiyatId, kalemData)
Sevkiyata kalem ekler.
- Parça kodu doğrulama
- Adet kontrolü

### 3. resimYukle(sevkiyatId, resimData, kalemId)
Sevkiyat veya kalem resmi yükler.
- Görsel optimizasyonu (Sharp)
- Thumbnail oluşturma

### 4. teslimEt(sevkiyatId, teslimData)
Sevkiyatı teslim edilmiş olarak işaretler.
- Teslim tarihi kaydı
- Teslim alan bilgisi

### 5. durumGuncelle(sevkiyatId, yeniDurum)
Sevkiyat durumunu günceller.

---

## Durum Akışı

```
hazirlaniyor → yola_cikti → teslim_edildi
       ↓            ↓
     iptal        iptal
```

| Durum | Açıklama |
|-------|----------|
| hazirlaniyor | Hazırlık aşamasında |
| yola_cikti | Sevk edildi, yolda |
| teslim_edildi | Teslim tamamlandı |
| iptal | Sevkiyat iptal edildi |

---

## Resim Dokümantasyonu

### Resim Türleri

| Tür | Açıklama |
|-----|----------|
| sevkiyat | Genel sevkiyat görselleri |
| kalem | Kalem özel görselleri |
| temsil | Temsili görsel (kullanıcı seçimi) |

### Özellikler
- Çoklu resim desteği
- Temsil resim seçimi
- Otomatik thumbnail
- Büyük görsel modal

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Sevkiyat.jsx` | Ana sevkiyat sayfası |
| `SevkiyatListesi.jsx` | Sevkiyat listesi |
| `SevkiyatForm.jsx` | Sevkiyat formu |
| `SevkiyatDetay.jsx` | Sevkiyat detay |
| `SevkiyatKalemleri.jsx` | Kalem listesi |
| `SevkiyatResimleri.jsx` | Resim galerisi |
| `CameraCapture.jsx` | Kamera ile çekim |
| `FullScreenImageModal.jsx` | Tam ekran görsel |
| `TopluSevkiyatForm.jsx` | Toplu sevkiyat formu |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `sevkiyat:created` | Yeni sevkiyat oluşturuldu |
| `sevkiyat:updated` | Sevkiyat güncellendi |
| `sevkiyat:statusChanged` | Durum değişti |
| `sevkiyat:resimEklendi` | Resim eklendi |
| `sevkiyat:teslimEdildi` | Teslim edildi bildirimi |

---

## İlişkili Modüller

- **İş Emirleri** - Tamamlanan işler sevk edilir
- **Parçalar** - Parça bilgileri
- **Faturalar** - Fatura entegrasyonu
- **İrsaliyeler** - İrsaliye bağlantısı
- **Firma Yönetimi** - Müşteri bilgileri

---

## Kullanım Senaryoları

### Senaryo 1: Yeni Sevkiyat Oluşturma
1. Kullanıcı "Yeni Sevkiyat" seçer
2. Müşteri bilgilerini girer
3. Kalemleri ekler (parça seçimi, adet)
4. Resim docümantasyonu yapar
5. Kaydet ve onaya gönderir

### Senaryo 2: Kamera ile Resim Çekme
1. Kullanıcı sevkiyat detayını açar
2. "Resim Ekle" butonuna tıklar
3. Kamera açılır
4. Fotoğraf çeker
5. Açıklama girer ve kaydeder

### Senaryo 3: Teslim Bildirimi
1. Kargo teslimatı yapılır
2. Kullanıcı sevkiyatı bulur
3. "Teslim Edildi" butonuna tıklar
4. Teslim alan bilgisi girer
5. Tarih otomatik kaydedilir

---

## Validasyon Kuralları

- `sevkiyat_no` benzersiz olmalı
- En az 1 kalem olmalı
- Kalem adedi > 0
- Telefon geçerli format

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| SV001 | Sevkiyat bulunamadı | Geçersiz ID |
| SV002 | Kalem bulunamadı | Geçersiz kalem ID |
| SV003 | Resim yüklenemedi | Dosya hatası |
| SV004 | Geçersiz durum geçişi | Durum akışı kurallarına uymuyor |
| SV005 | Temsil resim seçilemedi | Resim bulunamadı |

---

## Raporlar

### Sevkiyat Özet Raporu
- Tarih aralığına göre
- Müşteri bazlı özet
- Durum dağılımı

### Teslimat Performans Raporu
- Gecikmeler
- İptal oranları
- Müşteri bazlı analiz

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Resim dokümantasyonu |
| 1.2 | 2024-09 | Kamera entegrasyonu |
| 1.3 | 2024-12 | Toplu sevkiyat desteği |
| 1.4 | 2025-02 | Otomasyon modülü |