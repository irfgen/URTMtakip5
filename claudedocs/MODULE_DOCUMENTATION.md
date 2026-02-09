# ÜRTM Takip - Modül Dokümantasyonu

## Modül Genel Bakış

ÜRTM Takip sistemi, üretim yönetimi için tasarlanmış modüler bir yapıya sahiptir. Her modül belirli bir işlevi yerine getirir ve birbiriyle entegre çalışır.

---

## 1. İŞ EMİRLERİ MODÜLÜ

### Açıklama
Üretim iş emirlerinin oluşturulması, takibi ve yönetimi için temel modül.

### Özellikler
- İş emri oluşturma (manuel / Excel / üretim planından)
- Durum takibi (beklemede, üretimde, tamamlandı, iptal)
- Öncelik yönetimi (düşük, orta, yüksek, kritik)
- Tezgah atama ve çıkarma
- Sıralama ve yeniden sıralama
- Toplu işlemler (batch create)
- Fason dönüşümü

### Bileşenler
**Frontend:**
- `IsEmriKarti.jsx` - İş emri kartı (desktop)
- `IsEmriKartiMobile.jsx` - İş emri kartı (mobile)
- `IsEmriListesi.jsx` - İş emri listesi
- `IsEmriKanbanBoard.jsx` - Kanban board görünümü
- `IsEmriEkleForm.jsx` - İş emri ekleme formu
- `IsEmriDuzenleForm.jsx` - İş emri düzenleme formu
- `IsEmriDurumYonetimi.jsx` - Durum yönetimi

**Backend:**
- `isEmirleriController.js` - İş mantığı
- `isEmirleriRoutes.js` - API endpoints

### Durumlar
| Durum | Açıklama |
|-------|----------|
| `beklemede` | İş emri oluşturuldu, bekliyor |
| `atanacak` | Tezgah ataması bekleniyor |
| `uretime_baslandi` | Üretim başladı |
| `uretimde` | Aktif üretim |
| `tamamlandi` | İş emri tamamlandı |
| `iptal` | İptal edildi |
| `fasona_gonderildi` | Fasona gönderildi |

### İş Akışı
```
1. İş Emri Oluştur
   ↓
2. Tezgah Ata
   ↓
3. Üretime Başla
   ↓
4. İşlem Kayıtları
   ↓
5. Tamamla
   ↓
6. Raporlama
```

### İlişkiler
- `Tezgah` - Çoktan-bire (bir tezgahta birçok iş emri)
- `Parca` - Çoktan-bire (bir parça birçok iş emri)
- `UretimPlani` - Çoktan-bire (bir plan birçok iş emri)
- `Fason` - Bire-bire (iş emri fasona dönüşebilir)

---

## 2. TEZGAHLAR MODÜLÜ

### Açıklama
Tezgah/iş istasyonu yönetimi ve takibi için modül.

### Özellikler
- Tezgah ekleme/düzenleme/silme
- Çalışma durumu takibi (musait, calisiyor, bakim)
- İş emri atama/çıkarma
- Tezgah raporları
- Performans dashboard'u
- CNC panel entegrasyonu

### Bileşenler
**Frontend:**
- `TezgahKarti.jsx` - Tezgah kartı
- `TezgahKutusu.jsx` - Tezgah kutusu (mini görünüm)
- `TezgahPerformansDashboard.jsx` - Performans dashboard
- `TezgahListesi.jsx` - Tezgah listesi

**Backend:**
- `tezgahlarController.js`
- `tezgahlarRoutes.js`

### Çalışma Durumları
| Durum | Açıklama |
|-------|----------|
| `musait` | Tezgah müsait, iş kabul eder |
| `calisiyor` | Aktif üretimde |
| `bakim` | Bakımda/arıza durumunda |

### CNC Panel Entegrasyonu
- ESP32-based hardware
- Wi-Fi connectivity
- Real-time status updates
- Durum kodları: 0 (idle), 1 (running), 2 (error)

---

## 3. PARÇALAR MODÜLÜ

### Açıklama
Parça katalog yönetimi ve takip sistemi.

### Özellikler
- Parça ekleme/düzenleme/silme
- Parça kodu otomatik üretim
- Stok adedi takibi
- Ham malzeme ilişkilendirme
- Teknik resim yükleme
- OCR ile teknik resim analizi
- Grup yönetimi
- Excel'den içe aktarma
- Parça birleştirme

