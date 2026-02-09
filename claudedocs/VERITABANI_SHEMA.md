# ÜRTM Takip Sistemi - Veritabanı Şema Dokümantasyonu

## Genel Bilgiler

- **Veritabanı**: SQLite 3
- **ORM**: Sequelize 6.37+
- **Konum**: `/backend/database.sqlite`
- **Migration Sistemi**: Umzug 3.8+
- **Charset**: UTF-8
- **Timestamps**: Otomatik (createdAt, updatedAt)

## Model İlişkileri

```
┌─────────────────────────────────────────────────────────────┐
│                    MERKEZİ TABLOLAR                          │
├─────────────────────────────────────────────────────────────┤
│  IsEmri (İş Emirleri)        │  Tezgah (Tezgahlar)         │
│  Parca (Parçalar)            │  UretimPlani (Üretim Planları)│
│  Bom (BOM'lar)               │  StokKarti (Stok Kartları)   │
└─────────────────────────────────────────────────────────────┘
         ↓                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    DETAY TABLOLAR                           │
├─────────────────────────────────────────────────────────────┤
│  IsEmriOzet (Özetler)        │  IslemKaydi (İşlem Kayıtları)│
│  ParcaKayitlari (Kayıtlar)   │  BomParca (BOM Parçaları)    │
│  StokHareket (Hareketler)    │  SevkiyatKalem (Kalemler)    │
│  IrsaliyeKalem (Kalemler)    │  FaturaKalem (Kalemler)      │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                    DESTEK TABLOLAR                          │
├─────────────────────────────────────────────────────────────┤
│  Personel (Personeller)      │  Vardiya (Vardiyalar)       │
│  Firma (Firmalar)           │  Kategori (Kategoriler)     │
│  ArizaBakim (Arıza/Bakım)   │  Notlar (Notlar)            │
└─────────────────────────────────────────────────────────────┘
```

## Tablo Tanımları

### 1. is_emirleri (İş Emirleri)

**Model**: `IsEmri.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| is_emri_id | INTEGER (PK, AI) | Benzersiz iş emri ID |
| is_emri_no | STRING (unique) | İş emri numarası |
| is_adi | STRING | İş adı |
| plan_liste_no | STRING | Plan liste numarası |
| adet | INTEGER | Miktar |
| malzeme | STRING | Malzeme türü |
| teslim_tarihi | DATE | Teslim tarihi |
| oncelik | ENUM | Öncelik (dusuk, normal, yuksek, acil) |
| durum | STRING | Durum (varsayılan: beklemede) |
| tezgah_id | INTEGER (FK) | Tezgah ID |
| uretim_plani_id | INTEGER (FK) | Üretim planı ID |
| parca_kodu | STRING (FK) | Parça kodu |
| aciklama | TEXT | Açıklama |
| hareketler | JSON | Hareket geçmişi |
| setup_sayisi | INTEGER | Setup sayısı |
| cnc_suresi | FLOAT | CNC süresi |
| malzemesi_siparis_edilecekmi | BOOLEAN | Malzeme siparişi |
| malzeme_siparis_tarihi | DATE | Sipariş tarihi |
| siparis_dokumani_dosya_yolu | STRING | Sipariş dokümanı |
| malzemenin_geldigi_tarih | DATE | Malzeme geliş tarihi |
| order | INTEGER | Sıralama |
| is_zaman_uzunlugu | FLOAT | İş zaman uzunluğu (saat) |
| tahmini_isleme_suresi | INTEGER | Tahmini işleme süresi (vardiya) |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- belongsTo: Tezgah
- belongsTo: UretimPlani
- belongsTo: Parca
- hasMany: IslemKaydi
- hasMany: FasonIsEmri
- hasOne: IsEmriOzet
- hasMany: TezgahZamanPlani

### 2. tezgahlar (Tezgahlar)

**Model**: `Tezgah.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| tezgah_id | INTEGER (PK, AI) | Benzersiz tezgah ID |
| tezgah_adi | STRING | Tezgah adı |
| tezgah_kodu | STRING (unique) | Tezgah kodu |
| kapasite | INTEGER | Kapasite |
| durum | STRING | Durum |
| aktif | BOOLEAN | Aktif mi (varsayılan: true) |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: IsEmri
- hasMany: ArizaBakim
- hasMany: TezgahDurumLog
- hasMany: TezgahZamanPlani

