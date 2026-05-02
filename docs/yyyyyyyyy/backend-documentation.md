# ÜRTM Takip Backend Dokümantasyonu

## Backend Mimarisi

ÜRTM Takip backend sistemi, Node.js ve Express.js tabanlı, RESTful API sunan bir üretim yönetim sistemidir.

### Teknik Altyapı

- **Framework**: Express.js 4.18.2
- **ORM**: Sequelize 6.37.5
- **Veritabanı**: SQLite
- **Port**: 3000
- **Authentication**: JWT (hazır, opsiyonel)
- **File Upload**: Multer
- **Image Processing**: Sharp
- **OCR**: Tesseract.js
- **Real-time**: Socket.IO
- **Logging**: Winston
- **Validation**: Joi

### Proje Yapısı

```
backend/
├── src/
│   ├── controllers/     # İş mantığı (23 controller)
│   ├── models/         # Veri modelleri (32 model)
│   ├── routes/         # API route'ları (60 route)
│   ├── middleware/     # Custom middleware'lar
│   ├── config/         # Konfigürasyon dosyaları
│   ├── services/       # Servis katmanı
│   ├── utils/          # Yardımcı fonksiyonlar
│   └── index.js        # Ana sunucu dosyası
├── database.sqlite     # SQLite veritabanı (98MB)
├── uploads/           # Dosya yüklemeleri
├── importlar/         # Excel importları
├── migrations/        # Veritabanı migrasyonları
└── package.json
```

## Ana Modüller

### 1. Üretim Yönetimi

**İş Emirleri (`IsEmir.js`)**
- İş emri oluşturma, güncelleme, durum takibi
- Tezgah atama ve operasyon yönetimi
- Durum kodları: 0 (Planlandı), 1 (Üretimde), 2 (Tamamlandı), 3 (İptal)

**Üretim Planları (`UretimPlani.js`, `UretimPlanlari.js`)**
- V1: Karmaşık BOM tabanlı planlama
- V2: Basitleştirilmiş JSON tabanlı planlama
- Excel import/export desteği
- Kritik stok analizi

### 2. Parça ve BOM Yönetimi

**Parçalar (`Parca.js`)**
- Parça katalog yönetimi
- Teknik çizimler ve fotoğraflar
- Stok entegrasyonu

**BOM (`Bom.js`)**
- Malzeme listesi hiyerarşisi
- BOM kopyalama ve versiyonlama
- Maliyet hesaplamaları

### 3. Tezgah ve Operasyon

**Tezgahlar (`Tezgah.js`)**
- Makine/tezgah tanımları
- Durum takibi ve loglama
- ESP32 CNC panel entegrasyonu

**İşlem Kayıtları (`IslemKayitlari.js`)**
- Operasyon zaman kayıtları
- İşlem süreleri ve verimlilik

### 4. Operasyonel Modüller

**Fason İşler (`Fason.js`)**
- Fason teklif yönetimi
- Kapama ve onay süreçleri

**Sevkiyat (`Sevkiyat.js`)**
- Teslimat takibi
- Resim ve belge yönetimi

**Arıza-Bakım (`ArizaBakim.js`)**
- Ekipman bakım takibi
- Arıza kayıtları ve çözümleri

**Stok Kartları (`StokKarti.js`)**
- Envanter yönetimi
- Hareket takibi

### 5. Raporlama ve Analiz

**Raporlar (`Raporlar.js`)**
- Üretim raporları
- Performans analizi
- Excel export desteği

### 6. Sistem Yönetimi

**Kullanıcılar (`User.js`)**
- Kullanıcı yönetimi
- Rol bazlı erişim

**Notlar (`Notlar.js`)**
- Not sistemi
- Kategori ve etiketleme

## API Route Yapısı

### Ana Route Kategorileri

1. **Core Business**:
   - `/api/is-emirleri` - İş emri yönetimi
   - `/api/parcalar` - Parça yönetimi
   - `/api/tezgahlar` - Tezgah yönetimi
   - `/api/uretim-plani` - Üretim planı V1
   - `/api/uretim-planlari` - Üretim planı V2
   - `/api/boms` - BOM yönetimi

2. **Operations**:
   - `/api/sevkiyat` - Sevkiyat yönetimi
   - `/api/stok-kartlari` - Stok yönetimi
   - `/api/fason` - Fason iş yönetimi
   - `/api/ariza-bakim` - Bakım yönetimi

3. **System**:
   - `/api/users` - Kullanıcı yönetimi
   - `/api/notlar` - Not sistemi
   - `/api/raporlar` - Raporlama
   - `/api/upload` - Dosya yükleme

### Örnek API Endpoint

```javascript
// İş emri oluşturma
POST /api/is-emirleri
{
  "siparisNo": "SO-2024-001",
  "parcaId": "uuid-here",
  "tezgahId": 1,
  "miktar": 100,
  "terminTarihi": "2024-12-30"
}

// Üretim planı Excel import
POST /api/uretim-plani/import-excel
Content-Type: multipart/form-data

// Tezgah durumu güncelleme
PUT /api/tezgahlar/:id/durum
{
  "durum": 1, // 0: Durdu, 1: Çalışıyor, 2: Hata
  "aciklama": "Operasyon başladı"
}
```

## Veritabanı Migrasyon Sistemi

### Mevcut Migrasyonlar

