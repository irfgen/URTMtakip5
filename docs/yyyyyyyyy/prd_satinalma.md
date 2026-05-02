# ÜRTM Takip - Satınalma/Tedarik Modülü PRD

## Doküman Bilgileri
- **Proje**: ÜRTM Takip Sistemi
- **Modül**: Satınalma/Tedarik Yönetimi
- **Versiyon**: 1.0.0
- **Tarih**: 14.12.2025
- **Durum**: MVP Gereksinimleri

## 1. Proje Özeti

### 1.1 Mevcut Durum
- İş emri açılırken ham malzeme siparişi için sadece "Malzeme siparişi verilecek mi?" checkboxı mevcut
- Sipariş kanıtı olarak manuel evrak fotoğrafı yükleniyor
- Tedarik sürecini yönetecek sistem altyapısı eksik
- Stok sistemi mevcut ancak aktif kullanılmıyor
- Tedarikçi yönetimi sistemi bulunmuyor

### 1.2 Problem Alanları
1. **Süreç Yönetimi**: Tedarik taleplerinin takibi ve yönetimi manuel yapılıyor
2. **Onay Mekanizması**: Satınalma onayları için sistem desteği yok
3. **Entegrasyon Eksikliği**: İlgili modüllerle (Parçalar, Stok Kartları, Sevkiyat) entegrasyon bulunmuyor
4. **Geri Bildirim**: Malzeme teslimatı takibi ve kapanış süreci otomatik değil
5. **Raporlama**: Tedarik süreçlerine dair analitik veriler bulunmuyor

### 1.3 Hedef
Üretim için gerekli ham maddelerin ve imal edilmeyen ürünlerin sipariş süreçini yönetecek, taleplerden teslimata kadar tüm adımları takip eden, ilgili modüllerle entegre çalışan bir tedarik yönetim modülü geliştirmek.

## 2. Kapsam

### 2.1 MVP Kapsamı (İlk Versiyon)
- ✅ Tedarik talebi oluşturma ve yönetimi
- ✅ İş emrinden ham malz siparişi talebi
- ✅ Parçalar modülünden talep oluşturma
- ✅ Stok kartlarından ham madde talep oluşturma
- ✅ Talep listesi ve yönetim ekranı
- ✅ Onay süreci (geçici olarak tüm kullanıcılar onaylayabilir)
- ✅ Sevkiyat modülü entegrasyonu
- ✅ İrsaliye yönetimi ve kapanış

### 2.2 Gelecek Versiyonlar (Out of Scope)
- Kullanıcı yetkilendirme ve rol bazlı onay sistemi
- Muhasebe/finans sistemi entegrasyonu
- Depo yönetimi sistemi entegrasyonu
- Üretim planı entegrasyonu
- Tedarikçi değerlendirme ve yönetimi
- Otomatik stok seviye takibi ve sipariş önerileri
- Fatura yönetimi

## 3. Kullanıcı Hikayeleri ve Akışlar

### 3.1 İş Emrinden Talep Oluşturma
**User Story**: Üretim personeli, yeni iş emri oluştururken ham malzeme siparişi talep edebilmeli

**Akış**:
1. Kullanıcı "Yeni İş Emri Ekle" formunu açar
2. "Malzeme siparişi verilecek mi?" checkbox'ını işaretler
3. Malzeme bilgileri ve talep detaylarını girer
4. Formu kaydettiğinde otomatik olarak tedarik talebi oluşturulur
5. Talep satınalma modülüne düşer

**Mevcut Entegrasyon**: `IsEmriEkleForm.jsx:51` - `malzemesi_siparis_edilecekmi` field mevcut

### 3.2 Parça Detayından Talep Oluşturma
**User Story**: Üretim müdürü, parça detay sayfasından o parçayı sipariş edebilmeli

**Akış**:
1. Kullanıcı ParcaDetay sayfasına girer
2. "Talep Oluştur" butonuna tıklar
3. Otomatik olarak parça kodu dolu talep formuna yönlendirilir
4. Talep detaylarını girerek kaydeder
5. Talep satınalma modülüne eklenir

**Entegrasyon Noktası**: `ParcaDetay.jsx` - yeni buton eklenecek

### 3.3 Stok Kartından Talep Oluşturma
**User Story**: Stok sorumlusu, stok kartlarından ham madde talep edebilmeli

