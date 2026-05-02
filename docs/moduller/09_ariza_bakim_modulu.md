# 9. ARIZA-BAKIM (Maintenance & Breakdown) Modülü

## Genel Bakış

Arıza-Bakım modülü, üretim ekipmanlarının arıza kayıtları, bakım planlaması ve downtime analizini yönetir.

**Route Dosyası:** `backend/src/routes/arizaBakimRoutes.js`
**Controller Dosyası:** `backend/src/controllers/arizaBakimController.js`
**Frontend Sayfası:** `frontend/src/pages/ArizaBakim.jsx`

---

## Modül Amacı

- Arıza kayıtlarını tutma
- Bakım planlaması yapma
- Downtime (durma süresi) takibi
- Bakım maliyeti analizi
- Çözüm adımları yönetimi
- Ekipman güvenilirliği raporlama

---

## Veritabanı Tablosu

**Ana Tablo:** `ariza_bakim`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| tezgah_id | INTEGER | Tezgah ID |
| ariza_turu | STRING | arıza, bakim, periyodik |
| baslik | STRING | Arıza/bakım başlığı |
| aciklama | TEXT | Detaylı açıklama |
| durum | STRING | bildirildi, inceleniyor, cozuluyor, cozumlu, iptal |
| oncelik | STRING | dusuk, normal, yuksek, kritik |
| bildirilme_tarihi | DATETIME | Bildirilme zamanı |
| baslama_tarihi | DATETIME | Müdahale başlangıcı |
| bitis_tarihi | DATETIME | Çözüm bitiş zamanı |
| sure_dakika | INTEGER | Toplam süre (dakika) |
| maliyet | DECIMAL | Tahmini maliyet |
| cozum_aciklamasi | TEXT | Çözüm açıklaması |
| atanan_kisi | STRING | Atanan personel |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

**Çözüm Adımları Tablosu:** `ariza_bakim_adimlari`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| ariza_id | INTEGER | Arıza ID |
| adim_sira | INTEGER | Adım sırası |
| aciklama | STRING | Adım açıklaması |
| tamamlandi | BOOLEAN | Tamamlandı mı |
| tamamlanma_tarihi | DATETIME | Tamamlanma zamanı |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm arıza/bakımları listele |
| `GET /:id` | Arıza/bakım detayı |
| `GET /tezgah/:tezgah_id/aktif` | Tezgahın aktif arızası |
| `GET /istatistikler` | Genel istatistikler |
| `GET /by-tarih/:baslangic/:bitis` | Tarih aralığına göre |
| `GET /by-tezgah/:tezgahId` | Tezgaha göre rapor |
| `GET /by-durum/:durum` | Duruma göre listele |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni arıza/bakım oluştur |
| `POST /:id/cozum-adim` | Çözüm adımı ekle |
| `POST /:id/ariza-bakim-sonlandir` | Arıza/bakımı sonlandır |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Arıza/bakım güncelle |
| `PUT /:id/cozum-adim/:adimIndex/tamamla` | Adımı tamamla |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Arıza/bakım sil |

---

## Temel Fonksiyonlar

### 1. arizaBakimOlustur(data)
Yeni arıza/bakım kaydı oluşturur.
- Bildirilme tarihi otomatik
- Durum "bildirildi" olarak başlar

### 2. cozumAdimiEkle(arizaId, adimData)
Arızaya çözüm adımı ekler.
- Sıra numarası atar
- Çözüm sürecini loglar

### 3. cozumAdimiTamamla(arizaId, adimIndex)
Belirli bir adımı tamamlanmış olarak işaretler.
- Tamamlanma tarihi kaydeder

### 4. sonlandir(arizaId, cozumData)
Arızayı sonlandırır.
- Bitiş tarihini kaydeder
- Toplam süreyi hesaplar
- Çözüm açıklamasını kaydeder

### 5. istatistikGetir()
Genel istatistikleri döner.
- Toplam arıza sayısı
- Ortalama çözüm süresi
- Maliyet analizi

### 6. downtimeAnalizi(tezgahId, tarihAraligi)
Tezgah için downtime analizi yapar.

---

## Durum Akışı

```
bildirildi → inceleniyor → cozuluyor → cozumlu
                                    ↓
                                  iptal
```

