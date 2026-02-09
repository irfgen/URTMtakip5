# ÜRTM Takip Veritabanı Şeması Dokümantasyonu

## Veritabanı Genel Bakış

ÜRTM Takip sistemi, SQLite veritabanı kullanır ve 32'den fazla tablo içeren kompleks bir ilişkisel yapıya sahiptir.

### Teknik Detaylar
- **Veritabanı Türü**: SQLite 3
- **ORM**: Sequelize 6.37.5
- **Dosya Konumu**: `backend/database.sqlite`
- **Dosya Boyutu**: ~98MB
- **Karakter Seti**: UTF-8
- **Migrasyon Sistemi**: Umzug

## Temel İlişkiler

```
İş Emirleri (is_emirleri)
    ↓ (N:1)
Parçalar (parcalar)
    ↓ (1:N)
BOM (boms) → Malzemeler (bom_malzemeler) → Parçalar (recursive)
    ↑
Üretim Planları (uretim_planlari)
    ↓
İşlem Kayıtlari (islem_kayitlari)

Tezgahlar (tezgahlar)
    ↓ (1:N)
İş Emirleri (is_emirleri)
    ↓
Tezgah Durum Log (tezgah_durum_log)

Kullanıcılar (users)
    ↓
İşlem Kayıtları (islem_kayitlari)
```

## Tablo Detayları

### 1. İş Emirleri (is_emirleri)

Üretim takip sisteminin ana tablosudur. Her iş emri bir üretim işini temsil eder.

```sql
CREATE TABLE is_emirleri (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  siparisNo VARCHAR(50) NOT NULL UNIQUE,
  parcaId UUID NOT NULL,
  tezgahId INTEGER NOT NULL,
  miktar INTEGER NOT NULL,
  tamamlananMiktar INTEGER DEFAULT 0,
  durum INTEGER DEFAULT 0,
  terminTarihi DATE NOT NULL,
  aciklama TEXT,
  tahminiIslemeSuresi INTEGER, -- dakika cinsinden
  oncelik INTEGER DEFAULT 5, -- 1 (en yüksek) - 10 (en düşük)
  userId UUID, -- işlemden sorumlu kullanıcı
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parcaId) REFERENCES parcalar(id),
  FOREIGN KEY (tezgahId) REFERENCES tezgahlar(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Index'ler
CREATE INDEX idx_is_emirleri_durum ON is_emirleri(durum);
CREATE INDEX idx_is_emirleri_siparisNo ON is_emirleri(siparisNo);
CREATE INDEX idx_is_emirleri_parcaId ON is_emirleri(parcaId);
CREATE INDEX idx_is_emirleri_tezgahId ON is_emirleri(tezgahId);
CREATE INDEX idx_is_emirleri_termin ON is_emirleri(terminTarihi);
```

**Durum Kodları:**
- `0` - Planlandı
- `1` - Üretimde
- `2` - Tamamlandı
- `3` - İptal Edildi

### 2. Parçalar (parcalar)

Üretilecek veya kullanılan parçaların ana katalog tablosudur.

```sql
CREATE TABLE parcalar (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  adi VARCHAR(100) NOT NULL,
  kodu VARCHAR(50) NOT NULL UNIQUE,
  cizimNo VARCHAR(50),
  kategori VARCHAR(50),
  altKategori VARCHAR(50),
  birim VARCHAR(20) DEFAULT 'Adet',
  agirlik REAL, -- kg cinsinden
  stokMiktari REAL DEFAULT 0,
  kritikStok INTEGER DEFAULT 0,
  minSiparisMiktari INTEGER DEFAULT 1,
  aciklama TEXT,
  teknikCizim VARCHAR(255), -- dosya yolu
  foto VARCHAR(255), -- fotoğraf yolu
  aktif BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index'ler
CREATE INDEX idx_parcalar_kodu ON parcalar(kodu);
CREATE INDEX idx_parcalar_adi ON parcalar(adi);
CREATE INDEX idx_parcalar_kategori ON parcalar(kategori);
CREATE UNIQUE INDEX idx_parcalar_kodu_unique ON parcalar(kodu);
```

### 3. BOM (Bill of Materials) (boms)

Malzeme Listesi (BOM) tabloları, bir parçanın hangi alt malzemelerden oluştuğunu tanımlar.