### Bileşenler
**Frontend:**
- `ParcaKarti.jsx` - Parça kartı
- `ParcaSecici.jsx` - Parça seçici
- `ParcaDuzenleForm.jsx` - Parça düzenleme
- `ParcaBirlesikYonetimi.jsx` - Parça birleştirme
- `ParcaListesi.jsx` - Parça listesi
- `TeknikResimAnalizi.jsx` - Teknik resim analizi

**Backend:**
- `parcalarController.js`
- `parcalarRoutes.js`
- `teknikResimUpload.js` - Middleware

### Parça Özellikleri
| Alan | Tip | Zorunlu |
|------|-----|---------|
| `parca_kodu` | string | Evet (PK) |
| `parca_adi` | string | Evet |
| `grup` | string | Hayır |
| `stok_adedi` | number | Hayır |
| `birim` | string | Hayır |
| `ham_malzeme_kodu` | string | Hayır |
| `teknik_resim_path` | string | Hayır |

### Teknik Resim OCR
- Tesseract.js entegrasyonu
- Otomatik metin çıkarma
- Parça bilgisi doğrulama
- Thumbnail generation

---

## 4. ÜRETİM PLANLARI MODÜLÜ

### Açıklama
Üretim planlaması için iki farklı sistem.

### Ana Sistem (`/uretim-plani`)

### Özellikler
- Karmaşık BOM-based planlama
- Machine-based planning
- Custom list planning
- Karma (mixed) planning
- Critical stock analysis
- Excel import
- BOM snapshot
- Work order generation

### Bileşenler
**Frontend:**
- `UretimPlaniForm.jsx` - Plan formu
- `UretimPlaniDetay.jsx` - Plan detayı
- `ExcelUretimPlaniModal.jsx` - Excel modal
- `KarmaUretimPlaniForm.jsx` - Karma planlama

**Backend:**
- `uretimPlaniController.js`
- `uretimPlaniRoutes.js`

### Planlama Türleri
| Tür | Açıklama |
|-----|----------|
| `makine_bazli` | Tezgah bazlı planlama |
| `liste_bazli` | Özel liste planlama |
| `karma` | Karma planlama |

### V2 Sistem (`/uretim-planlari`)

### Özellikler
- Basitleştirilmiş yapı
- JSON-based work order lists
- Hafif ve hızlı
- Temel planlama ihtiyaçları

### Bileşenler
**Frontend:**
- `UretimPlanlariV2Liste.jsx` - V2 liste
- `UretimPlanlariV2Form.jsx` - V2 formu

**Backend:**
- `uretimPlanlariV2Controller.js`
- `uretimPlanlariV2Routes.js`

---

## 5. BOM YÖNETİMİ MODÜLÜ

### Açıklama
Malzeme listeleri (Bill of Materials) yönetimi.

### Özellikler
- Hiyerarşik BOM yapısı
- Sonsuz nested seviye
- Grup yönetimi
- Miktar ve birim takibi
- Maliyet hesaplama
- BOM analizi
- Critical material detection

### Bileşenler
**Frontend:**
- `BomAgacGorunum.jsx` - BOM ağaç görünümü
- `BomDuzenleForm.jsx` - BOM düzenleme
- `BomAnalizi.jsx` - BOM analizi

**Backend:**
- `bomsController.js`
- `bomsRoutes.js`

### BOM Yapısı
```
Ürün (Root)
├─ Alt Parça 1
│  ├─ Malzeme 1.1
│  └─ Malzeme 1.2
└─ Alt Parça 2
   ├─ Malzeme 2.1
   └─ Malzeme 2.2
```

### Maliyet Hesaplama
- Material cost
- Labor cost
- Overhead cost
- Total cost calculation

---

## 6. FASON YÖNETİMİ MODÜLÜ

### Açıklama
Fason (dış kaynak) yönetimi sistemi.

### Özellikler
- Fason işi oluşturma
- Fason grubu yönetimi
- İş emrinden fasona dönüşüm
- Teklif yönetimi
- Teslimat takibi
- Fason raporları

### Bileşenler
**Frontend:**
- `FasonIsEmriForm.jsx` - Fason formu
- `FasonGrupYonetimi.jsx` - Grup yönetimi
- `FasonTeklifKarsilastirma.jsx` - Teklif karşılaştırma

**Backend:**
- `fasonController.js`
- `fasonGrupController.js`
- `fasonRoutes.js`

### Fason İş Akışı
```
1. İş Emri Oluştur
   ↓
2. Fason'a Dönüştür
   ↓
3. Fason Grup Seç
   ↓
4. Teklif İste
   ↓
5. Teklif Karşılaştır
   ↓
6. Onayla
   ↓
7. Teslimat Takibi
```

