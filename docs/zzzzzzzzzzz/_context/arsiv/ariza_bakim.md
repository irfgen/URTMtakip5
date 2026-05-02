# ARIZA VE BAKIM MODÜLÜ - Teknik Dokümantasyon

## Genel Bakış

Arıza ve Bakım modülü, üretim sahasındaki tezgahların operasyonel durumunu izlemek, arıza ve planlı bakım kayıtlarını yönetmek için tasarlanmış kritik bir sistemdir. Bu modül, bir tezgahın ne zaman, neden ve ne kadar süreyle hizmet dışı kaldığını takip ederek üretim sürekliliğini sağlamayı ve makine verimliliğini (OEE) artırmayı hedefler. Modül, Tezgahlar modülü ile entegre çalışarak, bir arıza/bakım kaydı açıldığında ilgili tezgahın durumunu otomatik olarak günceller.

## Mimari Yapı

### Backend Bileşenleri

#### Ana Model: `ArizaBakim.js` (82 satır)

- **Tablo Adı**: `ariza_bakim`
- **Temel Alanlar**:
  - `id` (INTEGER, Primary Key): Kaydın benzersiz kimliği.
  - `tezgah_id` (INTEGER, Foreign Key): Kaydın ilişkili olduğu tezgah.
  - `kayit_tipi` (ENUM: 'ariza', 'bakim'): Kaydın türünü belirtir.
  - `baslangic_tarihi` (DATE): Arıza veya bakımın başladığı zaman.
  - `bitis_tarihi` (DATE, Nullable): Sorunun çözüldüğü veya bakımın bittiği zaman.
  - `durum` (ENUM: 'devam_ediyor', 'tamamlandi'): Kaydın güncel durumu.
  - `aciklama` (TEXT): Arıza veya bakımın nedenini açıklayan metin.
  - `yapilan_islemler` (TEXT): Sorunu çözmek için yapılan müdahaleler.
  - `maliyet` (DECIMAL): Yapılan işlemlerin maliyeti (parça, servis vb.).
  - `sorumlu` (STRING): İşlemi gerçekleştiren personel veya firma.
- **İlişkiler**:
  - `Tezgah` modeline `belongsTo` ilişkisi ile bağlıdır. Her kayıt bir tezgaha aittir.
  - `Tezgah` modelinden bu modele doğru `hasMany` ilişkisi de tanımlanmıştır, bu sayede bir tezgahın tüm arıza-bakım geçmişine kolayca erişilebilir.

#### Ana Controller: `arizaBakimController.js` (245 satır)

- **Sorumluluk**: Arıza ve bakım kayıtları ile ilgili tüm API isteklerini ve iş mantığını yönetir.
- **Temel CRUD Operasyonları**:
  - `getAllArizaBakim`: Tüm kayıtları listeler. Kayıt tipi, tezgah, durum ve tarih aralığı gibi çeşitli filtrelere göre sorgulama yapabilir.
  - `getArizaBakimById`: ID ile tek bir kaydın detayını getirir.
  - `createArizaBakim`: Yeni bir arıza veya bakım kaydı oluşturur. Bu işlem sırasında, ilgili `tezgah_id`'ye sahip tezgahın `calisma_durumu`'nu `'arizada'` veya `'bakimda'` olarak otomatik günceller.
  - `updateArizaBakim`: Mevcut bir kaydı günceller. Özellikle bir kayıt `'tamamlandi'` durumuna getirildiğinde, ilgili tezgahın durumunu tekrar `'bosta'` (eğer bekleyen iş emri yoksa) veya `'calisiyor'` (iş emri varsa) olarak günceller.
  - `deleteArizaBakim`: Bir kaydı siler.
- **İstatistik Endpoint'i (`getArizaBakimIstatistikleri`)**:
  - Belirtilen tarih aralığına göre tezgah bazlı ve aylık bazda arıza/bakım sayılarını gruplayarak raporlama için özet veri sunar. Bu, hangi tezgahın daha sık arızalandığını veya aylık bakım trendlerini analiz etmek için kullanılır.
- **Aktif Kayıtlar (`getTezgahActiveArizaBakim`)**:
  - Belirli bir tezgah için halen 'devam_ediyor' durumundaki kayıtları getirir. Tezgah kartlarında aktif arıza/bakım durumunu göstermek için kullanılır.

#### Route Yapısı: `arizaBakimRoutes.js` (26 satır)

- `/api/ariza-bakim` ana yolu altında tüm controller fonksiyonlarını RESTful prensiplerine uygun olarak sunar.
- Standart CRUD endpoint'lerine ek olarak, `/istatistikler` ve `/tezgah/:tezgah_id/aktif` gibi özel amaçlı endpoint'ler içerir.

### Frontend Mimarisi

#### Redux Slice: `arizaBakimSlice.js` (197 satır)

