# ÜRTM Takip API Dokümantasyonu

## API Genel Bakış

**Base URL**: `http://localhost:3000/api`

**Authentication**: JWT token-based authentication (çoğu endpoint için)

**Response Format**:
```json
{
  "success": true|false,
  "data": {...},
  "error": "error message",
  "message": "info message"
}
```

---

## 1. İrsaliye Modülü API

### 1.1 İrsaliye Listesi

```
GET /api/irsaliyeler
```

**Query Parameters**:
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| page | number | Hayır | Sayfa numarası (default: 1) |
| limit | number | Hayır | Sayfa başı kayıt (default: 20) |
| tedarikci_id | number | Hayır | Tedarikçi filtresi |
| durum | string | Hayır | Durum filtresi (bekliyor, kismi_eslesti, tam_eslesti) |
| baslangic_tarih | date | Hayır | Başlangıç tarihi |
| bitis_tarih | date | Hayır | Bitiş tarihi |

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "irsaliyeNo": "2024-001",
      "irsaliyeTarihi": "2024-01-15",
      "tur": "alis",
      "durum": "bekliyor",
      "aciklama": "Tedarikçi teslimatı",
      "toplamKalem": 5,
      "toplamMiktar": 100,
      "kalemSayisi": 5,
      "firmaAdi": "ABC Ltd.",
      "tedarikciId": 10,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 1.2 İrsaliye Detay

```
GET /api/irsaliyeler/:id
```

**Response**:
```json
{
  "id": 1,
  "irsaliyeNo": "2024-001",
  "irsaliyeTarihi": "2024-01-15",
  "tur": "alis",
  "durum": "bekliyor",
  "aciklama": "Tedarikçi teslimatı",
  "toplamKalem": 5,
  "toplamMiktar": 100,
  "firmaAdi": "ABC Ltd.",
  "tedarikciId": 10,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "kalemler": [
    {
      "id": 1,
      "mal_hizmet_adi": "Makine Parçası A",
      "stok_kodu": "MPA-001",
      "miktar": 50,
      "birim": "Adet",
      "birim_fiyat": 150.00,
      "aciklama": "Kalıp üretimi için",
      "eslesme_durumu": 0,
      "eslesen_fatura_kalemi": null
    }
  ],
  "lockState": {
    "state": "UNLOCKED",
    "lockedBy": null,
    "lockedAt": null
  }
}
```

### 1.3 İrsaliye Oluştur

```
POST /api/irsaliyeler
```

**Request Body**:
```json
{
  "irsaliye_no": "2024-002",
  "tedarikci_id": 10,
  "belge_tarih": "2024-01-20",
  "belge_tipi": "gelis",
  "aciklama": "Yeni tedari̇k",
  "kalemler": [
    {
      "mal_hizmet_adi": "Hammaddede A",
      "stok_kodu": "HMA-001",
      "miktar": 100,
      "birim": "KG",
      "birim_fiyat": 25.50,
      "aciklama": "Özel üretim"
    }
  ]
}
```

**Field Mapping**:
- `belge_tipi`: "gelis" → `tur`: "alis"
- `belge_tipi`: "cikis" → `tur`: "satis"

### 1.4 İrsaliye Güncelle

```
PUT /api/irsaliyeler/:id
```

**Request Body**: Oluştur ile aynı

**Lock Check**: İrsaliye başka biri tarafından kilitliyse 409 hatası döner

### 1.5 İrsaliye Sil

```
DELETE /api/irsaliyeler/:id
```

**Validation**: Eşleşmiş kalem varsa (eslesme_durumu=1) silinemez

### 1.6 İrsaliye Lock İşlemleri

**Lock Al**:
```
POST /api/irsaliyeler/:id/lock
```

**Lock Bırak**:
```
DELETE /api/irsaliyeler/:id/lock
```

**Zorla Lock Bırak** (Admin):
```
DELETE /api/irsaliyeler/:id/lock?force=true
```

**Lock State Values**:
- `UNLOCKED`: Kimse tarafından kilitli değil
- `LOCKED_BY_ME`: Benim tarafımdan kilitli
- `LOCKED_BY_OTHER`: Başkası tarafından kilitli