```sql
CREATE TABLE boms (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  parcaId UUID NOT NULL,
  versiyon INTEGER DEFAULT 1,
  adi VARCHAR(100) NOT NULL,
  aciklama TEXT,
  toplamMaliyet DECIMAL(10,2) DEFAULT 0,
  aktif BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parcaId) REFERENCES parcalar(id)
);

-- BOM Malzeme detayları
CREATE TABLE bom_malzemeler (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  bomId UUID NOT NULL,
  malzemeId UUID NOT NULL, -- parcalar tablosuna referans
  miktar REAL NOT NULL,
  birim VARCHAR(20) DEFAULT 'Adet',
  birimFiyat DECIMAL(10,2),
  toplamFiyat DECIMAL(10,2),
  aciklama TEXT,
  fireOrani REAL DEFAULT 0, -- fire yüzdesi

  FOREIGN KEY (bomId) REFERENCES boms(id),
  FOREIGN KEY (malzemeId) REFERENCES parcalar(id),
  UNIQUE(bomId, malzemeId)
);

-- Index'ler
CREATE INDEX idx_boms_parcaId ON boms(parcaId);
CREATE INDEX idx_bom_malzemeler_bomId ON bom_malzemeler(bomId);
CREATE INDEX idx_bom_malzemeler_malzemeId ON bom_malzemeler(malzemeId);
```

### 4. Tezgahlar (tezgahlar)

Üretim makineleri/tezgahlarının tanım ve durum takibi tablosu.

```sql
CREATE TABLE tezgahlar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adi VARCHAR(100) NOT NULL,
  tip VARCHAR(50), -- CNC, Pres, Kaynak, vb.
  marka VARCHAR(50),
  model VARCHAR(50),
  kapasite VARCHAR(100), -- "500x400 mm" gibi
  durum INTEGER DEFAULT 0,
  durumAciklamasi TEXT,
  sonBakim DATE,
  planliBakim DATE,
  bakimPeriyodu INTEGER, -- gün cinsinden
  konum TEXT,
  sorumluPersonel VARCHAR(100),
  aktif BOOLEAN DEFAULT TRUE,
  cihazId VARCHAR(50), -- ESP32 cihaz ID'si
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tezgah durum logları
CREATE TABLE tezgah_durum_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tezgahId INTEGER NOT NULL,
  eskiDurum INTEGER,
  yeniDurum INTEGER,
  aciklama TEXT,
  userId UUID,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tezgahId) REFERENCES tezgahlar(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Index'ler
CREATE UNIQUE INDEX idx_tezgahlar_adi ON tezgahlar(adi);
CREATE INDEX idx_tezgah_durum_log_tezgahId ON tezgah_durum_log(tezgahId);
```

**Tezgah Durum Kodları:**
- `0` - Durdu
- `1` - Çalışıyor
- `2` - Hata/Bakım

### 5. Üretim Planları (uretim_planlari)

V2 - Basitleştirilmiş üretim planı sistemi.

```sql
CREATE TABLE uretim_planlari (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  adi VARCHAR(100) NOT NULL,
  tarih DATE NOT NULL,
  durum INTEGER DEFAULT 0, -- 0: Taslak, 1: Onaylı, 2: Tamamlandı
  aciklama TEXT,
  createdBy UUID,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Üretim planı iş emri ilişkileri
CREATE TABLE uretim_plani_is_emirleri (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  planId UUID NOT NULL,
  isEmriId UUID NOT NULL,
  sira INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (planId) REFERENCES uretim_planlari(id),
  FOREIGN KEY (isEmriId) REFERENCES is_emirleri(id),
  UNIQUE(planId, sira)
);

-- Index'ler
CREATE INDEX idx_uretim_planlari_tarih ON uretim_planlari(tarih);
CREATE INDEX idx_uretim_plani_is_emirleri_planId ON uretim_plani_is_emirleri(planId);
CREATE INDEX idx_uretim_plani_is_emirleri_sira ON uretim_plani_is_emirleri(planId, sira);
```

### 6. Stok Kartları (stok_kartlari)

Envanter takip ve stok hareketleri tablosu.

