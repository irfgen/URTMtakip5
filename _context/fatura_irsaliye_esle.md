# Fatura & İrsaliye Eşleştirme Sistemi - Yol Haritası

## 📋 Proje Özeti

ÜRTM Takip projesine dış kaynaklı fatura ve irsaliye belgelerinin yönetimi ve **Üçlü Eşleştirme (3-Way Matching)** mekanizması eklenecek. Sistem, manuel veri girişi ile n8n AI/OCR entegrasyonunu destekleyecek şekilde tasarlanacaktır.

---

## 🎯 Kapsam ve Sınırlamalar

### ✅ Dahil Olanlar
- İrsaliye ve Fatura oluşturma (manuel girişler)
- Kalem bazlı kayıt yönetimi
- Tedarikçi bazlı otomatik eşleştirme önerileri
- Miktar kontrolü ve uyarılar
- Lock mekanizması (eş zamanlılık kontrolü)
- Mobil irsaliye girişi
- Desktop fatura yönetimi

### ❅ İleride Yapılacaklar (Phase 2+)
- Stok kartları ile entegrasyon
- Maliyet yönetimi (FIFO/Weighted Average)
- Çoklu belge yükleme
- Eşleşme raporları

---

## 📊 Veritabanı Şeması

### 1. irsaliyeler Tablosu (Ana Tablo)

```sql
CREATE TABLE irsaliyeler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    irsaliye_no TEXT UNIQUE NOT NULL,
    tedarikci_id INTEGER NOT NULL,          -- Firma tablosu ile ilişki
    belge_tarih DATE NOT NULL,
    kayit_tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
    belge_tipi TEXT DEFAULT 'gelis',        -- 'gelis' veya 'cikis'
    toplam_kalem INTEGER DEFAULT 0,
    toplm_miktar REAL DEFAULT 0,
    durum TEXT DEFAULT 'bekliyor',          -- 'bekliyor', 'kismi_eslesti', 'tam_eslesti'
    aciklama TEXT,
    created_by INTEGER,                     -- Kullanıcı ID
    locked_by INTEGER,                      -- Lock mekanizması - işleyen kullanıcı ID
    locked_at DATETIME,                     -- Lock zamanı
    FOREIGN KEY (tedarikci_id) REFERENCES firmalar(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (locked_by) REFERENCES users(id)
);

CREATE INDEX idx_irs_tedarikci ON irsaliyeler(tedarikci_id);
CREATE INDEX idx_irs_durum ON irsaliyeler(durum);
CREATE INDEX idx_irs_tarih ON irsaliyeler(belge_tarih);
```

### 2. irsaliye_kalemleri Tablosu

```sql
CREATE TABLE irsaliye_kalemleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    irsaliye_id INTEGER NOT NULL,
    tedarikci_id INTEGER NOT NULL,          -- Denormalizasyon - hızlı eşleştirme için
    stok_kodu TEXT NOT NULL,                -- Serbest kod girişi (validasyon yok)
    parca_adi TEXT,
    miktar REAL NOT NULL,
    birim TEXT DEFAULT 'Adet',              -- Adet, KG, Lt, Mt vb.
    eslesme_durumu INTEGER DEFAULT 0,       -- 0: Bekliyor, 1: Eşleşti
    eslesen_fatura_kalem_id INTEGER,        -- Eşleşen fatura kalemi ID
    aciklama TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (irsaliye_id) REFERENCES irsaliyeler(id) ON DELETE CASCADE,
    FOREIGN KEY (tedarikci_id) REFERENCES firmalar(id),
    FOREIGN KEY (eslesen_fatura_kalem_id) REFERENCES fatura_kalemleri(id)
);

CREATE INDEX idx_irk_irsaliye ON irsaliye_kalemleri(irsaliye_id);
CREATE INDEX idx_irk_tedarikci ON irsaliye_kalemleri(tedarikci_id);
CREATE INDEX idx_irk_stok ON irsaliye_kalemleri(stok_kodu);
CREATE INDEX idx_irk_eslesme ON irsaliye_kalemleri(eslesme_durumu);
```

