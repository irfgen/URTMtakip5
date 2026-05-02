# 1. İŞ EMİRLERİ (Work Orders) Modülü

## Genel Bakış

İş Emirleri modülü, ÜRTM Takip sisteminin en temel ve merkezi modülüdür. Üretim süreçlerinin planlanması, takibi ve yönetimini sağlar.

**Route Dosyası:** `backend/src/routes/isEmirleriRoutes.js`
**Controller Dosyası:** `backend/src/controllers/isEmirleriController.js`
**Frontend Sayfası:** `frontend/src/pages/IsEmirleri.jsx`

---

## Modül Amacı

- Üretim iş emirlerinin oluşturulması
- İş emirlerinin tezgahlara atanması
- Gerçek zamanlı durum takibi
- Üretim sürecinin izlenmesi
- İş emri geçmişinin kaydedilmesi

---

## Veritabanı Tablosu

**Ana Tablo:** `is_emirleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| is_emri_no | STRING | İş emri numarası |
| parca_kodu | STRING |关联 parça kodu |
| tezgah_id | INTEGER | Tezgah ID |
| durum | STRING | Durum (Bekliyor, Üretimde, Tamamlandı) |
| priority | STRING | Öncelik (Düşük, Normal, Yüksek, Acil) |
| baslama_tarihi | DATE | Başlama tarihi |
| bitis_tarihi | DATE | Bitiş tarihi |
| adet | INTEGER | Üretilecek adet |
| tamamlanan_adet | INTEGER | Tamamlanan adet |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm iş emirlerini listele |
| `GET /:id` | İş emri detayı getir |
| `GET /aktif-is-emirleri` | Aktif (devam eden) iş emirleri |
| `GET /by-uretim-plani/:uretimPlaniId` | Üretim planına ait iş emirleri |
| `GET /atanabilir-modal` | Atanabilir iş emirleri (modal için) |
| `GET /:id/is-emirleri-gecmisi` | İş emri geçmişi |
| `GET /:id/istatistikler` | İş emri istatistikleri |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni iş emri oluştur |
| `POST /:id/baslat` | İş emrini başlat |
| `POST /:id/bitir` | İş emrini bitir |
| `POST /:id/is-ara-ver` | İşe ara ver |
| `POST /:id/is-emri-tamamla` | İş emrini tamamla |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | İş emri güncelle |
| `PUT /:id/durum` | Durum güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | İş emri sil |

---

## Temel Fonksiyonlar

### 1. isEmirleriListele()
Tüm iş emirlerini veritabanından çeker ve döner.

### 2. isEmriOlustur(isEmriData)
Yeni bir iş emri oluşturur.
- **Parametre:** isEmriData object
- **Dönüş:** Yeni oluşturulan iş emri

### 3. isEmriBaslat(isEmriId)
Bir iş emrini başlatır.
- Durumu "Üretimde" olarak günceller
- Başlama zamanını kaydeder

### 4. isEmriBitir(isEmriId)
Bir iş emrini bitirir.
- Durumu "Tamamlandı" olarak günceller
- Bitiş zamanını kaydeder
- Tamamlanan adedi günceller

### 5. isEmriDurumGuncelle(isEmriId, yeniDurum)
İş emri durumunu günceller.
- Durum geçişlerini loglar

### 6. isEmriSil(isEmriId)
Bir iş emrini siler (soft delete olabilir).

---

## Durumlar (Status Flow)

```
Bekliyor → Üretimde → Tamamlandı
    ↓          ↓
  İptal    İş Ara Verildi
              ↓
         Üretimde (devam)
```

| Durum | Açıklama |
|-------|----------|
| Bekliyor | İş emri oluşturuldu, henüz başlatılmadı |
| Üretimde | Üretim devam ediyor |
| İş Ara Verildi | Üretime ara verildi |
| Tamamlandı | Üretim tamamlandı |
| İptal | İş emri iptal edildi |

---

## Öncelik Seviyeleri

| Öncelik | Seviye | Açıklama |
|---------|--------|----------|
| Düşük | 1 | Normal öncelikli işler |
| Normal | 2 | Standart öncelik |
| Yüksek | 3 | Acil işler |
| Acil | 4 | Kritik öncelik |

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `IsEmirleri.jsx` | Ana iş emirleri sayfası |
| `IsEmriListesi.jsx` | İş emri listesi tablosu |
| `IsEmriKarti.jsx` | İş emri kartı görünümü |
| `IsEmriEkleForm.jsx` | Yeni iş emri formu |
| `IsEmriDuzenleForm.jsx` | İş emri düzenleme formu |
| `IsEmriKanbanBoard.jsx` | Kanban görünümü |
| `IsEmriOzetFormu.jsx` | Özet formu |
| `MobileIsEmriKartiYeni.jsx` | Mobil iş emri kartı |

---

## Socket.IO Olayları

| Olay | Açıklama |
|------|----------|
| `isEmri:created` | Yeni iş emri oluşturuldu |
| `isEmri:updated` | İş emri güncellendi |
| `isEmri:statusChanged` | İş emri durumu değişti |
| `isEmri:deleted` | İş emri silindi |

---

## İlişkili Modüller

- **Tezgahlar** - Her iş emri bir tezgaha atanır
- **Parçalar** - Her iş emri bir parçaya bağlıdır
- **Üretim Planı** - İş emirleri üretim planından oluşturulabilir
- **BOM** - Malzeme listesi bağlantısı
- **Stok Kartları** - Hammadde tüketimi takibi

---

## Kullanım Senaryoları

### Senaryo 1: Yeni İş Emri Oluşturma
1. Kullanıcı "Yeni İş Emri" butonuna tıklar
2. Parça seçimi yapılır
3. Adet ve öncelik belirlenir
4. Tezgah ataması yapılır
5. Tarih seçimi yapılır
6. Kaydet butonuna tıklanır

### Senaryo 2: İş Emri Başlatma
1. Bekleyen iş emri seçilir
2. "Başlat" butonuna tıklanır
3. Durum "Üretimde" olarak güncellenir
4. Socket.IO ile real-time bildirim gönderilir

### Senaryo 3: İş Emri Tamamlama
1. Üretimdeki iş emri seçilir
2. "Tamamla" butonuna tıklanır
3. Tamamlanan adet girilir
4. Durum "Tamamlandı" olarak güncellenir
5. Stok kartları otomatik güncellenir

---

## Validasyon Kuralları

- `is_emri_no` benzersiz olmalı
- `parca_kodu` geçerli bir parçaya referans olmalı
- `tezgah_id` geçerli bir tezgaha referans olmalı
- `adet` pozitif integer olmalı
- `baslama_tarihi` >= bugün veya geçmiş
- `bitis_tarihi` > `baslama_tarihi`

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| IE001 | İş emri bulunamadı | Geçersiz ID |
| IE002 | Geçersiz durum geçişi | Durum değişimi kurallara uymuyor |
| IE003 | Tezgah dolu | Seçilen tezgah müsait değil |
| IE004 | Stok yetersiz | Üretim için yeterli hammadde yok |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-01 | İlk versiyon |
| 1.1 | 2024-06 | Mobil destek eklendi |
| 1.2 | 2024-09 | Kanban görünümü eklendi |
| 1.3 | 2024-12 | Real-time güncellemeler eklendi |