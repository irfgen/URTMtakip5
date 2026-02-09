# SEVKİYAT MODÜLÜ - Teknik Dokümantasyon

## Genel Bakış

Sevkiyat modülü, şirkete giren (hammadde, fason ürünler) ve şirketten çıkan (nihai ürünler, müşteriye teslimatlar) tüm fiziksel malzeme hareketlerini kaydetmek, izlemek ve yönetmek için tasarlanmıştır. Modül, gelen ve giden sevkiyatları, sevkiyatın yapıldığı firmaları, lokasyonları, sevkiyat içeriğini (kalemler) ve ilgili görselleri (irsaliye, ürün fotoğrafları vb.) kapsayan bütünsel bir yapı sunar. Bu modül, SQLite veritabanı üzerinde çalışır ve RESTful API prensipleriyle yönetilir.

## Veritabanı Mimarisi (`sevkiyat-migration.js`, `sevkiyat-kalemleri-migration.js`)

Modülün temelini oluşturan beş ana SQLite tablosu bulunmaktadır:

1.  **`sevkiyat_firmalari`**:
    - Sevkiyat yapılan veya sevkiyat alınan tedarikçi/müşteri firmaların bilgilerini tutar.
    - `tip` alanı, firmanın 'ic' (iç, örn: farklı tesisler) mi yoksa 'dis' (dış, örn: müşteri/tedarikçi) mi olduğunu belirtir.

2.  **`sevkiyat_lokasyonlari`**:
    - Sevkiyatın yapıldığı veya geldiği depo, tesis gibi fiziksel konumları tanımlar.
    - Firmalar gibi 'ic' ve 'dis' olarak tiplendirilebilir.

3.  **`sevkiyatlar` (Ana Tablo)**:
    - Her bir sevkiyat işleminin ana kaydını tutar.
    - `sevkiyat_no` (UNIQUE): Sistem tarafından otomatik olarak oluşturulan benzersiz sevkiyat numarası (`SEV-YYYYMMDD-XXX` formatında).
    - `tip` (ENUM: 'gelen', 'giden'): Sevkiyatın yönünü belirtir.
    - `durum` (ENUM: 'beklemede', 'tamamlandi', 'iptal'): Sevkiyatın yaşam döngüsündeki durumunu belirtir.
    - `firma_id` ve `lokasyon_id`: İlgili firma ve lokasyon tablolarına `FOREIGN KEY` ile bağlıdır. `ON DELETE RESTRICT` kuralı, ilişkili sevkiyatı olan bir firma veya lokasyonun silinmesini engeller.

4.  **`sevkiyat_resimler`**:
    - Her sevkiyata ait görselleri (irsaliye, ürün fotoğrafları vb.) yönetir.
    - `sevkiyat_id` ile ana tabloya bağlıdır. `ON DELETE CASCADE` kuralı sayesinde, bir sevkiyat silindiğinde ona ait tüm resim kayıtları da otomatik olarak silinir.

5.  **`sevkiyat_kalemleri`**:
    - Bir sevkiyatın içeriğini detaylandırır.
    - `sevkiyat_id` ile ana tabloya bağlıdır.
    - `kalem_tipi` (ENUM: 'stok_karti', 'parca'): Sevkiyat kaleminin bir ham malzeme mi yoksa üretilmiş bir parça mı olduğunu belirtir.
    - `stok_karti_id` veya `parca_kodu`: Kalem tipine göre ilgili tabloya referans verir. Bu sayede, sevkiyat yapılırken stok takibi de yapılabilir.

## Backend Mimarisi ve API Rotaları

Backend, modüler bir `express.Router` yapısı kullanarak API'yi organize eder. Ana `/api/sevkiyat` rotası altında alt rotalar bulunur:

-   **`routes/sevkiyat.js`**:
    - `GET /`: Tüm sevkiyatları listeler. Kapsamlı filtreleme (tip, firma, lokasyon, durum, tarih aralığı) ve sayfalama yeteneklerine sahiptir.
    - `GET /:id`: Bir sevkiyatın tüm detaylarını (firma, lokasyon bilgileri, resimler ve kalemler) birleştirerek getirir.
    - `POST /`: Yeni bir sevkiyat kaydı oluşturur. Otomatik olarak benzersiz bir `sevkiyat_no` üretir.
    - `PUT /:id`: Bir sevkiyat kaydını günceller.
    - `DELETE /:id`: Bir sevkiyatı ve ilişkili tüm resim dosyalarını/kayıtlarını siler.