### 3. faturalar Tablosu (Ana Tablo)

```sql
CREATE TABLE faturalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fatura_no TEXT UNIQUE NOT NULL,
    tedarikci_id INTEGER NOT NULL,
    belge_tarih DATE NOT NULL,
    vade_tarih DATE,
    kayit_tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
    toplam_kalem INTEGER DEFAULT 0,
    toplam_miktar REAL DEFAULT 0,
    ara_toplam REAL DEFAULT 0,              -- Tutar bilgisi (sadece kaydetme)
    kdv REAL DEFAULT 0,
    genel_toplam REAL DEFAULT 0,
    durum TEXT DEFAULT 'bekliyor',          -- 'bekliyor', 'kismi_eslesti', 'tam_eslesti'
    aciklama TEXT,
    created_by INTEGER,
    locked_by INTEGER,                      -- Lock mekanizması
    locked_at DATETIME,
    belge_dosya_yolu TEXT,                  -- Yüklenen PDF/Görsel dosya yolu
    FOREIGN KEY (tedarikci_id) REFERENCES firmalar(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (locked_by) REFERENCES users(id)
);

CREATE INDEX idx_fat_tedarikci ON faturalar(tedarikci_id);
CREATE INDEX idx_fat_durum ON faturalar(durum);
CREATE INDEX idx_fat_tarih ON faturalar(belge_tarih);
```

### 4. fatura_kalemleri Tablosu

```sql
CREATE TABLE fatura_kalemleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fatura_id INTEGER NOT NULL,
    tedarikci_id INTEGER NOT NULL,          -- Denormalizasyon
    stok_kodu TEXT NOT NULL,
    parca_adi TEXT,
    miktar REAL NOT NULL,
    birim TEXT DEFAULT 'Adet',
    birim_fiyat REAL DEFAULT 0,             -- Sadece kayıt amaçlı
    toplam_tutar REAL DEFAULT 0,            -- miktar * birim_fiyat
    eslesme_durumu INTEGER DEFAULT 0,       -- 0: Bekliyor, 1: Eşleşti
    eslesen_irsaliye_kalem_id INTEGER,      -- Eşleşen irsaliye kalemi ID
    aciklama TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fatura_id) REFERENCES faturalar(id) ON DELETE CASCADE,
    FOREIGN KEY (tedarikci_id) REFERENCES firmalar(id),
    FOREIGN KEY (eslesen_irsaliye_kalem_id) REFERENCES irsaliye_kalemleri(id)
);

CREATE INDEX idx_fk_fatura ON fatura_kalemleri(fatura_id);
CREATE INDEX idx_fk_tedarikci ON fatura_kalemleri(tedarikci_id);
CREATE INDEX idx_fk_stok ON fatura_kalemleri(stok_kodu);
CREATE INDEX idx_fk_eslesme ON fatura_kalemleri(eslesme_durumu);
```

---

## 🔧 Backend API Endpoints

### İrsaliye Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/irsaliyeler` | İrsaliye listesi (filtreleme ile) |
| GET | `/api/irsaliyeler/:id` | İrsaliye detayı |
| POST | `/api/irsaliyeler` | Yeni irsaliye oluştur |
| PUT | `/api/irsaliyeler/:id` | İrsaliye güncelle |
| DELETE | `/api/irsaliyeler/:id` | İrsaliye sil |
| GET | `/api/irsaliyeler/:id/kalemler` | İrsaliye kalemleri |
| POST | `/api/irsaliyeler/:id/kalemler` | Kalem ekle |
| POST | `/api/irsaliyeler/:id/lock` | Lock al |
| DELETE | `/api/irsaliyeler/:id/lock` | Lock bırak |

