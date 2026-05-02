## Toplu Sevkiyat Özelliği – Uçtan Uca Yapılacaklar (ToDo List)

Bu liste, “Toplu Sevkiyat Oluştur” akışını projeye eklemek için gerekli tüm adımları içerir. Referans: `_context/sevkiyat.md`.

### 1) Veritabanı Değişiklikleri (SQLite)
- [x] `sevkiyat_resimler` tablosuna opsiyonel `kalem_id` (FK `sevkiyat_kalemleri.id`) sütunu ekle (ÖNERİLEN)
  - [ ] Migration: `sevkiyat-resimler-migration.js` veya yeni bir migration dosyası (ör. `2025xxxxxx-add-kalem-id-to-sevkiyat-resimler.js`)
  - [ ] `kalem_id` için `FOREIGN KEY (kalem_id) REFERENCES sevkiyat_kalemleri(id) ON DELETE CASCADE`
  - [x] İndeks: `idx_sevkiyat_resimler_kalem`
  - [x] Geriye dönük uyumluluk: mevcut kayıtlar için `kalem_id = NULL` (sevkiyat geneli resimler)
- [ ] Alternatif (karar gerektirir): Yeni tablo `sevkiyat_kalem_resimleri (id, kalem_id, filename, ... )`
  - [ ] Seçilirse gerekli CRUD değişiklikleri ve dosya yolu aynı kalacak şekilde ekle
- [x] `sevkiyatlar.durum` ENUM’una `taslak` değeri ekle (toplama sürecinde güvenli saklama için)
  - [x] Migration: Tabloyu yeniden oluşturarak CHECK’e `taslak` eklendi (`backend/run-sevkiyat-toplu-migration.js`)
  - [ ] İlgili yerlerde varsayılan durumların etkisini kontrol et (listeleme, raporlar vb.)

#### 1.a) Yeni Toplu Sevkiyat Tabloları
- [ ] `toplu_sevkiyat` (ana tablo) oluştur
  - Alanlar: `id` (PK), `toplu_no` (UNIQUE), `nereden_lokasyon_id` (FK), `nereye_lokasyon_id` (FK), `tarih` (DATETIME), `durum` (ENUM 'taslak'|'beklemede'|'tamamlandi'|'iptal'), `aciklama` (TEXT), `olusturan_kullanici` (TEXT), `olusturma_tarihi`, `guncelleme_tarihi`
  - İndeksler: `idx_toplu_tarih`, `idx_toplu_durum`, `idx_toplu_nereden`, `idx_toplu_nereye`
- [ ] `toplu_sevkiyat_kalemleri` (detay) oluştur
  - Alanlar: `id` (PK), `toplu_id` (FK `toplu_sevkiyat.id` ON DELETE CASCADE), `kalem_tipi` ('stok_karti'|'parca'), `stok_karti_id` (FK), `parca_kodu` (FK), `adet`, `birim_fiyati`, `toplam_fiyat`, `aciklama`, `olusturma_tarihi`, `guncelleme_tarihi`
  - İndeksler: `idx_toplu_kalem_toplu`, `idx_toplu_kalem_tip`, `idx_toplu_kalem_stok`, `idx_toplu_kalem_parca`
- [ ] Resimler için seçenek:
  - [ ] `sevkiyat_resimler` tablosuna opsiyonel `toplu_kalem_id` sütunu ekle + indeks (yeniden kullanım)
  - [ ] Alternatif: `toplu_sevkiyat_resimler` yeni tablo (kalem bazlı)

### 2) Backend – Rotalar ve Mantık
- [ ] “Toplu Sevkiyat” giriş/akış rotaları
  - [x] `POST /api/sevkiyat/toplu` → taslak sevkiyat oluştur, `sevkiyat_id` döndür
    - Gövde: `tip` (gelen|giden), opsiyonel `firma_id`, `lokasyon_id` (yoksa daha sonra seçilecek)
    - Yanıt: `{ id, sevkiyat_no, durum: 'taslak', createdAt }`
  - [x] `PUT /api/sevkiyat/:id/durum` → `taslak` → `beklemede|tamamlandi` geçişi
    - Validasyon: zorunlu alanlar (ör. `lokasyon_id` ve yönüne göre `firma_id`) dolu mu?
