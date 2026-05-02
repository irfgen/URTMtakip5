// Load environment variables first
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const { initializeDatabase } = require('./config/database');
// Import models to ensure associations are established
const models = require('./models');
const isEmirleriRoutes = require('./routes/isEmirleriRoutes');
const tezgahRoutes = require('./routes/tezgahRoutes'); // Eski tezgah route'u geri aktif
const parcaRoutes = require('./routes/parcaRoutes');
const islemKaydiRoutes = require('./routes/islemKaydiRoutes');
const bomRoutes = require('./routes/bomRoutes');
// const makinaRoutes = require('./routes/makinaRoutes'); // Eski makina route'u devre dışı
const uretimPlaniRoutes = require('./routes/uretimPlaniRoutes');
const uretimPlanlariRoutes = require('./routes/uretimPlanlariRoutes');
const arizaBakimRoutes = require('./routes/arizaBakimRoutes');
const isEmriOzetiRoutes = require('./routes/isEmriOzetiRoutes');
const fasonRoutes = require('./routes/fasonRoutes');
const fasonGrupRoutes = require('./routes/fasonGrupRoutes');
const grupRoutes = require('./routes/grupRoutes');
const tezgahPlanRoutes = require('./routes/tezgahPlanRoutes');
const tamamlananIsRoutes = require('./routes/tamamlananIsRoutes');
const tezgahDurumRoutes = require('./routes/tezgahDurumRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const siparisDokumaniRoutes = require('./routes/siparisDokumaniRoutes');
const siparislerRoutes = require('./routes/siparislerRoutes'); // Siparişler rotalarını içe aktar
const raporRoutes = require('./routes/raporlarRoutes');
const parcaImportRoutes = require('./routes/parcaImportRoutes'); // Parça içe aktarma rotalarını içe aktar
const parcaKayitlariRoutes = require('./routes/parcaKayitlariRoutes'); // Parça kayıtları rotalarını içe aktar
const makinaGroupPartsRoutes = require('./routes/makinaGroupPartsRoutes'); // Makina grup-parça rotalarını içe aktar
const stokKartlariRoutes = require('./routes/stokKartlariRoutes'); // Stok kartları rotalarını içe aktar
const stokKartiRoutes = require('./routes/stokKartiRoutes'); // Yeni stok kartı API rotalarını içe aktar
const stokTakipListeleriRoutes = require('./routes/stokTakipListeleri'); // Stok kartı takip listeleri rotaları
const parcaTakipListeleriRoutes = require('./routes/parcaTakipListeleri'); // Parça takip listeleri rotaları
const sevkiyatRoutes = require('./routes/sevkiyat'); // Sevkiyat rotalarını içe aktar
const topluSevkiyatRoutes = require('./routes/toplu-sevkiyat');
const notlarRoutes = require('./routes/notlarRoutes'); // Notlar rotalarını içe aktar
const kategorilerRoutes = require('./routes/kategorilerRoutes'); // Kategoriler rotalarını içe aktar
const fasonGrupTestRoutes = require('./routes/fasonGrupTestRoutes'); // Test Fason Grup rotalarını içe aktar
const isEmriTaslaklariRoutes = require('./routes/isEmriTaslaklariRoutes'); // İş emri taslakları rotalarını içe aktar
const vardiyaRoutes = require('./routes/vardiyaRoutes'); // Vardiya rotalarını içe aktar
const personelRoutes = require('./routes/personelRoutes'); // Personel rotalarını içe aktar
const vardiyaAtamaRoutes = require('./routes/vardiyaAtamaRoutes'); // Vardiya atama rotalarını içe aktar
const parcaBirlesikRoutes = require('./routes/parcaBirlesikRoutes'); // Parça birleşik rotalarını içe aktar
const teknikResimRoutes = require('./routes/teknikResimRoutes'); // Teknik resim analiz rotalarını içe aktar
const cadImportRoutes = require('./routes/cadImportRoutes'); // CAD Import rotalarını içe aktar
const cncLinkRoutes = require('./routes/cncLinkRoutes'); // CNC Link API rotalarını içe aktar
const isEmriDurumRoutes = require('./routes/isEmriDurumRoutes'); // İş emri durum yönetimi rotalarını içe aktar
const workstationSchedulerRoutes = require('./routes/workstationSchedulerRoutes'); // Tezgah İş Planı modülü rotalarını içe aktar
const tezgahIsPlanimi = require('./routes/tezgahIsPlanimi'); // Tezgah İş Planı V2 rotalarını içe aktar
const tezgahRaporRoutes = require('./routes/tezgahRaporRoutes'); // Tezgah raporu rotaları
const importExportRoutes = require('./routes/importExportRoutes'); // Import-Export modülü rotaları
const timelineRoutes = require('./routes/timeline'); // Timeline API rotalarını içe aktar
const dizinTaramaRoutes = require('./routes/dizinTarama'); // Dizin tarama rotalarını içe aktar
const cadFilesRoutes = require('./routes/cadFiles'); // CAD dosya rotalarını içe aktar
const tedarikRoutes = require('./routes/tedarikRoutes'); // Tedarik rotalarını içe aktar
const satisRoutes = require('./routes/satisRoutes'); // Satış rotalarını içe aktar
const gunlukVardiyaRoutes = require('./routes/gunlukVardiyaRoutes'); // Günlük vardiya raporu rotalarını içe aktar
const uygunsuzluklarRoutes = require('./routes/uygunsuzluklarRoutes'); // Uygunsuzluk raporları rotalarını içe aktar

// Fatura & İrsaliye Eşleştirme rotalarını içe aktar
const irsaliyelerRoutes = require('./routes/irsaliyeler');
const faturalarRoutes = require('./routes/faturalar');
const eslestirmeRoutes = require('./routes/eslestirme');

// Otomatik sevkiyat servisini içe aktar
const shipmentAutomationService = require('./services/shipmentAutomationService');
const shipmentAutomationRoutes = require('./routes/shipmentAutomationRoutes');

// MAKINDEX ROUTE'LARINI İÇE AKTAR
const makindexRoutes = require('./routes/makindexRoutes'); // Makindex hiyerarşik sistem rotalarını içe aktar

// YENİ MODÜLER MAKİNALAR ROUTE'LARINI İÇE AKTAR
const makinalarRoutes = require('./modules/makinalar/routes/makinalarRoutes');

// YENİ: Makina Sipariş ve Stok route'larını içe aktar
const makinaSiparisRoutes = require('./routes/makinaSiparisRoutes');
const makinaStokRoutes = require('./routes/makinaStokRoutes');

// Express uygulamasını oluştur
const app = express();
const httpServer = createServer(app);

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.includes('/api/makindex/boms')) {
    console.log(`[${new Date().toISOString()}] MAKINDEX API: ${req.method} ${req.url}`);
  }
  next();
});

