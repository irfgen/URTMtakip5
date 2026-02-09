# ÜRTM Takip - Veritabanı Şema Dokümantasyonu

## Veritabanı Genel Bakış

Bu dokümantasyon, ÜRTM Takip sisteminin veritabanı yapısını, tablolarını ve ilişkilerini açıklar.

### Temel Bilgiler

- **Veritabanı**: SQLite
- **ORM**: Sequelize
- **Konum**: `backend/database.sqlite`
- **Migration Sistemi**: Umzug
- **Model Konumu**: `backend/src/models/`

---

## Tablolar ve İlişkiler

### ER Diagram (Metin)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   is_emirleri   │───────│    tezgahlar    │───────│  tezgah_durum_  │
│                 │       │                 │       │      log        │
└─────────────────┘       └─────────────────┘       └─────────────────┘
        │                                                         │
        │                                                         │
        ▼                                                         │
┌─────────────────┐                                              │
│     parcalar    │                                              │
│                 │                                              │
└─────────────────┘                                              │
        │                                                         │
        │                                                         │
        ▼                                                         │
┌─────────────────┐                                              │
│      boms       │                                              │
│  (hierarchical) │                                              │
└─────────────────┘                                              │
                                                               │
┌─────────────────┐       ┌─────────────────┐                   │
│  uretim_plani   │───────│  islem_kayitlari│───────────────────┘
│                 │       │                 │
└─────────────────┘       └─────────────────┘
        │                         │
        │                         │
        ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│  stok_kartlari  │       │ is_emri_ozet    │