- [ ] Kalem ekleme/düzenleme/silme (mevcut uçların kullanımı)
  - [ ] `POST /api/sevkiyat-kalemleri` (veya `POST /api/sevkiyat/:sevkiyatId/kalemler`) → tek kalem ekle
  - [ ] `PUT /api/sevkiyat/:sevkiyatId/kalemler/:kalemId` → kalem güncelle
  - [ ] `DELETE /api/sevkiyat/:sevkiyatId/kalemler/:kalemId` → kalem sil
  - [ ] Listeleme: `GET /api/sevkiyat-kalemleri/:sevkiyat_id/kalemler`
- [ ] Kalem bazlı resim yükleme
  - [ ] `POST /api/sevkiyat/:sevkiyatId/kalem/:kalemId/resimler` → çoklu upload (Multer, ≤10 dosya, ≤5MB, JPEG/PNG/WebP)
    - [x] `routes/sevkiyat-resimler.js` yapısını yeniden kullan; yükleme sonrası kayıt oluştururken `kalem_id` set et
    - [x] Güvenlik: `kalemId` gerçekten `sevkiyatId`’ye ait mi kontrol et; değilse 403
  - [x] Listeleme: `GET /api/sevkiyat/:sevkiyatId/kalem/:kalemId/resimler`
  - [x] Silme: `DELETE /api/sevkiyat/resimler/:resimId` (mevcut) → UI entegrasyonu
- [ ] Temsil görseli mantığı
  - [x] İlk yüklenen resim kalem için “temsil” sayılacak; `is_temsil` alanı eklendi ve API ile yönetiliyor
  - [x] `PUT /api/sevkiyat/:sevkiyatId/kalem/:kalemId/resimler/:resimId/temsil` → temsil atama
- [ ] Validasyonlar
  - [ ] `adet > 0`, `kalem_tipi` ve referans (`stok_karti_id` veya `parca_kodu`) zorunlu
  - [ ] Dosya tip/boyut, toplam dosya adedi (kalem başına ≤10) kontrolleri
- [ ] Hata/yanıt sözleşmeleri
  - [ ] Tutarlı JSON hata şeması (code, message, details)
  - [ ] Başarılı yanıtlar için minimal ve tutarlı payload (id, meta)

#### 2.a) Yeni Toplu Sevkiyat API'leri
- [x] `POST /api/toplu-sevkiyat` → taslak toplu sevkiyat oluştur (toplu_no üret, tarih otomatik)
- [x] `GET /api/toplu-sevkiyat/:id` → başlık + kalemler (ve temsil görseli)
- [x] `PUT /api/toplu-sevkiyat/:id` → başlık güncelle (nereden/nereye/tarih/durum/aciklama)
- [x] `PUT /api/toplu-sevkiyat/:id/durum` → durum geçişleri
- [ ] `DELETE /api/toplu-sevkiyat/:id`
- [x] `GET /api/toplu-sevkiyat/:toplu_id/kalemler` → kalem listesi
- [x] `POST /api/toplu-sevkiyat/:toplu_id/kalemler` → kalem ekle
- [x] `PUT /api/toplu-sevkiyat/:toplu_id/kalemler/:kalem_id` → kalem güncelle
- [x] `DELETE /api/toplu-sevkiyat/:toplu_id/kalemler/:kalem_id` → kalem sil (dosyaları da kaldır)
- [x] Resimler: `POST /api/sevkiyat/resimler/toplu/:topluId/kalem/:kalemId` (yükleme), `DELETE /api/sevkiyat/resimler/:resimId`, `PUT .../:resimId/temsil` (gerekirse benzer uç eklenir)

