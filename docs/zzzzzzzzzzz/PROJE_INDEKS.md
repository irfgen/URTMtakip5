# ÜRTM Takip - Proje İndeksi

> **Son Güncelleme**: 2026-01-26
> **Sürüm**: v16.x
> **Durum**: Aktif Geliştirme

## 📋 İçindekiler

1. [Proje Özeti](#proje-özeti)
2. [Teknoloji Yığını](#teknoloji-yığını)
3. [Proje Yapısı](#proje-yapısı)
4. [Backend Modülleri](#backend-modülleri)
5. [Frontend Modülleri](#frontend-modülleri)
6. [Veritabanı Şeması](#veritabanı-şeması)
7. [API Endpoint'leri](#api-endpointleri)
8. [Dış Sistem Entegrasyonları](#dış-sistem-entegrasyonları)
9. [Geliştirme Rehberi](#geliştirme-rehberi)
10. [Dokümantasyon Kaynakları](#dokümantasyon-kaynakları)

---

## Proje Özeti

**ÜRTM Takip**, endüstriyel üretim ortamları için tasarlanmış kapsamlı bir üretim takip ve yönetim sistemidir.

### Temel Yetenekler

| Modül | Açıklama | Durum |
|-------|----------|-------|
| **İş Emirleri** | Üretim siparişlerinin yaşam döngüsü yönetimi | ✅ Aktif |
| **Tezgahlar** | Makine/tezgah yönetimi ve gerçek zamanlı izleme | ✅ Aktif |
| **Parçalar** | Parça kataloğu, teknik resimler ve BOM | ✅ Aktif |
| **Üretim Planı** | Excel tabanlı planlama ve BOM analizi | ✅ Aktif (V1 & V2) |
| **Stok Yönetimi** | Ham madde ve yarı mamul stok takibi | ✅ Aktif |
| **Fason İşler** | Dış tedarikçi ve teklif yönetimi | ✅ Aktif |
| **Sevkiyat** | Teslimat takibi ve dokümantasyon | ✅ Aktif |
| **Arıza-Bakım** | Ekipman bakım ve arıza kayıtları | ✅ Aktif |
| **Vardiya** | Vardiya ve personel yönetimi | ✅ Aktif |
| **Raporlar** | Üretim analitiği ve performans metrikleri | ✅ Aktif |
| **Notlar** | Kategorize edilmiş not yönetimi | ✅ Aktif |
| **Makindex** | Hiyerarşik makine-parça sınıflandırma | ✅ Aktif |
| **CNC Panel** | ESP32 tabanlı gerçek zamanlı CNC izleme | ✅ Aktif |

### Teknik Özellikler

- **Çift Layout Mimarisi**: Masaüstü ve mobil için ayrı optimize edilmiş arayüzler
- **Gerçek Zamanlı**: Socket.IO ile canlı üretim verisi
- **Dosya Yönetimi**: Teknik resimler, Excel, PDF işleme
- **Türkçe Dil**: Tam Türkçe dil desteği
- **Mobil Öncelikli**: Dokunmatik optimize edilmiş üretim sahası arayüzü

---

## Teknoloji Yığını

### Backend
```yaml
Runtime: Node.js 18+
Framework: Express.js
Database: SQLite (WAL mode)
ORM: Sequelize
Real-time: Socket.IO
Security: Helmet, CORS, rate limiting
File Processing: Multer, XLSX, Sharp, Tesseract.js
Logging: Winston
Validation: Joi
Authentication: bcryptjs, JWT
Migrations: Umzug
```

### Frontend
```yaml
Framework: React 18
Build Tool: Vite
UI Library: Material-UI v5
State Management: Redux Toolkit
Routing: React Router v6
HTTP Client: Axios
Real-time Client: Socket.IO Client
Device Detection: Custom hooks
Forms: Formik + Yup
Charts: Chart.js + react-chartjs-2
PDF: react-pdf
Drag & Drop: @hello-pangea/dnd
```

### CNC Panel (ESP32)
```yaml
Platform: ESP32
Framework: PlatformIO
Communication: Wi-Fi HTTP + WebSocket
Language: C++
Status Codes: 0 (idle), 1 (running), 2 (error)
```

### Python CAD Araçları
```yaml
STEP_BOM_Analyzer:
  - FreeCAD integration
  - 3D rendering (matplotlib, trimesh)
  - Formats: JSON, Excel, CSV, XML export

CAD_Import_Client:
  - SolidWorks COM automation
  - Batch processing
  - Windows-only
```

---

## Proje Yapısı

```
URTMtakip/
├── backend/                      # Backend uygulaması
│   ├── src/
│   │   ├── config/              # Yapılandırma dosyaları
│   │   ├── controllers/         # İş mantığı handler'ları (60+)
│   │   ├── middleware/          # Özel middleware'ler
│   │   ├── migrations/          # Veritabanı göçleri
│   │   ├── models/              # Sequelize modelleri (50+)
│   │   ├── modules/             # Modüler yapı (yeni)
│   │   │   └── makinalar/       # Makinalar modülü
│   │   ├── routes/              # API endpoint tanımları (60+)
│   │   ├── services/            # Dış servis entegrasyonları
│   │   └── utils/               # Paylaşılan yardımcılar
│   ├── uploads/                 # Dosya yükleme dizini
│   ├── importlar/               # Excel içe aktarmalar
│   └── package.json
│
├── frontend/                     # Frontend uygulaması
│   ├── src/
│   │   ├── api/                 # API iletişim katmanı
│   │   ├── components/          # Yeniden kullanılabilir bileşenler (100+)
│   │   │   ├── mobile/          # Mobil özel bileşenler
│   │   │   ├── Notlar/          # Notlar modülü
│   │   │   ├── Raporlar/        # Raporlar modülü
│   │   │   ├── StokKartlari/    # Stok kartları modülü
│   │   │   ├── UretimPlani/     # Üretim planı modülü
│   │   │   ├── VardiyaYonetimi/ # Vardiya yönetimi modülü
│   │   │   └── Timeline/        # Timeline/Gantt bileşenleri
│   │   ├── modules/             # Modüler yapı (yeni)
│   │   │   └── makinalar/       # Makinalar modülü
│   │   ├── pages/               # Sayfa düzeyi bileşenler
│   │   ├── hooks/               # Özel React hooks
│   │   ├── services/            # Servis katmanı
│   │   ├── store/               # Redux store
│   │   └── utils/               # Paylaşılan yardımcılar
│   ├── public/                  # Statik dosyalar
│   └── package.json
│
├── CNC_panel/                    # ESP32 CNC panel
│   ├── include/                 # C++ header dosyaları
│   ├── lib/                     # Kütüphaneler
│   ├── src/                     # Kaynak kod
│   ├── test/                    # Testler
│   └── platformio.ini
│
├── STEP_BOM_Analyzer/            # Python STEP analizi
│   ├── main.py                  # Ana GUI uygulaması
│   └── requirements.txt
│
├── CAD_Import_Client/            # Python CAD istemcisi
│   ├── main.py                  # Ana GUI uygulaması
│   └── requirements.txt
│
├── ContEng/                      # Context Engineering dokümantasyonu
├── claudedocs/                   # Claude dokümantasyonu
├── context/                      # Bağlam bilgileri
├── openspec/                     # OpenSpec şablonları
└── package.json                  # Root proje konfigürasyonu
```

---

## Backend Modülleri

### Route Dosyaları (60+ endpoint)

#### Çekirdek Modüller
| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/api/is-emirleri` | [isEmirleriRoutes.js](backend/src/routes/isEmirleriRoutes.js) | İş emri CRUD |
| `/api/tezgahlar` | [tezgahRoutes.js](backend/src/routes/tezgahRoutes.js) | Tezgah yönetimi |
| `/api/parcalar` | [parcaRoutes.js](backend/src/routes/parcaRoutes.js) | Parça kataloğu |
| `/api/boms` | [bomRoutes.js](backend/src/routes/bomRoutes.js) | BOM yönetimi |
| `/api/islem-kayitlari` | [islemKaydiRoutes.js](backend/src/routes/islemKaydiRoutes.js) | İşlem kayıtları |

#### Planlama Modülleri
| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/api/uretim-plani` | [uretimPlaniRoutes.js](backend/src/routes/uretimPlaniRoutes.js) | Üretim planı (ana) |
| `/api/uretim-planlari` | [uretimPlanlariRoutes.js](backend/src/routes/uretimPlanlariRoutes.js) | Üretim planı V2 |
| `/api/tezgah-plan` | [tezgahPlanRoutes.js](backend/src/routes/tezgahPlanRoutes.js) | Tezgah planlama |
| `/api/tezgah-is-plani` | [tezgahIsPlanimi.js](backend/src/routes/tezgahIsPlanimi.js) | İş planı V2 |
| `/api/workstation-scheduler` | [workstationSchedulerRoutes.js](backend/src/routes/workstationSchedulerRoutes.js) | Planlayıcı |
| `/api/timeline` | [timeline.js](backend/src/routes/timeline.js) | Timeline/Gantt |

#### Stok ve Parça Modülleri
| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/api/stok-kartlari` | [stokKartlariRoutes.js](backend/src/routes/stokKartlariRoutes.js) | Stok kartları |
| `/api/stok-karti` | [stokKartiRoutes.js](backend/src/routes/stokKartiRoutes.js) | Tekil stok kartı |
| `/api/stok-takip-listeleri` | [stokTakipListeleri.js](backend/src/routes/stokTakipListeleri.js) | Stok takip listeleri |
| `/api/parca-kayitlari` | [parcaKayitlariRoutes.js](backend/src/routes/parcaKayitlariRoutes.js) | Parça kayıtları |
| `/api/parca-takip-listeleri` | [parcaTakipListeleri.js](backend/src/routes/parcaTakipListeleri.js) | Parça takip listeleri |
| `/api/parca-birlesik` | [parcaBirlesikRoutes.js](backend/src/routes/parcaBirlesikRoutes.js) | Parça birleştirme |
| `/api/parca-import` | [parcaImportRoutes.js](backend/src/routes/parcaImportRoutes.js) | Parça içe aktarma |

#### Fason ve Tedarik Modülleri
| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/api/fason` | [fasonRoutes.js](backend/src/routes/fasonRoutes.js) | Fason yönetimi |
| `/api/fason-grup` | [fasonGrupRoutes.js](backend/src/routes/fasonGrupRoutes.js) | Fason grupları |
| `/api/fason-is-emri` | [fasonIsEmriController.js](backend/src/controllers/fasonIsEmriController.js) | Fason iş emirleri |
| `/api/fason-teklif` | [fasonTeklifController.js](backend/src/controllers/fasonTeklifController.js) | Fason teklifleri |
| `/api/tedarik` | [tedarikRoutes.js](backend/src/routes/tedarikRoutes.js) | Tedarik talepleri |
| `/api/siparisler` | [siparislerRoutes.js](backend/src/routes/siparislerRoutes.js) | Siparişler |
| `/api/makina-siparis` | [makinaSiparisRoutes.js](backend/src/routes/makinaSiparisRoutes.js) | Makine siparişleri |
| `/api/makina-stok` | [makinaStokRoutes.js](backend/src/routes/makinaStokRoutes.js) | Makine stok |

#### Sevkiyat ve Lojistik Modülleri
| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/api/sevkiyat` | [sevkiyat.js](backend/src/routes/sevkiyat.js) | Sevkiyat yönetimi |
| `/api/irsaliyeler` | [irsaliyeler.js](backend/src/routes/irsaliyeler.js) | İrsaliyeler |
| `/api/faturalar` | [faturalar.js](backend/src/routes/faturalar.js) | Faturalar |
| `/api/eslestirme` | [eslestirme.js](backend/src/routes/eslestirme.js) | Eşleştirme |
| `/api/shipment-automation` | [shipmentAutomationRoutes.js](backend/src/routes/shipmentAutomationRoutes.js) | Otomasyon |

#### Makine ve Tezgah Modülleri
| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/api/makinalar` | [makinalarRoutes.js](backend/src/modules/makinalar/routes/makinalarRoutes.js) | Makinalar (yeni) |
| `/api/makina` | [makinaRoutes.js](backend/src/routes/makinaRoutes.js) | Makina (eski) |
| `/api/makina-group-parts` | [makinaGroupPartsRoutes.js](backend/src/routes/makinaGroupPartsRoutes.js) | Grup parçaları |
| `/api/makindex` | [makindexRoutes.js](backend/src/routes/makindexRoutes.js) | Hiyerarşik sınıflandırma |
| `/api/tezgah-durum` | [tezgahDurumRoutes.js](backend/src/routes/tezgahDurumRoutes.js) | Durum logları |
| `/api/tezgah-rapor` | [tezgahRaporRoutes.js](backend/src/routes/tezgahRaporRoutes.js) | Tezgah raporları |
| `/api/cnc-link` | [cncLinkRoutes.js](backend/src/routes/cncLinkRoutes.js) | CNC bağlantı |

#### Vardiya ve Personel Modülleri
| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/api/vardiya` | [vardiyaRoutes.js](backend/src/routes/vardiyaRoutes.js) | Vardiyalar |
| `/api/vardiya-atama` | [vardiyaAtamaRoutes.js](backend/src/routes/vardiyaAtamaRoutes.js) | Vardiya atama |
| `/api/gunluk-vardiya` | [gunlukVardiyaRoutes.js](backend/src/routes/gunlukVardiyaRoutes.js) | Günlük rapor |
| `/api/personel` | [personelRoutes.js](backend/src/routes/personelRoutes.js) | Personel |

#### Diğer Modüller
| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/api/notlar` | [notlarRoutes.js](backend/src/routes/notlarRoutes.js) | Notlar |
| `/api/kategoriler` | [kategorilerRoutes.js](backend/src/routes/kategorilerRoutes.js) | Kategoriler |
| `/api/gruplar` | [grupRoutes.js](backend/src/routes/grupRoutes.js) | Gruplar |
| `/api/ariza-bakim` | [arizaBakimRoutes.js](backend/src/routes/arizaBakimRoutes.js) | Arıza/bakım |
| `/api/raporlar` | [raporlarRoutes.js](backend/src/routes/raporlarRoutes.js) | Raporlar |
| `/api/is-emri-ozeti` | [isEmriOzetiRoutes.js](backend/src/routes/isEmriOzetiRoutes.js) | İş emri özeti |
| `/api/is-emri-durum` | [isEmriDurumRoutes.js](backend/src/routes/isEmriDurumRoutes.js) | Durum yönetimi |
| `/api/is-emri-taslaklari` | [isEmriTaslaklariRoutes.js](backend/src/routes/isEmriTaslaklariRoutes.js) | Taslaklar |
| `/api/tamamlanan-isler` | [tamamlananIsRoutes.js](backend/src/routes/tamamlananIsRoutes.js) | Tamamlanan işler |
| `/api/teknik-resim` | [teknikResimRoutes.js](backend/src/routes/teknikResimRoutes.js) | Teknik resim OCR |
| `/api/cad-import` | [cadImportRoutes.js](backend/src/routes/cadImportRoutes.js) | CAD içe aktarma |
| `/api/dizin-tarama` | [dizinTarama.js](backend/src/routes/dizinTarama.js) | Dizin tarama |
| `/api/import-export` | [importExportRoutes.js](backend/src/routes/importExportRoutes.js) | İçe/dışa aktarma |

### Model Dosyaları (50+ tablo)

#### Çekirdek Modeller
| Model | Dosya | Açıklama |
|-------|-------|----------|
| `IsEmri` | [IsEmri.js](backend/src/models/IsEmri.js) | İş emirleri |
| `Tezgah` | [Tezgah.js](backend/src/models/Tezgah.js) | Tezgahlar |
| `Parca` | [Parca.js](backend/src/models/Parca.js) | Parçalar |
| `Bom` | [Bom.js](backend/src/models/Bom.js) | BOM |
| `IslemKaydi` | [IslemKaydi.js](backend/src/models/IslemKaydi.js) | İşlem kayıtları |
| `Makina` | [Makina.js](backend/src/models/Makina.js) | Makinalar |
| `StokKarti` | [StokKarti.js](backend/src/models/StokKarti.js) | Stok kartları |

#### Destek Modelleri
- `UretimPlani` / `UretimPlaniV2` - Üretim planları
- `Fason` / `FasonGrup` / `FasonIsEmri` - Fason yönetimi
- `Sevkiyat` / `SevkiyatKalem` - Sevkiyat
- `Irsaliye` / `IrsaliyeKalem` - İrsaliyeler
- `Fatura` / `FaturaKalem` - Faturalar
- `Vardiya` / `VardiyaAtama` / `Personel` - Vardiya yönetimi
- `Notlar` / `NotKategorileri` - Notlar
- `ArizaBakim` - Arıza/bakım
- `StokTakipListesi` / `ParcaTakipListesi` - Takip listeleri
- `ParcaKayitlari` / `ParcaBirlestirmeLog` - Parça kayıtları
- `TezgahDurumLog` / `TezgahPlanlananIsler` - Tezgah planlama
- `IsEmriDurum` / `IsEmriTaslak` - İş emri yönetimi
- `TamamlananIs` - Tamamlanan işler
- `SiparisDokumani` - Sipariş dokümanları
- `Grup` - Gruplar
- `MakinaSinifi` - Makine sınıfları
- `TedarikTalebi` / `TedarikDetay` - Tedarik
- `Satis` - Satış
- `Firma` - Firmalar
- `MakinaSiparis` / `MakinaStok` - Makine sipariş/stok

---

## Frontend Modülleri

### Sayfa Yapısı

#### Ana Sayfalar
| Sayfa | Dosya | Açıklama |
|-------|-------|----------|
| Ana Sayfa | `App.jsx` | Ana uygulama ve routing |
| Dashboard | `pages/Dashboard.jsx` | Ana kontrol paneli |
| Login | `pages/Login.jsx` | Kullanıcı girişi |

#### Modül Sayfaları
| Modül | Sayfa | Konum |
|-------|-------|--------|
| İş Emirleri | `IsEmirleriPage.jsx` | `pages/` |
| Tezgahlar | `TezgahlarPage.jsx` | `pages/` |
| Parçalar | `ParcalarPage.jsx` | `pages/` |
| Üretim Planı | `UretimPlaniPage.jsx` | `pages/` |
| Stok Kartları | `StokKartlariPage.jsx` | `pages/` |
| Fason | `FasonPage.jsx` | `pages/` |
| Sevkiyat | `SevkiyatPage.jsx` | `pages/` |
| Arıza-Bakım | `ArizaBakimPage.jsx` | `pages/` |
| Vardiya | `VardiyaYonetimiPage.jsx` | `pages/VardiyaYonetimi/` |
| Raporlar | `RaporlarPage.jsx` | `pages/Raporlar/` |
| Notlar | `NotlarPage.jsx` | `components/Notlar/` |

### Bileşen Yapısı

#### Ortak Bileşenler
| Bileşen | Dosya | Açıklama |
|---------|-------|----------|
| `IsEmriKarti` | `components/IsEmriKarti.jsx` | İş emri kartı |
| `IsEmriKartiMobile` | `components/IsEmriKartiMobile.jsx` | Mobil iş emri kartı |
| `ParcaKarti` | `components/ParcaKarti.jsx` | Parça kartı |
| `TezgahKarti` | `components/TezgahKarti.jsx` | Tezgah kartı |
| `BomListesi` | `components/BomListesi.jsx` | BOM listesi |
| `IsEmriListesi` | `components/IsEmriListesi.jsx` | İş emri listesi |
| `TeknikResimViewer` | `components/TeknikResimViewer.jsx` | Teknik resim görüntüleyici |
| `ImageWithFallback` | `components/ImageWithFallback.jsx` | Resim yedekleme |

#### Modal Bileşenler
| Bileşen | Dosya | Açıklama |
|---------|-------|----------|
| `BomForm` | `components/BomForm.jsx` | BOM formu |
| `BomPrintModal` | `components/BomPrintModal.jsx` | BOM yazdırma |
| `KayitEkleModal` | `components/KayitEkleModal.jsx` | Kayıt ekleme |
| `ParcaKayitlariModal` | `components/ParcaKayitlariModal.jsx` | Parça kayıtları |
| `SiparisDokumanlariModal` | `components/SiparisDokumanlariModal.jsx` | Sipariş dokümanları |

#### Modüle Özel Bileşenler
- **UretimPlani/**: `UretimPlaniForm.jsx`, `ExcelUretimPlaniModal.jsx`, `BomAnalyzeForm.jsx`
- **VardiyaYonetimi/**: `VardiyaYonetimi.jsx`, `PersonelListesi.jsx`, `VardiyaRaporlari.jsx`
- **Raporlar/**: `UretimIstatistikleri.jsx`, `TezgahCalismaTablosu.jsx`
- **StokKartlari/**: `StokKartiForm.jsx`
- **Notlar/**: `NotKarti.jsx`, `NotEkleme.jsx`, `KategoriYonetimi.jsx`
- **ParcaTakipListeleri/**: `ParcaTakipListesiModal.jsx`
- **StokTakipListeleri/**: `StokTakipListesiModal.jsx`
- **Timeline/**: `TimelineGanttChart.jsx`

#### Mobil Bileşenler
| Bileşen | Dosya | Açıklama |
|---------|-------|----------|
| `MobileIsEmriKartiYeni` | `components/MobileIsEmriKartiYeni.jsx` | Mobil iş emri kartı |
| `IsEmriKartiMobile` | `components/IsEmriKartiMobile.jsx` | Mobil iş emri kartı (eski) |

### Özel Hooks
| Hook | Dosya | Açıklama |
|------|-------|----------|
| `useDeviceDetect` | `hooks/useDeviceDetect.js` | Cihaz algılama |
| `useDeviceOverride` | `hooks/useDeviceOverride.js` | Cihaz geçişi |
| `useStokKartlari` | `hooks/useStokKartlari.js` | Stok kartları verisi |
| `useTezgahlar` | `modules/makinalar/hooks/useTezgahlar.js` | Tezgahlar verisi |
| `useMakinalar` | `modules/makinalar/hooks/useMakinalar.js` | Makinalar verisi |

---

## Veritabanı Şeması

### Temel Tablolar

#### Üretim Tabloları
| Tablo | Açıklama | Anahtarlar |
|-------|----------|------------|
| `is_emirleri` | İş emirleri | PK: id, FK: tezgah_id, parca_id |
| `tezgahlar` | Tezgahlar | PK: id |
| `parcalar` | Parçalar | PK: id |
| `boms` | BOM | PK: id, FK: parent_id, parca_id |
| `islem_kayitlari` | İşlem kayıtları | PK: id, FK: is_emri_id |
| `uretim_plani` | Üretim planları (ana) | PK: id |
| `uretim_planlari` | Üretim planları V2 | PK: id |

#### Stok Tabloları
| Tablo | Açıklama | Anahtarlar |
|-------|----------|------------|
| `stok_kartlari` | Stok kartları | PK: id |
| `stok_hareket` | Stok hareketleri | PK: id, FK: stok_karti_id |
| `stok_takip_listeleri` | Takip listeleri | PK: id |
| `parca_kayitlari` | Parça kayıtları | PK: id, FK: parca_id |
| `parca_takip_listeleri` | Parça takip listeleri | PK: id |

#### Fason ve Tedarik Tabloları
| Tablo | Açıklama | Anahtarlar |
|-------|----------|------------|
| `fason` | Fason firmalar | PK: id |
| `fason_gruplar` | Fason grupları | PK: id |
| `fason_is_emirleri` | Fason iş emirleri | PK: id, FK: fason_id, grup_id |
| `tedarik_talepleri` | Tedarik talepleri | PK: id |
| `siparisler` | Siparişler | PK: id |

#### Sevkiyat Tabloları
| Tablo | Açıklama | Anahtarlar |
|-------|----------|------------|
| `sevkiyat` | Sevkiyatlar | PK: id |
| `sevkiyat_kalemleri` | Sevkiyat kalemleri | PK: id, FK: sevkiyat_id |
| `irsaliyeler` | İrsaliyeler | PK: id |
| `irsaliye_kalemleri` | İrsaliye kalemleri | PK: id, FK: irsaliye_id |
| `faturalar` | Faturalar | PK: id |
| `fatura_kalemleri` | Fatura kalemleri | PK: id, FK: fatura_id |

#### Makine ve Tezgah Tabloları
| Tablo | Açıklama | Anahtarlar |
|-------|----------|------------|
| `makinalar` | Makinalar | PK: id, FK: makina_sinifi_id |
| `makina_siniflari` | Makine sınıfları | PK: id |
| `tezgah_durum_log` | Tezgah durum logları | PK: id, FK: tezgah_id |
| `tezgah_planlanan_isler` | Planlanan işler | PK: id, FK: tezgah_id, is_emri_id |
| `makina_siparis` | Makine siparişleri | PK: id |
| `makina_stok` | Makine stoğu | PK: id |

#### Vardiya ve Personel Tabloları
| Tablo | Açıklama | Anahtarlar |
|-------|----------|------------|
| `vardiyalar` | Vardiyalar | PK: id |
| `vardiya_atamalar` | Vardiya atamaları | PK: id, FK: vardiya_id, personel_id |
| `personel` | Personel | PK: id |

---

## API Endpoint'leri

### İş Emirleri
```
GET    /api/is-emirleri              - Tüm iş emirlerini listele
GET    /api/is-emirleri/:id          - İş emri detay
POST   /api/is-emirleri              - Yeni iş emri oluştur
PUT    /api/is-emirleri/:id          - İş emri güncelle
DELETE /api/is-emirleri/:id          - İş emri sil
PATCH  /api/is-emirleri/:id/durum    - Durum güncelle
```

### Tezgahlar
```
GET    /api/tezgahlar                - Tüm tezgahları listele
GET    /api/tezgahlar/:id            - Tezgah detay
POST   /api/tezgahlar                - Yeni tezgah oluştur
PUT    /api/tezgahlar/:id            - Tezgah güncelle
DELETE /api/tezgahlar/:id            - Tezgah sil
PATCH  /api/tezgahlar/:id/durum      - Durum güncelle
GET    /api/tezgahlar/:id/plan       - Planlanan işler
```

### Parçalar
```
GET    /api/parcalar                 - Tüm parçaları listele
GET    /api/parcalar/:id             - Parça detay
POST   /api/parcalar                 - Yeni parça oluştur
PUT    /api/parcalar/:id             - Parça güncelle
DELETE /api/parcalar/:id             - Parça sil
GET    /api/parcalar/:id/bom         - Parça BOM'u
```

### BOM
```
GET    /api/bom                      - Tüm BOM'ları listele
GET    /api/bom/:id                  - BOM detay
POST   /api/bom                      - Yeni BOM oluştur
PUT    /api/bom/:id                  - BOM güncelle
DELETE /api/bom/:id                  - BOM sil
GET    /api/bom/analiz               - BOM analizi
```

### Stok Kartları
```
GET    /api/stok-kartlari            - Tüm stok kartlarını listele
GET    /api/stok-kartlari/:id        - Stok kartı detay
POST   /api/stok-kartlari            - Yeni stok kartı oluştur
PUT    /api/stok-kartlari/:id        - Stok kartı güncelle
DELETE /api/stok-kartlari/:id        - Stok kartı sil
GET    /api/stok-kartlari/:id/hareket - Stok hareketleri
```

### Socket.IO Olayları
```
client → server:
  - 'connect'                    - Bağlantı kuruldu
  - 'is-emri-update'            - İş emri güncelleme
  - 'tezgah-durum-update'       - Tezgah durum güncelleme

server → client:
  - 'is-emri-created'           - Yeni iş emri
  - 'is-emri-updated'           - İş emri güncellendi
  - 'tezgah-durum-changed'      - Tezgah durumu değişti
  - 'new-notification'          - Yeni bildirim
```

---

## Dış Sistem Entegrasyonları

### CNC Panel (ESP32)
```
Konum: CNC_panel/
Platform: ESP32
Framework: PlatformIO
Bağlantı: Wi-Fi HTTP + WebSocket
Endpoint'ler:
  - POST /api/cnc-link/status   - Durum güncelleme
  - GET  /api/cnc-link/config   - Yapılandırma al
Durum Kodları:
  - 0: Boşta (Idle)
  - 1: Çalışıyor (Running)
  - 2: Hata/Bakım (Error/Maintenance)
```

### STEP BOM Analyzer
```
Konum: STEP_BOM_Analyzer/
Dil: Python
Bağımlılıklar: FreeCAD, numpy, matplotlib, trimesh
Özellikler:
  - STEP dosyası BOM çıkarma
  - 3D görüntüleme ve thumbnail
  - Çoklu format dışa aktarma
API Entegrasyonu:
  - POST /api/parcalar/verify   - Parça doğrulama
```

### CAD Import Client
```
Konum: CAD_Import_Client/
Dil: Python
Platform: Windows only
Bağımlılıklar: SolidWorks COM, pywin32
Özellikler:
  - SolidWorks otomasyonu
  - Toplu işleme
  - Thumbnail üretimi
API Entegrasyonu:
  - POST /api/cad-import/upload - CAD dosyası yükle
  - WebSocket: gerçek zamanlı iletişim
```

---

## Geliştirme Rehberi

### Ortam Kurulumu
```bash
# Ön koşullar
Node.js 18+
npm 9+
SQLite 3
Python 3.8+ (CAD araçları için)
FreeCAD (STEP BOM Analyzer için)
SolidWorks (CAD Import Client için - Windows only)
PlatformIO (ESP32 geliştirme için)

# Kurulum
git clone <repository>
cd URTMtakip
npm run install:all

# Çalıştırma
npm run dev              # Backend (3000) + Frontend (5173)
npm start               # Production
```

### Port Yapılandırması
```
Frontend: 5173 (zorunlu)
Backend:  3000 (zorunlu)
Not: Portlar zaten kullanılıyorsa işlem yapılır ve yeniden başlatılır
```

---

## Dokümantasyon Kaynakları

### ContEng Dokümantasyonu
Kapsamlı context engineering dokümantasyonu `ContEng/` dizininde bulunur:

| Doküman | Açıklama |
|---------|----------|
| [00-project-overview.md](ContEng/00-project-overview.md) | Proje genel bakış |
| [01-architecture-overview.md](ContEng/01-architecture-overview.md) | Sistem mimarisi |
| [02-database-schema.md](ContEng/02-database-schema.md) | Veritabanı şeması |
| [03-api-endpoints.md](ContEng/03-api-endpoints.md) | API referansı |
| [04-frontend-components.md](ContEng/04-frontend-components.md) | Frontend bileşenleri |
| [05-business-workflows.md](ContEng/05-business-workflows.md) | İş süreçleri |
| [06-development-patterns.md](ContEng/06-development-patterns.md) | Geliştirme kalıpları |
| [07-context-prompts.md](ContEng/07-context-prompts.md) | AI context ipuçları |

### Modüle Özel Dokümantasyon
| Konu | Dosya |
|------|-------|
| Makindex Hiyerarşi | [Makindex.md](Makindex.md) |
| BOM Import Raporu | [BOM_IMPORT_RAPORU.md](BOM_IMPORT_RAPORU.md) |
| İthalat/İhracat | [IMPORT_EXPORT_README.md](IMPORT_EXPORT_README.md) |
| Dizin Tarama | [ENHANCED_DIRECTORY_SCANNER.md](ENHANCED_DIRECTORY_SCANNER.md) |
| STEP BOM Analyzer | [STEP_BOM_Analyzer/STEP_BOM_ANALYZER.md](STEP_BOM_Analyzer/STEP_BOM_ANALYZER.md) |

### Bağlam Dokümantasyonu
`context/` dizininde iş ve teknik bilgisi:

| Dosya | İçerik |
|------|--------|
| [karekod.md](context/karekod.md) | Karekod sistemi |
| [maliyet.md](context/maliyet.md) | Maliyet hesaplama |

---

## Versiyon Bilgisi

### Sürüm Geçmişi
- **v16.x** - Aktif geliştirme dalı
- **v15.x** - Makinalar modülü yeniden yapılandırması
- **v13.x** - Ana dal (main branch)
- **v11.x** - ContEng dokümantasyonu

### Güncelleme Notları
- CNC panel entegrasyonu aktif
- Makinalar modülü modüler yapıya geçti
- Frontend mobil optimizasyonları
- Gerçek zamanlı Socket.IO iyileştirmeleri

---

**Bu indeks ÜRTM Takip projesinin kapsamlı bir genel bakışını sağlar. Daha fazla bilgi için ilgili modül dokümantasyonuna bakın.**

*Son güncelleme: 2026-01-26*
