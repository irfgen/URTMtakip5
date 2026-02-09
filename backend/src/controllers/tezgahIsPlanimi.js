const IsEmri = require('../models/IsEmri');
const Tezgah = require('../models/Tezgah');
const Parca = require('../models/Parca');
const { Op } = require('sequelize');

// İstasyon grupları mapping - tasarım dokümanından
const ISTASYONLAR = {
  'BEKLEMEDE': 'Beklemede',
  'TORNALAR': 'Tornalar', 
  'FREZELER': 'Frezeler',
  '3_METRE': '3 Metre',
  '5_METRE': '5 Metre',
  '6_METRE': '6 Metre',
  '8_METRE': '8 Metre'
};

// İş emri durumlarının istasyonlara mapping'i
const durumToIstasyon = (durum) => {
  if (!durum) return 'BEKLEMEDE';

  const normalizedDurum = durum.toLowerCase().trim();

  // Tamamlanmış ve iptal edilmiş işleri istasyonlara koyma - bunlar bitmiş işler
  if (normalizedDurum === 'tamamlandı' || normalizedDurum === 'tamamlanmış' ||
      normalizedDurum === 'iptal' || normalizedDurum === 'siparişte' ||
      normalizedDurum === 'sipariş verilecek' || normalizedDurum === 'fason' ||
      normalizedDurum === 'tezgahta') {
    return null; // Bu işler hiçbir istasyonda gösterilmemeli
  }

  if (normalizedDurum === 'beklemede') return 'BEKLEMEDE';
  if (normalizedDurum.includes('freze')) return 'FREZELER';
  if (normalizedDurum.includes('torna')) return 'TORNALAR';
  if (normalizedDurum.includes('3 metre') || normalizedDurum === '3 metre') return '3_METRE';
  if (normalizedDurum.includes('5 metre') || normalizedDurum === '5 metre') return '5_METRE';
  if (normalizedDurum.includes('6 metre') || normalizedDurum === '6 metre') return '6_METRE';
  if (normalizedDurum.includes('8 metre') || normalizedDurum === '8 metre') return '8_METRE';

  // Sadece bilinmeyen durumları beklemede olarak kabul et
  return 'BEKLEMEDE';
};

// İstasyon renk kodlaması
const getIstasyonColor = (istasyon) => {
  const renkler = {
    'BEKLEMEDE': '#FFF3CD',
    'TORNALAR': '#D4E6F1',  
    'FREZELER': '#D5F4E6',
    '3_METRE': '#F8D7DA',
    '5_METRE': '#F8D7DA',
    '6_METRE': '#F8D7DA',
    '8_METRE': '#F8D7DA'
  };
  return renkler[istasyon] || '#FFFFFF';
};