### Fatura Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/faturalar` | Fatura listesi |
| GET | `/api/faturalar/:id` | Fatura detayı |
| POST | `/api/faturalar` | Yeni fatura oluştur |
| PUT | `/api/faturalar/:id` | Fatura güncelle |
| DELETE | `/api/faturalar/:id` | Fatura sil |
| GET | `/api/faturalar/:id/kalemler` | Fatura kalemleri |
| POST | `/api/faturalar/:id/kalemler` | Kalem ekle |
| POST | `/api/faturalar/:id/lock` | Lock al |
| DELETE | `/api/faturalar/:id/lock` | Lock bırak |

### Eşleştirme Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/eslestirme/oneler/:fatura_id` | Eşleştirme önerileri |
| POST | `/api/eslestirme/onayla` | Eşleşmeyi onayla |
| POST | `/api/eslestirma/reddet` | Eşleşmeyi reddet |
| POST | `/api/eslestirme/manuel` | Manuel eşleştirme |

---

## 🎨 Frontend Komponenleri

### Desktop (Fatura Yönetimi)

```
frontend/src/pages/Faturalar.jsx                 (Ana sayfa - liste)
frontend/src/pages/FaturaDetay.jsx               (Detay ve eşleştirme)
frontend/src/pages/FaturaForm.jsx                (Yeni/Düzenle)
frontend/src/components/fatura/FaturaKalemTable.jsx
frontend/src/components/fatura/EslestirmeOneriModal.jsx
frontend/src/components/fatura/EslestirmeDetay.jsx
```

### Mobile (İrsaliye Yönetimi)

```
frontend/src/pages/mobile/IrsaliyelerMobile.jsx           (Liste)
frontend/src/pages/mobile/IrsaliyeFormMobile.jsx          (Form)
frontend/src/pages/mobile/IrsaliyeDetayMobile.jsx         (Detay)
frontend/src/components/mobile/IrsaliyeKalemMobile.jsx    (Kalem ekleme)
```

### Shared (Ortak)

```
frontend/src/components/fatura-irsaliye/KalemListesi.jsx
frontend/src/components/fatura-irsaliye/EşlestiriCard.jsx
frontend/src/components/fatura-irsaliye/MiktarUyari.jsx
```

---

## 🔐 Eşleştirme Algoritması

### Algoritma Mantığı

```javascript
// Backend: backend/src/services/eslestirmeService.js

async function eslestirmeOnerileriGetir(faturaId) {
    // 1. Faturayı getir
    const fatura = await Fatura.findByPk(faturaId, {
        include: [{ model: FaturaKalem, as: 'kalemler' }]
    });

    // 2. Aynı tedarikçinin bekleyen irsaliyelerini bul
    const bekleyenIrsaliyeler = await IrsaliyeKalem.findAll({
        where: {
            tedarikci_id: fatura.tedarikci_id,
            eslesme_durumu: 0  // Bekleyen
        },
        include: [{ model: Irasliye, as: 'irsaliye' }]
    });

    // 3. Kalem bazlı eşleştirme
    const oneriler = [];
    const faturaKalemleri = fatura.kalemleri;

    for (const faturaKalem of faturaKalemleri) {
        // Aynı stok kodunu ara
        const adaylar = bekleyenIrsaliyeler.filter(
            ik => ik.stok_kodu === faturaKalem.stok_kodu
        );

        for (const aday of adaylar) {
            const miktarFarki = Math.abs(faturaKalem.miktar - aday.miktar);
            const eslesmeTipi = miktarFarki < 0.01 ? 'tam' : 'ksimi';

            oneriler.push({
                faturaKalem: faturaKalem,
                irsaliyeKalem: aday,
                eslesmeTipi,
                miktarFarki,
                oncelik: eslesmeTipi === 'tam' ? 1 : 2
            });
        }
    }

    // 4. Öncelik sırasına göre döndür
    return oneriler.sort((a, b) => a.oncelik - b.oncelik);
}

async function eslestirmeyiOnayla(faturaKalemId, irsaliyeKalemId, userId) {
    return await sequelize.transaction(async (t) => {
        // 1. Lock kontrolü
        const lockKontrol = await lockKontrolu(faturaKalemId, userId);
        if (!lockKontrol) throw new Error('Kayıt başka bir kullanıcı tarafından kilitli.');

        // 2. Eşleşmeyi güncelle
        await FaturaKalem.update(
            { eslesme_durumu: 1, eslesen_irsaliye_kalem_id: irsaliyeKalemId },
            { where: { id: faturaKalemId }, transaction: t }
        );

        await IrasliyeKalem.update(
            { eslesme_durumu: 1, eslesen_fatura_kalem_id: faturaKalemId },
            { where: { id: irsaliyeKalemId }, transaction: t }
        );

        // 3. Ana belge durumlarını güncelle
        await eslestirmeDurumGuncelle(faturaKalem.fatura_id, t);
        await eslestirmeDurumGuncelle(irsaliyeKalem.irsaliye_id, t, 'irsaliye');
    });
}
```

