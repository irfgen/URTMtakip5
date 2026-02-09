const TamamlananIs = require('../models/TamamlananIs');
const Tezgah = require('../models/Tezgah');
const IsEmri = require('../models/IsEmri');
const { Op } = require('sequelize');

// Yeni tamamlanan iş kaydı oluştur
exports.createTamamlananIs = async (tezgahId, isEmriNo, islenenAdet, notlar) => {
  try {
    // İş emri ve tezgah bilgilerini al
    const isEmri = await IsEmri.findOne({ where: { is_emri_no: isEmriNo } });
    const tezgah = await Tezgah.findByPk(tezgahId);
    
    if (!isEmri || !tezgah) {
      console.error('Tamamlanan iş kaydı oluştururken tezgah veya iş emri bulunamadı');
      return null;
    }
    
    // İş emri atama tarihini bul (eğer tezgahın is_emirleri listesinde varsa)
    let baslangicTarihi = null;
    const aktifIsEmri = tezgah.is_emirleri?.find(item => item.is_emri_no === isEmriNo);
    if (aktifIsEmri && aktifIsEmri.atama_tarihi) {
      baslangicTarihi = new Date(aktifIsEmri.atama_tarihi);
    }
    
    // Tamamlanan işi oluştur
    const tamamlananIs = await TamamlananIs.create({
      tezgah_id: tezgahId,
      is_emri_id: isEmri.is_emri_id,  // is_emri_id'yi de ekle
      is_emri_no: isEmriNo,
      is_adi: isEmri.is_adi,
      parca_kodu: isEmri.parca_kodu,
      parca_adi: isEmri.parca_adi,
      plan_liste_no: isEmri.plan_liste_no,
      toplam_adet: isEmri.adet,
      islenen_adet: islenenAdet || isEmri.adet,
      baslama_tarihi: baslangicTarihi,
      bitis_tarihi: new Date(),
      notlar: notlar,
      toplam_sure: baslangicTarihi ? hesaplaSure(baslangicTarihi, new Date()) : null
    });
    
    return tamamlananIs;
  } catch (error) {
    console.error('Tamamlanan iş kaydı oluşturma hatası:', error);
    return null;
  }
};

// Tezgaha göre tamamlanan işleri getir
exports.getTamamlananIslerByTezgah = async (req, res) => {
  try {
    const { tezgahId } = req.params;
    
    const tamamlananIsler = await TamamlananIs.findAll({
      where: { tezgah_id: tezgahId },
      order: [['bitis_tarihi', 'DESC']]
    });
    
    return res.status(200).json(tamamlananIsler);
  } catch (error) {
    console.error('Tamamlanan işleri getirme hatası:', error);
    return res.status(500).json({ error: 'Tamamlanan işler getirilirken bir hata oluştu' });
  }
};

// İş emrine göre tamamlanan işleri getir
exports.getTamamlananIslerByIsEmri = async (req, res) => {
  try {
    const { isEmriNo } = req.params;
    
    const tamamlananIsler = await TamamlananIs.findAll({
      where: { is_emri_no: isEmriNo },
      order: [['bitis_tarihi', 'DESC']]
    });
    
    return res.status(200).json(tamamlananIsler);
  } catch (error) {
    console.error('Tamamlanan işleri getirme hatası:', error);
    return res.status(500).json({ error: 'Tamamlanan işler getirilirken bir hata oluştu' });
  }
};

// Tarih aralığına göre tamamlanan işleri getir
exports.getTamamlananIslerByDateRange = async (req, res) => {
  try {
    const { baslangicTarihi, bitisTarihi } = req.query;
    
    let whereClause = {};
    if (baslangicTarihi && bitisTarihi) {
      whereClause.bitis_tarihi = {
        [Op.between]: [new Date(baslangicTarihi), new Date(bitisTarihi)]
      };
    }
    
    const tamamlananIsler = await TamamlananIs.findAll({
      where: whereClause,
      order: [['bitis_tarihi', 'DESC']],
      include: [
        { model: Tezgah, as: 'tezgah', attributes: ['tezgah_id', 'tezgah_tanimi'] }
      ]
    });
    
    return res.status(200).json(tamamlananIsler);
  } catch (error) {
    console.error('Tamamlanan işleri getirme hatası:', error);
    return res.status(500).json({ error: 'Tamamlanan işler getirilirken bir hata oluştu' });
  }
};