### 1.7 İrsaliye Kalemleri

**Kalemleri Getir**:
```
GET /api/irsaliyeler/:id/kalemler
```

**Kalem Ekle**:
```
POST /api/irsaliyeler/:id/kalemler
```

---

## 2. İş Emirleri API

### 2.1 İş Emri Listesi

```
GET /api/is-emirleri
```

**Query Parameters**:
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| durum | string | Durum filtresi |
| tezgah_id | number | Tezgah filtresi |
| baslangic_tarih | date | Başlangıç tarihi |
| bitis_tarih | date | Bitiş tarihi |
| page | number | Sayfa numarası |
| limit | number | Kayıt sayısı |

### 2.2 İş Emri Detay

```
GET /api/is-emirleri/:id
```

**Response**:
```json
{
  "id": 1,
  "is_emri_no": "IE-2024-001",
  "parca_id": 15,
  "tezgah_id": 3,
  "adet": 100,
  "durum": "uretime_hazir",
  "oncelik": 5,
  "termin_tarihi": "2024-02-01",
  "parca": {
    "id": 15,
    "parca_adi": "Yan Kapak",
    "parca_kodu": "YK-001"
  },
  "tezgah": {
    "id": 3,
    "tezgah_adi": "CNC-03",
    "durum": "calisiyor"
  }
}
```

### 2.3 İş Emri Oluştur

```
POST /api/is-emirleri
```

**Request Body**:
```json
{
  "parca_id": 15,
  "tezgah_id": 3,
  "adet": 100,
  "oncelik": 5,
  "termin_tarihi": "2024-02-01",
  "aciklama": "Sipariş #1234"
}
```

### 2.4 İş Emri Durum Güncelleme

```
PATCH /api/is-emirleri/:id/durum
```

**Request Body**:
```json
{
  "durum": "uretimde"
}
```

**Durum Values**:
- `planlandi`: Planlandı
- `uretime_hazir`: Üretime hazır
- `uretimde`: Üretimde
- `tamamlandi`: Tamamlandı
- `iptal`: İptal
- `beklemede`: Beklemede

---

## 3. Parçalar API

### 3.1 Parça Listesi

```
GET /api/parcalar
```

**Query Parameters**:
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| stok_kodu | string | Stok kodu filtresi |
| kategori | string | Kategori filtresi |
| page | number | Sayfa numarası |
| limit | number | Kayıt sayısı |

### 3.2 Parça Detay

```
GET /api/parcalar/:id
```

**Response**:
```json
{
  "id": 15,
  "parca_adi": "Yan Kapak",
  "parca_kodu": "YK-001",
  "stok_kodu": "YK-001",
  "kategori": "Mekanik Parçalar",
  "aciklama": "Cihaz yan kapağı",
  "birim": "Adet",
  "min_stok": 10,
  "mevcut_stok": 45,
  "teknik_resim": "/uploads/technical/YK-001.png",
  "bom_kayitlari": [...]
}
```

### 3.3 Parça Oluştur

```
POST /api/parcalar
```

**Request Body**:
```json
{
  "parca_adi": "Yeni Parça",
  "parca_kodu": "YP-001",
  "stok_kodu": "YP-001",
  "kategori": "Mekanik",
  "birim": "Adet",
  "min_stok": 5,
  "aciklama": "Açıklama"
}
```

### 3.4 Teknik Resim Yükleme

```
POST /api/parcalar/:id/teknik-resim
```

**Content-Type**: `multipart/form-data`

**Form Data**:
- `resim`: Image file (PNG, JPG, max 5MB)

---

## 4. Tezgahlar API

### 4.1 Tezgah Listesi

```
GET /api/tezgahlar
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "tezgah_adi": "CNC-01",
      "tezgah_kodu": "CNC01",
      "marka": "DMG",
      "model": "DMU 50",
      "durum": "calisiyor",
      "aktif": true,
      "son_durum_guncelleme": "2024-01-15T14:30:00.000Z"
    }
  ]
}
```

