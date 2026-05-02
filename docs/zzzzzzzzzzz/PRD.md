# ÜRTM Takip Sistemi - Ürün Gereksinimler Dökümanı (PRD)

## 1. Ürün Genel Bakış

### 1.1 Ürün Açıklaması
ÜRTM Takip Sistemi, endüstriyel üretim ortamları için kapsamlı bir üretim takip ve yönetim sistemidir. Sistem, makine monitörleme, iş emirleri yönetimi, parça kataloglama, BOM yönetimi, fason işler, sevkiyat takibi ve üretim planlaması gibi üretim süreçlerinin tamamını dijital ortamda yönetmeyi sağlar.

### 1.2 Hedef Kitle
- **Birincil Hedef**: Orta ve büyük ölçekli üretim tesisleri
- **İkincil Hedef**: Küçük atölyeler ve özel üretim firmaları
- **Son Kullanıcılar**: Üretim operatörleri, vardiya şefleri, üretim planlamacıları, kalite kontrol uzmanları, yöneticiler

### 1.3 Temel Değer Önerisi
- **Gerçek Zamanlı Görünürlük**: Üretim süreçlerinin canlı takibi
- **Entegre Yönetim**: Tüm üretim süreçlerinin tek platformda yönetimi
- **Mobil Erişim**: Üretim sahasında mobil cihazlar ile erişim
- **Donanım Entegrasyonu**: ESP32 tabanlı veri yakalama ve  IOT sistemleri
- **CAD Entegrasyonu**: SolidWorks ve STEP dosya işleme araçları

## 2. Sistem Mimarisi

### 2.1 Teknoloji Stack'i
- **Backend**: Node.js, Express.js, Socket.IO
- **Veritabanı**: SQLite, Sequelize ORM
- **Frontend**: React, Material-UI, Redux Toolkit
- **Mobil**: Responsive Web (PWA yaklaşımı)
- **Donanım**: ESP32 (Arduino Framework)
- **CAD Araçları**: Python (FreeCAD, SolidWorks COM)
- **Deployment**: PM2, Nginx
- **Build**: Vite (Frontend), PlatformIO (ESP32)

### 2.2 Sistem Bileşenleri
1. **Ana Web Uygulaması** (Full-stack Node.js/React)
2. **Mobil Web Arayüzü** (Responsive React)
3. **CNC Panel Donanımı** (ESP32 tabanlı)
4. **STEP BOM Analyzer** (Python desktop uygulaması)
5. **CAD Import Client** (Python/SolidWorks entegrasyonu)

## 3. Fonksiyonel Gereksinimler

### 3.1 İş Emirleri Yönetimi
#### 3.1.1 Temel İş Emri İşlemleri
- **İş Emri Oluşturma**: Manuel ve otomatik iş emri oluşturma
- **İş Emri Düzenleme**: Mevcut iş emirlerinin güncellenmesi
- **Durum Takibi**: İş emirlerinin yaşam döngüsü boyunca durum takibi
- **Öncelik Yönetimi**: Acil, yüksek, normal, düşük öncelik seviyeleri
- **Teslim Tarihi Takibi**: Planlanan ve gerçek teslim tarihlerinin karşılaştırması

#### 3.1.2 İş Emri Durum Yönetimi
- **Durum Kategorileri**: 
  - Beklemede
  - İşlemde
  - Tamamlandı
  - İptal Edildi
  - Torna
  - Freze
  - 3 metre
  - 5 metre
  - 6 metre
  - 8 metre
  - Siparişte
  - Sipariş verilecek
- **Durum Geçişleri**: Otomatik ve manuel durum güncellemeleri
- **Geçmiş Takibi**: İş emri durum geçmişinin saklanması

#### 3.1.3 İş Emri Taslakları
- **Taslak Sistemi**: İş emirlerinin taslak olarak kaydedilmesi
- **Toplu İş Emri Oluşturma**: Taslak listeleriyle toplu iş emri üretimi
- **Oturum Yönetimi**: Taslak gruplarının oturum bazlı organize edilmesi