// CORS middleware'i ekle (tüm originlere izin verir)
app.use(require('./cors'));

// Socket.IO kurulumu - CORS ile (development için tüm originlere izin ver)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-Key", "X-Session-ID"]
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});
// Socket.IO'yu route'larda erişilebilir hale getir
app.set('io', io);

// Socket.IO middleware'ını başlat
const socketMiddleware = require('./middleware/socket');
socketMiddleware.initialize(io);

// Middleware'leri yapılandır
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
// Express JSON body parser limiti artır (100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.urlencoded({ extended: true }));

// Logger yapılandırması
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Ana route
app.get('/', (req, res) => {
  res.json({ message: 'ÜRTM Takip Sistemi API' });
});

// Port bilgisini döndüren route
app.get('/port-info', (req, res) => {
  const address = httpServer.address();
  res.json({
    port: address.port,
    status: 'active'
  });
});

// API prefix ile port bilgisini döndüren route (frontend için)
app.get('/api/port-info', (req, res) => {
  const address = httpServer.address();
  res.json({
    status: 'ok',
    port: address.port || 3000,
    timestamp: new Date().toISOString(),
    message: 'Backend is running'
  });
});

// Route'ları yükle
app.use('/api/is-emirleri', isEmirleriRoutes);
app.use('/api/is-emri-taslaklari', isEmriTaslaklariRoutes); // İş emri taslakları rotalarını ekle
app.use('/api/raporlar', raporRoutes);

