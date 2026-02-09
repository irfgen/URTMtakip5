# Makinaya Göre Parça Listeleme - Teknik Araştırma Raporu

> **Oluşturulma Tarihi**: 23 Aralık 2025
> **Amaç**: Parçalar ana sayfasına "Makinaya göre listele" açılır listesi eklemek için gereken teknik altyapının analizi

---

## ÖZET

Bu rapor, uRTM Takip sisteminde **Parçalar** sayfasına makine bazlı filtreleme özelliği eklemek için yapılan teknik araştırmayı ve uygulama yol haritasını içerir.

### Temel Bulgular

1. **Parça-Makina İlişkisi**: Doğrudan bir foreign key ilişkisi yok. İlişki şu ara tablolar üzerinden kurulur:
   - `Parca ← bom_parcalar → BOM ← makina_bom → Makina`

2. **Mevcut Filtreleme Yapısı**: Parçalar sayfasında zaten "Parça Takip Listesi" filtresi mevcut. Yeni makine filtresi benzer mantıkla eklenebilir.

3. **Gerekli Değişiklikler**:
   - **Backend**: `/api/parcalar` endpoint'ine `makina_id` parametresi ile sorgu
   - **Frontend**: Makina listesini çeken yeni bir Select bileşeni
   - **API**: Mevcut `Bom.getBomsByMakinaId()` metodu kullanılabilir

4. **Kritik Karar**: Kullanıcı bir makina seçtiğinde, makinaya ait **BÜTÜN gruplardaki (BOM)** tüm parçalar gösterilecek, diğerleri gizlenecek.

---

## 1. MEVCUT SİSTEM YAPISI

### 1.1. Parçalar Sayfası (Frontend)

**Dosya**: `frontend/src/pages/Parcalar.jsx`

**Mevcut Filtreler**:
- `aramaMetni`: Parça kodu/adi araması
- `imalMiFiltre`: Sadece imal edilenleri göster
- `seciliParcaTakipListesiId`: Parça takip listesine göre filtrele

**API Çağrısı** (satır 110-145):
```javascript
const params = new URLSearchParams();
params.append('page', sayfa);
params.append('limit', sayfaBasi);
params.append('includeStokKarti', 'true');
if (aramaMetni) params.append('aramaMetni', aramaMetni);
if (imalMiFiltre !== false) params.append('imalMi', imalMiFiltre);
if (seciliParcaTakipListesiId) params.append('parca_takip_listesi_id', seciliParcaTakipListesiId);
```

**UI Yapısı** (satır 472-501):
```jsx
<Box mb={3} display="flex" gap={2}>
  <TextField label="Parça Kodu Ara" />
  <FormControlLabel control={<Switch />} label="Sadece İmal Edilenler" />
  <FormControl sx={{ minWidth: 260 }}>
    <InputLabel>Seçili Parça Takip Listesi</InputLabel>
    <Select value={seciliParcaTakipListesiId} onChange={...}>
      <MenuItem value="">(Yok)</MenuItem>
      {parcaTakipListeleri.map(l => <MenuItem key={l.id} value={l.id}>{l.ad}</MenuItem>)}
    </Select>
  </FormControl>
</Box>
```

### 1.2. Makinalar Sayfası (Frontend)

**URL**: `http://192.168.1.206:5173/makinalar`

**Dosya**: `frontend/src/pages/Makinalar.jsx` → `MakinaListesi` bileşeni kullanır

**API Kullanımı**:
```javascript
// MakinaListesi.jsx (satır 26-51)
const response = await axios.get('/api/makinalar', {
    params: { search: searchTerm }
});
```

**Not**: Makinalar, BOM'larla ilişkili olan **ürünler/teçhizat** listesidir.

### 1.3. Backend API Endpoint'leri

**Parçalar API**: `backend/src/routes/parcaRoutes.js`
```javascript
router.get('/', parcaController.parcalariGetir); // Listeleme
```