│                 │       │                 │
└─────────────────┘       └─────────────────┘
```

---

## Temel Tablolar

### 1. is_emirleri (İş Emirleri)

Üretim iş emirlerinin ana tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| is_emri_id | INTEGER (PK) | Benzersiz iş emri ID |
| is_emri_no | STRING (UNIQUE) | İş emri numarası |
| is_adi | STRING | İş adı |
| plan_liste_no | STRING | Plan liste numarası |
| adet | INTEGER | Üretim adedi |
| malzeme | STRING | Malzeme bilgisi |
| teslim_tarihi | DATE | Teslim tarihi |
| oncelik | ENUM | Öncelik (dusuk, normal, yuksek, acil) |
| durum | STRING | İş durumu |
| tezgah_id | INTEGER (FK) | Atanan tezgah |
| uretim_plani_id | INTEGER (FK) | Üretim planı |
| parca_kodu | STRING (FK) | Parça kodu |
| aciklama | TEXT | Açıklama |
| hareketler | JSON | Hareket geçmişi |
| setup_sayisi | INTEGER | Setup sayısı |
| cnc_suresi | FLOAT | CNC süresi |
| is_zaman_uzunlugu | FLOAT | İş zaman uzunluğu (saat) |
| tahmini_isleme_suresi | INTEGER | Tahmini işleme süresi (vardiya) |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `belongsTo` Tezgah
- `belongsTo` UretimPlani
- `belongsTo` Parca
- `hasMany` IslemKaydi
- `hasOne` IsEmriOzet
- `hasMany` FasonIsEmri
- `hasMany` TezgahZamanPlani

---

### 2. tezgahlar (Tezgahlar/Makineler)

Üretim tezgahlarının tanım tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| tezgah_id | INTEGER (PK) | Benzersiz tezgah ID |
| tezgah_adi | STRING | Tezgah adı |
| tezgah_kodu | STRING | Tezgah kodu |
| durum | STRING | Durum (bos, calisiyor, bakim, ariza) |
| kapasite | INTEGER | Günlük kapasite |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `hasMany` IsEmri
- `hasMany` TezgahDurumLog
- `hasMany` TezgahZamanPlani

---

### 3. parcalar (Parça Katalog)

Parça bilgileri tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| parca_kodu | STRING (PK) | Benzersiz parça kodu |
| parca_adi | STRING | Parça adı |
| aciklama | TEXT | Açıklama |
| birim | STRING | Birim |
| stok_miktari | INTEGER | Stok miktarı |
| kritik_stok | INTEGER | Kritik stok seviyesi |
| teknik_resim | STRING | Teknik resim yolu |
| ozellikler | JSON | Parça özellikleri |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `hasMany` IsEmri
- `hasMany` Bom
- `hasMany` StokKarti

---

### 4. boms (Bill of Materials)

Malzeme listesi hiyerarşik yapısı.

| Alan | Tip | Açıklama |
|------|-----|----------|
| bom_id | INTEGER (PK) | Benzersiz BOM ID |
| parca_kodu | STRING (FK) | Parça kodu |
| ust_bom_id | INTEGER (FK) | Üst BOM ID (hiyerarşi için) |
| malzeme_kodu | STRING | Malzeme kodu |
| malzeme_adi | STRING | Malzeme adı |
| miktar | FLOAT | Miktar |
| birim | STRING | Birim |
| birim_maliyet | DECIMAL | Birim maliyet |
| toplam_maliyet | DECIMAL | Toplam maliyet |
| seviye | INTEGER | Hiyerarşi seviyesi |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `belongsTo` Parca
- `belongsTo` Bom (self-referential for hierarchy)

---

### 5. uretim_plani (Üretim Planları - Ana Sistem)

Excel tabanlı üretim planlama sistemi.

| Alan | Tip | Açıklama |
|------|-----|----------|
| plan_id | INTEGER (PK) | Benzersiz plan ID |
| plan_adi | STRING | Plan adı |
| plan_turu | ENUM | Plan türü (makine, ozel_liste, karma) |
| baslangic_tarihi | DATE | Başlangıç tarihi |
| bitis_tarihi | DATE | Bitiş tarihi |
| durum | STRING | Durum |
| excel_dosyasi | STRING | Excel dosya yolu |
| veri | JSON | Plan verileri (JSON) |
| kritik_stok_bilgisi | JSON | Kritik stok bilgisi |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `hasMany` IsEmri

---

### 6. uretim_planlari (Üretim Planları V2 - Basitleştirilmiş)

JSON tabanlı basitleştirilmiş üretim planlama sistemi.

| Alan | Tip | Açıklama |
|------|-----|----------|
| plan_id | INTEGER (PK) | Benzersiz plan ID |
| plan_adi | STRING | Plan adı |
| aciklama | TEXT | Açıklama |
| is_emri_listesi | JSON | İş emri listesi |
| durum | STRING | Durum |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

---

### 7. stok_kartlari (Stok Kartları)

Stok yönetimi tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| stok_karti_id | INTEGER (PK) | Benzersiz stok kartı ID |
| stok_kodu | STRING | Stok kodu |
| stok_adi | STRING | Stok adı |
| birim | STRING | Birim |
| mevcut_stok | INTEGER | Mevcut stok |
| giren_sayisi | INTEGER | Giren toplam |
| cikan_sayisi | INTEGER | Çıkan toplam |
| kritik_seviye | INTEGER | Kritik seviye |
| depo_yeri | STRING | Depo yeri |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `hasMany` ParcaKayitlari

---

### 8. islem_kayitlari (İşlem Kayıtları)

İşlem geçmişi ve log tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| kayit_id | INTEGER (PK) | Benzersiz kayıt ID |
| is_emri_no | STRING (FK) | İş emri numarası |
| islem_turu | STRING | İşlem türü |
| islem_aciklamasi | TEXT | İşlem açıklaması |
| islem_zamani | DATE | İşlem zamanı |
| kullanici | STRING | Kullanıcı |
| detaylar | JSON | Detaylar (JSON) |

**İlişkiler**:
- `belongsTo` IsEmri

---

### 9. is_emri_ozet (İş Emri Özetleri)

İş emri performans özeti tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| ozet_id | INTEGER (PK) | Benzersiz özet ID |
| is_emri_id | INTEGER (FK) | İş emri ID |
| toplam_sure | FLOAT | Toplam süre |
| uretim_suresi | FLOAT | Üretim süresi |
| bekleme_suresi | FLOAT | Bekleme süresi |
| ariza_suresi | FLOAT | Arıza süresi |
| verimlilik | FLOAT | Verimlilik oranı |
| tamamlanan_adet | INTEGER | Tamamlanan adet |
| hurda_adet | INTEGER | Hurda adet |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `belongsTo` IsEmri

---

### 10. tezgah_durum_log (Tezgah Durum Logları)

Tezgah durum değişiklik log tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| log_id | INTEGER (PK) | Benzersiz log ID |
| tezgah_id | INTEGER (FK) | Tezgah ID |
| eski_durum | STRING | Eski durum |
| yeni_durum | STRING | Yeni durum |
| degisiklik_zamani | DATE | Değişiklik zamanı |
| aciklama | TEXT | Açıklama |

**İlişkiler**:
- `belongsTo` Tezgah

---

### 11. fason_is_emirleri (Fason İş Emirleri)

Fason üretim iş emirleri tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| fason_is_id | INTEGER (PK) | Benzersiz fason iş ID |
| is_emri_id | INTEGER (FK) | Ana iş emri ID |
| fason_id | INTEGER (FK) | Fason firma ID |
| aciklama | TEXT | Açıklama |
| durum | STRING | Durum |
| baslama_tarihi | DATE | Başlama tarihi |
| bitis_tarihi | DATE | Bitiş tarihi |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `belongsTo` IsEmri
- `belongsTo` Fason

---

### 12. fason_gruplar (Fason Grupları)

Fason grupları tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| grup_id | INTEGER (PK) | Benzersiz grup ID |
| grup_adi | STRING | Grup adı |
| aciklama | TEXT | Açıklama |
| durum | STRING | Durum |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

---

### 13. ariza_bakim (Arıza ve Bakım)

Makine arıza ve bakım kayıtları tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| kayit_id | INTEGER (PK) | Benzersiz kayıt ID |
| tezgah_id | INTEGER (FK) | Tezgah ID |
| kayit_turu | ENUM | Kayıt türü (ariza, bakim) |
| baslik | STRING | Başlık |
| aciklama | TEXT | Açıklama |
| durum | STRING | Durum |
| baslama_tarihi | DATE | Başlama tarihi |
| bitis_tarihi | DATE | Bitiş tarihi |
| toplam_sure | FLOAT | Toplam süre |
| personel | STRING | Sorumlu personel |
| maliyet | DECIMAL | Maliyet |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `belongsTo` Tezgah

---

### 14. sevkiyat (Sevkiyatlar)

Sevkiyat yönetimi tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| sevkiyat_id | INTEGER (PK) | Benzersiz sevkiyat ID |
| sevkiyat_no | STRING | Sevkiyat numarası |
| musteri_adi | STRING | Müşteri adı |
| teslim_adresi | TEXT | Teslim adresi |
| teslim_tarihi | DATE | Teslim tarihi |
| durum | STRING | Durum |
| aciklama | TEXT | Açıklama |
| resim_yolu | STRING | Resim yolu |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

---

### 15. notlar (Notlar)

Not yönetim sistemi tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| not_id | INTEGER (PK) | Benzersiz not ID |
| baslik | STRING | Başlık |
| icerik | TEXT | İçerik |
| kategori_id | INTEGER (FK) | Kategori ID |
| oncelik | ENUM | Öncelik (dusuk, normal, yuksek) |
| etiketler | JSON | Etiketler |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `belongsTo` NotKategorileri

---

### 16. not_kategorileri (Not Kategorileri)

Not kategorileri tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| kategori_id | INTEGER (PK) | Benzersiz kategori ID |
| kategori_adi | STRING | Kategori adı |
| aciklama | TEXT | Açıklama |
| renk | STRING | Renk kodu |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `hasMany` Notlar

---

### 17. parca_kayitlari (Parça Kayıtları)

Parça hareket kayıtları tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| kayit_id | INTEGER (PK) | Benzersiz kayıt ID |
| stok_karti_id | INTEGER (FK) | Stok kartı ID |
| islem_turu | ENUM | İşlem türü (giris, cikis, transfer) |
| miktar | INTEGER | Miktar |
| birim | STRING | Birim |
| aciklama | TEXT | Açıklama |
| islem_tarihi | DATE | İşlem tarihi |
| olusturma_tarihi | DATE | Oluşturulma tarihi |

**İlişkiler**:
- `belongsTo` StokKarti

---

### 18. tezgah_zaman_plani (Tezgah Zaman Planı)

Tezgah zaman planlaması tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| plan_id | INTEGER (PK) | Benzersiz plan ID |
| tezgah_id | INTEGER (FK) | Tezgah ID |
| is_emri_id | INTEGER (FK) | İş emri ID |
| baslama_zamani | DATE | Başlama zamanı |
| bitis_zamani | DATE | Bitiş zamanı |
| durum | STRING | Durum |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `belongsTo` Tezgah
- `belongsTo` IsEmri

---

### 19. vardiya (Vardiyalar)

Vardiya yönetimi tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| vardiya_id | INTEGER (PK) | Benzersiz vardiya ID |
| vardiya_adi | STRING | Vardiya adı |
| baslama_saati | TIME | Başlama saati |
| bitis_saati | TIME | Bitiş saati |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

---

### 20. personel (Personel)

Personel yönetimi tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| personel_id | INTEGER (PK) | Benzersiz personel ID |
| adi | STRING | Adı |
| soyadi | STRING | Soyadı |
| sicil_no | STRING | Sicil numarası |
| unvan | STRING | Unvan |
| departman | STRING | Departman |
| telefon | STRING | Telefon |
| email | STRING | E-posta |
| durum | STRING | Durum |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

---

### 21. vardiya_atama (Vardiya Atamaları)

Vardiya personel atamaları tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| atama_id | INTEGER (PK) | Benzersiz atama ID |
| vardiya_id | INTEGER (FK) | Vardiya ID |
| personel_id | INTEGER (FK) | Personel ID |
| tezgah_id | INTEGER (FK) | Tezgah ID |
| atama_tarihi | DATE | Atama tarihi |
| durum | STRING | Durum |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `belongsTo` Vardiya
- `belongsTo` Personel
- `belongsTo` Tezgah

---

### 22. makina (Makineler)

Makina yönetimi tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| makina_id | INTEGER (PK) | Benzersiz makina ID |
| makina_adi | STRING | Makina adı |
| makina_kodu | STRING | Makina kodu |
| sinif_id | INTEGER (FK) | Sınıf ID |
| durum | STRING | Durum |
| ozellikler | JSON | Özellikler |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `belongsTo` MakinaSinifi

---

### 23. makina_sinifi (Makina Sınıfları)

Makina sınıflandırma tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| sinif_id | INTEGER (PK) | Benzersiz sınıf ID |
| sinif_adi | STRING | Sınıf adı |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `hasMany` Makina

---

### 24. firma (Firmalar)

Firma yönetimi tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| firma_id | INTEGER (PK) | Benzersiz firma ID |
| firma_adi | STRING | Firma adı |
| vergi_no | STRING | Vergi numarası |
| adres | TEXT | Adres |
| telefon | STRING | Telefon |
| email | STRING | E-posta |
| firma_turu | ENUM | Firma türü (musteri, tedarikci, fason) |
| durum | STRING | Durum |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

---

### 25. tedarik_talebi (Tedarik Talepleri)

Tedarik talepleri tablosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| talep_id | INTEGER (PK) | Benzersiz talep ID |
| talep_no | STRING | Talep numarası |
| stok_karti_id | INTEGER (FK) | Stok kartı ID |
| miktar | INTEGER | Miktar |
| birim | STRING | Birim |
| talep_tarihi | DATE | Talep tarihi |
| ihtiyac_tarihi | DATE | İhtiyaç tarihi |
| durum | STRING | Durum |
| aciklama | TEXT | Açıklama |
| olusturma_tarihi | DATE | Oluşturulma tarihi |
| guncelleme_tarihi | DATE | Güncelleme tarihi |

**İlişkiler**:
- `belongsTo` StokKarti

---

## İndeksler

### Temel İndeksler

```sql
-- is_emirleri
CREATE INDEX idx_is_emirleri_durum ON is_emirleri(durum);
CREATE INDEX idx_is_emirleri_tezgah ON is_emirleri(tezgah_id);
CREATE INDEX idx_is_emirleri_teslim ON is_emirleri(teslim_tarihi);

