# Tezgah İş Planı Modülü - Geliştirme Yol Haritası

## FAZE 1: Altyapı Hazırlığı

### 1.1 Veritabanı Güncellemeleri
- [x] **is_emirleri tablosuna tahmini_isleme_suresi alanı eklenmesi**
  - [x] Migration dosyası oluşturma (`backend/src/migrations/`)
  - [x] `ALTER TABLE is_emirleri ADD COLUMN tahmini_isleme_suresi INTEGER DEFAULT 1;`
  - [x] Migration'ı test ortamında çalıştırma
  - [x] Sequelize model dosyasını güncelleme (`backend/src/models/IsEmri.js`)
  - [x] Model association'larını kontrol etme

### 1.2 İş Emri Formu Güncellemeleri
- [x] **İş emri oluşturma formuna tahmini_isleme_suresi alanı eklenmesi**
  - [x] Frontend form componentini güncelleme
  - [x] Form validation kuralları ekleme (1-20 vardiya arası)
  - [x] Backend controller'da yeni alanı işleme
  - [x] API endpoint'ini güncelleme (`POST /api/is-emirleri`)

- [x] **İş emri sağ tık menüsüne tahmini süre düzenleme seçeneği eklenmesi**
  - [x] Context menu componentini güncelleme
  - [x] Modal dialog oluşturma
  - [x] Güncelleme API'si entegrasyonu

### 1.3 API Altyapısı
- [x] **Yeni API endpoint'leri oluşturma**
  - [x] `GET /api/tezgah-is-plani` - İs emirlerini istasyon bazında getirme
  - [x] `PUT /api/tezgah-is-plani/:id` - İş emri güncelleme
  - [x] `PUT /api/tezgah-is-plani/bulk-update` - Toplu güncelleme
  - [x] Controller dosyası oluşturma (`backend/src/controllers/tezgahIsPlanimi.js`)
  - [x] Route dosyası oluşturma (`backend/src/routes/tezgahIsPlanimi.js`)
  - [x] Route'u ana app.js'e kaydetme

## FAZE 2: Temel Bileşen Geliştirme

### 2.1 İstasyon Sistemini Tanımlama
- [x] **İstasyon mapping sistemini oluşturma**
  - [x] İstasyon grupları sabitlerini tanımlama
  - [x] İş emri durumlarının istasyonlara mapping'ini yapma
  - [x] Renk kodlama sistemini belirleme
  - [x] Utility fonksiyonları yazma

### 2.2 Ana Sayfa Komponenti
- [x] **TezgahIsPlanimi ana komponenti oluşturma**
  - [x] Component dosyası oluşturma (`frontend/src/pages/TezgahIsPlanı.jsx`)
  - [x] Temel layout yapısını kurma
  - [x] State management yapısını belirleme
  - [x] Redux store slice'ı oluşturma (useState ile yapıldı)
  - [x] Frontend routing düzeltmesi (`App.jsx` güncellemesi)

### 2.3 Zaman Çizelgesi Komponenti
- [x] **Timeline header komponenti geliştirme**
  - [x] Vardiya sütunları oluşturma
  - [x] Tarih hesaplama algoritması
  - [x] Responsive tasarım uygulaması
  - [x] Zoom/Pan özelliklerinin temelini atma

### 2.4 İstasyon Satırları Komponenti
- [x] **İstasyon row komponenti oluşturma**
  - [x] Her istasyon için ayrı satır
  - [x] İstasyon başlıkları ve renk kodlama
  - [x] Timeline mode entegrasyonu
  - [x] Drag & Drop target alanları
  - [x] Scroll senkronizasyonu (zoom/pan ile)

## FAZE 3: İş Emri Kartları ve Görselleştirme

### 3.1 İş Emri Kartı Komponenti
- [x] **Dinamik genişlik hesaplama sistemi**
  - [x] Temel kart boyutu belirleme (120px x 60px)
  - [x] Tahmini süreye göre genişlik hesaplama algoritması
  - [x] CSS dinamik stil uygulama
  - [x] Responsive design optimizasyonu

- [x] **Kart içeriği ve tasarımı**
  - [x] İş emri bilgilerini gösterme (numara, parça, miktar)
  - [x] Renk kodlama sistemi uygulama
  - [x] Hover efektleri ekleme
  - [x] Durum göstergesi (vardiya göstergesi eklendi)

