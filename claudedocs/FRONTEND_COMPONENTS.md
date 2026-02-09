# ÜRTM Takip - Frontend Component Dokümantasyonu

## 📊 Component Yapısı

Bu dokümantasyon ÜRTM Takip frontend'inin tüm React component'lerini içerir.

**Component Sayısı**: 255+
**Framework**: React 18 + Vite + Material-UI
**State Management**: Redux Toolkit
**Routing**: React Router v6

---

## 📋 İçindekiler

1. [Layout Components](#layout-components)
2. [Common Components](#common-components)
3. [Production Management](#production-management)
4. [Part & Stock Management](#part--stock-management)
5. [Machine & Workstation](#machine--workstation)
6. [Shipment & Logistics](#shipment--logistics)
7. [Invoice & Despatch](#invoice--despatch)
8. [Subcontracting](#subcontracting)
9. [Reporting](#reporting)
10. [System Management](#system-management)
11. [Mobile Components](#mobile-components)
12. [Pages](#pages)

---

## Layout Components

### Layout.jsx
Ana uygulama layout component'i.

```typescript
interface LayoutProps {
  children: React.ReactNode;
}
```

**Features:**
- Navigation menu
- Header with user info
- Responsive sidebar
- Breadcrumb navigation

### MobileLayout.jsx
Mobil cihazlar için özel layout.

```typescript
interface MobileLayoutProps {
  children: React.ReactNode;
}
```

**Features:**
- Bottom navigation
- Swipe gestures
- Pull-to-refresh
- Touch-optimized UI

---

## Common Components

### ImageWithFallback.jsx
Resim yükleme ve fallback mekanizması.

```typescript
interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
}
```

### TouchButton.jsx
Touch optimizasyonlu buton component'i.

```typescript
interface TouchButtonProps extends ButtonProps {
  touchRipple?: boolean;
  hapticFeedback?: boolean;
}
```

### TouchInput.jsx
Touch optimizasyonlu input component'i.

```typescript
interface TouchInputProps extends TextFieldProps {
  autoComplete?: boolean;
  keyboardType?: 'text' | 'numeric' | 'email';
}
```

### TouchCard.jsx
Touch optimizasyonlu kart component'i.

```typescript
interface TouchCardProps extends CardProps {
  onPress?: () => void;
  longPress?: () => void;
}
```

### LockStateIndicator.jsx
Düzenleme kilidi göstergesi.

```typescript
interface LockStateIndicatorProps {
  locked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
}
```

### QRCodeDisplay.jsx
QR kod görüntüleme component'i.

```typescript
interface QRCodeDisplayProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
}
```

---

## Production Management

### IsEmriKarti.jsx
İş emri kartı component'i.

```typescript
interface IsEmriKartiProps {
  isEmri: IsEmri;
  onUpdate?: (isEmri: IsEmri) => void;
  onDelete?: (id: number) => void;
  onDetay?: (id: number) => void;
}
```

**Features:**
- İş emri bilgileri
- Durum badge'i
- Progress bar
- Action buttons
- QR kod

### IsEmriKanbanBoard.jsx
Kanban board görünümü.

```typescript
interface IsEmriKanbanBoardProps {
  filtre?: IsEmriFiltre;
  onUpdate?: (isEmri: IsEmri) => void;
}
```

**Features:**
- Drag & drop
- Sütun bazlı görünüm
- Filtreleme
- Arama

### IsEmriListesi.jsx
İş emirleri listesi component'i.

```typescript
interface IsEmriListesiProps {
  view?: 'list' | 'grid' | 'kanban';
  filtre?: IsEmriFiltre;
}
```

### IsEmriEkleForm.jsx
Yeni iş emri ekleme form'u.

```typescript
interface IsEmriEkleFormProps {
  onSuccess?: (isEmri: IsEmri) => void;
  initialValues?: Partial<IsEmri>;
}
```

### IsEmriDuzenleForm.jsx
İş emri düzenleme form'u.

```typescript
interface IsEmriDuzenleFormProps {
  isEmriId: number;
  onSuccess?: (isEmri: IsEmri) => void;
  onCancel?: () => void;
}
```

### IsEmriOzetFormu.jsx
İş emri özeti form'u.

```typescript
interface IsEmriOzetFormuProps {
  baslangicTarih?: Date;
  bitisTarih?: Date;
  parcaId?: number;
  tezgahId?: number;
}
```

### TezgahKarti.jsx
Tezgah kartı component'i.

```typescript
interface TezgahKartiProps {
  tezgah: Tezgah;
  onUpdateDurum?: (tezgahId: number, durum: string) => void;
}
```

### TezgahKutusu.jsx
Tezgah kutusu component'i (compact).

```typescript
interface TezgahKutusuProps {
  tezgah: Tezgah;
  mevcutIsEmri?: IsEmri;
}
```

### TezgahEkleForm.jsx
Tezgah ekleme form'u.

```typescript
interface TezgahEkleFormProps {
  makinaId?: number;
  onSuccess?: (tezgah: Tezgah) => void;
}
```

### TezgahDuzenleForm.jsx
Tezgah düzenleme form'u.

```typescript
interface TezgahDuzenleFormProps {
  tezgahId: number;
  onSuccess?: (tezgah: Tezgah) => void;
}
```

### TezgahIsleriForm.jsx
Tezgah işleri atama form'u.

```typescript
interface TezgahIsleriFormProps {
  tezgahId: number;
  availableIsEmirleri?: IsEmri[];
}
```

---

## Part & Stock Management

### ParcaKarti.jsx
Parça kartı component'i.

```typescript
interface ParcaKartiProps {
  parca: Parca;
  onUpdate?: (parca: Parca) => void;
  onDelete?: (id: number) => void;
  onDetay?: (id: number) => void;
}
```

### ParcaKartiDuzenleForm.jsx
Parça kartı düzenleme form'u.

```typescript
interface ParcaKartiDuzenleFormProps {
  parcaId: number;
  onSuccess?: (parca: Parca) => void;
}
```

### ParcaDuzenleForm.jsx
Parça düzenleme form'u.

```typescript
interface ParcaDuzenleFormProps {
  parcaId: number;
  onSuccess?: (parca: Parca) => void;
}
```

### ParcaDuzenleFormu.jsx
Alternatif parça düzenleme form'u.

```typescript
interface ParcaDuzenleFormuProps {
  parcaId: number;
  onSuccess?: (parca: Parca) => void;
}
```

### ParcaSecici.jsx
Parça seçici component'i.

```typescript
interface ParcaSeciciProps {
  onSelect?: (parca: Parca) => void;
  filtre?: ParcaFiltre;
  multiple?: boolean;
}
```

### ParcaSecimKarti.jsx
Parça seçim kartı component'i.

```typescript
interface ParcaSecimKartiProps {
  parca: Parca;
  selected?: boolean;
  onSelect?: (parca: Parca) => void;
}
```

### ParcaSecimFormu.jsx
Parça seçim form'u.

```typescript
interface ParcaSecimFormuProps {
  onSelect?: (parca: Parca) => void;
  multiple?: boolean;
}
```

### ParcaKayitKarti.jsx
Parça kayıt kartı component'i.

```typescript
interface ParcaKayitKartiProps {
  kayit: ParcaKaydi;
}
```

### ParcaKayitlariModal.jsx
Parça kayıtları modal'ı.

```typescript
interface ParcaKayitlariModalProps {
  parcaId: number;
  open: boolean;
  onClose: () => void;
}
```

### ParcaBazliIsEmirleriRaporu.jsx
Parça bazlı iş emirleri raporu.

```typescript
interface ParcaBazliIsEmirleriRaporuProps {
  parcaId?: number;
  baslangicTarih?: Date;
  bitisTarih?: Date;
}
```

### ParcaBirlestirmeGecmisi.jsx
Parça birleştirme geçmişi component'i.

```typescript
interface ParcaBirlestirmeGecmisiProps {
  parcaId: number;
}
```

### ParcaBirlesikYonetimi.jsx
Parça birleşik yönetimi component'i.

```typescript
interface ParcaBirlesikYonetimiProps {
  parcalar?: Parca[];
}
```

### ParcaUretimGecmisiModal.jsx
Parça üretim geçmişi modal'ı.

```typescript
interface ParcaUretimGecmisiModalProps {
  parcaId: number;
  open: boolean;
  onClose: () => void;
}
```

### ParcaPerformansDashboard.jsx
Parça performans dashboard'u.

```typescript
interface ParcaPerformansDashboardProps {
  parcaId?: number;
  baslangicTarih?: Date;
  bitisTarih?: Date;
}
```

### StokKartiSecici.jsx
Stok kartı seçici component'i.

```typescript
interface StokKartiSeciciProps {
  onSelect?: (stokKarti: StokKarti) => void;
  filtre?: StokKartiFiltre;
}
```

### StokKartiSecimModal.jsx
Stok kartı seçim modal'ı.

```typescript
interface StokKartiSecimModalProps {
  onSelect?: (stokKarti: StokKarti) => void;
  open: boolean;
  onClose: () => void;
}
```

### KayitEkleModal.jsx
Kayıt ekleme modal'ı.

```typescript
interface KayitEkleModalProps {
  parcaId: number;
  open: boolean;
  onClose: () => void;
  onKayitEklendi?: () => void;
}
```

### BomForm.jsx
BOM form component'i.

```typescript
interface BomFormProps {
  parcaId?: number;
  bomId?: number;
  onSuccess?: (bom: Bom) => void;
}
```

### BomListesi.jsx
BOM listesi component'i.

```typescript
interface BomListesiProps {
  parcaId: number;
  onBomSec?: (bom: Bom) => void;
}
```

### BomPrintModal.jsx
BOM yazdırma modal'ı.

```typescript
interface BomPrintModalProps {
  bomId: number;
  open: boolean;
  onClose: () => void;
}
```

### BomAnalyzeForm.jsx
BOM analiz form'u.

```typescript
interface BomAnalyzeFormProps {
  onAnaliz?: (sonuc: BomAnalizSonuc) => void;
}
```

---

## Machine & Workstation

### MakinaListesi.jsx
Makina listesi component'i.

```typescript
interface MakinaListesiProps {
  filtre?: MakinaFiltre;
  onSelect?: (makina: Makina) => void;
}
```

### MakinaForm.jsx
Makina form component'i.

```typescript
interface MakinaFormProps {
  makinaId?: number;
  onSuccess?: (makina: Makina) => void;
}
```

### TezgahRaporuModal.jsx
Tezgah raporu modal'ı.

```typescript
interface TezgahRaporuModalProps {
  tezgahId?: number;
  baslangicTarih?: Date;
  bitisTarih?: Date;
  open: boolean;
  onClose: () => void;
}
```

### TezgahZamanCizelgesi.jsx
Tezgah zaman çizelgesi component'i.

```typescript
interface TezgahZamanCizelgesiProps {
  tezgahId?: number;
  baslangicTarih?: Date;
  bitisTarih?: Date;
}
```

### TezgahPerformansDashboard.jsx
Tezgah performans dashboard'u.

```typescript
interface TezgahPerformansDashboardProps {
  tezgahId?: number;
  baslangicTarih?: Date;
  bitisTarih?: Date;
}
```

### TezgahIsEmriKarti.jsx
Tezgah iş emri kartı component'i.

```typescript
interface TezgahIsEmriKartiProps {
  isEmri: IsEmri;
  tezgah: Tezgah;
  onUpdate?: () => void;
}
```

---

## Shipment & Logistics

### SevkiyatListesi.jsx
Sevkiyat listesi component'i.

```typescript
interface SevkiyatListesiProps {
  filtre?: SevkiyatFiltre;
  onSelect?: (sevkiyat: Sevkiyat) => void;
}
```

### SevkiyatForm.jsx
Sevkiyat form component'i.

```typescript
interface SevkiyatFormProps {
  sevkiyatId?: number;
  onSuccess?: (sevkiyat: Sevkiyat) => void;
}
```

### SevkiyatResimModal.jsx
Sevkiyat resim modal'ı.

```typescript
interface SevkiyatResimModalProps {
  sevkiyatId: number;
  open: boolean;
  onClose: () => void;
}
```

### SevkiyatTeslimAlModal.jsx
Sevkiyat teslim alma modal'ı.

```typescript
interface SevkiyatTeslimAlModalProps {
  sevkiyatId: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### SevkiyatKalemleriModal.jsx
Sevkiyat kalemleri modal'ı.

```typescript
interface SevkiyatKalemleriModalProps {
  sevkiyatId: number;
  open: boolean;
  onClose: () => void;
}
```

### TopluSevkiyatForm.jsx
Toplu sevkiyat form'u.

```typescript
interface TopluSevkiyatFormProps {
  isEmriIds?: number[];
  onSuccess?: () => void;
}
```

---

## Invoice & Despatch

### FaturaForm.jsx
Fatura form component'i.

```typescript
interface FaturaFormProps {
  faturaId?: number;
  onSuccess?: (fatura: Fatura) => void;
  mode?: 'create' | 'edit' | 'view';
}
```

**Features:**
- Fatura bilgileri
- Kalem ekleme/düzenleme
- İrsaliye eşleştirme
- PDF export

### IrsaliyeForm.jsx (Desktop)
İrsaliye form component'i (desktop).

```typescript
interface IrsaliyeFormProps {
  irsaliyeId?: number;
  onSuccess?: (irsaliye: Irsaliye) => void;
}
```

### IrsaliyeKalemMobile.jsx
İrsaliye kalem component'i (mobile).

```typescript
interface IrsaliyeKalemMobileProps {
  kalem: IrsaliyeKalem;
  onUpdate?: (kalem: IrsaliyeKalem) => void;
  onDelete?: (id: number) => void;
}
```

### SevkiyatResimModalMobile.jsx
Sevkiyat resim modal'ı (mobile).

```typescript
interface SevkiyatResimModalMobileProps {
  sevkiyatId: number;
  open: boolean;
  onClose: () => void;
}
```

---

## Subcontracting

### FasonConfirmDialog.jsx
Fason onay dialog component'i.

```typescript
interface FasonConfirmDialogProps {
  fasonId: number;
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}
```

### FasonTeslimDialog.jsx
Fason teslim dialog component'i.

```typescript
interface FasonTeslimDialogProps {
  fasonId: number;
  open: boolean;
  onClose: () => void;
  onTeslim?: () => void;
}
```

### FaturaForm.jsx
Fatura form component'i.

```typescript
interface FaturaFormProps {
  faturaId?: number;
  onSuccess?: (fatura: Fatura) => void;
}
```

---

## Reporting

### Dashboard.jsx
Ana dashboard component'i.

```typescript
interface DashboardProps {
  refreshInterval?: number;
}
```

**Features:**
- Özet istatistikler
- Aktif iş emirleri
- Kritik stoklar
- Son işlemler
- Grafikler

### IsEmriOzetDashboard.jsx
İş emri özet dashboard'u.

```typescript
interface IsEmriOzetDashboardProps {
  baslangicTarih?: Date;
  bitisTarih?: Date;
  parcaId?: number;
  tezgahId?: number;
}
```

### PlanlamaGerceklesmeDashboard.jsx
Planlama gerçekleşme dashboard'u.

```typescript
interface PlanlamaGerceklesmeDashboardProps {
  baslangicTarih?: Date;
  bitisTarih?: Date;
}
```

### TamamlananIsEmirleriRaporu.jsx
Tamamlanan iş emirleri raporu.

```typescript
interface TamamlananIsEmirleriRaporuProps {
  baslangicTarih?: Date;
  bitisTarih?: Date;
}
```

### UygunsuzlukRaporuFormu.jsx
Uygunsuzluk raporu form'u.

```typescript
interface UygunsuzlukRaporuFormuProps {
  onRaporOlustur?: (rapor: Rapor) => void;
}
```

---

## System Management

### FirmaYonetimModal.jsx
Firma yönetim modal'ı.

```typescript
interface FirmaYonetimModalProps {
  open: boolean;
  onClose: () => void;
}
```

### FirmaEkleModal.jsx
Firma ekleme modal'ı.

```typescript
interface FirmaEkleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (firma: Firma) => void;
}
```

### GrupListesi.jsx
Grup listesi component'i.

```typescript
interface GrupListesiProps {
  onSelect?: (grup: Grup) => void;
}
```

### GrupEkleForm.jsx
Grup ekleme form'u.

```typescript
interface GrupEkleFormProps {
  onSuccess?: (grup: Grup) => void;
}
```

### LokasyonEkleModal.jsx
Lokasyon ekleme modal'ı.

```typescript
interface LokasyonEkleModalProps {
  open: boolean;
  onClose: () => void;
}
```

### LokasyonYonetimModal.jsx
Lokasyon yönetim modal'ı.

```typescript
interface LokasyonYonetimModalProps {
  open: boolean;
  onClose: () => void;
}
```

### NotEkleme.jsx
Not ekleme component'i.

```typescript
interface NotEklemeProps {
  entityType: string;
  entityId: number;
  onNotEklendi?: (not: Not) => void;
}
```

### NotKarti.jsx
Not kartı component'i.

```typescript
interface NotKartiProps {
  not: Not;
  onDuzenle?: (not: Not) => void;
  onSil?: (id: number) => void;
}
```

### NotDuzenle.jsx
Not düzenleme component'i.

```typescript
interface NotDuzenleProps {
  notId: number;
  onSuccess?: (not: Not) => void;
}
```

### FiltrePaneli.jsx
Filtre paneli component'i.

```typescript
interface FiltrePaneliProps {
  filtre: Filtre;
  onFiltreDegisti?: (filtre: Filtre) => void;
}
```

### MetinSecimPaneli.jsx
Metin seçim paneli component'i.

```typescript
interface MetinSecimPaneliProps {
  metinler?: string[];
  onSelect?: (metin: string) => void;
}
```

### AdayMetinKartlari.jsx
Aday metin kartları component'i.

```typescript
interface AdayMetinKartlariProps {
  metinler: string[];
  onSelect?: (metin: string) => void;
}
```

### ViewSwitcher.jsx
Görünüm değiştirici component'i.

```typescript
interface ViewSwitcherProps {
  view: 'list' | 'grid' | 'kanban';
  onViewChange?: (view: string) => void;
}
```

### SiparisDokumanlariModal.jsx
Sipariş dokümanları modal'ı.

```typescript
interface SiparisDokumanlariModalProps {
  siparisId: number;
  open: boolean;
  onClose: () => void;
}
```

### BackupYonetimi.jsx
Yedek yönetimi component'i.

```typescript
interface BackupYonetimiProps {
  onBackup?: () => void;
  onRestore?: (backupId: string) => void;
}
```

### ImportExport.jsx
Import/export component'i.

```typescript
interface ImportExportProps {
  onImport?: (data: any) => void;
  onExport?: () => void;
}
```

---

## Makindex (Hiyerarşik Parça Sistemi)

### MakindexPage.jsx
Makindex ana sayfa component'i.

```typescript
interface MakindexPageProps {
  rootId?: number;
}
```

### MakindexTreeView.jsx
Makindex tree view component'i.

```typescript
interface MakindexTreeViewProps {
  rootId?: number;
  onSelect?: (node: MakinaSinifi) => void;
  expanded?: boolean;
}
```

### VirtualizedTreeView.jsx
Virtualized tree view component'i.

```typescript
interface VirtualizedTreeViewProps {
  nodes: TreeNode[];
  onSelect?: (node: TreeNode) => void;
}
```

### MakinaNode.jsx
Makina node component'i.

```typescript
interface MakinaNodeProps {
  makina: Makina;
  level: number;
  onSelect?: (makina: Makina) => void;
}
```

### ParcaNode.jsx
Parça node component'i.

```typescript
interface ParcaNodeProps {
  parca: Parca;
  level: number;
  onSelect?: (parca: Parca) => void;
}
```

### BomNode.jsx
BOM node component'i.

```typescript
interface BomNodeProps {
  bom: Bom;
  level: number;
  onSelect?: (bom: Bom) => void;
}
```

### GrupNode.jsx
Grup node component'i.

```typescript
interface GrupNodeProps {
  grup: Grup;
  level: number;
  onSelect?: (grup: Grup) => void;
}
```

### MakinaSinifiNode.jsx
Makina sınıfı node component'i.

```typescript
interface MakinaSinifiNodeProps {
  sinif: MakinaSinifi;
  level: number;
  expanded?: boolean;
  onToggle?: () => void;
  onSelect?: (sinif: MakinaSinifi) => void;
}
```

### MakinaSinifManager.jsx
Makina sınıfı yöneticisi component'i.

```typescript
interface MakinaSinifManagerProps {
  parentId?: number;
  onSinifEklendi?: (sinif: MakinaSinifi) => void;
}
```

### MakindexSearch.jsx
Makindex arama component'i.

```typescript
interface MakindexSearchProps {
  onSonucSec?: (sonuc: AramaSonuc) => void;
}
```

### ParcaDetayCard.jsx
Parça detay kartı component'i.

```typescript
interface ParcaDetayCardProps {
  parcaId: number;
}
```

---

## Production Planning

### UretimPlaniForm.jsx
Üretim planı form component'i.

```typescript
interface UretimPlaniFormProps {
  uretimPlaniId?: number;
  onSuccess?: (uretimPlani: UretimPlani) => void;
}
```

### UretimPlaniListesi.jsx
Üretim planı listesi component'i.

```typescript
interface UretimPlaniListesiProps {
  onSelect?: (uretimPlani: UretimPlani) => void;
}
```

### UretimPlaniDetay.jsx
Üretim planı detay component'i.

```typescript
interface UretimPlaniDetayProps {
  uretimPlaniId: number;
}
```

### UretimPlaniIsEmriSecimiModal.jsx
İş emri seçim modal'ı.

```typescript
interface UretimPlaniIsEmriSecimiModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (isEmirleri: IsEmri[]) => void;
}
```

### ExcelUretimPlaniModal.jsx
Excel üretim planı modal'ı.

```typescript
interface ExcelUretimPlaniModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### ExcelIsEmriParametreleriForm.jsx
Excel iş emri parametreleri form'u.

```typescript
interface ExcelIsEmriParametreleriFormProps {
  onParametreler?: (params: any) => void;
}
```

### ExcelParcaOlusturModal.jsx
Excel parça oluştur modal'ı.

```typescript
interface ExcelParcaOlusturModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### UretimPlaniFasonSecimiModal.jsx
Fason seçim modal'ı.

```typescript
interface UretimPlaniFasonSecimiModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (fason: Fason) => void;
}
```

### KarmaUretimPlaniForm.jsx
Karma üretim planı form'u.

```typescript
interface KarmaUretimPlaniFormProps {
  onSuccess?: (uretimPlani: UretimPlani) => void;
}
```

### ParcaDetayModal.jsx
Parça detay modal'ı.

```typescript
interface ParcaDetayModalProps {
  parcaId: number;
  open: boolean;
  onClose: () => void;
}
```

### MakinaGroupPartsList.jsx
Makina grup-parça listesi.

```typescript
interface MakinaGroupPartsListProps {
  makinaId: number;
}
```

### MakinaGroupPartsPage.jsx
Makina grup-parça sayfası.

```typescript
interface MakinaGroupPartsPageProps {
  makinaId?: number;
}
```

### TeklifExcelImport.jsx
Teklif Excel import component'i.

```typescript
interface TeklifExcelImportProps {
  onImport?: (teklifler: Teklif[]) => void;
}
```

### TeklifImportModal.jsx
Teklif import modal'ı.

```typescript
interface TeklifImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

---

## Workstation Scheduler

### WorkstationScheduler.jsx
Workstation scheduler component'i.

```typescript
interface WorkstationSchedulerProps {
  tezgahlar?: Tezgah[];
  isEmirleri?: IsEmri[];
  onUpdate?: () => void;
}
```

### WorkstationRow.jsx
Workstation row component'i.

```typescript
interface WorkstationRowProps {
  tezgah: Tezgah;
  tasks?: Task[];
  onTaskAssign?: (task: Task) => void;
}
```

### TaskCard.jsx
Task kartı component'i.

```typescript
interface TaskCardProps {
  task: Task;
  onUpdate?: (task: Task) => void;
}
```

### ScheduleTaskForm.jsx
Schedule task form component'i.

```typescript
interface ScheduleTaskFormProps {
  tezgahId: number;
  isEmriId?: number;
  onSuccess?: (task: Task) => void;
}
```

### AdvancedFilters.jsx
Gelişmiş filtreler component'i.

```typescript
interface AdvancedFiltersProps {
  onFiltre?: (filtre: TaskFiltre) => void;
}
```

### ConflictDetector.jsx
Çakışma dedektörü component'i.

```typescript
interface ConflictDetectorProps {
  tasks: Task[];
  onConflict?: (conflicts: Conflict[]) => void;
}
```

---

## Vardiya Yönetimi

### VardiyaYonetimiAna.jsx
Vardiya yönetimi ana component'i.

```typescript
interface VardiyaYonetimiAnaProps {
  seciliTab?: string;
}
```

### VardiyaListesi.jsx
Vardiya listesi component'i.

```typescript
interface VardiyaListesiProps {
  onSelect?: (vardiya: Vardiya) => void;
}
```

### VardiyaYonetimi.jsx
Vardiya yönetimi component'i.

```typescript
interface VardiyaYonetimiProps {
  vardiyaId?: number;
  onSuccess?: () => void;
}
```

### VardiyaTakvimi.jsx
Vardiya takvimi component'i.

```typescript
interface VardiyaTakvimiProps {
  yil?: number;
  ay?: number;
}
```

### VardiyaRaporlari.jsx
Vardiya raporları component'i.

```typescript
interface VardiyaRaporlariProps {
  baslangicTarih?: Date;
  bitisTarih?: Date;
}
```

### PersonelListesi.jsx
Personel listesi component'i.

```typescript
interface PersonelListesiProps {
  onSelect?: (personel: Personel) => void;
}
```

### PersonelYonetimi.jsx
Personel yönetimi component'i.

```typescript
interface PersonelYonetimiProps {
  personelId?: number;
  onSuccess?: () => void;
}
```

---

## Raporlar

### UretimRaporlari.jsx
Üretim raporları component'i.

```typescript
interface UretimRaporlariProps {
  raporTip?: 'detay' | 'ozet';
}
```

### OzelRaporlar.jsx
Özel raporlar component'i.

```typescript
interface OzelRaporlarProps {
  onRaporOlustur?: (rapor: Rapor) => void;
}
```

### VardiyaTezgahRaporu.jsx
Vardiya tezgah raporu component'i.

```typescript
interface VardiyaTezgahRaporuProps {
  vardiyaId: number;
  tezgahId?: number;
}
```

### TezgahCalismaTablosu.jsx
Tezgah çalışma tablosu component'i.

```typescript
interface TezgahCalismaTablosuProps {
  baslangicTarih?: Date;
  bitisTarih?: Date;
}
```

### UretimIstatistikleri.jsx
Üretim istatistikleri component'i.

```typescript
interface UretimIstatistikleriProps {
  baslangicTarih?: Date;
  bitisTarih?: Date;
}
```

---

## Timeline

### TimelineGanttChart.jsx
Timeline Gantt chart component'i.

```typescript
interface TimelineGanttChartProps {
  events: TimelineEvent[];
  baslangicTarih?: Date;
  bitisTarih?: Date;
  onUpdate?: (event: TimelineEvent) => void;
}
```

### TaskContextMenu.jsx
Task context menu component'i.

```typescript
interface TaskContextMenuProps {
  task: Task;
  onAction?: (action: string) => void;
}
```

---

## Teknik Resim

### TeknikResimViewer.jsx
Teknik resim görüntüleyici component'i.

```typescript
interface TeknikResimViewerProps {
  resimId: number;
  parcaId?: number;
}
```

### TeknikResimAnalizi.jsx
Teknik resim analizi component'i.

```typescript
interface TeknikResimAnaliziProps {
  resimId: number;
}
```

### TeknikResimCameraModal.jsx
Teknik resim kamera modal'ı.

```typescript
interface TeknikResimCameraModalProps {
  open: boolean;
  onClose: () => void;
  onPhoto?: (photo: string) => void;
}
```

---

## Stok Kartları

### StokKartiForm.jsx
Stok kartı form component'i.

```typescript
interface StokKartiFormProps {
  stokKartiId?: number;
  onSuccess?: (stokKarti: StokKarti) => void;
}
```

### StokKartlari.jsx (List)
Stok kartları listesi component'i.

```typescript
interface StokKartlariProps {
  filtre?: StokKartiFiltre;
  onSelect?: (stokKarti: StokKarti) => void;
}
```

### StokTakipListeleriYonetModal.jsx
Stok takip listeleri yönetim modal'ı.

```typescript
interface StokTakipListeleriYonetModalProps {
  open: boolean;
  onClose: () => void;
}
```

### StokTakipListesiModal.jsx
Stok takip listesi modal'ı.

```typescript
interface StokTakipListesiModalProps {
  listeId: number;
  open: boolean;
  onClose: () => void;
}
```

### ParcaTakipListeleriYonetModal.jsx
Parça takip listeleri yönetim modal'ı.

```typescript
interface ParcaTakipListeleriYonetModalProps {
  open: boolean;
  onClose: () => void;
}
```

### ParcaTakipListesiModal.jsx
Parça takip listesi modal'ı.

```typescript
interface ParcaTakipListesiModalProps {
  listeId: number;
  open: boolean;
  onClose: () => void;
}
```

### ParcaTakipSecimModal.jsx
Parça takip seçim modal'ı.

```typescript
interface ParcaTakipSecimModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (liste: ParcaTakipListesi) => void;
}
```

---

## Tedarik Yönetimi

### TedarikTalepForm.jsx
Tedarik talep form component'i.

```typescript
interface TedarikTalepFormProps {
  talepId?: number;
  onSuccess?: (talep: TedarikTalebi) => void;
}
```

### TedarikTalepListesi.jsx
Tedarik talep listesi component'i.

```typescript
interface TedarikTalepListesiProps {
  filtre?: TedarikFiltre;
  onSelect?: (talep: TedarikTalebi) => void;
}
```

### TedarikTalepDetay.jsx
Tedarik talep detay component'i.

```typescript
interface TedarikTalepDetayProps {
  talepId: number;
}
```

### FirmaYonetimPage.jsx
Firma yönetim sayfası component'i.

```typescript
interface FirmaYonetimPageProps {
  firmaId?: number;
}
```

### FirmaEkleModal.jsx (Mobile)
Firma ekleme modal'ı (mobile).

```typescript
interface FirmaEkleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (firma: Firma) => void;
}
```

### FirmaYonetimMobilModal.jsx
Firma yönetim modal'ı (mobile).

```typescript
interface FirmaYonetimMobilModalProps {
  open: boolean;
  onClose: () => void;
}
```

### FirmaSecimModal.jsx
Firma seçim modal'ı.

```typescript
interface FirmaSecimModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (firma: Firma) => void;
}
```

### FirmaDetayModal.jsx
Firma detay modal'ı.

```typescript
interface FirmaDetayModalProps {
  firmaId: number;
  open: boolean;
  onClose: () => void;
}
```

### OnayModal.jsx
Onay modal component'i.

```typescript
interface OnayModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  baslik?: string;
  mesaj?: string;
}
```

---

## Ham Malzeme

### HamMalzemeGonderimDialog.jsx
Ham malzeme gönderim dialog component'i.

```typescript
interface HamMalzemeGonderimDialogProps {
  isEmriId: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### HamMalzemeBilgiDialog.jsx
Ham malzeme bilgi dialog component'i.

```typescript
interface HamMalzemeBilgiDialogProps {
  isEmriId: number;
  open: boolean;
  onClose: () => void;
}
```

### HamMalzemeTeslimDialog.jsx
Ham malzeme teslim dialog component'i.

```typescript
interface HamMalzemeTeslimDialogProps {
  isEmriId: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

---

## Notlar Sistemi

### NotlarPage.jsx
Notlar sayfası component'i.

```typescript
interface NotlarPageProps {
  kategoriId?: number;
}
```

### NotlarListesi.jsx
Notlar listesi component'i.

```typescript
interface NotlarListesiProps {
  filtre?: NotFiltre;
  onSelect?: (not: Not) => void;
}
```

### KategoriYonetimi.jsx
Kategori yönetimi component'i.

```typescript
interface KategoriYonetimiProps {
  onSuccess?: () => void;
}
```

---

## Diğer Component'ler

### YeniIsSecimiModali.jsx
Yeni iş seçimi modal'ı.

```typescript
interface YeniIsSecimiModaliProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (isler: IsEmri[]) => void;
}
```

### IsEmriDurumYonetimi.jsx
İş emri durum yönetimi component'i.

```typescript
interface IsEmriDurumYonetimiProps {
  isEmriId?: number;
}
```

### DizinTarama.jsx
Dizin tarama component'i.

```typescript
interface DizinTaramaProps {
  onStart?: (job: ImportJob) => void;
}
```

### CameraCapture.jsx
Kamera yakalama component'i.

```typescript
interface CameraCaptureProps {
  onCapture?: (photo: string) => void;
}
```

### FullScreenImageModal.jsx
Tam ekran resim modal'ı.

```typescript
interface FullScreenImageModalProps {
  src: string;
  open: boolean;
  onClose: () => void;
}
```

### UretimZamanCizelgesi.jsx
Üretim zaman çizelgesi component'i.

```typescript
interface UretimZamanCizelgesiProps {
  baslangicTarih?: Date;
  bitisTarih?: Date;
}
```

### UretimPlaniEklemeModal.jsx
Üretim planı ekleme modal'ı.

```typescript
interface UretimPlaniEklemeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### IsEmriFiltreleMobile.jsx
İş emri filtreleme (mobile).

```typescript
interface IsEmriFiltreleMobileProps {
  onFiltre?: (filtre: IsEmriFiltre) => void;
}
```

### IsEmriSecimiModalMobile.jsx
İş emri seçim modal'ı (mobile).

```typescript
interface IsEmriSecimiModalMobileProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (isEmri: IsEmri) => void;
}
```

### FasonSecimiModalMobile.jsx
Fason seçim modal'ı (mobile).

```typescript
interface FasonSecimiModalMobileProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (fason: Fason) => void;
}
```

### UretimPlaniFiltreleMobile.jsx
Üretim planı filtreleme (mobile).

```typescript
interface UretimPlaniFiltreleMobileProps {
  onFiltre?: (filtre: UretimPlaniFiltre) => void;
}
```

### ArizaBakimEkleMobilModal.jsx
Arıza/bakım ekleme modal'ı (mobile).

```typescript
interface ArizaBakimEkleMobilModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### LokasyonEkleMobilModal.jsx
Lokasyon ekleme modal'ı (mobile).

```typescript
interface LokasyonEkleMobilModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (lokasyon: Lokasyon) => void;
}
```

### LokasyonYonetimMobilModal.jsx
Lokasyon yönetim modal'ı (mobile).

```typescript
interface LokasyonYonetimMobilModalProps {
  open: boolean;
  onClose: () => void;
}
```

### MobilStokKartiSecici.jsx
Mobil stok kartı seçici.

```typescript
interface MobilStokKartiSeciciProps {
  onSelect?: (stokKarti: StokKarti) => void;
}
```

### MobilParcaSecici.jsx
Mobil parça seçici.

```typescript
interface MobilParcaSeciciProps {
  onSelect?: (parca: Parca) => void;
  multiple?: boolean;
}
```

---

## Pages

Sayfa component'leri `frontend/src/pages/` dizininde bulunur.

### Desktop Pages
- `Dashboard.jsx` - Ana dashboard
- `IsEmirleri.jsx` - İş emirleri sayfası
- `Parcalar.jsx` - Parçalar sayfası
- `Makinalar.jsx` - Makinalar sayfası
- `Tezgahlar.jsx` - Tezgahlar sayfası
- `UretimPlani.jsx` - Üretim planı sayfası
- `UretimPlanlariV2.jsx` - Üretim planları V2 sayfası
- `UretimPlaniV2Form.jsx` - Üretim planı V2 form sayfası
- `UretimPlaniV2Detay.jsx` - Üretim planı V2 detay sayfası
- `Faturalar.jsx` - Faturalar sayfası
- `FaturaDetay.jsx` - Fatura detay sayfası
- `Boms.jsx` - BOM'lar sayfası
- `StokKartlari.jsx` - Stok kartları sayfası
- `Fason.jsx` - Fason sayfası
- `FasonGruplar.jsx` - Fason gruplar sayfası
- `Sevkiyat.jsx` - Sevkiyat sayfası
- `IcSevkiyatlar.jsx` - İç sevkiyatlar sayfası
- `TopluSevkiyatForm.jsx` - Toplu sevkiyat form sayfası
- `Raporlar.jsx` - Raporlar sayfası
- `BackupYonetimi.jsx` - Yedek yönetimi sayfası
- `ImportExport.jsx` - Import/export sayfası
- `Gruplar.jsx` - Gruplar sayfası
- `Teklifler.jsx` - Teklifler sayfası
- `TezgahIsPlanı.jsx` - Tezgah iş planı sayfası
- `UretimPanosu.jsx` - Üretim panosu sayfası
- `EslestirmeDesktop.jsx` - Eşleştirme desktop sayfası

### Mobile Pages
`frontend/src/pages/mobile/`:
- `DashboardMobile.jsx` - Mobil dashboard
- `IsEmirleriMobileYeni.jsx` - Mobil iş emirleri
- `ParcalarMobile.jsx` - Mobil parçalar
- `StokKartlariMobile.jsx` - Mobil stok kartları
- `TezgahlarMobile.jsx` - Mobil tezgahlar
- `UretimPlaniMobile.jsx` - Mobil üretim planı
- `UretimPlaniEkleMobile.jsx` - Mobil üretim planı ekle
- `UretimPlaniDuzenleMobile.jsx` - Mobil üretim planı düzenle
- `UretimPlaniDetayMobile.jsx` - Mobil üretim planı detay
- `SevkiyatListesiMobile.jsx` - Mobil sevkiyat listesi
- `IrsaliyelerMobile.jsx` - Mobil irsaliyeler
- `IrsaliyeFormMobile.jsx` - Mobil irsaliye form
- `IrsaliyeDetayMobile.jsx` - Mobil irsaliye detay
- `ArizaBakimMobile.jsx` - Mobil arıza/bakım
- `ArizaBakimDetayMobile.jsx` - Mobil arıza/bakım detay
- `GruplarMobile.jsx` - Mobil gruplar
- `GrupFormMobile.jsx` - Mobil grup form
- `GrupDetayMobile.jsx` - Mobil grup detay
- `MakindexPage.jsx` - Mobil Makindex

### Arıza/Bakım Pages
`frontend/src/pages/ArizaBakim/`:
- `ArizaBakimListesi.jsx` - Arıza/bakım listesi
- `ArizaBakimEkle.jsx` - Arıza/bakım ekle
- `ArizaBakimDetay.jsx` - Arıza/bakım detay

### Raporlar Pages
`frontend/src/pages/Raporlar/`:
- `UretimRaporlari.jsx` - Üretim raporları
- `OzelRaporlar.jsx` - Özel raporlar
- `ParcaPerformansRaporu.jsx` - Parça performans raporu
- `IsEmriDetayRaporu.jsx` - İş emri detay raporu

### Yönetimsel Pages
`frontend/src/pages/yonetimsel/`:
- `Yonetimsel.jsx` - Yönetimsel ana sayfa
- `ParcaImport.jsx` - Parça import
- `ExceldenBomUret.jsx` - Excel'den BOM üret

---

## Custom Hooks

### useDeviceDetect
Cihaz tespit hook'u.

```typescript
const { isMobile, isTablet, isDesktop } = useDeviceDetect();
```

### useDeviceOverride
Cihaz override hook'u.

```typescript
const { device, setDevice } = useDeviceOverride();
```

### useStokKartlari
Stok kartları hook'u.

```typescript
const { stokKartlari, loading, error, refresh } = useStokKartlari(filtre);
```

### usePullToRefresh
Pull-to-refresh hook'u.

```typescript
const { isRefreshing, onRefresh } = usePullToRefresh(refreshFunction);
```

---

## Redux Slices

### isEmirleriSlice
İş emirleri state management.

### uretimPlaniSlice
Üretim planı state management.

### arizaBakimSlice
Arıza/bakım state management.

### schedulerSlice
Scheduler state management.

### timelineSlice
Timeline state management.

### makindexSlice
Makindex state management.

---

## Services

### api.js
Ana API client.

### faturaIrsaliyeSocket.js
Fatura-İrsaliye socket service.

### notlarService.js
Notlar service.

### schedulerService.js
Scheduler service.

### stokKartlariService.js
Stok kartları service.

### stokTakipListeleriService.js
Stok takip listeleri service.

### parcaTakipListeleriService.js
Parça takip listeleri service.

### teknikResimService.js
Teknik resim service.

### tedarikService.js
Tedarik service.

### uretimPlanlariV2.js
Üretim planları V2 service.

---

*Son güncelleme: 2024-12-24 | Frontend Versiyon: v14.dev1*