### 3.2 Tezgah ve Makine Yönetimi
#### 3.2.1 Tezgah Tanımları
- **Tezgah Kartları**: Visual tezgah kartları ile yerleşim planı
- **Durum Görüntüleme**: Müsait, çalışıyor, bakım durumları
- **Pozisyon Yönetimi**: Drag-drop ile tezgah konumlandırması
- **İş Atama**: Tezgahlara iş emirlerinin atanması

#### 3.2.2 CNC Makine Entegrasyonu
- **Gerçek Zamanlı Durum**: ESP32 üzerinden canlı makine durumu
- **Otomatik Durum Güncelleme**: Makine durumlarının otomatik API güncellemeleri
- **Alarmlar**: Makine hata durumlarında anlık bildirimler
- **Durum Geçmişi**: Makine çalışma geçmişinin saklanması

#### 3.2.3 Bakım Yönetimi
- **Preventif Bakım**: Planlı bakım tarihleri ve takibi
- **Arıza Kayıtları**: Makine arızalarının detaylı kayıt sistemi
- **Bakım Geçmişi**: Tüm bakım işlemlerinin geçmiş kaydı
- **Makine Performans Raporları**: Makine verimliliği analizi

### 3.3 Parça ve Stok Yönetimi
#### 3.3.1 Parça Katalogu
- **Parça Tanımları**: Detaylı parça bilgileri ve spesifikasyonları
- **Teknik Resimler**: CAD dosyaları ve teknik çizimler
- **OCR Teknolojisi**: Teknik resimlerdeki yazıların otomatik tanınması
- **3D Görselleştirme**: STEP dosyalarından 3D önizleme
- **Parça Geçmişi**: Üretim geçmişi ve performance takibi

#### 3.3.2 Stok Kartları
- **Stok Takibi**: Gerçek zamanlı stok seviyeleri
- **Stok Hareketleri**: Giriş, çıkış, transfer işlemleri
- **Minimum Stok Uyarıları**: Kritik stok seviyesi bildirimleri
- **Stok Sayım**: Periyodik stok sayım işlemleri
- **Lokasyon Yönetimi**: Depo lokasyon takibi

#### 3.3.3 BOM (Ürün Reçetesi) Yönetimi
- **Hiyerarşik BOM**: Ana ürün ve alt parça hiyerarşisi
- **BOM Analizi**: Malzeme gereksinimi analizi
- **Excel Entegrasyonu**: Excel'den BOM verilerinin aktarılması
- **Versiyon Kontrolü**: BOM değişiklik takibi
- **Maliyet Hesaplama**: BOM bazlı maliyet analizi

### 3.4 Üretim Planlama
#### 3.4.1 Ana Üretim Planı Sistemi
- **Plan Türleri**: Makina bazlı, özel liste, karma planlar
- **Excel Entegrasyonu**: Excel dosyalarından plan oluşturma
- **Kritik Stok Analizi**: Plan bazlı malzeme gereksinim analizi
- **BOM Snapshot**: Plan anında BOM durumunun kaydedilmesi
- **Zaman Çizelgesi**: Gantt chart görünümü

#### 3.4.2 Basitleştirilmiş Planlama (V2)
- **JSON Bazlı Planlar**: Hafif planlama sistemi
- **İş Emri Listeleri**: Direkt iş emri listesi yönetimi
- **Hızlı Planlama**: Karmaşık analiz gerektirmeyen planlar

#### 3.4.3 Tezgah İş Planı
- **Timeline Görünümü**: Tezgah bazlı zaman çizelgesi
- **İş Sıralama**: Drag-drop ile iş sıralama
- **Kaynak Optimizasyonu**: Tezgah kapasitesi optimizasyonu

### 3.5 Fason İş Yönetimi
#### 3.5.1 Fason İş Tanımları
- **Fason Firmalar**: Tedarikçi firma bilgileri
- **Fason İş Emirleri**: Dışarıya verilecek işlerin takibi
- **Teslim Süreçleri**: Ham malzeme gönderim ve mamul teslimat
- **Kalite Kontrol**: Fason işlerin kalite kontrolü