// MAKINDEX ROUTE'LARINI EKLE
app.use('/api/makindex', makindexRoutes);

// YENİ MODÜLER MAKİNALAR ROUTE'LARINI KULLAN
app.use('/api', makinalarRoutes);

// YENİ: Makina Sipariş ve Stok route'larını ekle
app.use('/api', makinaSiparisRoutes);
app.use('/api', makinaStokRoutes);

// ESKİ TEZGAH ROUTE'LERİ GEÇİCİ OLARAK KORUYORUZ (GERİYE UYUMLULUK İÇİN)
app.use('/api/tezgahlar', tezgahRoutes); // Eski route'u geri aktif et

app.use('/api/parcalar', parcaRoutes);
app.use('/api/parcalar', require('./routes/parcaImportRoutes'));
app.use('/api/islem-kayitlari', islemKaydiRoutes);
app.use('/api', bomRoutes); // BOM rotalarını /api altına ekle
// app.use('/api', makinaRoutes); // Eski makina route'u devre dışı
app.use('/api', grupRoutes); // Grup rotalarını /api altına ekle
app.use('/api/uretim-plani', uretimPlaniRoutes); // Eski üretim planı rotaları (mevcut destek)
app.use('/api/uretim-planlari', uretimPlanlariRoutes); // Yeni üretim planları rotaları (V2)
app.use('/api/ariza-bakim', arizaBakimRoutes); // Arıza ve bakım rotalarını ekle
app.use('/api/tamamlanan-isler', tamamlananIsRoutes); // Tamamlanan işler rotalarını ekle
app.use('/api/tezgah-plan', tezgahPlanRoutes); // Tezgah planlama rotalarını ekle
app.use('/api/fason', fasonRoutes); // Fason rotalarını ekle
app.use('/api/fason-grup', fasonGrupRoutes); // Fason grup rotalarını ekle
app.use('/api/is-emri-ozet', isEmriOzetiRoutes); // İş emri özeti rotalarını ekle
app.use('/api/tezgah-durum', tezgahDurumRoutes); // Tezgah durum rotalarını ekle
app.use('/api/upload', uploadRoutes); // Yükleme rotalarını ekle
app.use('/api/siparis-dokumanlari', siparisDokumaniRoutes); // Sipariş dokümanları rotalarını ekle
app.use('/api/siparisler', siparislerRoutes); // Siparişler rotalarını ekle
app.use('/api/parcalar', parcaImportRoutes); // Parça içe aktarma rotalarını ekle
app.use('/api/parca-kayitlari', parcaKayitlariRoutes); // Parça kayıtları rotalarını ekle
app.use('/api/makina-group-parts', makinaGroupPartsRoutes); // Makina grup-parça rotalarını ekle
app.use('/api/stok-kartlari', stokKartlariRoutes); // Stok kartları rotalarını ekle
app.use('/api/stok-karti', stokKartiRoutes); // Yeni stok kartı API rotalarını ekle
app.use('/api/stok-takip-listeleri', stokTakipListeleriRoutes); // Stok kartı takip listeleri rotalarını ekle
app.use('/api/parca-takip-listeleri', parcaTakipListeleriRoutes); // Parça takip listeleri rotalarını ekle
app.use('/api/sevkiyat', sevkiyatRoutes); // Sevkiyat rotalarını ekle
app.use('/api/toplu-sevkiyat', topluSevkiyatRoutes);
app.use('/api/sevkiyat/resimler', require('./routes/sevkiyat-resimler')); // Sevkiyat resim rotalarını ekle
app.use('/api/sevkiyat-kalemleri', require('./routes/sevkiyat-kalemleri')); // Sevkiyat kalemleri rotalarını ekle
app.use('/api/notlar', notlarRoutes); // Notlar rotalarını ekle
app.use('/api/kategoriler', kategorilerRoutes); // Kategoriler rotalarını ekle
app.use('/api/fason-grup-test', fasonGrupTestRoutes); // Test fason grup rotalarını ekle
app.use('/api/vardiyalar', vardiyaRoutes); // Vardiya rotalarını ekle
app.use('/api/personel', personelRoutes); // Personel rotalarını ekle
app.use('/api/vardiya-atama', vardiyaAtamaRoutes); // Vardiya atama rotalarını ekle
app.use('/api/parca-birlesik', parcaBirlesikRoutes); // Parça birleşik rotalarını ekle
app.use('/api/timeline', timelineRoutes); // Timeline API rotalarını ekle
app.use('/api/dizin-tarama', dizinTaramaRoutes); // Dizin tarama rotalarını ekle
app.use('/api/cad-files', cadFilesRoutes); // CAD dosya rotalarını ekle
app.use('/api/tedarik', tedarikRoutes); // Tedarik rotalarını ekle
app.use('/api/satis', satisRoutes); // Satış rotalarını ekle
app.use('/api/shipment-automation', shipmentAutomationRoutes); // Otomatik sevkiyat rotalarını ekle
app.use('/api/firmalar', require('./routes/firmaRoutes')); // Firma rotalarını ekle

