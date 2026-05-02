# Makina Sipariş ve Stok Yönetim Sistemi - PRD

**Proje**: ÜRTM Takip
**Modül**: Makinalar Modülü - Sipariş ve Stok Yönetimi
**Versiyon**: 1.0.0 (MVP)
**Tarih**: 2026-01-04
**Durum**: Taslak

---

## 📋 Doküman Amacı

Bu Product Requirements Document (PRD), ÜRTM Takip sistemi içindeki Makinalar modülüne eklenecek **Makina Sipariş** ve **Makina Stok** yönetimi özelliklerinin temel düzeydeki gereksinimlerini tanımlar.

---

## 🎯 Özet

### Temel Kavramlar
- **Tezgahlar**: İş istasyonları (üretim ekipmanları, sabit varlıklar)
- **Makineler**: İmal edilen ve satılan ürünler (değişen envanter)

### İş Akışı
```
Müşteri Siparişi → Üretim Aşamaları → Stoğa Giriş → Satış → Stoktan Çıkış
```

### MVP Kapsamı
✅ Makina stoklarını tutabilmek
✅ Makina siparişlerini kaydedebilmek
❌ Raporlama, filtreleme, sıralama (ileri versiyon)

---

## 🗂️ Mevcut Sistematik Yapı

### Mevcut Veritabanı Tabloları

#### `makinalar` Tablosu
Mevcut makina ürünlerini tanımlar. Bu tablo değiştirilmeyecek.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `makina_id` | UUID (PK) | Benzersiz makina ID |
| `name` | STRING | Makina adı/kodu (benzersiz) |
| `description` | TEXT | Açıklama |
| `model` | STRING | Model |
| `seri_no` | STRING | Seri numarası |
| `uretim_yili` | INTEGER | Üretim yılı |
| `durum` | ENUM | 'aktif', 'pasif', 'bakim' |
| `makina_sinifi_id` | INTEGER (FK) | Makina sınıfı foreign key |
| `items` | JSON | Parça listesi (BOM) |
| `created_at` | DATE | Oluşturulma tarihi |
| `updated_at` | DATE | Güncelleme tarihi |

**Makina Örnekleri:**
- OF MZK 4 DOOR
- MZK NC RIPPER
- DRAGON PE 383

#### `makina_siniflari` Tablosu
Makina sınıflarını kategorize eder.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | INTEGER (PK) | Sınıf ID |
| `ad` | STRING (unique) | Sınıf adı |
| `aciklama` | TEXT | Açıklama |
| `aktif` | BOOLEAN | Aktif mi? |
| `created_at` | DATE | Oluşturulma tarihi |
| `updated_at` | DATE | Güncelleme tarihi |

---

## 🆕 Yeni Özellikler

### 1. Makina Siparişleri Yönetimi

#### İş Tanımı
Müşteri siparişlerini kaydetmek, takip etmek ve üretim aşamalarını yönetmek.

#### Sipariş Durumları
Siparişler aşağıdaki durumları alabilir (sıralı akış zorunlu değil):

| Durum | Açıklama |
|-------|----------|
| **Beklemede** | Sipariş alındı, üretim bekleniyor |
| **Gövde Montaj** | Makina gövdesi montaj aşamasında |
| **Boyada** | Boya işlemi aşamasında |
| **Son montajda** | Final montaj aşamasında |
| **Üretimde** | Genel üretim aşaması |
| **Tamamlandı** | Üretim tamamlandı, stoğa girmeye hazır |
| **İptal** | Sipariş iptal edildi |

#### İş Akışı
```
Müşteri Siparişi Oluştur
  ↓
Üretim Aşamaları (Gövde Montaj → Boya → Son Montaj)
  ↓
Tamamlandı Durumu
  ↓
Makina Stoğuna Giriş
  ↓
Satış ile Siparişin Tamamlanması
```

---

### 2. Makina Stok Yönetimi

#### İş Tanımı
Stoktaki makineleri takip etmek, depolara göre yönetmek (opsiyonel).

#### Depolar
- **Ana Depo**: Ana depolama alanı
- **Alaaddin Bey Depo**: İkinci depolama alanı

**Not**: Bir makina stoğunun bir depoya kaydedilmesi ZORUNLU DEĞİL. Depo bilgisi opsiyoneldir.

#### Stok Giriş Kaynakları
1. **Satın Alma**: Tedarikçiden alınan makineler
2. **Üretim**: İmalat edilen makineler
3. **Montaj**: Montaj edilen makineler

