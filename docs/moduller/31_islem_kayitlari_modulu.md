# 31. İŞLEM KAYITLARI (Process Logs) Modülü

## Genel Bakış

İşlem Kayıtları modülü, üretim sürecinde yapılan tüm işlemlerin log kayıtlarını tutar ve raporlamayı sağlar.

**Route Dosyası:** `backend/src/routes/islemKaydiRoutes.js`
**Controller Dosyası:** `backend/src/controllers/islemKaydiController.js`

---

## Modül Amacı

- İşlem geçmişi kaydetme
- Üretim takibi
- Operatör performansı
- Hata analizi

---

## Veritabanı Tablosu

**İşlem Kayıtları:** `islem_kayitlari`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| is_emri_id | INTEGER | İş emri ID |
| tezgah_id | INTEGER | Tezgah ID |
| islem_turu | STRING | baslat, durdur, tamamla, fire, müdahale |
| aciklama | TEXT | İşlem açıklaması |
| kullanici | STRING | Kullanıcı/operatör |
| tarih_saat | DATETIME | İşlem zamanı |
| ek_veri | JSON | Ek bilgiler |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /is-emri/:isEmriId` | İş emri kayıtları |
| `GET /tezgah/:tezgahId` | Tezgah kayıtları |
| `GET /:isEmriId/istatistikler` | İş emri istatistikleri |
| `GET /by-tarih/:baslangic/:bitis` | Tarih aralığı |

---

## İşlem Türleri

| Tür | Açıklama |
|-----|----------|
| baslat | İş emri başlatıldı |
| durdur | İş emri durduruldu |
| tamamla | İş emri tamamlandı |
| fire | Fire oluştu |
| müdahale | Müdahale yapıldı |
| kalibre | Kalibre edildi |
| bakim | Bakım yapıldı |

---

## Kullanım Alanları

1. **Denetim Trail** - Tüm işlemlerin geçmişi
2. **Performans Analizi** - Operatör verimliliği
3. **Hata Analizi** - Fire ve hata kaynakları
4. **Kapasite Planlama** - Gerçek süre hesaplamaları

---

## İlişkili Modüller

- **İş Emirleri** - İş emri bağlantısı
- **Tezgahlar** - Tezgah bağlantısı
- **Personel** - Kullanıcı bilgisi

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | JSON ek_veri desteği |
| 1.2 | 2024-10 | İstatistik API'leri eklendi |