### 3.2 Veri Getirme ve Gösterme
- [x] **API entegrasyonu**
  - [x] İş emirlerini istasyon bazında getirme
  - [x] Loading state yönetimi
  - [x] Error handling
  - [ ] Caching mekanizması (sonraki faz)

- [x] **İş emri pozisyonlama algoritması**
  - [x] Zaman çizelgesinde doğru pozisyon hesaplama
  - [x] Çakışma kontrolü ve çözümü
  - [x] Grid snap özelliği

## FAZE 4: Drag & Drop Sistemi

### 4.1 Temel Drag & Drop
- [x] **Drag & Drop kütüphane entegrasyonu**
  - [x] @hello-pangea/dnd kütüphanesini kurma
  - [x] DragDropContext sarmalayıcısını ekleme
  - [x] Draggable ve Droppable alanları tanımlama

### 4.2 İş Emri Taşıma Mantığı
- [x] **İstasyonlar arası taşıma**
  - [x] onDragEnd event handler'ını yazma
  - [x] İstasyon değişikliği validation'ı
  - [x] API güncelleme çağrıları
  - [x] Optimistic update uygulama

- [x] **Zaman çizelgesinde taşıma**
  - [x] Horizontal pozisyon hesaplama
  - [x] Başlangıç tarihi güncelleme
  - [x] Vardiya snap mekanizması
  - [x] Çakışma önleme sistemi

### 4.3 Validasyon Sistemi
- [x] **Drag validasyon kuralları**
  - [x] Geçersiz hedef kontrolü
  - [x] Kullanıcı yetki kontrolü
  - [x] İş emri durum kontrolü
  - [x] Zaman aralığı validation'ı

## FAZE 5: Gelişmiş Özellikler

### 5.1 Filtreleme ve Arama
- [x] **Header filtreleri**
  - [x] Tarih aralığı seçici
  - [x] İstasyon filtresi (durum filtresi)
  - [x] İş emri durumu filtresi
  - [x] Arama kutusu (numara/parça adı)

- [x] **Filtreleme mantığı**
  - [x] Client-side filtreleme algoritması
  - [x] Server-side filtreleme API'si
  - [ ] URL parameter'lar ile durum yönetimi (sonraki faz)
  - [x] Filter reset özelliği

### 5.2 Zoom ve Pan Özellikleri
- [x] **Zaman çizelgesi zoom sistemi**
  - [x] Mouse wheel ile zoom
  - [x] Zoom butonları
  - [x] Min/Max zoom limitleri
  - [x] Zoom merkezi hesaplama

- [x] **Pan (kaydırma) sistemi**
  - [x] Horizontal scroll senkronizasyonu
  - [x] Touch gesture desteği (mobile)
  - [x] Keyboard navigation (arrow keys)
  - [ ] Smooth scrolling animasyonu

### 5.3 Real-time Güncellemeler
- [ ] **Socket.IO entegrasyonu**
  - [ ] Backend socket event'lerini ekleme
  - [ ] Frontend socket listener'ları
  - [ ] Real-time veri senkronizasyonu
  - [ ] Conflict resolution sistemi

- [ ] **Event handling**
  - [ ] `is-emri-guncellendi` event'i
  - [ ] `is-emri-eklendi` event'i
  - [ ] `is-emri-silindi` event'i
  - [ ] `istasyon-degisti` event'i

## FAZE 6: Performans Optimizasyonu

### 6.1 Veri Optimizasyonu
- [ ] **Lazy loading sistemi**
  - [ ] Viewport-based loading
  - [ ] Infinite scroll (gerekirse)
  - [ ] Data pagination
  - [ ] Cache management

### 6.2 UI Optimizasyonu
- [x] **React optimizasyonları**
  - [x] React.memo ile kart komponenti optimize etme
  - [x] useMemo ve useCallback hook'larını uygulama
  - [ ] Virtual scrolling (büyük veri setleri için)
  - [ ] Debounced API calls

### 6.3 Animasyon Optimizasyonu
- [ ] **CSS Transform'lar**
  - [ ] GPU accelerated animations
  - [ ] Smooth drag transitions
  - [ ] Loading skeleton animations
  - [ ] Micro-interactions

## FAZE 7: Mobile ve Responsive Tasarım