### 4.2 Tezgah Durum Güncelleme

```
PATCH /api/tezgahlar/:id/durum
```

**Request Body**:
```json
{
  "durum": "calisiyor"
}
```

**Durum Values**:
- `calisiyor`: Çalışıyor
- `idle`: Boşta
- `arizali`: Arızalı
- `bakimda`: Bakımda

### 4.3 Tezgah Durum Logleri

```
GET /api/tezgahlar/:id/durum-logleri
```

---

## 5. BOM Yönetimi API

### 5.1 BOM Listesi

```
GET /api/boms
```

**Query Parameters**:
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| parca_id | number | Ana parça ID |
| ust_bom_id | number | Üst BOM ID |

### 5.2 BOM Detay

```
GET /api/boms/:id
```

**Response**:
```json
{
  "id": 1,
  "parca_id": 15,
  "ust_bom_id": null,
  "malzeme_adedi": 1,
  "kayip_orani": 0.05,
  "parca": {
    "id": 15,
    "parca_adi": "Yan Kapak",
    "parca_kodu": "YK-001"
  },
  "bom_kalemleri": [
    {
      "id": 25,
      "parca_id": 45,
      "malzeme_adedi": 2,
      "parca": {
        "parca_adi": "Cıvata M8",
        "parca_kodu": "C-M8"
      }
    }
  ]
}
```

### 5.3 BOM Oluştur

```
POST /api/boms
```

**Request Body**:
```json
{
  "parca_id": 15,
  "ust_bom_id": null,
  "malzeme_adedi": 1,
  "kayip_orani": 0.05
}
```

### 5.4 BOM Kalem Ekleme

```
POST /api/boms/:id/kalemler
```

**Request Body**:
```json
{
  "parca_id": 45,
  "malzeme_adedi": 2,
  "kayip_orani": 0.02
}
```

---

## 6. Üretim Planı API

### 6.1 Üretim Planı Listesi

```
GET /api/uretim-plani
```

**Query Parameters**:
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| baslangic_tarih | date | Başlangıç tarihi |
| bitis_tarih | date | Bitiş tarihi |
| tezgah_id | number | Tezgah filtresi |

### 6.2 Üretim Planı Detay

```
GET /api/uretim-plani/:id
```

### 6.3 Excel İçe Aktarma

```
POST /api/uretim-plani/import
```

**Content-Type**: `multipart/form-data`

**Form Data**:
- `dosya`: Excel file (.xlsx)

### 6.4 Üretim Planı Oluştur

```
POST /api/uretim-plani
```

**Request Body**:
```json
{
  "plan_adi": "Şubat 2024",
  "baslangic_tarih": "2024-02-01",
  "bitis_tarih": "2024-02-29",
  "plan_tipi": "makine_bazli",
  "aciklama": "Aylık üretim planı"
}
```

---

## 7. Fason İşler API

### 7.1 Fason İş Listesi

```
GET /api/fason-isler
```

**Query Parameters**:
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| fason_id | number | Fasyoncu ID |
| durum | string | Durum filtresi |

### 7.2 Fason İş Oluştur

```
POST /api/fason-isler
```

**Request Body**:
```json
{
  "fason_id": 5,
  "is_emri_id": 123,
  "adet": 50,
  "birim_fiyat": 25.00,
  "termin_tarihi": "2024-02-15"
}
```

---

## 8. Sevkiyat API

### 8.1 Sevkiyat Listesi

```
GET /api/sevkiyat
```

### 8.2 Sevkiyat Oluştur

```
POST /api/sevkiyat
```

**Request Body**:
```json
{
  "siparis_no": "SIP-2024-001",
  "musteri_id": 10,
  "sevkiyat_tarihi": "2024-02-01",
  "adres": "Adres bilgisi",
  "kalemler": [...]
}
```

---

## 9. Stok Kartları API

### 9.1 Stok Kartları Listesi

```
GET /api/stok-kartlari
```

**Query Parameters**:
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| stok_kodu | string | Stok kodu filtresi |
| kategori | string | Kategori filtresi |

### 9.2 Stok Hareketi Ekle

