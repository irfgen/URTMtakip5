# ÜRTM Takip - Veritabanı Şeması

## Veritabanı Genel Bakış

**Database:** SQLite
**ORM:** Sequelize
**Location:** `backend/database.sqlite`
**WAL Mode:** Aktif (Write-Ahead Logging)
**Foreign Keys:** Aktif

**Toplam Model:** 38
**Toplam Tablo:** 40+ (junction tables dahil)

---

## 1. ÇEKIRDEK MODELLER

### IsEmri (iş_emirleri)

İş emirlerini temsil eder.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | INTEGER | PK | Auto increment |
| `tezgah_id` | INTEGER | Hayır | FK: tezgahlar.id |
| `uretim_plani_id` | INTEGER | Hayır | FK: uretim_plani.id |
| `parca_kodu` | STRING | Evet | FK: parcalar.parca_kodu |
| `adet` | INTEGER | Evet | Üretim adedi |
| `oncelik` | ENUM | Hayır | dusuk, orta, yuksek, kritik |
| `durum` | ENUM | Evet | beklemede, uretime_baslandi, uretimde, tamamlandi, iptal, fasona_gonderildi |
| `aciklama` | TEXT | Hayır | İş açıklaması |
| `sira` | INTEGER | Hayır | Sıralama |
| `baslama_tarihi` | DATE | Hayır | Başlangıç tarihi |
| `bitis_tarihi` | DATE | Hayır | Bitiş tarihi |
| `created_at` | DATE | Auto | Oluşturma tarihi |
| `updated_at` | DATE | Auto | Güncelleme tarihi |

**İlişkiler:**
- `belongsTo(Tezgah)` - Bir iş emri bir tezgaha ait
- `belongsTo(Parca)` - Bir iş emri bir parça kullanır
- `belongsTo(UretimPlani)` - Bir iş emri bir plandan gelebilir
- `hasMany(IslemKaydi)` - Bir iş emrinin birçok işlem kaydı olabilir


---

### Tezgah (tezgahlar)

Tezgah/iş istasyonlarını temsil eder.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | INTEGER | PK | Auto increment |
| `adi` | STRING | Evet | Tezgah adı |
| `tipi` | STRING | Hayır | Tezgah tipi |
| `konum` | STRING | Hayır | Konum |
| `calisma_durumu` | ENUM | Evet | musait, calisiyor, bakim |
| `aktif_is_emri_id` | INTEGER | Hayır | FK: is_emirleri.id |
| `created_at` | DATE | Auto | Oluşturma tarihi |
| `updated_at` | DATE | Auto | Güncelleme tarihi |

**İlişkiler:**
- `hasMany(IsEmri)` - Bir tezgahın birçok iş emri olabilir
- `hasOne(IsEmri, as: 'aktifIsEmri')` - Aktif iş emri
- `hasMany(TezgahDurumLog)` - Durum geçmişi

---

### Parca (parcalar)

Parçaları temsil eder.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `parca_kodu` | STRING | PK | Primary key |
| `parca_adi` | STRING | Evet | Parça adı |
| `grup` | STRING | Hayır | Parça grubu |
| `stok_adedi` | INTEGER | Hayır | Stok adedi |
| `birim` | STRING | Hayır | Birim |
| `ham_malzeme_kodu` | STRING | Hayır | FK: stok_kartlari.stok_kodu |
| `teknik_resim_path` | STRING | Hayır | Teknik resim yolu |
| `aciklama` | TEXT | Hayır | Açıklama |
| `created_at` | DATE | Auto | Oluşturma tarihi |
| `updated_at` | DATE | Auto | Güncelleme tarihi |

**İlişkiler:**
- `hasMany(IsEmri)` - Bir parça birçok iş emrinde kullanılır
- `belongsTo(StokKarti, as: 'hamMalzeme')` - Ham malzeme ilişkisi
- `hasMany(Bom, as: 'ustParcaBomlari')` - Üst BOM'lar
- `hasMany(Bom, as: 'altParcaBomlari')` - Alt BOM'lar

---

### UretimPlani (uretim_plani)

Üretim planlarını temsil eder (Ana sistem).

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | INTEGER | PK | Auto increment |
| `plan_adi` | STRING | Evet | Plan adı |
| `tip` | ENUM | Evet | makine_bazli, liste_bazli, karma |
| `baslangic_tarihi` | DATE | Evet | Başlangıç tarihi |
| `bitis_tarihi` | DATE | Evet | Bitiş tarihi |
| `aciklama` | TEXT | Hayır | Açıklama |
| `excel_dosyasi` | STRING | Hayır | Excel dosyası yolu |
| `durum` | ENUM | Hayır | taslak, aktif, tamamlandi |
| `created_at` | DATE | Auto | Oluşturma tarihi |
| `updated_at` | DATE | Auto | Güncelleme tarihi |

**İlişkiler:**
- `hasMany(IsEmri)` - Bir planın birçok iş emri olabilir