- **Sorumluluk**: Arıza/Bakım modülü ile ilgili tüm global state'i (kayıt listesi, seçili kayıt, istatistikler, yüklenme durumları vb.) yönetir.
- **Ana Thunks**:
  - `fetchArizaBakimKayitlari`: Tüm kayıtları filtrelerle birlikte getirir.
  - `fetchArizaBakimById`: Tek bir kaydın detayını getirir.
  - `createArizaBakim`, `updateArizaBakim`, `deleteArizaBakim`: Backend'deki CRUD operasyonlarını tetikler ve state'i günceller.
  - `fetchArizaBakimIstatistikleri`: İstatistik verilerini çeker.
- **State Yapısı**:
  - `kayitlar`: Tüm arıza/bakım kayıtlarının listesi.
  - `currentKayit`: Detayı görüntülenen veya düzenlenen aktif kayıt.
  - `istatistikler`: Raporlama için kullanılan özet veriler.
  - `loading`, `detailLoading`, `statisticsLoading`: Farklı API istekleri için yüklenme durumlarını ayrı ayrı yöneterek kullanıcı arayüzünde daha hassas geri bildirim sağlar.
  - `error`, `success`: Operasyonların sonuçlarını kullanıcıya bildirmek için kullanılır.

#### Liste Görünümü: `ArizaBakimListesi.jsx` (704 satır)

- **Sorumluluk**: Modülün ana arayüzüdür. Tüm arıza ve bakım kayıtlarını listeler, filtrelenmesini sağlar ve yeni kayıt ekleme, düzenleme, silme gibi işlemleri başlatır.
- **Temel Özellikler**:
  - **Kapsamlı Filtreleme**: Tezgah, kayıt tipi, durum ve tarih aralığına göre filtreleme yapabilen bir arayüz sunar.
  - **Dinamik Tablo**: Kayıtları `Material-UI Table` içinde gösterir. Kayıt tipi ('Arıza'/'Bakım') ve durumu ('Devam Ediyor'/'Tamamlandı') için renkli `Chip` bileşenleri kullanarak okunabilirliği artırır.
  - **Kayıt Sonlandırma**: "Devam ediyor" durumundaki bir kayıt için, kullanıcıların doğrudan liste üzerinden bir "Sonlandır" diyalog penceresi açmasına olanak tanır. Bu diyalogda "Yapılan İşlemler", "Sonuç" ve "Maliyet" gibi bilgiler girilerek kayıt tamamlanır. Bu işlem arka planda `tezgahAPI.endArizaBakim` servisini çağırır.
  - **Excel'e Aktarma**: Görüntülenen listeyi `.xlsx` formatında dışa aktarma işlevselliği sunar.
  - **Navigasyon**: `Breadcrumbs` (sayfa yolu) ve bir tezgah sayfasından gelindiğinde başlıkta o tezgahın adını gösterme gibi kullanıcı deneyimini iyileştiren özellikler içerir.

## Entegrasyon ve Akış

1.  **Arıza/Bakım Başlatma**:
    - Kullanıcı, `TezgahKarti` bileşenindeki menüden "Arıza Bildir" veya "Planlı Bakım Başlat" seçeneklerinden birini seçer.
    - Bu işlem, kullanıcıyı `ArizaBakimEkle` sayfasına, ilgili `tezgah_id` ve `kayit_tipi` bilgileriyle yönlendirir.
    - Kullanıcı açıklamayı girip kaydı oluşturduğunda `createArizaBakim` tetiklenir.
    - Backend, yeni bir `ariza_bakim` kaydı oluşturur ve ilgili `Tezgah`'ın `calisma_durumu`'nu `'arizada'` veya `'bakimda'` olarak günceller.
    - Bu durum değişikliği, `Dashboard` ve `Tezgahlar` sayfasındaki `TezgahKarti`'nın rengini ve durumunu anında değiştirir.
2.  **Arıza/Bakım Sonlandırma**:
    - Operatör veya bakım sorumlusu, `ArizaBakimListesi`'nden ilgili kaydı bulur ve "Sonlandır" butonuna tıklar.
    - Açılan diyalog penceresine yapılan işlemleri, sonucu ve maliyeti girer.
    - `updateArizaBakim` (veya `tezgahAPI.endArizaBakim`) tetiklenir.
    - Backend, `ariza_bakim` kaydının `durum`'unu `'tamamlandi'`, `bitis_tarihi`'ni de o anki zaman olarak günceller.
    - Simultaneously, it updates the `Tezgah`'s `calisma_durumu` back to `'bosta'` or `'calisiyor'`, making the machine available for new jobs.

## Sonuç

Arıza ve Bakım Modülü, üretim katındaki fiziksel varlıkların (tezgahların) operasyonel yönetimini dijital ortama taşıyan, iyi yapılandırılmış ve sistemin geri kalanıyla sıkı bir şekilde entegre çalışan bir sistemdir. Tezgah durumlarını otomatik olarak güncelleyerek anlık ve doğru veri sağlar, bu da plansız duruşların azaltılmasına ve üretim verimliliğinin artırılmasına doğrudan katkıda bulunur.