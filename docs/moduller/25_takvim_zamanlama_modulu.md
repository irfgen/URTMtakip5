# 25. TAKVİM & ZAMANLAMA (Timeline/Scheduler) Modülü

## Genel Bakış

Takvim ve Zamanlama modülü, üretim görevlerinin zamanlanması, timeline görünümü ve çakışma kontrolünü sağlar.

**Route Dosyası:** `backend/src/routes/timeline.js`, `backend/src/routes/workstationSchedulerRoutes.js`
**Controller Dosyası:** `backend/src/controllers/timelineController.js`, `backend/src/controllers/workstationSchedulerController.js`

---

## Modül Amacı

- Görev zamanlama
- Timeline görünümü
- Çakışma kontrolü
- Sıralama yönetimi
- Vardiya bazlı planlama

---

## Veritabanı Tablosu

**Zamanlama Görevleri:** `zamanlama_gorevleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| gorev_adi | STRING | Görev adı |
| tezgah_id | INTEGER | Tezgah ID |
| is_emri_id | INTEGER | İş emri ID |
| baslangic_zamani | DATETIME | Başlangıç zamanı |
| bitis_zamani | DATETIME | Bitiş zamanı |
| sure_dakika | INTEGER | Süre (dakika) |
| oncelik | INTEGER | Öncelik (1-5) |
| durum | STRING | bekliyor, aktif, tamamlandi, iptal |
| sira | INTEGER | Sıralama |
| created_at | DATETIME | Oluşturulma tarihi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /timeline` | Timeline verisi |
| `GET /data` | Timeline data |
| `GET /report` | Timeline raporu |
| `GET /shift-based` | Vardiya bazlı görünüm |
| `GET /conflicts` | Çakışma kontrolü |
| `GET /statistics` | Zamanlama istatistikleri |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /task/:taskId/duplicate` | Görev kopyala |
| `POST /tasks` | Yeni görev oluştur |
| `POST /bulk-update` | Toplu güncelleme |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /order/:tezgahId` | Sıralama güncelle |
| `PUT /task/:taskId` | Görev güncelle |
| `PUT /tasks/:taskId` | Görev güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /tasks/:taskId` | Görev sil |

---

## Timeline Görünüm Türleri

| Tür | Açıklama |
|-----|----------|
| Gunluk | Gün bazlı görünüm |
| Haftalik | Hafta bazlı görünüm |
| Aylik | Ay bazlı görünüm |
| Tezgah | Tezgah bazlı görünüm |
| Vardiya | Vardiya bazlı görünüm |

---

## Çakışma Kontrolü

```javascript
// Çakışma kontrolü
const checkConflicts = (tezgahId, baslangic, bitis) => {
  return gorevler.filter(g => 
    g.tezgah_id === tezgahId &&
    g.durum !== 'iptal' &&
    ((baslangic >= g.baslangic && baslangic < g.bitis) ||
     (bitis > g.baslangic && bitis <= g.bitis) ||
     (baslangic <= g.baslangic && bitis >= g.bitis))
  );
};
```

---

## Temel Fonksiyonlar

### 1. gorevOlustur(gorevData)
Yeni görev oluşturur.
- Çakışma kontrolü
- Sıra ataması

### 2. siralamaGuncelle(tezgahId, siralamaData)
Tezgah için görev sıralamasını günceller.

### 3. cakis Kontrol(tezgahId, baslangic, bitis)
Belirtilen zaman aralığında çakışma olup olmadığını kontrol eder.

### 4. gorevKopyala(gorevId, yeniTarih)
Mevcut görevi yeni bir tarihe kopyalar.

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `TezgahIsPlani.jsx` | Tezgah iş planı |
| `Timeline.jsx` | Timeline görünümü |
| `GorevKarti.jsx` | Görev kartı |
| `Takvim.jsx` | Takvim görünümü |
| `CakisUyarisi.jsx` | Çakışma uyarı component |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `schedule:taskCreated` | Görev oluşturuldu |
| `schedule:taskUpdated` | Görev güncellendi |
| `schedule:taskDeleted` | Görev silindi |
| `schedule:conflict` | Çakışma tespit edildi |

---

## İlişkili Modüller

- **İş Emirleri** - İş emri bağlantısı
- **Tezgahlar** - Tezgah bağlantısı
- **Vardiya Yönetimi** - Vardiya zamanlaması

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-03 | İlk versiyon |
| 1.1 | 2024-07 | Çakışma kontrolü eklendi |
| 1.2 | 2024-10 | Timeline görünümü |
| 1.3 | 2025-01 | Drag & drop sıralama |