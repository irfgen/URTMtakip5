# 8. FASON İŞLER (Subcontracting) Modülü

## Genel Bakış

Fason İşler modülü, dışarıya verilen üretim işlerinin teklif karşılaştırma, onay, teslim ve takibini yönetir.

**Route Dosyası:** `backend/src/routes/fasonRoutes.js`
**Controller Dosyası:** `backend/src/controllers/fasonController.js`
**Frontend Sayfası:** `frontend/src/pages/Fason.jsx`

---

## Modül Amacı

- Tedarikçi teklif yönetimi
- Fason iş oluşturma ve atama
- Ham malzeme gönderimi takibi
- Teslim ve kabul süreçleri
- Maliyet analizi ve karşılaştırma
- Fason grupları yönetimi

---

## Veritabanı Tablosu

**Ana Tablo:** `fason_isler`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| fason_no | STRING | Fason iş numarası |
| parca_kodu | STRING | Parça kodu |
| tedarikci_id | INTEGER | Tedarikçi/firma ID |
| is_turu | STRING | tip: toptan, adetli |
| durum | STRING | teklif, onayli, uretimde, teslim, tamamlanan |
| teklif_tarihi | DATE | Teklif tarihi |
| onay_tarihi | DATE | Onay tarihi |
| teslim_tarihi | DATE | Hedef teslim tarihi |
| gercek_teslim_tarihi | DATE | Gerçek teslim tarihi |
| birim_fiyat | DECIMAL | Birim fiyat |
| toplam_maliyet | DECIMAL | Toplam maliyet |
| adet | INTEGER | İş adedi |
| notlar | TEXT | Notlar |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

**Kalemler Tablosu:** `fason_kalemler`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| fason_id | INTEGER | Fason iş ID |
| parca_kodu | STRING | Parça kodu |
| adet | INTEGER | Kalem adedi |
| birim_fiyat | DECIMAL | Birim fiyat |
| durum | STRING | beklemede, uretimde, teslim_edildi |

**Ham Malzeme Tablosu:** `fason_ham_malzeme`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| fason_id | INTEGER | Fason iş ID |
| stok_karti_id | INTEGER | Stok kartı ID |
| miktar | DECIMAL | Gönderilen miktar |
| gonderim_tarihi | DATE | Gönderim tarihi |
| durum | STRING | gonderildi, teslim_edildi, iade |
| notlar | STRING | Notlar |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm fason işleri listele |
| `GET /:id` | Fason iş detayı |
| `GET /teklifler` | Teklifleri listele |
| `GET /teklifler/:id` | Teklif detayı |
| `GET /is-emirleri` | Fason iş emirleri |
| `GET /is-emirleri/:id` | İş emri detayı |
| `GET /gruplar` | Fason grupları |
| `GET /istatistikler` | Fason istatistikleri |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni fason iş oluştur |
| `POST /teklifler` | Teklif oluştur |
| `POST /teklifler/:id/kabul-et` | Teklifi kabul et |
| `POST /teklifler/:id/reddet` | Teklifi reddet |
| `POST /is-emirleri` | Fason iş emri oluştur |
| `POST /is-emirleri/:id/ham-malzeme-gonder` | Ham malzeme gönder |
| `POST /is-emirleri/:id/ham-malzeme-teslim` | Ham malzeme teslim |
| `POST /is-emirleri/:id/teslim-al` | Ürün teslim al |
| `POST /confirm-fason/:id` | Fason onayla |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Fason iş güncelle |
| `PUT /teklifler/:id` | Teklif güncelle |
| `PUT /is-emirleri/:id` | İş emri güncelle |
| `PATCH /is-emirleri/:id/durum` | Durum güncelle |
| `PATCH /is-emirleri/:id/ham-malzeme-durum` | Ham malzeme durumu |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Fason iş sil |
| `DELETE /teklifler/:id` | Teklif sil |
| `DELETE /is-emirleri/:id` | İş emri sil |

---

## Durum Akışı

### Fason İş Durumları
```
teklif → onayli → uretimde → teslim → tamamlanan
          ↓
       iptal
```

### Fason İş Emri Durumları
```
beklemede → uretimde → teslim_edildi → tamamlandi
     ↓
   iptal
```

### Ham Malzeme Durumları
```
gonderildi → teslim_edildi → iade
```

---

## Alt Modüller

### 1. Fason Grupları
**Dosya:** `fasonGrupRoutes.js`

Fason işlerinin gruplandırılması.

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm grupları listele |
| `GET /:id` | Grup detayı |
| `POST /` | Yeni grup oluştur |
| `PUT /:id` | Grup güncelle |
| `DELETE /:id` | Grup sil |

### 2. Fason Teklifleri
**Dosya:** `fasonTeklifController.js`

Teklif karşılaştırma ve onay.

