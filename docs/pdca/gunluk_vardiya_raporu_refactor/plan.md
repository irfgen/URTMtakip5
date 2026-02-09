# Plan: Günlük Vardiya Raporu Sistemi - Yeni Rapor Mantığı

## 📋 Proje Özeti

**Mevcut Sorun:** Günlük Vardiya Raporu karmaşık `TezgahDurumLog` tabanlı hesaplama kullanıyor ve doğru sonuçlar vermiyor.

**Yeni Yaklaşım:** Basit, güvenilir ve gerçek işlem kayıtlarına dayalı raporlama.

**Hedef:** Seçilen tarihteki aktif iş emirlerini, vardiya sürelerini ve parça işleme istatistiklerini doğru gösteren rapor sistemi.

---

## 🎯 Kullanıcı Gereksinimleri

### 1. Yeni Vardiya Tanımları
- **Gündüz Vardiyası:** 07:30 - 17:10 (aynı gün)
- **Gece Vardiyası:** 17:10 - 03:00 (ertesi gün)

### 2. Veri Kaynakları
- **İşlem Kayıtları (`islem_kayitlari`):** Aktif iş emirlerini belirle
- **Parça İşleme Kayıtları (`parca_isleme_kayitlari`):** İş emri sürelerini ve işlem sayılarını hesapla

### 3. Gösterilecek Bilgiler
Her iş emri için:
- İş emri numarası ve adı
- Parça kodu ve resmi
- İşlem sayısı (parça_isleme_kayitlari.count)
- Toplam işleme süresi (parca_isleme_kayitlari.sum)
- İstenen adet vs tamamlanan adet
- Durum ve ilerleme çubuğu

---

## 📊 Veri Yapıları Analizi

### Tablo 1: `islem_kayitlari` (İşlem Kayıtları)
```sql
CREATE TABLE islem_kayitlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_emri_no VARCHAR(50) NOT NULL,        -- İş emri numarası
    tezgah_id INTEGER,                      -- Tezgah ID (Fason için null)
    islem_tipi TEXT NOT NULL,               -- İşlem tipi
    islem_tarihi DATETIME NOT NULL,         -- İşlem tarihi
    islenen_adet INTEGER,                   -- İşlenen adet
    aciklama TEXT,                          -- Açıklama
    fason_is_emri_id UUID,                  -- Fason iş emri ID
    islem_yeri ENUM('tezgah', 'fason'),     -- İşlem yeri
    fason_tedarikci VARCHAR,                -- Fason tedarikçi
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (is_emri_no) REFERENCES is_emirleri(is_emri_no),
    FOREIGN KEY (tezgah_id) REFERENCES tezgahlar(tezgah_id)
);
```

**Kullanım:** Aktif iş emirlerini bulmak için
```sql
SELECT DISTINCT is_emri_no, tezgah_id, MIN(islem_tarihi) as ilk_islem
FROM islem_kayitlari
WHERE DATE(islem_tarihi) = :tarih
GROUP BY is_emri_no, tezgah_id;
```

### Tablo 2: `parca_isleme_kayitlari` (Parça İşleme Kayıtları)
```sql
CREATE TABLE parca_isleme_kayitlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tezgah_id INTEGER NOT NULL,             -- Tezgah ID
    is_emri_id INTEGER NOT NULL,            -- İş emri ID
    baslangic_zamani DATETIME NOT NULL,     -- Başlangıç zamanı
    bitis_zamani DATETIME NOT NULL,         -- Bitiş zamanı
    isleme_suresi_dakika INTEGER NOT NULL,  -- İşleme süresi (dk)
    kayit_zamani DATETIME DEFAULT CURRENT_TIMESTAMP,
    esp32_kayit_id VARCHAR(50) UNIQUE,      -- ESP32 kayıt ID (idempotent)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tezgah_id) REFERENCES tezgahlar(tezgah_id),
    FOREIGN KEY (is_emri_id) REFERENCES is_emirleri(is_emri_id)
);
```

**Kullanım:** İş emri sürelerini ve işlem sayılarını hesaplamak için
```sql
SELECT
    is_emri_id,
    COUNT(*) as islem_sayisi,
    SUM(isleme_suresi_dakika) as toplam_isleme_suresi
FROM parca_isleme_kayitlari
WHERE is_emri_id IN (:aktif_is_emirleri)
GROUP BY is_emri_id;
```

