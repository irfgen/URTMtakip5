# 30. TAMAMLANAN İŞLER (Completed Jobs) Modülü

## Genel Bakış

Tamamlanan İşler modülü, tamamlanan üretim işlerinin kayıtlarını ve geçmiş bilgilerini tutar.

**Route Dosyası:** `backend/src/routes/tamamlananIsRoutes.js`
**Controller Dosyası:** `backend/src/controllers/tamamlananIsController.js`

---

## Modül Amacı

- Tamamlanan iş kayıtları
- İş emri geçmişi
- Performans analizi
- Fire ve verimlilik

---

## Veritabanı Tablosu

**Tamamlanan İşler:** `tamamlanan_isler`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| is_emri_id | INTEGER | İş emri ID |
| parca_kodu | STRING | Parça kodu |
| tezgah_id | INTEGER | Tezgah ID |
| baslama_tarihi | DATETIME | Başlama zamanı |
| bitis_tarihi | DATETIME | Bitiş zamanı |
| sure_dakika | INTEGER | Süre (dakika) |
| uretilen_adet | INTEGER | Üretilen adet |
| tamamlanan_adet | INTEGER | Tamamlanan adet |
| fire_adet | INTEGER | Fire adet |
| fire_orani | DECIMAL | Fire oranı (%) |
| verimlilik | DECIMAL | Verimlilik (%) |
| operators | STRING | Operatör bilgisi |
| vardiya | STRING | Vardiya |
| notlar | TEXT | Notlar |
| created_at | DATETIME | Oluşturulma tarihi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tarih aralığına göre listele |
| `GET /is-emri/:isEmriId` | İş emrine göre |
| `GET /parca/:parcaKodu` | Parçaya göre |
| `GET /tezgah/:tezgahId` | Tezgaha göre |
| `GET /by-tarih/:tarih` | Belirli tarihte |
| `GET /istatistikler` | Genel istatistikler |

---

## Performans Metrikleri

| Metrik | Formül |
|--------|--------|
| Fire Oranı | (fire_adet / uretilen_adet) × 100 |
| Verimlilik | (tamamlanan_adet / hedef_adet) × 100 |
| İş Süresi | bitis - baslama |
| Birim Süre | sure_dakika / tamamlanan_adet |

---

## İlişkili Modüller

- **İş Emirleri** - İş emri bilgisi
- **Parçalar** - Parça bilgisi
- **Tezgahlar** - Tezgah bilgisi
- **Vardiya Yönetimi** - Vardiya bilgisi

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Fire oranı hesaplama eklendi |
| 1.2 | 2024-10 | İstatistikler geliştirildi |