# Tezgahlar Modülü

## 1. Amaç ve Sorumluluklar

Tezgahlar modülü, üretim sahasındaki fiziksel iş istasyonlarının (tezgahlar, makineler) sistemdeki dijital ikizlerini yönetir. Bu modül, bir tezgahın temel tanımından anlık durumuna, üzerinde çalışan iş emirlerinden geçmiş performansına kadar tüm yaşam döngüsünü takip etmekten sorumludur.

Temel sorumlulukları şunlardır:

*   **Tezgah Tanımlama:** Sisteme yeni tezgahlar eklemek, mevcutları güncellemek ve kaldırmak. Her tezgahın benzersiz bir ID'si, tanımı ve tipi bulunur.
*   **Durum İzleme:** Bir tezgahın anlık durumunu (`musait`, `calisiyor`, `ariza`, `bakimda`) takip etmek.
*   **İş Emri Yönetimi:** Tezgahlara iş emirleri atamak, devam eden işleri izlemek, işlere ara vermek ve tamamlanan işleri kaydetmek.
*   **Görsel Konumlandırma:** Üretim sahası planı üzerinde tezgahların görsel olarak yerleşimini (X, Y koordinatları) yönetmek.
*   **Veri Kaydı:** Tezgah üzerinde yapılan her türlü işlemi (iş başlatma, durdurma, tamamlama, arıza giderme) `islem_kayitlari` tablosuna loglamak.

## 2. Veri Yapısı (Veritabanı Modeli)

Modülün ana veri modeli `Tezgah` tablosudur. Arama sonuçları ve `tezgahRoutes.js` dosyasına göre, bu modelin olası alanları şunlardır:

```json
{
  "tezgah_id": "INTEGER (Primary Key)",
  "tezgah_tanimi": "STRING",
  "tezgah_tipi": "STRING",
  "calisma_durumu": "STRING ('musait', 'calisiyor', 'ariza')",
  "pozisyon_x": "INTEGER",
  "pozisyon_y": "INTEGER",
  "is_emirleri": "JSON",
  "is_emirleri_gecmisi": "JSON"
}
```

`is_emirleri` alanı, o anda tezgahta aktif olan iş emirlerinin bir listesini JSON formatında tutar.

## 3. API Endpoint'leri

Modül, aşağıdaki RESTful API endpoint'leri aracılığıyla yönetilir (Kaynak: [`backend/src/routes/tezgahRoutes.js`](backend/src/routes/tezgahRoutes.js:1)):

*   `GET /api/tezgahlar`: Tüm tezgahları listeler.
*   `GET /api/tezgahlar/:id`: Belirtilen ID'ye sahip tek bir tezgahı ve üzerindeki aktif iş emirlerini detaylarıyla getirir.
*   `POST /api/tezgahlar`: Yeni bir tezgah oluşturur.
*   `PUT /api/tezgahlar/:id`: Mevcut bir tezgahın bilgilerini (tanım, tip vb.) günceller.
*   `DELETE /api/tezgahlar/:id`: Bir tezgahı sistemden siler. (Not: Üzerinde aktif iş emri varsa bu işlem engellenir).
*   `POST /api/tezgahlar/pozisyonlar`: Birden çok tezgahın görsel konumunu toplu olarak günceller.
*   `POST /api/tezgahlar/:id/is-emri-ata`: Bir iş emrini tezgaha atar.
*   `POST /api/tezgahlar/:id/is-emri-tamamla`: Tezgahtaki bir iş emrini tamamlanmış olarak işaretler.
*   `POST /api/tezgahlar/:id/is-ara-ver`: Tezgahtaki aktif işe ara verilmesini sağlar.
*   `POST /api/tezgahlar/:id/ariza-bakim-sonlandir`: Tezgahtaki bir arıza veya bakım durumunu sonlandırır.

## 4. Diğer Modüllerle İlişkileri

Tezgahlar modülü, sistemin merkezinde yer alır ve birçok modülle sıkı bir entegrasyon içindedir:

*   **İş Emirleri:** Tezgahların en temel amacı iş emirlerini işlemektir. İş emirleri tezgahlara atanır, işlenir ve tamamlanır.
*   **İşlem Kayıtları:** Tezgahta gerçekleşen her olay (başlatma, durdurma, tamamlama) bu modüle bir kayıt olarak gönderilir. Bu, performans takibi ve geçmişe dönük analizler için kritik bir veri kaynağıdır.
*   **Tamamlanan İşler:** Bir iş tezgahta bittiğinde, sonuçları (işlenen adet, notlar vb.) bu modüle kaydedilir.
*   **Arıza ve Bakım:** Bir tezgah arızalandığında veya bakıma alındığında, durumu bu modül tarafından yönetilir ve tezgahın `calisma_durumu` güncellenir.
*   **Raporlar:** Tezgahların çalışma süreleri, verimlilikleri, duruş nedenleri gibi veriler, Raporlar modülü için temel bir girdi oluşturur.

## 5. Frontend Arayüzü

Kullanıcılar, `/mobile/tezgahlar` ve muhtemelen ana web arayüzündeki benzer bir sayfa üzerinden tezgahlarla etkileşime girer. Bu arayüzler, yukarıda listelenen API'leri kullanarak tezgahları listelemeye, durumlarını görüntülemeye ve iş emirlerini yönetmeye olanak tanır.