**Akış**:
1. Kullanıcı StokKartlari sayfasına girer
2. İlgili stok kartı için "Talep Oluştur" seçeneğini kullanır
3. Talep formuna stok kartı bilgileri ön doldurulur
4. Talep detaylarını girerek kaydeder
5. Talep satınalma modülüne eklenir

**Entegrasyon Noktası**: `StokKartlari.jsx` - yeni buton eklenecek

### 3.4 Satınalma Onay Süreci
**User Story**: Satınalma müdürü, gelen tedarik taleplerini inceleyip onaylayabilmeli

**Akış**:
1. Satınalma müdürü Satınalma modülüne girer
2. Bekleyen talepler listesini görür
3. Talep detaylarını inceler
4. Onay/red kararı verir
5. Onaylanan talepler sevkiyat modülüne düşer

**Geçici Yetkilendirme**: MVP'de tüm kullanıcılar onaylayabilir

### 3.5 Sevkiyat ve Teslimat Süreci
**User Story**: Sevkiyat personeli, onaylanan siparişlerin teslimatını yönetebilmeli

**Akış**:
1. Onaylanan talepler Sevkiyat modülüne düşer
2. Sevkiyat personeli gelen siparişleri listeler
3. Malzeme geldiğinde kontrol ve teslim almayı yapar
4. İrsaliye bilgilerini sisteme girer
5. Teslimat tamamlandığında satınalma modülünde talep kapanır

**Entegrasyon**: Mevcut `SevkiyatListesi.jsx` ve `SevkiyatForm.jsx` genişletilecek

## 4. Fonksiyonel Gereksinimler

### 4.1 Tedarik Talebi Yönetimi
- **FR-01**: Tedarik talebi oluşturma formu
- **FR-02**: Talep kodu otomatik üretimi (TAL-YYYYMMDD-XXX formatı)
- **FR-03**: Talep durumu yönetimi (Beklemede, Onaylandı, Reddedildi, Siparişte, Teslim Edildi)
- **FR-04**: Talep listesi ve filtreleme
- **FR-05**: Talep detaylarını düzenleme

### 4.2 Entegrasyon Gereksinimleri
- **FR-06**: İş emrinden talep oluşturma entegrasyonu
- **FR-07**: Parçalar modülü entegrasyonu
- **FR-08**: Stok kartları modülü entegrasyonu
- **FR-09**: Sevkiyat modülü entegrasyonu
- **FR-10**: İrsaliye yönetimi

### 4.3 Veri Yönetimi
- **FR-11**: Talep geçmişi takibi
- **FR-12**: Belgeleri (sipariş evrakı, irsaliye) yükleme
- **FR-13**: Raporlama ve listeleme
- **FR-14**: Arşivleme

## 5. Veri Modeli

### 5.1 Yeni Tablolar

#### tedarik_talepleri
```sql
CREATE TABLE tedarik_talepleri (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  talep_kodu VARCHAR(20) UNIQUE NOT NULL,
  kaynak_tipi ENUM('is_emri', 'parca', 'stok_karti', 'manuel'),
  kaynak_id INTEGER,
  parca_kodu VARCHAR(50),
  stok_karti_id INTEGER,
  aciklama TEXT,
  talep_tarihi DATETIME NOT NULL,
  onay_tarihi DATETIME,
  tedarik_tarihi DATETIME,
  durum ENUM('beklemede', 'onaylandi', 'reddedildi', 'sipariste', 'teslim_edildi') DEFAULT 'beklemede',
  talep_eden_kullanici VARCHAR(100),
  onaylayan_kullanici VARCHAR(100),
  miktar DECIMAL(10,2),
  birim VARCHAR(20),
  birim_fiyat DECIMAL(10,2),
  toplam_tutar DECIMAL(10,2),
  siparis_dokumani VARCHAR(255),
  irsaliye_no VARCHAR(100),
  irsaliye_tarihi DATETIME,
  teslim_tarihi DATETIME,
  NOTLAR TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stok_karti_id) REFERENCES stok_kartlari(id)
);
```

#### tedarik_detaylari
```sql
CREATE TABLE tedarik_detaylari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  talep_id INTEGER NOT NULL,
  malzeme_adi VARCHAR(200) NOT NULL,
  malzeme_kodu VARCHAR(100),
  miktar DECIMAL(10,2) NOT NULL,
  birim VARCHAR(20) NOT NULL,
  birim_fiyat DECIMAL(10,2),
  aciklama TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (talep_id) REFERENCES tedarik_talepleri(id) ON DELETE CASCADE
);
```

