# URTM Takip Veritabanı Dokümantasyonu

## İçerik
1. [Veritabanı Mimarisi](#veritabanı-mimarisi)
2. [Çekirdek Tablolar](#cekirdek-tablolar)
3. [Migration Sistemi](#migration-sistemi)
4. [Tablo İlişkileri](#tablo-iliskileri)
5. [Veri Tipleri ve Desenler](#veri-tipleri-ve-desenler)
6. [Sık Kullanılan Sorgular](#sik-kullanilan-sorgular)

## Veritabanı Mimarisi

### Genel Bakış
URTM Takip sistemi, üretim takip ve yönetimi için geliştirilmiş kapsamlı bir veritabanı mimarisine sahiptir. Sistem, **SQLite** veritabanı motorunu **Sequelize ORM** ile kullanmaktadır.

### Konfigürasyon
- **Veritabanı Dosyası**: `/backend/database.sqlite`
- **ORM**: Sequelize v6+
- **Migration Sistemi**: umzug
- **Connection Pooling**: 5 maksimum bağlantı
- **SQLite Versiyon**: 3.x (WAL mode aktif)

### Performans Optimizasyonları
```javascript
// SQLite PRAGMA ayarları
PRAGMA busy_timeout = 30000;          // 30 saniye bekleme süresi
PRAGMA foreign_keys = ON;             // Foreign key kısıtlamaları
PRAGMA journal_mode = WAL;            // Write-Ahead Logging
PRAGMA synchronous = NORMAL;          // Denge arasında senkronizasyon
PRAGMA cache_size = 10000;            // 10MB cache
PRAGMA temp_store = MEMORY;           // Geçici tablolar bellekte
PRAGMA mmap_size = 268435456;         // 256MB memory mapping
```

## Çekirdek Tablolar

### 1. İş Emirleri (is_emirleri)
Üretim takip sisteminin merkezindeki ana tablodur.

```sql
CREATE TABLE is_emirleri (
  is_emri_id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_emri_no VARCHAR UNIQUE NOT NULL,        -- İş emri numarası (benzersiz)
  is_adi VARCHAR NOT NULL,                   -- İşin adı
  plan_liste_no VARCHAR NOT NULL,            -- Plan listesi numarası
  adet INTEGER NOT NULL,                     -- Üretilecek adet
  malzeme VARCHAR NOT NULL,                  -- Malzeme bilgisi
  teslim_tarihi DATE NOT NULL,               -- Teslim tarihi
  oncelik ENUM('dusuk','normal','yuksek','acil') DEFAULT 'normal',
  durum VARCHAR DEFAULT 'beklemede',         -- İş durumu
  tezgah_id INTEGER,                         -- Atanan tezgah
  uretim_plani_id INTEGER,                   -- Üretim planı referansı
  parca_kodu VARCHAR,                        -- Parça kodu
  aciklama TEXT,                             -- İş açıklaması
  hareketler JSON DEFAULT [],                -- İş hareket geçmişi
  setup_sayisi INTEGER DEFAULT 0,            -- Setup sayısı
  cnc_suresi FLOAT DEFAULT 0,               -- CNC işleme süresi
  malzemesi_siparis_edilecekmi BOOLEAN DEFAULT false,
  malzeme_siparis_tarihi DATE,
  siparis_dokumani_dosya_yolu VARCHAR,
  malzemenin_geldigi_tarih DATE,
  "order" INTEGER DEFAULT 0,                -- Sıralama için
  is_zaman_uzunlugu FLOAT DEFAULT 1.0,      -- Tahmini süre (saat)
  tahmini_isleme_suresi INTEGER DEFAULT 1,   -- Vardiya cinsinden süre
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tezgah_id) REFERENCES tezgahlar(tezgah_id),
  FOREIGN KEY (uretim_plani_id) REFERENCES uretim_plani(id),
  FOREIGN KEY (parca_kodu) REFERENCES parcalar(parca_kodu)
);
```

**Durum Değerleri**:
- `beklemede`: İş bekliyor
- `uretimde`: Üretimde
- `tamamlandi`: İş tamamlandı
- `iptal`: İş iptal edildi
- `fasonda`: Fason üretimde

### 2. Tezgahlar (tezgahlar)
İş istasyonlarını ve makineleri tanımlar.

```sql
CREATE TABLE tezgahlar (
  tezgah_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tezgah_tanimi VARCHAR NOT NULL,            -- Tezgah adı/tanımı
  calisma_durumu ENUM('musait','calisiyor','bakim') DEFAULT 'musait',
  is_emirleri JSON DEFAULT [],               -- Mevcut işler
  is_emirleri_gecmisi JSON DEFAULT [],       -- Geçmiş işler
  pozisyon_x INTEGER DEFAULT 0,             -- X pozisyonu
  pozisyon_y INTEGER DEFAULT 0,             -- Y pozisyonu
  genislik INTEGER DEFAULT 200,             -- Kart genişliği (px)
  yukseklik INTEGER DEFAULT 120,            -- Kart yüksekliği (px)
  son_bakim_tarihi DATE,                    -- Son bakım tarihi
  sonraki_bakim_tarihi DATE,                -- Sonraki bakım tarihi
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Parçalar (parcalar)
Üretilecek parçaların katalogunu tutar.

```sql
CREATE TABLE parcalar (
  parca_kodu VARCHAR PRIMARY KEY,           -- Benzersiz parça kodu
  parca_adi VARCHAR NOT NULL,               -- Parça adı
  parca_kayit_idleri TEXT,                  -- Kayıt ID'leri (JSON array)
  kategori VARCHAR,                         -- Parça kategorisi
  stok_adeti INTEGER DEFAULT 0,             -- Mevcut stok
  kritik_stok INTEGER DEFAULT 0,            -- Kritik stok seviyesi
  teknik_resim_path VARCHAR,                -- Teknik resim yolu
  foto_path VARCHAR,                        -- Fotoğraf yolu
  tedarik_bedeli DECIMAL(10,2) DEFAULT 0.00, -- Tedarik maliyeti
  hamMalzemeCinsi VARCHAR,                  -- Ham malzeme cinsi
  hamMalzemeOlculeri VARCHAR,               -- Ham malzeme ölçüleri
  stok_karti_id INTEGER,                    -- Stok kartı referansı
  imal_mi BOOLEAN DEFAULT false,            -- İmalat parçası mı?
  imalat_prosedur_no VARCHAR,               -- İmalat prosedürü
  fasonMaliyeti DECIMAL(10,2),              -- Fason maliyeti
  sirketIciMaliyeti DECIMAL(10,2),          -- Şirket içi maliyet
  setup_sayisi INTEGER,                     -- Setup sayısı
  cnc_isleme_suresi INTEGER,                -- CNC süresi (dk)
  siyah BOOLEAN DEFAULT false,              -- Siyah renkli mi?
  sldprt_yolu VARCHAR,                      -- SolidWorks parça dosyası
  slddrw_yolu VARCHAR,                      -- SolidWorks çizim dosyası
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (stok_karti_id) REFERENCES stok_kartlari(id)
);
```

### 4. BOM (Bill of Materials) - boms
Malzeme listesi yapısını tanımlar.

```sql
CREATE TABLE boms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bom_kodu VARCHAR(100) NOT NULL,           -- BOM kodu
  name VARCHAR NOT NULL,                    -- BOM adı
  bom_aciklamasi TEXT,                      -- Açıklama
  versiyon VARCHAR(20) DEFAULT '1.0',       -- Versiyon
  aktif BOOLEAN DEFAULT true,               -- Aktif mi?
  grup_tipi ENUM('standard','marka','ozel') DEFAULT 'standard',
  marka VARCHAR(100),                       -- Marka
  ozel_etiket VARCHAR(255),                 -- Özel etiket
  gorsel_ikon VARCHAR(50),                  -- Görsel ikon
  uretim_maliyeti DECIMAL(10,2),            -- Üretim maliyeti (USD)
  tedarik_maliyeti DECIMAL(10,2),           -- Tedarik maliyeti (USD)
  tedarikci_firma VARCHAR(255),             -- Tedarikçi firma
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOM-Parça ilişkisi (ara tablo)
CREATE TABLE bom_parcalar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bomId INTEGER NOT NULL,
  parcaKodu VARCHAR NOT NULL,
  miktar DECIMAL(10,3) NOT NULL,
  birim VARCHAR(20) DEFAULT 'adet',
  pozisyon VARCHAR(50),

  FOREIGN KEY (bomId) REFERENCES boms(id),
  FOREIGN KEY (parcaKodu) REFERENCES parcalar(parca_kodu)
);
```

### 5. Stok Kartları (stok_kartlari)
Ham malzeme stok yönetimi.

```sql
CREATE TABLE stok_kartlari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kesit VARCHAR(50) NOT NULL,               -- Malzeme kesiti
  boy DECIMAL(10,2),                        -- Boy (mm)
  malzeme_adi VARCHAR(200),                 -- Malzeme adı
  malzeme_cinsi VARCHAR(100) NOT NULL,      -- Malzeme tipi
  adet INTEGER DEFAULT 0,                   -- Stok miktarı
  kritik_stok_miktari INTEGER DEFAULT 0,    -- Kritik seviye
  lokasyon VARCHAR(50),                     -- Depo konumu
  adres TEXT,                               -- Detaylı adres
  firma VARCHAR(100),                       -- Tedarikçi
  aktif_mi BOOLEAN DEFAULT true,            -- Aktif mi?
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Üretim Planları (uretim_plani)
Ana üretim planlama sistemi.

```sql
CREATE TABLE uretim_plani (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  makina_id UUID,                           -- Makina UUID'si
  miktar INTEGER DEFAULT 1,                 -- Üretilecek adet
  teslim_tarihi DATE NOT NULL,              -- Teslim tarihi
  durum ENUM('Planlandı','Üretimde','Tamamlandı','İptal') DEFAULT 'Planlandı',
  aciklama TEXT,                            -- Açıklama
  bom_snapshot JSON,                        -- BOM anlık görüntüsü
  kritik_stok_uyarisi JSON,                 -- Kritik stok uyarıları
  ozel_liste_adi VARCHAR,                   -- Özel liste adı
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (makina_id) REFERENCES makinalar(makina_id)
);
```

### 7. Üretim Planları V2 (uretim_planlari)
Basitleştirilmiş üretim planlama sistemi.

```sql
CREATE TABLE uretim_planlari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_adi VARCHAR NOT NULL,                -- Plan adı
  aciklama TEXT,                            -- Açıklama
  durum VARCHAR DEFAULT 'aktif',            -- Durum
  is_emirleri JSON DEFAULT [],              -- İş emri listesi
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. Sevkiyat (sevkiyatlar)
Sevkiyat ve teslimat yönetimi.

```sql
CREATE TABLE sevkiyatlar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sevkiyat_no VARCHAR UNIQUE NOT NULL,      -- Sevkiyat numarası
  tip ENUM('gelen','giden') DEFAULT 'gelen', -- Tip
  firma_id INTEGER NOT NULL,                -- Firma ID
  lokasyon_id INTEGER NOT NULL,             -- Lokasyon ID
  nereden_lokasyon_id INTEGER,              -- Nereden
  nereye_lokasyon_id INTEGER,               -- Nereye
  tarih DATE NOT NULL,                      -- Tarih
  durum ENUM('beklemede','yolda','tamamlandi') DEFAULT 'beklemede',
  aciklama TEXT,                            -- Açıklama
  olusturan_kullanici VARCHAR NOT NULL,     -- Oluşturan
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP,
  tedarik_talebi_id INTEGER,                -- Tedarik talebi referansı

  FOREIGN KEY (firma_id) REFERENCES firmalar(id),
  FOREIGN KEY (tedarik_talebi_id) REFERENCES tedarik_talepleri(id)
);
```

### 9. İşlem Kayıtları (islem_kayitlari)
İşlem geçmişini tutar.

```sql
CREATE TABLE islem_kayitlari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_emri_no VARCHAR NOT NULL,              -- İş emri numarası
  tezgah_id INTEGER,                        -- Tezgah ID
  islem_tipi TEXT NOT NULL,                 -- İşlem tipi
  islem_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  islenen_adet INTEGER,                     -- İşlenen adet
  aciklama TEXT,                            -- Açıklama
  fason_is_emri_id UUID,                    -- Fason iş emri ID
  islem_yeri ENUM('tezgah','fason') DEFAULT 'tezgah',
  fason_tedarikci VARCHAR,                  -- Fason tedarikçi
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (is_emri_no) REFERENCES is_emirleri(is_emri_no),
  FOREIGN KEY (tezgah_id) REFERENCES tezgahlar(tezgah_id)
);
```

### 10. Tezgah Durum Log (tezgah_durum_log)
Tezgah durum değişimlerini kaydeder.

```sql
CREATE TABLE tezgah_durum_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tezgah_id INTEGER NOT NULL,               -- Tezgah ID
  eski_durum VARCHAR,                       -- Eski durum
  yeni_durum VARCHAR NOT NULL,              -- Yeni durum
  degisiklik_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  aciklama TEXT,                            -- Açıklama
  kullanici_id INTEGER,                     -- Kullanıcı ID

  FOREIGN KEY (tezgah_id) REFERENCES tezgahlar(tezgah_id)
);
```

### 11. Parça Kayıtları (parca_kayitlari)
Parça hareketlerini takip eder.

```sql
CREATE TABLE parca_kayitlari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parca_kodu VARCHAR NOT NULL,              -- Parça kodu
  islem_tipi ENUM('giris','cikis','uretim','fason') NOT NULL,
  miktar INTEGER NOT NULL,                  -- Miktar
  aciklama TEXT,                            -- Açıklama
  is_emri_id INTEGER,                       -- İş emri ID
  tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  kullanici VARCHAR,                        -- Kullanıcı

  FOREIGN KEY (parca_kodu) REFERENCES parcalar(parca_kodu),
  FOREIGN KEY (is_emri_id) REFERENCES is_emirleri(is_emri_id)
);
```

### 12. Notlar Sistemi

#### Not Kategorileri (not_kategorileri)
```sql
CREATE TABLE not_kategorileri (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kategori_adi VARCHAR UNIQUE NOT NULL,     -- Kategori adı
  renk_kodu VARCHAR DEFAULT '#007bff',      -- Renk kodu
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  aktif BOOLEAN DEFAULT true
);
```

#### Notlar (notlar)
```sql
CREATE TABLE notlar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baslik TEXT NOT NULL,                     -- Başlık
  icerik TEXT,                              -- İçerik
  resim_yolu VARCHAR,                       -- Resim yolu
  kategori_id INTEGER,                      -- Kategori ID
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  kullanici_id INTEGER DEFAULT 1,           -- Kullanıcı ID
  aktif BOOLEAN DEFAULT true,

  FOREIGN KEY (kategori_id) REFERENCES not_kategorileri(id)
);
```

### 13. Personel Yönetimi

#### Personel (personeller)
```sql
CREATE TABLE personeller (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personel_adi VARCHAR(100) NOT NULL,       -- Ad soyad
  sicil_no VARCHAR(20) UNIQUE,              -- Sicil no
  pozisyon VARCHAR(100),                    -- Pozisyon
  telefon VARCHAR(20),                      -- Telefon
  email VARCHAR(100),                       -- E-posta
  vardiya_id INTEGER,                       -- Vardiya ID
  aktif BOOLEAN DEFAULT true,               -- Aktif mi?
  maas DECIMAL(10,2),                       -- Maaş
  ise_baslama_tarihi DATE,                  -- İşe başlama
  notlar TEXT,                              -- Notlar
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (vardiya_id) REFERENCES vardiyalar(id)
);
```

#### Vardiyalar (vardiyalar)
```sql
CREATE TABLE vardiyalar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vardiya_adi VARCHAR(100) NOT NULL,        -- Vardiya adı
  baslangic_saati TIME NOT NULL,            -- Başlangıç
  bitis_saati TIME NOT NULL,               -- Bitiş
  haftalik_calisma_gunleri JSON DEFAULT [1,2,3,4,5],
  aktif BOOLEAN DEFAULT true,               -- Aktif mi?
  aciklama TEXT,                            -- Açıklama
  renk VARCHAR(7) DEFAULT '#1976d2',       -- Renk
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Vardiya Atamaları (vardiya_atamalari)
```sql
CREATE TABLE vardiya_atamalari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personel_id INTEGER NOT NULL,             -- Personel ID
  vardiya_id INTEGER NOT NULL,              -- Vardiya ID
  baslangic_tarihi DATE NOT NULL,           -- Başlangıç
  bitis_tarihi DATE,                        -- Bitiş
  aktif BOOLEAN DEFAULT true,               -- Aktif mi?
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (personel_id) REFERENCES personeller(id),
  FOREIGN KEY (vardiya_id) REFERENCES vardiyalar(id)
);
```