// Fatura & İrsaliye Eşleştirme rotalarını ekle (with Socket.IO middleware)
app.use('/api/irsaliyeler', socketMiddleware.middleware, irsaliyelerRoutes);
app.use('/api/faturalar', socketMiddleware.middleware, faturalarRoutes);
app.use('/api/eslestirme', socketMiddleware.middleware, eslestirmeRoutes);

// Tezgah raporu rotalarını ekle
app.use('/api/tezgah', tezgahRaporRoutes);

// Vardiya yönetimi rotalarını ekle
app.use('/api/vardiyalar', vardiyaRoutes); // Vardiya rotalarını ekle
app.use('/api/personel', personelRoutes); // Personel rotalarını ekle
app.use('/api/vardiya-atamalari', vardiyaAtamaRoutes); // Vardiya atama rotalarını ekle

// Teknik resim analiz rotalarını ekle
app.use('/api/teknik-resim', teknikResimRoutes); // Teknik resim analiz rotalarını ekle

// CAD Import rotalarını ekle
app.use('/api/cad-import', cadImportRoutes); // CAD Import rotalarını ekle

// Import-Export modülü rotalarını ekle
app.use('/api/import-export', importExportRoutes); // Import-Export modülü rotalarını ekle
app.use('/api/download', require('./routes/downloadRoutes')); // Download rotalarını ekle

// CNC Link API rotalarını ekle
app.use('/api/cnc_link', cncLinkRoutes); // CNC Link API rotalarını ekle

// İş emri durum yönetimi rotalarını ekle
app.use('/api/is-emri-durumlari', isEmriDurumRoutes); // İş emri durum yönetimi rotalarını ekle

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ÜRTM Takip Server çalışıyor',
    timestamp: new Date().toISOString(),
    version: '11.3.184'
  });
});

// Tezgah İş Planı modülü rotalarını ekle
app.use('/api/scheduler', workstationSchedulerRoutes); // Tezgah İş Planı modülü rotalarını ekle
app.use('/api/tezgah-is-plani', tezgahIsPlanimi); // Tezgah İş Planı V2 rotalarını ekle

// Raporlar rotalarını ekle (gunlukVardiyaRoutes için)
app.use('/api/raporlar/gunluk-vardiya', gunlukVardiyaRoutes); // Günlük vardiya raporu rotalarını ekle
app.use('/api/uygunsuzluklar', uygunsuzluklarRoutes); // Uygunsuzluk raporları rotalarını ekle

// Global hata yakalama middleware - 413 Payload Too Large hatası için
app.use((err, req, res, next) => {
  if (err.status === 413 || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Dosya boyutu çok büyük',
      message: 'Yüklenen dosya boyutu maksimum limite (100MB) ulaştı. Lütfen daha küçük bir dosya yüklemeyi deneyin.',
      code: 'FILE_TOO_LARGE'
    });
  }
  
  // Diğer hatalar için varsayılan işlem
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Sunucu hatası oluştu',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Port discovery endpoint - frontend'in backend portunu bulabilmesi için
app.get('/port-info', (req, res) => {
  res.json({
    port: process.env.PORT || 5000,
    status: 'running'
  });
});