#### Stoktan Çıkış
- **Satış**: Makina satıldığında stoktan düşülür
- **Parça Stok Entegrasyonu**: Mevcut makina satış özelliğine bağlı olarak makinayı oluşturan parçaların parça stoklarından adetlerince düşülmesi özelliği BOZULMAMALIDIR.

---

## 📊 Veritabanı Tasarımı

### Yeni Tablo: `makina_siparisleri`

Müşteri siparişlerini tutar.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `siparis_id` | UUID (PK) | ✅ | Benzersiz sipariş ID |
| `siparis_no` | STRING (unique) | ✅ | Sipariş numarası (örn: SIP-2026-0001) |
| `makina_id` | UUID (FK) | ✅ | Makina foreign key → makinalar.makina_id |
| `musteri_adi` | STRING | ✅ | Müşteri adı |
| `musteri_telefon` | STRING | ❌ | Müşteri telefonu |
| `musteri_email` | STRING | ❌ | Müşteri e-posta |
| `adet` | INTEGER | ✅ | Sipariş adedi (varsayılan: 1) |
| `durum` | ENUM | ✅ | Sipariş durumu |
| `siparis_tarihi` | DATE | ✅ | Sipariş tarihi |
| `teslim_tarihi` | DATE | ❌ | Planlanan teslim tarihi |
| `tamamlanma_tarihi` | DATE | ❌ | Gerçekleşen teslim tarihi |
| `notlar` | TEXT | ❌ | Sipariş notları |
| `created_at` | DATE | ✅ | Oluşturulma tarihi |
| `updated_at` | DATE | ✅ | Güncelleme tarihi |

**Durum ENUM Değerleri:**
```javascript
['Beklemede', 'Gövde Montaj', 'Boyada', 'Son montajda', 'Üretimde', 'Tamamlandı', 'İptal']
```

**Indexler:**
- `siparis_no` → UNIQUE
- `makina_id` → INDEX
- `durum` → INDEX
- `siparis_tarihi` → INDEX

### Yeni Tablo: `makina_stok`

Stoktaki makineleri tutar.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `stok_id` | UUID (PK) | ✅ | Benzersiz stok ID |
| `makina_id` | UUID (FK) | ✅ | Makina foreign key → makinalar.makina_id |
| `adet` | INTEGER | ✅ | Stok adedi |
| `depo_id` | INTEGER | ❌ | Depo ID (opsiyonel) |
| `giris_kaynagi` | ENUM | ❌ | Giriş kaynağı (satın alma, üretim, montaj) |
| `giris_tarihi` | DATE | ✅ | Stok giriş tarihi |
| `siparis_id` | UUID (FK) | ❌ | İlgili sipariş ID (eğer siparişten geldiyse) |
| `seri_nolari` | JSON | ❌ | Seri numaraları listesi |
| `notlar` | TEXT | ❌ | Stok notları |
| `created_at` | DATE | ✅ | Oluşturulma tarihi |
| `updated_at` | DATE | ✅ | Güncelleme tarihi |

**Depo ENUM Değerleri:**
```javascript
[1, 2] // 1: Ana Depo, 2: Alaaddin Bey Depo
```

**Giriş Kaynağı ENUM Değerleri:**
```javascript
['Satın Alma', 'Üretim', 'Montaj']
```

**Indexler:**
- `makina_id` → INDEX
- `depo_id` → INDEX
- `giris_tarihi` → INDEX

### İlişkiler
```
makinalar (1) ←→ (N) makina_siparisleri
makinalar (1) ←→ (N) makina_stok
makina_siparisleri (1) ←→ (N) makina_stok (opsiyonel)
```

---

## 🔌 API Endpoints

### Makina Siparişleri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/makina-siparisleri` | Tüm siparişleri listeler |
| GET | `/api/makina-siparisleri/:id` | Sipariş detayını getirir |
| POST | `/api/makina-siparisleri` | Yeni sipariş oluşturur |
| PUT | `/api/makina-siparisleri/:id` | Siparişi günceller |
| DELETE | `/api/makina-siparisleri/:id` | Siparişi siler |
| PATCH | `/api/makina-siparisleri/:id/durum` | Sipariş durumunu değiştirir |