**Makinalar API**: `backend/src/routes/makinaRoutes.js`
```javascript
router.get('/makinalar', makinaController.listMakinalar); // Listeleme
```

### 1.4. Veritabanı Modelleri

#### Parca Modeli
**Dosya**: `backend/src/models/Parca.js`

**Primary Key**: `parcaKodu` (string)

**İlişkiler**:
- `hasMany` → `ParcaKayitlari` (parca_kodu foreign key)
- `belongsTo` → `StokKarti` (stok_karti_id foreign key)

**Not**: Parca modelinde doğrudan tezgah/makina ilişkisi **YOK**.

#### Makina Modeli
**Dosya**: `backend/src/models/Makina.js`

**Primary Key**: `makina_id` (UUID)

**İlişkiler**:
- `belongsTo` → `MakinaSinifi` (makina_sinifi_id)
- `belongsToMany` → `Bom` (through: `makina_bom`)

**Not**: Makinalar BOM'larla çok-çok ilişkiye sahiptir.

#### Bom Modeli
**Dosya**: `backend/src/models/Bom.js`

**Primary Key**: `id` (INTEGER)

**İlişkiler**:
- `belongsToMany` → `Makina` (through: `makina_bom`)
- **Parça ilişkisi**: `bom_parcalar` ara tablosu üzerinden (custom query ile yönetiliyor)

---

## 2. PARÇA-MAKİNA İLİŞKİSİ

### 2.1. Veritabanı İlişki Şeması

```
Parca (parcalar)
  ↓
  bom_parcalar (ara tablo)
  ↓
Bom (boms)
  ↓
  makina_bom (ara tablo)
  ↓
Makina (makinalar)
```

### 2.2. SQL İlişki Sorgusu

Makinaya ait tüm parçaları getirmek için gereken SQL:

```sql
SELECT DISTINCT p.*
FROM parcalar p
INNER JOIN bom_parcalar bp ON p.parca_kodu = bp.parcaKodu
INNER JOIN boms b ON bp.bomId = b.id
INNER JOIN makina_bom mb ON b.id = mb.bom_id
WHERE mb.makina_id = :makinaId
  AND b.aktif = TRUE
ORDER BY p.parca_kodu;
```

### 2.3. Mevcut Helper Metotlar

**Bom.getBomsByMakinaId(makinaId)** - `backend/src/models/Bom.js:43-167`

Bu metot zaten makinaya ait BOM'ları getiriyor:
```javascript
static async getBomsByMakinaId(makinaId) {
  // makina_bom ara tablosundan sorgular
  // Eğer boşsa, makinalar.items JSON alanından alır
}
```

**Bom.getParcalarByBomId(bomId)** - `backend/src/models/Bom.js:174-205`

Bu metot bir BOM'a ait parçaları getiriyor:
```javascript
static async getParcalarByBomId(bomId) {
  const query = `
    SELECT bp.*, p.*, sk.*
    FROM bom_parcalar bp
    LEFT JOIN parcalar p ON bp.parcaKodu = p.parca_kodu
    LEFT JOIN stok_kartlari sk ON p.stok_karti_id = sk.id
    WHERE bp.bomId = ?
    ORDER BY bp.id
  `;
  return sequelize.query(query, { replacements: [bomId], ... });
}
```

---

## 3. UYGULAMA YOL HARİTASI

### 3.1. Backend Değişiklikleri

#### Adım 1: parcaController.js'e Makina Filtresi Ekle

**Dosya**: `backend/src/controllers/parcaController.js`

`parcalariGetir` fonksiyonuna yeni parametre ekle:

```javascript
exports.parcalariGetir = async (req, res) => {
    try {
        const {
            aramaMetni,
            imalMi,
            kritikStok,
            sortBy,
            sortOrder,
            page = 1,
            limit = 20,
            includeStokKarti = 'true',
            parca_takip_listesi_id,
            makina_id  // YENİ PARAMETRE
        } = req.query;

        let where = {};
        let order = [];

        // ... mevcut filtreler ...

        // MAKİNA FİLTRESİ - YENİ
        if (makina_id) {
            const Bom = require('../models/Bom');
            const { sequelize } = require('../models');

            // Önce makinaya ait BOM'ları bul
            const boms = await Bom.getBomsByMakinaId(makina_id);

            if (!boms || boms.length === 0) {
                // Makinaya ait BOM yoksa boş sonuç dön
                return res.json({
                    parcalar: [],
                    toplam: 0,
                    sayfa: parseInt(page),
                    sayfaBasi: parseInt(limit),
                    sayfaSayisi: 0
                });
            }

            // BOM ID'lerini al
            const bomIds = boms.map(b => b.id);

            // Bu BOM'lardaki parça kodlarını getir
            const parcaKodlariQuery = `
                SELECT DISTINCT bp.parcaKodu
                FROM bom_parcalar bp
                WHERE bp.bomId IN (${bomIds.map(() => '?').join(',')})
            `;

            const parcaKodlariResult = await sequelize.query(parcaKodlariQuery, {
                replacements: bomIds,
                type: sequelize.QueryTypes.SELECT
            });

            const parcaKodlari = parcaKodlariResult.map(r => r.parcaKodu);

            if (parcaKodlari.length === 0) {
                return res.json({
                    parcalar: [],
                    toplam: 0,
                    sayfa: parseInt(page),
                    sayfaBasi: parseInt(limit),
                    sayfaSayisi: 0
                });
            }

            // Where koşuluna ekle
            where.parcaKodu = { ...(where.parcaKodu || {}), [Op.in]: parcaKodlari };
        }

        // ... devam eden kod ...
    }
};
```

#### Adım 2: Makina Listesi Endpoint'i (Zaten Mevcut)

Makina listesi `/api/makinalar` endpoint'inden çekilebilir.

**Mevcut Endpoint**: `backend/src/routes/makinaRoutes.js`
```javascript
router.get('/makinalar', makinaController.listMakinalar);
```

Bu endpoint zaten mevcut ve aktif makinaları döndürüyor.

### 3.2. Frontend Değişiklikleri

#### Adım 1: Parcalar.jsx'e State'leri Ekle

**Dosya**: `frontend/src/pages/Parcalar.jsx`

```javascript
// Mevcut state'lerin altına ekle
const [makinalar, setMakinalar] = useState([]);
const [seciliMakinaId, setSeciliMakinaId] = useState('');

// Makinaları yükle
useEffect(() => {
  (async () => {
    try {
      const response = await axios.get('/api/makinalar');
      setMakinalar(response.data.data || response.data || []);
    } catch (e) {
      console.error('Makinalar yükleme hatası:', e);
    }
  })();
}, []);
```

#### Adım 2: parcalariGetir Fonksiyonunu Güncelle

```javascript
const parcalariGetir = async () => {
    try {
      setYukleniyor(true);
      const params = new URLSearchParams();
      params.append('page', sayfa);
      params.append('limit', sayfaBasi);
      params.append('includeStokKarti', 'true');
      if (aramaMetni) params.append('aramaMetni', aramaMetni);
      if (imalMiFiltre !== false) params.append('imalMi', imalMiFiltre);
      if (seciliParcaTakipListesiId) params.append('parca_takip_listesi_id', seciliParcaTakipListesiId);
      if (seciliMakinaId) params.append('makina_id', seciliMakinaId); // YENİ
      const response = await axios.get(`/api/parcalar?${params}`);
      // ... devam ...
    } catch (error) {
      // ...
    }
};
```

#### Adım 3: useEffect Bağımlılıklarını Güncelle

```javascript
useEffect(() => {
  parcalariGetir();
}, [sayfa, aramaMetni, imalMiFiltre, seciliParcaTakipListesiId, seciliMakinaId]); // seciliMakinaId eklendi

// Arama metni değiştiğinde sayfayı 1'e resetle
useEffect(() => {
  if (sayfa !== 1) {
    setSayfa(1);
  }
}, [aramaMetni, imalMiFiltre, seciliParcaTakipListesiId, seciliMakinaId]); // seciliMakinaId eklendi
```