### 3. parcalar (Parçalar)

**Model**: `Parca.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| parca_kodu | STRING (PK) | Parça kodu |
| parca_adi | STRING | Parça adı |
| birim | STRING | Birim |
| stok_miktari | INTEGER | Stok miktarı (varsayılan: 0) |
| min_stok | INTEGER | Minimum stok (varsayılan: 0) |
| aciklama | TEXT | Açıklama |
| teknik_resim | STRING | Teknik resim dosya yolu |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: IsEmri
- hasMany: BomParca
- hasMany: ParcaKayitlari

### 4. bomlar (BOM'lar)

**Model**: `Bom.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| bom_id | INTEGER (PK, AI) | Benzersiz BOM ID |
| bom_adi | STRING | BOM adı |
| makina_id | INTEGER | Makina ID |
| versiyon | STRING | Versiyon |
| toplam_maliyet | FLOAT | Toplam maliyet (varsayılan: 0) |
| aktif | BOOLEAN | Aktif mi (varsayılan: true) |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: BomParca
- belongsTo: MakinaSinifi

### 5. stok_kartlari (Stok Kartları)

**Model**: `StokKarti.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| stok_karti_id | INTEGER (PK, AI) | Benzersiz stok kartı ID |
| stok_kodu | STRING (unique) | Stok kodu |
| stok_adi | STRING | Stok adı |
| birim | STRING | Birim |
| mevcut_stok | INTEGER | Mevcut stok (varsayılan: 0) |
| min_stok | INTEGER | Minimum stok (varsayılan: 0) |
| maks_stok | INTEGER | Maksimum stok |
| kritik_seviye | INTEGER | Kritik seviye |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: StokHareket

### 6. uretim_plani (Üretim Planları)

**Model**: `UretimPlani.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| uretim_plani_id | INTEGER (PK, AI) | Benzersiz plan ID |
| plan_adi | STRING | Plan adı |
| plan_tipi | ENUM | Plan tipi (makine, ozel-liste, karma) |
| baslama_tarihi | DATE | Başlama tarihi |
| bitis_tarihi | DATE | Bitiş tarihi |
| durum | STRING | Durum (varsayılan: hazir) |
| excel_dosyasi | STRING | Excel dosya yolu |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: IsEmri

### 7. sevkiyat (Sevkiyat)

**Model**: `Sevkiyat.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| sevkiyat_id | INTEGER (PK, AI) | Benzersiz sevkiyat ID |
| musteri_adi | STRING | Müşteri adı |
| teslim_tarihi | DATE | Teslim tarihi |
| adres | TEXT | Adres |
| durum | STRING | Durum (varsayılan: hazirlaniyor) |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: SevkiyatKalem
- hasMany: SevkiyatResim

### 8. faturalar (Faturalar)

**Model**: `Fatura.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| fatura_id | INTEGER (PK, AI) | Benzersiz fatura ID |
| fatura_no | STRING (unique) | Fatura numarası |
| musteri_adi | STRING | Müşteri adı |
| tarih | DATE | Tarih |
| toplam_tutar | FLOAT | Toplam tutar (varsayılan: 0) |
| durum | STRING | Durum (varsayılan: taslak) |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: FaturaKalem
- belongsTo: Irsaliye (eslestirme_id)

### 9. irsaliyeler (İrsaliyeler)

**Model**: `Irsaliye.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| irsaliye_id | INTEGER (PK, AI) | Benzersiz irsaliye ID |
| irsaliye_no | STRING (unique) | İrsaliye numarası |
| musteri_adi | STRING | Müşteri adı |
| tarih | DATE | Tarih |
| durum | STRING | Durum (varsayılan: hazirlaniyor) |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: IrsaliyeKalem
- belongsTo: Fatura (eslestirme_id)

### 10. ariza_bakim (Arıza/Bakım)

**Model**: `ArizaBakim.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| ariza_bakim_id | INTEGER (PK, AI) | Benzersiz kayıt ID |
| tezgah_id | INTEGER (FK) | Tezgah ID |
| tip | ENUM | Tip (ariza, bakim) |
| baslik | STRING | Başlık |
| aciklama | TEXT | Açıklama |
| durum | STRING | Durum (varsayılan: acik) |
| baslama_tarihi | DATE | Başlama tarihi |
| bitis_tarihi | DATE | Bitiş tarihi |
| personel_id | INTEGER | Personel ID |
| maliyet | FLOAT | Maliyet |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- belongsTo: Tezgah
- belongsTo: Personel

