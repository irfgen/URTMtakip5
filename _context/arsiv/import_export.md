# Import - Export Modülü Tasarım Dokümanı

## 1) Özet
Import - Export modülü; dosya tabanlı CAD verilerinin sisteme alınması (import) ve sistemden dışa aktarılması (export) işlevlerini tek bir çatı altında toplar. İlk fazda "SolidWorks" alt modülü ile klasörlerden `.sldprt`/`.sldpart` ve `.sldasm` dosyalarının indekslenmesi, görsellerinin üretilmesi ve veritabanına parça kaydı süreçleri hayata geçirilir. İlerleyen fazlarda toplu export, raporlama ve ileri otomasyonlar eklenecektir.

## 2) Özellikler ve İşlevler (Özet Liste)
- **Klasör seçimi ve indeksleme**: Kullanıcı seçili klasör ve alt klasörlerdeki `.sldprt`/`.sldpart` ve `.sldasm` dosyalarını tarar, tam dosya yolları geçici indeks tablosunda saklanır.
- **Veritabanı varlık kontrolü**: Her indeks kaydı için sistemde mevcut parça olup olmadığı kontrol edilir ve UI'da durum gösterilir.
- **Tekil import akışı**: Veritabanında olmayan bir parça için SolidWorks ile aç-zoom-fit-görüntü al akışı çalıştırılır, `dosya_ismi.png` geçici olarak kaydedilir, ardından "yeni parça ekle" ile kayıt tamamlanır.
- **Otomatik import**: Eksik tüm parçalar sıra ile otomatik işlenir; ilerleme, durdurma ve yeniden başlatma desteklenir.
- **Export (ileri faz)**: Seçili parçaları Excel/CSV ve/veya arşiv (ZIP) formatında dışa aktarma.
- **Konfigürasyon**: Dosya uzantıları, eşzamanlı iş sayısı, zaman aşımları, screenshot klasörü, SolidWorks yol/versiyon ayarları.
- **Loglama ve denetim izi**: Başarılı/başarısız import girişimleri ve istisnalar ayrıntılı loglanır.
- **Yetki**: İndeksleme ve import işlemleri belirli rollerle sınırlandırılır (örn. `cad_importer`).

---

## 3) SolidWorks Alt Modülü

### 3.1) Kapsam ve Kurallar
- Desteklenen uzantılar: `.sldprt` (parça), `.sldpart` (eşanlamlı olarak desteklenecek), `.sldasm` (montaj).
- Dosya yolu benzersiz anahtar kabul edilir. Karşılaştırma Windows üzerinde büyük/küçük harf duyarsız yapılmalıdır.
- "Parça kodu" = dosya adı (uzantısız). "Parça adı" = tam dosya yolu. "Parça fotoğrafı" = üretilen `dosya_ismi.png`.
- Parça veritabanında varsa import atlanır; UI'da mevcut olarak işaretlenir.

### 3.2) Veritabanı Taslağı
- **Tablo: `import_index`**
  - `id` (pk)
  - `full_path` (unique)
  - `file_name`
  - `extension`
  - `status` (enum: pending, exists, ready_to_import, importing, imported, failed)
  - `hash` (opsiyonel; hızlı değişiklik tespiti için)
  - `created_at`, `updated_at`
- **Tablo: `parca`** (mevcut yapıya uyumlu olacak şekilde)
  - `id` (pk)
  - `parca_kodu` (unique) → dosya adı
  - `parca_adi` → tam dosya yolu
  - `dosya_yolu` → tam dosya yolu
  - `gorsel_yolu` → üretilen png yolu
  - `kaynak` (örn. 'solidworks_import')
  - `created_at`, `updated_at`, `is_active`
- **Tablo: `import_job`** (otomatik import çalışmaları)
  - `id` (pk)
  - `started_at`, `finished_at`
  - `total`, `success_count`, `fail_count`
  - `state` (running, completed, canceled)

### 3.3) Ekranlar
- **Klasör Seçim Ekranı**
  - Klasör seçici, dosya uzantı filtre bilgisi, başlat/durdur.