#### 3.5.2 Fason Grup Yönetimi
- **İş Grupları**: İlgili işlerin gruplandırılması
- **Toplu İş Yönetimi**: Grup bazlı iş takibi
- **Maliyet Takibi**: Fason iş maliyetlerinin takibi

#### 3.5.3 Teklif Yönetimi
- **Teklif Alma**: Fason firmalardan teklif süreçleri
- **Teklif Karşılaştırma**: Tekliflerin analiz edilmesi
- **Sözleşme Yönetimi**: Kabul edilen tekliflerin sözleşme haline getirilmesi

### 3.6 Sevkiyat ve Lojistik
#### 3.6.1 Sevkiyat Yönetimi
- **Sevkiyat Kayıtları**: Giden malzemelerin kayıt sistemi
- **Teslimat Takibi**: Sevkiyat durumu ve teslimat bilgileri
- **Fotoğraf Dokümantasyonu**: Sevkiyat fotoğrafları
- **Müşteri Bilgileri**: Teslimat adresi ve iletişim bilgileri

#### 3.6.2 İç Sevkiyat
- **Fabrika İçi Transfer**: Departmanlar arası malzeme transferi
- **Lokasyon Değişiklikleri**: Stok lokasyon güncellemeleri
- **Transfer Onay Süreci**: İç sevkiyat onay mekanizması

#### 3.6.3 Toplu Sevkiyat
- **Toplu İşlem**: Çoklu ürünün tek sevkiyatta gönderilmesi
- **Sevkiyat Optimizasyonu**: Kargo optimizasyonu
- **Dokümantasyon**: İrsaliye ve fatura entegrasyonu

### 3.7 Kalite ve Raporlama
#### 3.7.1 Raporlar
- **Üretim Raporları**: Günlük, haftalık, aylık üretim raporları
- **Performans Analitiği**: Tezgah ve operatör performansı
- **Maliyet Analizi**: Üretim maliyet raporları
- **Zaman Analitiği**: İş tamamlama süreleri

#### 3.7.2 Dashboard ve KPI'lar
- **Ana Dashboard**: Genel üretim durumu özeti
- **KPI Takibi**: Anahtar performans göstergelerinin takibi
- **Trend Analizi**: Performans trendlerinin görselleştirilmesi

### 3.8 Vardiya ve Personel Yönetimi
#### 3.8.1 Vardiya Tanımları
- **Vardiya Programı**: Gündüz, gece, hafta sonu vardiyaları
- **Vardiya Takvimi**: Aylık vardiya planlaması
- **Vardiya Raporları**: Vardiya bazlı üretim raporları

#### 3.8.2 Personel Yönetimi
- **Personel Bilgileri**: Çalışan kayıt sistemi
- **Vardiya Atamaları**: Personelin vardiyalara atanması
- **Performans Takibi**: Personel performans değerlendirmesi

### 3.9 Notlar ve Dokümantasyon
#### 3.9.1 Not Sistemi
- **Kategorize Edilmiş Notlar**: Üretim, kalite, bakım notları
- **Not Paylaşımı**: Vardiyalar arası bilgi paylaşımı
- **Etiketleme**: Notların etiketlenmesi ve arama
- **Dosya Ekleri**: Nota dosya ekleme özelliği
- **Not Kategorileri**: Dinamik kategori yönetimi
- **Not Önceliklendirme**: Kritik, önemli, normal seviyeler
- **Not Geçmişi**: Düzenleme ve değişiklik takibi

#### 3.9.2 Döküman Yönetimi
- **Teknik Dokümantasyon**: İş talimatları ve prosedürler
- **Sertifikalar**: Kalite sertifikaları ve belgeler
- **Versiyon Kontrolü**: Döküman versiyon takibi
- **Dizin Tarama**: Otomatik dosya sistemi tarama
- **Bulk Import/Export**: Toplu döküman yönetimi

### 3.10 Workstation Scheduler (Tezgah İş Planı)
#### 3.10.1 Timeline Yönetimi
- **Visual Timeline**: Gantt chart benzeri zaman çizelgesi
- **Drag & Drop**: İş emirlerinin sürükle-bırak ile planlanması
- **Kaynak Optimizasyonu**: Tezgah kapasitesi optimizasyonu
- **Çakışma Kontrolü**: Otomatik çakışma tespiti ve uyarıları