### 11. personel (Personeller)

**Model**: `Personel.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| personel_id | INTEGER (PK, AI) | Benzersiz personel ID |
| adi | STRING | Adı |
| soyadi | STRING | Soyadı |
| tc_no | STRING | TC kimlik no |
| unvan | STRING | Unvan |
| telefon | STRING | Telefon |
| email | STRING | E-posta |
| aktif | BOOLEAN | Aktif mi |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: VardiyaAtama
- hasMany: ArizaBakim

### 12. vardiyalar (Vardiyalar)

**Model**: `Vardiya.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| vardiya_id | INTEGER (PK, AI) | Benzersiz vardiya ID |
| vardiya_adi | STRING | Vardiya adı |
| baslama_saati | TIME | Başlama saati |
| bitis_saati | TIME | Bitiş saati |
| aciklama | TEXT | Açıklama |
| aktif | BOOLEAN | Aktif mi |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: VardiyaAtama

### 13. vardiya_atamalari (Vardiya Atamaları)

**Model**: `VardiyaAtama.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| atama_id | INTEGER (PK, AI) | Benzersiz atama ID |
| personel_id | INTEGER (FK) | Personel ID |
| vardiya_id | INTEGER (FK) | Vardiya ID |
| tezgah_id | INTEGER (FK) | Tezgah ID |
| tarih | DATE | Tarih |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- belongsTo: Personel
- belongsTo: Vardiya
- belongsTo: Tezgah

### 14. notlar (Notlar)

**Model**: `Notlar.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| not_id | INTEGER (PK, AI) | Benzersiz not ID |
| baslik | STRING | Başlık |
| icerik | TEXT | İçerik |
| kategori_id | INTEGER (FK) | Kategori ID |
| oncelik | ENUM | Öncelik (dusuk, normal, yuksek) |
| etiketler | JSON | Etiketler |
| tamamlandi | BOOLEAN | Tamamlandı mı |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- belongsTo: Kategori

### 15. not_kategorileri (Not Kategorileri)

**Model**: `NotKategorileri.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| kategori_id | INTEGER (PK, AI) | Benzersiz kategori ID |
| kategori_adi | STRING | Kategori adı |
| aciklama | TEXT | Açıklama |
| renk | STRING | Renk kodu |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: Notlar

### 16. firmalar (Firmalar)

**Model**: `Firma.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| firma_id | INTEGER (PK, AI) | Benzersiz firma ID |
| firma_adi | STRING | Firma adı |
| vergi_no | STRING | Vergi numarası |
| telefon | STRING | Telefon |
| email | STRING | E-posta |
| adres | TEXT | Adres |
| sehir | STRING | Şehir |
| ulke | STRING | Ülke |
| aktif | BOOLEAN | Aktif mi |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: TedarikTalebi
- hasMany: Fatura
- hasMany: Irsaliye

### 17. tedarik_talepleri (Tedarik Talepleri)

**Model**: `TedarikTalebi.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| talep_id | INTEGER (PK, AI) | Benzersiz talep ID |
| firma_id | INTEGER (FK) | Firma ID |
| talep_no | STRING (unique) | Talep numarası |
| talep_tarihi | DATE | Talep tarihi |
| durum | STRING | Durum (varsayılan: hazirlaniyor) |
| onaylandi | BOOLEAN | Onaylandı mı |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- belongsTo: Firma
- hasMany: TedarikDetay

### 18. tedarik_detaylari (Tedarik Detayları)

**Model**: `TedarikDetay.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| detay_id | INTEGER (PK, AI) | Benzersiz detay ID |
| talep_id | INTEGER (FK) | Talep ID |
| parca_kodu | STRING | Parça kodu |
| miktar | INTEGER | Miktar |
| birim | STRING | Birim |
| birim_fiyat | FLOAT | Birim fiyatı |
| toplam_fiyat | FLOAT | Toplam fiyat |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- belongsTo: TedarikTalebi

### 19. satis (Satışlar)