### Lock Mekanizması

```javascript
// Lock al
async function lockAl(belgeId, belgeTipi, userId) {
    const now = new Date();
    const lockTimeout = new Date(now.getTime() - 30 * 60 * 1000); // 30 dk

    const belge = belgeTipi === 'fatura'
        ? await Fatura.findByPk(belgeId)
        : await Irasliye.findByPk(belgeId);

    // Timeout lock'ları temizle
    if (belge.locked_at && belge.locked_at < lockTimeout) {
        await belge.update({ locked_by: null, locked_at: null });
    }

    // Lock kontrolü
    if (belge.locked_by && belge.locked_by !== userId) {
        throw new Error('Kayıt başka bir kullanıcı tarafından kilitli.');
    }

    // Lock al
    await belge.update({ locked_by: userId, locked_at: now });
    return true;
}

// Lock bırak
async function lockBirak(belgeId, belgeTipi, userId) {
    const belge = belgeTipi === 'fatura'
        ? await Fatura.findByPk(belgeId)
        : await Irasliye.findByPk(belgeId);

    if (belge.locked_by !== userId) {
        throw new Error('Sadece kendi lock'unuzu bırakabilirsiniz.');
    }

    await belge.update({ locked_by: null, locked_at: null });
    return true;
}
```

---

## 📱 İş Akış Diagramı

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SEVKİYAT DEPARTMANI                           │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Mobil İrsaliye     │
                    │  Giriş Ekranı       │
                    └─────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌──────────────┐      ┌──────────────┐
            │ Manuel Giriş │      │  n8n OCR     │
            │  (Form)      │      │  (Opsiyonel) │
            └──────────────┘      └──────────────┘
                    │                     │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │  İrsaliye Kaydet    │
                    │  (eslesme_durumu=0) │
                    └─────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          DEPO (TESLİMAT)                             │
└──────────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Depo Teslim Al     │
                    │  Onayı              │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  İrsaliye KALEMLERİ │
                    │  Onaylanmış         │
                    └─────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         MUHASEBE / FATURA                             │
└──────────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Fatura Yükle       │
                    │  (Desktop)          │
                    └─────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌──────────────┐      ┌──────────────┐
            │ Manuel Giriş │      │  n8n OCR     │
            └──────────────┘      └──────────────┘
                    │                     │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │  Fatura Kaydet      │
                    │  (eslesme_durumu=0) │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Sistem Otomatik    │
                    │  Eşleştirme Öneri   │
                    └─────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                  ▼
    ┌─────────────────────┐          ┌─────────────────────┐
    │   TAM EŞLEŞME       │          │   MİKTAR FARKI     │
    │   Miktar = Miktar   │          │   Fark var          │
    └─────────────────────┘          └─────────────────────┘
              │                                  │
              ▼                                  ▼
    ┌─────────────────────┐          ┌─────────────────────┐
    │  "Onayla" by Kullanıcı│         │  Uyarı Göster       │
    └─────────────────────┘          └─────────────────────┘
              │                                  │
              └────────────────┬────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │  Eşleşme Tamamla    │
                    │  - irs.eslesme=1    │
                    │  - fat.eslesme=1    │
                    │  - Karşılıklı ID'ler │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Başarılı Mesaj     │
                    └─────────────────────┘