---

## 7. STOK KARTLARI MODÜLÜ

### Açıklama
Ham malzeme stok yönetimi sistemi.

### Özellikler
- Stok kartı oluşturma
- Stok giriş/çıkış
- Kritik seviye uyarıları
- Stok takip listeleri
- Tedarik talebi oluşturma
- Minimum/maximum seviyeler
- Stok raporları

### Bileşenler
**Frontend:**
- `StokKartiListesi.jsx` - Liste
- `StokKartiForm.jsx` - Form
- `StokGirisCikis.jsx` - Giriş/çıkış
- `StokTakipListeleri.jsx` - Takip listeleri

**Backend:**
- `stokKartlariController.js`
- `stokKartlariRoutes.js`
- `stokKartlariService.js`

### Stok Hareketleri
| İşlem | Açıklama |
|-------|----------|
| `giris` | Malzeme girişi |
| `cikis` | Malzeme çıkışı |
| `transfer` | Transfer işlemi |
| `sayim` | Sayım farkı |

### Kritik Stok
- Minimum seviye altı uyarısı
- Otomatik tedarik talebi
- Renkli göstergeler (kırmızı/sarı/yeşil)

---

## 8. SEVKİYAT MODÜLÜ

### Açıklama
Sevkiyat ve teslimat yönetimi.

### Özellikler
- Sevkiyat oluşturma
- Kalem yönetimi
- Resim/document yükleme
- İç/dış sevkiyat
- Müşteri takibi
- Teslimat onayı

### Bileşenler
**Frontend:**
- `SevkiyatForm.jsx` - Sevkiyat formu
- `SevkiyatDetay.jsx` - Detay görünüm
- `SevkiyatKartlari.jsx` - Kart görünüm

**Backend:**
- `sevkiyatController.js`
- `sevkiyatRoutes.js`
- `sevkiyatKalemleriRoutes.js`

---

## 9. FATURA VE İRSALİYE MODÜLÜ

### Açıklama
Fatura ve irsaliye yönetimi ile eşleştirme sistemi.

### Özellikler
- Fatura oluşturma
- İrsaliye oluşturma
- Fatura-irsaliye eşleştirme
- Kalem eşleştirme
- Socket.IO real-time updates
- Eşleştirme dashboard'u

### Bileşenler
**Frontend:**
- `FaturaForm.jsx` - Fatura formu
- `IrsaliyeForm.jsx` - İrsaliye formu
- `FaturaIrsaliyeEslestirme.jsx` - Eşleştirme
- `IrsaliyeKalemMatchCard.jsx` - Kalem eşleştirme

**Backend:**
- `faturalarController.js`
- `irsaliyelerController.js`
- `eslestirmeRoutes.js`

### Socket.IO Namespace
- Namespace: `/fatura-eslestirme`
- Events: `fatura-eslestirme`, `irsaliye-updated`

---

## 10. ARIZA-BAKIM MODÜLÜ

### Açıklama
Ekipman arıza ve bakım takibi.

### Özellikler
- Arıza kaydı oluşturma
- Bakım planlama
- Arıza türü kategorileri
- Çözüm takibi
- Personel atama
- Arıza raporları

### Bileşenler
**Frontend:**
- `ArizaKayitForm.jsx` - Kayıt formu
- `ArizaListesi.jsx` - Arıza listesi
- `BakimPlanlama.jsx` - Bakım planlama

**Backend:**
- `arizaBakimController.js`
- `arizaBakimRoutes.js`

### Arıza Türleri
- Mekanik
- Elektrik
- Yazılım
- Operatör hatası
- Diğer

---

## 11. MAKINDEX MODÜLÜ

### Açıklama
Makine-endeks ve parça hiyerarşi yönetimi.

### Özellikler
- Makina sınıfları
- Parça-makina ilişkileri
- Hiyerarşik ağaç görünümü
- Gelişmiş arama
- Filtreleme
- Virtualized rendering

### Bileşenler
**Frontend:**
- `MakindexTreeView.jsx` - Ağaç görünüm
- `VirtualizedTreeView.jsx` - Sanallaştırılmış ağaç
- `MakindexSearch.jsx` - Arama
- `MakindexFilters.jsx` - Filtreler

**Backend:**
- `makindexController.js`
- `makindexRoutes.js`

### Veri Yapısı
```
MakinaSinifi
├─ Makina
│  ├─ Parça
│  └─ Parça
└─ Makina
   └─ Parça
```

---

