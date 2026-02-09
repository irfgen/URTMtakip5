# ÜRTM Takip Veritabanı Şeması

## Veritabanı Genel Bakış

**Veritabanı Tipi**: SQLite
**ORM**: Sequelize.js
**Dosya Konumu**: `backend/database.sqlite`
**Migration Sistemi**: Umzug

---

## Tablo Listesi

### Üretim Modülleri
1. **is_emirleri** - İş emirleri (Work Orders)
2. **tezgahlar** - Tezgahlar/Makineler (Workstations)
3. **parcalar** - Parçalar (Parts)
4. **boms** - BOM (Bill of Materials)
5. **uretim_plani** - Üretim planı (Ana sistem)
6. **uretim_planlari** - Üretim planı V2 (Basitleştirilmiş)

### Operasyonel Modüller
7. **irsaliyeler** - İrsaliyeler
8. **irsaliye_kalemleri** - İrsaliye kalemleri
9. **faturalar** - Faturalar
10. **fatura_kalemleri** - Fatura kalemleri
11. **fasonlar** - Fason firmalar
12. **fason_is_emirleri** - Fason iş emirleri
13. **sevkiyat** - Sevkiyatlar
14. **sevkiyat_kalemleri** - Sevkiyat kalemleri

### Stok ve Takip
15. **stok_kartlari** - Stok kartları
16. **parca_kayitlari** - Parça kayıtları
17. **stok_takip_listeleri** - Stok takip listeleri

### Personel ve Vardiya
18. **personeller** - Personel
19. **vardiyalar** - Vardiyalar
20. **vardiya_atamalari** - Vardiya atamaları

### Bakım ve Arıza
21. **ariza_bakim** - Arıza/bakım kayıtları
22. **tezgah_durum_loglari** - Tezgah durum logları

### Notlar ve İletişim
23. **notlar** - Notlar
24. **not_kategorileri** - Not kategorileri

### İşlem Kayıtları
25. **islem_kayitlari** - İşlem kayıtları

### Diğer
26. **firmalar** - Firmalar/Tedarikçiler
27. **gruplar** - Gruplar
28. **siparis_dokumanlari** - Sipariş dokümanları
29. **import_jobs** - Import işleri
30. **import_clients** - Import istemcileri

---

## Detaylı Tablo Şemaları

### 1. is_emirleri (İş Emirleri)

```sql
CREATE TABLE is_emirleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_emri_no VARCHAR(50) UNIQUE,
    parca_id INTEGER,
    tezgah_id INTEGER,
    adet INTEGER DEFAULT 1,
    durum VARCHAR(50) DEFAULT 'planlandi',
    oncelik INTEGER DEFAULT 3,
    termin_tarihi DATE,
    tahmini_isleme_suresi INTEGER, -- dakika
    aciklama TEXT,
    created_by INTEGER,
    locked_by INTEGER,
    locked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parca_id) REFERENCES parcalar(id),
    FOREIGN KEY (tezgah_id) REFERENCES tezgahlar(id),
    FOREIGN KEY (created_by) REFERENCES personeller(id),
    FOREIGN KEY (locked_by) REFERENCES personeller(id)
);

CREATE INDEX idx_is_emirleri_durum ON is_emirleri(durum);
CREATE INDEX idx_is_emirleri_tezgah ON is_emirleri(tezgah_id);
CREATE INDEX idx_is_emirleri_termin ON is_emirleri(termin_tarihi);
```

**Durum Values**:
- `planlandi` - Planlandı
- `uretime_hazir` - Üretime hazır
- `uretimde` - Üretimde
- `tamamlandi` - Tamamlandı
- `iptal` - İptal
- `beklemede` - Beklemede

---

### 2. tezgahlar (Tezgahlar/Makineler)

```sql
CREATE TABLE tezgahlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tezgah_adi VARCHAR(100) NOT NULL,
    tezgah_kodu VARCHAR(50) UNIQUE,
    marka VARCHAR(100),
    model VARCHAR(100),
    durum VARCHAR(50) DEFAULT 'idle',
    aktif BOOLEAN DEFAULT 1,
    kapasite INTEGER DEFAULT 1,
    aciklama TEXT,
    son_durum_guncelleme DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tezgahlar_durum ON tezgahlar(durum);
CREATE INDEX idx_tezgahlar_aktif ON tezgahlar(aktif);
```

