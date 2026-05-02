# 32. MAKİNA İNDEKS (Machine Index) Modülü

## Genel Bakış

Makina İndeks modülü, makineler, gruplar, BOM'lar ve parçalar arasındaki hiyerarşik ilişkileri yönetir ve güçlü arama olanakları sunar.

**Route Dosyası:** `backend/src/routes/makindexRoutes.js`
**Controller Dosyası:** `backend/src/controllers/makindexController.js`

---

## Modül Amacı

- Hiyerarşik veri yönetimi
- Global arama
- Sınıf ve grup yönetimi
- BOM ilişkileri

---

## Veritabanı Tablosu

**Sınıflar:** `makina_siniflari`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| sinif_adi | STRING | Sınıf adı |
| sinif_kodu | STRING | Sınıf kodu |
| aciklama | TEXT | Açıklama |
| sira | INTEGER | Sıralama |

**Gruplar:** `makina_gruplari`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| grup_adi | STRING | Grup adı |
| grup_kodu | STRING | Grup kodu |
| marka | STRING | Marka |
| sinif_id | INTEGER | Sınıf ID |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /ara` | Global arama |
| `GET /siniflar` | Tüm sınıfları listele |
| `GET /siniflar/:id` | Sınıf detayı |
| `GET /makinalar/:sinifId` | Sınıfa ait makineler |
| `GET /gruplar/:id` | Grup detayı |
| `GET /parcalar/:bomId` | BOM'a ait parçalar |
| `GET /boms/:makinaId` | Makinaya ait BOM'lar |
| `GET /marka/:marka/gruplar` | Markaya ait gruplar |
| `GET /hierarchy` | Hiyerarşi detayı |
| `GET /ozel-gruplar` | Özel gruplar |
| `GET /grup-ara` | Grup arama |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /siniflar` | Yeni sınıf oluştur |
| `POST /seed` | Test verisi oluştur |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /siniflar/:id` | Sınıf güncelle |

### DELETE İŞlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /siniflar/:id` | Sınıf sil |

---

## Hiyerarşi Yapısı

```
Sınıf (Class)
  └── Grup (Group)
        └── Makina (Machine)
              └── BOM
                    └── Parça (Part)
```

---

## Arama Özellikleri

| Arama Türü | Açıklama |
|------------|----------|
| Global | Tüm kayıtlarda arama |
| Sınıf Bazlı | Belirli sınıfta arama |
| Marka Bazlı | Markaya göre filtre |
| BOM Bazlı | BOM içinde arama |

---

## Temel Fonksiyonlar

### 1. globalAra(aramaKelime)
Tüm sistemde arama yapar.
- Makineler, gruplar, parçalar, BOM'lar

### 2. hiyerarsiGetir()
Tüm hiyerarşik yapıyı döner.

### 3. sinifDetaylariGetir(sinifId)
Sınıfa ait tüm detayları getirir.

---

## İlişkili Modüller

- **Makineler** - Makina bilgileri
- **BOM** - BOM ilişkileri
- **Parçalar** - Parça bilgileri
- **Gruplar** - Grup bilgileri

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-03 | İlk versiyon |
| 1.1 | 2024-07 | Hiyerarşi yapısı eklendi |
| 1.2 | 2024-10 | Global arama özelliği |