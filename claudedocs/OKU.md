# ÜRTM Takip Sistemi - Dokümantasyon İndeksi

## Dokümantasyon Dosyaları

Bu dizin, ÜRTM Takip Sistemi için kapsamlı Türkçe dokümantasyon içerir.

### 📚 Ana Dokümanlar

1. **[PROJE_GENEL_BAKIS.md](./PROJE_GENEL_BAKIS.md)**
   - Sistem amacı ve kapsamı
   - Mimari genel bakış
   - Teknoloji yığını
   - Modüle göre temel özellikler
   - Veri akışı diyagramı

2. **[YAPI.md](./YAPI.md)**
   - Tam proje yapısı ve dizin organizasyonu
   - Her dizinin amacı ve önemli dosyaları
   - Modül organizasyonu
   - Bileşenler arası referanslar
   - Dosya isimlendirme standartları

3. **[API_DOKUMANTASYONU.md](./API_DOKUMANTASYONU.md)**
   - Tüm API endpoint'leri
   - HTTP method'ları ve parametreler
   - Request/Response format'ları
   - WebSocket event'leri
   - Rate limiting ve pagination

4. **[FRONTEND_REHBERI.md](./FRONTEND_REHBERI.md)**
   - React uygulama yapısı
   - Bileşen organizasyonu
   - State yönetimi (Redux)
   - Routing mimarisi
   - Mobil/masaüstü düzenleri
   - Performans optimizasyonu

5. **[VERITABANI_SHEMA.md](./VERITABANI_SHEMA.md)**
   - Tüm veritabanı tabloları
   - Model tanımları ve ilişkileri
   - Migration geçmişi
   - İlişki diyagramları
   - Veritabanı bakımı

6. **[YAYINLAMA.md](./YAYINLAMA.md)**
   - Production deployment adımları
   - PM2 yapılandırması
   - Nginx kurulumu
   - SSL sertifikası (Let's Encrypt)
   - Monitoring ve log yönetimi
   - Yedekleme stratejileri
   - Sorun giderme

### 🔍 Hızlı Başlangıç

**Yeni Geliştirici İçin**:
1. Önce `PROJE_GENEL_BAKIS.md` okuyun
2. Ardından `YAPI.md` ile proje yapısını inceleyin
3. Geliştirmeye başlarken `FRONTEND_REHBERI.md` ve `API_DOKUMANTASYONU.md` kullanın

**Deployment İçin**:
1. `YAYINLAMA.md` adım adım takip edin
2. `VERITABANI_SHEMA.md` ile veritabanı yapısını anlayın
3. Sorun yaşarsanız sorun giderme bölümüne bakın

### 📋 Önemli Konular

#### Sistem Mimarisi
- **Backend**: Node.js + Express.js + SQLite
- **Frontend**: React + Vite + Material-UI
- **Real-time**: Socket.IO
- **Hardware**: ESP32 CNC Panel (opsiyonel)
- **CAD Tools**: Python araçları (opsiyonel)

#### Ana Modüller
1. İş Emirleri (Work Orders)
2. Tezgahlar (Workstations)
3. Parçalar (Parts)
4. Üretim Planı (Production Planning)
5. BOM Yönetimi (Bill of Materials)
6. Stok Kartları (Inventory)
7. Sevkiyat (Shipping)
8. Fatura & İrsaliye
9. Arıza/Bakım (Maintenance)
10. Vardiya Yönetimi (Shift Management)
11. Raporlar (Reports)

### 🛠️ Geliştirme Araçları

#### Gerekli Yazılımlar
- Node.js 18.x+
- NPM 9.x+
- Git 2.25+
- VS Code veya JetBrains WebStorm

#### Geliştirme Komutları
```bash
# Tüm bağımlılıkları yükle
npm run install:all

# Development modunda başlat
npm run dev

# Frontend build
npm run build

# Test çalıştır
npm test

# Backend test
cd backend && npm test

# Frontend test
cd frontend && npm test
```

### 📞 Destek

#### Dokümantasyon
- Proje README: `/README.md`
- CLAUDE.md: Geliştirici talimatları
- Bu dokümantasyon: `/claudedocs/`

#### Log Konumları (Production)
- PM2: `/var/log/pm2/`
- Nginx: `/var/log/nginx/`
- Backend: `/var/www/urtmtakip/backend/`

#### Yedekleme Konumu
- Yedekler: `/var/backups/urtmtakip/`
- Backup script: `/var/www/urtmtakip/scripts/backup.sh`

### 📝 Güncelleme Geçmişi

**7 Ocak 2025** - Kapsamlı Türkçe dokümantasyon oluşturuldu:
- PROJE_GENEL_BAKIS.md
- YAPI.md
- API_DOKUMANTASYONU.md
- FRONTEND_REHBERI.md
- VERITABANI_SHEMA.md
- YAYINLAMA.md

### 🔗 Kaynaklar

#### Resmi Dokümantasyon
- [React](https://react.dev/)
- [Material-UI](https://mui.com/)
- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [Socket.IO](https://socket.io/)
- [Vite](https://vitejs.dev/)

#### Araçlar
- [PM2](https://pm2.keymetrics.io/)
- [Nginx](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

### 🤝 Katkıda Bulunma

Dokümantasyonu geliştirmek için:
1. MD dosyasını düzenleyin
2. Değişiklikleri açıklayın
3. Pull request gönderin

---

**Not**: Bu dokümantasyon sürekli güncellenmektedir. Son güncelleme: 7 Ocak 2025