**Durum Values**:
- `idle` - Boşta
- `calisiyor` - Çalışıyor
- `arizali` - Arızalı
- `bakimda` - Bakımda

---

### 3. parcalar (Parçalar)

```sql
CREATE TABLE parcalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parca_adi VARCHAR(200) NOT NULL,
    parca_kodu VARCHAR(50) UNIQUE,
    stok_kodu VARCHAR(50),
    kategori VARCHAR(100),
    birim VARCHAR(20) DEFAULT 'Adet',
    aciklama TEXT,
    min_stok INTEGER DEFAULT 0,
    mevcut_stok INTEGER DEFAULT 0,
    teknik_resim VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parcalar_kodu ON parcalar(parca_kodu);
CREATE INDEX idx_parcalar_stok_kodu ON parcalar(stok_kodu);
CREATE INDEX idx_parcalar_kategori ON parcalar(kategori);
```

---

### 4. irsaliyeler (İrsaliyeler)

```sql
CREATE TABLE irsaliyeler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    irsaliye_no VARCHAR(50) UNIQUE NOT NULL,
    tedarikci_id INTEGER NOT NULL,
    belge_tarih DATE NOT NULL,
    belge_tipi VARCHAR(20) NOT NULL, -- 'gelis' veya 'cikis'
    tur VARCHAR(20), -- 'alis' veya 'satis'
    durum VARCHAR(50) DEFAULT 'bekliyor',
    aciklama TEXT,
    toplam_kalem INTEGER DEFAULT 0,
    toplam_miktar DECIMAL(10,2) DEFAULT 0,
    created_by INTEGER,
    locked_by INTEGER,
    locked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tedarikci_id) REFERENCES firmalar(id),
    FOREIGN KEY (created_by) REFERENCES personeller(id),
    FOREIGN KEY (locked_by) REFERENCES personeller(id)
);

CREATE INDEX idx_irsaliyeler_no ON irsaliyeler(irsaliye_no);
CREATE INDEX idx_irsaliyeler_tedarikci ON irsaliyeler(tedarikci_id);
CREATE INDEX idx_irsaliyeler_durum ON irsaliyeler(durum);
CREATE INDEX idx_irsaliyeler_tarih ON irsaliyeler(belge_tarih);
CREATE INDEX idx_irsaliyeler_tip ON irsaliyeler(belge_tipi);
```

**Durum Values**:
- `bekliyor` - Bekliyor (eşleşme yok)
- `kismi_eslesti` - Kısmi eşleşti (bazı kalemler eşleşti)
- `tam_eslesti` - Tam eşleşti (tüm kalemler eşleşti)

---

### 5. irsaliye_kalemleri (İrsaliye Kalemleri)

```sql
CREATE TABLE irsaliye_kalemleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    irsaliye_id INTEGER NOT NULL,
    tedarikci_id INTEGER NOT NULL,
    mal_hizmet_adi VARCHAR(255) NOT NULL,
    stok_kodu VARCHAR(100),
    miktar DECIMAL(10,2) NOT NULL,
    birim VARCHAR(20) DEFAULT 'Adet',
    birim_fiyat DECIMAL(10,2),
    toplam_fiyat DECIMAL(10,2),
    aciklama TEXT,
    eslesme_durumu INTEGER DEFAULT 0, -- 0: eşleşmedi, 1: eşleşti
    eslesen_fatura_kalem_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (irsaliye_id) REFERENCES irsaliyeler(id) ON DELETE CASCADE,
    FOREIGN KEY (tedarikci_id) REFERENCES firmalar(id),
    FOREIGN KEY (eslesen_fatura_kalem_id) REFERENCES fatura_kalemleri(id)
);

CREATE INDEX idx_irsaliye_kalemleri_irsaliye ON irsaliye_kalemleri(irsaliye_id);
CREATE INDEX idx_irsaliye_kalemleri_tedarikci ON irsaliye_kalemleri(tedarikci_id);
CREATE INDEX idx_irsaliye_kalemleri_eslesme ON irsaliye_kalemleri(eslesme_durumu);
CREATE INDEX idx_irsaliye_kalemleri_stok_kodu ON irsaliye_kalemleri(stok_kodu);
CREATE INDEX idx_irsaliye_kalemleri_mal_hizmet_adi ON irsaliye_kalemleri(mal_hizmet_adi);

-- Composite index for matching queries
CREATE INDEX idx_irsaliye_kalemleri_match ON irsaliye_kalemleri(stok_kodu, mal_hizmet_adi);
```