### 5.2 Mevcut Tablolara Eklenecek Alanlar

#### is_emirleri (zaten mevcut)
- `malzemesi_siparis_edilecekmi` ✅
- `malzeme_siparis_tarihi` ✅
- `siparis_dokumani` ✅

## 6. API Endpoints

### 6.1 Tedarik Talepleri
- `GET /api/tedarik-talepleri` - Talep listesi
- `POST /api/tedarik-talepleri` - Yeni talep oluşturma
- `GET /api/tedarik-talepleri/:id` - Talep detayı
- `PUT /api/tedarik-talepleri/:id` - Talep güncelleme
- `DELETE /api/tedarik-talepleri/:id` - Talep silme
- `POST /api/tedarik-talepleri/:id/onayla` - Talep onaylama
- `POST /api/tedarik-talepleri/:id/reddet` - Talep reddetme

### 6.2 İrsaliye Yönetimi
- `POST /api/tedarik-talepleri/:id/irsaliye-ekle` - İrsaliye ekleme
- `PUT /api/tedarik-talepleri/:id/teslimati-tamamla` - Teslimat kapatma

### 6.3 Entegrasyon Endpoints
- `POST /api/is-emirleri/:id/tedarik-talebi-olustur` - İş emrinden talep
- `POST /api/parcalar/:kodu/tedarik-talebi-olustur` - Parçadan talep
- `POST /api/stok-kartlari/:id/tedarik-talebi-olustur` - Stok kartından talep

## 7. UI/UX Tasarımı

### 7.1 Ana Sayfa - Satınalma/Tedarik Modülü
```
ÜRTM Takip > Satınalma/Tedarik

┌─────────────────────────────────────────────────────────┐
│ Satınalma/Tedarik Yönetimi                             │
├─────────────────────────────────────────────────────────┤
│ [Yeni Talep] [Dışardan Talep] [Raporlar]                │
├─────────────────────────────────────────────────────────┤
│ Filtreler:                                             │
│ Durum: [Tümü▼] | Kaynak: [Tümü▼] | Tarih: [Tarih Aralığı] │
│ Arama: [___________________________________] [Ara]     │
├─────────────────────────────────────────────────────────┤
│ Talepler Listesi (DataGrid):                            │
│ │ Kod │ Kaynak │ Parça │ Miktar │ Durum │ Tarih │ İşlem│
│ │ TAL-... │ İş Emri │ P-001 │ 100 kg │ Beklemede │ ... │⚙│
│ │ TAL-... │ Parça   │ P-002 │ 50 ad  │ Onaylandı │ ... │⚙│
└─────────────────────────────────────────────────────────┘
```

### 7.2 Talep Oluşturma Formu
```
Tedarik Talebi Oluştur

┌─────────────────────────────────────────────┐
│ Talep Bilgileri                             │
├─────────────────────────────────────────────┤
│ Talep Kodu: [TAL-20251214-001] (otomatik)   │
│ Kaynak Tipi: [İş Emri▼] [Parça▼] [Stok▼]    │
│ Parça Kodu: [______________] [Ara] 🔍      │
│                                              │
│ Malzeme Bilgileri:                          │
│ Malzeme Adı: [_________________________]     │
│ Miktar: [____] [Birim▼]                     │
│ Birim Fiyat: [____] ₺                       │
│ Talep Tarihi: [14.12.2025]                  │
│                                              │
│ Açıklama:                                   │
│ [_________________________________]         │
│ [_________________________________]         │
│                                              │
│ Belgeler:                                   │
│ [Sipariş Evrağı Yükle] [+ Dosya Ekle]       │
│                                              │
│                [İptal] [Kaydet]             │
└─────────────────────────────────────────────┘
```

### 7.3 Sevkiyat Entegrasyonu
```
Sevkiyat Listesi (Genişletilmiş)

┌─────────────────────────────────────────────┐
│ Gelen Tedarik Siparişleri                    │
├─────────────────────────────────────────────┤
│ │ Talep Kodu │ Malzeme │ Miktar │ Tedarikçi │ Teslim Al│
│ │ TAL-... │ Ham Çelik │ 100 kg │ Firma A │ [Al]   │
│ │ TAL-... │ Alüminyum │ 50 kg  │ Firma B │ [Al]   │
└─────────────────────────────────────────────┘

Teslim Alma Formu:
- Talep bilgileri gösterilir
- İrsaliye numarası girilir
- İrsaliye dosyası yüklenir
- Miktar kontrol edilir
- Teslim al butonu ile talep kapatılır
```

