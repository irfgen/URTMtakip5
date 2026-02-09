### Özet

- Karma üretim planı tek bir plan kaydı içinde hem iş emirlerini hem de fason iş emirlerini referanslayacak.
- Mevcut `uretim_plani` yerine, yalın alanlarla `uretim_planlari` tablosu kullanılacak.
- Planın içeriği `is_emirleri_listesi` alanında JSON olarak tutulacak; her kalem iş emri veya fason iş emri tipinde olacak.
- Frontend üretim planı sayfası bu yeni modele göre yeniden kodlanacak (liste odaklı yapı, hızlı ekleme/çıkarma, özet başlık alanı).

### Yeni Veritabanı Şeması

- Tablo adı: `uretim_planlari`
- Alanlar:
  - `uretim_plani_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - `uretim_plani_adi` (VARCHAR)
  - `is_emirleri_listesi` (JSON) — iş emri ve fason iş emri kalemlerini birlikte tutar
  - `teslim_tarihi` (DATETIME)
  - `durum` (VARCHAR) — ör: 'Planlandı' | 'Üretimde' | 'Tamamlandı' | 'İptal'
  - `aciklama` (TEXT)
  - `olusturma_tarihi` (DATETIME DEFAULT CURRENT_TIMESTAMP)
  - `guncelleme_tarihi` (DATETIME DEFAULT CURRENT_TIMESTAMP)

```sql
CREATE TABLE IF NOT EXISTS uretim_planlari (
  uretim_plani_id INTEGER PRIMARY KEY AUTOINCREMENT,
  uretim_plani_adi VARCHAR(255) NOT NULL,
  is_emirleri_listesi JSON NOT NULL,
  teslim_tarihi DATETIME NOT NULL,
  durum VARCHAR(50) NOT NULL DEFAULT 'Planlandı',
  aciklama TEXT,
  olusturma_tarihi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (json_valid(is_emirleri_listesi))
);
```

Not: SQLite üzerinde `JSON` tipi `TEXT` olarak saklanır; `json_valid` ile şema bütünlüğü korunur. Sequelize tarafında `DataTypes.JSON` kullanılacaktır.

### is_emirleri_listesi JSON Yapısı

```json
[
  {
    "tip": "is_emri",
    "id": 123,           
    "is_emri_no": "IE-2025-0001"
  },
  {
    "tip": "fason",
    "id": "0d8f…-uuid", 
    "fason_no": "F-2025-015"
  }
]
```

- "tip": 'is_emri' veya 'fason

- "id": ilgili tablonun birincil anahtarı (`is_emirleri.is_emri_id` veya `fasonlar.fason_id`)
- Kolaylık için insan okunabilir numara alanları (`is_emri_no`, `fason_no`) tutulur.

### Geçiş (Migration) Stratejisi

1) `uretim_planlari` tablosunu oluştur.
2) Eski `uretim_plani` verilerini gruplandırarak taşımayı değerlendir:
   - `is_emirleri.uretim_plani_id` üzerinden gruplar oluştur.
   - Her grup için bir satır `uretim_planlari` oluştur; `is_emirleri_listesi` içine ilgili iş emirlerini ekle.
   - Fason iş emirleri için plan bağını ihtiyaç halinde `fasonlar` tablosuna opsiyonel `uretim_plani_id` FK olarak ekleyebilir veya sadece listeye referans olarak dahil edebilirsin.
3) Uygulama kodunu yeni tabloyu kullanacak şekilde güncelle.
4) Eski `uretim_plani` tablosunu yalnızca güvenli olduğunda kaldır.

### Backend Değişiklikleri (Sequelize + API)

- Model: `UretimPlani` modelinin tablo adını ve alanlarını yeni yapıya uyarlayan yeni bir model ekle (geçişte çakışmayı önlemek için `UretimPlaniV2` ismi ile başlayıp sonunda `UretimPlani`na devretme yapılabilir).
- `is_emirleri_listesi`: `DataTypes.JSON` olarak tanımlanacak.
- CRUD uçları:
  - POST `/api/uretim-planlari` → yeni plan oluştur (adı, teslim tarihi, durum, açıklama, boş/başlangıç listesi)
  - GET `/api/uretim-planlari` → sayfalı listeleme + arama (adı, durum, tarih aralığı)
  - GET `/api/uretim-planlari/:id` → detay (özet + kalem listesi)
  - PUT `/api/uretim-planlari/:id` → adı/tarih/durum/açıklama güncelle
  - PUT `/api/uretim-planlari/:id/kalem` → listeye kalem ekleme/çıkarma/sıralama
  - DELETE `/api/uretim-planlari/:id` → silme (koruma: bağlı iş/fason aktif ise engelle)
- Yardımcı endpointler:
  - `GET /api/is-emirleri?search=...` ve `GET /api/fasonlar?search=...` → plan kalemi seçici için.

### Frontend: Üretim Planı Sayfası (Yeniden Kodlama)

- Üst kısım (özet): `uretim_plani_adi`, `teslim_tarihi`, `durum`, `aciklama`
- Kalem listesi: birleşik tablo (kolonlar: Tip, No, Adı, Adet/Özet, Durum, İşlemler)
- Kalem ekleme: modal üzerinden iş emri/fason arayıp seçme, çoklu ekleme, sürükle-bırak sıralama (opsiyonel)
- Kalem çıkarma: satır bazlı silme, toplu silme
- Hızlı filtreler: sadece iş emirleri / sadece fason / durum filtreleri
- Kısmi kaydetme ve değişiklik uyarıları

#### Listeleme ve Bölümlendirme Kuralları (Duruma göre)

- **Tamamlananlar**: `tip === 'is_emri'` olan ve iş emri durum değeri "Tamamlandı" olan kalemler bu bölümde gösterilecek.
- **Fason İşler**:
  - `tip === 'fason'` olan kalemler doğrudan bu sekmede listelenir, veya
  - `tip === 'is_emri'` olup iş emri `durum === 'Fason'` ise bu sekmede gösterilir.
- **İş Emirleri**: Yukarıdakilerin dışında kalan tüm iş emirleri (örn. Planlandı, Üretimde vb.) bu listede yer alır.

Notlar:
- Durum karşılaştırmaları kullanıcı girdilerinden etkileneceği için küçük-büyük harf ve olası varyasyonlar normalize edilmelidir (örn. "tamamlandi", "Tamamlandı").
- Fason kalemleri için `tip: 'fason'` önceliklidir; ancak bazı senaryolarda fason süreç iş emri üzerinden yönetiliyorsa `durum: 'Fason'` desteği ikinci yol olarak bırakılmıştır.

Örnek hesaplama (frontend):

```js
const normalize = (s) => String(s || '').toLocaleLowerCase('tr-TR');