---

### 6. faturalar (Faturalar)

```sql
CREATE TABLE faturalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fatura_no VARCHAR(50) UNIQUE NOT NULL,
    tedarikci_id INTEGER NOT NULL,
    fatura_tarihi DATE NOT NULL,
    fatura_tipi VARCHAR(20) NOT NULL, -- 'gelis' veya 'cikis'
    tur VARCHAR(20), -- 'alis' veya 'satis'
    toplam_tutar DECIMAL(15,2) DEFAULT 0,
    kdv_tutar DECIMAL(15,2) DEFAULT 0,
    genel_toplam DECIMAL(15,2) DEFAULT 0,
    durum VARCHAR(50) DEFAULT 'bekliyor',
    aciklama TEXT,
    toplam_kalem INTEGER DEFAULT 0,
    created_by INTEGER,
    locked_by INTEGER,
    locked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tedarikci_id) REFERENCES firmalar(id),
    FOREIGN KEY (created_by) REFERENCES personeller(id),
    FOREIGN KEY (locked_by) REFERENCES personeller(id)
);

CREATE INDEX idx_faturalar_no ON faturalar(fatura_no);
CREATE INDEX idx_faturalar_tedarikci ON faturalar(tedarikci_id);
CREATE INDEX idx_faturalar_durum ON faturalar(durum);
CREATE INDEX idx_faturalar_tarih ON faturalar(fatura_tarihi);
```

---

### 7. fatura_kalemleri (Fatura Kalemleri)

```sql
CREATE TABLE fatura_kalemleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fatura_id INTEGER NOT NULL,
    tedarikci_id INTEGER NOT NULL,
    mal_hizmet_adi VARCHAR(255) NOT NULL,
    stok_kodu VARCHAR(100),
    miktar DECIMAL(10,2) NOT NULL,
    birim VARCHAR(20) DEFAULT 'Adet',
    birim_fiyat DECIMAL(10,2),
    kdv_orani INTEGER DEFAULT 20,
    kdv_tutar DECIMAL(10,2),
    ara_toplam DECIMAL(10,2),
    toplam_fiyat DECIMAL(10,2),
    aciklama TEXT,
    eslesme_durumu INTEGER DEFAULT 0, -- 0: eşleşmedi, 1: eşleşti
    eslesen_irsaliye_kalem_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fatura_id) REFERENCES faturalar(id) ON DELETE CASCADE,
    FOREIGN KEY (tedarikci_id) REFERENCES firmalar(id),
    FOREIGN KEY (eslesen_irsaliye_kalem_id) REFERENCES irsaliye_kalemleri(id)
);

CREATE INDEX idx_fatura_kalemleri_fatura ON fatura_kalemleri(fatura_id);
CREATE INDEX idx_fatura_kalemleri_tedarikci ON fatura_kalemleri(tedarikci_id);
CREATE INDEX idx_fatura_kalemleri_eslesme ON fatura_kalemleri(eslesme_durumu);
CREATE INDEX idx_fatura_kalemleri_stok_kodu ON fatura_kalemleri(stok_kodu);
CREATE INDEX idx_fatura_kalemleri_mal_hizmet_adi ON fatura_kalemleri(mal_hizmet_adi);

-- Composite index for matching queries
CREATE INDEX idx_fatura_kalemleri_match ON fatura_kalemleri(stok_kodu, mal_hizmet_adi);
```

---

### 8. bom (BOM - Bill of Materials)