### 3) Backend – Yardımcılar ve İş Kuralları
- [ ] `sevkiyat_no` üretimi mevcut formatla tutarlı: `SEV-YYYYMMDD-XXX`
- [ ] Taslak sevkiyat silindiğinde (`DELETE`), bağlı kalemler ve resimler otomatik silinsin (FK CASCADE ile uyum kontrolü)
- [x] Kalem silindiğinde ona ait resimlerin de silinmesi (dosya ve DB) sağlansın
- [ ] Toplu işlem güvenilirliği için kritik yerlerde transaction kullanımı (kalem+resim toplu ekleme senaryoları)

### 4) Frontend – Yeni Bileşenler ve Entegrasyon
- [x] Giriş butonu: `SevkiyatListesi.jsx` içine “Toplu Sevkiyat Oluştur” butonu ekle
  - [x] Tıklanınca rota: `/sevkiyat/toplu-yeni/:sevkiyatId` (ayrı sayfa)
  - [x] `pages/TopluSevkiyatForm.jsx` (desktop)
  - [ ] Sol/üst panel: kalem listesi (satır başına: temsil görseli, ad/ kod, adet, eylemler: düzenle/sil)
  - [ ] Altında: “Yeni Sevkiyat Kalemi” birincil butonu
  - [ ] En altta: “Nereden” ve “Nereye” lokasyon seçimi (canlı arama/listeden seçim)
  - [ ] Genel “Kaydet” butonu: taslak oluşturma/ güncelleme ve finalize akışı
  - [x] `pages/TopluSevkiyatForm.jsx` içinde modal ile kalem oluşturma/düzenleme
  - [x] Kalem tipi seçimi: “Malzeme Stok Kartı” / “Parça” (canlı arama)
  - [x] Adet girişi (zorunlu)
  - [x] Resim ekleme: çoklu yükleme, önizleme grid, ilk görsel otomatik temsil
  - [x] Kaydet: kalem, adet ve resimler API’ye gönderilsin; modal kapanınca listeye satır düşsün
- [ ] Mobil varyantlar
  - [ ] `components/mobile/TopluSevkiyatFormMobile.jsx` (stepper/tek kolon)
  - [ ] `components/mobile/TopluSevkiyatKalemiModalMobile.jsx` (kamera kısayolu, büyük butonlar)
- [ ] Durum yönetimi
  - [ ] Taslak sevkiyat id’si oluşturulduktan sonra UI state’te tutulmalı
  - [ ] Kalem ekleme/silme düzenlemeleri optimistic; başarısızlıkta geri al
  - [ ] Yükleme kuyruğu ve ilerleme göstergeleri (kalem başına)
- [x] Rota kaydı ve navigasyon (React Router): `/sevkiyat/toplu-yeni/:sevkiyatId`
  - [ ] Toplu sevkiyat için yeni API'leri kullanacak şekilde `TopluSevkiyatForm.jsx` güncelle (header/kalem/resim uçları)
### 5) Yükleme (Upload) İş Akışı ve Performans
- [ ] İstemci tarafı görsel sıkıştırma (opsiyonel WebP) ve yeniden boyutlandırma (uzun kenar limiti)
- [ ] Paralel yerine kontrollü eşzamanlı yükleme (örn. 2-3 eşzamanlı), hata olanları işaretle ve yeniden dene
- [ ] Yükleme ilerleme çubukları; iptal (abort) desteği
- [ ] Sunucuda mevcut yol: `backend/uploads/sevkiyat_resimleri/`, adlandırma korunur: `sevk_YYYYMMDD_HHMMSS_timestamp.ext`

### 6) Validasyon, UX ve Erişilebilirlik
- [ ] Zorunlu alan uyarıları: kalem tipi, referans, adet, lokasyonlar
- [ ] Kısayollar: Enter ile kaydet, ESC ile modal kapat
- [ ] Erişilebilirlik: odak yönetimi, ARIA öznitelikleri, klavye navigasyonu
- [ ] Geri bildirim: toast/snackbar (başarı/başarısızlık), boş durum görünümleri

