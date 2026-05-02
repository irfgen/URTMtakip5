# 22. YEDEKLEME (Backup) Modülü

## Genel Bakış

Yedekleme modülü, veritabanı ve dosyaların yedeklenmesi, geri yüklenmesi ve yedek dosyalarının yönetimini sağlar.

**Route Dosyası:** `backend/src/routes/backupRoutes.js`
**Controller Dosyası:** `backend/src/controllers/backupController.js`

---

## Modül Amacı

- Otomatik yedekleme
- Manuel yedekleme
- Geri yükleme
- Yedek listeleme
- Yedek silme
- Disk alanı yönetimi

---

## Yedekleme Türleri

| Tür | Açıklama | Frekans |
|-----|----------|--------|
| Tam | Tüm veritabanı | Haftalık |
| Artımlı | Değişen veriler | Günlük |
| Dosya | Sadece dosyalar | Aylık |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /list` | Yedekleri listele |
| `GET /info/:fileName` | Yedek bilgisi |
| `GET /download/:fileName` | Yedek indir |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /create` | Yeni yedek oluştur |
| `POST /create/full` | Tam yedek oluştur |
| `POST /create/incremental` | Artımlı yedek oluştur |
| `POST /restore/:fileName` | Yedekten geri yükle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /delete/:fileName` | Yedek sil |
| `DELETE /delete-old` | Eski yedekleri sil |

---

## Yedek Dosya Yapısı

```
backups/
├── database_2025-01-15.sqlite
├── database_2025-01-14.sqlite
├── database_2025-01-13.sqlite
├── files_2025-01-15.tar.gz
└── full_2025-01-10.tar.gz
```

---

## Temel Fonksiyonlar

### 1. yedekOlustur(tur)
Yeni yedek oluşturur.
- Dosya adı: yedek_tarih_saat.format
- Sıkıştırma seçeneği
- Açıklama eklenebilir

### 2. geriYukle(dosyaAdi)
Yedekten geri yükler.
- Mevcut DB'yi yedekler (güvenlik)
- Yedeği mevcut DB'ye kopyalar

### 3. yedekleriListele()
Tüm yedekleri listeler.
- Tarih, boyut, tür bilgisi

### 4. eskiYedekleriSil(gunSayisi)
Belirli günden eski yedekleri siler.

---

## Geri Yükleme Süreci

1. Mevcut veritabanını yedekle
2. Hedef yedeği kontrol et
3. Bağlantıları kapat
4. Yedeği kopyala
5. Bağlantıları yeniden aç
6. Doğrulama yap

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `BackupYonetimi.jsx` | Yedekleme yönetim sayfası |
| `BackupListesi.jsx` | Yedek listesi |
| `BackupOlustur.jsx` | Yedek oluşturma formu |
| `GeriYuklemeDialog.jsx` | Geri yükleme onay dialog |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `backup:started` | Yedekleme başladı |
| `backup:progress` | Yedekleme ilerliyor |
| `backup:completed` | Yedekleme tamamlandı |
| `backup:failed` | Yedekleme başarısız |
| `restore:started` | Geri yükleme başladı |
| `restore:completed` | Geri yükleme tamamlandı |

---

## Yedekleme Zamanlaması

| Zaman | Görev |
|-------|-------|
| Her gece 02:00 | Artımlı yedek |
| Her pazar 03:00 | Tam yedek |
| Ayın 1'i 04:00 | Aylık arşiv |

---

## İlişkili Modüller

- **Veritabanı** - SQLite veritabanı
- **Dosya Yükleme** - Dosya yedekleme

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Otomatik zamanlama eklendi |
| 1.2 | 2024-10 | Sıkıştırma seçeneği eklendi |
| 1.3 | 2024-12 | Cloud backup desteği |