```sql
CREATE TABLE boms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parca_id INTEGER NOT NULL,
    ust_bom_id INTEGER, -- Null ise ana BOM
    malzeme_adedi INTEGER DEFAULT 1,
    kayip_orani DECIMAL(5,2) DEFAULT 0,
    aciklama TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parca_id) REFERENCES parcalar(id),
    FOREIGN KEY (ust_bom_id) REFERENCES boms(id)
);

CREATE INDEX idx_boms_parca ON boms(parca_id);
CREATE INDEX idx_boms_ust ON boms(ust_bom_id);
```

---

### 9. stok_kartlari (Stok Kartları)

```sql
CREATE TABLE stok_kartlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stok_kodu VARCHAR(50) UNIQUE NOT NULL,
    stok_adi VARCHAR(200) NOT NULL,
    kategori VARCHAR(100),
    birim VARCHAR(20) DEFAULT 'Adet',
    mevcut_stok INTEGER DEFAULT 0,
    min_stok INTEGER DEFAULT 0,
    max_stok INTEGER,
    kritik_stok INTEGER DEFAULT 0,
    birim_maliyet DECIMAL(10,2),
    aciklama TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stok_kartlari_kodu ON stok_kartlari(stok_kodu);
CREATE INDEX idx_stok_kartlari_kategori ON stok_kartlari(kategori);
```

---

### 10. firmalar (Firmalar/Tedarikçiler)

```sql
CREATE TABLE firmalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firma_adi VARCHAR(200) NOT NULL,
    firma_kodu VARCHAR(50) UNIQUE,
    vergi_no VARCHAR(20),
    vergi_dairesi VARCHAR(100),
    telefon VARCHAR(20),
    eposta VARCHAR(100),
    webSitesi VARCHAR(150),
    adres TEXT,
    il VARCHAR(50),
    ilce VARCHAR(50),
    ulke VARCHAR(50) DEFAULT 'Türkiye',
    firma_tipi VARCHAR(50), -- 'tedarikci', 'musteri', 'fason', 'diger'
    aktif BOOLEAN DEFAULT 1,
    aciklama TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_firmalar_kodu ON firmalar(firma_kodu);
CREATE INDEX idx_firmalar_tip ON firmalar(firma_tipi);
CREATE INDEX idx_firmalar_aktif ON firmalar(aktif);
```

---

### 11. personeller (Personel)

```sql
CREATE TABLE personeller (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personel_adi VARCHAR(100) NOT NULL,
    personel_kodu VARCHAR(50) UNIQUE,
    eposta VARCHAR(100) UNIQUE,
    telefon VARCHAR(20),
    departman VARCHAR(50),
    unvan VARCHAR(50),
    aktif BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_personeller_kodu ON personeller(personel_kodu);
CREATE INDEX idx_personeller_aktif ON personeller(aktif);
```

---

### 12. tezgah_durum_loglari (Tezgah Durum Logları)

```sql
CREATE TABLE tezgah_durum_loglari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tezgah_id INTEGER NOT NULL,
    eski_durum VARCHAR(50),
    yeni_durum VARCHAR(50),
    degistiren_id INTEGER,
    aciklama TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tezgah_id) REFERENCES tezgahlar(id),
    FOREIGN KEY (degistiren_id) REFERENCES personeller(id)
);

CREATE INDEX idx_tezgah_durum_loglari_tezgah ON tezgah_durum_loglari(tezgah_id);
CREATE INDEX idx_tezgah_durum_loglari_tarih ON tezgah_durum_loglari(created_at);
```

---

### 13. ariza_bakim (Arıza/Bakım Kayıtları)

```sql
CREATE TABLE ariza_bakim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tezgah_id INTEGER,
    ariza_turu VARCHAR(50), -- 'ariza', 'planli_bakim', 'onleyici_bakim'
    baslama_tarihi DATETIME,
    bitis_tarihi DATETIME,
    toplam_sure INTEGER, -- dakika
    aciklama TEXT,
    yapilan_islemler TEXT,
    personel_id INTEGER,
    durum VARCHAR(50) DEFAULT 'acik', -- 'acik', 'tamamlandi', 'iptal'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tezgah_id) REFERENCES tezgahlar(id),
    FOREIGN KEY (personel_id) REFERENCES personeller(id)
);

CREATE INDEX idx_ariza_bakim_tezgah ON ariza_bakim(tezgah_id);
CREATE INDEX idx_ariza_bakim_durum ON ariza_bakim(durum);
CREATE INDEX idx_ariza_bakim_tarih ON ariza_bakim(baslama_tarihi);
```

