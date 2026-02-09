## Tezgah Raporu (Dikey Timeline) – Geliştirme Yol Haritası

Bu to-do listesi, TEZGAH İŞLERİ - CNC sayfasındaki "İşlemler" bölümüne "Tezgah raporu" butonunun eklenmesi ve mobil uyumlu, dikey timeline içeren Tezgah Raporu modalının geliştirilmesi için ayrıntılı adımları içerir.

---

## 1) Kapsam ve Hedefler
- [X] TEZGAH İŞLERİ - CNC sayfasındaki işlemler kısmına "Tezgah raporu" adlı yeni bir buton ekle
- [ ] Butona basıldığında açılan, mobilde de kullanılabilir (responsive, fullScreen) bir modal geliştir
- [ ] Modal üst kısmında tezgah ve tarih bilgisi (bilgi alanı) göster
- [ ] Modal alt kısmında dikey timeline: tezgahın dakika dakika çalışma/durma segmentleri
  - [ ] Her segment bir kutucuk: başlangıç–bitiş aralığını kapsasın
  - [ ] Kutucuk içeriği: iş emri no + işlenen parçanın kodu + dakika cinsinden işlem süresi
  - [ ] Çalışma segmenti (run) ve durma segmenti (stop) renk/ikonla ayrışsın
  - [ ] Mobil uyumlu (tek sütun, kolay scroll)

---

## 2) Backend – API Tasarımı ve Uygulama

Bağımlılıklar:
- Var olan veri kaynakları: `parca_isleme_kayitlari` (çalışma aralıkları), gerekli olduğunda `tezgah_durum_logs` (durum logları) ve `is_emirleri` (iş emri bilgileri).
- İstatistik uç noktası: `GET /api/cnc_link/stats/:tezgah_id` (korunur). Yeni uç nokta yalnızca timeline içindir.

### 2.1) Yeni Uç Nokta
- [x] Route: `GET /api/tezgah/rapor/timeline`
  - Query params: `tezgah_id` (number, zorunlu), `tarih` (YYYY-MM-DD, opsiyonel; verilmezse bugün)
- [ ] Amaç: Seçilen gün için tezgahın çalışma (run) ve durma (stop) segmentlerini üretmek
- [ ] İş mantığı:
  - [ ] Çalışma segmentleri, doğrudan `parca_isleme_kayitlari` kayıtlarından üretilir (her kayıt başlı başına bir "run" segmentidir)
  - [ ] Durma segmentleri, gün içinde "run" segmentlerinin arasındaki boşluklardan üretilir (00:00–23:59 aralığı içinde tamamlanır)
  - [ ] Her run için `is_emirleri` ile join: `is_emri_no` ve `parca_kodu` alınır
  - [ ] Süre hesapları dakika cinsindendir (run: `TIMESTAMPDIFF/strftime farkı`; stop: boşluk farkı)

Örnek yanıt gövdesi:

```json
{
  "success": true,
  "tezgah_id": 25,
  "tarih": "2025-01-15",
  "timeline": [
    {
      "type": "run",
      "start": "2025-01-15T08:30:00.000Z",
      "end": "2025-01-15T08:45:00.000Z",
      "minutes": 15,
      "is_emri_id": 1234,
      "is_emri_no": "IE-2025-0001",
      "parca_kodu": "P-001"
    },
    {
      "type": "stop",
      "start": "2025-01-15T08:45:00.000Z",
      "end": "2025-01-15T09:00:00.000Z",
      "minutes": 15
    }
  ]
}
```

### 2.2) Servis Detayları
- [ ] SQL/Veri erişimi (SQLite/Sequelize):
  - [ ] Gün başlangıcı–bitişi: `start = tarih 00:00:00`, `end = tarih 23:59:59`
  - [ ] Run verisi: `SELECT id, is_emri_id, baslangic_zamani, bitis_zamani, isleme_suresi_dakika FROM parca_isleme_kayitlari WHERE tezgah_id = ? AND DATE(baslangic_zamani) = ? ORDER BY baslangic_zamani ASC`
  - [ ] Join: `is_emirleri` üzerinden `is_emri_no`, `parca_kodu`
  - [ ] Stop üretimi: Run segmentleri arasındaki boşlukları hesapla; gün başı ve gün sonu sınırlarını dahil et
  - [ ] (Opsiyonel) `tezgah_durum_logs` kullanımı: log tutarlılığı yüksek ise stop/run doğrulaması için değerlendirilebilir

### 2.3) İndeksleme ve Performans
- [ ] İndeksler (öneri):
  - [ ] `CREATE INDEX IF NOT EXISTS idx_pik_tezgah_tarih ON parca_isleme_kayitlari(tezgah_id, baslangic_zamani);`
  - [ ] `CREATE INDEX IF NOT EXISTS idx_ie_is_emri_id ON is_emirleri(is_emri_id);`

