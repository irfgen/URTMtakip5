const IsEmri = require('../models/IsEmri');
const Parca = require('../models/Parca');
const { Op } = require('sequelize');

// Aktif iş emirlerini getir (sipariş tabı için)
exports.getAktifIsEmirleri = async (req, res) => {
  try {
    console.log('Sipariş tabı için aktif iş emirleri isteniyor...');
    
    // Sipariş ile ilgili durumları veya sipariş dokümanı olan iş emirlerini getir
    const siparisDurumlari = ['sipariş verilecek', 'sparişte'];
    
    const whereConditions = {
      [Op.or]: [
        // Sipariş durumlarındaki iş emirleri
        {
          durum: {
            [Op.in]: siparisDurumlari
          }
        },
        // Sipariş dokümanı olan iş emirleri
        {
          siparis_dokumani_dosya_yolu: {
            [Op.not]: null
          }
        }
      ]
    };
    
    const isEmirleri = await IsEmri.findAll({
      where: whereConditions,
      include: [
        {
          model: Parca,
          as: 'parca',
          required: false
        }
      ],
      order: [['teslim_tarihi', 'ASC'], ['olusturma_tarihi', 'ASC']]
    });
    
    console.log(`Bulunan sipariş iş emri sayısı: ${isEmirleri.length}`);
    
    // Sipariş bilgilerini ekleyerek döndür
    const siparisIsEmirleri = isEmirleri.map(isEmri => {
      const siparisData = {
        ...isEmri.toJSON(),
        // Sipariş bilgilerini ekle
        siparis: {
          siparis_no: isEmri.plan_liste_no || isEmri.is_emri_no,
          musteri_adi: 'Sipariş Müşterisi', // Bu alanlar daha sonra gerçek sipariş modelinden gelecek
          durum: isEmri.durum
        }
      };
      
      return siparisData;
    });
    
    res.json(siparisIsEmirleri);
  } catch (error) {
    console.error('Sipariş iş emirleri getirilirken hata:', error);
    res.status(500).json({ 
      error: 'Sipariş iş emirleri yüklenemedi',
      details: error.message 
    });
  }
};