---

### 14. uretim_plani (Üretim Planı - Ana Sistem)

```sql
CREATE TABLE uretim_plani (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_adi VARCHAR(200) NOT NULL,
    baslangic_tarih DATE NOT NULL,
    bitis_tarih DATE NOT NULL,
    plan_tipi VARCHAR(50) DEFAULT 'makine_bazli', -- 'makine_bazli', 'ozel_liste', 'karma'
    durum VARCHAR(50) DEFAULT 'taslak', -- 'taslak', 'onaylandi', 'aktif', 'tamamlandi'
    aciklama TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES personeller(id)
);

CREATE INDEX idx_uretim_plani_durum ON uretim_plani(durum);
CREATE INDEX idx_uretim_plani_tarih ON uretim_plani(baslangic_tarih);
```

---

### 15. fasonlar (Fason Firmalar)

```sql
CREATE TABLE fasonlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fason_adi VARCHAR(200) NOT NULL,
    fason_kodu VARCHAR(50) UNIQUE,
    vergi_no VARCHAR(20),
    telefon VARCHAR(20),
    eposta VARCHAR(100),
    adres TEXT,
    il VARCHAR(50),
    ilce VARCHAR(50),
    aktif BOOLEAN DEFAULT 1,
    aciklama TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fasonlar_kodu ON fasonlar(fason_kodu);
CREATE INDEX idx_fasonlar_aktif ON fasonlar(aktif);
```

---

### 16. fason_is_emirleri (Fason İş Emirleri)

```sql
CREATE TABLE fason_is_emirleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fason_id INTEGER NOT NULL,
    is_emri_id INTEGER,
    siparis_no VARCHAR(50),
    adet INTEGER DEFAULT 1,
    birim_fiyat DECIMAL(10,2),
    toplam_fiyat DECIMAL(10,2),
    termin_tarihi DATE,
    durum VARCHAR(50) DEFAULT 'bekleniyor', -- 'bekleniyor', 'uretimde', 'tamamlandi', 'teslim_edildi'
    aciklama TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fason_id) REFERENCES fasonlar(id),
    FOREIGN KEY (is_emri_id) REFERENCES is_emirleri(id)
);

CREATE INDEX idx_fason_is_emirleri_fason ON fason_is_emirleri(fason_id);
CREATE INDEX idx_fason_is_emirleri_durum ON fason_is_emirleri(durum);
```

---

### 17. sevkiyat (Sevkiyatlar)

```sql
CREATE TABLE sevkiyat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    siparis_no VARCHAR(50) UNIQUE,
    musteri_id INTEGER,
    sevkiyat_tarihi DATE,
    teslim_tarihi DATE,
    adres TEXT,
    durum VARCHAR(50) DEFAULT 'hazirlaniyor', -- 'hazirlaniyor', 'yolda', 'teslim_edildi', 'iptal'
    toplam_tutar DECIMAL(15,2),
    aciklama TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (musteri_id) REFERENCES firmalar(id)
);

CREATE INDEX idx_sevkiyat_siparis ON sevkiyat(siparis_no);
CREATE INDEX idx_sevkiyat_musteri ON sevkiyat(musteri_id);
CREATE INDEX idx_sevkiyat_durum ON sevkiyat(durum);
```

---

### 18. sevkiyat_kalemleri (Sevkiyat Kalemleri)

```sql
CREATE TABLE sevkiyat_kalemleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sevkiyat_id INTEGER NOT NULL,
    parca_id INTEGER,
    miktar INTEGER NOT NULL,
    birim VARCHAR(20) DEFAULT 'Adet',
    aciklama TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sevkiyat_id) REFERENCES sevkiyat(id) ON DELETE CASCADE,
    FOREIGN KEY (parca_id) REFERENCES parcalar(id)
);

CREATE INDEX idx_sevkiyat_kalemleri_sevkiyat ON sevkiyat_kalemleri(sevkiyat_id);
CREATE INDEX idx_sevkiyat_kalemleri_parca ON sevkiyat_kalemleri(parca_id);
```

---