### 7.1 Mobile Layout
- [ ] **Mobile-first responsive design**
  - [ ] Breakpoint'leri belirleme
  - [ ] Mobile layout komponenti
  - [ ] Touch-friendly interaction'lar
  - [ ] Swipe gesture'ları

### 7.2 Mobile Optimizasyonlar
- [ ] **Performance optimizations**
  - [ ] Mobile device testing
  - [ ] Touch delay elimination
  - [ ] Memory usage optimization
  - [ ] Battery usage considerations

## FAZE 8: Test ve Kalite Kontrol

### 8.1 Unit Tests
- [ ] **Component testleri**
  - [ ] İş emri kartı komponenti testi
  - [ ] Drag & drop functionality testi
  - [ ] Filtreleme mantığı testi
  - [ ] API integration testleri

### 8.2 Integration Tests
- [ ] **End-to-end testler**
  - [ ] Drag & drop senaryoları
  - [ ] Multi-user collaboration testi
  - [ ] Performance stress tests
  - [ ] Mobile device tests

### 8.3 Edge Case Testing
- [ ] **Sınır durumu testleri**
  - [ ] Çok uzun işleme süreleri (>10 vardiya)
  - [ ] Çoklu simultaneous drag operations
  - [ ] Network connectivity issues
  - [ ] Large dataset performance (500+ iş emri)

## FAZE 9: Güvenlik ve Yetkilendirme

### 9.1 API Security
- [ ] **Authentication kontrolü**
  - [ ] JWT token validation
  - [ ] Rate limiting implementation
  - [ ] Input sanitization
  - [ ] SQL injection protection

### 9.2 Frontend Security
- [ ] **XSS protection**
  - [ ] Input validation
  - [ ] Content Security Policy
  - [ ] Secure data handling
  - [ ] Permission-based UI

## FAZE 10: Deployment ve Monitoring

### 10.1 Production Hazırlığı
- [ ] **Build optimizations**
  - [ ] Bundle size optimization
  - [ ] Code splitting
  - [ ] Asset compression
  - [ ] Performance monitoring setup

### 10.2 Monitoring ve Analytics
- [ ] **Error tracking**
  - [ ] Frontend error monitoring
  - [ ] Backend error logging
  - [ ] Performance metrics
  - [ ] User analytics (gerekirse)

## FAZE 11: Dokümantasyon ve Eğitim

### 11.1 Technical Documentation
- [ ] **API dokümantasyonu**
  - [ ] Endpoint specifications
  - [ ] Request/Response examples
  - [ ] Error codes documentation
  - [ ] Integration guidelines

### 11.2 User Documentation
- [ ] **Kullanım kılavuzu**
  - [ ] Feature açıklamaları
  - [ ] Screenshot'lar ile step-by-step guide
  - [ ] Troubleshooting section
  - [ ] FAQ section

## FAZE 12: Launch ve Post-Launch

### 12.1 Soft Launch
- [ ] **Beta testing**
  - [ ] Internal team testing
  - [ ] Selected user group testing
  - [ ] Bug fixing ve feedback incorporation
  - [ ] Performance tuning

### 12.2 Production Launch
- [ ] **Go-live preparation**
  - [ ] Database migration (production)
  - [ ] Server configuration
  - [ ] Backup procedures
  - [ ] Rollback plan

### 12.3 Post-Launch Support
- [ ] **Monitoring ve maintenance**
  - [ ] Performance monitoring
  - [ ] User feedback collection
  - [ ] Bug fixes ve improvements
  - [ ] Feature enhancement planning

---

## Önem Sırası ve Bağımlılıklar

### Kritik Path:
1. **FAZE 1** → **FAZE 2** → **FAZE 3** → **FAZE 4** (Temel functionality)
2. **FAZE 5** (Gelişmiş özellikler) 
3. **FAZE 6** (Performance) paralel olarak **FAZE 7** (Mobile)
4. **FAZE 8** (Testing) tüm fazlar boyunca paralel

### Toplam Tahmini Süre:
- **Minimum Viable Product (MVP)**: FAZE 1-4 → ~3-4 hafta
- **Full Feature Set**: FAZE 1-7 → ~6-8 hafta  
- **Production Ready**: Tüm fazlar → ~8-10 hafta

Bu yol haritası, Tezgah İş Planı modülünün sistematik ve kontrollü bir şekilde geliştirilmesi için detaylı adımları içermektedir.