```

---

## 🗂️ Dosya Yapısı

```
URTMtakip/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Irasliye.js                    (YENİ)
│   │   │   ├── IrasliyeKalem.js               (YENİ)
│   │   │   ├── Fatura.js                      (YENİ)
│   │   │   └── FaturaKalem.js                 (YENİ)
│   │   ├── routes/
│   │   │   ├── irsaliyeler.js                 (YENİ)
│   │   │   ├── faturalar.js                   (YENİ)
│   │   │   └── eslestirme.js                  (YENİ)
│   │   ├── controllers/
│   │   │   ├── irsaliyeController.js          (YENİ)
│   │   │   ├── faturaController.js            (YENİ)
│   │   │   └── eslestirmeController.js        (YENİ)
│   │   └── services/
│   │       └── eslestirmeService.js           (YENİ)
│   └── migrations/
│       └── 20250101_create_fatura_irsaliye.js (YENİ)
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Faturalar.jsx                  (YENİ)
│       │   ├── FaturaDetay.jsx                (YENİ)
│       │   ├── FaturaForm.jsx                 (YENİ)
│       │   └── mobile/
│       │       ├── IrsaliyelerMobile.jsx      (YENİ)
│       │       ├── IrsaliyeFormMobile.jsx     (YENİ)
│       │       └── IrsaliyeDetayMobile.jsx    (YENİ)
│       ├── components/
│       │   └── fatura-irsaliye/               (YENİ KLASÖR)
│       │       ├── KalemListesi.jsx
│       │       ├── EslestirmeCard.jsx
│       │       └── MiktarUyari.jsx
│       └── App.jsx                            (GÜNCELLEME - route ekle)
│
└── _context/
    └── fatura_irsaliye_esle.md                (BU DOSYA)
```

---

## 📝 Implementasyon Sırası

### Faz 1: Temel Altyapı (Backend)
1. ✅ Migration dosyasını oluştur
2. ✅ Modelleri tanımla (Sequelize)
3. ✅ Route'ları oluştur
4. ✅ Controller'ları yaz
5. ✅ Lock mekanizması

### Faz 2: Frontend (İrsaliye - Mobile)
1. ✅ Mobil form komponeni
2. ✅ Kalem ekleme modalı
3. ✅ Listeleme sayfası
4. ✅ Detay sayfası

### Faz 3: Frontend (Fatura - Desktop)
1. ✅ Fatura formu
2. ✅ Kalem tablosu
3. ✅ Eşleştirme öneri modalı
4. ✅ Onay/Red mekanizması

### Faz 4: Eşleştirme Algoritması
1. ✅ Backend eşleştirme servisi
2. ✅ Öneri API endpoint'i
3. ✅ Frontend eşleştirme arayüzü

### Faz 5: Test ve Dokümantasyon
1. ✅ Birim testleri
2. ✅ Entegrasyon testleri
3. ✅ Kullanım dokümantasyonu

---

## 🔄 Route Güncellemeleri

### App.jsx (Desktop)
```javascript
import Faturalar from './pages/Faturalar';
import FaturaDetay from './pages/FaturaDetay';

<Route path="/faturalar" element={<Faturalar />} />
<Route path="/faturalar/:id" element={<FaturaDetay />} />
```

### App.jsx (Mobile)
```javascript
import IrsaliyelerMobile from './pages/mobile/IrsaliyelerMobile';
import IrsaliyeFormMobile from './pages/mobile/IrsaliyeFormMobile';
import IrsaliyeDetayMobile from './pages/mobile/IrsaliyeDetayMobile';

