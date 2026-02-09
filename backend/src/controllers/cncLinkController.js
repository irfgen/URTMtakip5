const { Op, Transaction } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ESP32 Veri Kuyruk Sistemi
 * Yoğun veri akışını yönetmek için basit kuyruk mekanizması
 */
const esp32DataQueue = {
  items: [],
  processing: false,

  add: async function(data) {
    this.items.push(data);
    if (!this.processing) {
      await this.process();
    }
  },

  process: async function() {
    if (this.processing || this.items.length === 0) return;

    this.processing = true;
    console.log(`ESP32 kuyruk işleme başladı, ${this.items.length} bekleyen kayıt`);

    while (this.items.length > 0) {
      const batch = this.items.splice(0, 5); // 5'erli gruplar halinde işle
      try {
        await this.processBatch(batch);
      } catch (error) {
        console.error('Kuyruk işleme hatası:', error);
        // Hatalı kayıtları kuyruğa geri koy (limitli)
        this.items.unshift(...batch.slice(0, 2));
      }
    }

    this.processing = false;
    console.log('ESP32 kuyruk işleme tamamlandı');
  },

  processBatch: async function(batch) {
    const transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      type: Transaction.TYPES.IMMEDIATE
    });

    try {
      for (const data of batch) {
        const insertQuery = `
          INSERT INTO parca_isleme_kayitlari
          (tezgah_id, is_emri_id, baslangic_zamani, bitis_zamani, isleme_suresi_dakika, kayit_zamani, esp32_kayit_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await sequelize.query(insertQuery, {
          replacements: [
            data.tezgah_id,
            data.is_emri_id,
            data.baslangic_zamani,
            data.bitis_zamani,
            data.isleme_suresi_dakika,
            data.kayit_zamani,
            data.esp32_kayit_id
          ],
          transaction
        });
      }

      await transaction.commit();
      console.log(`${batch.length} kayıt başarıyla işlendi`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

/**
 * CNC Link API Controller
 * ESP32 CNC sistemleri ile iletişim için API endpoint'leri
 */

/**
 * Tezgaha atanmış aktif iş emri ID'sini getir
 * GET /api/cnc_link/is-emri-id/:tezgah_id
 */
exports.getIsEmriId = async (req, res) => {
  try {
    const { tezgah_id } = req.params;

    // Tezgah ID'sinin geçerli olup olmadığını kontrol et
    if (!tezgah_id || isNaN(parseInt(tezgah_id))) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz tezgah ID'
      });
    }

    // 1) Öncelikle tezgahın aktif iş listesini (JSON) kontrol et ve ilkini tercih et
    try {
      const [tezgahRows] = await sequelize.query(
        'SELECT is_emirleri FROM tezgahlar WHERE tezgah_id = ? LIMIT 1',
        {
          replacements: [parseInt(tezgah_id)],
          type: sequelize.QueryTypes.SELECT
        }
      );
      if (tezgahRows && tezgahRows.is_emirleri) {
        let aktifListe = tezgahRows.is_emirleri;
        if (typeof aktifListe === 'string') {
          try { aktifListe = JSON.parse(aktifListe); } catch (_) { aktifListe = []; }
        }
        if (Array.isArray(aktifListe) && aktifListe.length > 0) {
          const aktifKayit = aktifListe[0];
          const aktifId = aktifKayit && (aktifKayit.is_emri_id || aktifKayit.isEmriId);
          if (aktifId) {
            const [detay] = await sequelize.query(
              `SELECT is_emri_id, is_emri_no, is_adi, adet, tamamlanan_parca_sayisi
               FROM is_emirleri WHERE is_emri_id = ? LIMIT 1`,
              { replacements: [parseInt(aktifId)], type: sequelize.QueryTypes.SELECT }
            );
            if (detay) {
              return res.json({
                success: true,
                is_emri_id: detay.is_emri_id,
                is_emri_no: detay.is_emri_no,
                is_adi: detay.is_adi,
                toplam_adet: detay.adet,
                tamamlanan_adet: detay.tamamlanan_parca_sayisi || 0,
                kalan_adet: detay.adet - (detay.tamamlanan_parca_sayisi || 0),
                message: 'Aktif iş emri bulundu (tezgah listesi)'
              });
            }
          }
        }
      }
    } catch (e) {
      // JSON okunamadıysa sessizce fallback'e geç
    }

    // 2) Fallback: Tezgaha atanmış aktif iş emrini tablodan seç
    const query = `
      SELECT ie.is_emri_id, ie.is_emri_no, ie.is_adi, ie.adet, ie.tamamlanan_parca_sayisi
      FROM is_emirleri ie
      WHERE ie.tezgah_id = ? 
        AND ie.durum NOT IN ('iptal', 'sipariş verilecek', 'sparişte')
        AND (ie.tamamlanan_parca_sayisi < ie.adet OR ie.tamamlanan_parca_sayisi IS NULL)
      ORDER BY CASE WHEN ie.durum IN ('tezgahta','Uretimde') THEN 0 ELSE 1 END,
               ie.guncelleme_tarihi DESC, ie.oncelik DESC, ie.teslim_tarihi ASC
      LIMIT 1
    `;

    const [results] = await sequelize.query(query, {
      replacements: [parseInt(tezgah_id)]
    });

    if (results.length === 0) {
      // Aktif iş emri yoksa 200 + is_emri_id: 0 dön
      return res.json({
        success: true,
        is_emri_id: 0,
        is_emri_no: null,
        is_adi: null,
        toplam_adet: 0,
        tamamlanan_adet: 0,
        kalan_adet: 0,
        message: 'Aktif iş emri bulunamadı'
      });
    }

    const isEmri = results[0];
    
    res.json({
      success: true,
      is_emri_id: isEmri.is_emri_id,
      is_emri_no: isEmri.is_emri_no,
      is_adi: isEmri.is_adi,
      toplam_adet: isEmri.adet,
      tamamlanan_adet: isEmri.tamamlanan_parca_sayisi || 0,
      kalan_adet: isEmri.adet - (isEmri.tamamlanan_parca_sayisi || 0),
      message: 'Aktif iş emri bulundu'
    });

  } catch (error) {
    console.error('İş emri ID getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İş emri ID getirilirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Database retry utility for SQLITE_BUSY errors
 */
const retryOperation = async (operation, maxRetries = 8, baseDelay = 200) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if ((error.original?.code === 'SQLITE_BUSY' || error.code === 'SQLITE_BUSY') && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(1.5, attempt - 1) + Math.random() * 200;
        console.log(`SQLite busy, retrying in ${delay.toFixed(0)}ms... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

/**
 * Parça işleme tamamlandı bildirimi
 * POST /api/cnc_link/parca-tamamlandi
 */
exports.parcaTamamlandi = async (req, res) => {
  try {
    const {
      tezgah_id,
      is_emri_id,
      baslangic_zamani,
      bitis_zamani,
      isleme_suresi_dakika,
      timestamp,
      esp32_kayit_id
    } = req.body;

    // Gerekli alanları kontrol et
    if (!tezgah_id || !is_emri_id || !baslangic_zamani || !bitis_zamani || !isleme_suresi_dakika) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik: tezgah_id, is_emri_id, baslangic_zamani, bitis_zamani, isleme_suresi_dakika'
      });
    }

    // Veriyi kuyruğa ekle (hızlı yanıt için)
    await esp32DataQueue.add({
      tezgah_id: parseInt(tezgah_id),
      is_emri_id: parseInt(is_emri_id),
      baslangic_zamani,
      bitis_zamani,
      isleme_suresi_dakika: parseInt(isleme_suresi_dakika),
      kayit_zamani: timestamp || new Date(),
      esp32_kayit_id: esp32_kayit_id || null
    });

    // İş emri güncellemesi için ayrı işlem
    await updateIsEmriStats(parseInt(is_emri_id), parseInt(isleme_suresi_dakika));

    return res.json({
      success: true,
      message: 'Parça tamamlama kaydı kuyruğa alındı',
      queue_size: esp32DataQueue.items.length
    });

  } catch (error) {
    console.error('Parça tamamlama hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Parça tamamlama işlemi sırasında hata oluştu',
      error: error.message
    });
  }
};

