const cron = require('node-cron');
const winston = require('winston');
const { TedarikTalebi, Sevkiyat, Parca, Tezgah, StokKartlari, Firma, OpUser, SevkiyatDetay, TedarikTalebiDetay, TedarikDetay } = require('../models');
const { Op } = require('sequelize');

// Logger oluştur
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

class ShipmentAutomationService {
  constructor() {
    this.isRunning = false;
    this.jobs = new Map();
  }

  /**
   * Otomatik sevkiyat servisini başlat
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Shipment automation service is already running');
      return;
    }

    try {
      // Her saat başı çalışan kontrol job'u
      const checkJob = cron.schedule('0 * * * *', async () => {
        await this.checkPendingTales();
      }, {
        scheduled: false,
        timezone: 'Europe/Istanbul'
      });

      this.jobs.set('checkPending', checkJob);

      // Her sabah 08:00'de çalışan günlük özet job'u
      const dailySummaryJob = cron.schedule('0 8 * * *', async () => {
        await this.sendDailySummary();
      }, {
        scheduled: false,
        timezone: 'Europe/Istanbul'
      });

      this.jobs.set('dailySummary', dailySummaryJob);

      // Job'ları başlat
      checkJob.start();
      dailySummaryJob.start();

      this.isRunning = true;
      this.startTime = new Date();

      console.log('✅ Otomatik Sevkiyat Servisi başlatıldı');

      // Başlangıçta bir kontrol yap
      await this.checkPendingTales();

    } catch (error) {
      console.error('❌ Otomatik Sevkiyat Servisi başlatılamadı:', error.message);
    }
  }

  /**
   * Otomatik sevkiyat servisini durdur
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('Shipment automation service is not running');
      return;
    }

    try {
      // Tüm job'ları durdur
      this.jobs.forEach((job, name) => {
        job.stop();
        console.log(`Job ${name} stopped`);
      });

      this.jobs.clear();
      this.isRunning = false;

      console.log('⏹️ Otomatik Sevkiyat Servisi durduruldu');

    } catch (error) {
      console.error('Error stopping shipment automation service:', error);
    }
  }

  /**
   * Bekleyen tedarik taleplerini kontrol et ve otomatik sevkiyat oluştur
   */
  async checkPendingTales() {
    try {
      console.log('Checking pending procurement tales for automatic shipment creation...');

      // Onaylı ama sevkiyatı oluşturulmamış talepleri bul
      const pendingTales = await TedarikTalebi.findAll({
        where: {
          durum: 'onaylandi',
          firma_id: { [Op.not]: null },
          otomatik_sevkiyat: true,
          [Op.or]: [
            { son_islem_tarihi: null },
            {
              son_islem_tarihi: {
                [Op.lt]: new Date(Date.now() - 30 * 60 * 1000) // 30 dakikadan eski
              }
            }
          ]
        },
        include: [
          { association: 'detaylar' },
          { association: 'firma' }
        ]
      });

      console.log(`Found ${pendingTales.length} pending tales for automatic processing`);

      for (const tale of pendingTales) {
        try {
          await this.createAutomaticShipment(tale);
        } catch (error) {
          console.error(`Error creating automatic shipment for tale ${tale.id}:`, error);
          // Bir talep hata verirse diğerlerine devam et
        }
      }

    } catch (error) {
      console.error('Error in checkPendingTales:', error);
    }
  }