| Durum | Açıklama |
|-------|----------|
| bildirildi | Yeni kayıt, henüz müdahale yok |
| inceleniyor | Arıza inceleniyor |
| cozuluyor | Çözüm aşamasında |
| cozumlu | Arıza çözüldü |
| iptal | İptal edildi |

---

## Arıza Türleri

| Tür | Açıklama |
|-----|----------|
| arıza | Beklenmedik arıza |
| bakim | Planlı bakım |
| periyodik | Periyodik bakım |
| kontrol | Kontrol amaçlı |

---

## Öncelik Seviyeleri

| Seviye | Açıklama | Renk |
|--------|----------|------|
| dusuk | Kritik değil, bekletilebilir | Yeşil |
| normal | Standart öncelik | Sarı |
| yuksek | Acil müdahale gerekli | Turuncu |
| kritik | Üretimi durduran | Kırmızı |

---

## İstatistikler

| Metrik | Açıklama |
|--------|----------|
| Toplam Arıza | Dönem içinde toplam arıza sayısı |
| Ortalama Çözüm Süresi | Dakika cinsinden ortalama |
| Toplam Downtime | Toplam durma süresi |
| Toplam Maliyet | Arıza/bakım toplam maliyeti |
| MTBF | Mean Time Between Failures |
| MTTR | Mean Time To Repair |

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `ArizaBakim.jsx` | Ana arıza-bakım sayfası |
| `ArizaListesi.jsx` | Arıza listesi |
| `ArizaForm.jsx` | Arıza ekleme formu |
| `ArizaDetay.jsx` | Arıza detay görünümü |
| `CozumAdimlari.jsx` | Çözüm adımları listesi |
| `ArizaIstatistikleri.jsx` | İstatistik paneli |
| `DowntimeGrafik.jsx` | Downtime grafiği |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `ariza:created` | Yeni arıza bildirildi |
| `ariza:updated` | Arıza güncellendi |
| `ariza:statusChanged` | Durum değişti |
| `ariza:cozumAdimiEklendi` | Çözüm adımı eklendi |
| `ariza:cozumlu` | Arıza çözüldü |

---

## İlişkili Modüller

- **Tezgahlar** - Arıza bağlı tezgah
- **Vardiya Yönetimi** - Vardiya bazlı kayıtlar
- **Raporlar** - Performans raporları
- **Personel** - Atanan personel

---

## Kullanım Senaryoları

### Senaryo 1: Arıza Bildirimi
1. Operatör arıza görür
2. "Yeni Arıza" formunu açar
3. Tezgah seçer
4. Arıza türü ve açıklamayı girer
5. Öncelik belirler
6. Kaydeder

### Senaryo 2: Çözüm Süreci
1. Teknisyen arızayı alır
2. "Inceleniyor" durumuna alır
3. Çözüm adımlarını ekler
4. Her adımı tamamlar
5. Çözüm açıklamasını yazar
6. "Çözüldü" olarak işaretler

### Senaryo 3: Periyodik Bakım
1. Sistem periyodik bakım tarihini hatırlatır
2. Bakım kaydı oluşturulur
3. Planlı bakım olarak işaretlenir
4. Gerçekleştirilir ve kayıt altına alınır

---

## Validasyon Kuralları

- `tezgah_id` geçerli tezgah olmalı
- `baslik` zorunlu, en fazla 200 karakter
- `oncelik` geçerli değer (dusuk/normal/yuksek/kritik)
- `baslama_tarihi` >= `bildirilme_tarihi`
- `bitis_tarihi` > `baslama_tarihi`

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| AB001 | Arıza/bakım bulunamadı | Geçersiz ID |
| AB002 | Geçersiz durum geçişi | Durum akışı hatası |
| AB003 | Adım bulunamadı | Geçersiz adım index |
| AB004 | Tezgah aktif arıza var | Aynı tezgahta açık arıza mevcut |

---

## Raporlar

### Arıza İstatistikleri Raporu
- Arıza türü dağılımı
- Ortalama çözüm süresi
- Maliyet analizi

### Tezgah Performans Raporu
- Downtime süreleri
- Arıza sıklığı
- MTBF/MTTR hesaplamaları

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-03 | İlk versiyon |
| 1.1 | 2024-06 | Çözüm adımları eklendi |
| 1.2 | 2024-09 | İstatistikler ve raporlar |
| 1.3 | 2024-12 | Periyodik bakım takibi |
| 1.4 | 2025-01 | MTBF/MTTR hesaplama |