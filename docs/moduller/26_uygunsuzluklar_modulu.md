# 26. UYGUNSUZLUKLAR (Non-conformities) Modülü

## Genel Bakış

Uygunsuzluklar modülü, üretim sürecinde tespit edilen kalite sorunlarının kaydedilmesi, çözüm adımlarının yönetilmesi ve raporlanmasını sağlar.

**Route Dosyası:** `backend/src/routes/uygunsuzluklarRoutes.js`
**Controller Dosyası:** `backend/src/controllers/uygunsuzluklarController.js`

---

## Modül Amacı

- Uygunsuzluk kaydı
- Kök neden analizi
- Çözüm adımları yönetimi
- Düzeltici faaliyetler
- Onay süreci

---

## Veritabanı Tablosu

**Uygunsuzluklar:** `uygunsuzluklar`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| rapor_no | STRING | Rapor numarası |
| tur | STRING | urun, proses, sistem |
| oncelik | STRING | dusuk, normal, yuksek, kritik |
| tezgah_id | INTEGER | Tezgah ID (nullable) |
| is_emri_id | INTEGER | İş emri ID (nullable) |
| baslik | STRING | Başlık |
| aciklama | TEXT | Detaylı açıklama |
| durum | STRING | yeni, inceleniyor, cozumuyor, kapali |
| atanan_kisi | STRING | Atanan kişi |
| bildirilme_tarihi | DATETIME | Bildirilme tarihi |
| hedef_tarih | DATE | Hedef çözüm tarihi |
| kapanma_tarihi | DATE | Kapanma tarihi |
| maliyet | DECIMAL | Maliyet |
| created_at | DATETIME | Oluşturulma tarihi |

**Çözüm Adımları:** `uygunsuzluk_cozum_adimlari`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| uygunsuzluk_id | INTEGER | Uygunsuzluk ID |
| adim_adi | STRING | Adım adı |
| sorumlu | STRING | Sorumlu kişi |
| hedef_tarih | DATE | Hedef tarih |
| tamamlandi | BOOLEAN | Tamamlandı mı |
| tamamlanma_tarihi | DATETIME | Tamamlanma tarihi |

**Tedbirler:** `uygunsuzluk_tedbirleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| uygunsuzluk_id | INTEGER | Uygunsuzluk ID |
| tedbir_adi | STRING | Tedbir adı |
| sorumlu | STRING | Sorumlu |
| durum | STRING | bekliyor, uygulandi, iptal |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm uygunsuzlukları listele |
| `GET /:id` | Uygunsuzluk detayı |
| `GET /istatistik/ozet` | İstatistik özeti |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni uygunsuzluk oluştur |
| `POST /:id/atama` | Atama yap |
| `POST /:id/cozum-adim` | Çözüm adımı ekle |
| `POST /:id/tedbir` | Tedbir ekle |
| `POST /:id/onay` | Onay ver |
| `POST /:id/kapat` | Kapat |
| `POST /:id/not` | Not ekle |
| `POST /:id/dosya` | Dosya ekle |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Güncelle |
| `PUT /:id/durum` | Durum güncelle |
| `PUT /:id/cozum-adim/:adimIndex/tamamla` | Adımı tamamla |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Sil |
| `DELETE /:id/dosya/:dosyaId` | Dosya sil |

---

## Uygunsuzluk Türleri

| Tür | Açıklama |
|-----|----------|
| urun | Ürün kalite sorunu |
| proses | Proses uygunsuzluğu |
| sistem | Sistem kaynaklı sorun |

---

## Durum Akışı

```
yeni → inceleniyor → cozumuyor → kapali
              ↓           ↓
            iptal       iptal
```

---

## Öncelik Seviyeleri

| Seviye | Açıklama | Renk |
|--------|----------|------|
| dusuk | Önemsiz | Yeşil |
| normal | Standart | Sarı |
| yuksek | Kritik öncelik | Turuncu |
| kritik | Acil müdahale | Kırmızı |

---

## Temel Fonksiyonlar

### 1. uygunsuzlukOlustur(data)
Yeni uygunsuzluk kaydı oluşturur.

### 2. cozumAdimiEkle(uygunsuzlukId, adimData)
Çözüm adımı ekler.

### 3. adimTamamla(uygunsuzlukId, adimIndex)
Adımı tamamlanmış işaretler.

### 4. kapat(uygunsuzlukId)
Uygunsuzluğu kapatır ve istatistikleri kaydeder.

---

## İstatistikler

| Metrik | Açıklama |
|--------|----------|
| Toplam Uygunsuzluk | Dönemdeki toplam |
| Ortalama Çözüm Süresi | Gün cinsinden |
| Tekrar Eden | Aynı parça/tezgah |
| Maliyet | Toplam maliyet |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-03 | İlk versiyon |
| 1.1 | 2024-07 | Çözüm adımları eklendi |
| 1.2 | 2024-10 | İstatistikler geliştirildi |
| 1.3 | 2024-12 | PDCA entegrasyonu |