- **İndeksleme Ekranı**
  - Liste sütunları: Durum, Dosya Adı, Tam Yol, Uzantı, Veritabanı Durumu (Var/Yok), İşlem ("Parçayı İmport Et" butonu)
  - Toplu işlemler: "Tüm Eksikleri Otomatik İmport Et", İlerleme çubuğu, Durdur/Devam Et.
  - Filtreler: Yalnızca eksikler, yalnızca hatalılar, yalnızca montajlar.

### 3.4) SolidWorks Entegrasyonu (Teknik Taslak)
- Çalışma biçimi: Windows üzerinde SolidWorks COM otomasyonu veya add-in.
- Öneri: .NET (C#) ile COM interop; `SldWorks` objesi üzerinden model açma ve görünüm işlemleri.
- Temel adımlar:
  1) SolidWorks örneği edin (mevcut çalışıyorsa bağlan, yoksa başlat)
  2) Model aç (`IModelDoc2`)
  3) Zoom to fit ve arayüz gizleme (tam ekran benzeri görünüm)
  4) Görsel üret: pratikte `IModelDocExtension.SaveAs` ile PNG; alternatif olarak ekran görüntüsü API'leri
  5) Model kapat (isteğe bağlı), kaynakları serbest bırak
- Timeout, yeniden deneme ve sıraya alma uygulanmalı. Aynı anda fazla model açılmamalı (örn. eşzamanlı iş sayısı = 1-2).

### 3.5) İş Akışları
- **Tekil İmport**
  - Kullanıcı listeden bir eksik parçayı seçer → "Parçayı İmport Et"
  - Sistem veritabanı yokluğunu tekrar doğrular → SolidWorks ile aç → zoom-fit → PNG üret → geçici klasöre `dosya_ismi.png` kaydet → "yeni parça ekle" akışı → UI liste güncellenir, durum `imported` olur
- **Otomatik İmport (Sıralı)**
  - "Tüm Eksikleri Otomatik İmport Et" → iş kaydı oluştur → indeks tablosundan `status in (pending, ready_to_import)` ve "veritabanında yok" olanlar sırayla işlenir → ilerleme UI'da görünür → durdurulursa `state=canceled` işareti ile güvenli duruş

### 3.6) Hata Yönetimi ve Geri Dönüş
- SolidWorks açılamazsa veya model açılamazsa kayıt `failed` olur; hata mesajı/log saklanır; tekrar deneme imkanı verilir.
- PNG üretilemezse işlem iptal edilir; kısmi dosyalar temizlenir.
- Dosya taşınmış/silinmişse indeks kaydı `broken` benzeri alt durumla işaretlenebilir (opsiyonel).

### 3.7) Performans ve Dayanıklılık
- Büyük klasörlerde akışkan UI için indeksleme asenkron yapılmalı; sayfalandırma ve sanal liste kullanılmalı.
- Dosya sistemi taraması için iptal edilebilir token ve hız sınırı.
- Dosya boyutu ve montaj derinliği için üst sınır ve konfigüre edilebilir zaman aşımı.

### 3.8) Konfigürasyon
- `import.allowedExtensions = .sldprt,.sldpart,.sldasm`
- `import.screenshotDir = <uygulama_dosyaları>/solidworks_screenshots`
- `import.concurrentModels = 1`
- `solidworks.version/preferredPath = ...`
- `import.retryPolicy = 2 deneme, artan bekleme`

### 3.9) Güvenlik, Yetki, Loglama
- Yalnızca yetkili roller indeksleme ve import başlatabilir.
- Her import denemesi `import_job` ve uygulama loglarında izlenir.
- Kaydedilen görseller yalnızca yetkili kullanıcılarla paylaşılır.

### 3.10) Test ve Kabul Kriterleri (Örnek)
- [ ] `.sldprt` ve `.sldasm` dosyaları doğru indeksleniyor
- [ ] Veritabanında olan parça için "İmport Et" butonu gösterilmiyor
- [ ] Tekil import akışı PNG üretip parçayı kaydediyor
- [ ] Otomatik import tüm eksikleri sırayla kaydediyor, durdur/yeniden başlat çalışıyor
- [ ] Hatalar UI'da görünür ve loglanıyor