#### Adım 4: UI'ya Makina Seçimi Ekle

**Dosya**: `frontend/src/pages/Parcalar.jsx` (satır 472-501 arası)

```jsx
<Box mb={3} display="flex" gap={2}>
  <TextField
    label="Parça Kodu Ara"
    value={aramaMetni}
    onChange={(e) => setAramaMetni(e.target.value)}
  />
  <FormControlLabel
    control={<Switch checked={imalMiFiltre === true} onChange={(e) => setImalMiFiltre(e.target.checked)} />}
    label="Sadece İmal Edilenler"
  />
  <FormControl sx={{ minWidth: 260 }}>
    <InputLabel>Seçili Parça Takip Listesi</InputLabel>
    <Select
      value={seciliParcaTakipListesiId}
      label="Seçili Parça Takip Listesi"
      onChange={(e) => setSeciliParcaTakipListesiId(e.target.value)}
    >
      <MenuItem value="">(Yok)</MenuItem>
      {parcaTakipListeleri.map(l => (
        <MenuItem key={l.id} value={l.id}>{l.ad}</MenuItem>
      ))}
    </Select>
  </FormControl>

  {/* YENİ - Makinaya Göre Listele */}
  <FormControl sx={{ minWidth: 260 }}>
    <InputLabel>Makinaya Göre Listele</InputLabel>
    <Select
      value={seciliMakinaId}
      label="Makinaya Göre Listele"
      onChange={(e) => setSeciliMakinaId(e.target.value)}
    >
      <MenuItem value="">(Tümü)</MenuItem>
      {makinalar.map(m => (
        <MenuItem key={m.makina_id} value={m.makina_id}>{m.name}</MenuItem>
      ))}
    </Select>
  </FormControl>
</Box>
```

---

## 4. ÖZEL DURUMLAR VE KARARLAR

### 4.1. Makina Seilince Olacaklar

| Durum | Davranış |
|-------|----------|
| Makina seçili | Sadece o makinaya ait BOM'lardaki parçalar gösterilir |
| Makina seçimi temizlenirse | Tüm parçalar gösterilir (varsayılan) |
| Seçilen makinaya BOM atanmamışsa | Boş liste gösterilir |
| Hem takip listesi hem makina seçili | İki filtre AND ile birleşir (her iki koşulu da sağlayan parçalar) |

### 4.2. Performans Hususları

1. **SQL Sorgu Optimizasyonu**: Makina filtresi active olduğunda:
   - Önce `makina_id` → `bom_id` sorgusu
   - Sonra `bom_id[]` → `parca_kodu[]` sorgusu
   - En son `parca_kodu[]` ile filtreleme

2. **Cacheleme**: Makina listesi nadiren değiştiği için cache'lenebilir.

3. **Sayfalama**: Mevcut sayfalama yapısı aynen korunur.

### 4.3. UI/UX Hususları

1. **Filtre Birleşimi**:
   - "Parça Takip Listesi" ve "Makinaya Göre Listele" birlikte kullanılabilir
   - Kullanıcıya açık bir şekilde gösterilmeli (örn: "Filtre: Takip Listesi 'X' VE Makina 'Y'")

2. **Geri Bildirim**:
   - Makina seçince sayfa başına dönmelidir
   - "X parça bulundu" mesajı güncellenmelidir

3. **Responsive Tasarım**:
   - Mobilde filtreler alt alta sıralanmalı
   - Select genişlikleri ekran boyutuna göre ayarlanmalı

---

## 5. TEST SENARYOLARI

### 5.1. Fonksiyonel Testler

| Test Senaryosu | Beklenen Sonuç |
|----------------|----------------|
| Makina seçilmeden sayfa yüklenir | Tüm parçalar listelenir |
| Bir makina seçilir | Sadece o makinaya ait parçalar listelenir |
| Makina seçimi kaldırılır | Tüm parçalar tekrar listelenir |
| BOM'u olmayan makina seçilir | Boş liste veya uyarı mesajı |
| Hem takip listesi hem makina seçili | Her iki koşulu sağlayan parçalar |
| Sayfalama yapılır | Her sayfa doğru parçaları içerir |