### Makina Stok

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/makina-stok` | Tüm stokları listeler |
| GET | `/api/makina-stok/:id` | Stok detayını getirir |
| POST | `/api/makina-stok` | Yeni stok girişi oluşturur |
| PUT | `/api/makina-stok/:id` | Stok günceller |
| DELETE | `/api/makina-stok/:id` | Stok siler |
| POST | `/api/makina-stok/stoktan-dus` | Stoktan düşme işlemi (satış için) |

---

## 🎨 Frontend Yapısı

### Sayfa Yapısı

#### Makinalar Ana Sayfası (`/makinalar`)

**Mevcut Butonlar:**
- [Yeni Makina Ekle] butonu

**Yeni Eklenecek Butonlar:**
1. **[📋 Makina Siparişleri]** butonu
   - Tıklandığında: Modal açılır
   - Modal içeriği: Siparişler listesi

2. **[📦 Makina Stokları]** butonu
   - Tıklandığında: Modal açılır
   - Modal içeriği: Stok listesi

### Modal Yapıları

#### Makina Siparişleri Modalı

**Üst Kısım:**
- Başlık: "Makina Siparişleri"
- [Yeni Sipariş Oluştur] butonu

**İçerik:**
- Siparişler tablosu
  - Sipariş No
  - Makina Adı
  - Müşteri
  - Adet
  - Durum (badge olarak renkli)
  - Sipariş Tarihi
  - İşlemler (Düzenle, Sil, Durum Değiştir)

**Yeni Sipariş Formu (Ayrı Modal):**
- Makina Seçimi (dropdown)
- Müşteri Adı (input)
- Müşteri Telefon (input, opsiyonel)
- Müşteri E-posta (input, opsiyonel)
- Adet (number input, varsayılan: 1)
- Durum (dropdown)
- Teslim Tarihi (date picker, opsiyonel)
- Notlar (textarea, opsiyonel)
- [Kaydet] [İptal] butonları

#### Makina Stokları Modalı

**Üst Kısım:**
- Başlık: "Makina Stokları"
- [Stok Girişi Ekle] butonu

**İçerik:**
- Stok tablosu
  - Makina Adı
  - Stok Adedi
  - Depo (opsiyonel)
  - Giriş Kaynağı
  - Giriş Tarihi
  - İşlemler (Düzenle, Sil)

**Stok Girişi Formu (Ayrı Modal):**
- Makina Seçimi (dropdown)
- Adet (number input)
- Depo (dropdown, opsiyonel)
- Giriş Kaynağı (dropdown: Satın Alma, Üretim, Montaj)
- Giriş Tarihi (date picker, varsayılan: bugün)
- Seri Numaraları (textarea, opsionel - her satırda bir seri no)
- İlgili Sipariş (dropdown, opsionel - eğer üretimden geldiyse)
- Notlar (textarea, opsiyonel)
- [Kaydet] [İptal] butonları

### Renk Kodları (Durumlar için)

| Durum | Renk | Hex |
|-------|------|-----|
| Beklemede | Gri | #9E9E9E |
| Gövde Montaj | Mavi | #2196F3 |
| Boyada | Turuncu | #FF9800 |
| Son montajda | Mor | #9C27B0 |
| Üretimde | Sarı | #FFC107 |
| Tamamlandı | Yeşil | #4CAF50 |
| İptal | Kırmızı | #F44336 |

---

## ⚙️ İş Mantığı (Business Logic)

### Sipariş Oluşturma
1. Kullanıcı yeni sipariş formunu doldurur
2. Backend validasyon yapar:
   - Makina ID mevcut mu?
   - Müşteri adı boş mu?
   - Adet > 0 mı?
3. Sipariş numarası otomatik üretilir (örn: SIP-2026-0001)
4. Sipariş varsayılan durum: "Beklemede"
5. Veritabanına kaydedilir

### Sipariş Durum Değiştirme
1. Kullanıcı siparişin durumunu değiştirir
2. Backend validasyon: Geçerli durum mu?
3. Eğer durum "Tamamlandı" ise:
   - Otomatik olarak makina stoğuna giriş yapılır
   - Stoğa girişte:
     - Makina ID = Siparişin makina ID'si
     - Adet = Sipariş adedi
     - Giriş Kaynağı = "Üretim"
     - Giriş Tarihi = Bugün
     - Sipariş ID = İlgili sipariş ID
4. Veritabanı güncellenir

### Stok Girişi
1. Kullanıcı stok girişi formunu doldurur
2. Backend validasyon:
   - Makina ID mevcut mu?
   - Adet > 0 mı?
   - Eğer sipariş ID varsa, sipariş mevcut mu?
3. Veritabanına kaydedilir
4. Başarı mesajı gösterilir

### Satış ile Stoktan Çıkış
**Not**: Mevcut makina satış özelliği zaten çalışıyor. Yeni özellik mevcut parça stok düşme işlevini BOZMAMALIDIR.

**İstenen İşlevsellik:**
- Satış yapıldığında makina stoğundan da düşülmesi
- Bu işlevsellik mevcut satış özelliğine entegre edilecek
- Parça stoklarından düşme işlevi aynen korunacak

---

## 🚀 Geliştirme Planı

### Phase 1: Backend (Veritabanı ve API)
- [ ] `makina_siparisleri` tablosunu oluştur
- [ ] `makina_stok` tablosunu oluştur
- [ ] Sequelize modellerini oluştur (`MakinaSiparis.js`, `MakinaStok.js`)
- [ ] Controller'ları oluştur
- [ ] Route'ları oluştur ve index.js'e kaydet
- [ ] Validasyonları ekle

### Phase 2: Frontend (UI ve API Entegrasyonu)
- [ ] API servislerini oluştur (`makinaSiparisAPI.js`, `makinaStokAPI.js`)
- [ ] Modal bileşenlerini oluştur
- [ ] Makinalar ana sayfasına butonları ekle
- [ ] Form bileşenlerini oluştur
- [ ] Listeleme bileşenlerini oluştur
- [ ] API entegrasyonunu tamamla

### Phase 3: Entegrasyon ve Test
- [ ] Sipariş → Stok entegrasyonunu test et
- [ ] Satış → Stok düşme entegrasyonunu test et
- [ ] Parça stok düşme işlevinin bozulmadığını doğrula
- [ ] UI testleri yap

---

## 📝 Kabul Kriterleri (Acceptance Criteria)

### Fonksiyonel Gereksinimler
- [x] Kullanıcı yeni makina siparişi oluşturabilmeli
- [x] Kullanıcı mevcut siparişleri görebilmeli
- [x] Kullanıcı sipariş durumunu değiştirebilmeli
- [x] Sipariş "Tamamlandı" olduğunda otomatik stoka girebilmeli
- [x] Kullanıcı manuel stok girişi yapabilmeli
- [x] Kullanıcı stok listesini görebilmeli
- [x] Satış yapıldığında stoktan düşülebilmesi mevcut işlevi bozmadan çalışmalı

### UI Gereksinimleri
- [x] Makinalar ana sayfasında 2 yeni buton olmalı
- [x] Butonlara tıklandığında modal açılmalı
- [x] Modallarda listeleme ve ekleme işlemleri yapılabilmeli
- [x] Durumlar renkli badge olarak gösterilmeli
- [x] Form validasyonları çalışmalı

### Teknik Gereksinimler
- [x] Veritabanı ilişkileri doğru kurulmalı
- [x] API endpoint'leri düzgün çalışmalı
- [x] Hata yönetimi (error handling) olmalı
- [x] Mevcut parça stok düşme özelliği bozulmamalı

---

## 🔄 İleri Versiyon İçin Notlar

### MVP Dışında Bırakılan Özellikler
- Raporlama (sipariş raporları, stok raporları)
- Gelişmiş filtreleme ve sıralama
- Depo transfer yönetimi
- Sipariş geçmişi takibi
- Kullanıcı yetkilendirme ve rol yönetimi
- E-posta/SMS bildirimleri
- Excel dışa aktarma

### Gelecek Özellikler
- Dashboard grafikleri
- Otomatik stok uyarıları
- Sipariş tahminleme
- Müşteri portalı
- Mobil uygulama entegrasyonu

---

## 📎 Ekler

### Sipariş Numarası Formatı
```
SIP-[YYYY]-[Sequence]
Örnek: SIP-2026-0001
```

### Stok Seri Numarası Formatı (JSON)
```json
[
  "SN-2026-001",
  "SN-2026-002",
  "SN-2026-003"
]
```

---

## ✅ Onay Checklist

Bu PRD'nin onaylanması için:

- [ ] İş gereksinimleri net
- [ ] Veritabanı tasarımı tamamlandı
- [ ] API yapısı belirlendi
- [ ] UI tasarımı yapıldı
- [ ] MVP kapsamı netleşti
- [ ] Geliştirme planı hazır

---

**Doküman Sahibi**: Claude Code Session
**Son Güncelleme**: 2026-01-04
**Versiyon**: 1.0.0