// Statik dosya sunumu (backend/uploads klasörü)
const path = require('path');

// CORS headers for static files
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept');
  next();
}, express.static(path.join(__dirname, '../uploads')));

app.use('/importlar', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept');
  next();
}, express.static(path.join(__dirname, '../importlar')));

// Socket.IO bağlantı yönetimi
io.on('connection', (socket) => {
  logger.info('Yeni bir kullanıcı bağlandı');

  socket.on('disconnect', () => {
    logger.info('Bir kullanıcı ayrıldı');
  });

  // İş emri güncellemelerini dinle
  socket.on('isEmriGuncellendi', (data) => {
    // Tüm bağlı istemcilere güncellemeyi gönder
    socket.broadcast.emit('isEmriGuncellendi', data);
  });

  // MAKINDEX EVENT'LARİ
  socket.on('makindex-join', () => {
    socket.join('makindex-room');
    logger.info(`Kullanıcı makindex odasına katıldı: ${socket.id}`);
  });

  socket.on('makindex-leave', () => {
    socket.leave('makindex-room');
    logger.info(`Kullanıcı makindex odasından ayrıldı: ${socket.id}`);
  });

  // Stok değişikliklerini dinle
  socket.on('stok-degisti', (data) => {
    // Makindex odasına stok değişikliğini bildir
    socket.to('makindex-room').emit('makindex-stok-guncellemesi', {
      type: 'stok',
      parcaKodu: data.parcaKodu,
      yeniStok: data.yeniStok,
      oncekiStok: data.oncekiStok,
      timestamp: new Date()
    });
  });

  // Yeni parça eklendiğinde
  socket.on('parca-eklendi', (data) => {
    socket.to('makindex-room').emit('makindex-parca-eklendi', {
      type: 'parca',
      parcaKodu: data.parcaKodu,
      parcaAdi: data.parcaAdi,
      bomId: data.bomId,
      timestamp: new Date()
    });
  });

  // BOM değişikliklerini dinle
  socket.on('bom-guncellendi', (data) => {
    socket.to('makindex-room').emit('makindex-bom-guncellemesi', {
      type: 'bom',
      bomId: data.bomId,
      makinaId: data.makinaId,
      degisiklik: data.degisiklik,
      timestamp: new Date()
    });
  });

  // Makina sınıfı değişiklikleri
  socket.on('makina-sinifi-guncellendi', (data) => {
    socket.to('makindex-room').emit('makindex-sinif-guncellemesi', {
      type: 'sinif',
      sinifId: data.sinifId,
      degisiklik: data.degisiklik,
      timestamp: new Date()
    });
  });
});