### 14. Firmalar (firmalar)
Cari ve firma bilgileri.

```sql
CREATE TABLE firmalar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firma_kodu VARCHAR UNIQUE NOT NULL,       -- Firma kodu
  firma_adi VARCHAR NOT NULL,               -- Firma adı
  yetkili_kisi VARCHAR,                     -- Yetkili
  telefon VARCHAR,                          -- Telefon
  email VARCHAR,                            -- E-posta
  adres TEXT,                               -- Adres
  vergi_dairesi VARCHAR,                    -- Vergi dairesi
  vergi_no VARCHAR,                         -- Vergi no
  firma_tipi ENUM('musteri','tedarikci','fason','her_ikisi') DEFAULT 'her_ikisi',
  aktif BOOLEAN DEFAULT true,               -- Aktif mi?
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 15. Arıza ve Bakım (ariza_bakim)
Bakım ve arıza kayıtları.

```sql
CREATE TABLE ariza_bakim (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tezgah_id INTEGER NOT NULL,               -- Tezgah ID
  tip ENUM('ariza','planli_bakim','onleyici_bakim') NOT NULL,
  baslik VARCHAR NOT NULL,                  -- Başlık
  aciklama TEXT,                            -- Açıklama
  baslama_tarihi TIMESTAMP,                 -- Başlangıç
  bitis_tarihi TIMESTAMP,                   -- Bitiş
  durum ENUM('acik','devam_ediyor','tamamlandi','iptal') DEFAULT 'acik',
  maliyet DECIMAL(10,2),                    -- Maliyet
  personel_id INTEGER,                      -- Personel ID
  olusturan_kullanici VARCHAR NOT NULL,     -- Oluşturan
  olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tezgah_id) REFERENCES tezgahlar(tezgah_id),
  FOREIGN KEY (personel_id) REFERENCES personeller(id)
);
```

## Migration Sistemi

### Migration Yapısı
Migration dosyaları `backend/src/migrations/` dizininde bulunur. Dosya adlandırma formatı:

```
YYYYMMDDHHMMSS-aciklama.js
```

### Mevcut Migrasyonlar

| Migration Dosyası | Açıklama |
|------------------|-----------|
| `20240912000001-add-tahmini-isleme-suresi.js` | İş emirlerine tahmini işleme süresi ekleme |
| `20250924_add_cost_fields_to_boms.js` | BOM tablosuna maliyet alanları ekleme |
| `20250701000001-create-notlar-tables.js` | Notlar sistemi tablolarını oluşturma |
| `20250119000001-create-import-tables.js` | Import sistemi tabloları |
| `20250109000001-create-workstation-scheduler.js` | İş istasyonu planlayıcı |
| `20250414_create_tamamlanan_isler_table.js` | Tamamlanan işler tablosu |
| `20250504-add-sira-no-to-tezgah-planlanan-isler.js` | Sıra no alanı ekleme |
| `20250525_create_siparis_dokumanlari.js` | Sipariş dokümanları tablosu |
| `20250714000001-add-tedarik-talebi-to-sevkiyat.js` | Sevkiyata tedarik talebi ilişkisi |
| `20251214000001-create-tedarik-talepleri-table.js` | Tedarik talepleri tablosu |
| `20251215-unify-firmalar.js` | Firma tablolarını birleştirme |
| `20251215-add-miktar-to-sevkiyat-kalemleri.js` | Sevkiyat kalemlerine miktar ekleme |
| `20251215000001-add-otomatik-sevkiyat-fields.js` | Otomatik sevkiyat alanları |

### Migration Komutları

```bash
# Tüm migrationları çalıştır
npm run migrate

