# 11. NOTLAR (Notes) Modülü

## Genel Bakış

Notlar modülü, kullanıcıların kategorili notlar oluşturmasını, etiketlemesini ve yönetmesini sağlar.

**Route Dosyası:** `backend/src/routes/notlarRoutes.js`
**Controller Dosyası:** `backend/src/controllers/notlarController.js`

---

## Modül Amacı

- Not oluşturma ve düzenleme
- Kategori bazlı organizasyon
- Etiket sistemi
- Öncelik seviyeleri
- Resim ekleme desteği
- Arama ve filtreleme

---

## Veritabanı Tablosu

**Ana Tablo:** `notlar`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| baslik | STRING | Not başlığı |
| icerik | TEXT | Not içeriği |
| kategori | STRING | Kategori |
| etiketler | STRING | Etiketler (virgülle ayrılmış) |
| oncelik | STRING | öncelik: dusuk, normal, yuksek, kritik |
| renk | STRING | Not rengi (hex) |
| sabit | BOOLEAN | Sabitnot mu |
| resim_url | STRING | Resim URL |
| olusturan | STRING | Oluşturan kullanıcı |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

**Kategoriler Tablosu:** `not_kategorileri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| ad | STRING | Kategori adı |
| renk | STRING | Renk kodu |
| simge | STRING | İkon simgesi |
| sira | INTEGER | Sıralama |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm notları listele |
| `GET /:id` | Not detayı |
| `GET /kategori/:kategori` | Kategoriye göre notlar |
| `GET /etiket/:etiket` | Etikete göre notlar |
| `GET /oncelik/:oncelik` | Önceliğe göre notlar |
| `GET /ara/:arama` | Notlarda arama |
| `GET /kategoriler` | Tüm kategorileri listele |
| `GET /son-notlar/:limit` | Son n not |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni not oluştur |
| `POST /:id/resim` | Nota resim ekle |
| `POST /kategori` | Yeni kategori oluştur |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Notu güncelle |
| `PUT /:id/notlari-tasi` | Notları taşı |
| `PUT /kategori/:id` | Kategori güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Not sil |
| `DELETE /:notId/resim/:resimId` | Not resmini sil |
| `DELETE /kategori/:id` | Kategori sil |

---

## Öncelik Seviyeleri

| Seviye | Açıklama | Renk |
|--------|----------|------|
| dusuk | Önemsiz not | Gri |
| normal | Standart not | Mavi |
| yuksek | Önemli not | Turuncu |
| kritik | Kritik not | Kırmızı |

---

## Not Renkleri

| Renk | Hex | Kullanım |
|------|-----|----------|
| Sarı | #FFF9C4 | Varsayılan |
| Mavi | #BBDEFB | Bilgi |
| Yeşil | #C8E6C9 | Başarı |
| Turuncu | #FFE0B2 | Uyarı |
| Kırmızı | #FFCDD2 | Kritik |
| Mor | #E1BEE7 | Özel |
| Gri | #CFD8DC | Arşiv |

---

## Temel Fonksiyonlar

### 1. notOlustur(notData)
Yeni not oluşturur.
- Başlık ve içerik zorunlu
- Otomatik tarih ataması

### 2. notGuncelle(notId, yeniData)
Notu günceller.
- Değişiklik tarihini günceller

### 3. notSil(notId)
Notu siler (soft delete olabilir).

### 4. resimEkle(notId, resimData)
Nota resim ekler.
- URL kaydeder
- Thumbnail oluşturulabilir

### 5. kategoriOlustur(kategoriData)
Yeni kategori oluşturur.

### 6. notAra(aramaKelime)
Notlarda arama yapar.
- Başlık ve içerikte arar
- Etiket bazlı arama

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Notlar.jsx` | Ana notlar sayfası |
| `NotListesi.jsx` | Not listesi |
| `NotForm.jsx` | Not oluşturma formu |
| `NotDetay.jsx` | Not detay görünümü |
| `NotKart.jsx` | Not kartı component |
| `KategoriListesi.jsx` | Kategori listesi |
| `EtiketInput.jsx` | Etiket girişi |
| `RenkSecici.jsx` | Renk seçici |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `not:created` | Yeni not oluşturuldu |
| `not:updated` | Not güncellendi |
| `not:deleted` | Not silindi |
| `not:deleted` | Not silindi |

---

## İlişkili Modüller

- **Kullanıcılar** - Not oluşturan
- **Dosya Yükleme** - Resim yükleme

---

## Kullanım Senaryoları

### Senaryo 1: Hızlı Not
1. Kullanıcı "Yeni Not" butonuna tıklar
2. Başlık ve içerik girer
3. Kategori seçer (opsiyonel)
4. Kaydet

### Senaryo 2: Kritik Not
1. Kritik bir durum için not oluşturur
2. Öncelik "kritik" seçer
3. Renk otomatik kırmızı
4. Diğer kullanıcılar kritik not olarak görür

### Senaryo 3: Not Aramak
1. Arama kutusuna kelime yazar
2. Sistem başlık ve içerikte arar
3. Sonuçlar listelenir

---

## Validasyon Kuralları

- `baslik` zorunlu, en fazla 200 karakter
- `icerik` opsiyonel
- `kategori` geçerli kategori olmalı
- `oncelik` geçerli değer olmalı

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| NT001 | Not bulunamadı | Geçersiz ID |
| NT002 | Kategori bulunamadı | Geçersiz kategori ID |
| NT003 | Resim yüklenemedi | Dosya hatası |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-01 | İlk versiyon |
| 1.1 | 2024-04 | Kategori sistemi eklendi |
| 1.2 | 2024-07 | Etiket ve renk sistemi |
| 1.3 | 2024-10 | Arama özelliği eklendi |
| 1.4 | 2025-01 | Resim desteği |