  /**
   * Otomatik sevkiyat oluştur
   */
  async createAutomaticShipment(tale) {
    const t = await TedarikTalebi.sequelize.transaction();

    try {
      // Sevkiyat numarası oluştur
      const shipmentNo = await this.generateShipmentNumber();

      // Sevkiyat kaydı oluştur
      const shipment = await Sevkiyat.create({
        sevkiyat_no: shipmentNo,
        firma_id: tale.firma_id,
        talep_id: tale.id,
        durum: 'beklemede',
        aciklama: `${tale.talep_no} numaralı tedarik talebinden otomatik oluşturulmuştur`,
        olusturan: 'SYSTEM',
        olusturma_tarihi: new Date(),
        otomatik: true
      }, { transaction: t });

      // Sevkiyat detaylarını oluştur
      const shipmentDetails = [];
      for (const detay of tale.detaylar) {
        const shipmentDetail = await SevkiyatDetay.create({
          sevkiyat_id: shipment.id,
          parca_id: detay.parca_id,
          miktar: detay.miktar,
          birim_fiyat: detay.birim_fiyat || 0,
          talep_detay_id: detay.id
        }, { transaction: t });

        shipmentDetails.push(shipmentDetail);

        // Stok güncellemesi (opsiyonel)
        await this.updateStock(detay.parca_id, detay.miktar, 'giris', t);
      }

      // Tedarik talebi durumunu güncelle
      await tale.update({
        durum: 'sevkiyat_olusturuldu',
        son_islem_tarihi: new Date(),
        notlar: tale.notlar ?
          tale.notlar + '\n\nOtomatik sevkiyat oluşturuldu: ' + shipmentNo :
          'Otomatik sevkiyat oluşturuldu: ' + shipmentNo
      }, { transaction: t });

      await t.commit();

      console.log(`✅ Otomatik sevkiyat oluşturuldu: ${shipmentNo} (Talep: ${tale.talep_no || tale.id})`);

      // Bildirim gönder (opsiyonel)
      await this.sendNotification(shipment, tale);

      return shipment;

    } catch (error) {
      await t.rollback();
      console.error('Error creating automatic shipment:', error);
      throw error;
    }
  }

  /**
   * Sevkiyat numarası oluştur
   */
  async generateShipmentNumber() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const lastShipment = await Sevkiyat.findOne({
      where: {
        sevkiyat_no: {
          [Op.like]: `SVK-OTOMATIK-${dateStr}-%`
        }
      },
      order: [['sevkiyat_no', 'DESC']]
    });

    let sequence = 1;
    if (lastShipment) {
      const lastSequence = parseInt(lastShipment.sevkiyat_no.split('-')[3]);
      sequence = lastSequence + 1;
    }

    return `SVK-OTOMATIK-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Stok güncelleme
   */
  async updateStock(parcaId, miktar, tip, transaction) {
    try {
      const stok = await StokKartlari.findOne({
        where: { parca_id: parcaId }
      });

      if (stok) {
        const yeniMiktar = tip === 'giris' ?
          stok.mevcut_miktar + miktar :
          stok.mevcut_miktar - miktar;

        await stok.update({
          mevcut_miktar: yeniMiktar,
          son_guncelleme: new Date()
        }, { transaction });
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  }

  /**
   * Bildirim gönder
   */
  async sendNotification(shipment, tale) {
    try {
      // Socket.IO ile gerçek zamanlı bildirim gönder
      // Bu fonksiyon projenin socket.io yapısına göre uyarlanmalı
      console.log(`Notification sent for automatic shipment ${shipment.sevkiyat_no}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Günlük özet raporu gönder
   */
  async sendDailySummary() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayShipments = await Sevkiyat.count({
        where: {
          olusturma_tarihi: {
            [Op.gte]: today
          },
          otomatik: true
        }
      });

      const pendingCount = await TedarikTalebi.count({
        where: {
          durum: 'onaylandi',
          otomatik_sevkiyat: true
        }
      });

      console.log(`Daily Shipment Summary - Today: ${todayShipments}, Pending: ${pendingCount}`);

      // Email veya diğer bildirim kanalları ile özet gönderilebilir

    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }

  /**
   * Servis durumunu kontrol et
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      startTime: this.startTime
    };
  }
}

// Singleton instance
const shipmentAutomationService = new ShipmentAutomationService();

module.exports = shipmentAutomationService;