### 2.4) Kenar Durumlar
- [ ] Çakışan run kayıtları (üst üste binen üretimler): her kayıt ayrı segment olarak listelensin
- [ ] Eksik `parca_kodu` veya `is_emri_no`: UI’da "—" olarak göster
- [ ] Dakika < 1 ise 1 dk olarak yuvarla (ESP32 zaten min 1 dk gönderiyor; server’da da koru)

---

## 3) Frontend – UI/UX ve Entegrasyon

Bağımlılıklar ve konumlar:
- TEZGAH İŞLERİ - CNC: mevcut akışta `TezgahIsleriForm.jsx` diyaloğu kullanılıyor ("işlemler" aksiyonları burada). Mobil sayfa `pages/mobile/TezgahlarMobile.jsx` üzerinden erişim var.

### 3.1) Yeni Buton
- [x] `TezgahIsleriForm.jsx` içinde "İşlemler" bölümüne `Button` ekle: metin "Tezgah raporu"
  - [x] Tıklamada `TezgahRaporuModal` açan state (`open`, `selectedDate`, vb.)
- [x] (Mobil) `TezgahlarMobile.jsx` içinde de ilgili tezgah kartının/aksiyonlarının içine aynı buton ya da menü girişi ekle

### 3.2) Modal Bileşeni
- [x] Yeni bileşen: `frontend/src/components/TezgahRaporuModal.jsx`
  - [x] Material UI `Dialog`
  - [x] `useMediaQuery` ile `<sm` ekranlarda `fullScreen`
  - [x] Props: `open`, `onClose`, `tezgah`, `defaultDate`
  - [x] Üst Bilgi Alanı: Tezgah adı/kodu, tarih seçici (günlük görünüm), istatistik kısa özet (toplam run/stop dakika)
  - [x] Alt Alan (Dikey Timeline):
    - [x] Scrollable container, tek sütun
    - [x] Her item bir kutucuk: renk şeması (run=yeşil, stop=grİ/kırmızı)
    - [x] İçerik: saat aralığı (HH:mm–HH:mm), süre (dk), `is_emri_no`, `parca_kodu`
    - [x] Erişilebilirlik: `aria-label` ve kontrast

### 3.3) API İstemcisi
- [x] Yeni dosya: `frontend/src/api/tezgahRaporAPI.js`
  - [x] `getTimeline(tezgahId, tarih)` → `GET /api/tezgah/rapor/timeline?tezgah_id=..&tarih=..`
  - [x] Hata/süreç durumları (loading/empty/error) için standart döndürüm

### 3.4) Durum Yönetimi ve Yük Durumları
- [ ] Modal açıldığında timeline yükle; tarih değiştiğinde yeniden yükle
- [ ] Loading skeleton/shimmer
- [ ] Empty state ("Gün için kayıt bulunamadı")
- [ ] Error state (yeniden dene butonu)

### 3.5) Stil ve Mobil Uyum
- [ ] Dikey timeline düzeni: flex-column veya CSS grid
- [ ] Uzun listelerde sanal render şimdilik gerekmiyor; performans gerekirse eklenir
- [ ] Text truncation ve tooltips (küçük ekranlar için)

---

## 4) Kabul Kriterleri
- [ ] "Tezgah raporu" butonu masaüstü ve mobilde görünür ve çalışır
- [ ] Modal, `<sm` ekranlarda fullScreen açılır, içerik kaydırılabilir ve bozulmaz
- [ ] Timeline, gün içindeki run/stop segmentlerini sıralı ve eksiksiz gösterir
- [ ] Run segment kutucuklarında iş emri no, parça kodu ve dakika süresi görünür
- [ ] Stop segmentleri doğru sürelerle boşlukları temsil eder
- [ ] Tarih değişimi anında yeni timeline verilerini çeker ve günceller

---

## 5) Test Planı
- [ ] Backend birim testleri: timeline hesaplama (run birleştirme yok; kayıtlar arası boşluk stop üretimi), kenar durumlar
- [ ] Backend entegrasyon testi: örnek veri seti ile JSON sözleşmesi
- [ ] Frontend bileşen testi: modal aç/kapa, tarih değişimi, boş/error durumları
- [ ] Mobil tarayıcı teste: 360px genişlikte görsel ve performans kontrolü

---

## 6) İzleme ve Optimizasyon
- [ ] Endpoint performans ölçümü (tarih bazlı indekslerin etkinliği)
- [ ] Ağ hataları ve yeniden deneme stratejileri (kısa süreli)
- [ ] Gözlemlenebilirlik: istek başarısızlık oranı, ortalama yanıt süresi

---

## 7) Uygulama Notları ve Bağlam
- `parca_isleme_kayitlari` run verisinin birincil kaynağıdır. Stop segmentleri bu verinin tamamlayıcısı olarak gün içi boşluklardan türetilir.
- `is_emri_no` ve `parca_kodu` bilgisi `is_emirleri` üzerinden zenginleştirilir.
- İleride `tezgah_durum_logs` verisi ile doğrulama/iyileştirme yapılabilir; ilk sürümde gerekmeyebilir.