---

## 4) Geliştirme Yol Haritası (Checklist)

V11.3.71
- [ ] Mevcut "yeni parça ekle" özelliğinin alan haritası ve entegrasyon noktaları çıkarılsın
- [ ] SolidWorks sürümü ve lisans koşulları doğrulansın, COM interop erişimi test edilsin
- [ ] Depolama alanları (geçici görseller, kalıcı görseller) belirlenip yetkileri ayarlansın

### Faz 1 — Altyapı ve DB
- [ ] `import_index` ve `import_job` tabloları oluşturulsun (migration)
- [ ] Veritabanında parça varlık kontrolü için repository/metot eklensin
- [ ] Konfigürasyon anahtarları eklensin (appsettings.yaml/json vb.)

### Faz 2 — İndeksleme ve UI
- [ ] Klasör seçici UI geliştirilsin
- [ ] Dosya sistemi tarayıcı servis (alt klasörlerle) yazılsın
- [ ] İndeks sonuçları `import_index` tablosuna yazılsın (idempotent)
- [ ] İndeksleme ekranı listesi, filtreleri ve "parça var/yok" durum göstergesi tamamlansın

### Faz 3 — SolidWorks Entegrasyonu (Tekil İmport)
- [ ] SolidWorks başlat/bağlan servisleri (COM interop)
- [ ] Model aç, zoom fit, görünüm ayarları, ekran görüntüsü/PNG üretimi
- [ ] Geçici dosya adlandırma: `dosya_ismi.png` (çakışma önleme ve temizlik)
- [ ] "Yeni parça ekle" entegrasyonu → `parca_kodu`, `parca_adi`, `gorsel_yolu`, `dosya_yolu`
- [ ] Tekil akış UI butonu ve durum güncelleme

### Faz 4 — Otomatik İmport ve Kuyruk
- [ ] Otomatik iş planlayıcı/kuyruk mantığı (tek iş/ardışık)
- [ ] İlerleme, durdur/yeniden başlat, hata yeniden deneme politikası
- [ ] İş özetleri için `import_job` güncellemeleri

### Faz 5 — Stabilizasyon ve Gözden Geçirme
- [ ] Büyük klasörlerle yük testleri
- [ ] Hata yönetimi, log iyileştirmeleri, geri dönüş
- [ ] Yetkilendirme/rol denetimleri
- [ ] Kullanıcı kabul testleri ve eğitim notları

### Faz 6 — Export (İlk Sürüm)
- [ ] Seçili parçaları CSV/Excel’e aktarma
- [ ] Opsiyonel: Görsellerle birlikte ZIP paketleme

### Faz 7 — Dokümantasyon ve Operasyon
- [ ] Kullanım kılavuzu (ekran görüntüleriyle)
- [ ] Operasyon rehberi (bakım, log dosyaları, sorun giderme)

---

## 5) Teknik Notlar ve İpuçları
- `.sldpart` uzantısı bazı ortamlarda `.sldprt` ile eşdeğer kullanılır; her ikisi de desteklenir.
- Windows ortamında yol karşılaştırmaları büyük/küçük harf duyarsız yapılmalıdır.
- PNG üretiminde aynı ada sahip dosyalar çakışmayı önlemek için alt klasör hiyerarşisi yansıtılabilir veya benzersiz ID eklenebilir.
- SolidWorks işlemleri uzun sürebilir; kullanıcıya her adıma dair ilerleme göstergesi sağlanmalıdır.
- Montaj dosyaları (`.sldasm`) için görüntü alma adımı parça ile benzerdir; büyük montajlarda zaman aşımı sınırı düşürülmelidir.

---

## 6) Kabul Kapsamı (Minimum Viable)
- Klasör seçimi → indeksleme → listede durumlar
- Tek parça için butonla import ve başarıyla veritabanına yeni kayıt
- Otomatik import ile eksik tüm parçaların sıralı importu
- PNG görsellerin üretilmesi ve parça kaydına bağlanması