#### 3.10.2 Planlama Araçları
- **Otomatik Planlama**: AI destekli iş sıralama
- **Manuel Müdahale**: Kullanıcı tarafından plan düzenleme
- **What-if Analizi**: Senaryo planlaması
- **Kaynak Analizi**: Tezgah yükleme analizi

## 4. CAD ve Donanım Entegrasyonları

### 4.1 STEP BOM Analyzer
#### 4.1.1 STEP Dosya İşleme
- **3D Model İmport**: STEP formatındaki CAD dosyalarının içe aktarılması
- **BOM Çıkarımı**: 3D modelden otomatik BOM oluşturma
- **3D Renderering**: FreeCAD entegrasyonu ile görselleştirme
- **Thumbnail Oluşturma**: Otomatik önizleme resimleri

#### 4.1.2 Export Özellikleri
- **Çoklu Format**: JSON, Excel, CSV, XML export
- **API Entegrasyonu**: Ana sistemle parça doğrulama
- **Batch İşlem**: Toplu dosya işleme

### 4.2 CAD Import Client
#### 4.2.1 SolidWorks Entegrasyonu
- **COM Automation**: SolidWorks ile otomatik etkileşim
- **Toplu İşlem**: Klasör bazlı toplu CAD dosya işleme
- **Thumbnail Üretimi**: Otomatik önizleme oluşturma
- **Server Entegrasyonu**: Ana sistem ile WebSocket bağlantısı

#### 4.2.2 Desteklenen Formatlar
- **SolidWorks**: .sldprt, .sldasm dosyaları
- **Universal**: .step, .iges dosyaları
- **Çıktı**: .png thumbnail'lar

### 4.3 CNC Panel (ESP32)
#### 4.3.1 Donanım Özellikleri
- **Mikroişlemci**: ESP32 Development Board
- **Bağlantı**: Wi-Fi 802.11n
- **I/O**: Dijital giriş/çıkış pinleri
- **Güç**: 5V/3.3V besleme

#### 4.3.2 Yazılım Özellikleri
- **Real-time Monitoring**: Anlık makine durumu takibi
- **HTTP API**: RESTful API üzerinden veri gönderimi
- **Ping Sistemi**: Bağlantı durumu kontrolü
- **OTA Update**: Kablosuz yazılım güncelleme desteği

#### 4.3.3 Desteklenen Durum Kodları
- **0**: İddle (Boşta)
- **1**: Running (Çalışıyor)
- **2**: Error/Maintenance (Hata/Bakım)

## 5. Teknik Özellikler

### 5.1 Performans Gereksinimleri
- **Eşzamanlı Kullanıcı**: En az 50 kullanıcı
- **Yanıt Süresi**: API yanıtları < 500ms
- **Dosya Yükleme**: 100MB'a kadar dosya desteği
- **Real-time**: Socket.IO ile anlık güncellemeler
- **Veritabanı**: SQLite ile optimize edilmiş performans

### 5.2 Güvenlik Gereksinimleri
- **CORS**: Çapraz kaynak paylaşımı güvenliği
- **Helmet.js**: HTTP güvenlik başlıkları
- **Rate Limiting**: API hız sınırlaması
- **Input Validation**: Joi ile girdi doğrulama
- **Error Handling**: Kapsamlı hata yönetimi

### 5.3 Ölçeklenebilirlik
- **Horizontal Scaling**: PM2 cluster desteği
- **Load Balancing**: Nginx load balancer
- **Database**: SQLite'dan PostgreSQL/MySQL'e migration
- **Caching**: Redis entegrasyonu hazırlığı

## 6. Kullanıcı Deneyimi (UX)

### 6.1 Desktop Arayüz
- **Material-UI**: Modern ve tutarlı tasarım
- **Responsive Layout**: Farklı ekran boyutları desteği
- **Dark/Light Theme**: Tema desteği
- **Drag & Drop**: Sürükle-bırak işlemleri
- **Data Visualization**: Chart.js ile grafikler