-   **`routes/sevkiyat-kalemleri.js`**:
    - `GET /:sevkiyat_id/kalemler`: Belirli bir sevkiyata ait tüm kalemleri, stok kartı veya parça detaylarıyla birleştirerek listeler.
    - `POST /:sevkiyat_id/kalemler`: Bir sevkiyata yeni bir kalem ekler.
    - `POST /`: Basit kalem ekleme endpoint'i (sevkiyat_id gövdede gönderilir).
    - `PUT /:sevkiyat_id/kalemler/:kalem_id`, `DELETE /:sevkiyat_id/kalemler/:kalem_id`: Kalemleri günceller ve siler.
    - `GET /stok-kartlari-arama`: Stok kartları için canlı arama endpoint'i (query parametresi ile).
    - `GET /parcalar-arama`: Parçalar için canlı arama endpoint'i (query parametresi ile).

-   **`routes/sevkiyat-resimler.js`**:
    - `GET /dosya/:filename`: Dosya adı ile doğrudan resim servisi (CORS başlıkları ile).
    - `GET /:sevkiyatId/resimler`: Sevkiyata ait resimleri listeler.
    - `POST /:sevkiyatId/resimler`: Çoklu resim yükleme (Multer ile, 5MB limit, 10 dosya).
    - `DELETE /:resimId`: Tek resim silme (hem dosya hem veritabanı kaydı).
    - `GET /:resimId/download`: Resim indirme.
    - `GET /:resimId/view`: Resim görüntüleme.

-   **`routes/sevkiyat-firmalar.js`**, **`routes/sevkiyat-lokasyonlar.js`**: Kendi modülleri için tam CRUD operasyonları ve özel işlevler (aktif/pasif durumu değiştirme, kullanım kontrolü) sunar.

-   **`routes/sevkiyat-raporlar.js`**:
    - `/ozet`: Dashboard için genel istatistikler (toplam, gelen/giden, bu ay vb.) sunar.
    - `/trend`: Zaman içindeki sevkiyat trendlerini analiz etmek için veri sağlar.
    - `/excel`: Mevcut filtrelerle eşleşen tüm sevkiyat verilerini bir `.xlsx` dosyası olarak dışa aktarır.

## Frontend Mimarisi

### Desktop Bileşenleri

-   **`components/SevkiyatListesi.jsx`**:
    - Modülün ana giriş noktasıdır. Tüm sevkiyatları, sayfalama ve filtreleme özellikleriyle birlikte bir `react-bootstrap` `Table` içinde listeler.
    - **Filtreleme Paneli**: Kullanıcıların sevkiyatları tip, firma, lokasyon, durum ve tarih aralığına göre filtrelemesine olanak tanır.
    - **Hızlı Eylem Butonları**: "Yeni Sevkiyat", "Firma Yönetimi", "Lokasyon Yönetimi" ve "Excel İndir" gibi sık kullanılan işlemlere hızlı erişim sağlar.
    - **Modal Yönetimi**: `SevkiyatForm`, `SevkiyatResimModal`, `FirmaYonetimModal`, `LokasyonYonetimModal` gibi tüm diyalog pencerelerinin açılıp kapanmasını yönetir.
    - **Resim Sayısı Göstergesi**: Her sevkiyat için resim sayısını gösteren buton ile kolay resim yönetimine erişim sağlar.