// CAD Import namespace
const cadNamespace = io.of('/cad-import');
cadNamespace.on('connection', (socket) => {
  logger.info(`CAD Import client connected: ${socket.id}`);
  
  // Client registration
  socket.on('register-client', async (clientInfo) => {
    try {
      socket.clientInfo = clientInfo;
      socket.join(`client-${clientInfo.client_id}`);
      
      // Update client status in database
      const { ImportClient } = require('./models');
      await ImportClient.upsertClient({
        client_id: clientInfo.client_id,
        client_name: clientInfo.client_name,
        client_info: clientInfo
      });
      
      // Notify web clients about new client
      socket.broadcast.emit('client-connected', {
        client_id: clientInfo.client_id,
        client_name: clientInfo.client_name,
        connected_at: new Date()
      });
      
      socket.emit('registration-success', { 
        message: 'Client başarıyla kaydedildi',
        client_id: clientInfo.client_id 
      });
      
      logger.info(`CAD Client registered: ${clientInfo.client_name} (${clientInfo.client_id})`);
      
    } catch (error) {
      logger.error('Client registration error:', error);
      socket.emit('registration-error', { error: error.message });
    }
  });
  
  // Job progress updates
  socket.on('job-progress', (data) => {
    const { job_id, progress, status, client_id } = data;
    
    // Broadcast to all web clients
    socket.broadcast.emit(`job-progress-${job_id}`, {
      job_id,
      progress,
      status,
      client_id,
      timestamp: new Date()
    });
    
    // Broadcast general progress update
    socket.broadcast.emit('import-progress', data);
    
    logger.info(`Job progress update: Job ${job_id}, Progress: ${progress}%`);
  });
  
  // File processing status
  socket.on('file-processed', (data) => {
    const { file_path, status, client_id, thumbnail_path, error } = data;
    
    // Broadcast to web clients
    socket.broadcast.emit('file-processed', {
      file_path,
      status,
      client_id,
      thumbnail_path,
      error,
      timestamp: new Date()
    });
    
    logger.info(`File processed: ${file_path} - Status: ${status}`);
  });
  
  // Client heartbeat
  socket.on('heartbeat', async (data) => {
    try {
      if (socket.clientInfo) {
        const { ImportClient } = require('./models');
        const client = await ImportClient.findByClientId(socket.clientInfo.client_id);
        if (client) {
          await client.updateLastSeen();
        }
      }
      socket.emit('heartbeat-ack');
    } catch (error) {
      logger.error('Heartbeat update error:', error);
    }
  });
  
  // Job control commands from web interface
  socket.on('start-job', (data) => {
    const { client_id, job_config } = data;
    cadNamespace.to(`client-${client_id}`).emit('start-job-command', job_config);
    logger.info(`Start job command sent to client: ${client_id}`);
  });
  
  socket.on('stop-job', (data) => {
    const { client_id, job_id } = data;
    cadNamespace.to(`client-${client_id}`).emit('stop-job-command', { job_id });
    logger.info(`Stop job command sent to client: ${client_id}`);
  });
  
  socket.on('disconnect', async () => {
    try {
      if (socket.clientInfo) {
        // Update client status to disconnected
        const { ImportClient } = require('./models');
        const client = await ImportClient.findByClientId(socket.clientInfo.client_id);
        if (client) {
          await client.updateStatus('disconnected');
        }
        
        // Notify web clients
        socket.broadcast.emit('client-disconnected', {
          client_id: socket.clientInfo.client_id,
          client_name: socket.clientInfo.client_name,
          disconnected_at: new Date()
        });
        
        logger.info(`CAD Client disconnected: ${socket.clientInfo.client_name} (${socket.clientInfo.client_id})`);
      } else {
        logger.info(`CAD Import client disconnected: ${socket.id}`);
      }
    } catch (error) {
      logger.error('Client disconnect error:', error);
    }
  });
});

// Fatura & İrsaliye Eşleştirme namespace
const faturaEslestirmeNamespace = require('./socket/namespaces/faturaEslestirme');
const faturaEslestirme = faturaEslestirmeNamespace(io);

// Export namespace for use in routes
module.exports.faturaEslestirme = faturaEslestirme;

// Export namespace for use in routes
module.exports.cadNamespace = cadNamespace;

// Veritabanı bağlantısı ve sunucuyu başlat
initializeDatabase()
  .then(async () => {
    logger.info('Veritabanı bağlantısı başarılı');

    // Otomatik sevkiyat servisini başlat
    try {
      await shipmentAutomationService.start();
      logger.info('Otomatik sevkiyat servisi başarıyla başlatıldı');
    } catch (error) {
      logger.error('Otomatik sevkiyat servisi başlatılamadı:', error);
    }

    // Portu belirle - varsayılan olarak 3000 portu kullan
    const PORT = process.env.PORT || 3000;

    // Sunucuyu belirlenen portta başlat
    const server = httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`Sunucu ${PORT} portunda çalışıyor (network: 0.0.0.0)`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} zaten kullanımda. Lütfen bu portu kullanan uygulamayı kapatın veya farklı bir PORT değeri belirleyin.`);
        process.exit(1);
      } else {
        logger.error('Sunucu başlatma hatası:', err);
        process.exit(1);
      }
    });

    // Graceful shutdown - servisi düzgün kapat
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await shipmentAutomationService.stop();
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await shipmentAutomationService.stop();
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  })
  .catch(err => {
    logger.error('Veritabanı bağlantı hatası:', err);
  });