const tamamlananlar = is_emirleri_listesi.filter((k) =>
  k.tip === 'is_emri' && normalize(k.durum) === 'tamamlandı'
);

const fasonIsler = is_emirleri_listesi.filter((k) =>
  k.tip === 'fason' || (k.tip === 'is_emri' && normalize(k.durum) === 'fason')
);

const digerIsEmirleri = is_emirleri_listesi.filter((k) =>
  k.tip === 'is_emri' && !tamamlananlar.includes(k) && !fasonIsler.includes(k)
);
```

### TODO (adım adım, tiklenebilir)

- [x] Özet ve plan dokümantasyonu yazıldı (`_context/uretim_plani.md`).
- [x] DB: `uretim_planlari` tablosunu oluştur (model senkron + migration dosyası hazır).
- [x] Backend Model: `UretimPlaniV2` (tablo: `uretim_planlari`, alan eşlemeleri).
- [x] Backend API: CRUD ve kalem yönetimi uçlarını ekle.
- [ ] Backend: Arama/filtreleme (ad, tarih aralığı, durum).
- [ ] Migration: Eski `uretim_plani` → `uretim_planlari` veri taşınması (gruplama + JSON liste üretimi).
- [ ] (Opsiyonel) `fasonlar` tablosuna `uretim_plani_id` nullable FK ekle ve senkron güncelleme kancaları.
- [ ] Frontend: Sayfa yapısını yeni modele göre yeniden kodla.
- [ ] Frontend: Kalem ekleme/çıkarma/sıralama akışları.
- [ ] Frontend: Filtreler ve sayfa içi arama.
- [ ] Frontend: Duruma göre bölümlendirme (Tamamlananlar, Fason İşler, İş Emirleri) ve normalize edilmiş durum karşılaştırmaları.
- [ ] Test: Backend birim ve entegrasyon testleri.
- [ ] Test: Frontend e2e/senaryo testleri.
- [ ] Dokümantasyon: Kullanım kılavuzu ve veri modeli diyagramı güncelle.