### 6.2 Mobil Arayüz
- **PWA Ready**: Progressive Web App özellikleri
- **Touch Optimized**: Dokunmatik kontroller
- **Offline Support**: Çevrimdışı çalışma kabiliyeti
- **Device Detection**: Otomatik cihaz algılama
- **Mobile Navigation**: Mobil menü sistemi

### 6.3 Erişilebilirlik
- **WCAG 2.1**: Web erişilebilirlik standartları
- **Keyboard Navigation**: Klavye ile gezinme
- **Screen Reader**: Ekran okuyucu desteği
- **High Contrast**: Yüksek kontrast desteği

## 7. Entegrasyonlar

### 7.1 Dosya Yönetimi
- **Excel İmport/Export**: .xlsx dosya desteği
- **PDF İşleme**: PDF görüntüleme ve işleme
- **Image Processing**: Sharp ile resim optimizasyonu
- **OCR**: Tesseract.js ile metin tanıma

### 7.2 Dış Sistem Entegrasyonları
- **API Gateway**: Dış sistemlerle entegrasyon hazırlığı
- **Webhook**: Dış sistemlere olay bildirimleri
- **Database Sync**: Çoklu veritabanı senkronizasyonu

### 7.3 İçe/Dışa Aktarım
- **Bulk Import**: Toplu veri içe aktarımı
- **Data Export**: Çeşitli formatlarda veri dışa aktarımı
- **Backup/Restore**: Otomatik yedekleme sistemi
- **Migration Tools**: Veri taşıma araçları

## 8. Deployment ve DevOps

### 8.1 Deployment Stratejisi
- **PM2**: Process manager ile uygulama yönetimi
- **Nginx**: Web server ve reverse proxy
- **SSL/TLS**: HTTPS güvenlik sertifikaları
- **Domain**: Özel domain adı desteği

### 8.2 Monitoring ve Logging
- **Winston**: Kapsamlı log sistemi
- **Error Tracking**: Hata izleme ve raporlama
- **Performance Monitoring**: Performans metriği toplama
- **Health Checks**: Sistem sağlık durumu kontrolü

### 8.3 Backup Stratejisi
- **Automated Backup**: Otomatik veritabanı yedeklemesi
- **File Backup**: Yüklenen dosyaların yedeklenmesi
- **Recovery Plan**: Felaket kurtarma planı
- **Version Control**: Git ile kod versiyonlama

## 9. Proje Yol Haritası

### 9.1 Mevcut Durum (v11.3.x) - Güncellenmiş
- ✅ **Temel CRUD işlemleri** tamamlandı (Tüm modüller için)
- ✅ **Mobil arayüz** tam fonksiyonel (PWA desteği ile)
- ✅ **CNC panel entegrasyonu** aktif (ESP32 real-time monitoring)
- ✅ **CAD araçları** operasyonel (STEP BOM Analyzer + SolidWorks Client)
- ✅ **Socket.IO real-time** özellikler aktif
- ✅ **Notlar sistemi** aktif (kategorize edilmiş notlar)
- ✅ **İş emri taslakları** yönetimi tamamlandı
- ✅ **Workstation Scheduler** (Tezgah iş planı modülü)
- ✅ **Üretim Planı V2** sistemi (Basitleştirilmiş planlama)
- ✅ **Vardiya yönetimi** modülü aktif
- ✅ **Yönetimsel araçlar** (Dizin tarama, Excel import/export)
- ✅ **Advanced raporlama** sistemi
- ✅ **Arıza-Bakım yönetimi** full operational
- ✅ **Fason işler** tam entegrasyonu
- ✅ **Sevkiyat modülü** (Toplu sevkiyat dahil)
- ✅ **Stok kartları** sistemi aktif
- ✅ **API optimizasyonu** (Foreign key handling, performance)