# Durum modülü migration'ı
npm run migrate-durum

# Durum migration'ını geri al
npm run rollback-durum-migration

# Migration durumunu kontrol et
npm run check-durum-status
```

### Migration Örneği
```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('boms', 'yeni_alan', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Yeni alan açıklaması'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('boms', 'yeni_alan');
  }
};
```

## Tablo İlişkileri

### One-to-Many İlişkiler

```
Firmalar (1) --< (N) Sevkiyatlar
Firmalar (1) --< (N) Tedarik Talepleri

Tezgahlar (1) --< (N) İş Emirleri
Tezgahlar (1) --< (N) İşlem Kayıtları
Tezgahlar (1) --< (N) Tezgah Durum Log
Tezgahlar (1) --< (N) Arıza Bakım

Parçalar (1) --< (N) İş Emirleri
Parçalar (1) --< (N) Parça Kayıtları

BOMs (1) --< (N) BOM Parçalar

Üretim Planları (1) --< (N) İş Emirleri

Not Kategorileri (1) --< (N) Notlar

Vardiyalar (1) --< (N) Personel
Vardiyalar (1) --< (N) Vardiya Atamaları
Personel (1) --< (N) Vardiya Atamaları
```

### Many-to-Many İlişkiler

```
BOMs (M) -- (makina_bom) -- (N) Makinalar
```

### Cascade Kuralları

- **ON DELETE CASCADE**: İlişkili kayıtların silinmesini sağlar
- **ON DELETE SET NULL**: Yabancı anahtarı NULL yapar
- **ON UPDATE CASCADE**: Anahtar güncellemelerini ilişkili kayıtlara yansıtır

## Veri Tipleri ve Desenler

### ID Desenleri

| Tablo | ID Tipi | Pattern |
|-------|---------|---------|
| is_emirleri | INTEGER | Otomatik artan |
| tezgahlar | INTEGER | Otomatik artan |
| parcalar | VARCHAR | Parça kodu (benzersiz) |
| boms | INTEGER | Otomatik artan |
| stok_kartlari | INTEGER | Otomatik artan |
| uretim_plani | INTEGER | Otomatik artan |
| personeller | INTEGER | Otomatik artan |
| firmalar | INTEGER | Otomatik artan |
| makinalar | UUID | UUID v4 |
| fason_is_emirleri | UUID | UUID v4 |

### Timestamp Desenleri

```javascript
// Oluşturma ve güncelleme alanları
{
  createdAt: 'olusturma_tarihi',  // YYYY-MM-DD HH:MM:SS
  updatedAt: 'guncelleme_tarihi'  // YYYY-MM-DD HH:MM:SS
}