### 19. notlar (Notlar)

```sql
CREATE TABLE notlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baslik VARCHAR(200) NOT NULL,
    icerik TEXT,
    kategori_id INTEGER,
    oncelik INTEGER DEFAULT 3, -- 1: yüksek, 2: orta, 3: normal
    etiketler VARCHAR(500), -- JSON array
    created_by INTEGER,
    aktif BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES not_kategorileri(id),
    FOREIGN KEY (created_by) REFERENCES personeller(id)
);

CREATE INDEX idx_notlar_kategori ON notlar(kategori_id);
CREATE INDEX idx_notlar_oncelik ON notlar(oncelik);
CREATE INDEX idx_notlar_aktif ON notlar(aktif);
```

---

### 20. not_kategorileri (Not Kategorileri)

```sql
CREATE TABLE not_kategorileri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategori_adi VARCHAR(100) NOT NULL UNIQUE,
    aciklama TEXT,
    renk VARCHAR(20), -- Hex color code
    aktif BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_not_kategorileri_aktif ON not_kategorileri(aktif);
```

---

### 21. islem_kayitlari (İşlem Kayıtları)

```sql
CREATE TABLE islem_kayitlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    islem_tipi VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
    tablo_adi VARCHAR(50),
    kayit_id INTEGER,
    eski_degerler TEXT, -- JSON
    yeni_degerler TEXT, -- JSON
    aciklama TEXT,
    ip_adresi VARCHAR(45),
    user_agent TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES personeller(id)
);

CREATE INDEX idx_islem_kayitlari_tip ON islem_kayitlari(islem_tipi);
CREATE INDEX idx_islem_kayitlari_tablo ON islem_kayitlari(tablo_adi);
CREATE INDEX idx_islem_kayitlari_kayit ON islem_kayitlari(kayit_id);
CREATE INDEX idx_islem_kayitlari_tarih ON islem_kayitlari(created_at);
```

---

### 22. parca_kayitlari (Parça Kayıtları)

```sql
CREATE TABLE parca_kayitlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parca_id INTEGER NOT NULL,
    islem_turu VARCHAR(20) NOT NULL, -- 'giris', 'cikis', 'uretim', 'sayim'
    miktar INTEGER NOT NULL,
    birim VARCHAR(20) DEFAULT 'Adet',
    birim_fiyat DECIMAL(10,2),
    toplam_fiyat DECIMAL(10,2),
    ilgili_belge VARCHAR(50), -- irsaliye_no, fatura_no, etc.
    aciklama TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parca_id) REFERENCES parcalar(id),
    FOREIGN KEY (created_by) REFERENCES personeller(id)
);

CREATE INDEX idx_parca_kayitlari_parca ON parca_kayitlari(parca_id);
CREATE INDEX idx_parca_kayitlari_tur ON parca_kayitlari(islem_turu);
CREATE INDEX idx_parca_kayitlari_tarih ON parca_kayitlari(created_at);
```

---

## İlişki (Association) Yapıları

### Bir-Çok (One-to-Many) İlişkiler

**Firma → İrsaliye**:
```javascript
Firma.hasMany(Irsaliye, { foreignKey: 'tedarikci_id', as: 'irsaliyeler' });
Irsaliye.belongsTo(Firma, { foreignKey: 'tedarikci_id', as: 'tedarikci' });
```

**İrsaliye → İrsaliye Kalem**:
```javascript
Irsaliye.hasMany(IrsaliyeKalem, { foreignKey: 'irsaliye_id', as: 'kalemler' });
IrsaliyeKalem.belongsTo(Irsaliye, { foreignKey: 'irsaliye_id' });
```

**Parça → İş Emri**:
```javascript
Parca.hasMany(IsEmri, { foreignKey: 'parca_id', as: 'is_emirleri' });
IsEmri.belongsTo(Parca, { foreignKey: 'parca_id', as: 'parca' });
```

**Tezgah → İş Emri**:
```javascript
Tezgah.hasMany(IsEmri, { foreignKey: 'tezgah_id', as: 'planlanan_isler' });
IsEmri.belongsTo(Tezgah, { foreignKey: 'tezgah_id', as: 'tezgah' });
```

