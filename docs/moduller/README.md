# ÜRTM Takip Sistemi - Modül Dokümantasyonu İndeksi

## 📦 Modül Listesi

Bu klasör, URTMtakip5 projesinin tüm modüllerinin kapsamlı dokümantasyonunu içerir.

---

| # | Modül | Dosya | Açıklama |
|---|-------|-------|----------|
| 1 | İş Emirleri | `01_is_emirleri_modulu.md` | Üretim iş emirlerinin oluşturulması, takibi ve yönetimi |
| 2 | Tezgahlar | `02_tezgahlar_modulu.md` | Makine ve iş istasyonlarının yönetimi, ESP32 entegrasyonu |
| 3 | Üretim Planlama | `03_uretim_plani_modulu.md` | V1 (BOM tabanlı) ve V2 (JSON tabanlı) çift planlama sistemi |
| 4 | BOM Yönetimi | `04_bom_modulu.md` | Bill of Materials - Malzeme listesi yönetimi |
| 5 | Parçalar | `05_parcalar_modulu.md` | Parça katalog, teknik çizimler, QR kod |
| 6 | Stok Kartları | `06_stok_kartlari_modulu.md` | Hammadde ve yarı mamul stok takibi |
| 7 | Sevkiyat | `07_sevkiyat_modulu.md` | Teslimat yönetimi, resim dokümantasyonu |
| 8 | Fason İşler | `08_fason_isler_modulu.md` | Dış kaynak üretim, teklif yönetimi |
| 9 | Arıza-Bakım | `09_ariza_bakim_modulu.md` | Ekipman arıza ve bakım kayıtları |
| 10 | Raporlar | `10_raporlar_modulu.md` | Üretim raporları, performans analizi |
| 11 | Notlar | `11_notlar_modulu.md` | Kategorili not sistemi |
| 12 | Vardiya Yönetimi | `12_vardiya_yonetimi_modulu.md` | Vardiya planlama ve takibi |
| 13 | Makineler | `13_makineler_modulu.md` | Üretim ekipmanları yönetimi |
| 14 | Firma Yönetimi | `14_firma_yonetimi_modulu.md` | Tedarikçi ve müşteri yönetimi |
| 15 | Grup Yönetimi | `15_grup_yonetimi_modulu.md` | Parça ve makina gruplandırma |
| 16 | Siparişler | `16_siparisler_modulu.md` | Makina ve ekipman siparişleri |
| 17 | Faturalar | `17_faturalar_modulu.md` | Alış ve satış faturaları |
| 18 | İrsaliyeler | `18_irsaliyeler_modulu.md` | Mal teslim belgeleri |
| 19 | CNC Link | `19_cnc_link_modulu.md` | ESP32 donanım entegrasyonu |
| 20 | Teknik Çizimler | `20_teknik_cizimler_modulu.md` | CAD dosya yönetimi, OCR |
| 21 | Dizin Tarama | `21_dizin_tarama_modulu.md` | CAD dosya tarama ve eşleştirme |
| 22 | Yedekleme | `22_yedekleme_modulu.md` | Veritabanı ve dosya yedekleme |
| 23 | Import/Export | `23_import_export_modulu.md` | Excel/CSV veri aktarımı |
| 24 | Eşleştirme | `24_eslestirme_modulu.md` | Fatura-Stok eşleştirme |
| 25 | Takvim/Zamanlama | `25_takvim_zamanlama_modulu.md` | Üretim zamanlama, timeline |
| 26 | Uygunsuzluklar | `26_uygunsuzluklar_modulu.md` | Kalite uygunsuzluk yönetimi |
| 27 | Dosya Yükleme | `27_dosya_yukleme_modulu.md` | Dosya depolama ve yönetimi |
| 28 | Tedarik Talepleri | `28_tedarik_talepleri_modulu.md` | Stok tedarik talep yönetimi |
| 29 | Satışlar | `29_satislar_modulu.md` | Makina ve ürün satışları |
| 30 | Tamamlanan İşler | `30_tamamlanan_isler_modulu.md` | Üretim geçmişi kayıtları |
| 31 | İşlem Kayıtları | `31_islem_kayitlari_modulu.md` | Süreç logları ve denetim |
| 32 | Makina İndeks | `32_makina_indeks_modulu.md` | Hiyerarşik veri ve arama |
| 33 | İç Sevkiyatlar | `33_ic_sevkiyatlar_modulu.md` | Şirket içi transferler |
| 34 | Dashboard | `34_dashboard_modulu.md` | KPI paneli, gerçek zamanlı görünüm |
| 35 | CAD Import Client | `35_cad_import_client_modulu.md` | SolidWorks otomasyonu |
| 36 | STEP BOM Analyzer | `36_step_bom_analyzer_modulu.md` | STEP dosya analizi |
| 37 | Context | `37_context_modulu.md` | Proje bağlam ve notlar |
| 38 | PDCA | `38_pdca_modulu.md` | Sürekli iyileştirme döngüsü |
| 39 | n8n Workflows | `39_n8n_workflows_modulu.md` | Otomasyon workflow'ları |
| 40 | ContEng | `40_conteng_modulu.md` | Container deployment |