### 9.2 Kısa Vadeli Hedefler (3-6 ay) - Güncellenmiş
- 🔄 **Database migration** (SQLite'dan PostgreSQL'e geçiş)
- 🔄 **API v2** (GraphQL entegrasyonu, REST API iyileştirmeleri)
- 🔄 **Advanced Analytics** (AI destekli üretim analizi)
- 🔄 **Real-time Dashboard** (WebSocket optimizasyonu)
- 🔄 **Test Automation** (Unit, integration, e2e testler)
- 🔄 **Security Enhancement** (JWT, OAuth2, RBAC)
- 🔄 **Progressive Web App** (Offline support, push notifications)
- 🔄 **Docker containerization** (Development ve production environments)

### 9.3 Orta Vadeli Hedefler (6-12 ay)
- 📋 Multi-tenant architecture
- 📋 Advanced analytics dashboard
- 📋 Mobile app (React Native)
- 📋 AI/ML entegrasyonları
- 📋 ERP sistem entegrasyonları

### 9.4 Uzun Vadeli Hedefler (12+ ay)
- 📋 Cloud deployment options
- 📋 International localization
- 📋 Advanced automation
- 📋 IoT device ecosystem
- 📋 Marketplace entegrasyonları

## 10. Risk Analizi

### 10.1 Teknik Riskler
- **Database Limitations**: SQLite ölçeklenebilirlik sınırları
- **Real-time Performance**: Yüksek yük altında Socket.IO performansı
- **CAD Dependencies**: SolidWorks/FreeCAD versiyon uyumluluğu
- **Hardware Reliability**: ESP32 donanım stabilite riskleri

### 10.2 Risk Azaltma Stratejileri
- **Database Migration Path**: PostgreSQL/MySQL geçiş planı
- **Performance Testing**: Düzenli yük testleri
- **Dependency Management**: CAD araç versiyon kontrolü
- **Hardware Redundancy**: Yedek donanım planlaması

## 11. Başarı Metrikleri

### 11.1 Kullanıcı Metrikleri
- **Daily Active Users (DAU)**: Günlük aktif kullanıcı sayısı
- **User Retention**: Kullanıcı elde tutma oranı
- **Session Duration**: Ortalama oturum süresi
- **Feature Adoption**: Özellik kullanım oranları

### 11.2 Sistem Metrikleri
- **System Uptime**: %99.5+ sistem çalışma süresi
- **API Response Time**: Ortalama yanıt süresi <300ms
- **Error Rate**: %1'in altında hata oranı
- **Data Processing**: Günlük işlenen veri hacmi

### 11.3 İş Metrikleri
- **Production Efficiency**: Üretim verimliliği artışı %15+
- **Order Completion Time**: Sipariş tamamlama süresinde %20 azalma
- **Quality Incidents**: Kalite problemlerinde %30 azalma
- **Cost Reduction**: Operasyon maliyetlerinde %10 azalma

## 12. Ekler

### 12.1 API Endpoint'leri
- **İş Emirleri**: `/api/is-emirleri/*`
- **Tezgahlar**: `/api/tezgahlar/*`
- **Parçalar**: `/api/parcalar/*`
- **BOM**: `/api/boms/*`
- **Üretim Planı**: `/api/uretim-plani/*`
- **Fason**: `/api/fason/*`
- **Sevkiyat**: `/api/sevkiyat/*`
- **Raporlar**: `/api/raporlar/*`

### 12.2 Database Şeması
- **Ana Tablolar**: is_emirleri, tezgahlar, parcalar, boms
- **Destek Tabloları**: islem_kayitlari, stok_kartlari, notlar
- **Entegrasyon Tabloları**: import_clients, import_jobs

### 12.3 Dosya Yapısı
```
URTMtakip/
├── backend/           # Node.js backend
├── frontend/          # React frontend  
├── CNC_panel/         # ESP32 firmware
├── STEP_BOM_Analyzer/ # Python CAD tool
├── CAD_Import_Client/ # Python SolidWorks tool
└── docs/              # Documentation
```

---

*Bu doküman, ÜRTM Takip Sistemi'nin kapsamlı teknik ve işlevsel gereksinimlerini belirtir. Sistem sürekli geliştirilmektedir ve bu doküman da güncel tutulmalıdır.*

**Son Güncellenme**: Eylül 2025
**Versiyon**: v11.3.186+
**Durum**: Aktif Geliştirme - Production Ready