/**
 * İş emri istatistiklerini güncelle
 */
async function updateIsEmriStats(isEmriId, islemeSuresi) {
  return await retryOperation(async () => {
    const transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      type: Transaction.TYPES.IMMEDIATE
    });

    try {
      // İş emri bilgilerini al
      const isEmriKontrol = await sequelize.query(
        'SELECT is_emri_id, tamamlanan_parca_sayisi FROM is_emirleri WHERE is_emri_id = ?',
        {
          replacements: [isEmriId],
          transaction,
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (isEmriKontrol.length === 0) {
        await transaction.rollback();
        throw new Error('İş emri bulunamadı');
      }

      const isEmri = isEmriKontrol[0];

      // Ortalama süreyi hesapla
      const [ortalamaResult] = await sequelize.query(
        'SELECT AVG(isleme_suresi_dakika) as ortalama_sure FROM parca_isleme_kayitlari WHERE is_emri_id = ?',
        {
          replacements: [isEmriId],
          transaction,
          type: sequelize.QueryTypes.SELECT
        }
      );

      const ortalamaSure = ortalamaResult.ortalama_sure || islemeSuresi;

      // İş emri güncelle
      await sequelize.query(`
        UPDATE is_emirleri
        SET tamamlanan_parca_sayisi = tamamlanan_parca_sayisi + 1,
            toplam_isleme_suresi_dakika = COALESCE(toplam_isleme_suresi_dakika, 0) + ?,
            ortalama_parca_suresi_dakika = ?,
            guncelleme_tarihi = CURRENT_TIMESTAMP
        WHERE is_emri_id = ?
      `, {
        replacements: [islemeSuresi, ortalamaSure, isEmriId],
        transaction
      });

      await transaction.commit();
      console.log(`İş emri ${isEmriId} istatistikleri güncellendi`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });
}

/**
 * Kuyruk durumunu kontrol et
 * GET /api/cnc_link/queue-status
 */
exports.queueStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      queue_size: esp32DataQueue.items.length,
      processing: esp32DataQueue.processing,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Kuyruk durumu hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kuyruk durumu alınamadı',
      error: error.message
    });
  }
};