**Model**: `Satis.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| satis_id | INTEGER (PK, AI) | Benzersiz satış ID |
| musteri_adi | STRING | Müşteri adı |
| satis_tarihi | DATE | Satış tarihi |
| toplam_tutar | FLOAT | Toplam tutar |
| durum | STRING | Durum |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: Irsaliye
- hasMany: Fatura

### 20. stok_hareketleri (Stok Hareketleri)

**Model**: `StokHareket.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| hareket_id | INTEGER (PK, AI) | Benzersiz hareket ID |
| stok_karti_id | INTEGER (FK) | Stok kartı ID |
| hareket_tipi | ENUM | Hareket tipi (giris, cikis, transfer) |
| miktar | INTEGER | Miktar |
| birim_fiyat | FLOAT | Birim fiyatı |
| toplam_tutar | FLOAT | Toplam tutar |
| referans_turu | STRING | Referans türü |
| referans_id | INTEGER | Referans ID |
| aciklama | TEXT | Açıklama |
| tarih | DATE | Tarih |
| olusturma_tarihi | DATE | Oluşturulma tarihi |

**İlişkiler**:
- belongsTo: StokKarti

### 21. makinalar (Makineler)

**Model**: `Makina.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| makina_id | INTEGER (PK, AI) | Benzersiz makina ID |
| makina_adi | STRING | Makina adı |
| makina_kodu | STRING (unique) | Makina kodu |
| sinif_id | INTEGER (FK) | Sınıf ID |
| marka | STRING | Marka |
| model | STRING | Model |
| kapasite | INTEGER | Kapasite |
| durum | STRING | Durum |
| aktif | BOOLEAN | Aktif mi |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- belongsTo: MakinaSinifi
- hasMany: Bom

### 22. makina_siniflari (Makina Sınıfları)

**Model**: `MakinaSinifi.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| sinif_id | INTEGER (PK, AI) | Benzersiz sınıf ID |
| sinif_adi | STRING | Sınıf adı |
| sinif_kodu | STRING (unique) | Sınıf kodu |
| aciklama | TEXT | Açıklama |
| aktif | BOOLEAN | Aktif mi |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- hasMany: Makina

### 23. makina_siparisler (Makina Siparişleri)

**Model**: `MakinaSiparis.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| siparis_id | INTEGER (PK, AI) | Benzersiz sipariş ID |
| makina_id | INTEGER (FK) | Makina ID |
| siparis_no | STRING (unique) | Sipariş numarası |
| siparis_tarihi | DATE | Sipariş tarihi |
| miktar | INTEGER | Miktar |
| durum | STRING | Durum |
| teslim_tarihi | DATE | Teslim tarihi |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- belongsTo: Makina

### 24. makina_stoklar (Makina Stokları)

**Model**: `MakinaStok.js`

| Alan | Tip | Açıklama |
|------|-----|----------|
| stok_id | INTEGER (PK, AI) | Benzersiz stok ID |
| makina_id | INTEGER (FK) | Makina ID |
| mevcut_stok | INTEGER | Mevcut stok |
| min_stok | INTEGER | Minimum stok |
| maks_stok | INTEGER | Maksimum stok |
| kritik_seviye | INTEGER | Kritik seviye |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncellenme tarihi |

**İlişkiler**:
- belongsTo: Makina

## Migration Geçmişi

### 20240912000001-add-tahmini-isleme-suresi.js
İş emirleri tablosuna `tahmini_isleme_suresi` alanı ekler.
- Alan tipi: INTEGER
- Varsayılan değer: 1
- Min: 1, Max: 20
- Açıklama: İş emrinin tahmini işleme süresi (vardiya cinsinden)

### 20250924_add_cost_fields_to_boms.js
BOM tablosuna maliyet alanları ekler.
- `toplam_maliyet`: FLOAT (varsayılan: 0)
- `maliyet_hesaplandi`: BOOLEAN (varsayılan: false)

### 20250701000001-create-notlar-tables.js
Notlar ve kategoriler tablolarını oluşturur.
- `notlar`: Not kayıtları
- `not_kategorileri`: Not kategorileri
- İlişkiler: notlar.kategori_id → not_kategorileri.kategori_id

## İlişki Diyagramları

### İş Emri İlişkileri

```
IsEmri
  ├─ belongsTo → Tezgah
  ├─ belongsTo → UretimPlani
  ├─ belongsTo → Parca
  ├─ hasMany → IslemKaydi
  ├─ hasMany → FasonIsEmri
  ├─ hasOne → IsEmriOzet
  └─ hasMany → TezgahZamanPlani