-- parcalar
CREATE INDEX idx_parcalar_stok ON parcalar(stok_miktari);

-- tezgahlar
CREATE INDEX idx_tezgahlar_durum ON tezgahlar(durum);

-- stok_kartlari
CREATE INDEX idx_stok_kartlari_kod ON stok_kartlari(stok_kodu);
CREATE INDEX idx_stok_kartlari_mevcut ON stok_kartlari(mevcut_stok);

-- islem_kayitlari
CREATE INDEX idx_islem_kayitlari_emir ON islem_kayitlari(is_emri_no);
CREATE INDEX idx_islem_kayitlari_zaman ON islem_kayitlari(islem_zamani);
```

---

## Migration Geçmişi

### Migration Dosyaları

| Dosya | Açıklama |
|-------|----------|
| `20240315000000-create-is-emirleri.js` | İş emirleri tablosu |
| `20240316000000-create-tezgahlar.js` | Tezgahlar tablosu |
| `20240316000003-create-is-emirleri.js` | Gelişmiş iş emirleri yapısı |
| `20240912000001-add-tahmini-isleme-suresi.js` | İşleme süresi takibi |
| `20250701000001-create-notlar-tables.js` | Notlar sistemi |
| `20250924_add_cost_fields_to_boms.js` | BOM maliyet alanları |

### Migration Komutları

```bash
# Backend dizininde
cd backend

