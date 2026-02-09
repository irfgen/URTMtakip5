# ÜRTM Takip - API Referans Dokümantasyonu

## 📡 API Endpoint'leri

Bu dokümantasyon ÜRTM Takip sisteminin tüm REST API endpoint'lerini içerir.

**Base URL**: `http://localhost:3000/api` (development) / `http://your-server.com/api` (production)

---

## 📋 İçindekiler

1. [Core Endpoints](#core-endpoints)
2. [Üretim Yönetimi](#üretim-yönetimi)
3. [Parça ve Stok Yönetimi](#parça-ve-stok-yönetimi)
4. [Makina ve Tezgah Yönetimi](#makina-ve-tezgah-yönetimi)
5. [Sevkiyat ve Lojistik](#sevkiyat-ve-lojistik)
6. [Fatura ve İrsaliye](#fatura-ve-İrsaliye)
7. [Fason Yönetimi](#fason-yönetimi)
8. [Raporlama](#raporlama)
9. [Sistem Yönetimi](#sistem-yönetimi)
10. [CAD Entegrasyonu](#cad-entegrasyonu)

---

## Core Endpoints

### Health Check
```
GET /api/health
```
**Response:**
```json
{
  "success": true,
  "message": "ÜRTM Takip API çalışıyor",
  "timestamp": "2024-12-24T10:00:00.000Z",
  "version": "v14.dev1"
}
```

### Port Bilgisi
```
GET /api/port-info
```
**Response:**
```json
{
  "message": "Backend port bilgisi",
  "port": 3000,
  "status": "active",
  "timestamp": "2024-12-24T10:00:00.000Z"
}
```

---

## Üretim Yönetimi

### İş Emirleri (`/api/is-emirleri`)

```
GET    /api/is-emirleri              # Tüm iş emirlerini listele
GET    /api/is-emirleri/:id          # İş emri detay
POST   /api/is-emirleri              # Yeni iş emri oluştur
PUT    /api/is-emirleri/:id          # İş emri güncelle
DELETE /api/is-emirleri/:id          # İş emri sil
GET    /api/is-emirleri/aktif        # Aktif iş emirleri
GET    /api/is-emirleri/tamamlandi   # Tamamlanan iş emirleri
```

**İş Emri Model:**
```typescript
{
  id: number;
  parcaId: number;
  tezgahId: number;
  adet: number;
  durum: 'beklemede' | 'uretiliyor' | 'tamamlandi' | 'iptal';
  oncelik: number;
  baslamaTarihi: Date;
  bitisTarihi: Date;
  isEmriNo: string;
}
```

### İş Emri Taslakları (`/api/is-emri-taslaklari`)

```
GET    /api/is-emri-taslaklari       # Tüm taslakları listele
POST   /api/is-emri-taslaklari       # Yeni taslak oluştur
PUT    /api/is-emri-taslaklari/:id   # Taslak güncelle
DELETE /api/is-emri-taslaklari/:id   # Taslak sil
POST   /api/is-emri-taslaklari/:id/uretim-plani-ekle # Üretim planına ekle
```

### İş Emri Durum Yönetimi (`/api/is-emri-durumlari`)

```
GET    /api/is-emri-durumlari              # Tüm durumları listele
POST   /api/is-emri-durumlari              # Yeni durum oluştur
PUT    /api/is-emri-durumlari/:id          # Durum güncelle
DELETE /api/is-emri-durumlari/:id          # Durum sil
POST   /api/is-emri-durumlari/sira-guncelle # Sıra numarası güncelle
```

### İş Emri Özeti (`/api/is-emri-ozet`)

```
GET /api/is-emri-ozet/dashboard              # Dashboard verileri
GET /api/is-emri-ozet/parca-bazli            # Parça bazlı özet
GET /api/is-emri-ozet/tamamlanan-raporu      # Tamamlanan işler raporu
```

### Tamamlanan İşler (`/api/tamamlanan-isler`)

```
GET    /api/tamamlanan-isler           # Tamamlanan işleri listele
POST   /api/tamamlanan-isler           # Arşivle
GET    /api/tamamlanan-isler/istatistik # İstatistikler
```

### Üretim Planlama - Main (`/api/uretim-plani`)

```
GET    /api/uretim-plani               # Üretim planlarını listele
GET    /api/uretim-plani/:id           # Plan detay
POST   /api/uretim-plani               # Yeni plan oluştur
PUT    /api/uretim-plani/:id           # Plan güncelle
DELETE /api/uretim-plani/:id           # Plan sil
POST   /api/uretim-plani/excel-import  # Excel'den import
GET    /api/uretim-plani/export/:id    # Excel export
POST   /api/uretim-plani/bom-analiz    # BOM analizi
```

**Üretim Planı Model:**
```typescript
{
  id: number;
  planAdi: string;
  baslamaTarihi: Date;
  bitisTarihi: Date;
  durum: 'taslak' | 'aktif' | 'tamamlandi';
  planTipi: 'makine-bazli' | 'liste-bazli' | 'karma';
  kayitTarihi: Date;
}
```

### Üretim Planlama V2 (`/api/uretim-planlari`)

```
GET    /api/uretim-planlari            # V2 planları listele
POST   /api/uretim-planlari            # Yeni V2 planı oluştur
PUT    /api/uretim-planlari/:id        # V2 planı güncelle
DELETE /api/uretim-planlari/:id        # V2 planı sil
```

### Tezgah İş Planı (`/api/tezgah-plan`)

```
GET    /api/tezgah-plan                # Tezgah planlarını listele
POST   /api/tezgah-plan                # Yeni plan oluştur
PUT    /api/tezgah-plan/:id            # Plan güncelle
DELETE /api/tezgah-plan/:id            # Plan sil
POST   /api/tezgah-plan/is-ata         # İş ata
```

### Workstation Scheduler (`/api/scheduler`)

```
GET    /api/scheduler/tasks            # Tüm görevler
GET    /api/scheduler/conflicts        # Çakışma kontrolü
POST   /api/scheduler/optimize         # Optimizasyon
POST   /api/scheduler/schedule         # Zamanlama
```

---

## Parça ve Stok Yönetimi

### Parçalar (`/api/parcalar`)

```
GET    /api/parcalar                   # Tüm parçaları listele
GET    /api/parcalar/:id               # Parça detay
POST   /api/parcalar                   # Yeni parça oluştur
PUT    /api/parcalar/:id               # Parça güncelle
DELETE /api/parcalar/:id               # Parça sil
GET    /api/parcalar/search/:query     # Parça ara
GET    /api/parcalar/grup/:grupId      # Gruba göre parçalar
```

**Parça Model:**
```typescript
{
  id: number;
  parcaKodu: string;
  parcaAdi: string;
  grubu: string;
  teknikResim: string;
  birim: string;
  kritikStok: number;
  mevcutStok: number;
}
```

### Parça Import (`/api/parcalar/import`)

```
POST   /api/parcalar/import            # Parça import et
POST   /api/parcalar/import/excel      # Excel'den import
```

### Parça Kayıtları (`/api/parca-kayitlari`)

```
GET    /api/parca-kayitlari            # Kayıtları listele
POST   /api/parca-kayitlari            # Yeni kayıt
PUT    /api/parca-kayitlari/:id        # Kayıt güncelle
DELETE /api/parca-kayitlari/:id        # Kayıt sil
```

### Parça Takip Listeleri (`/api/parca-takip-listeleri`)

```
GET    /api/parca-takip-listeleri      # Takip listelerini getir
POST   /api/parca-takip-listeleri      # Yeni liste oluştur
PUT    /api/parca-takip-listeleri/:id  # Liste güncelle
DELETE /api/parca-takip-listeleri/:id  # Liste sil
```

### Parça Birleşik (`/api/parca-birlesik`)

```
GET    /api/parca-birlesik             # Birleşik parça listesi
POST   /api/parca-birlesik/birlestir   # Parçaları birleştir
DELETE /api/parca-birlesik/:id         # Birleşimi kaldır
```

### Stok Kartları (`/api/stok-kartlari`)

```
GET    /api/stok-kartlari              # Stok kartlarını listele
GET    /api/stok-kartlari/:id          # Stok kartı detay
POST   /api/stok-kartlari              # Yeni stok kartı
PUT    /api/stok-kartlari/:id          # Stok kartı güncelle
DELETE /api/stok-kartlari/:id          # Stok kartı sil
GET    /api/stok-kartlari/kritik       # Kritik stoklar
```

**Stok Kartı Model:**
```typescript
{
  id: number;
  stokKodu: string;
  parcaId: number;
  mevcutMiktar: number;
  minMiktar: number;
  maxMiktar: number;
  birim: string;
  depolamaYeri: string;
}
```

### Stok Kartı (`/api/stok-karti`)

```
GET    /api/stok-karti                 # Yeni API endpoint'leri
POST   /api/stok-karti                 # Stok kartı oluştur
PUT    /api/stok-karti/:id             # Stok güncelle
POST   /api/stok-karti/stok-girisi     # Stok girişi
POST   /api/stok-karti/stok-cikisi     # Stok çıkışı
```

### Stok Takip Listeleri (`/api/stok-takip-listeleri`)

```
GET    /api/stok-takip-listeleri       # Stok takip listeleri
POST   /api/stok-takip-listeleri       # Yeni liste oluştur
```

### BOM Yönetimi (`/api/boms`)

```
GET    /api/boms                       # Tüm BOM'ları listele
GET    /api/boms/:id                   # BOM detay
POST   /api/boms                       # Yeni BOM oluştur
PUT    /api/boms/:id                   # BOM güncelle
DELETE /api/boms/:id                   # BOM sil
GET    /api/boms/parca/:parcaId        # Parça BOM'ları
POST   /api/boms/kopyala               # BOM kopyala
```

**BOM Model:**
```typescript
{
  id: number;
  parcaId: number;
  versiyon: string;
  durum: 'aktif' | 'pasif';
  kayitTarihi: Date;
  maliyet: number;
  kalemler: BOMKalem[];
}
```

### Makindex (Hiyerarşik Parça Sistemi) (`/api/makindex`)

```
GET    /api/makindex                   # Hiyerarşiyi getir
GET    /api/makindex/arama/:query      # Hiyerarşik arama
POST   /api/makindex/sinif             # Yeni sınıf oluştur
PUT    /api/makindex/sinif/:id         # Sınıf güncelle
DELETE /api/makindex/sinif/:id         # Sınıf sil
POST   /api/makindex/sinif/:id/parca-ekle    # Parça ekle
DELETE /api/makindex/sinif/:id/parca/:parcaId # Parça çıkar
```

**Makindex Model:**
```typescript
{
  id: number;
  ad: string;
  ustSinifId: number | null;
  sira: number;
  seviye: number;
  yol: string; // "1.2.3" formatında hiyerarşik yol
  altSiniflar: MakinaSinifi[];
  parcalar: Parca[];
}
```

### Gruplar (`/api/gruplar`)

```
GET    /api/gruplar                    # Grupları listele
POST   /api/gruplar                    # Yeni grup oluştur
PUT    /api/gruplar/:id                # Grup güncelle
DELETE /api/gruplar/:id                # Grup sil
```

### Makina Group Parts (`/api/makina-group-parts`)

```
GET    /api/makina-group-parts          # Makina-grup ilişkileri
POST   /api/makina-group-parts          # Yeni ilişki oluştur
DELETE /api/makina-group-parts/:id      # İlişki sil
```

---

## Makina ve Tezgah Yönetimi

### Makinalar (`/api/makinalar`)

```
GET    /api/makinalar                  # Makinaları listele
GET    /api/makinalar/:id              # Makina detay
POST   /api/makinalar                  # Yeni makina oluştur
PUT    /api/makinalar/:id              # Makina güncelle
DELETE /api/makinalar/:id              # Makina sil
GET    /api/makinalar/sinif/:sinifId   # Sınıfa göre makinalar
```

**Makina Model:**
```typescript
{
  id: number;
  makinaAdi: string;
  makinaKodu: string;
  sinifi: string;
  durumu: 'aktif' | 'pasif' | 'bakimda';
  kapasite: number;
  lokasyon: string;
}
```

### Tezgahlar (`/api/tezgahlar`)

```
GET    /api/tezgahlar                  # Tezgahları listele
GET    /api/tezgahlar/:id              # Tezgah detay
POST   /api/tezgahlar                  # Yeni tezgah oluştur
PUT    /api/tezgahlar/:id              # Tezgah güncelle
DELETE /api/tezgahlar/:id              # Tezgah sil
GET    /api/tezgahlar/makina/:makinaId # Makina tezgahları
POST   /api/tezgahlar/:id/durum-degistir # Durum değiştir
```

**Tezgah Model:**
```typescript
{
  id: number;
  tezgahAdi: string;
  tezgahKodu: string;
  makinaId: number;
  durumu: 'calisiyor' | 'beklemede' | 'arizali' | 'bakimda';
  mevcutIsEmriId: number | null;
}
```

### Tezgah Durum (`/api/tezgah-durum`)

```
GET    /api/tezgah-durum                # Tezgah durumlarını listele
POST   /api/tezgah-durum                # Yeni durum kaydı
GET    /api/tezgah-durum/tezgah/:id     # Tezgah durum geçmişi
GET    /api/tezgah-durum/son-durumlar   # Son durumlar
```

### Tezgah Raporları (`/api/tezgah`)

```
GET    /api/tezgah/calisma-tablosu      # Çalışma tablosu
GET    /api/tezgah/performans           # Performans raporu
GET    /api/tezgah/rapor/:id            # Tezgah raporu
```

### CNC Link (`/api/cnc_link`)

```
POST   /api/cnc_link/register           # CNC panel kaydı
POST   /api/cnc_link/status             # Durum güncelle
POST   /api/cnc_link/heartbeat          # Canlı kontrol
GET    /api/cnc_link/status/:panelId    # Panel durumu
```

### İşlem Kayıtları (`/api/islem-kayitlari`)

```
GET    /api/islem-kayitlari             # İşlem kayıtlarını listele
POST   /api/islem-kayitlari             # Yeni kayıt oluştur
GET    /api/islem-kayitlari/is-emri/:id # İş emri işlemleri
```

---

## Sevkiyat ve Lojistik

### Sevkiyat (`/api/sevkiyat`)

```
GET    /api/sevkiyat                    # Sevkiyatları listele
GET    /api/sevkiyat/:id                # Sevkiyat detay
POST   /api/sevkiyat                    # Yeni sevkiyat oluştur
PUT    /api/sevkiyat/:id                # Sevkiyat güncelle
DELETE /api/sevkiyat/:id                # Sevkiyat sil
POST   /api/sevkiyat/:id/teslim-al      # Teslim al
POST   /api/sevkiyat/:id/iptal          # İptal et
GET    /api/sevkiyat/durum/:durum       # Duruma göre listele
```

**Sevkiyat Model:**
```typescript
{
  id: number;
  sevkiyatNo: string;
  firmaId: number;
  tur: 'giris' | 'cikis' | 'ic';
  durum: 'hazirlaniyor' | 'yolda' | 'teslim-edildi' | 'iptal';
  tarih: Date;
  kalemler: SevkiyatKalem[];
}
```

### Toplu Sevkiyat (`/api/toplu-sevkiyat`)

```
POST   /api/toplu-sevkiyat/olustur      # Toplu sevkiyat oluştur
POST   /api/toplu-sevkiyat/is-emirlerinden # İş emirlerinden oluştur
```

### Sevkiyat Kalemleri (`/api/sevkiyat-kalemleri`)

```
GET    /api/sevkiyat-kalemleri/sevkiyat/:id  # Sevkiyat kalemleri
POST   /api/sevkiyat-kalemleri               # Kalem ekle
PUT    /api/sevkiyat-kalemleri/:id           # Kalem güncelle
DELETE /api/sevkiyat-kalemleri/:id           # Kalem sil
```

### Sevkiyat Lokasyonları (`/api/sevkiyat-lokasyonlar`)

```
GET    /api/sevkiyat-lokasyonlar        # Lokasyonları listele
POST   /api/sevkiyat-lokasyonlar        # Yeni lokasyon
PUT    /api/sevkiyat-lokasyonlar/:id    # Lokasyon güncelle
DELETE /api/sevkiyat-lokasyonlar/:id    # Lokasyon sil
```

### Sevkiyat Resimleri (`/api/sevkiyat-resimler`)

```
POST   /api/sevkiyat-resimler/yukle     # Resim yükle
GET    /api/sevkiyat-resimler/:sevkiyatId # Sevkiyat resimleri
DELETE /api/sevkiyat-resimler/:id       # Resim sil
```

### Sevkiyat Raporları (`/api/sevkiyat-raporlar`)

```
GET    /api/sevkiyat-raporlar/ozet      # Özet rapor
GET    /api/sevkiyat-raporlar/firma/:id # Firma bazlı rapor
```

### Shipment Automation (`/api/shipment-automation`)

```
POST   /api/shipment-automation/analyze      # Otomatik analiz
POST   /api/shipment-automation/create       # Otomatik oluştur
GET    /api/shipment-automation/rules        # Kural listesi
```

---

## Fatura ve İrsaliye

### Faturalar (`/api/faturalar`)

```
GET    /api/faturalar                   # Faturaları listele
GET    /api/faturalar/:id               # Fatura detay
POST   /api/faturalar                   # Yeni fatura oluştur
PUT    /api/faturalar/:id               # Fatura güncelle
DELETE /api/faturalar/:id               # Fatura sil
GET    /api/faturalar/durum/:durum      # Duruma göre listele
POST   /api/faturalar/:id/duzenle       # Düzenlemeye başla
POST   /api/faturalar/:id/iptal         # Düzenlemeyi iptal
```

**Fatura Model:**
```typescript
{
  id: number;
  faturaNo: string;
  faturaTarihi: Date;
  firmaId: number;
  tur: 'satis' | 'alis';
  tutar: number;
  kdv: number;
  durum: 'taslak' | 'onay-bekliyor' | 'onaylandi' | 'iptal';
  duzenleyenPersonelId: number | null;
  duzenlemeLock: boolean;
}
```

### İrsaliyeler (`/api/irsaliyeler`)

```
GET    /api/irsaliyeler                 # İrsaliyeleri listele
GET    /api/irsaliyeler/:id             # İrsaliye detay
POST   /api/irsaliyeler                 # Yeni irsaliye oluştur
PUT    /api/irsaliyeler/:id             # İrsaliye güncelle
DELETE /api/irsaliyeler/:id             # İrsaliye sil
GET    /api/irsaliyeler/durum/:durum    # Duruma göre listele
POST   /api/irsaliyeler/:id/duzenle     # Düzenlemeye başla
POST   /api/irsaliyeler/:id/iptal      # Düzenlemeyi iptal
```

**İrsaliye Model:**
```typescript
{
  id: number;
  irsaliyeNo: string;
  irsaliyeTarihi: Date;
  firmaId: number;
  tur: 'satis' | 'alis';
  durum: 'taslak' | 'beklemede' | 'tamamlandi' | 'iptal';
  duzenleyenPersonelId: number | null;
  duzenlemeLock: boolean;
}
```

### Eşleştirme (`/api/eslestirme`)

```
GET    /api/eslestirme/fatura/:faturaId        # Fatura eşleştirmeleri
GET    /api/eslestirme/irsaliye/:irsaliyeId    # İrsaliye eşleştirmeleri
POST   /api/eslestirme/kalem-ekle              # Kalem eşleştir
POST   /api/eslestirme/kalem-sil               # Kalem kaldır
POST   /api/eslestirme/tamamla                 # Eşleştirmeyi tamamla
POST   /api/eslestirme/iptal                   # Eşleştirmeyi iptal
GET    /api/eslestirme/rapor/uyumsuz           # Uyumsuzluk raporu
```

---

## Fason Yönetimi

### Fason İşler (`/api/fason`)

```
GET    /api/fason                       # Fason işleri listele
GET    /api/fason/:id                   # Fason detay
POST   /api/fason                       # Yeni fason oluştur
PUT    /api/fason/:id                   # Fason güncelle
DELETE /api/fason/:id                   # Fason sil
POST   /api/fason/:id/teslim            # Teslim al
POST   /api/fason/:id/iptal             # İptal et
```

### Fason Gruplar (`/api/fason-grup`)

```
GET    /api/fason-grup                  # Fason grupları listele
POST   /api/fason-grup                  # Yeni grup oluştur
PUT    /api/fason-grup/:id              # Grup güncelle
DELETE /api/fason-grup/:id              # Grup sil
```

### Fason Teklifler (`/api/fason-teklifler`)

```
GET    /api/fason-teklifler             # Teklifleri listele
POST   /api/fason-teklifler             # Yeni teklif oluştur
PUT    /api/fason-teklifler/:id         # Teklif güncelle
POST   /api/fason-teklifler/:id/onay    # Teklifi onayla
```

---

## Raporlama

### Raporlar (`/api/raporlar`)

```
GET    /api/raporlar/uretim              # Üretim raporu
GET    /api/raporlar/stok                # Stok raporu
GET    /api/raporlar/performans          # Performans raporu
GET    /api/raporlar/maliyet             # Maliyet raporu
POST   /api/raporlar/ozel                # Özel rapor oluştur
GET    /api/raporlar/export/:raporId    # Rapor export
```

### Raporlar V2 (`/api/raporlar`)

```
GET    /api/raporlar/vardiya/tezgah     # Vardiya tezgah raporu
GET    /api/raporlar/uretim-istatistikleri # Üretim istatistikleri
GET    /api/raporlar/parca-performans    # Parça performansı
GET    /api/raporlar/tezgah-performans   # Tezgah performansı
GET    /api/raporlar/planlama-gercekleme # Planlama gerçekleşme
```

### Timeline (`/api/timeline`)

```
GET    /api/timeline/events              # Timeline olayları
GET    /api/timeline/gantt               # Gantt chart verisi
POST   /api/timeline/event               # Olay oluştur
PUT    /api/timeline/event/:id           # Olay güncelle
DELETE /api/timeline/event/:id           # Olay sil
```

---

## Sistem Yönetimi

### Firmalar (`/api/firmalar`)

```
GET    /api/firmalar                    # Firmaları listele
GET    /api/firmalar/:id                # Firma detay
POST   /api/firmalar                    # Yeni firma oluştur
PUT    /api/firmalar/:id                # Firma güncelle
DELETE /api/firmalar/:id                # Firma sil
```

### Personel (`/api/personel`)

```
GET    /api/personel                    # Personeli listele
GET    /api/personel/:id                # Personel detay
POST   /api/personel                    # Yeni personel oluştur
PUT    /api/personel/:id                # Personel güncelle
DELETE /api/personel/:id                # Personel sil
```

### Vardiyalar (`/api/vardiyalar`)

```
GET    /api/vardiyalar                   # Vardiyaları listele
POST   /api/vardiyalar                   # Yeni vardiya oluştur
PUT    /api/vardiyalar/:id               # Vardiya güncelle
DELETE /api/vardiyalar/:id               # Vardiya sil
```

### Vardiya Atama (`/api/vardiya-atamalari`)

```
GET    /api/vardiya-atamalari            # Atamaları listele
POST   /api/vardiya-atamalari            # Yeni atama oluştur
PUT    /api/vardiya-atamalari/:id        # Atama güncelle
DELETE /api/vardiya-atamalari/:id        # Atama sil
```

### Notlar (`/api/notlar`)

```
GET    /api/notlar                       # Notları listele
GET    /api/notlar/:id                   # Not detay
POST   /api/notlar                       # Yeni not oluştur
PUT    /api/notlar/:id                   # Not güncelle
DELETE /api/notlar/:id                   # Not sil
GET    /api/notlar/kategori/:kategoriId  # Kategoriye göre
```

### Kategoriler (`/api/kategoriler`)

```
GET    /api/kategoriler                  # Kategorileri listele
POST   /api/kategoriler                  # Yeni kategori oluştur
PUT    /api/kategoriler/:id              # Kategori güncelle
DELETE /api/kategoriler/:id              # Kategori sil
```

### Arıza Bakım (`/api/ariza-bakim`)

```
GET    /api/ariza-bakim                  # Arıza/bakım kayıtları
GET    /api/ariza-bakim/:id              # Kayıt detay
POST   /api/ariza-bakim                  # Yeni kayıt oluştur
PUT    /api/ariza-bakim/:id              # Kayıt güncelle
DELETE /api/ariza-bakim/:id              # Kayıt sil
POST   /api/ariza-bakim/:id/tamamla      # Tamamlandı olarak işaretle
```

### Siparişler (`/api/siparisler`)

```
GET    /api/siparisler                   # Siparişleri listele
GET    /api/siparisler/:id               # Sipariş detay
POST   /api/siparisler                   # Yeni sipariş oluştur
PUT    /api/siparisler/:id               # Sipariş güncelle
DELETE /api/siparisler/:id               # Sipariş sil
```

### Sipariş Dokümanları (`/api/siparis-dokumanlari`)

```
GET    /api/siparis-dokumanlari          # Dokümanları listele
POST   /api/siparis-dokumanlari/yukle    # Doküman yükle
DELETE /api/siparis-dokumanlari/:id      # Doküman sil
```

### Tedarik (`/api/tedarik`)

```
GET    /api/tedarik/talepler             # Tedarik talepleri
POST   /api/tedarik/talep-olustur       # Talep oluştur
PUT    /api/tedarik/talep/:id           # Talep güncelle
POST   /api/tedarik/talep/:id/onay      # Talebi onayla
```

---

## CAD Entegrasyonu

### CAD Dosyaları (`/api/cad-files`)

```
POST   /api/cad-files/upload             # CAD dosyası yükle
GET    /api/cad-files/:id                # Dosya bilgisi
DELETE /api/cad-files/:id                # Dosya sil
GET    /api/cad-files/bom/:fileId        # BOM çıkar
```

### CAD Import (`/api/cad-import`)

```
POST   /api/cad-import/start             # Import başlat
POST   /api/cad-import/stop              # Import durdur
GET    /api/cad-import/status/:jobId    # Import durumu
POST   /api/cad-import/register          # Client kayıt
POST   /api/cad-import/heartbeat         # Canlı kontrol
```

### Dizin Tarama (`/api/dizin-tarama`)

```
POST   /api/dizin-tarama/baslat          # Taramayı başlat
GET    /api/dizin-tarama/durum/:jobId   # Tarama durumu
POST   /api/dizin-tarama/durdur          # Taramayı durdur
```

### Teknik Resim (`/api/teknik-resim`)

```
POST   /api/teknik-resim/yukle           # Resim yükle
GET    /api/teknik-resim/analiz/:id     # OCR analizi
GET    /api/teknik-resim/parca/:parcaId # Parça resimleri
DELETE /api/teknik-resim/:id            # Resim sil
```

### Import-Export (`/api/import-export`)

```
POST   /api/import-export/import         # Veri import
POST   /api/import-export/export        # Veri export
GET    /api/import-export/durum/:jobId  # İşlem durumu
```

### Dosya Yükleme (`/api/upload`)

```
POST   /api/upload/resim                 # Resim yükle
POST   /api/upload/dosya                 # Dosya yükle
POST   /api/upload/excel                # Excel yükle
GET    /api/upload/:dosyaAdi            # Dosya indir
```

### Download (`/api/download`)

```
GET    /api/download/rapor/:raporId      # Rapor indir
GET    /api/download/excel/:tip          # Excel indir
GET    /api/download/backup              # Yedek indir
```

### Backup (`/api/backup`)

```
POST   /api/backup/olustur               # Yedek oluştur
GET    /api/backup/listele               # Yedekleri listele
POST   /api/backup/geri-yukle/:id       # Geri yükle
```

---

## 🔒 Authentication & Authorization

Gelecek versiyonda JWT tabanlı authentication eklenecektir.

Mevcut durumda: Basic auth ve session-based authentication.

---

## 📊 Response Format'ları

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Hata mesajı",
    "details": { ... }
  }
}
```

### List Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 🔍 Query Parameters

### Sayfalama
```
?page=1&limit=20
```

### Sıralama
```
?sort=adi&order=asc|desc
```

### Filtreleme
```
?durum=aktif&minTarih=2024-01-01
```

### Arama
```
?query=parca_adi
```

---

## 📝 HTTP Status Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 204 | İçerik yok |
| 400 | Hatalı istek |
| 401 | Yetkisiz |
| 403 | Yasak |
| 404 | Bulunamadı |
| 409 | Çakışma (conflict) |
| 422 | Doğrulama hatası |
| 500 | Sunucu hatası |

---

## 🔌 WebSocket Events

Detaylı bilgi için: [SOCKET_EVENTS.md](#socket-events)

---

*Son güncelleme: 2024-12-24 | API Versiyon: v14.dev1*
