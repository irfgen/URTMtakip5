### Stok Takip Listeleri — Özellik Özeti ve Detaylı Yapılacaklar

Bu özellik ile Stok Kartları modülünde birden fazla stok kartını tek bir listede toplayıp görselleştirerek takip etmek mümkündür. Kullanıcılar:

- Yeni bir “Stok takip listesi” oluşturabilir.
- Listeye stok kartları ekleyebilir, düzenleyip silebilir.
- Listeye bir ad verebilir ve kaydedebilir.
- Mevcut “Takip listelerini” ayrı bir yönetim modalından görüntüleyip düzenleyebilir/silebilir.

Mevcut kod yapısı ve yeniden kullanılabilir bileşenler:

- Stok kartı seçimi için `frontend/src/components/StokKartiSecici.jsx` bileşeni mevcut ve yeniden kullanılabilir.
- Modal örüntüleri `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` ile pek çok yerde uygulanmış durumda (ör: `frontend/src/components/TeklifImportModal.jsx`, `frontend/src/components/ParcaKayitlariModal.jsx`).
- Stok Kartları listesi sayfası `frontend/src/pages/StokKartlari.jsx` içinde ve header alanına buton eklemek kolay.

Backend tarafında benzer CRUD desenleri mevcut (ör: `backend/src/controllers/uretimPlaniController.js`, `backend/src/routes/...`). Bu özelliğe özel yeni bir varlık/model ve uç noktalar (CRUD) tanımlanacaktır: `StokTakipListesi`.

---

### Detaylı Yapılacaklar (To‑Do)

#### 1) Kullanıcı hikayeleri ve kabul kriterleri

- Yeni liste oluşturma: Kullanıcı `Yeni Stok Takip Listesi` butonuna tıklar, boş bir modal açılır, liste adını girer, stok kartları ekler, kaydeder.
  - Kabul: Liste adı zorunlu; en az 1 stok kartı eklenmeden kayda izin verilmemeli (konfigüre edilebilir).
- Liste yönetimi: `Takip listelerini yönet` butonu ile mevcut listeler bir modalda listelenir; düzenle/sil işlemleri yapılır.
  - Kabul: Silme onayı istenir; düzenleme akışı, oluşturma modalıyla aynı bileşeni ön‑dolu kullanır.

#### 2) Frontend — Stok Kartları sayfasına butonların eklenmesi

- Dosya: `frontend/src/pages/StokKartlari.jsx`
  - Header `Stack` içine iki yeni buton eklenir:
    - `Yeni Stok Takip Listesi` (contained, Add ikonlu)
    - `Takip listelerini yönet` (outlined)
  - İki modalın açık/kapalı durumlarını yöneten local state eklenir:
    - `stokTakipListesiModalOpen`, `setStokTakipListesiModalOpen`
    - `stokTakipListeleriYonetModalOpen`, `setStokTakipListeleriYonetModalOpen`
  - İlgili modal bileşenleri import edilip JSX’e eklenir:
    - `<StokTakipListesiModal ... />`
    - `<StokTakipListeleriYonetModal ... />`

Not: Mevcut MUI teması ve sayfa düzenine uyumlu stiller kullanılacaktır.

##### 2.a) Stok Kartları listesine “Stok Takip Listesi” sütunu eklenmesi

- `DataGrid` kolonlarına yeni bir sütun eklenir: `stokTakipListeleri`.
  - Gösterim: İlgili stok kartının dahil olduğu takip listelerinin adları `Chip` olarak gösterilir. Çok sayıda liste varsa `+N` ve tooltip ile tüm liste adları gösterilebilir.
  - Veri beslemesi: Üyelik bilgisi için frontend’de bir üyelik haritası kullanılır (bkz. 5. madde). Satır render’ında `membershipMap[stokKarti.id]` üzerinden listeler çekilir.

##### 2.b) Filtre alanına “Stok Takip Listesi” açılır listesi eklenmesi

- Filtre paneline `Select` bileşeni eklenir: `Seçili Takip Listesi`.
  - Veri kaynağı: `stokTakipListeleriService.list()`.
  - Davranış:
    - Bir liste seçildiğinde stok kartları ya backend’den bu kritere göre filtrelenir (önerilen) ya da üyelik haritası ile client-side filtre uygulanır (küçük veri setlerinde).
    - `useStokKartlari` içinde `filters` nesnesine `stokTakipListesiId` eklenir ve `fetchData` bu parametre ile backend’e iletir (bkz. 6.d).

##### 2.c) İşlemler sütununa “Listeye Ekle” ve “Listeden Çıkar” butonlarının eklenmesi