### Tablo 3: `is_emirleri` (İş Emirleri)
```sql
-- Var olan özet alanlar:
tamamlanan_parca_sayisi INTEGER DEFAULT 0,
toplam_isleme_suresi_dakika INTEGER DEFAULT 0,
ortalama_parca_suresi_dakika DECIMAL(10,2)
```

---

## 🔄 Yeni Rapor Mantığı

### Phase 1: Aktif İş Emirlerini Belirle
```
INPUT: Seçilen tarih (örn: 2024-01-15)

1. islem_kayitlari tablosundan sorgula:
   - DATE(islem_tarihi) = '2024-01-15'
   - DISTINCT is_emri_no, tezgah_id
   - GROUP BY is_emri_no, tezgah_id

OUTPUT: Aktif iş emirleri listesi
[
  { is_emri_no: 'IE-2024-001', tezgah_id: 5, ilk_islem: '08:30' },
  { is_emri_no: 'IE-2024-002', tezgah_id: 3, ilk_islem: '09:15' }
]
```

### Phase 2: Vardiya Dağılımını Belirle
```
INPUT: Aktif iş emirleri + işlem zamanları

2. Her iş emrinin ilk işlem zamanını kontrol et:
   - IF 07:30 <= ilk_islem < 17:10 → GÜNDÜZ VARDİYASI
   - IF 17:10 <= ilk_islem OR ilk_islem < 03:00 → GECE VARDİYASI

OUTPUT: İş emirlerini vardiya böl
{
  gunduz_vardiya: ['IE-2024-001', 'IE-2024-003'],
  gece_vardiya: ['IE-2024-002', 'IE-2024-004']
}
```

### Phase 3: Parça İşleme İstatistiklerini Hesapla
```
INPUT: İş emirleri listesi

3. parca_isleme_kayitlari tablosundan sorgula:
   - WHERE is_emri_id IN (aktif_is_emirleri)
   - AND DATE(baslangic_zamani) = '2024-01-15'
   - GROUP BY is_emri_id

OUTPUT: İşlem sayıları ve süreler
{
  'IE-2024-001': { islem_sayisi: 15, toplam_sure: 320 },
  'IE-2024-002': { islem_sayisi: 8, toplam_sure: 180 }
}
```

### Phase 4: İş Emri Detaylarını Tamamla
```
INPUT: İş emri numaraları

4. is_emirleri tablosundan detayları çek:
   - is_emri_no, is_adi, parca_kodu, adet, durum
   - Parca resmi (parcalar tablosundan)

OUTPUT: Tam iş emri bilgileri
```

### Phase 5: API Response Oluştur
```
INPUT: Tüm veriler

5. Frontend'e gönder:
{
  success: true,
  tarih: '2024-01-15',
  gunduz_vardiya: {
    baslangic: '07:30',
    bitis: '17:10',
    toplam_islem_sayisi: 45,
    toplam_isleme_suresi: 960,
    is_emirleri: [
      {
        is_emri_no: 'IE-2024-001',
        is_adi: 'Parça X Üretimi',
        parca_kodu: 'P-001',
        tezgah_id: 5,
        islem_sayisi: 15,
        toplam_isleme_suresi_dakika: 320,
        istenen_adet: 100,
        tamamlanan_adet: 45,
        durum: 'aktif',
        ilerleme: 45
      }
    ]
  },
  gece_vardiya: { /* benzer yapı */ }
}
```

---

## 🏗️ Teknik Mimari

### Backend Katmanları

#### 1. Controller (`gunlukVardiyaController.js`)
```javascript
async function getGunlukVardiyaRaporuYeni(req, res) {
  const { tarih } = req.query;

  // Phase 1: Aktif iş emirlerini bul
  const aktifIsEmirleri = await getAktifIsEmirleriByTarih(tarih);

  // Phase 2: Vardiya dağılımını yap
  const vardiyaDağılımı = await isEmirleriVardiyaAyır(aktifIsEmirleri);

  // Phase 3: Parça işleme istatistikleri
  const istatistikler = await getParcaIslemeIstatistikleri(aktifIsEmirleri, tarih);

  // Phase 4: İş emri detayları
  const detaylar = await getIsEmriDetaylari(aktifIsEmirleri);

  // Phase 5: Response oluştur
  const response = buildResponse(tarih, vardiyaDağılımı, istatistikler, detaylar);
  res.json(response);
}
```