<Route path="/mobile/irsaliyeler" element={<IrsaliyelerMobile />} />
<Route path="/mobile/irsaliyeler/yeni" element={<IrsaliyeFormMobile />} />
<Route path="/mobile/irsaliyeler/:id" element={<IrsaliyeDetayMobile />} />
```

---

---

## 🔗 Proje Entegrasyonu

### Mevcut Modüllerle İlişki

Bu yeni modül, ÜRTM Takip'in mevcut mimarisine şu şekilde entegre olacaktır:

#### Firma Modülü Entegrasyonu
- **Mevcut Tablo**: `firmalar` (Backend: `backend/src/models/Firma.js`)
- **İlişki**: `irsaliyeler.tedarikci_id → firmalar.id`
- **İlişki**: `faturalar.tedarikci_id → firmalar.id`
- **Endpoint**: Mevcut `/api/firmalar` kullanılacak

#### Socket.IO Real-time Entegrasyonu
```javascript
// backend/src/index.js'e eklenecek
const faturaNamespace = io.of('/fatura-eslestirme');

faturaNamespace.on('connection', (socket) => {
    socket.on('eslestirme-tamamlandi', (data) => {
        // İlgili kullanıcılara bildirim gönder
        faturaNamespace.emit('eslestirme-guncelleme', data);
    });
});
```

#### Authentication Entegrasyonu
- JWT Token mekanizması mevcut sistemle uyumlu
- `created_by` ve `locked_by` alanları `users` tablosuna foreign key
- Middleware: `backend/src/middleware/auth.js` (mevcut)

### Veritabanı İlişki Diagramı

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MEVCUT TABLOLAR                              │
├─────────────────────────────────────────────────────────────────────┤
│  firmalar (id, adi, unvan, vergi_no, ...)                          │
│  users (id, email, ad, soyad, rol, ...)                            │
└──────────────┬────────────────────────────────┬─────────────────────┘
               │                                │
               │ FK: tedarikci_id              │ FK: created_by, locked_by
               ▼                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      YENİ TABLOLAR                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐      ┌────────────────────┐                     │
│  │  irsaliyeler  │      │    faturalar       │                     │
│  ├───────────────┤      ├────────────────────┤                     │
│  │ id (PK)       │      │ id (PK)            │                     │
│  │ irsaliye_no   │      │ fatura_no         │                     │
│  │ tedarikci_id  │──────│ tedarikci_id      │                     │
│  │ belge_tarih   │      │ belge_tarih       │                     │
│  │ durum        │      │ durum             │                     │
│  │ locked_by    │      │ locked_by         │                     │
│  │ locked_at    │      │ locked_at         │                     │
│  └───────┬───────┘      └─────────┬──────────┘                     │
│          │                       │                                 │
│          │ 1:N                   │ 1:N                             │
│          ▼                       ▼                                 │
│  ┌───────────────┐      ┌────────────────────┐                     │
│  │irsaliye_      │      │   fatura_          │                     │
│  │kalemleri      │      │   kalemleri        │                     │
│  ├───────────────┤      ├────────────────────┤                     │
│  │ id (PK)       │      │ id (PK)            │                     │
│  │ irsaliye_id   │      │ fatura_id         │                     │
│  │ stok_kodu     │      │ stok_kodu         │                     │
│  │ miktar        │◄─────│ miktar            │ Eşleşme İlişkisi    │
│  │ eslesme_durumu│      │ eslesme_durumu    │ (karşılıklı FK)     │
│  │ eslesen_      │──────│ eslesen_           │                     │
│  │ fatura_kalem_ │      │ irsaliye_kalem_id │                     │
│  │ id            │      │                    │                     │
│  └───────────────┘      └────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 API Dokümantasyon Formatı

Projenin mevcut API dokümantasyon formatına uygun endpoint tanımları:

### GET /api/irsaliyeler
**Purpose**: İrsaliye listesini getirir

**Query Parameters**:
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| page | number | Hayır | Sayfa numarası (default: 1) |
| limit | number | Hayır | Sayfa başına kayıt (default: 20) |
| tedarikci_id | number | Hayır | Tedarikçi filtresi |
| durum | string | Hayır | Durum filtresi |
| baslangic_tarih | string | Hayır | Başlangıç tarihi (YYYY-MM-DD) |
| bitis_tarih | string | Hayır | Bitiş tarihi (YYYY-MM-DD) |

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "irsaliye_no": "IRS-2024-001",
      "tedarikci_id": 5,
      "tedarikci": {
        "id": 5,
        "adi": "ABC Tedarik A.Ş."
      },
      "belge_tarih": "2024-12-20",
      "durum": "bekliyor",
      "toplam_kalem": 3,
      "locked_by": null,
      "created_at": "2024-12-20T10:30:00.000Z"
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

### POST /api/irsaliyeler
**Purpose**: Yeni irsaliye oluşturur

**Request Body**:
```json
{
  "irsaliye_no": "IRS-2024-002",
  "tedarikci_id": 5,
  "belge_tarih": "2024-12-24",
  "belge_tipi": "gelis",
  "aciklama": "Opsiyonel açıklama",
  "kalemler": [
    {
      "stok_kodu": "STK-001",
      "parca_adi": "Ürün A",
      "miktar": 100,
      "birim": "Adet",
      "aciklama": "Kalem açıklaması"
    }
  ]
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "İrsaliye başarıyla oluşturuldu",
  "data": {
    "id": 46,
    "irsaliye_no": "IRS-2024-002",
    "durum": "bekliyor",
    "toplam_kalem": 1,
    "kalemler": [...]
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": "irsaliye_no zaten mevcut"
}
```

---

## 🛠️ Development Environment Kurulumu

### Gerekli Araçlar
- **Node.js**: v18.0+ (Mevcut proje ile uyumlu)
- **NPM**: v8.0+
- **IDE**: VS Code (tavsiye edilen)

### Kurulum Adımları

#### 1. Proje'ye Ekleme (Mevcut Branch)
```bash
# Mevcut branch kontrolü
git branch  # v13 dev branch üzerinde olmalısınız

# Yeni feature branch oluştur
git checkout -b feature/fatura-irsaliye-eslestirme

# Değişiklikleri yap
# ...

# Commit
git add .
git commit -m "feat: Fatura ve irsaliye eşleştirme modülü eklendi"
```

#### 2. Veritabanı Migrasyonu
```bash
cd backend

# Migration çalıştır
npm run migrate

# Kontrol
sqlite3 database.sqlite ".schema irsaliyeler"
sqlite3 database.sqlite ".schema faturalar"
```

#### 3. Backend Route Kaydı
`backend/src/index.js`'e ekle:
```javascript
// Fatura ve İrsaliye routes
const irsaliyelerRoutes = require('./routes/irsaliyeler');
const faturalarRoutes = require('./routes/faturalar');
const eslestirmeRoutes = require('./routes/eslestirme');

app.use('/api/irsaliyeler', irsaliyelerRoutes);
app.use('/api/faturalar', faturalarRoutes);
app.use('/api/eslestirme', eslestirmeRoutes);
```

#### 4. Frontend Route Kaydı
`frontend/src/App.jsx`'e ekle (Desktop):
```javascript
import Faturalar from './pages/Faturalar';
import FaturaDetay from './pages/FaturaDetay';

// Desktop routes
<Route path="/faturalar" element={<Faturalar />} />
<Route path="/faturalar/:id" element={<FaturaDetay />} />
```

`frontend/src/App.jsx`'e ekle (Mobile):
```javascript
import IrsaliyelerMobile from './pages/mobile/IrsaliyelerMobile';
import IrsaliyeFormMobile from './pages/mobile/IrsaliyeFormMobile';
import IrsaliyeDetayMobile from './pages/mobile/IrsaliyeDetayMobile';

// Mobile routes
<Route path="/mobile/irsaliyeler" element={<IrsaliyelerMobile />} />
<Route path="/mobile/irsaliyeler/yeni" element={<IrsaliyeFormMobile />} />
<Route path="/mobile/irsaliyeler/:id" element={<IrsaliyeDetayMobile />} />
```

#### 5. Development Sunucusu Başlatma
```bash
# Ana dizinde
npm run dev

# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

---

## 📝 Kodlama Standartları

### Backend (Node.js/Express)
- **Route Yapısı**: Mevcut `backend/src/routes/sevkiyat.js` formatını takip et
- **Controller Pattern**: `backend/src/controllers/` klasörüne
- **Model İlişkileri**: Sequelize `hasMany`, `belongsTo` kullan
- **Error Handling**: Express error handler middleware kullan
- **Logging**: Winston logger kullan (mevcut sistem)

### Frontend (React/MUI)
- **Component Yapısı**: Functional components + Hooks
- **State Management**: Local state (useState) veya Redux (gerekirse)
- **Stil**: Material-UI (MUI) components + sx prop
- **API Client**: Axios (mevcut `frontend/src/services/`)
- **Form Validation**: Formik + Yup (mevcut sistem)

### Mobile Optimizasyon
- **Layout**: `MobileLayout` component kullan
- **Touch**: Dokunma optimizasyonlu butonlar
- **Navigation**: Bottom navigation veya drawer
- **Responsive**: MUI `useMediaQuery` hook

---

## ⚠️ Önemli Notlar

### Proje Spesifik Kurallar
1. **Port Politikası**:
   - Frontend: 5173 (sabit, başka port kullanma)
   - Backend: 3000 (sabit, başka port kullanma)
   - Port çakışması durumunda: `npm run stop` → `npm run dev`

2. **Veritabanı**:
   - SQLite kullan (mevcut proje standardı)
   - Sequelize ORM (versiyon: 6.37.5)
   - Migration: Umzug kullan
   - Dosya yolu: `backend/database.sqlite`

3. **Authentication**:
   - JWT token mevcut sistemle uyumlu
   - Middleware: `backend/src/middleware/auth.js` kullan
   - User rol kontrolü (opsiyonel)

4. **n8n Entegrasyonu**: İlk fazda manuel girişe odaklanın. n8n webhook'ları Phase 2'de eklenebilir.
5. **Lock Timeout**: 30 dakika varsayılan, konfigurasyon ile değiştirilebilir.
6. **Stok Validasyonu**: İlk fazda stok_kodu serbest metin. Phase 2'de StokKarti ile ilişkilendirilecek.
7. **Fiyat Bilgisi**: Sadece kayıt amaçlı. Maliyet hesaplaması ileride.
8. **Eşleşme Durumu**:
   - `0` = Bekliyor (eşleşmemiş)
   - `1` = Eşleşti

---

## 📚 Referanslar

### Proje Dokümantasyonu
- **API Dokümantasyonu**: `docs/api-documentation.md`
- **Veritabanı Şeması**: `docs/database-schema.md`
- **Development Guide**: `docs/development-guide.md`
- **Knowledge Base**: `docs/knowledge-base-navigation.md`

### Mevcut Modüller (Referans için)
- **Sevkiyat Modülü**: `backend/src/models/Sevkiyat.js`, `backend/src/routes/sevkiyat.js`
- **Mobile Sevkiyat**: `frontend/src/pages/mobile/SevkiyatListesiMobile.jsx`
- **Route Yapısı**: `frontend/src/App.jsx`
- **Index.js**: `backend/src/index.js`

### Örnek Kod Kalıpları
```javascript
// Sequelize Model Örneği (Parca.js'den)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Irsaliye = sequelize.define('Irsaliye', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    irsaliye_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    // ... diğer alanlar
}, {
    tableName: 'irsaliyeler',
    timestamps: true
});

module.exports = Irsaliye;
```

```javascript
// Route Örneği (sevkiyat.js'ten)
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        // ... implementation
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
```

```javascript
// React Component Örneği (SevkiyatListesiMobile.jsx'ten)
import React, { useState, useEffect } from 'react';
import { Box, Card, Typography } from '@mui/material';
import axios from 'axios';

const IrsaliyelerMobile = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/irsaliyeler');
            setData(response.data.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            {/* Component JSX */}
        </Box>
    );
};

export default IrsaliyelerMobile;
```

---

*Son güncelleme: 24 Aralık 2024*
*Durum: Yol Haritası Hazır - Proje Entegrasyonlu Dokümantasyon Tamam*
*Proje Versiyonu: v13.dev18+*