-   **`components/SevkiyatForm.jsx`**:
    - Yeni sevkiyat oluşturmak ve mevcut olanı düzenlemek için kullanılan merkezi formdur.
    - **Dinamik Kalem Yönetimi**: En dikkat çekici özelliklerinden biridir. Kullanıcı, sevkiyata ya bir "Stok Kartı" (hammadde) ya da bir "Parça" (üretilmiş ürün) eklemeyi seçebilir.
    - Seçime göre ilgili modal (`StokKartiSecimModal` veya `ParcaSecimFormu`) açılır.
    - Seçilen kalem ve adedi form içinde gösterilir.
    - Form gönderildiğinde, önce ana `sevkiyatlar` kaydı oluşturulur/güncellenir, ardından seçilen kalem bilgisi `sevkiyat_kalemleri` tablosuna ayrı bir API isteği ile kaydedilir.
    - **Hızlı Firma/Lokasyon Ekleme**: Form içinden doğrudan yeni firma ve lokasyon ekleme imkanı sunar.
    - **Resim Ekleme Akışı**: Yeni bir sevkiyat başarıyla kaydedildikten sonra, kullanıcıya aynı ekranda kalarak resim ekleme seçeneği sunulur (`SevkiyatResimModal` açılır). Bu, kullanıcı deneyimini akıcı hale getirir.

-   **`components/SevkiyatResimModal.jsx`**:
    - Bir sevkiyata ait resimleri listeler, yeni resimler yüklenmesine olanak tanır ve mevcut resimleri silme veya önizleme işlevleri sunar.
    - **Çoklu Dosya Yükleme**: Aynı anda birden fazla resim yükleme desteği (maksimum 10 dosya, 5MB limit).
    - **Dosya Validasyonu**: JPEG, PNG, WebP formatları desteklenir.
    - **CORS Desteği**: Resim dosyalarının doğru şekilde görüntülenmesi için gerekli başlıklar eklenir.

-   **`components/SevkiyatKalemleriModal.jsx`**:
    - Sevkiyat kalemlerini detaylı yönetim için kullanılır.
    - **Arama Fonksiyonu**: Stok kartları ve parçalar için canlı arama desteği.
    - **Kalem Türü Değiştirme**: Stok kartı ve parça arasında geçiş imkanı.
    - **Fiyat Yönetimi**: Birim fiyat ve toplam fiyat hesaplama.

-   **`components/FirmaYonetimModal.jsx` & `components/LokasyonYonetimModal.jsx`**:
    - Sevkiyat sürecinde kullanılan firma ve lokasyonların yönetimi.
    - **Aktif/Pasif Durumu**: Firmaları ve lokasyonları aktif/pasif yapma özelliği.
    - **Kullanım Kontrolü**: Sevkiyatlarda kullanılan firma/lokasyonların silinmesini engeller.

### Mobil Bileşenleri

-   **`components/mobile/SevkiyatFormMobile.jsx`**:
    - Mobil cihazlar için optimize edilmiş sevkiyat form bileşeni.
    - Touch-friendly arayüz ve daha büyük butonlar.
    - Mobil klavye optimizasyonları.

-   **`components/mobile/SevkiyatResimModalMobile.jsx`**:
    - Mobil cihazlarda resim yönetimi için optimize edilmiş modal.
    - Touch gestures desteği ve mobil fotoğraf çekme entegrasyonu.

-   **`components/mobile/FirmaEkleMobilModal.jsx` & `components/mobile/LokasyonEkleMobilModal.jsx`**:
    - Mobil ortamda hızlı firma ve lokasyon ekleme modalleri.
    - Minimal form tasarımı ve kolay erişim.

-   **`components/mobile/FirmaYonetimMobilModal.jsx` & `components/mobile/LokasyonYonetimMobilModal.jsx`**:
    - Mobil cihazlarda firma ve lokasyon yönetimi.
    - Swipe gestures ve touch-optimized listeleme.

## API Endpoint'leri Özeti

### Ana Sevkiyat API'leri (`/api/sevkiyat`)
- `GET /` - Sevkiyat listesi (filtreleme ve sayfalama ile)
- `GET /:id` - Tek sevkiyat detayı (resimler ve kalemler dahil)
- `POST /` - Yeni sevkiyat oluşturma
- `PUT /:id` - Sevkiyat güncelleme
- `DELETE /:id` - Sevkiyat silme (resim dosyaları da silinir)

### Kalemleri API'leri (`/api/sevkiyat-kalemleri`)
- `POST /` - Basit kalem ekleme
- `GET /:sevkiyat_id/kalemler` - Sevkiyat kalemlerini getir
- `POST /:sevkiyat_id/kalemler` - Sevkiyata yeni kalem ekle
- `PUT /:sevkiyat_id/kalemler/:kalem_id` - Kalem güncelle
- `DELETE /:sevkiyat_id/kalemler/:kalem_id` - Kalem sil
- `GET /stok-kartlari-arama` - Stok kartları arama
- `GET /parcalar-arama` - Parçalar arama