// Tarih formatları
tarih: 'YYYY-MM-DD'              // Sadece tarih
saat: 'HH:MM:SS'                  // Sadece saat
timestamp: 'YYYY-MM-DD HH:MM:SS' // Tarih ve saat
```

### Status ve Enum Desenleri

#### İş Emri Durumları
- `beklemede`: İş bekliyor
- `planlandi`: Planlandı
- `uretimde`: Üretimde
- `tamamlandi`: Tamamlandı
- `iptal`: İptal
- `fasonda`: Fason üretimde

#### Tezgah Durumları
- `musait`: Müsait
- `calisiyor`: Çalışıyor
- `bakim`: Bakımda

#### Öncelik Seviyeleri
- `dusuk`: Düşük öncelik
- `normal`: Normal öncelik
- `yuksek`: Yüksek öncelik
- `acil`: Acil

### JSON Alan Kullanımı

```json
// İş Emri Hareketleri
{
  "hareketler": [
    {
      "tarih": "2024-01-15T10:30:00Z",
      "durum": "uretimde",
      "aciklama": "Üretim başladı",
      "kullanici": "Ahmet Yılmaz"
    }
  ]
}

// BOM Snapshot
{
  "bom_snapshot": {
    "parcalar": [
      {
        "parca_kodu": "P001",
        "miktar": 2,
        "stok_durumu": "yeterli"
      }
    ],
    "olusturma_tarihi": "2024-01-15"
  }
}