| Endpoint | Açıklama |
|----------|----------|
| `GET /teklifler` | Teklifleri listele |
| `POST /teklifler` | Teklif oluştur |
| `PUT /teklifler/:id` | Teklif güncelle |
| `POST /teklifler/:id/kabul-et` | Teklifi kabul et |
| `POST /teklifler/:id/reddet` | Teklifi reddet |
| `POST /teklifler/upload-excel` | Excel'den teklif yükle |
| `POST /teklifler/bulk-create` | Toplu teklif oluştur |
| `POST /teklifler/analyze-documents` | Teklif belgelerini analiz et |

---

## Temel Fonksiyonlar

### 1. fasonIsOlustur(fasonData)
Yeni fason işi oluşturur.
- Fason numarası üretir
- Tedarikçi bilgisi kaydeder

### 2. teklifKarsilastir(fasonId)
Bir fason işi için teklifleri karşılaştırır.
- Fiyat karşılaştırması
- Teslim süresi karşılaştırması
- Tedarikçi performansı

### 3. hamMalzemeGonder(fasonIsEmriId, malzemeData)
Fason iş emrine ham malzeme gönderir.
- Stok çıkışı yapar
- Gönderim kaydı oluşturur

### 4. teslimAl(fasonIsEmriId, teslimData)
Tamamlanan fason ürününü teslim alır.
- Kalite kontrol notu
- Giriş kaydı oluşturur

### 5. maliyetHesapla(fasonId)
Fason işinin toplam maliyetini hesaplar.
- İş maliyeti
- Ham malzeme maliyeti
- Diğer giderler

---

## Maliyet Analizi

| Maliyet Türü | Açıklama |
|--------------|----------|
| İş Maliyeti | Fason fiyatı × adet |
| Ham Malzeme | Gönderilen malzeme maliyeti |
| Lojistik | Transport giderleri |
| Toplam | Tüm giderlerin toplamı |

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Fason.jsx` | Ana fason sayfası |
| `FasonListesi.jsx` | Fason iş listesi |
| `FasonForm.jsx` | Fason iş formu |
| `FasonGruplar.jsx` | Fason grupları |
| `FasonConfirmDialog.jsx` | Onay dialog |
| `FasonTeslimDialog.jsx` | Teslim dialog |
| `TeklifKarsilastirma.jsx` | Teklif karşılaştırma |
| `HamMalzemeGonderimDialog.jsx` | Ham malzeme gönderim |
| `HamMalzemeTeslimDialog.jsx` | Ham malzeme teslim |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `fason:created` | Yeni fason oluşturuldu |
| `fason:statusChanged` | Durum değişti |
| `fason:teklifEklendi` | Yeni teklif eklendi |
| `fason:hamMalzemeGonderildi` | Malzeme gönderildi |
| `fason:teslimAlindi` | Ürün teslim alındı |

---

## İlişkili Modüller

- **Firma Yönetimi** - Tedarikçi bilgileri
- **Parçalar** - Parça referansları
- **Stok Kartları** - Ham malzeme stoğu
- **BOM Yönetimi** - Malzeme listesi
- **Faturalar** - Fatura bağlantısı

---

## Kullanım Senaryoları

### Senaryo 1: Yeni Fason İş
1. Kullanıcı "Yeni Fason" seçer
2. Parça seçer
3. Tedarikçi seçer (veya yeni ekler)
4. İş türü belirler (toptan/adetli)
5. Teklif bekler veya direkt onaylar

### Senaryo 2: Teklif Karşılaştırma
1. Birden fazla tedarikçiden teklif alınır
2. Kullanıcı teklif karşılaştırma sayfasını açar
3. Fiyat, süre, kalite karşılaştırır
4. En uygun teklifi seçer ve onaylar

### Senaryo 3: Ham Malzeme Gönderimi
1. Fason iş emri onaylandı
2. "Ham Malzeme Gönder" seçilir
3. Malzeme ve miktar seçilir
4. Sistem stoktan düşer
5. Gönderim kaydı oluşur

---

## Validasyon Kuralları

- `fason_no` benzersiz olmalı
- `parca_kodu` geçerli olmalı
- `tedarikci_id` geçerli tedarikçi
- `adet` > 0
- `birim_fiyat` >= 0

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| FS001 | Fason iş bulunamadı | Geçersiz ID |
| FS002 | Teklif bulunamadı | Geçersiz teklif ID |
| FS003 | Stok yetersiz | Gönderilecek malzeme yok |
| FS004 | Geçersiz durum geçişi | Durum akışı hatası |
| FS005 | Tedarikçi bulunamadı | Geçersiz tedarikçi ID |

---

## Raporlar

### Fason Maliyet Raporu
- Dönem bazlı
- Tedarikçi bazlı
- Parça bazlı analiz

### Tedarikçi Performans Raporu
- Teslim süresi
- Kalite
- Fiyat karşılaştırması

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Teklif karşılaştırma eklendi |
| 1.2 | 2024-09 | Ham malzeme takibi |
| 1.3 | 2024-12 | Excel import desteği |
| 1.4 | 2025-01 | Grup yönetimi eklendi |