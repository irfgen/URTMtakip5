# ÜRTM Takip Sistemi - API Dokümantasyonu

## 📡 API Genel Bakış

ÜRTM Takip Sistemi RESTful API'si üretim takip ve yönetimi için kapsamlı servisler sunar. API **Express.js** frameworkü üzerinde çalışır ve gerçek zamanlı iletişim için **Socket.IO** desteklenir.

### 🔗 Temel Bilgiler

- **Base URL**: `http://localhost:3000/api`
- **Authentication**: JWT Token-based
- **Content-Type**: `application/json`
- **Real-time**: Socket.IO available
- **Rate Limiting**: Enabled (configurable)

### 📊 API İstatistikleri

- **Toplam Route**: 60+ endpoint
- **Route Dosyaları**: 57 farklı modül
- **HTTP Metotları**: GET, POST, PUT, DELETE
- **Response Format**: JSON
- **Error Handling**: Centralized error middleware

---

## 🔐 Authentication

### Login Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "kullanici_adi",
  "password": "sifre"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "kullanici_adi",
    "role": "admin"
  }
}
```

### Token Usage
```http
Authorization: Bearer <jwt_token>
```

---

## 📋 Modüller ve Endpoint'ler

### 🏭 İş Emirleri (Work Orders)

**Endpoint'ler:**
- `GET /api/is-emirleri` - Tüm iş emirlerini listele
- `POST /api/is-emirleri` - Yeni iş emri oluştur
- `PUT /api/is-emirleri/:id` - İş emrini güncelle
- `DELETE /api/is-emirleri/:id` - İş emrini sil
- `GET /api/is-emirleri/:id` - İş emri detayları
- `POST /api/is-emirleri/batch-create` - Toplu iş emri oluştur
- `POST /api/is-emirleri/create-from-plan` - Üretim planından iş emri oluştur
- `POST /api/is-emirleri/sirala` - İş emri sıralaması
- `POST /api/is-emirleri/:id/confirm-fason` - Fason dönüşüm onayı

**Örnek Request:**
```http
POST /api/is-emirleri
{
  "parcaKodu": "PR-001",
  "parcaAdi": "Test Parçası",
  "miktar": 100,
  "tezgahId": 1,
  "durum": "beklemede"
}
```

---

### 🏗️ Tezgahlar (Workstations)

**Endpoint'ler:**
- `GET /api/tezgahlar` - Tüm tezgahları listele
- `POST /api/tezgahlar` - Yeni tezgah ekle
- `PUT /api/tezgahlar/:id` - Tezgah güncelle
- `DELETE /api/tezgahlar/:id` - Tezgah sil
- `GET /api/tezgahlar/:id/durum` - Tezgah durumu
- `POST /api/tezgahlar/:id/durum-guncelle` - Durum güncelle

---

### 📦 Parçalar (Parts)

**Endpoint'ler:**
- `GET /api/parcalar` - Tüm parçaları listele
- `POST /api/parcalar` - Yeni parça ekle
- `PUT /api/parcalar/:id` - Parça güncelle
- `DELETE /api/parcalar/:id` - Parça sil
- `GET /api/parcalar/:parcaKodu` - Parça detayları
- `POST /api/parcalar/import` - Parça içe aktar

---

### 📋 BOM Yönetimi (Bill of Materials)

**Endpoint'ler:**
- `GET /api/boms` - Tüm BOM'ları listele
- `POST /api/boms` - Yeni BOM oluştur
- `PUT /api/boms/:id` - BOM güncelle
- `DELETE /api/boms/:id` - BOM sil
- `GET /api/boms/:id/detay` - BOM detayları
- `POST /api/boms/import` - BOM içe aktar

---

### 📅 Üretim Planı (Production Planning)

**Endpoint'ler:**
- `GET /api/uretim-plani` - Üretim planlarını listele
- `POST /api/uretim-plani` - Yeni üretim planı oluştur
- `PUT /api/uretim-plani/:id` - Plan güncelle
- `DELETE /api/uretim-plani/:id` - Plan sil
- `POST /api/uretim-plani/import-excel` - Excel'den içe aktar

**V2 Sistem:**
- `GET /api/uretim-planlari` - Yeni sistem planları
- `POST /api/uretim-planlari` - Yeni plan oluştur

---

### 🔧 Arıza-Bakım (Maintenance)

**Endpoint'ler:**
- `GET /api/ariza-bakim` - Arıza kayıtlarını listele
- `POST /api/ariza-bakim` - Yeni arıza kaydı oluştur
- `PUT /api/ariza-bakim/:id` - Arıza kaydını güncelle
- `DELETE /api/ariza-bakim/:id` - Arıza kaydını sil

---

### 🚚 Sevkiyat (Shipping)

**Endpoint'ler:**
- `GET /api/sevkiyat` - Sevkiyatları listele
- `POST /api/sevkiyat` - Yeni sevkiyat oluştur
- `PUT /api/sevkiyat/:id` - Sevkiyat güncelle
- `POST /api/sevkiyat/toplu` - Toplu sevkiyat
- `GET /api/sevkiyat/resimler/:id` - Sevkiyat görselleri

---

### 📊 Raporlar (Reports)

**Endpoint'ler:**
- `GET /api/raporlar/uretim` - Üretim raporu
- `GET /api/raporlar/tezgah-performansi` - Tezgah performansı
- `GET /api/raporlar/stok-durumu` - Stok durumu
- `GET /api/raporlar/fason-analizi` - Fason analizi
- `POST /api/raporlar/export` - Rapor dışa aktar

---

### 🗃️ Stok Kartları (Inventory)

**Endpoint'ler:**
- `GET /api/stok-kartlari` - Stok kartlarını listele
- `POST /api/stok-kartlari` - Yeni stok kartı oluştur
- `PUT /api/stok-kartlari/:id` - Stok kartı güncelle
- `GET /api/stok-takip-listeleri` - Stok takip listeleri
- `POST /api/stok-hareketi` - Stok hareketi ekle

---

### 📝 Notlar (Notes)

**Endpoint'ler:**
- `GET /api/notlar` - Notları listele
- `POST /api/notlar` - Yeni not oluştur
- `PUT /api/notlar/:id` - Not güncelle
- `DELETE /api/notlar/:id` - Not sil
- `GET /api/kategoriler` - Not kategorileri

---

### 👥 Personel ve Vardiya (Personnel & Shifts)

**Endpoint'ler:**
- `GET /api/personel` - Personel listesi
- `POST /api/personel` - Yeni personel ekle
- `GET /api/vardiyalar` - Vardiya listesi
- `POST /api/vardiya-atama` - Vardiya ataması
- `PUT /api/vardiya-atama/:id` - Atama güncelle

---

### 🎯 Makindex Modülü (Hierarchical System)

**Endpoint'ler:**
- `GET /api/makindex/siniflar` - Sınıfları listele
- `POST /api/makindex/siniflar` - Yeni sınıf oluştur
- `GET /api/makindex/boms` - Makindex BOM'ları
- `POST /api/makindex/boms` - Makindex BOM oluştur
- `GET /api/makindex/stok-durumu` - Stok durumu
- `POST /api/makindex/stok-guncelle` - Stok güncelle

---

### 📁 Dosya Yönetimi (File Management)

**Endpoint'ler:**
- `POST /api/upload` - Dosya yükle
- `GET /api/uploads/:filename` - Dosya indir
- `POST /api/import-export/import` - Veri içe aktar
- `POST /api/import-export/export` - Veri dışa aktar
- `GET /api/cad-files` - CAD dosyaları
- `POST /api/dizin-tarama` - Dizin tarama

---

### 🔗 CAD Entegrasyonu

**Endpoint'ler:**
- `GET /api/cad-import/clients` - Bağlı client'lar
- `POST /api/cad-import/start-job` - İş başlat
- `POST /api/cad-import/stop-job` - İş durdur
- `GET /api/cad-import/status/:jobId` - İş durumu

---

### 📡 Real-time Communication (Socket.IO)

**Event'ler:**
- `isEmriGuncellendi` - İş emri güncellemesi
- `makindex-join` - Makindex odasına katıl
- `makindex-stok-guncellemesi` - Stok güncellemesi
- `parca-eklendi` - Yeni parça eklendi
- `bom-guncellendi` - BOM güncellendi
- `client-connected` - CAD client bağlandı

**Socket.IO Connection:**
```javascript
const socket = io('http://localhost:3000');