```sql
CREATE TABLE stok_kartlari (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  parcaId UUID NOT NULL,
  tip VARCHAR(20) NOT NULL, -- 'Giris', 'Cikis'
  miktar REAL NOT NULL,
  birimFiyat DECIMAL(10,2),
  toplamTutar DECIMAL(10,2),
  fisNo VARCHAR(50),
  fisTarihi DATE NOT NULL,
  aciklama TEXT,
  referansId UUID, -- iş emri veya diğer referans
  referansTip VARCHAR(50), -- 'IsEmri', 'Fason', 'SatinAlma'
  userId UUID,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parcaId) REFERENCES parcalar(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Index'ler
CREATE INDEX idx_stok_kartlari_parcaId ON stok_kartlari(parcaId);
CREATE INDEX idx_stok_kartlari_tip ON stok_kartlari(tip);
CREATE INDEX idx_stok_kartlari_fisTarihi ON stok_kartlari(fisTarihi);
```

### 7. Fason İşler (fason_isler)

Dışarıda yaptırılan işlerin yönetim tablosu.

```sql
CREATE TABLE fason_gruplari (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  grupAdi VARCHAR(100) NOT NULL,
  durum INTEGER DEFAULT 0, -- 0: Teklif, 1: Onaylı, 2: Üretimde, 3: Tamamlandı
  firmaId UUID,
  toplamTutar DECIMAL(15,2),
  terminTarihi DATE,
  aciklama TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (firmaId) REFERENCES firmalar(id)
);

CREATE TABLE fason_is_emirleri (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  fasonGrupId UUID NOT NULL,
  isEmriId UUID,
  parcaId UUID NOT NULL,
  miktar REAL NOT NULL,
  birimFiyat DECIMAL(10,2),
  toplamTutar DECIMAL(10,2),
  aciklama TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (fasonGrupId) REFERENCES fason_gruplari(id),
  FOREIGN KEY (isEmriId) REFERENCES is_emirleri(id),
  FOREIGN KEY (parcaId) REFERENCES parcalar(id)
);

-- Firmalar tablosu
CREATE TABLE firmalar (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  adi VARCHAR(100) NOT NULL,
  yetkili VARCHAR(100),
  telefon VARCHAR(20),
  email VARCHAR(100),
  adres TEXT,
  vergiNo VARCHAR(20),
  vergiDairesi VARCHAR(100),
  tip VARCHAR(20) DEFAULT 'Fason', -- 'Fason', 'Tedarik', 'Musteri'
  aktif BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8. Sevkiyat (sevkiyat)

Üretilen parçaların teslimat takibi.

```sql
CREATE TABLE sevkiyat (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  musteriId UUID,
  siparisNo VARCHAR(50),
  teslimatTarihi DATE,
  durum INTEGER DEFAULT 0, -- 0: Hazırlanıyor, 1: Yolda, 2: Teslim Edildi
  aciklama TEXT,
  createdById UUID,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (musteriId) REFERENCES firmalar(id),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

-- Sevkiyat detayları
CREATE TABLE sevkiyat_detay (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  sevkiyatId UUID NOT NULL,
  isEmriId UUID,
  parcaId UUID NOT NULL,
  miktar REAL NOT NULL,
  birim VARCHAR(20),
  aciklama TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sevkiyatId) REFERENCES sevkiyat(id),
  FOREIGN KEY (isEmriId) REFERENCES is_emirleri(id),
  FOREIGN KEY (parcaId) REFERENCES parcalar(id)
);

