# 16. SİPARİŞLER (Orders) Modülü

## Genel Bakış

Siparişler modülü, makina ve ekipman siparişlerinin oluşturulması, takibi ve yönetimini sağlar.

**Route Dosyası:** `backend/src/routes/siparislerRoutes.js`
**Controller Dosyası:** `backend/src/controllers/siparislerController.js`

---

## Modül Amacı

- Sipariş oluşturma
- Sipariş takibi
- Durum yönetimi
- Tedarikçi bağlantısı
- Fatura entegrasyonu

---

## Veritabanı Tablosu

**Siparişler Tablosu:** `siparisler`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| siparis_no | STRING | Sipariş numarası |
| tedarikci_id | INTEGER | Tedarikçi firma ID |
| tarih | DATE | Sipariş tarihi |
| teslim_tarihi | DATE | Teslim tarihi |
| durum | STRING | beklemede, onaylandi, gonderildi, teslim, iptal |
| toplam_tutar | DECIMAL | Toplam tutar |
| kdv | DECIMAL | KDV tutarı |
| genel_toplam | DECIMAL | Genel toplam |
| notlar | TEXT | Notlar |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

**Sipariş Kalemleri:** `siparis_kalemleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| siparis_id | INTEGER | Sipariş ID |
| stok_karti_id | INTEGER | Stok kartı ID |
| parca_kodu | STRING | Parça kodu |
| miktar | DECIMAL | Sipariş miktarı |
| birim_fiyat | DECIMAL | Birim fiyat |
| toplam_fiyat | DECIMAL | Toplam fiyat |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm siparişleri listele |
| `GET /:id` | Sipariş detayı |
| `GET /:id/kalemler` | Sipariş kalemleri |
| `GET /by-tedarikci/:tedarikciId` | Tedarikçiye ait siparişler |
| `GET /by-durum/:durum` | Duruma göre siparişler |
| `GET /by-tarih/:baslangic/:bitis` | Tarih aralığına göre |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni sipariş oluştur |
| `POST /:id/kalemler` | Siparişe kalem ekle |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Sipariş güncelle |
| `PUT /:id/durum` | Sipariş durumu güncelle |
| `PUT /:id/kalemler/:kalemId` | Kalem güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Sipariş sil |
| `DELETE /:id/kalemler/:kalemId` | Kalem sil |

---

## Sipariş Durumları

| Durum | Açıklama |
|-------|----------|
| beklemede | Sipariş oluşturuldu, onay bekliyor |
| onaylandi | Onaylandı, tedarikçiye iletildi |
| gonderildi | Tedarikçi siparişi gönderdi |
| teslim | Sipariş teslim edildi |
| iptal | Sipariş iptal edildi |

---

## Temel Fonksiyonlar

### 1. siparisOlustur(siparisData)
Yeni sipariş oluşturur.
- Sipariş numarası üretir
- Tarih atar

### 2. kalemEkle(siparisId, kalemData)
Siparişe kalem ekler.
- Stok kartı doğrulaması
- Fiyat hesaplama

### 3. durumGuncelle(siparisId, yeniDurum)
Sipariş durumunu günceller.

### 4. teslimEt(siparisId)
Siparişi teslim edilmiş olarak işaretler.
- Stok kartlarını günceller

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|--------|----------|
| `Siparisler.jsx` | Ana sipariş sayfası |
| `SiparisListesi.jsx` | Sipariş listesi |
| `SiparisForm.jsx` | Sipariş formu |
| `SiparisDetay.jsx` | Sipariş detay |
| `SiparisKalemleri.jsx` | Kalem listesi |

---

## İlişkili Modüller

- **Firma Yönetimi** - Tedarikçi bilgisi
- **Stok Kartları** - Kalem stok kartları
- **Faturalar** - Fatura bağlantısı

---

## Kullanım Senaryoları

### Senaryo 1: Yeni Sipariş
1. Kullanıcı "Yeni Sipariş" seçer
2. Tedarikçi seçer
3. Kalemleri ekler (stok kartı, miktar)
4. Teslim tarihi belirler
5. Kaydeder

### Senaryo 2: Sipariş Takibi
1. Kullanıcı siparişleri listeler
2. Durum filitresi uygular
3. Bekleyen siparişleri görüntüler
4. Takip eder

---

## Validasyon Kuralları

- `siparis_no` benzersiz
- `tedarikci_id` geçerli firma
- Kalemlerde `miktar` > 0
- `birim_fiyat` >= 0

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Kalem sistemi eklendi |
| 1.2 | 2024-10 | Durum yönetimi iyileştirildi |