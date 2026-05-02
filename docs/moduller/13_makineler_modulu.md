# 13. MAKİNALAR (Machines) Modülü

## Genel Bakış

Makineler modülü, üretim ekipmanlarının (CNC, torna, freze vb.) detaylı yönetimini, sipariş takibini ve stok bağlantısını sağlar.

**Route Dosyası:** `backend/src/routes/makinaRoutes.js`
**Controller Dosyası:** `backend/src/controllers/makinaController.js`
**Frontend Sayfası:** `frontend/src/pages/Makinalar.jsx`

---

## Modül Amacı

- Makina tanımlama ve katalog
- Sipariş takibi
- Stok yönetimi
- Grup parça yönetimi
- Sınıflandırma
- Performans izleme

---

## Veritabanı Tablosu

**Makineler Tablosu:** `makineler`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| makina_kodu | STRING | Makina kodu |
| makina_adi | STRING | Makina adı |
| sinif | STRING | Sınıf/Kategori |
| marka | STRING | Marka |
| model | STRING | Model |
| seri_no | STRING | Seri numarası |
| yil | INTEGER | Üretim yılı |
| durum | STRING | aktif, pasif, bakim |
| lokasyon | STRING | Konum |
| foto_url | STRING | Fotoğraf URL |
| notlar | TEXT | Notlar |
| created_at | DATETIME | Oluşturulma tarihi |

**Makina Siparişleri:** `makina_siparisleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| makina_id | INTEGER | Makina ID |
| siparis_no | STRING | Sipariş numarası |
| tedarikci | STRING | Tedarikçi |
| tarih | DATE | Sipariş tarihi |
| durum | STRING | beklemede, siparis, teslim |
| tutar | DECIMAL | Sipariş tutarı |
| notlar | TEXT | Notlar |

**Makina Stoğu:** `makina_stok`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| makina_id | INTEGER | Makina ID |
| stok_karti_id | INTEGER | Stok kartı ID |
| miktar | DECIMAL | Miktar |
| birim | STRING | Birim |

**Makina Grup Parçaları:** `makina_group_parts`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| makina_id | INTEGER | Makina ID |
| grup_adi | STRING | Grup adı |
| parca_kodu | STRING | Parça kodu |
| adet | INTEGER | Adet |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm makineleri listele |
| `GET /:id` | Makina detayı |
| `GET /makinalar` | Makina listesi |
| `GET /makinalar/:id` | Makina detay |
| `GET /makinalar/:sinifId` | Sınıfa göre makineler |
| `GET /makina-siparisleri` | Siparişleri listele |
| `GET /makina-siparisleri/:id` | Sipariş detayı |
| `GET /makina-stok` | Makina stokları |
| `GET /makina-stok/:id` | Stok detay |
| `GET /siniflar` | Makina sınıfları |
| `GET /:makina_id/group-parts` | Grup parçaları |
| `GET /group/:group_id/details` | Grup detayları |
| `GET /overview` | Tüm grupların özeti |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni makina oluştur |
| `POST /siniflar` | Yeni sınıf oluştur |
| `POST /makina-siparisleri` | Sipariş oluştur |
| `POST /makina-stok` | Stok ekle |
| `POST /makina-stok/stoktan-dus` | Stoktan düş |
| `POST /group-parts` | Grup parçası ekle |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /makinalar/:id` | Makina güncelle |
| `PUT /siniflar/:id` | Sınıf güncelle |
| `PUT /makina-siparisleri/:id/durum` | Sipariş durumu güncelle |
| `PUT /makina-stok/:id` | Stok güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /makinalar/:id` | Makina sil |
| `DELETE /makina-siparisleri/:id` | Sipariş sil |
| `DELETE /makina-stok/:id` | Stok sil |
| `DELETE /siniflar/:id` | Sınıf sil |

---

## Alt Modüller

### 1. Makina Siparişleri
**Dosya:** `makinaSiparisRoutes.js`

Makina bakım/sarf malzemesi siparişleri.

### 2. Makina Stokları
**Dosya:** `makinaStokRoutes.js`

Makina özel stok yönetimi.

### 3. Makina Grup Parçaları
**Dosya:** `makinaGroupPartsRoutes.js`

Makina için gruplandırılmış parçalar.

---

## Temel Fonksiyonlar

### 1. makinaOlustur(makinaData)
Yeni makina oluşturur.

### 2. siparisOlustur(makinaId, siparisData)
Makina için sipariş oluşturur.

### 3. stokEkle(makinaId, stokData)
Makina stoğuna malzeme ekler.

### 4. grupParcasiEkle(makinaId, parcaData)
Gruba parça ekler.

### 5. performansGetir(makinaId, tarihAraligi)
Makina performans verilerini döner.

---

## Makina Sınıfları

| Sınıf | Açıklama |
|-------|----------|
| CNC Torna | CNC torna makineleri |
| CNC Freze | CNC freze makineleri |
| Torna | Manuel torna |
| Freze | Manuel freze |
| Matkap | Delme makineleri |
| Kaynak | Kaynak ekipmanları |
| Diğer | Diğer makineler |

---

## Durumlar

| Durum | Açıklama |
|-------|----------|
| aktif | Çalışıyor |
| pasif | Kullanım dışı |
| bakim | Bakımda |

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Makinalar.jsx` | Ana makina sayfası |
| `MakinaListesi.jsx` | Makina listesi |
| `MakinaForm.jsx` | Makina formu |
| `MakinaDetay.jsx` | Makina detay |
| `MakinaSiparislerModal.jsx` | Siparişler modal |
| `MakinaStoklariModal.jsx` | Stoklar modal |
| `GrupParcalari.jsx` | Grup parçaları |

---

## İlişkili Modüller

- **Tezgahlar** - Tezgah-makina ilişkisi
- **Stok Kartları** - Stok bağlantısı
- **Siparişler** - Sipariş takibi
- **BOM** - Parça bağlantısı

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Sipariş takibi eklendi |
| 1.2 | 2024-09 | Grup parça sistemi |
| 1.3 | 2025-01 | Stok entegrasyonu |