// Parça koduna göre tamamlanan işleri getir (Parça üretim geçmişi için)
exports.getTamamlananIslerByParcaKodu = async (req, res) => {
  try {
    const { parcaKodu } = req.params;
    const IslemKaydi = require('../models/IslemKaydi');
    const IsEmri = require('../models/IsEmri');
    
    // 1. Tezgahta tamamlanan işleri getir
    const tamamlananIsler = await TamamlananIs.findAll({
      where: { parca_kodu: parcaKodu },
      order: [['bitis_tarihi', 'DESC']],
      include: [
        { 
          model: Tezgah, 
          as: 'tezgah', 
          attributes: ['tezgah_id', 'tezgah_tanimi'] 
        }
      ]
    });

    // 2. ✅ FASON İŞLEMLERİ: IslemKaydi'den fason işlemleri getir
    const fasonIslemler = await IslemKaydi.findAll({
      where: { 
        islem_yeri: 'fason'
      },
      include: [
        {
          model: IsEmri,
          as: 'is_emri',
          where: { parca_kodu: parcaKodu },
          attributes: ['is_emri_id', 'is_emri_no', 'is_adi', 'parca_kodu', 'adet']
        }
      ],
      order: [['islem_tarihi', 'DESC']]
    });
    
    // Tezgah işlerini formatla
    const formatlanmisTezgahIsleri = tamamlananIsler.map(is => ({
      ...is.toJSON(),
      tezgah_adi: is.tezgah ? is.tezgah.tezgah_tanimi : 'Bilinmeyen Tezgah',
      islem_tipi: 'tezgah_uretim',
      islem_yeri: 'tezgah'
    }));

    // ✅ Fason işlemlerini formatla
    const formatlanmisFasonIslemler = fasonIslemler.map(islem => ({
      id: `fason_${islem.id}`,
      is_emri_no: islem.is_emri ? islem.is_emri.is_emri_no : 'Bilinmiyor',
      is_adi: islem.is_emri ? islem.is_emri.is_adi : 'Fason İş',
      parca_kodu: islem.is_emri ? islem.is_emri.parca_kodu : parcaKodu,
      parca_adi: null,
      plan_liste_no: `Fason - ${islem.fason_tedarikci}`,
      toplam_adet: islem.is_emri ? islem.is_emri.adet : islem.islenen_adet,
      islenen_adet: islem.islenen_adet,
      baslama_tarihi: null,
      bitis_tarihi: islem.islem_tarihi,
      notlar: islem.aciklama,
      toplam_sure: null,
      tezgah_adi: islem.fason_tedarikci || 'Fason',
      islem_tipi: 'fason_teslim',
      islem_yeri: 'fason',
      // Fason özel alanları
      fason_tedarikci: islem.fason_tedarikci,
      fason_is_emri_id: islem.fason_is_emri_id
    }));

    // Tüm işlemleri birleştir ve tarihe göre sırala
    const tumIslemler = [
      ...formatlanmisTezgahIsleri,
      ...formatlanmisFasonIslemler
    ].sort((a, b) => new Date(b.bitis_tarihi) - new Date(a.bitis_tarihi));
    
    return res.status(200).json(tumIslemler);
  } catch (error) {
    console.error('Parça üretim geçmişi getirme hatası:', error);
    return res.status(500).json({ error: 'Parça üretim geçmişi getirilirken bir hata oluştu' });
  }
};

// İki tarih arasındaki süreyi hesapla (saat:dakika:saniye formatında)
function hesaplaSure(baslangic, bitis) {
  const fark = Math.abs(bitis - baslangic); // Milisaniye cinsinden fark
  const toplamDakika = Math.floor(fark / (1000 * 60)); // Toplam dakika
  
  const saat = Math.floor(toplamDakika / 60);
  const dakika = toplamDakika % 60;
  
  return `${saat.toString().padStart(2, '0')}:${dakika.toString().padStart(2, '0')}`;
}

module.exports = exports;