## 12. TEDARİK MODÜLÜ

### Açıklama
Tedarik zinciri yönetimi.

### Özellikler
- Tedarik talebi oluşturma
- Firma yönetimi
- Teklif karşılaştırma
- Sipariş takibi
- Teslimat yönetimi

### Bileşenler
**Frontend:**
- `TedarikTalepForm.jsx` - Talep formu
- `TedarikFirmaYonetimi.jsx` - Firma yönetimi
- `TedarikDashboard.jsx` - Dashboard

**Backend:**
- `tedarikController.js`
- `tedarikRoutes.js`

---

## 13. RAPORLAR MODÜLÜ

### Açıklama
Kapsamlı raporlama sistemi.

### Rapor Türleri
- Üretim raporları
- Performans raporları
- Stok raporları
- Fason raporları
- Maliyet raporları
- Personel raporları
- Vardiya raporları

### Bileşenler
**Frontend:**
- `RaporlarDashboard.jsx` - Dashboard
- `UretimRaporu.jsx` - Üretim raporu
- `PerformansRaporu.jsx` - Performans raporu

**Backend:**
- `raporlarController.js`
- `raporlarRoutes.js`

---

## 14. NOTLAR MODÜLÜ

### Açıklama
Not yönetim sistemi.

### Özellikler
- Not oluşturma/düzenleme/silme
- Kategori yönetimi
- Etiketleme
- Arama ve filtreleme
- Renk kodlaması

### Bileşenler
**Frontend:**
- `NotlarListesi.jsx` - Not listesi
- `NotKarti.jsx` - Not kartı
- `NotKategorileri.jsx` - Kategoriler

**Backend:**
- `notlarController.js`
- `notlarRoutes.js`
- `notlarService.js`

---

## 15. VARDİYA YÖNETİMİ MODÜLÜ

### Açıklama
Vardiya ve personel planlama.

### Özellikler
- Vardiya tanımlama
- Personel atama
- Vardiya takibi
- Performans takibi

### Bileşenler
**Frontend:**
- `VardiyaListesi.jsx` - Vardiya listesi
- `VardiyaAtama.jsx` - Atama formu

**Backend:**
- `vardiyalarController.js`
- `vardiyalarRoutes.js`

---

## 16. TIMELINE MODÜLÜ

### Açıklama
Zaman çizelgesi görünümü.

### Özellikler
- Timeline görünümü
- İş emri zamanlaması
- Drag-drop scheduling
- Conflict detection

### Bileşenler
**Frontend:**
- `TimelineView.jsx` - Timeline görünüm
- `TimelineEvent.jsx` - Event bileşen

**Backend:**
- `timelineController.js`
- `timelineRoutes.js`

---

## 17. SCHEDULER MODÜLÜ

### Açıklama
İş istasyonu planlayıcı.

### Özellikler
- Workstation scheduling
- Availability check
- Conflict resolution
- Auto-assignment

### Bileşenler
**Frontend:**
- `WorkstationScheduler.jsx` - Scheduler
- `SchedulerEvent.jsx` - Event

**Backend:**
- `schedulerController.js`
- `schedulerRoutes.js`

---

## 18. MAKINALAR MODÜLÜ (DDD)

### Açıklama
Domain-Driven Design mimarisi ile geliştirilmiş makina yönetimi modülü.

### Yapı
```
modules/makinalar/
├── controllers/   # Request handling
├── services/      # Business logic
├── repositories/  # Data access
├── routes/        # Routes
└── validators/    # Validation
```

### Bileşenler
- `MakinaController.js`
- `MakinaService.js`
- `MakinaRepository.js`
- `MakinaRoutes.js`
- `MakinaValidator.js`

---

## 19. CAD IMPORT MODÜLÜ

### Açıklama
SolidWorks CAD dosya entegrasyonu.

### Özellikler
- SolidWorks COM automation
- Thumbnail generation
- Batch processing
- Real-time progress

### Python Client
**Location:** `CAD_Import_Client/`

**Socket.IO Namespace:** `/cad-import`

### Events
- `register-client` - Client registration
- `job-progress` - Progress update
- `file-processed` - File done

---

## 20. CNC PANEL MODÜLÜ

### Açıklama
ESP32-based CNC monitoring hardware.

### Özellikler
- Wi-Fi connectivity
- Real-time status
- Machine monitoring

### Hardware
**Platform:** ESP32 (PlatformIO)

**Status Codes:**
- 0: Idle
- 1: Running
- 2: Error/Maintenance