/**
 * CNC Link sistemi sağlık kontrolü
 * GET /api/cnc_link/health
 */
exports.healthCheck = async (req, res) => {
  try {
    // Veritabanı bağlantısını test et
    await sequelize.authenticate();
    
    // Son 24 saatteki kayıt sayısını kontrol et
    const son24SaatQuery = `
      SELECT COUNT(*) as kayit_sayisi
      FROM parca_isleme_kayitlari 
      WHERE kayit_zamani >= datetime('now', '-24 hours')
    `;

    const [result] = await sequelize.query(son24SaatQuery, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      message: 'CNC Link API sağlıklı çalışıyor',
      timestamp: new Date().toISOString(),
      database_status: 'connected',
      son_24_saat_kayit_sayisi: result.kayit_sayisi || 0,
      version: '1.0.0'
    });

  } catch (error) {
    console.error('CNC Link sağlık kontrolü hatası:', error);
    res.status(500).json({
      success: false,
      message: 'CNC Link API sağlık kontrolünde hata',
      error: error.message
    });
  }
};

/**
 * Tezgah istatistikleri
 * GET /api/cnc_link/stats/:tezgah_id
 */
exports.getTezgahStats = async (req, res) => {
  try {
    const { tezgah_id } = req.params;
    const { tarih } = req.query; // YYYY-MM-DD formatında

    const tarihFiltre = tarih || new Date().toISOString().split('T')[0];

    const statsQuery = `
      SELECT 
        COUNT(*) as gunluk_parca_sayisi,
        SUM(isleme_suresi_dakika) as gunluk_toplam_sure,
        AVG(isleme_suresi_dakika) as gunluk_ortalama_sure,
        MIN(isleme_suresi_dakika) as en_kisa_sure,
        MAX(isleme_suresi_dakika) as en_uzun_sure
      FROM parca_isleme_kayitlari
      WHERE tezgah_id = ? 
        AND DATE(baslangic_zamani) = ?
    `;

    const [stats] = await sequelize.query(statsQuery, {
      replacements: [parseInt(tezgah_id), tarihFiltre],
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      tezgah_id: parseInt(tezgah_id),
      tarih: tarihFiltre,
      istatistikler: {
        gunluk_parca_sayisi: stats.gunluk_parca_sayisi || 0,
        gunluk_toplam_sure_dakika: stats.gunluk_toplam_sure || 0,
        gunluk_ortalama_sure_dakika: parseFloat(stats.gunluk_ortalama_sure || 0).toFixed(2),
        en_kisa_sure_dakika: stats.en_kisa_sure || 0,
        en_uzun_sure_dakika: stats.en_uzun_sure || 0
      }
    });

  } catch (error) {
    console.error('Tezgah istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tezgah istatistikleri alınırken hata oluştu',
      error: error.message
    });
  }
};

module.exports = exports; 