### Resim API'leri (`/api/sevkiyat/resimler`)
- `GET /dosya/:filename` - Dosya servisi
- `GET /:sevkiyatId/resimler` - Sevkiyat resimleri listesi
- `POST /:sevkiyatId/resimler` - Çoklu resim yükleme
- `DELETE /:resimId` - Resim silme
- `GET /:resimId/download` - Resim indirme
- `GET /:resimId/view` - Resim görüntüleme

### Firma/Lokasyon API'leri
- `/api/sevkiyat/firmalar` - Firma CRUD operasyonları
- `/api/sevkiyat/lokasyonlar` - Lokasyon CRUD operasyonları
- Her ikisi de aktif/pasif durumu değiştirme ve kullanım kontrolü içerir

### Raporlama API'leri (`/api/sevkiyat/raporlar`)
- `GET /ozet` - Dashboard özet istatistikleri
- `GET /trend` - Trend analizi (varsayılan 30 gün)
- `GET /firma-performans` - Firma bazlı performans raporu
- `GET /excel` - Excel export (filtreler uygulanabilir)

## Önemli Teknik Detaylar

### Veritabanı İndeksleri
- `idx_sevkiyatlar_tarih`, `idx_sevkiyatlar_tip`, `idx_sevkiyatlar_durum`
- `idx_sevkiyatlar_firma`, `idx_sevkiyatlar_lokasyon`
- `idx_sevkiyat_resimler_sevkiyat`, `idx_sevkiyat_kalemleri_sevkiyat`
- `idx_sevkiyat_kalemleri_stok_karti`, `idx_sevkiyat_kalemleri_parca`

### Dosya Yükleme Konfigürasyonu
- **Konum**: `backend/uploads/sevkiyat_resimleri/`
- **Dosya Formatı**: `sevk_YYYYMMDD_HHMMSS_timestamp.ext`
- **Boyut Limiti**: 5MB per dosya
- **Dosya Sayısı**: Maksimum 10 dosya per upload
- **Desteklenen Formatlar**: JPEG, JPG, PNG, WebP

### Mobil Responsive Design
- Otomatik cihaz algılaması ile mobil/desktop layout'u değiştirme
- Touch-optimized arayüz bileşenleri
- Mobil-specific form validasyonları
- Gesture desteği (swipe, tap, pinch-to-zoom)

## Güvenlik Özellikleri

- **Path Traversal Koruması**: Dosya adlarında `..`, `/`, `\` karakterleri kontrol edilir
- **CORS Başlıkları**: Resim dosyaları için uygun cross-origin başlıklar
- **Dosya Validasyonu**: Dosya türü ve boyut kontrolleri
- **Foreign Key Constraints**: `ON DELETE RESTRICT` ile veri bütünlüğü koruması
- **SQL Injection Koruması**: Parametrize sorgular kullanımı

## Sonuç

Sevkiyat Modülü, iyi yapılandırılmış bir veritabanı şeması ve modüler bir backend API'si üzerine inşa edilmiştir. Frontend, bu güçlü altyapıyı kullanarak kullanıcılara sevkiyatları, kalemleri, firmaları, lokasyonları ve resimleri hem desktop hem mobil ortamda tek bir merkezi arayüzden yönetme imkanı sunar. 

Özellikle resim yükleme ve kalem ekleme gibi süreçlerin akıcı bir kullanıcı deneyimi ile çözülmüş olması, modülün etkinliğini artırmaktadır. Canlı arama özellikleri, çoklu dosya yükleme desteği ve mobil-responsive tasarım, modülü modern bir web uygulaması standardına taşımaktadır.

Raporlama ve Excel'e aktarma gibi özellikler, modülü sadece bir kayıt sisteminden öte, kapsamlı bir iş analizi ve takip aracına dönüştürmektedir. Özellikle trend analizi ve firma performans raporları, yönetim kararları için değerli veriler sağlamaktadır.