// Vardiya Günleri
{
  "haftalik_calisma_gunleri": [1, 2, 3, 4, 5] // Pazartesi-Cuma
}
```

### Dosya Yolu Desenleri

```javascript
// Teknik Resim
teknik_resim_path: "uploads/technical_drawings/P001.png"

// Fotoğraf
foto_path: "uploads/photos/P001.jpg"

// SolidWorks Dosyaları
sldprt_yolu: "cad/files/solidworks/P001.sldprt"
slddrw_yolu: "cad/files/solidworks/P001.slddrw"

// Sipariş Dokümanı
siparis_dokumani_dosya_yolu: "uploads/documents/PO123.pdf"
```

### Maliyet Alanları

```javascript
// Para birimi formatları
tedarik_bedeli: DECIMAL(10,2)    -- 99.999.999,99
fason_maliyeti: DECIMAL(10,2)    -- 99.999.999,99
uretim_maliyeti: DECIMAL(10,2)   -- 99.999.999,99
sirketIciMaliyeti: DECIMAL(10,2) -- 99.999.999,99
maas: DECIMAL(10,2)              -- 99.999.999,99
```

## Sık Kullanılan Sorgular

### 1. Aktif İş Emirlerini Listeleme
```sql
SELECT
  ie.is_emri_no,
  ie.is_adi,
  ie.adet,
  ie.durum,
  ie.teslim_tarihi,
  t.tezgah_tanimi,
  p.parca_adi