### Kendine-Referans (Self-Referencing) İlişkiler

**BOM Hiyerarşi**:
```javascript
Bom.hasMany(Bom, { foreignKey: 'ust_bom_id', as: 'alt_bomlar' });
Bom.belongsTo(Bom, { foreignKey: 'ust_bom_id', as: 'ust_bom' });
```

### Çok-Çok (Many-to-Many) İlişkiler

**Parca ↔ BOM** (Ortak tablo ile):
```javascript
Parca.hasMany(Bom, { foreignKey: 'parca_id' });
Bom.hasMany(Parca, { through: 'bom_kalemleri', foreignKey: 'bom_id' });
```

---

## Index Stratejisi

### Performans İndeksleri
1. **Arama sorguları**: `stok_kodu`, `parca_kodu`, `fatura_no`, `irsaliye_no`
2. **Filtreleme**: `durum`, `aktif`, `belge_tarih`
3. **Sıralama**: `created_at`, `termin_tarihi`
4. **Composite**: `(stok_kodu, mal_hizmet_adi)` için eşleşme sorguları

### Unique Constraints
- `irsaliye_no`
- `fatura_no`
- `parca_kodu`
- `stok_kodu`
- `personel_kodu`

---

## Veri Bütünlüğü ve Constraints

### Cascade Delete
- `irsaliye_kalemleri` → `irsaliyeler` (CASCADE)
- `fatura_kalemleri` → `faturalar` (CASCADE)
- `sevkiyat_kalemleri` → `sevkiyat` (CASCADE)

### Default Values
- `durum`: 'bekliyor', 'planlandi', 'taslak' (tabloya göre)
- `aktif`: 1 (true)
- `birim`: 'Adet'
- `created_at`, `updated_at`: Auto timestamp

### Validation Rules
- `miktar` > 0
- `adet` >= 1
- `kdv_orani` >= 0 AND <= 100
- `kayip_orani` >= 0 AND < 1

---

## Migration Geçmişi

| Migration | Tarih | Açıklama |
|-----------|-------|----------|
| Initial | 2024-01 | İlk veritabanı şeması |
| 20240912 | 2024-09 | tahmini_isleme_suresi eklendi |
| 20250924 | 2025-09 | BOM cost_fields eklendi |
| 20250701 | 2025-07 | notlar ve not_kategorileri tabloları eklendi |

---

## Veritabanı Bakım İpuçları

### Yedekleme
```bash
cp backend/database.sqlite backup/database-$(date +%Y%m%d).sqlite
```

### VACUUM (Veritabanı Sıkıştırma)
```sql
VACUUM;
```

### ANALYZE (Query Optimizer)
```sql
ANALYZE;
```

### Reindex
```sql
REINDEX;
```

### Export to SQL
```bash
sqlite3 backend/database.sqlite .dump > backup/export.sql
```

---

## Veritabanı İstatistikleri

**Tahmini Tablo Boyutları** (kayıt sayısı 1000+):
| Tablo | Tahmini Boyut | Index Boyutu |
|-------|---------------|--------------|
| is_emirleri | ~200 KB | ~50 KB |
| irsaliyeler | ~150 KB | ~40 KB |
| irsaliye_kalemleri | ~500 KB | ~120 KB |
| parcalar | ~100 KB | ~30 KB |
| tezgahlar | ~20 KB | ~10 KB |

---

## SQLite Spesifik Özellikler

### Datetime Storage
- SQLite datetime stored as TEXT (ISO8601 format)
- Example: `2024-01-15T10:30:00.000Z`
- Timezone: UTC

### Numeric Precision
- `DECIMAL(10,2)` stored as REAL
- `INTEGER` stored as 8-byte signed integer

### Text Encoding
- UTF-8 encoding
- Case-sensitive LIKE (use COLLATE NOCASE for case-insensitive)

---

## Trigger ve View'lar

Şu anda aktif trigger veya view bulunmamaktadır. İleride eklenebilir:
- **View**: `v_is_emri_ozet` - İş emri özet görünümü
- **Trigger**: `before_insert_irsaliye_kalem` - Toplam fiyat hesaplama
- **Trigger**: `after_update_is_emri` - Durum değişikliği loglama