#### 2. Service (`vardiyaSuresiServiceYeni.js`)
```javascript
// Yeni service - parça_isleme_kayitlari tabanlı
async function getParcaIslemeIstatistikleri(isEmriIds, tarih) {
  const stats = await ParcaIslemeKayitlari.findAll({
    where: {
      is_emri_id: { [Op.in]: isEmriIds },
      baslangic_zamani: {
        [Op.gte]: moment(tarih).startOf('day').toDate(),
        [Op.lt]: moment(tarih).add(1, 'day').startOf('day').toDate()
      }
    },
    attributes: [
      'is_emri_id',
      [sequelize.fn('COUNT', sequelize.col('id')), 'islem_sayisi'],
      [sequelize.fn('SUM', sequelize.col('isleme_suresi_dakika')), 'toplam_sure']
    ],
    group: ['is_emri_id']
  });

  return stats.map(s => ({
    is_emri_id: s.is_emri_id,
    islem_sayisi: parseInt(s.dataValues.islem_sayisi),
    toplam_isleme_suresi: parseInt(s.dataValues.toplam_sure)
  }));
}
```

#### 3. Queries (`gunlukVardiyaQueriesYeni.js`)
```javascript
// Aktif iş emirlerini bul (islem_kayitlari tablosundan)
async function getAktifIsEmirleriByTarih(tarih) {
  return await sequelize.query(`
    SELECT DISTINCT
        ik.is_emri_no,
        ik.tezgah_id,
        MIN(ik.islem_tarihi) as ilk_islem_zamani,
        COUNT(*) as islem_kayit_sayisi
    FROM islem_kayitlari ik
    WHERE DATE(ik.islem_tarihi) = :tarih
      AND ik.islem_yeri = 'tezgah'
    GROUP BY ik.is_emri_no, ik.tezgah_id
    ORDER BY MIN(ik.islem_tarihi) ASC
  `, {
    replacements: { tarih },
    type: Sequelize.SELECT
  });
}
```

### Frontend Bileşenleri

#### 1. VardiyaBolmesi.jsx (Güncellenecek)
```javascript
// Yeni props yapısı
props: {
  vardiyaTipi: 'gunduz' | 'gece',
  baslangic: '07:30',
  bitis: '17:10',
  toplamIslemSayisi: 45,
  toplamIslemeSuresi: 960,
  isEmirleri: [
    {
      is_emri_no: 'IE-2024-001',
      is_adi: 'Parça X Üretimi',
      parca_kodu: 'P-001',
      tezgah_id: 5,
      islem_sayisi: 15,                    // YENİ
      toplam_isleme_suresi_dakika: 320,    // YENİ
      istenen_adet: 100,
      tamamlanan_adet: 45,
      durum: 'aktif',
      ilerleme: 45
    }
  ]
}
```

#### 2. IsEmriRaporKarti.jsx (Güncellenecek)
```javascript
// Yeni alanlar eklenecek
<Card>
  <Typography>{is_adi}</Typography>

  {/* YENİ: İşlem Sayısı ve Süre */}
  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
    <Chip icon={<AccessTime />} label={`${islem_sayisi} işlem`} />
    <Chip icon={<Timer />} label={`${toplam_isleme_suresi_dakika} dk`} />
  </Box>

  {/* Mevcut: İlerleme çubuğu */}
  <LinearProgress variant="determinate" value={ilerleme} />

  {/* Mevcut: Durum çipi */}
  <Chip label={durum} color={durumColor} />
</Card>
```

---

## 📁 Dosya Değişiklik Listesi

### Backend (5 Dosya)
- ✏️ `backend/src/controllers/gunlukVardiyaController.js` - Yeni endpoint
- ➕ `backend/src/services/vardiyaSuresiServiceYeni.js` - Yeni service
- ➕ `backend/src/queries/gunlukVardiyaQueriesYeni.js` - Yeni queries
- ✏️ `backend/src/routes/gunlukVardiyaRoutes.js` - Yeni route
- ✏️ `backend/src/models/ParcaIslemeKayitlari.js` - Model kontrolü

### Frontend (3 Dosya)
- ✏️ `frontend/src/components/Raporlar/VardiyaBolmesi.jsx` - Yeni props
- ✏️ `frontend/src/components/Raporlar/IsEmriRaporKarti.jsx` - Yeni alanlar
- ✏️ `frontend/src/api/gunlukVardiyaAPI.js` - API call update

---

## ✅ Başarı Kriterleri

### Fonksiyonel Gereksinimler
- [ ] Gündüz vardiyası 07:30-17:10 doğru gösteriliyor
- [ ] Gece vardiyası 17:10-03:00 doğru gösteriliyor
- [ ] İş emirleri doğru vardiyalara ayrılıyor
- [ ] İşlem sayıları doğru hesaplanıyor
- [ ] Toplam işleme süreleri doğru hesaplanıyor
- [ ] İş emri detayları tam gösteriliyor