---

### UretimPlaniV2 (uretim_planlari)

Basit üretim planları (V2 sistemi).

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | INTEGER | PK | Auto increment |
| `plan_adi` | STRING | Evet | Plan adı |
| `is_emri_listesi` | JSON | Evet | İş emri listesi |
| `created_at` | DATE | Auto | Oluşturma tarihi |
| `updated_at` | DATE | Auto | Güncelleme tarihi |

---

## 2. YÖNETİM MODELLERİ

### Fason (fason)
Fason kayıtlarını temsil eder.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | INTEGER | PK | Auto increment |
| `is_emri_id` | INTEGER | Evet | FK: is_emirleri.id |
| `fason_grup_id` | INTEGER | Evet | FK: fason_gruplar.id |
| `adicikar` | DECIMAL | Hayır | Alınan bedel |
| `verilen_bedel` | DECIMAL | Hayır | Verilen bedel |
| `teslim_tarihi` | DATE | Hayır | Teslim tarihi |
| `durum` | ENUM | Hayır | beklemede, uretimde, tamamlandi |
| `aciklama` | TEXT | Hayır | Açıklama |
| `created_at` | DATE | Auto | Oluşturma tarihi |
| `updated_at` | DATE | Auto | Güncelleme tarihi |

**İlişkiler:**
- `belongsTo(IsEmri)` - Bir fason bir iş emrine ait
- `belongsTo(FasonGrup)` - Bir fason bir gruba ait

---

### ArizaBakim (ariza_bakim)

Arıza ve bakım kayıtlarını temsil eder.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | INTEGER | PK | Auto increment |
| `tezgah_id` | INTEGER | Evet | FK: tezgahlar.id |
| `ariza_turu` | STRING | Evet | Arıza türü |
| `aciklama` | TEXT | Evet | Açıklama |
| `bildiren` | STRING | Evet | Bildiren kişi |
| `cozum` | TEXT | Hayır | Çözüm |
| `durum` | ENUM | Evet | açık, cozuldu, iptal |
| `baslama_tarihi` | DATE | Evet | Başlangıç tarihi |
| `bitis_tarihi` | DATE | Hayır | Bitiş tarihi |
| `created_at` | DATE | Auto | Oluşturma tarihi |
| `updated_at` | DATE | Auto | Güncelleme tarihi |

**İlişkiler:**
- `belongsTo(Tezgah)` - Bir arıza bir tezgaha ait

---

## 3. STOK VE LOJİSTİK

### StokKarti (stok_kartlari)

Stok kartlarını temsil eder.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | INTEGER | PK | Auto increment |
| `stok_kodu` | STRING | Evet | Unique |
| `stok_adi` | STRING | Evet | Stok adı |
| `stok_turu` | STRING | Hayır | Ham Malzeme, Yarı Mamul, Mamul |
| `birim` | STRING | Hayır | Birim |
| `mevcut_stok` | DECIMAL | Hayır | Mevcut stok |
| `min_stok` | DECIMAL | Hayır | Minimum stok |
| `max_stok` | DECIMAL | Hayır | Maksimum stok |
| `kritik_seviye` | DECIMAL | Hayır | Kritik seviye |
| `aciklama` | TEXT | Hayır | Açıklama |
| `created_at` | DATE | Auto | Oluşturma tarihi |
| `updated_at` | DATE | Auto | Güncelleme tarihi |

**İlişkiler:**
- `hasMany(Parca)` - Bir stok kartı birçok parça için ham malzeme olabilir

---

### Bom (boms)

Bill of Materials (BOM) kayıtlarını temsil eder.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | INTEGER | PK | Auto increment |
| `ust_parca_kodu` | STRING | Evet | FK: parcalar.parca_kodu |
| `alt_parca_kodu` | STRING | Evet | FK: parcalar.parca_kodu |
| `miktar` | DECIMAL | Evet | Miktar |
| `birim` | STRING | Hayır | Birim |
| `seviye` | INTEGER | Evet | Hiyerarşi seviyesi |
| `maliyet` | DECIMAL | Hayır | Maliyet |
| `aciklama` | TEXT | Hayır | Açıklama |
| `created_at` | DATE | Auto | Oluşturma tarihi |
| `updated_at` | DATE | Auto | Güncelleme tarihi |

**İlişkiler:**
- `belongsTo(Parca, as: 'ustParca')` - Üst parça
- `belongsTo(Parca, as: 'altParca')` - Alt parça

---

## ÖZET

| Kategori | Model Sayısı |
|----------|--------------|
| Çekirdek | 5 |
| Yönetim | 7 |
| Stok & Lojistik | 6 |
| Makina & Ekipman | 4 |
| Dokümantasyon | 6 |
| Diğer | 10 |
| **TOPLAM** | **38** |

---

**Son Güncelleme:** 2025-01-01
**Versiyon:** v14.0.0
