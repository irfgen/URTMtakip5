# 3. ÜRETİM PLANLAMA (Production Planning) Modülü

## Genel Bakış

Üretim Planlama modülü, BOM tabanlı karmaşık planlama (V1) ve JSON tabanlı basit planlama (V2) olmak üzere iki ayrı sistem sunar.

**Route Dosyaları:**
- V1: `backend/src/routes/uretimPlaniRoutes.js`
- V2: `backend/src/routes/uretimPlanlariRoutes.js`

**Controller Dosyaları:**
- V1: `backend/src/controllers/uretimPlaniController.js`
- V2: `backend/src/controllers/uretimPlanlariController.js`

**Frontend Sayfaları:**
- V1: `frontend/src/pages/UretimPlani.jsx`
- V2: `frontend/src/pages/UretimPlanlariV2.jsx`

---

## Modül Amacı

- Üretim planlarının oluşturulması
- İş emirlerinin organize edilmesi
- BOM tabanlı malzeme planlaması
- Kapasite planlaması
- Kritik stok analizi
- Excel import/export

---

## Sistem Mimarisi

```
┌─────────────────────────────────────┐
│       ÜRETİM PLANLAMA SİSTEMİ       │
├─────────────┬───────────────────────┤
│   V1       │        V2             │
│  (BOM)     │      (JSON)           │
├─────────────┼───────────────────────┤
│  Kompleks   │     Basit             │
│  BOM bazlı  │   İş emri listesi     │
│  Excel dest │   Hızlı oluşturma     │
└─────────────┴───────────────────────┘
```

---

## V1 SİSTEMİ (BOM Tabanlı)

### Veritabanı Tablosu

**Ana Tablo:** `uretim_plani`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| plan_adi | STRING | Plan adı |
| plan_turu | STRING | makine_bazli, ozel_liste, karma |
| makina_id | INTEGER | İlişkili makina (nullable) |
| tarih | DATE | Plan tarihi |
| durum | STRING | taslak, aktif, tamamlandi, iptal |
| toplam_parca | INTEGER | Toplam parça sayısı |
| toplam_adet | INTEGER | Toplam üretilecek adet |
| created_at | DATETIME | Oluşturulma tarihi |

**Kalemler Tablosu:** `uretim_plani_kalemleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| uretim_plani_id | INTEGER | Üretim planı ID |
| parca_kodu | STRING | Parça kodu |
| adet | INTEGER | Üretilecek adet |
| siralama | INTEGER | Sıralama |
| durum | STRING | beklemede, uretimde, tamamlandi |

### API Endpointleri

#### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm üretim planlarını listele |
| `GET /:id` | Plan detayı |
| `GET /:id/kalemler` | Plan kalemleri |
| `GET /by-makina/:makinaId` | Makinaya ait planlar |
| `GET /by-tarih/:tarih` | Tarihe ait planlar |

#### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni plan oluştur |
| `POST /:id/kalemler` | Kalem ekle |
| `POST /excel-import` | Excel'den import |
| `POST /bom-analizi` | BOM analizi yap |
| `POST /create-from-plan` | Plandan iş emri oluştur |
| `POST /is-emri-tabanli` | İş emri tabanlı plan oluştur |
| `POST /karma` | Karma plan oluştur |
| `POST /copy-plan` | Planı kopyala |

#### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Plan güncelle |
| `PUT /:id/kalemler` | Kalemleri güncelle |
| `PUT /:id/kalemler/:kalemId` | Kalem güncelle |
| `PUT /:id/siralama` | Sıralama güncelle |
| `PUT /:id/durum` | Plan durumu güncelle |

#### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Plan sil |
| `DELETE /:id/kalemler/:kalemId` | Kalem sil |
| `DELETE /:id/is-emri/:isEmriId` | İş emri çıkar |

### Plan Türleri

| Tür | Açıklama |
|-----|----------|
| makine_bazli | Belirli bir makina için plan |
| ozel_liste | Özel parça listesi ile plan |
| karma | Hem makine hem özel liste |

### Durumlar

| Durum | Açıklama |
|-------|----------|
| taslak | Oluşturuldu, henüz aktif değil |
| aktif | Aktif üretim planı |
| tamamlandi | Plan tamamlandı |
| iptal | Plan iptal edildi |

---

## V2 SİSTEMİ (JSON Tabanlı)

### Veritabanı Tablosu

**Ana Tablo:** `uretim_planlari`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| ad | STRING | Plan adı |
| tarih | DATE | Plan tarihi |
| durum | STRING | aktif, tamamlandi, iptal |
| data | JSON | İş emri listesi JSON |
| created_at | DATETIME | Oluşturulma tarihi |

### API Endpointleri

#### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm V2 planlarını listele |
| `GET /:id` | Plan detayı |
| `GET /by-uretim-plani/:uretimPlaniId` | V1'e bağlı planlar |

#### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni V2 planı oluştur |
| `POST /from-v1/:uretimPlaniId` | V1'den V2 oluştur |

#### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Plan güncelle |
| `PUT /:id/durum` | Durum güncelle |

#### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Plan sil |

---

## Temel Fonksiyonlar

### 1. uretimPlaniOlustur(planaData)
Yeni üretim planı oluşturur.
- Plan türüne göre farklı işlemler
- Kalemleri ekler
- BOM analizi yapar

### 2. kalemEkle(planiId, kalemData)
Plana yeni kalem ekler.
- Parça kodu kontrolü
- Sıralama ataması

### 3. excelImport(file)
Excel dosyasından plan import eder.
- XLSX dosyasını parse eder
- Parça eşleştirmesi yapar
- Kritik stok kontrolü

### 4. bomAnalizi(planiId)
BOM bazlı analiz yapar.
- Malzeme ihtiyaçlarını hesaplar
- Stok karşılaştırması yapar
- Eksik malzemeleri işaretler

### 5. isEmriOlustur(planiId)
Plana bağlı iş emirleri oluşturur.
- Her kalem için iş emri
- Tezgah ataması
- Tarih planlaması

### 6. kritikStokAnalizi(planiId)
Kritik stok analizi yapar.
- Hangi parçalarda stok yetersiz
- Tedarik süresi hesaplama

---

## Excel Import Formatı

| Kolon | Açıklama |
|-------|----------|
| Parça Kodu | Parça benzersiz kod |
| Adet | Üretilecek adet |
| Öncelik | 1-5 arası öncelik |
| Başlangıç Tarihi | Planlanan başlangıç |
| Bitiş Tarihi | Planlanan bitiş |
| Tezgah | Atanacak tezgah |

---

## Frontend Bileşenleri (V1)

| Bileşen | Açıklama |
|---------|----------|
| `UretimPlani.jsx` | Ana üretim planı sayfası |
| `UretimPlaniListesi.jsx` | Plan listesi |
| `UretimPlaniForm.jsx` | Plan oluşturma/düzenleme formu |
| `UretimPlaniKalemleri.jsx` | Plan kalemleri listesi |
| `BOMAnalizPanel.jsx` | BOM analiz paneli |
| `KritikStokUyarisi.jsx` | Kritik stok uyarı component |

---

## Frontend Bileşenleri (V2)

| Bileşen | Açıklama |
|---------|----------|
| `UretimPlanlariV2.jsx` | V2 ana sayfa |
| `UretimPlaniV2Form.jsx` | V2 form |
| `UretimPlaniV2Detay.jsx` | V2 detay görünümü |

---

## Drag & Drop Özelliği

Sürükle-bırak ile kalem sıralaması değiştirilebilir.

```javascript
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="plan-kalemleri">
    {provided => (
      <ul ref={provided.innerRef} {...provided.droppableProps}>
        {kalemler.map((kalem, index) => (
          <Draggable key={kalem.id} draggableId={kalem.id} index={index}>
            {provided => <li {...provided.draggableProps} {...provided.dragHandleProps}>...</li>}
          </Draggable>
        ))}
      </ul>
    )}
  </Droppable>