// İş emirlerini istasyon bazında getir
exports.getTezgahIsPlanimi = async (req, res) => {
  try {
    const { baslangic_tarihi, bitis_tarihi, istasyon, durum } = req.query;

    // Temel where koşulları
    const where = {};
    
    // Tarih filtresi
    if (baslangic_tarihi || bitis_tarihi) {
      where.teslim_tarihi = {};
      if (baslangic_tarihi) {
        where.teslim_tarihi[Op.gte] = new Date(baslangic_tarihi);
      }
      if (bitis_tarihi) {
        where.bitis_tarihi[Op.lte] = new Date(bitis_tarihi);
      }
    }

    // Durum filtresi
    if (durum) {
      where.durum = durum;
    }

    // İstasyon filtresi (durum bazlı)
    if (istasyon) {
      // İstasyona göre durum filtreleme
      const istasyonDurumlari = {
        'BEKLEMEDE': ['beklemede'],
        'TORNALAR': ['torna', 'tornalar'],
        'FREZELER': ['freze', 'frezeler'],
        '3_METRE': ['3 metre'],
        '5_METRE': ['5 metre'],
        '6_METRE': ['6 metre'],
        '8_METRE': ['8 metre']
      };
      
      if (istasyonDurumlari[istasyon]) {
        where.durum = {
          [Op.in]: istasyonDurumlari[istasyon]
        };
      }
    }

    // İş emirlerini getir
    const isEmirleri = await IsEmri.findAll({
      where,
      include: [
        {
          model: Parca,
          as: 'parca',
          attributes: ['parca_kodu', 'parca_adi', 'foto_path']
        }
      ],
      order: [['teslim_tarihi', 'ASC'], ['order', 'ASC']]
    });

    // İstasyon bazında gruplandır
    const istasyonBazinda = {};
    
    // Tüm istasyonları başlat
    Object.keys(ISTASYONLAR).forEach(key => {
      istasyonBazinda[key] = [];
    });

    // İş emirlerini istasyonlara yerleştir
    isEmirleri.forEach(isEmri => {
      const istasyon = durumToIstasyon(isEmri.durum);

      // null istasyonlu iş emirlerini gösterme (tamamlanmış, iptal, fason vb.)
      if (!istasyon) {
        return; // Bu iş emri hiçbir istasyonda gösterilmeyecek
      }

      // İş emri kartı için gerekli bilgileri hazırla
      const kartBilgisi = {
        id: isEmri.is_emri_id,
        is_emri_no: isEmri.is_emri_no,
        is_adi: isEmri.is_adi,
        parca_kodu: isEmri.parca_kodu,
        parca: isEmri.parca,
        adet: isEmri.adet,
        durum: isEmri.durum,
        oncelik: isEmri.oncelik,
        teslim_tarihi: isEmri.teslim_tarihi,
        tahmini_isleme_suresi: isEmri.tahmini_isleme_suresi || 1,
        setup_sayisi: isEmri.setup_sayisi,
        cnc_suresi: isEmri.cnc_suresi,
        istasyon: istasyon,
        istasyon_adi: ISTASYONLAR[istasyon],
        renk: getIstasyonColor(istasyon),
        // Zaman çizelgesi için pozisyon bilgisi
        baslangic_tarihi: isEmri.olusturma_tarihi || new Date(),
        bitis_tarihi: null, // Hesaplanacak
        width: (isEmri.tahmini_isleme_suresi || 1) * 40 + 80, // Temel genişlik + ekstra
        position: 0 // Dinamik olarak hesaplanacak
      };

      istasyonBazinda[istasyon].push(kartBilgisi);
    });

    // Response formatı
    const response = {
      success: true,
      data: istasyonBazinda,
      istasyonlar: ISTASYONLAR,
      toplam_is_emri: isEmirleri.length,
      metadata: {
        baslangic_tarihi: baslangic_tarihi || null,
        bitis_tarihi: bitis_tarihi || null,
        istasyon_filtresi: istasyon || null,
        durum_filtresi: durum || null
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Tezgah iş planı getirilirken hata:', error);
    res.status(500).json({
      error: 'Tezgah iş planı getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

// İş emri güncelleme (pozisyon, istasyon, tahmini süre)
exports.updateTezgahIsEmri = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      istasyon, 
      baslangic_tarihi, 
      tahmini_isleme_suresi,
      durum,
      position
    } = req.body;

    // İş emrini bul
    const isEmri = await IsEmri.findByPk(id);
    if (!isEmri) {
      return res.status(404).json({
        error: 'İş emri bulunamadı'
      });
    }

    // Güncelleme verisi hazırla
    const updateData = {};

    // İstasyon değişikliği varsa durum güncelle
    if (istasyon) {
      const yeniDurum = istasyon.toLowerCase().replace('_', ' ');
      if (yeniDurum !== isEmri.durum) {
        updateData.durum = yeniDurum;
        
        // Hareketlere kaydet
        const hareket = `${new Date().toLocaleString('tr-TR')} - İstasyon değiştirildi: ${ISTASYONLAR[istasyon]}`;
        updateData.hareketler = [...(isEmri.hareketler || []), hareket];
      }
    }

    // Durum değişikliği
    if (durum && durum !== isEmri.durum) {
      updateData.durum = durum;
      const hareket = `${new Date().toLocaleString('tr-TR')} - Durum güncellendi: ${durum}`;
      updateData.hareketler = [...(updateData.hareketler || isEmri.hareketler || []), hareket];
    }

    // Tahmini işleme süresi
    if (tahmini_isleme_suresi && tahmini_isleme_suresi !== isEmri.tahmini_isleme_suresi) {
      updateData.tahmini_isleme_suresi = parseInt(tahmini_isleme_suresi);
      const hareket = `${new Date().toLocaleString('tr-TR')} - Tahmini süre güncellendi: ${tahmini_isleme_suresi} vardiya`;
      updateData.hareketler = [...(updateData.hareketler || isEmri.hareketler || []), hareket];
    }

    // Başlangıç tarihi
    if (baslangic_tarihi) {
      updateData.baslangic_tarihi = new Date(baslangic_tarihi);
    }

    // Pozisyon bilgisi (sıra için)
    if (position !== undefined) {
      updateData.order = parseInt(position);
    }

    // Güncelleme yap
    await isEmri.update(updateData);

    // Güncellenmiş iş emrini döndür
    const guncellenmisIsEmri = await IsEmri.findByPk(id, {
      include: [
        {
          model: Parca,
          as: 'parca',
          attributes: ['parca_kodu', 'parca_adi', 'foto_path']
        }
      ]
    });

    res.json({
      success: true,
      data: guncellenmisIsEmri,
      message: 'İş emri başarıyla güncellendi'
    });

  } catch (error) {
    console.error('İş emri güncellenirken hata:', error);
    res.status(500).json({
      error: 'İş emri güncellenirken bir hata oluştu',
      details: error.message
    });
  }
};

// Toplu iş emri güncelleme (drag & drop için)
exports.bulkUpdateTezgahIsEmirleri = async (req, res) => {
  try {
    const { is_emirleri } = req.body;

    if (!Array.isArray(is_emirleri) || is_emirleri.length === 0) {
      return res.status(400).json({
        error: 'Geçersiz iş emri listesi'
      });
    }

    const guncellenenIsEmirleri = [];

    // Her iş emrini sırayla güncelle
    for (const isEmriData of is_emirleri) {
      const { id, istasyon, baslangic_tarihi, position } = isEmriData;

      const isEmri = await IsEmri.findByPk(id);
      if (!isEmri) {
        console.warn(`İş emri bulunamadı: ${id}`);
        continue;
      }

      const updateData = {};

      // İstasyon değişikliği
      if (istasyon) {
        const yeniDurum = istasyon.toLowerCase().replace('_', ' ');
        if (yeniDurum !== isEmri.durum) {
          updateData.durum = yeniDurum;
          const hareket = `${new Date().toLocaleString('tr-TR')} - Toplu güncelleme: ${ISTASYONLAR[istasyon]}`;
          updateData.hareketler = [...(isEmri.hareketler || []), hareket];
        }
      }

      if (baslangic_tarihi) {
        updateData.baslangic_tarihi = new Date(baslangic_tarihi);
      }

      if (position !== undefined) {
        updateData.order = parseInt(position);
      }

      await isEmri.update(updateData);
      guncellenenIsEmirleri.push(isEmri);
    }

    res.json({
      success: true,
      data: guncellenenIsEmirleri,
      message: `${guncellenenIsEmirleri.length} iş emri başarıyla güncellendi`
    });

  } catch (error) {
    console.error('Toplu güncelleme hatası:', error);
    res.status(500).json({
      error: 'Toplu güncelleme sırasında hata oluştu',
      details: error.message
    });
  }
};