### Integration
- API: `/api/cnc_link`
- Socket.IO events
- Tezgahlar modülü entegrasyonu

---

## MODÜL İLİŞKİLERİ

```
İş Emirleri
├─ Tezgahlar (assignment)
├─ Parçalar (production)
├─ Üretim Planları (source)
└─ Fason (external production)

Parçalar
├─ BOM (composition)
├─ Stok Kartları (raw material)
└─ Teknik Resim (documentation)

Sevkiyat
├─ Fatura (billing)
└─ İrsaliye (delivery)

Arıza-Bakım
└─ Tezgahlar (equipment)

Tedarik
└─ Stok Kartları (replenishment)
```

---

## ORTAK BİLEŞENLER

### Layout
- `Layout.jsx` - Desktop layout
- `MobileLayout.jsx` - Mobile layout

### Common
- `Button.jsx` - Custom button
- `Modal.jsx` - Custom modal
- `Card.jsx` - Custom card
- `DataTable.jsx` - Data table

### Forms
- `FormTextField.jsx` - Text input
- `FormSelectField.jsx` - Select
- `FormDatePicker.jsx` - Date picker
- `FormAutoComplete.jsx` - Autocomplete

---

## MOBİL BİLEŞENLER

### Pages
- `mobile/TezgahlarPage.jsx`
- `mobile/IsEmirleriPage.jsx`
- `mobile/ParcalarPage.jsx`
- `mobile/StokKartlariPage.jsx`

### Components
- `mobile/IsEmriKartiMobile.jsx`
- `mobile/TezgahKartiMobile.jsx`
- `mobile/FloatingActionButtons.jsx`

---

## REDUX SLICES

### State Management
- `isEmirleriSlice.js` - İş emirleri
- `makindexSlice.js` - MAKINDEX
- `schedulerSlice.js` - Scheduler
- `timelineSlice.js` - Timeline
- `uretimPlaniSlice.js` - Üretim planı
- `arizaBakimSlice.js` - Arıza-bakım

---

## CUSTOM HOOKS

- `useDeviceDetect.js` - Device detection
- `useDeviceOverride.js` - Device override
- `usePullToRefresh.js` - Pull-to-refresh
- `useStokKartlari.js` - Stok kartları

---

## SERVİSLER

### API Client
- `services/api.js` - Main API client
- `services/cacheService.js` - Caching
- `services/socketClient.js` - Socket.IO

### Module Services
- `services/uretimPlanlariV2.js` - Üretim planı V2
- `services/stokKartlariService.js` - Stok kartları
- `services/notlarService.js` - Notlar
- `services/tedarikService.js` - Tedarik
- `services/teknikResimService.js` - Teknik resim

---

## MIDDLEWARE

### Backend
- `middleware/auth.js` - Authentication
- `middleware/errorHandler.js` - Error handling
- `middleware/rateLimiter.js` - Rate limiting
- `middleware/socket.js` - Socket.IO
- `middleware/teknikResimUpload.js` - File upload

---

## DATABASE MIGRATIONS

### Key Migrations
- `20240912000001-add-tahmini-isleme-suresi.js` - Processing time
- `20250924_add_cost_fields_to_boms.js` - Cost tracking
- `20250701000001-create-notlar-tables.js` - Notes tables

---

## ÖZET

| Modül | Frontend Bileşen | Backend Controller | Route |
|-------|------------------|-------------------|-------|
| İş Emirleri | 8+ | 1 | `/is-emirleri` |
| Tezgahlar | 4+ | 1 | `/tezgahlar` |
| Parçalar | 6+ | 1 | `/parcalar` |
| Üretim Planı | 4+ | 2 | `/uretim-plani` |
| BOM | 3+ | 1 | `/boms` |
| Fason | 3+ | 2 | `/fason` |
| Stok | 4+ | 1 | `/stok-kartlari` |
| Sevkiyat | 3+ | 2 | `/sevkiyat` |
| Fatura | 4+ | 3 | `/faturalar` |
| Arıza | 3+ | 1 | `/ariza-bakim` |
| MAKINDEX | 4+ | 1 | `/makindex` |
| Tedarik | 3+ | 1 | `/tedarik` |
| Raporlar | 3+ | 1 | `/raporlar` |
| Notlar | 3+ | 1 | `/notlar` |
| Vardiya | 2+ | 1 | `/vardiyalar` |
| Timeline | 2+ | 1 | `/timeline` |
| Scheduler | 2+ | 1 | `/scheduler` |

---

Toplam: **20 ana modül**, **200+ bileşen**, **18+ controller**, **64 route**