---

## 📊 İstatistikler

| Kategori | Sayı |
|----------|------|
| **Toplam Modül** | 40 |
| **Ana Modül (API)** | 28 |
| **Yardımcı Modül** | 8 |
| **Entegrasyon Modülü** | 4 |

---

## 📚 Modül Kategorileri

### Üretim Modülleri (1-6)
İş emirleri, tezgahlar, üretim planlama, BOM, parçalar, stok

### Operasyonel Modüller (7-12)
Sevkiyat, fason, arıza-bakım, raporlar, notlar, vardiya

### Yönetim Modülleri (13-18)
Makineler, firma, grup, siparişler, faturalar, irsaliyeler

### Teknik Modüller (19-24)
CNC Link, teknik çizimler, dizin tarama, yedekleme, import/export, eşleştirme

### Planlama Modülleri (25-30)
Takvim, uygunsuzluklar, dosya yükleme, tedarik talepleri, satışlar, tamamlanan işler

### Sistem Modülleri (31-40)
İşlem kayıtları, makina indeks, iç sevkiyatlar, dashboard, CAD tools, context, PDCA, n8n, ContEng

---

## 🔗 İlişki Haritası

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  İş Emirleri │────▶│  Tezgahlar   │────▶│  Arıza-Bakım│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Parçalar    │────▶│   BOM       │────▶│  Stok Kart. │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Üretim Plani│◀────│  Raporlar    │◀────│  Dashboard  │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 📖 Kullanım

Her modül dokümantasyonu şunları içerir:

1. **Genel Bakış** - Modülün amacı ve kapsamı
2. **Veritabanı Tablosu** - İlgili veritabanı yapısı
3. **API Endpointleri** - Tüm HTTP methodları
4. **Temel Fonksiyonlar** - Ana işlevler
5. **Durum Akışları** - State machine diyagramları
6. **Frontend Bileşenleri** - React bileşenleri
7. **Socket.IO Events** - Real-time olaylar
8. **İlişkili Modüller** - Diğer modüllerle bağlantılar
9. **Kullanım Senaryoları** - Örnek kullanım örnekleri
10. **Validasyon ve Hata Kodları** - Güvenlik kuralları
11. **Versiyon Geçmişi** - Değişiklik kayıtları

---

## 🔄 Güncelleme

Modül dokümantasyonlarını güncellerken:

1. İlgili modül dosyasını düzenleyin
2. Versiyon geçmişine kayıt ekleyin
3. Bu indeksi güncelleyin

---

**Son Güncelleme:** 2025-05-01
**Proje Versiyonu:** v14.dev1