</DragDropContext>
```

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `plan:created` | Yeni plan oluşturuldu |
| `plan:updated` | Plan güncellendi |
| `plan:kalem-eklendi` | Kalem eklendi |
| `plan:kalem-silindi` | Kalem silindi |
| `plan:statusChanged` | Plan durumu değişti |
| `plan:kritis-stok` | Kritik stok uyarısı |

---

## İlişkili Modüller

- **İş Emirleri** - Oluşturulan iş emirleri
- **BOM Yönetimi** - Malzeme listeleri
- **Parçalar** - Parça referansları
- **Tezgahlar** - Tezgah ataması
- **Stok Kartları** - Malzeme takibi
- **Makinalar** - Makina bazlı planlama

---

## Kullanım Senaryoları

### Senaryo 1: V1 ile Excel Import
1. Kullanıcı "Excel Import" seçer
2. Excel dosyasını yükler
3. Sistem dosyayı parse eder
4. Parça eşleştirmesi yapar
5. Kritik stok kontrolü gösterir
6. Onay sonrası plan oluşturulur

### Senaryo 2: V2 ile Hızlı Plan
1. Kullanıcı "Yeni Plan V2" seçer
2. Plan adı ve tarih girer
3. İş emri listesi yapıştırır (JSON)
4. Kaydet butonuna tıklar

### Senaryo 3: İş Emri Dönüştürme
1. Kullanıcı tamamlanmış plan seçer
2. "İş Emirleri Oluştur" butonuna tıklar
3. Sistem her kalem için iş emri oluşturur
4. Tezgah atamalarını yapar

---

## Validasyon Kuralları

- `plan_adi` zorunlu, en fazla 200 karakter
- `tarih` geçerli tarih formatı
- Kalemlerde `parca_kodu` zorunlu
- `adet` pozitif integer

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| UP001 | Plan bulunamadı | Geçersiz plan ID |
| UP002 | Excel formatı hatalı | Uyumsuz Excel yapısı |
| UP003 | Parça bulunamadı | Excel'deki parça sistende yok |
| UP004 | Stok yetersiz | Kritik stok uyarısı |
| UP005 | Geçersiz BOM | BOM referansı hatalı |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-03 | İlk versiyon (V1) |
| 2.0 | 2024-07 | V2 sistemi eklendi |
| 2.1 | 2024-10 | Excel import iyileştirmesi |
| 2.2 | 2024-12 | Kritik stok analizi eklendi |
| 2.3 | 2025-02 | Drag & drop özelliği |