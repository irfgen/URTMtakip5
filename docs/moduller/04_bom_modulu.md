# 4. BOM YÖNETİMİ (Bill of Materials) Modülü

## Genel Bakış

BOM (Bill of Materials) modülü, üretilecek ürünlerin malzeme listelerini yönetir. Hiyerarşik yapı, maliyet hesaplama ve malzeme planlaması sağlar.

**Route Dosyası:** `backend/src/routes/bomRoutes.js`
**Controller Dosyası:** `backend/src/controllers/bomController.js`
**Frontend Sayfası:** `frontend/src/pages/Boms.jsx`

---

## Modül Amacı

- Ürünlerin malzeme listelerini oluşturma
- Hiyerarşik BOM yapısı kurma
- Malzeme maliyeti hesaplama
- Alt montaj takibi
- Malzeme ihtiyaç planlaması

---

## Veritabanı Tablosu

**Ana Tablo:** `boms`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| bom_kodu | STRING | BOM benzersiz kod |
| parca_kodu | STRING | Ana parça kodu |
| version | STRING | BOM versiyonu |
| revizyon | INTEGER | Revizyon numarası |
| toplam_maliyet | DECIMAL | Toplam maliyet |
| durum | STRING | aktif, pasif, arsiv |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

**Kalemler Tablosu:** `bom_kalemleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| bom_id | INTEGER | BOM ID |
| malzeme_kodu | STRING | Malzeme parça kodu |
| miktar | DECIMAL | Gerekli miktar |
| birim | STRING | Birim (adet, kg, mt) |
| maliyet | DECIMAL | Birim maliyet |
| toplam_maliyet | DECIMAL | Toplam maliyet |
| seviye | INTEGER | Hiyerarşi seviyesi |
| parent_id | INTEGER | Üst kalem ID |
| sira | INTEGER | Sıralama |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm BOM'ları listele |
| `GET /boms/:id` | BOM detayı |
| `GET /boms/:makinaId` | Makinaya ait BOM'lar |
| `GET /search/boms` | BOM arama |
| `GET /parts/:parcaKodu/unit-cost` | Parça birim maliyeti |
| `GET /boms-with-components` | BOM ve bileşenleri |
| `GET /cost-calculation/:bomId` | Maliyet hesaplama |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni BOM oluştur |
| `POST /boms` | BOM oluştur |
| `POST /:id/kalemler` | BOM'a kalem ekle |
| `POST /import` | Excel'den import |
| `POST /copy/:bomId` | BOM kopyala |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /boms/:id` | BOM güncelle |
| `PUT /:id/kalemler/:kalemId` | Kalem güncelle |
| `PUT /:id/revizyon` | Revizyon güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /boms/:id` | BOM sil |
| `DELETE /:id/kalemler/:kalemId` | Kalem sil |

---

## Temel Fonksiyonlar

### 1. bomOlustur(bomData)
Yeni BOM oluşturur.
- BOM kodu üretir
- Versiyon atar

### 2. kalemEkle(bomId, kalemData)
BOM'a malzeme kalemi ekler.
- Birim maliyet hesaplar
- Hiyerarşi seviyesini belirler

### 3. maliyetHesapla(bomId)
BOM'un toplam maliyetini hesaplar.
- Tüm kalemleri toplar
- Alt BOM'ların maliyetini ekler

### 4. birimMaliyetGetir(parcaKodu)
Parçanın birim maliyetini döner.
- Alım maliyeti
- Üretim maliyeti

### 5. altBomGetir(bomId)
BOM'un alt montajlarını döner.
- Hiyerarşik yapı
- Recursive erişim

---

## Hiyerarşik Yapı

```
Ürün (Level 0)
├── Alt Montaj A (Level 1)
│   ├── Parça 1 (Level 2)
│   └── Parça 2 (Level 2)
├── Alt Montaj B (Level 1)
│   └── Parça 3 (Level 2)
└── Hammadde (Level 1)
```

---

## Maliyet Hesaplama

### Formül
```
Toplam Maliyet = Σ (Kalem Miktarı × Birim Maliyet)
```

### Maliyet Türleri

| Tür | Açıklama |
|-----|----------|
| Alım Maliyeti | Satın alınan parçalar |
| Üretim Maliyeti | İç üretim maliyeti |
| İşçilik Maliyeti | Kumanda süresi × saatlik ücret |
| Genel Gider | %X ek genel gider |

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Boms.jsx` | Ana BOM sayfası |
| `BomListesi.jsx` | BOM listesi tablosu |
| `BomForm.jsx` | BOM oluşturma/düzenleme formu |
| `BomDetay.jsx` | BOM detay görünümü |
| `BomKalemleri.jsx` | BOM kalemleri listesi |
| `BomPrintModal.jsx` | Yazdırma modalı |
| `MaliyetAnaliz.jsx` | Maliyet analiz paneli |

---

## Excel Import Formatı

| Kolon | Açıklama |
|-------|----------|
| Malzeme Kodu | Parça/malzeme kodu |
| Miktar | Gerekli miktar |
| Birim | adet, kg, mt, lt |
| Birim Maliyet | Birim başına maliyet |
| Üst Kalem | Üst montaj kodu (opsiyonel) |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `bom:created` | Yeni BOM oluşturuldu |
| `bom:updated` | BOM güncellendi |
| `bom:deleted` | BOM silindi |
| `bom:costCalculated` | Maliyet hesaplandı |

---

## İlişkili Modüller

- **Parçalar** - Malzeme referansları
- **Stok Kartları** - Malzeme stok bilgisi
- **Üretim Planı** - BOM kullanımı
- **İş Emirleri** - Malzeme tüketimi

---

## Kullanım Senaryoları

### Senaryo 1: Yeni BOM Oluşturma
1. Kullanıcı "Yeni BOM" seçer
2. Ana parça kodunu seçer
3. Malzeme kalemlerini ekler
4. Her kalem için miktar ve maliyet girer
5. Sistem toplam maliyeti hesaplar
6. Kaydet butonuna tıklar

### Senaryo 2: Alt Montaj Ekleme
1. Kullanıcı BOM detayını açar
2. "Alt Montaj Ekle" seçer
3. Mevcut bir BOM'u alt montaj olarak seçer
4. Miktar girer
5. Hiyerarşi otomatik güncellenir

---

## Validasyon Kuralları

- `bom_kodu` benzersiz olmalı
- `parca_kodu` geçerli parça referansı
- Kalem `miktar` pozitif sayı
- `birim` geçerli birim tanımı

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| BOM001 | BOM bulunamadı | Geçersiz BOM ID |
| BOM002 | Döngüsel referans | Alt montaj kendini içeriyor |
| BOM003 | Malzeme bulunamadı | Geçersiz malzeme kodu |
| BOM004 | Geçersiz miktar | Miktar sıfır veya negatif |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Hiyerarşik yapı eklendi |
| 1.2 | 2024-09 | Maliyet hesaplama eklendi |
| 1.3 | 2024-12 | Excel import destği |