### 7) Güvenlik ve Yetkilendirme
- [ ] Path traversal, CORS, dosya tip/boyut kontrolleri (mevcut politika ile aynı)
- [ ] `kalem_id` sahiplik doğrulaması: kalem verilen `sevkiyat_id`’ye ait mi?
- [ ] Rate limiting (upload uçları için opsiyonel)

### 8) Testler
- [ ] Backend birim/entegrasyon testleri
  - [ ] Taslak oluşturma (`POST /api/sevkiyat/toplu`)
  - [ ] Kalem CRUD (`/api/sevkiyat-kalemleri`)
  - [ ] Kalem bazlı resim yükleme ve listeleme
  - [ ] `kalem_id`-`sevkiyat_id` sahiplik ve hata durumları (403/404)
  - [ ] `durum` geçişleri ve zorunluluk kontrolleri
- [ ] Frontend testleri
  - [ ] `TopluSevkiyatForm` render, kalem ekleme/silme, lokasyon seçimi
  - [ ] `TopluSevkiyatKalemiModal` validasyonlar, çoklu yükleme önizleme
  - [ ] E2E akış: “Toplu Sevkiyat Oluştur” → kalem ekle (resimlerle) → lokasyonları seç → Kaydet/Bitir

### 9) Dokümantasyon ve Örnekler
- [ ] `_context/sevkiyat.md` güncelle:
  - [ ] Yeni/ genişletilen API uçlarını ekle (`/api/sevkiyat/toplu`, kalem-resim uçları)
  - [ ] Veri modeli: `kalem_id` desteği veya yeni tablo kararı
  - [ ] Durum makinesi: `taslak` → `beklemede|tamamlandi`
- [ ] Kullanım rehberi: ekran görüntüleri/akış diyagramı (varsa)

### 10) Yayınlama (Deploy) Notları
- [ ] Migration’ları prod’a uygulama sırası ve geri dönüş planı
- [ ] Upload klasörü izinleri ve disk izleme
- [ ] Çevresel değişkenlerde değişiklik yoksa not düş

### 11) Geri Dönüş / Rollback Planı
- [ ] `kalem_id` sütunu eklendiyse kaldırma script’i (DİKKAT: veri kaybı)
- [ ] Yeni tablo seçildiyse tabloyu düşürme planı
- [ ] `durum: taslak` bağımlılıklarını kaldırma etki analizi

### 12) Kabul Kriterleri (Acceptance)
- [ ] “Toplu Sevkiyat Oluştur” butonu ile yeni ekran açılır
- [ ] Her kalem satır olarak listelenir; ilk resim satırda temsil görseli olarak görünür
- [ ] “Yeni Sevkiyat Kalemi” modalında: stok kartı/parça seçimi, adet girişi, çoklu resim ekleme ve önizleme çalışır
- [ ] Modal kaydı sonrası satır listeye düşer (temsil görseli + adet görsel)
- [ ] “Nereden” ve “Nereye” lokasyonları seçilebilir ve kaydedilir
- [ ] Genel “Kaydet” ile taslak sevkiyat finalize edilir; veritabanına kalemler ve resim bağları doğru yazılır
- [ ] Güvenlik ve validasyonlar (boyut/tip, sahiplik) başarılı şekilde çalışır
- [ ] Testler geçer; mevcut raporlama/Excel export bozulmaz

### 13) Karar Noktaları (Netleştirilecek)
- [ ] Resimlerin kaleme bağlanması için yol: `sevkiyat_resimler.kalem_id` (önerilen) mı, yoksa ayrı tablo mu?
- [ ] `taslak` durumunu veritabanı ENUM/konvansiyon olarak mı, yoksa sadece uygulama seviyesinde mi yöneteceğiz?
- [ ] Toplu finalize: tek adımda tamamla mı, yoksa Kaydet (taslak) + Bitir (durum geçişi) mi? (öneri: iki aşamalı)