FROM is_emirleri ie
LEFT JOIN tezgahlar t ON ie.tezgah_id = t.tezgah_id
LEFT JOIN parcalar p ON ie.parca_kodu = p.parca_kodu
WHERE ie.durum IN ('beklemede', 'uretimde', 'planlandi')
ORDER BY ie.teslim_tarihi ASC;
```

### 2. Tezgah Durum Raporu
```sql
SELECT
  t.tezgah_id,
  t.tezgah_tanimi,
  t.calisma_durumu,
  COUNT(ie.is_emri_id) as is_emri_sayisi,
  SUM(ie.adet) as toplam_adet
FROM tezgahlar t
LEFT JOIN is_emirleri ie ON t.tezgah_id = ie.tezgah_id
  AND ie.durum IN ('uretimde', 'planlandi')
GROUP BY t.tezgah_id, t.tezgah_tanimi, t.calisma_durumu
ORDER BY t.tezgah_tanimi;
```

### 3. Kritik Stok Listesi
```sql
SELECT
  sk.id,
  sk.kesit,
  sk.boy,
  sk.malzeme_cinsi,
  sk.adet,
  sk.kritik_stok_miktari,
  sk.firma,
  (sk.adet - sk.kritik_stok_miktari) as fark
FROM stok_kartlari sk
WHERE sk.aktif_mi = true
  AND sk.adet <= sk.kritik_stok_miktari