- Her satırda iki aksiyon:
  - `Listeye Ekle`: Davranış iki şekilde çalışır:
    - Eğer filtrede bir “Seçili Takip Listesi” varsa doğrudan o listeye ekler.
    - Aksi halde küçük bir seçim diyaloğu/popup açılarak kullanıcıdan liste seçmesi istenir (mevcut yönetim modalındaki liste datası kullanılabilir veya `stokTakipListeleriService.list()` çağrılır).
  - `Listeden Çıkar`: Yalnızca stok kartı seçili listedeyse aktif olur; ilgili listeden çıkarır. Filtrede liste seçilmemişse seçim diyaloğu açılabilir.
- Ekle/çıkar işlemleri sonrası:
  - `membershipMap` güncellenir (lokal state) ve tablo re-render olur.
  - Snackbar ile başarı/hata bildirilir.
- Hata durumları ele alınır; butonlar işlem sırasında disabled olur.

#### 3) Frontend — Yeni Bileşen: StokTakipListesiModal

- Dosya: `frontend/src/components/StokTakipListeleri/StokTakipListesiModal.jsx`
- Amaç: Yeni liste oluşturma ve mevcut listeyi düzenleme.
- Props:
  - `open: boolean`
  - `onClose: function`
  - `onSaved: function` (kaydettikten sonra üst seviyeyi bilgilendirmek için)
  - `initialList: { id?, ad, kalemler: [{ stok_karti_id, adet?, not? }]} | null`
- İçerik ve davranış:
  - Üstte label + `TextField` ile “Stok takip listesi adı”. Zorunlu alan.
  - “Stok kartı ekle” butonu: `StokKartiSecici` modalını açar. Seçim yapıldığında kalemler listesine eklenir.
    - Varsayılan olarak `adet: 1` alanı tutulabilir; düzenleme ile değiştirilebilir.
  - Seçilen stok kartları bir tablo/listede gösterilir:
    - Kolonlar: Malzeme adı/kodu (veya stok kartından gelen temel alanlar), Adet, Not, İşlemler.
    - Her satırda `Düzenle` (adet/not düzenlemek için inline veya küçük bir satır içi düzenleme), `Sil` butonları.
  - Alt kısımda `Kaydet` butonu: `create` veya `update` çağrısı yapar (id varlığına göre).
  - Hata ve başarı durumları için `Snackbar`/`Alert` kullanımı.
  - Kaydetme sırasında `loading` durumu.

Teknik notlar:

- `StokKartiSecici` dönüşünde gelen objeden gerekli alanlar normalize edilerek `kalemler` dizisine `{ stok_karti_id, adet, not }` şeklinde eklenir. `stok_karti_id` mevcut API’de `id` veya benzeri alan olabilir; kesin alan adı, `frontend/src/services/stokKartlariService.js` ve `/api/stok-karti` yanıt şemasına göre doğrulanır.
- Düzenle işlemi için ya inline editörler (MUI `TextField`/`NumberField`) ya da küçük bir satır içi modal kullanılabilir. İlk aşamada inline önerilir.

#### 4) Frontend — Yeni Bileşen: StokTakipListeleriYonetModal

- Dosya: `frontend/src/components/StokTakipListeleri/StokTakipListeleriYonetModal.jsx`
- Amaç: Mevcut stok takip listelerini görüntülemek ve yönetmek.
- Özellikler:
  - Listeleme (MUI `Table` veya `DataGrid`): Kolonlar: Ad, Kalem Sayısı, Oluşturma/Güncelleme Tarihi (varsa), İşlemler.
  - İşlemler: `Düzenle` (aynı `StokTakipListesiModal` ile aç), `Sil` (confirm ile), opsiyonel `Kopyala`.
  - Üstte `Yeni Liste` butonu ile hızlı oluşturma akışına geçiş.
  - Veri kaynağı: `stokTakipListeleriService.list()`.

#### 5) Frontend — Service katmanı

- Dosya: `frontend/src/services/stokTakipListeleriService.js`
- Fonksiyonlar:
  - `list()` → GET `/api/stok-takip-listeleri`
  - `getById(id)` → GET `/api/stok-takip-listeleri/:id`
  - `create({ ad, kalemler })` → POST `/api/stok-takip-listeleri`
  - `update(id, { ad, kalemler })` → PUT `/api/stok-takip-listeleri/:id`
  - `remove(id)` → DELETE `/api/stok-takip-listeleri/:id`
- Hata yönetimi standardize edilir (mevcut `api.js` yardımcılarıyla uyum).

##### 5.a) Frontend — Üyelik işlemleri ve yardımcıları

- Ek fonksiyonlar:
  - `addItem(listId, { stok_karti_id, adet = 1, not = '' })` → POST `/api/stok-takip-listeleri/:id/kalemler`
  - `removeItem(listId, stok_karti_id)` → DELETE `/api/stok-takip-listeleri/:id/kalemler/:stok_karti_id`
  - `getMembershipForIds(stokKartiIds: number[])` → GET `/api/stok-takip-listeleri/membership?ids=1,2,3`
    - Dönüş: `{ [stok_karti_id]: [{ id, ad }] }`
  - (Ops.) `getListsForStokKarti(stokKartiId)` → GET `/api/stok-takip-listeleri/by-stok-karti/:stokKartiId`