### Performans Gereksinimleri
- [ ] Rapor yükleme süresi < 3 saniye
- [ ] Veritabanı sorgu sayısı optimize edilmiş
- [ ] Frontend render süresi < 1 saniye

### Kalite Gereksinimleri
- [ ] Kod stili tutarlı
- [ ] Hata yönetimi complete
- [ ] Loglama mevcut
- [ ] Dokümantasyon güncel

---

## ⚠️ Riskler ve Önlemler

### Risk 1: Veri Tutarlılığı
**Sorun:** `islem_kayitlari` ve `parca_isleme_kayitlari` senkronize olmayabilir
**Önlem:** Her iki tabloyu da sorgula, eksik veri kontrolü yap

### Risk 2: Gece Yarısı Geçişi
**Sorun:** Gece vardiyası ertesi güne devam ediyor
**Önlem:** Tarih aralığı doğru hesapla (DATE + 1 gün)

### Risk 3: Fason İş Emirleri
**Sorun:** `islem_yeri = 'fason'` olan kayıtlar tezgah bazında rapora dahil edilmemeli
**Önlem:** Sorguda `islem_yeri = 'tezgah'` filtrelemesi kullan

### Risk 4: Performans
**Sorun:** Çok sayıda iş emri ve kayıt varsa sorgular yavaşlayabilir
**Önlem:** İndeksleri kontrol et, batch query kullan, gerekiyorsa caching ekle

---

## 🧪 Test Senaryoları

### Senaryo 1: Sadece Gündüz Vardiyası
```javascript
Tarih: 2024-01-15
Beklenen:
  - 07:30-17:10 arası 3 iş emri
  - 17:10-03:00 arası 0 iş emri
  - İşlem sayıları ve süreler doğru
```

### Senaryo 2: Sadece Gece Vardiyası
```javascript
Tarih: 2024-01-15
Beklenen:
  - 07:30-17:10 arası 0 iş emri
  - 17:10-03:00 arası 2 iş emri (ertesi gün 03:00'e kadar)
```

### Senaryo 3: Her İki Vardiya
```javascript
Tarih: 2024-01-15
Beklenen:
  - Gündüz: 2 iş emri
  - Gece: 3 iş emri
  - Toplam: 5 iş emri
```

### Senaryo 4: Kayıt Yok
```javascript
Tarih: 2024-01-01 (Resmi tatil)
Beklenen:
  - Her iki vardiya da boş
  - "Bu tarihte kayıt yok" mesajı
```

### Senaryo 5: Fason İş Emri Hariç
```javascript
Tarih: 2024-01-15
Koşul: 5 iş emri, 1'i fason
Beklenen:
  - Sadece 4 iş emri gösteriliyor
  - Fason iş emri raporda yok
```

---

## 📅 Implementasyon Takvimi

### Phase 1: Backend (1-2 gün)
- [ ] `ParcaIslemeKayitlari` model kontrolü
- [ ] `gunlukVardiyaQueriesYeni.js` oluştur
- [ ] `vardiyaSuresiServiceYeni.js` oluştur
- [ ] `gunlukVardiyaController.js` yeni endpoint
- [ ] Route eklemesi

### Phase 2: Frontend (1 gün)
- [ ] `VardiyaBolmesi.jsx` güncelle
- [ ] `IsEmriRaporKarti.jsx` yeni alanlar
- [ ] `gunlukVardiyaAPI.js` güncelle

### Phase 3: Test (1 gün)
- [ ] Birim testleri
- [ ] Entegrasyon testleri
- [ ] Manuel test senaryoları

### Phase 4: Dokümantasyon (0.5 gün)
- [ ] Kod yorumları
- [ ] API dokümantasyonu
- [ ] Kullanım kılavuzu

**Toplam Tahmini Süre:** 3.5 - 4.5 gün

---

## 🎯 Sonraki Adımlar

1. **Onay:** Bu planın onaylanması
2. **Model Kontrolü:** `ParcaIslemeKayitlari` modelinin mevcut durumunu kontrol et
3. **Implementasyon:** Phase 1'den başla
4. **Test:** Her phase'den sonra test et
5. **Deploy:** Testlerden sonra production'a al

---

**Plan Durumu:** ⏳ Beklemede (Onay Bekliyor)
**Oluşturulma Tarihi:** 2025-01-08
**Son Güncelleme:** 2025-01-08
**Sürüm:** 1.0