ORDER BY (sk.adet - sk.kritik_stok_miktari) ASC;
```

### 4. Personel Vardiya Atamaları
```sql
SELECT
  p.personel_adi,
  p.sicil_no,
  v.vardiya_adi,
  v.baslangic_saati,
  v.bitis_saati,
  va.baslangic_tarihi,
  va.bitis_tarihi
FROM personeller p
JOIN vardiya_atamalari va ON p.id = va.personel_id
JOIN vardiyalar v ON va.vardiya_id = v.id
WHERE p.aktif = true
  AND va.aktif = true
  AND (va.bitis_tarihi IS NULL OR va.bitis_tarihi >= date('now'))
ORDER BY p.personel_adi;
```

### 5. BOM Parça Listesi
```sql
SELECT
  b.name as bom_adi,
  bp.parcaKodu,
  p.parca_adi,
  bp.miktar,
  bp.birim,
  sk.adet as stok_miktari
FROM boms b
JOIN bom_parcalar bp ON b.id = bp.bomId
LEFT JOIN parcalar p ON bp.parcaKodu = p.parca_kodu
LEFT JOIN stok_kartlari sk ON p.stok_karti_id = sk.id
WHERE b.aktif = true
ORDER BY b.name, bp.id;
```

### 6. Sevkiyat Raporu
```sql
SELECT
  s.sevkiyat_no,
  s.tarih,
  s.tip,
  s.durum,
  f.firma_adi,
  COUNT(sk.id) as kalem_sayisi