## 8. Teknik Gereksinimler

### 8.1 Frontend
- **React**: Mevcut React 18 yapısı kullanılacak
- **Material-UI**: Mevcut MUI v5 tema yapısı koranacak
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **Formlar**: Formik + Yup validation
- **Tablolar**: MUI DataGrid
- **File Upload**: Mevcut multer yapısı

### 8.2 Backend
- **Node.js**: Mevcut Express.js yapısı
- **Database**: SQLite + Sequelize ORM
- **Validation**: Joi
- **File Upload**: Multer
- **Logging**: Winston
- **Real-time**: Socket.IO (isteğe bağlı)

### 8.3 Dosya Yapısı
```
frontend/
├── src/
│   ├── pages/
│   │   └── Satinalma.jsx                    # Ana sayfa
│   ├── components/
│   │   ├── satinalma/
│   │   │   ├── TedarikTalepForm.jsx        # Talep formu
│   │   │   ├── TedarikTalepListesi.jsx     # Talep listesi
│   │   │   ├── TedarikTalepDetay.jsx       # Talep detayı
│   │   │   └── OnayModal.jsx               # Onay modalı
│   │   └── mobile/
│   │       └── satinalma/
│   ├── services/
│   │   └── tedarikService.js               # API service
│   └── store/slices/
│       └── tedarikSlice.js                 # Redux slice

backend/
├── src/
│   ├── models/
│   │   ├── TedarikTalebi.js                # Model
│   │   └── TedarikDetay.js                 # Detay modeli
│   ├── controllers/
│   │   └── tedarikController.js            # Controller
│   ├── routes/
│   │   └── tedarik.js                      # Routes
│   └── services/
│       └── tedarikService.js               # Business logic
```

## 9. Test Stratejisi

### 9.1 Unit Tests
- Model validatorları
- Service fonksiyonları
- API endpoint'leri
- Form validasyonları

### 9.2 Integration Tests
- İş emrinden talep oluşturma akışı
- Parçadan talep oluşturma akışı
- Onay süreci
- Sevkiyat entegrasyonu

### 9.3 E2E Tests
- Complete talep lifecycle
- File upload süreçleri
- User interactions

## 10. Deployment ve Versiyonlama

### 10.1 MVP Versiyon (v1.0.0)
- Temel talep yönetimi
- Entegrasyonlar
- Sevkiyat entegrasyonu
- Basit onay süreci

### 10.2 V1.1.0
- Kullanıcı yetkilendirme
- Rol bazlı onaylar
- İleri filtreleme

### 10.3 V1.2.0
- Raporlama ve analitikler
- Excel export
- Mail bildirimleri

## 11. Başarı Metrikleri

### 11.1 Teknik Metrikler
- Talep oluşturma süresi: < 2 saniye
- API response time: < 500ms
- Uptime: > 99%
- Zero crash rate

### 11.2 İş Metrikleri
- Manuel işlem azalması: %80
- Talep takip accuracy: %100
- Teslimat süresi takibi: %100
- User adoption rate: > 90%

## 12. Riskler ve Mitigasyon

### 12.1 Teknik Riskler
- **Risk**: Mevcut veri yapısına uyum
- **Mitigasyon**: Kapsamlı migration planı ve test

- **Risk**: Performans sorunları
- **Mitigasyon**: Optimizasyon ve caching stratejileri

### 12.2 İş Riskleri
- **Risk**: Kullanıcı adaptasyonu
- **Mitigasyon**: Training ve documentation

- **Risk**: Mevcut süreçlere uyum
- **Mitigasyon**: Kullanıcı involvement ve feedback loop

## 13. Sonraki Adımlar

1. **Sprint 1 (1 hafta)**:
   - Database model oluşturma
   - Backend API endpoint'leri
   - Temel frontend komponentleri

2. **Sprint 2 (1 hafta)**:
   - İş emri entegrasyonu
   - Talep yönetim ekranları
   - Onay süreci

3. **Sprint 3 (1 hafta)**:
   - Parça ve stok entegrasyonları
   - Sevkiyat entegrasyonu
   - İrsaliye yönetimi

4. **Sprint 4 (1 hafta)**:
   - Testler ve bug fix'ler
   - Documentation
   - Deployment

---

**Doküman Versiyonu**: 1.0.0
**Son Güncelleme**: 14.12.2025
**Sorumlu**: ÜRTM Takip Geliştirme Ekibi