```

### BOM İlişkileri

```
Bom
  ├─ belongsTo → MakinaSinifi
  └─ hasMany → BomParca
      └─ belongsTo → Parca
```

### Stok İlişkileri

```
StokKarti
  └─ hasMany → StokHareket
      ├─ belongsTo → StokKarti
      └─ belongsTo → IsEmri (referans)
```

### Sevkiyat İlişkileri

```
Sevkiyat
  └─ hasMany → SevkiyatKalem
      └─ belongsTo → Parca
```

### Fatura-İrsaliye İlişkileri

```
Fatura ← eslestirme_id → Irsaliye
  ├─ hasMany → FaturaKalem   └─ hasMany → IrsaliyeKalem
      └─ belongsTo → Parca      └─ belongsTo → Parca
```

## Veritabanı İpuçları

### Performans İpuçları

1. **Index Kullanımı**:
   - Sık sorgulanan alanlarda index kullan
   - Foreign key'lerde otomatik index

2. **Query Optimizasyonu**:
   - `SELECT *` yerine gerekli alanları seç
   - JOIN'lerde `include` kullan (Sequelize)
   - Pagination kullan (limit, offset)

3. **Transaction Kullanımı**:
   - Çoklu işlemlerde transaction kullan
   - Hata yönetimi ve rollback

### Veri Bütünlüğü

1. **Validasyonlar**:
   - Model seviyesinde validasyon
   - Unique constraint'ler
   - Foreign key constraint'ler

2. **Trigger'lar** (gelecekte):
   - Stok güncelleme trigger'ları
   - Loglama trigger'ları
   - Hesaplama trigger'ları

3. **Check Constraints**:
   - Pozitif sayı kontrolü
   - Tarih mantıksal kontrolü
   - Enum değer kontrolü

## Yedekleme ve Geri Yükleme

### Yedekleme

```bash
# SQLite yedekleme
cp backend/database.sqlite backend/database.sqlite.backup.$(date +%Y%m%d)

# Veya script ile
node backend/scripts/backup.js
```

### Geri Yükleme

```bash
# Yedeği geri yükle
cp backend/database.sqlite.backup.20250107 backend/database.sqlite
```

## Veritabanı Bakım

### Vacuum

```bash
# SQLite vacuum (optimizasyon)
sqlite3 backend/database.sqlite "VACUUM;"
```

### Analiz

```bash
# Query plan analizi
sqlite3 backend/database.sqlite "EXPLAIN QUERY PLAN SELECT * FROM is_emirleri;"
```

## Migration Yönetimi

### Migration Oluşturma

```javascript
// migrations/YYYYMMDDHHMMSS-description.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Değişiklikleri uygula
  },

  down: async (queryInterface, Sequelize) => {
    // Değişiklikleri geri al
  }
};
```

### Migration Çalıştırma

```bash
# Tüm migratasyonları çalıştır
npm run migrate

# Durum migrasyonunu çalıştır
npm run migrate-durum

# Durum migrasyonunu geri al
npm run rollback-durum-migration
```

### Migration Durumu Kontrol

```bash
# Migration durumunu kontrol et
npm run check-durum-status
```

## Veritabanı Sorgu Örnekleri

### Sequelize Sorgu Örnekleri

```javascript
// Basit sorgu
const isEmirleri = await IsEmri.findAll();

// İlişkili sorgu
const isEmriWithParca = await IsEmri.findByPk(1, {
  include: [{ model: Parca, as: 'parca' }]
});

// Filtreli sorgu
const aktifTezgahlar = await Tezgah.findAll({
  where: { aktif: true }
});

// Aggregate sorgu
const toplamAdet = await IsEmri.sum('adet', {
  where: { durum: 'tamamlandi' }
});

// Transaction
const transaction = await sequelize.transaction();
try {
  await IsEmri.create(data, { transaction });
  await StokHareket.create(hareket, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## Gelecek Geliştirmeler

### Planlanan Özellikler

1. **PostgreSQL Geçişi**:
   - Daha gelişmiş özellikler
   - Daha iyi performans
   - Replication desteği

2. **Full-Text Search**:
   - Parça araması
   - Not araması
   - İş emri araması

3. **Data Archiving**:
   - Eski verileri arşivleme
   - Performans iyileştirme

4. **Analytics**:
   - Raprlama tabloları
   - Data warehouse
   - Business intelligence