FROM sevkiyatlar s
JOIN firmalar f ON s.firma_id = f.id
LEFT JOIN sevkiyat_kalemleri sk ON s.id = sk.sevkiyat_id
WHERE s.tarih BETWEEN date('now', '-30 days') AND date('now')
GROUP BY s.id, s.sevkiyat_no, s.tarih, s.tip, s.durum, f.firma_adi
ORDER BY s.tarih DESC;
```

### 7. Arıza Bakım İstatistikleri
```sql
SELECT
  t.tezgah_tanimi,
  COUNT(*) as toplam_kayit,
  SUM(CASE WHEN tip = 'ariza' THEN 1 ELSE 0 END) as ariza_sayisi,
  SUM(CASE WHEN tip = 'planli_bakim' THEN 1 ELSE 0 END) as planli_bakim,
  SUM(maliyet) as toplam_maliyet,
  AVG(
    CASE
      WHEN baslama_tarihi IS NOT NULL AND bitis_tarihi IS NOT NULL
      THEN (julianday(bitis_tarihi) - julianday(baslama_tarihi)) * 24
      ELSE NULL
    END
  ) as ortalama_sure_saat
FROM ariza_bakim ab
JOIN tezgahlar t ON ab.tezgah_id = t.tezgah_id
WHERE ab.baslama_tarihi >= date('now', '-90 days')
GROUP BY t.tezgah_id, t.tezgah_tanimi
ORDER BY toplam_kayit DESC;
```

## İndeks Stratejisi

### Performans için Önerilen İndeksler

```sql
-- İş emri sorguları için
CREATE INDEX idx_is_emirleri_durum ON is_emirleri(durum);
CREATE INDEX idx_is_emirleri_teslim_tarihi ON is_emirleri(teslim_tarihi);
CREATE INDEX idx_is_emirleri_tezgah ON is_emirleri(tezgah_id);

-- Parça stok sorguları için
CREATE INDEX idx_parcalar_kritik_stok ON parcalar(kritik_stok);
CREATE INDEX idx_stok_kartlari_kritik ON stok_kartlari(adet, kritik_stok_miktari);

-- İşlem kayıtları için
CREATE INDEX idx_islem_kayitlari_is_emri ON islem_kayitlari(is_emri_no);
CREATE INDEX idx_islem_kayitlari_tarih ON islem_kayitlari(islem_tarihi);

-- Sevkiyat sorguları için
CREATE INDEX idx_sevkiyatlar_tarih ON sevkiyatlar(tarih);
CREATE INDEX idx_sevkiyatlar_firma ON sevkiyatlar(firma_id);

-- BOM sorguları için
CREATE INDEX idx_bom_parcalar_parca ON bom_parcalar(parcaKodu);
CREATE INDEX idx_bom_parcalar_bom ON bom_parcalar(bomId);
```

## Veritabanı Yedekleme

### SQLite Yedekleme Komutları

```bash
# Tam yedekleme
sqlite3 database.sqlite ".backup backup_$(date +%Y%m%d_%H%M%S).sqlite"

# Sadece veri yedeği
sqlite3 database.sqlite ".output data_dump.sql" ".dump" ".quit"

# Sıkıştırılmış yedek
sqlite3 database.sqlite ".backup backup_$(date +%Y%m%d_%H%M%S).sqlite" "gzip backup_$(date +%Y%m%d_%H%M%S).sqlite"
```

### Node.js Yedekleme Script

```javascript
const fs = require('fs');
const { exec } = require('child_process');

const backupDatabase = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `backups/database_${timestamp}.sqlite`;

  exec(`sqlite3 database.sqlite ".backup ${backupPath}"`, (error) => {
    if (error) {
      console.error('Yedekleme hatası:', error);
      return;
    }
    console.log(`Veritabanı yedeklendi: ${backupPath}`);
  });
};

// Otomatik yedekleme (günde bir)
setInterval(backupDatabase, 24 * 60 * 60 * 1000);
```

---

Bu dokümantasyon, URTM Takip sisteminin veritabanı yapısının kapsamlı bir referansını sağlamaktadır. Daha fazla bilgi için model dosyalarını ve migration dosyalarını inceleyebilirsiniz.