- `membershipMap` state’i `StokKartlari.jsx` içerisinde tutulur ve grid’de kullanılır.
- Filtre değişiminde ve sayfa değişiminde ilgili `stokKartiIds` için `getMembershipForIds` çağrısı yapılır ve map güncellenir.

#### 6) Backend — Veri modeli ve controller/route

- Model: `backend/src/models/StokTakipListesi.js`
  - Alanlar:
    - `id`: INTEGER PK AUTO_INCREMENT
    - `ad`: STRING, not null
    - `kalemler`: JSON, not null (ör. `[ { stok_karti_id: number, adet: number, not?: string } ]`)
    - `aciklama`: TEXT, nullable (opsiyonel)
    - `timestamps`: `olusturma_tarihi`, `guncelleme_tarihi`
  - Açıklama: İlk aşamada kalemler için ayrı tablo yerine JSON alanı yeterlidir. İhtiyaç halinde `StokTakipListesiKalemi` ilişkisel tabloya evrilebilir.

- Controller: `backend/src/controllers/stokTakipListeleriController.js`
  - `list`: tüm listeleri döndürür (sayfalama opsiyonel)
  - `getById`: tek listeyi döndürür
  - `create`: validasyon (ad zorunlu, kalemler dizi olmalı), kayıt
  - `update`: mevcut listeyi günceller
  - `remove`: listeyi siler
  - Not: İsim benzersizliği zorunlu değil; ancak istenirse benzersizlik kontrolü eklenebilir.

- Routes: `backend/src/routes/stokTakipListeleri.js`
  - `GET /api/stok-takip-listeleri`
  - `GET /api/stok-takip-listeleri/:id`
  - `POST /api/stok-takip-listeleri`
  - `PUT /api/stok-takip-listeleri/:id`
  - `DELETE /api/stok-takip-listeleri/:id`

- Üyelik işlemleri için ek uç noktalar:
  - `POST   /api/stok-takip-listeleri/:id/kalemler` (body: `{ stok_karti_id, adet?, not? }`)
  - `DELETE /api/stok-takip-listeleri/:id/kalemler/:stok_karti_id`
  - `GET    /api/stok-takip-listeleri/membership?ids=1,2,3` → Çoklu stok kartı için liste üyelik haritası
  - `GET    /api/stok-takip-listeleri/by-stok-karti/:stokKartiId` → Tek stok kartı için dahil olduğu listeler

- (Ops.) Stok kartlarını liste üyeliğine göre filtrelemek için mevcut stok kartı listeleme endpoint’ine destek:
  - `GET /api/stok-karti?stok_takip_listesi_id=:id`
    - Sunucu tarafında, `StokTakipListesi.kalemler` JSON alanında `stok_karti_id=:id` üyelerini bulup, ilgili stok kartı id’leriyle filtre uygulanır.

- Kayıt (server): `backend/src/index.js` içinde route mount edilir.

#### 7) Veritabanı şeması (Sequelize ve/veya SQL)

- Sequelize Model ile otomatik senkronizasyon veya manuel migration:

```sql
CREATE TABLE IF NOT EXISTS stok_takip_listeleri (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad VARCHAR(255) NOT NULL,
  kalemler JSON NOT NULL,
  aciklama TEXT NULL,
  olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Not: JSON desteği veritabanına göre değişiklik gösterebilir. SQLite için `TEXT` saklama + parse; PostgreSQL için `JSONB` tercih edilir. Mevcut projede kullanılan veritabanına göre kolon tipi ayarlanmalıdır.

Üyelik güncelleme stratejisi:

- İlk fazda `kalemler` JSON’ı üzerinde atomik ekleme/çıkarma işlemleri controller seviyesinde yapılır:
  - Eklemede: mevcut dizi alınır → aynı `stok_karti_id` yoksa push edilir → kaydedilir.
  - Çıkarmada: dizi `filter` ile temizlenir → kaydedilir.
  - İleride performans ihtiyacına göre `stok_takip_listesi_kalemleri` adında ilişkisel tabloya geçiş yapılabilir.

#### 8) Doğrulama, hata yönetimi ve UX ayrıntıları

- Liste adı boş bırakılamaz; boşsa `Kaydet` disabled.
- Kalemler dizisi boşsa uyarı verilir; gereklilik kararı ürün tarafına göre verilmelidir.
- Kaydet/Sil işlemlerinde loading state ve `Snackbar` bildirimleri gösterilir.
- Silme işleminde `confirm` diyaloğu.

#### 9) Performans ve ölçeklenebilirlik

- Yönetim modalında sayfalama (çok liste olursa) opsiyonel.
- Kalemler çok büyürse (örn. yüzlerce stok kartı), tablo sanallaştırması (`DataGrid`) değerlendirilebilir.

#### 10) Güvenlik ve yetkilendirme

- İlk fazda mevcut auth mekanizmasıyla aynı seviyede açık olacaktır.
- Gerekirse liste bazlı sahiplik ve rol kontrolleri eklenebilir (ör. yalnızca oluşturan silebilir/düzenleyebilir).

#### 11) Test planı

- Frontend
  - Butonların görünmesi ve modal açılış/kapanış akışları.
  - Stok kartı ekleme/çıkarma, adet/not düzenleme.
  - Kaydetme sonrası listelerin yönetim modalında görünmesi.
  - Stok kartları grid’inde “Stok Takip Listesi” sütununun doğru üyelikleri göstermesi.
  - Filtrede seçilen listeye göre stok kartları listesinin doğru filtrelenmesi.
  - Satır bazlı `Listeye Ekle`/`Listeden Çıkar` butonlarının seçili liste bağlamında doğru çalışması ve üyelik haritasının güncellenmesi.

- Backend
  - CRUD uç noktalarının 200/201/204 ve hata durumları (400/404/500) ile doğru çalışması.
  - `kalemler` şemasının doğrulaması.
   - Üyelik uç noktaları (add/remove/membership, by-stok-karti) için pozitif/negatif testler.
   - `stok_takip_listesi_id` query paramı ile stok kartları filtrelemesinin doğrulanması (varsa).

#### 12) Mobil uyarlama (opsiyonel faz)

- `frontend/src/pages/mobile/StokKartlariMobile.jsx` için minimal entegrasyon:
  - FAB menüsüne `Yeni Stok Takip Listesi` eklenebilir.
  - Liste yönetimi mobilde `Drawer` veya tam ekran `Dialog` ile gösterilebilir.

#### 13) İsimlendirme, i18n ve UI metinleri

- Sabit metinler Türkçe; bileşen içi metinler değiştirilebilir olacak şekilde merkezi bir yapıdan okunabilir (ileride i18n’e taşınabilir).

---

### Dosya/Ek API Taslakları (Referans)

- Frontend bileşenleri (yeni):
  - `frontend/src/components/StokTakipListeleri/StokTakipListesiModal.jsx`
  - `frontend/src/components/StokTakipListeleri/StokTakipListeleriYonetModal.jsx`
  - `frontend/src/services/stokTakipListeleriService.js`

- Frontend sayfa editleri (mevcut):
  - `frontend/src/pages/StokKartlari.jsx` → header’a iki buton + modal eklemeleri

- Backend (yeni):
  - `backend/src/models/StokTakipListesi.js`
  - `backend/src/controllers/stokTakipListeleriController.js`
  - `backend/src/routes/stokTakipListeleri.js`
  - `backend/src/index.js` (route mount)

- API uç noktaları:
  - `GET    /api/stok-takip-listeleri`
  - `GET    /api/stok-takip-listeleri/:id`
  - `POST   /api/stok-takip-listeleri`     (body: `{ ad, kalemler }`)
  - `PUT    /api/stok-takip-listeleri/:id` (body: `{ ad, kalemler }`)
  - `DELETE /api/stok-takip-listeleri/:id`
  - `POST   /api/stok-takip-listeleri/:id/kalemler`
  - `DELETE /api/stok-takip-listeleri/:id/kalemler/:stok_karti_id`
  - `GET    /api/stok-takip-listeleri/membership?ids=...`
  - `GET    /api/stok-takip-listeleri/by-stok-karti/:stokKartiId`
  - (Ops.) `GET /api/stok-karti?stok_takip_listesi_id=:id`

---

### Uygulama Sırası (öneri)

1) Backend model + routes + controller (CRUD) → Postman ile doğrula.
2) Frontend service → basit smoke testi (console ile).
3) `StokTakipListesiModal` → yeni liste oluşturma akışı.
4) Üyelik uç noktaları ve service fonksiyonları (`addItem`, `removeItem`, `membership`) → grid ile entegre edin.
5) `StokTakipListeleriYonetModal` → listeleme/düzenleme/silme.
6) `StokKartlari.jsx` →
   - “Stok Takip Listesi” sütunu,
   - Filtre paneline “Seçili Takip Listesi” `Select`,
   - Satır aksiyonlarına `Listeye Ekle`/`Listeden Çıkar`.
6) Bildirimler, validasyonlar ve UX cilası.
7) (Ops.) Stok kartlarını backend’de `stok_takip_listesi_id` ile filtreleme; mobil uyarlama; gelişmiş özellikler (kopyala, paylaş, dışa aktar).