1. **20240912000001-add-tahmini-isleme-suresi.js**
   - İş emirlerine tahmini işlem süresi eklendi
   - Performans analizi için veri desteği

2. **20250924_add_cost_fields_to_boms.js**
   - BOM tablolarına maliyet alanları eklendi
   - Maliyet analizi ve raporlama

3. **20250701000001-create-notlar-tables.js**
   - Not sistemi tabloları oluşturuldu
   - Kategori ve etiketleme desteği

### Migrasyon Komutları

```bash
cd backend
npm run migrate              # Bekleyen migrasyonları çalıştır
npm run migrate-durum        # Durum modülü migrasyonu
npm run rollback-durum       # Durum migrasyonu rollback
npm run check-durum-status   # Migrasyon durumu kontrol
```

## Socket.IO Real-time Events

### Ana Event'ler

```javascript
// Tezgah durumu güncelleme
'tezgahDurumGuncelle': {
  tezgahId: number,
  durum: number,
  aciklama: string
}

// İş emri durum güncelleme
'isEmriDurumGuncelle': {
  isEmriId: string,
  durum: number,
  userId: string
}

// Yeni bildirim
'bildirim': {
  mesaj: string,
  tip: string,
  userId: string
}
```

## Güvenlik ve Validasyon

### Middleware'ler

1. **Helmet**: Güvenlik header'ları
2. **Rate Limiting**: API istek limitleri
3. **CORS**: Çoklu alan desteği
4. **Multer**: Güvenli dosya yükleme
5. **Joi**: Input validasyonu

### Validasyon Örneği

```javascript
// İş emri validasyon şemasi
const isEmriSchema = Joi.object({
  siparisNo: Joi.string().required(),
  parcaId: Joi.string().uuid().required(),
  tezgahId: Joi.number().integer().required(),
  miktar: Joi.number().integer().min(1).required(),
  terminTarihi: Joi.date().required()
});
```

## Performans Optimizasyonları

### Veritabanı Optimizasyonları

1. **Connection Pooling**: Sequelize bağlantı havuzu
2. **Index'leme**: Sık kullanılan alanlar
3. **Query Optimization**: Eager loading ile N+1 sorun çözümü
4. **Caching**: Redis opsiyonel desteği

### Resim ve Dosya İşleme

1. **Sharp**: Resim boyutlandırma ve optimizasyon
2. **Multer**: Sıkı dosya boyut limitleri
3. **OCR**: Tesseract.js ile teknik çizim metin çıkarma

## Loglama ve Hata Yönetimi

### Winston Konfigürasyonu

```javascript
// Log seviyeleri
- error: Sistem hataları
- warn: Uyarılar
- info: Bilgilendirme
- debug: Geliştirme bilgileri

// Log formatı
{
  timestamp: "2024-12-15T10:30:00.000Z",
  level: "info",
  message: "İş emri oluşturuldu",
  meta: { isEmriId: "uuid", userId: "uuid" }
}
```

## API Rate Limiting

```javascript
// Genel limit: 100 istek/dakika
// Upload limit: 10 istek/dakika
// Login limit: 5 istek/dakika
```

## Environment Variables

```bash
# .env dosyası
NODE_ENV=development
PORT=3000
DB_PATH=./database.sqlite
UPLOAD_MAX_SIZE=100MB
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

## Test Yapısı

### Jest Test Setup

```bash
# Testleri çalıştırma
npm test

# Coverage raporu
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Kategorileri

1. **Unit Tests**: Controller ve servis fonksiyonları
2. **Integration Tests**: API endpoint'leri
3. **Database Tests**: Model ilişkileri ve validasyonlar

## Development Komutları

```bash
# Development server
npm run dev              # Nodemon ile hot reload

# Production build
npm start                # Production modda başlat

# Database işlemleri
npm run migrate          # Tüm migrasyonları çalıştır
npm run migrate:undo     # Son migrasyonu geri al

# Log temizleme
npm run clear-logs       # Log dosyalarını temizle
```

## Deployment

### Production Setup

1. **PM2**: Process management
2. **Nginx**: Reverse proxy
3. **SSL**: HTTPS desteği
4. **Backup**: Otomatik veritabanı yedekleme

### PM2 Konfigürasyonu

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'urtm-backend',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log'
  }]
};
```

## İzleme ve Metrikler

### Performance Metrics

- **Response Time**: API yanıt süreleri
- **Database Queries**: Sorgu performansı
- **Memory Usage**: Bellek kullanımı
- **CPU Usage**: İşlemci kullanımı
- **Error Rate**: Hata oranları

### Health Check Endpoints

```javascript
GET /api/health          # Sistem durumu
GET /api/health/db       # Veritabanı bağlantısı
GET /api/health/memory   # Bellek durumu
```

## İleri Konular

### Scaling Stratejileri

1. **Horizontal Scaling**: Load balancing
2. **Database Sharding**: Veritabanı dağıtımı
3. **Caching Layer**: Redis entegrasyonu
4. **Microservices**: Modüler ayrıştırma

### Security Enhancements

1. **Advanced Authentication**: 2FA desteği
2. **API Key Management**: API anahtar yönetimi
3. **Audit Logging**: Detaylı loglama
4. **Data Encryption**: Veri şifreleme

### Backup ve Recovery

1. **Automated Backups**: Otomatik yedekleme
2. **Point-in-time Recovery**: Zaman noktası geri dönüşüm
3. **Disaster Recovery**: Af durumunda kurtarma planı