-- Sevkiyat resimleri
CREATE TABLE sevkiyat_resimleri (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  sevkiyatId UUID NOT NULL,
  resimYolu VARCHAR(255) NOT NULL,
  aciklama TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sevkiyatId) REFERENCES sevkiyat(id)
);
```

### 9. Arıza-Bakım (ariza_bakim)

Ekipman bakım ve arıza kayıtları.

```sql
CREATE TABLE ariza_bakim (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  tezgahId INTEGER,
  tip VARCHAR(20) NOT NULL, -- 'Ariza', 'PlanliBakim', 'AcilBakim'
  baslamaTarihi DATETIME,
  bitisTarihi DATETIME,
  sure INTEGER, -- dakika cinsinden
  aciklama TEXT,
  yapilanIslemler TEXT,
  parcaMaliyet DECIMAL(10,2),
  iscilikMaliyet DECIMAL(10,2),
  toplamMaliyet DECIMAL(10,2),
  durum INTEGER DEFAULT 0, -- 0: Açık, 1: Devam Ediyor, 2: Tamamlandı
  sorumluPersonel VARCHAR(100),
  userId UUID,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tezgahId) REFERENCES tezgahlar(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### 10. İşlem Kayıtları (islem_kayitlari)

Üretim süreçlerinin detaylı zaman takibi.

```sql
CREATE TABLE islem_kayitlari (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  isEmriId UUID NOT NULL,
  tezgahId INTEGER,
  islemTipi VARCHAR(50) NOT NULL, -- 'Operasyon', 'Setup', 'Bakim', 'Transfer'
  baslangic DATETIME,
  bitis DATETIME,
  sure INTEGER, -- otomatik hesaplanır (dakika)
  miktar INTEGER, -- bu sürede üretilen miktar
  aciklama TEXT,
  userId UUID,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (isEmriId) REFERENCES is_emirleri(id),
  FOREIGN KEY (tezgahId) REFERENCES tezgahlar(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Index'ler
CREATE INDEX idx_islem_kayitlari_isEmriId ON islem_kayitlari(isEmriId);
CREATE INDEX idx_islem_kayitlari_baslangic ON islem_kayitlari(baslangic);
```

### 11. Notlar Sistemi (notlar, not_kategorileri)

Kullanıcı notları ve bilgileri yönetimi.

```sql
CREATE TABLE not_kategorileri (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  adi VARCHAR(50) NOT NULL,
  renk VARCHAR(7) DEFAULT '#007bff', -- hex color
  ikon VARCHAR(50), -- Material-UI icon adı
  sira INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notlar (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  baslik VARCHAR(100) NOT NULL,
  icerik TEXT,
  kategoriId UUID,
  onem INTEGER DEFAULT 1, -- 1: Düşük, 2: Orta, 3: Yüksek
  etiketler TEXT, -- JSON formatında etiket dizisi
  referansId UUID,
  referansTip VARCHAR(50), -- 'IsEmri', 'Parca', 'Tezgah', etc.
  gizli BOOLEAN DEFAULT FALSE,
  userId UUID,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (kategoriId) REFERENCES not_kategorileri(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Index'ler
CREATE INDEX idx_notlar_kategoriId ON notlar(kategoriId);
CREATE INDEX idx_notlar_onem ON notlar(onem);
CREATE INDEX idx_notlar_userId ON notlar(userId);
CREATE INDEX idx_notlar_referans ON notlar(referansTip, referansId);
```

### 12. Kullanıcılar (users)

Sistem kullanıcı yönetimi.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  ad VARCHAR(50) NOT NULL,
  soyad VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  sifre VARCHAR(255) NOT NULL, -- hash'lenmiş
  rol VARCHAR(20) DEFAULT 'Operator', -- 'Admin', 'Yonetici', 'Muhendis', 'Operator'
  departman VARCHAR(50),
  telefon VARCHAR(20),
  aktif BOOLEAN DEFAULT TRUE,
  sonGiris DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index'ler
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);
```

### 13. Personel (personeller)

Şirket personel bilgileri.

```sql
CREATE TABLE personeller (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  tcKimlikNo VARCHAR(11) UNIQUE,
  ad VARCHAR(50) NOT NULL,
  soyad VARCHAR(50) NOT NULL,
  gorevi VARCHAR(100),
  departman VARCHAR(50),
  telefon VARCHAR(20),
  email VARCHAR(100),
  iseGirisTarihi DATE,
  aktif BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Veritabanı İlişki Diyagramı

```
┌─────────────────┐      ┌─────────────────┐
│   is_emirleri   │◄────┤     parcalar     │
└─────────────────┘      └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐      ┌─────────────────┐
│ islem_kayitlari │      │      boms       │
└─────────────────┘      └─────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │  bom_malzemeler  │
                    └─────────────────┘

┌─────────────────┐      ┌─────────────────┐
│    tezgahlar    │◄────┤ is_emirleri     │
└─────────────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│ tezgah_durum_   │
│      log        │
└─────────────────┘

┌─────────────────┐      ┌─────────────────┐
│ stok_kartlari   │◄────┤     parcalar     │
└─────────────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│  stok_haraket   │
└─────────────────┘
```

## Trigger'lar ve Otomatik İşlemler

### 1. İşlem Süresi Hesaplama Trigger
```sql
CREATE TRIGGER update_islem_suresi
AFTER UPDATE OF bitis ON islem_kayitlari
BEGIN
  UPDATE islem_kayitlari
  SET sure = CAST((julianday(bitis) - julianday(baslangic)) * 24 * 60 AS INTEGER)
  WHERE id = NEW.id;
END;
```

### 2. Stok Güncelleme Trigger
```sql
CREATE TRIGGER update_stok_from_hareket
AFTER INSERT ON stok_kartlari
BEGIN
  -- Giriş işlemi
  IF NEW.tip = 'Giris' THEN
    UPDATE parcalar
    SET stokMiktari = stokMiktari + NEW.miktar
    WHERE id = NEW.parcaId;
  -- Çıkış işlemi
  ELSE
    UPDATE parcalar
    SET stokMiktari = stokMiktari - NEW.miktar
    WHERE id = NEW.parcaId;
  END IF;
END;
```

### 3. Zaman Damgası Güncelleme Trigger
```sql
CREATE TRIGGER update_timestamps
AFTER UPDATE ON is_emirleri
BEGIN
  UPDATE is_emirleri
  SET updatedAt = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;
```

## View'lar (Sanal Tablolar)

### 1. Aktif İş Emirleri View
```sql
CREATE VIEW aktif_is_emirleri AS
SELECT
  ie.*,
  p.adi AS parca_adi,
  p.kodu AS parca_kodu,
  t.adi AS tezgah_adi,
  u.ad || ' ' || u.soyad AS sorumlu_kullanici
FROM is_emirleri ie
LEFT JOIN parcalar p ON ie.parcaId = p.id
LEFT JOIN tezgahlar t ON ie.tezgahId = t.id
LEFT JOIN users u ON ie.userId = u.id
WHERE ie.durum IN (0, 1);
```

### 2. Stok Durumu View
```sql
CREATE VIEW stok_durumu AS
SELECT
  p.id,
  p.adi,
  p.kodu,
  p.stokMiktari AS mevcut_stok,
  p.kritikStok,
  CASE
    WHEN p.stokMiktari <= p.kritikStok THEN 'KRİTİK'
    WHEN p.stokMiktari <= p.kritikStok * 1.2 THEN 'DİKKAT'
    ELSE 'NORMAL'
  END AS durum
FROM parcalar p
WHERE p.aktif = TRUE;
```

### 3. Tezgah Verimlilik View
```sql
CREATE VIEW tezgah_verimlilik AS
SELECT
  t.id,
  t.adi,
  COUNT(ik.id) AS toplam_islem,
  SUM(ik.sure) AS toplam_sure_dakika,
  ROUND(AVG(ik.sure), 2) AS ortalama_sure
FROM tezgahlar t
LEFT JOIN islem_kayitlari ik ON t.id = ik.tezgahId
WHERE ik.baslangic >= date('now', '-30 days')
GROUP BY t.id, t.adi;
```

## Index Optimizasyonları

### Kritik Performans Index'leri

```sql
-- İş emri sorguları için
CREATE INDEX idx_is_emirleri_sorgu_1 ON is_emirleri(durum, terminTarihi);
CREATE INDEX idx_is_emirleri_sorgu_2 ON is_emirleri(tezgahId, durum);

-- Stok sorguları için
CREATE INDEX idx_stok_kartlari_sorgu ON stok_kartlari(parcaId, fisTarihi DESC);

-- BOM sorguları için
CREATE INDEX idx_bom_sorgu ON boms(parcaId, aktif);

-- İşlem kayıtları analizi için
CREATE INDEX idx_islem_analiz ON islem_kayitlari(tezgahId, baslangic DESC);

-- Raporlama için compound index
CREATE INDEX idx_raporlama_1 ON is_emirleri(durum, createdAt);
CREATE INDEX idx_raporlama_2 ON islem_kayitlari(isEmriId, baslangic, bitis);
```

## Veri Bütünlüğü Kısıtları

### 1. Check Constraints
```sql
-- İş emri miktar kısıtı
ALTER TABLE is_emirleri ADD CONSTRAINT chk_miktar_pozitif
CHECK (miktar > 0 AND tamamlananMiktar >= 0 AND tamamlananMiktar <= miktar);

-- Stok miktar kısıtı
ALTER TABLE parcalar ADD CONSTRAINT chk_stok_negatif_yok
CHECK (stokMiktari >= 0);

-- Termin tarihi kısıtı
ALTER TABLE is_emirleri ADD CONSTRAINT chk_termin_gelecek
CHECK (terminTarihi >= date('now', '-30 days'));

-- Öncelik kısıtı
ALTER TABLE is_emirleri ADD CONSTRAINT chk_oncelik_aralik
CHECK (oncelik BETWEEN 1 AND 10);
```

## Veritabanı Bakım ve Optimizasyon

### 1. Regular Maintenance Tasks
```sql
-- VACUUM (boş alanı temizle)
VACUUM;

-- ANALYZE (istatistikleri güncelle)
ANALYZE;

-- REINDEX (index'leri yeniden oluştur)
REINDEX;

-- Integrity check
PRAGMA integrity_check;
```

### 2. Performance Monitoring Queries
```sql
-- En çok kullanılan tablolar
SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;

-- Index kullanım durumu
EXPLAIN QUERY PLAN SELECT * FROM is_emirleri WHERE durum = 1;

-- Tablo boyutları
SELECT
  name,
  COUNT(*) AS row_count,
  ROUND(SUM(LENGTH(sql)) / 1024.0, 2) AS size_kb
FROM sqlite_master m
LEFT JOIN is_emirleri i ON 1=1
WHERE m.type = 'table'
GROUP BY m.name;
```

## Backup ve Geri Yükleme

### 1. Backup Stratejisi
```bash
# Full backup
sqlite3 backend/database.sqlite ".backup backup_$(date +%Y%m%d_%H%M%S).sqlite"

# Incremental backup (WAL mode kullanıyorsanız)
sqlite3 backend/database.sqlite ".backup incremental_backup_$(date +%Y%m%d).sqlite"
```

### 2. Recovery Procedures
```bash
# Restore from backup
cp backup_20241215_120000.sqlite backend/database.sqlite

# Check integrity after restore
sqlite3 backend/database.sqlite "PRAGMA integrity_check;"
```

## Migration Örnekleri

### 1. Yeni Alan Ekleme
```sql
-- Yeni field ekleme
ALTER TABLE is_emirleri ADD COLUMN oncelik INTEGER DEFAULT 5;

-- Mevcut kayıtları güncelleme
UPDATE is_emirleri SET oncelik = 5 WHERE oncelik IS NULL;
```

### 2. Yeni Tablo Oluşturma
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT (hex(randomblob(16))),
  tableName VARCHAR(50) NOT NULL,
  recordId UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  oldValues TEXT, -- JSON formatında
  newValues TEXT, -- JSON formatında
  userId UUID,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## Query Optimizasyon Önerileri

### 1. İyi Pratikler
```sql
-- ✅ İyi: WHERE ile sınırlama
SELECT * FROM is_emirleri
WHERE durum = 1 AND terminTarihi >= '2024-12-01'
ORDER BY terminTarihi ASC
LIMIT 50;

-- ❌ Kötü: Tüm tabloyu çekip uygulamada filtreleme
SELECT * FROM is_emirleri;
```

### 2. JOIN Optimizasyonu
```sql
-- ✅ İyi: Index'li alanlarla JOIN
SELECT ie.*, p.adi
FROM is_emirleri ie
INNER JOIN parcalar p ON ie.parcaId = p.id
WHERE ie.durum = 1;

-- ❌ Kötü: Index'siz alanlarla JOIN
SELECT * FROM is_emirleri ie, parcalar p
WHERE ie.siparisNo = p.cizimNo;
```

### 3. Aggregation Optimizasyonu
```sql
-- ✅ İyi: Subquery ile optimizasyon
SELECT
  p.adi,
  (SELECT COUNT(*) FROM is_emirleri ie WHERE ie.parcaId = p.id) AS is_sayisi
FROM parcalar p;

-- ❌ Kötü: GROUP BY without proper indexing
SELECT p.adi, COUNT(*)
FROM parcalar p
LEFT JOIN is_emirleri ie ON p.id = ie.parcaId
GROUP BY p.id, p.adi;
```