```
POST /api/stok-kartlari/:id/hareket
```

**Request Body**:
```json
{
  "tur": "giris",
  "adet": 100,
  "birim_fiyat": 25.50,
  "aciklama": "Tedarikçi teslimatı"
}
```

**Tur Values**:
- `giris`: Stok girişi
- `cikis`: Stok çıkışı
- `sayim`: Sayım farkı

---

## 10. Notlar API

### 10.1 Not Listesi

```
GET /api/notlar
```

**Query Parameters**:
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| kategori_id | number | Kategori filtresi |
| baslik | string | Başlık arama |
| etiket | string | Etiket filtresi |

### 10.2 Not Oluştur

```
POST /api/notlar
```

**Request Body**:
```json
{
  "baslik": "Önemli Not",
  "icerik": "Not içeriği",
  "kategori_id": 1,
  "etiketler": ["önemli", "acil"]
}
```

---

## 11. Raporlar API

### 11.1 Üretim Raporu

```
GET /api/raporlar/uretim
```

**Query Parameters**:
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| baslangic_tarih | date | Başlangıç tarihi |
| bitis_tarih | date | Bitiş tarihi |
| gruplama | string | Gruplama (gun, hafta, ay) |

### 11.2 Tezgah Performans Raporu

```
GET /api/raporlar/tezgah-performans
```

**Query Parameters**:
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| tezgah_id | number | Tezgah ID |
| baslangic_tarih | date | Başlangıç tarihi |
| bitis_tarih | date | Bitiş tarihi |

---

## Socket.IO Events

### Client → Server

**Bağlantı**:
```javascript
socket.on('connect', () => {
  console.log('Bağlandı');
});
```

**Odaya Katılma**:
```javascript
socket.emit('join_room', 'production');
```

### Server → Client

**İş Emri Güncelleme**:
```javascript
socket.on('is_emri_updated', (data) => {
  // { id, durum, ... }
});
```

**Tezgah Durum Değişikliği**:
```javascript
socket.on('tezgah_durum_changed', (data) => {
  // { tezgah_id, durum, ... }
});
```

**Yeni Bildirim**:
```javascript
socket.on('bildirim', (data) => {
  // { mesaj, tip, ... }
});
```

---

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek |
| 401 | Yetkisiz |
| 403 | Yasak |
| 404 | Bulunamadı |
| 409 | Çakışma (lock vb.) |
| 422 | Doğrulama hatası |
| 500 | Sunucu hatası |

**Hata Response Format**:
```json
{
  "success": false,
  "error": "Hata mesajı",
  "details": {
    "field": "validation error"
  }
}
```

---

## Pagination

Tüm list endpoint'leri pagination destekler:

**Request**:
```
GET /api/resource?page=1&limit=20
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

---

## Rate Limiting

- **Default**: 100 istek / 15 dakika
- **Auth Required**: Daha yüksek limit

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567890
```

---

## File Upload

**Desteklenen Formatlar**:
- Images: PNG, JPG, JPEG (max 5MB)
- Documents: PDF (max 10MB)
- Excel: XLSX (max 10MB)

**Upload Endpoint**:
```
POST /api/upload
Content-Type: multipart/form-data
```

**Response**:
```json
{
  "success": true,
  "filename": "uploaded-file.png",
  "path": "/uploads/2024/01/uploaded-file.png",
  "url": "http://localhost:3000/uploads/2024/01/uploaded-file.png"
}
```

---

## Authentication

### Login

```
POST /api/auth/login
```

**Request Body**:
```json
{
  "kullanici_adi": "admin",
  "sifre": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "kullanici_adi": "admin",
    "personel_id": 5,
    "rol": "admin"
  }
}
```

### Korumalı İstek

```
GET /api/protected-endpoint
Authorization: Bearer <token>
```

---

## Version History

- **v1.0** (2024-01): Initial API release
- **v1.1** (2024-06): İrsaliye modülü eklendi
- **v1.2** (2024-09): Lock mekanizması eklendi
- **v1.3** (2024-12): Socket.IO real-time updates eklendi
