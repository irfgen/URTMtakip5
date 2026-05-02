# 15. GRUP YÖNETİMİ (Group Management) Modülü

## Genel Bakış

Grup Yönetimi modülü, parçaların ve makinelerin gruplandırılmasını, hiyerarşik yapı oluşturulmasını ve toplu işlem yapılmasını sağlar.

**Route Dosyası:** `backend/src/routes/grupRoutes.js`
**Controller Dosyası:** `backend/src/controllers/grupController.js`

---

## Modül Amacı

- Parça grupları oluşturma
- Makineleri gruplandırma
- Hiyerarşik yapı
- Toplu işlem desteği
- Grup bazlı raporlama

---

## Veritabanı Tablosu

**Gruplar Tablosu:** `gruplar`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| grup_adi | STRING | Grup adı |
| grup_kodu | STRING | Grup kodu |
| ust_grup_id | INTEGER | Üst grup ID (nullable) |
| aciklama | TEXT | Açıklama |
| tur | STRING | parca, makina, ozel |
| renk | STRING | Renk kodu |
| aktif | BOOLEAN | Aktif/Pasif |
| created_at | DATETIME | Oluşturulma tarihi |

**Grup Üyeliği:** `grup_uyelikleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| grup_id | INTEGER | Grup ID |
| kaynak_tipi | STRING | parca, makina |
| kaynak_id | INTEGER | Kaynak ID |
| ekleme_tarihi | DATETIME | Eklenme tarihi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm grupları listele |
| `GET /:id` | Grup detayı |
| `GET /:id/parcalar` | Gruba ait parçalar |
| `GET /:id/makineler` | Gruba ait makineler |
| `GET /alt-gruplar/:id` | Alt grupları listele |
| `GET /agac` | Grup ağacı yapısı |
| `GET /ara` | Grup arama |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni grup oluştur |
| `POST /:id/parcalar` | Gruba parça ekle |
| `POST /:id/makineler` | Gruba makina ekle |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Grup güncelle |
| `PUT /:id/parcalar` | Grup parçalarını güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Grup sil |
| `DELETE /:id/parcalar/:parcaId` | Parçayı gruptan çıkar |
| `DELETE /:id/makineler/:makinaId` | Makinayı gruptan çıkar |

---

## Grup Türleri

| Tür | Açıklama |
|-----|----------|
| parca | Parça grupları |
| makina | Makina grupları |
| ozel | Özel gruplar |

---

## Hiyerarşik Yapı

```
Ana Grup
├── Alt Grup 1
│   ├── Alt Alt Grup 1.1
│   └── Alt Alt Grup 1.2
└── Alt Grup 2
    ├── Alt Alt Grup 2.1
    └── Alt Alt Grup 2.2
```

---

## Temel Fonksiyonlar

### 1. grupOlustur(grupData)
Yeni grup oluşturur.
- Grup kodu üretir
- Üst grup bağlantısı kurar

### 2. parcaEkle(grupId, parcaKodu)
Gruba parça ekler.

### 3. parcalariGetir(grupId)
Gruba ait tüm parçaları döner.
- Alt grupları da dahil eder

### 4. grupAgaciGetir()
Tüm grup hiyerarşisini döner.
- Ağaç yapısında

### 5. topluGuncelle(grupId, parcaKodlari)
Gruptaki parçaları toplu günceller.

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `GrupListesi.jsx` | Grup listesi |
| `GrupEkleForm.jsx` | Grup ekleme formu |
| `GrupAgac.jsx` | Hiyerarşik ağaç görünümü |
| `GrupParcalari.jsx` | Gruptaki parçalar |
| `GrupSecici.jsx` | Grup seçim componenti |

---

## İlişkili Modüller

- **Parçalar** - Parça gruplama
- **Makineler** - Makina gruplama
- **BOM** - Grup bazlı BOM

---

## Kullanım Senaryoları

### Senaryo 1: Parça Grubu Oluşturma
1. Kullanıcı "Yeni Grup" seçer
2. Grup adı ve kodu girer
3. Üst grup seçer (opsiyonel)
4. Renk belirler
5. Kaydeder

### Senaryo 2: Parça Ekleme
1. Grup detayını açar
2. "Parça Ekle" seçer
3. Parça araması yapar
4. Birden fazla parça seçer
5. Gruba ekler

---

## Validasyon Kuralları

- `grup_adi` zorunlu
- `grup_kodu` benzersiz olmalı
- `ust_grup_id` geçerli grup olmalı (veya null)

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Hiyerarşik yapı eklendi |
| 1.2 | 2024-10 | Toplu işlem desteği |