# Tüm migration'ları çalıştır
npm run migrate

# Belirli bir modül için migration
npm run migrate-durum

# Migration geri alma
npm run rollback-durum-migration

# Durum kontrolü
npm run check-durum-status
```

---

## Veritabanı İlişkileri (Associations)

### One-to-Many İlişkiler

```javascript
// Tezgah -> İş Emirleri
Tezgah.hasMany(IsEmri, { foreignKey: 'tezgah_id' });
IsEmri.belongsTo(Tezgah, { foreignKey: 'tezgah_id' });

// Parça -> BOM
Parca.hasMany(Bom, { foreignKey: 'parca_kodu' });
Bom.belongsTo(Parca, { foreignKey: 'parca_kodu' });

// İş Emri -> İşlem Kayıtları
IsEmri.hasMany(IslemKaydi, { foreignKey: 'is_emri_no' });
IslemKaydi.belongsTo(IsEmri, { foreignKey: 'is_emri_no' });
```

### One-to-One İlişkiler

```javascript
// İş Emri -> İş Emri Özeti
IsEmri.hasOne(IsEmriOzet, { foreignKey: 'is_emri_id' });
IsEmriOzet.belongsTo(IsEmri, { foreignKey: 'is_emri_id' });
```

### Many-to-Many İlişkiler

```javascript
// Vardiya <-> Personel (via VardiyaAtama)
Vardiya.belongsToMany(Personel, {
  through: VardiyaAtama,
  foreignKey: 'vardiya_id'
});
Personel.belongsToMany(Vardiya, {
  through: VardiyaAtama,
  foreignKey: 'personel_id'
});
```

### Self-Referential İlişkiler

```javascript
// BOM Hierarchy
Bom.hasMany(Bom, {
  foreignKey: 'ust_bom_id',
  as: 'altBomlar'
});
Bom.belongsTo(Bom, {
  foreignKey: 'ust_bom_id',
  as: 'ustBom'
});
```

---

## Veritabanı Bakımı

### Yedekleme

```bash
# SQLite yedekleme
cp backend/database.sqlite backend/database_backup_$(date +%Y%m%d).sqlite
```

### Sorgu Optimizasyonu

```sql
-- Analiz tablosu
ANALYZE is_emirleri;

-- Vakuum işlemi
VACUUM;
```

### Performans İpuçları

1. **İndeks Kullanımı**: Sık sorgulanan alanları indeksleyin
2. **JOIN Optimizasyonu**: İlişkili tablolarda foreign key indeksleri kullanın
3. **Transaction Kullanımı**: Çoklu işlemde transaction kullanın
4. **Query Plan Analizi**: EXPLAIN QUERY PLAN ile sorguları analiz edin

---

**Son Güncelleme**: 2026-01-07
**Versiyon**: v14.26