### 5.2. Entegrasyon Testleri

| Test | Açıklama |
|------|----------|
| `/api/parcalar?makina_id=xxx` | Backend endpoint'i doğru sonuç döndürmeli |
| `/api/makinalar` | Makina listesi doğru gelmeli |
| Parça ekleme/silme | Filtreli görünümde doğru çalışmalı |
| Diğer filtrelerle beraber | Birleşik sorgular doğru sonuç vermeli |

---

## 6. ALTERNATİF YAKLAŞIMLAR

### 6.1. Grup Bazlı Filtreleme (Mevcut Yapı)

BOM'lar zaten "Grup" olarak adlandırılıyor. Mevcut sistemde:
- `gruplar` tablosu var
- `grup_parcalar` ara tablosu var

Alternatif olarak, kullanıcı doğrudan BOM/Grup seçebilir.

### 6.2. Doğrudan Parca-Makina İlişkisi

En temiz çözüm, `parcalar` tablosuna `makina_id` alanı eklemek olurdu.
Ancak bu:
- Mevcut veri yapısını bozar
- Bir parça birden fazla makinede kullanılabildiği için esneklik kaybı yaratır

---

## 7. KAYNAKLAR

### 7.1. İlgili Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `frontend/src/pages/Parcalar.jsx` | Parçalar ana sayfası |
| `frontend/src/pages/Makinalar.jsx` | Makinalar sayfası (ürünler/teçhizat) |
| `frontend/src/components/MakinaListesi.jsx` | Makina listesi bileşeni |
| `backend/src/controllers/parcaController.js` | Parça API controller |
| `backend/src/controllers/makinaController.js` | Makina API controller |
| `backend/src/models/Parca.js` | Parça modeli |
| `backend/src/models/Makina.js` | Makina modeli (BOM'larla ilişkili) |
| `backend/src/models/Bom.js` | BOM modeli ve helper metotları |
| `backend/src/routes/parcaRoutes.js` | Parça route'ları |
| `backend/src/routes/makinaRoutes.js` | Makina route'ları |

### 7.2. Veritabanı Tabloları

| Tablo | Açıklama |
|-------|----------|
| `parcalar` | Parça kartları |
| `makinalar` | Makinalar (BOM'larla ilişkili ürünler/teçhizat) |
| `boms` | BOM (Malzeme Listeleri) / Gruplar |
| `bom_parcalar` | BOM-Parça ilişkisi |
| `makina_bom` | Makina-BOM ilişkisi |
| `grup_parcalar` | Grup-Parça ilişkisi |

---

## 8. SONRAKİ ADIMLAR

1. ✅ **Araştırma Tamamlandı** - Bu rapor
2. ⏳ **Backend Implementasyonu** - `parcaController.js` değişikliği
3. ⏳ **Frontend Implementasyonu** - `Parcalar.jsx` değişikliği
4. ⏳ **Test** - Manuel ve otomatik testler
5. ⏳ **Deployment** - Prodüksiyona alınma

---

## 9. EK: KOD PARÇACIKLARI

### EK-1: Backend API Testi

```bash
# Makina ID'si ile parça sorgusu
curl "http://192.168.1.206:3000/api/parcalar?makina_id=uuid-buraya&page=1&limit=30"

# Makina listesi
curl "http://192.168.1.206:3000/api/makinalar"
```

### EK-2: Frontend Test Kodu

```javascript
// Browser Console test
axios.get('/api/makinalar').then(r => console.log(r.data));
axios.get('/api/parcalar?makina_id=SOME_UUID').then(r => console.log(r.data));
```

---

**Rapor Hazırlayan**: Claude (AI Assistant)
**Proje**: uRTM Takip v14
**Son Güncelleme**: 23 Aralık 2025