socket.on('isEmriGuncellendi', (data) => {
  console.log('İş emri güncellendi:', data);
});

socket.emit('makindex-join');
```

---

## 🚨 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Hata mesajı",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation_error"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Yetkisiz erişim
- `VALIDATION_ERROR` - Validasyon hatası
- `NOT_FOUND` - Kayıt bulunamadı
- `FILE_TOO_LARGE` - Dosya boyutu çok büyük
- `RATE_LIMIT_EXCEEDED` - İstek limiti aşıldı

---

## 📝 Response Format Standards

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "İşlem başarılı",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 🔧 Development Tools

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "ÜRTM Takip Server çalışıyor",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "11.3.184"
}
```

### Port Information
```http
GET /port-info
```

---

## 📚 Usage Examples

### JavaScript/React Example
```javascript
// İş emri getirme
const fetchIsEmirleri = async () => {
  try {
    const response = await fetch('/api/is-emirleri', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Yeni iş emri oluşturma
const createIsEmri = async (isEmriData) => {
  try {
    const response = await fetch('/api/is-emirleri', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(isEmriData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### cURL Example
```bash
# Tüm iş emirlerini getir
curl -X GET "http://localhost:3000/api/is-emirleri" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Yeni iş emri oluştur
curl -X POST "http://localhost:3000/api/is-emirleri" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "parcaKodu": "PR-001",
    "parcaAdi": "Test Parçası",
    "miktar": 100
  }'
```

---

## 🔍 API Testing

### Example with Postman/Newman
```json
{
  "info": {
    "name": "ÜRTM API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "İş Emirleri",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/is-emirleri",
          "host": ["{{base_url}}"],
          "path": ["api", "is-emirleri"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "token",
      "value": "your_jwt_token_here"
    }
  ]
}
```

---

## 📈 Rate Limiting

API request'leri için rate limiting uygulanmaktadır:

- **Default**: 100 istek / 15 dakika
- **Authenticated**: 1000 istek / 15 dakika
- **File Upload**: 10 istek / 15 dakika

Rate limit header'ları:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

---

## 🔐 Security Features

- ✅ JWT Authentication
- ✅ Helmet.js Security Headers
- ✅ CORS Configuration
- ✅ Input Validation (Joi)
- ✅ Rate Limiting
- ✅ File Upload Security
- ✅ SQL Injection Protection (Sequelize ORM)

---

## 📝 API Versioning

Mevcut API versiyonu: **v1**

Gelecek versiyonlar için URL formatı:
```
/api/v1/resource (current)
/api/v2/resource (future)
```

---

## 📞 Support

API ile ilgili sorunlar için:
- **Backend Logları**: `backend/logs/` dizini
- **Health Check**: `/api/health` endpoint'i
- **Console**: Socket.IO connection status

---

*Bu dokümantasyon ÜRTM Takip Sistemi API'nin güncel durumunu yansıtmaktadır. Son güncelleme: 2024-11-02*