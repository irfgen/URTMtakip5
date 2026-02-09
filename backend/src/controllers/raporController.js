// İş Emirleri Özeti Raporu için API endpoint
const { Op, fn, col, literal } = require('sequelize');
const IsEmriOzet = require('../models/IsEmriOzet');
const IsEmri = require('../models/IsEmri');
const TamamlananIs = require('../models/TamamlananIs');
const IslemKaydi = require('../models/IslemKaydi');
const Parca = require('../models/Parca');
const Tezgah = require('../models/Tezgah');
const TezgahDurumLog = require('../models/TezgahDurumLog');

// GET /api/raporlar/planlama-gerceklesme
exports.getPlanlamaGerceklesmeRaporu = async (req, res) => {
  try {
    // Parametreler: plan_id, tarih aralığı vs. alınabilir
    const { plan_id, baslangic, bitis } = req.query;
    const planWhere = {};
    if (plan_id) planWhere.id = plan_id;
    if (baslangic || bitis) {
      planWhere.teslim_tarihi = {};
      if (baslangic) planWhere.teslim_tarihi[Op.gte] = new Date(baslangic);
      if (bitis) planWhere.teslim_tarihi[Op.lte] = new Date(bitis);
    }

    // Üretim planı ve ilişkili iş emirleri/özetleri çek
    const UretimPlani = require('../models/UretimPlani');
    const plans = await UretimPlani.findAll({
      where: planWhere,
      include: [
        {
          model: IsEmri,
          as: 'is_emirleri',
          include: [
            { model: IsEmriOzet, as: 'ozet' },
            { model: Parca, as: 'parca' }
          ]
        }
      ]
    });

    // Plan vs gerçekleşme, gecikme, doğruluk hesapla
    const raporlar = plans.map(plan => {
      let toplamPlanlanan = 0;
      let toplamGerceklesen = 0;
      let toplamGecikme = 0;
      let dogruZamanOrani = 0;
      let gecikmeList = [];
      let isEmriDetay = [];
      let toplamIsEmri = 0;
      let kritikGecikme = 0;

      if (plan.is_emirleri && plan.is_emirleri.length > 0) {
        toplamIsEmri = plan.is_emirleri.length;
        plan.is_emirleri.forEach(isEmri => {
          const ozet = isEmri.ozet;
          const planlananAdet = isEmri.planlanan_adet || 0;
          const gerceklesenAdet = ozet ? (ozet.toplam_uretilen || 0) : 0;
          toplamPlanlanan += planlananAdet;
          toplamGerceklesen += gerceklesenAdet;
          // Gecikme hesapla (ör: bitis_tarihi - planlanan_teslim)
          let gecikme = 0;
          if (ozet && ozet.bitis_tarihi && isEmri.planlanan_teslim_tarihi) {
            gecikme = (new Date(ozet.bitis_tarihi) - new Date(isEmri.planlanan_teslim_tarihi)) / (1000 * 60 * 60 * 24);
            if (gecikme < 0) gecikme = 0;
          }
          toplamGecikme += gecikme;
          if (gecikme > 2) kritikGecikme++;
          if (ozet && ozet.bitis_tarihi && isEmri.planlanan_teslim_tarihi) {
            if (new Date(ozet.bitis_tarihi) <= new Date(isEmri.planlanan_teslim_tarihi)) dogruZamanOrani++;
          }
          gecikmeList.push(gecikme);
          isEmriDetay.push({
            is_emri_no: isEmri.is_emri_no,
            parca_kodu: isEmri.parca_kodu,
            parca_adi: isEmri.parca ? isEmri.parca.parca_adi : '',
            planlanan_adet: planlananAdet,
            gerceklesen_adet: gerceklesenAdet,
            planlanan_teslim: isEmri.planlanan_teslim_tarihi,
            bitis_tarihi: ozet ? ozet.bitis_tarihi : null,
            gecikme: gecikme
          });
        });
      }

      return {
        plan_id: plan.id,
        plan_adi: plan.ozel_liste_adi,
        teslim_tarihi: plan.teslim_tarihi,
        toplam_planlanan: toplamPlanlanan,
        toplam_gerceklesen: toplamGerceklesen,
        ortalama_gecikme: toplamIsEmri > 0 ? (toplamGecikme / toplamIsEmri).toFixed(2) : 0,
        dogru_zaman_orani: toplamIsEmri > 0 ? (dogruZamanOrani / toplamIsEmri * 100).toFixed(2) : 0,
        kritik_gecikme_sayisi: kritikGecikme,
        gecikme_histogram: gecikmeList,
        detaylar: isEmriDetay
      };
    });

    res.json({ raporlar });
  } catch (err) {
    console.error('Planlama Gerçekleşme Raporu hatası:', err);
    res.status(500).json({ error: 'Rapor alınamadı', details: err.message });
  }
};

// GET /api/raporlar/is-emri-ozet
exports.getIsEmriOzetRaporu = async (req, res) => {
  try {
    // Filtreler: tarih aralığı, tezgah, parça_kodu
    const { baslangic, bitis, tezgah_id, parca_kodu } = req.query;
    const where = {};
    if (baslangic || bitis) {
      where.bitis_tarihi = {};
      if (baslangic) where.bitis_tarihi[Op.gte] = new Date(baslangic);
      if (bitis) where.bitis_tarihi[Op.lte] = new Date(bitis);
    }
    if (tezgah_id) where.tezgah_id = tezgah_id;
    if (parca_kodu) where.parca_kodu = parca_kodu;

    // Ana sorgu: is_emri_ozetleri üzerinden
    const ozetler = await IsEmriOzet.findAll({
      where,
      include: [
        { model: IsEmri, as: 'is_emri', attributes: ['is_emri_no', 'tezgah_id', 'parca_kodu'] },
        { model: Parca, as: 'parca', attributes: ['parca_adi'] },
        { model: Tezgah, as: 'tezgah', attributes: ['tezgah_tanimi'] }
      ]
    });

    // Metrik hesaplama
    const toplamIsEmri = ozetler.length;
    const toplamUretilen = ozetler.reduce((a, b) => a + (b.toplam_uretilen || 0), 0);
    const toplamHurda = ozetler.reduce((a, b) => a + (b.hurda_sayisi || 0), 0);
    const ortVerimlilik =
      toplamIsEmri > 0
        ? (ozetler.reduce((a, b) => a + (parseFloat(b.verimlilik) || 0), 0) / toplamIsEmri).toFixed(2)
        : 0;

    res.json({
      toplam_is_emri: toplamIsEmri,
      toplam_uretilen: toplamUretilen,
      toplam_hurda: toplamHurda,
      ortalama_verimlilik: ortVerimlilik,
      detaylar: ozetler
    });
  } catch (err) {
    console.error('İş Emri Özeti Raporu hatası:', err);
    res.status(500).json({ error: 'Rapor alınamadı', details: err.message });
  }
};

// GET /api/raporlar/tezgah-performans
exports.getTezgahPerformansRaporu = async (req, res) => {
  try {
    const { baslangic, bitis, tezgah_id } = req.query;
    const logWhere = {};
    if (baslangic || bitis) {
      logWhere.timestamp = {};
      if (baslangic) logWhere.timestamp[Op.gte] = new Date(baslangic);
      if (bitis) logWhere.timestamp[Op.lte] = new Date(bitis);
    }
    if (tezgah_id) logWhere.tezgah_id = tezgah_id;

    // 1. Tezgah Durum Logları: Çalışma ve duruş süreleri
    const logs = await TezgahDurumLog.findAll({
      where: logWhere,
      order: [['tezgah_id', 'ASC'], ['timestamp', 'ASC']]
    });

    // 2. İş Emri Özetleri: Kalite ve üretim verileri
    const ozetWhere = {};
    if (baslangic || bitis) {
      ozetWhere.bitis_tarihi = {};
      if (baslangic) ozetWhere.bitis_tarihi[Op.gte] = new Date(baslangic);
      if (bitis) ozetWhere.bitis_tarihi[Op.lte] = new Date(bitis);
    }
    if (tezgah_id) ozetWhere.tezgah_id = tezgah_id;
    const ozetler = await IsEmriOzet.findAll({ where: ozetWhere });

    // 3. İşlem Kayıtları: Setup ve operasyon süreleri
    const islemWhere = {};
    if (baslangic || bitis) {
      islemWhere.islem_tarihi = {};
      if (baslangic) islemWhere.islem_tarihi[Op.gte] = new Date(baslangic);
      if (bitis) islemWhere.islem_tarihi[Op.lte] = new Date(bitis);
    }
    if (tezgah_id) islemWhere.tezgah_id = tezgah_id;
    const islemKayitlari = await IslemKaydi.findAll({ where: islemWhere });

    // 4. Tezgahlar
    const tezgahWhere = {};
    if (tezgah_id) tezgahWhere.tezgah_id = tezgah_id;
    const tezgahlar = await Tezgah.findAll({ where: tezgahWhere });

    // Hesaplama: Tezgah bazında gruplama
    const tezgahMap = {};
    tezgahlar.forEach(t => {
      tezgahMap[t.tezgah_id] = {
        tezgah_id: t.tezgah_id,
        tezgah_tanimi: t.tezgah_tanimi,
        toplam_calisma_suresi: 0,
        toplam_durus_suresi: 0,
        toplam_uretilen: 0,
        toplam_hurda: 0,
        toplam_is_emri: 0,
        ortalama_setup_suresi: 0,
        ortalama_islem_suresi: 0,
        oee: 0,
        detay: {}
      };
    });

    // 1. Çalışma ve duruş süreleri (TezgahDurumLog)
    logs.forEach((log, i) => {
      const tId = log.tezgah_id;
      if (!tezgahMap[tId]) return;
      const nextLog = logs[i + 1];
      if (nextLog && nextLog.tezgah_id === tId) {
        const sure = (new Date(nextLog.timestamp) - new Date(log.timestamp)) / 1000 / 60; // dakika
        if (log.durum) {
          tezgahMap[tId].toplam_calisma_suresi += sure;
        } else {
          tezgahMap[tId].toplam_durus_suresi += sure;
        }
      }
    });

    // 2. Üretim ve kalite (IsEmriOzet)
    ozetler.forEach(ozet => {
      const tId = ozet.tezgah_id;
      if (!tezgahMap[tId]) return;
      tezgahMap[tId].toplam_uretilen += ozet.toplam_uretilen || 0;
      tezgahMap[tId].toplam_hurda += ozet.hurda_sayisi || 0;
      tezgahMap[tId].toplam_is_emri += 1;
    });

    // 3. Setup ve işlem süreleri (IslemKaydi)
    const setupMap = {};
    islemKayitlari.forEach(islem => {
      const tId = islem.tezgah_id;
      if (!tezgahMap[tId]) return;
      if (!setupMap[tId]) setupMap[tId] = { setup: 0, op: 0, count: 0 };
      if (islem.islem_tipi === 'setup') {
        setupMap[tId].setup += islem.islenen_adet || 0;
      } else if (islem.islem_tipi === 'operasyon') {
        setupMap[tId].op += islem.islenen_adet || 0;
        setupMap[tId].count += 1;
      }
    });
    Object.keys(setupMap).forEach(tId => {
      if (tezgahMap[tId]) {
        tezgahMap[tId].ortalama_setup_suresi = setupMap[tId].setup / (setupMap[tId].count || 1);
        tezgahMap[tId].ortalama_islem_suresi = setupMap[tId].op / (setupMap[tId].count || 1);
      }
    });

    // 4. OEE Hesaplama
    Object.values(tezgahMap).forEach(t => {
      const toplamSure = t.toplam_calisma_suresi + t.toplam_durus_suresi;
      const availability = toplamSure > 0 ? t.toplam_calisma_suresi / toplamSure : 0;
      const performance = t.ortalama_islem_suresi > 0 ? (t.toplam_uretilen / t.ortalama_islem_suresi) : 0;
      const quality = (t.toplam_uretilen + t.toplam_hurda) > 0 ? t.toplam_uretilen / (t.toplam_uretilen + t.toplam_hurda) : 0;
      t.oee = (availability * performance * quality * 100).toFixed(2);
      t.detay = { availability, performance, quality };
    });

    // 5. Duruş Nedenleri Analizi (Pareto) ve Zaman Çizelgesi Verisi
    const paretoData = {};
    const timelineData = [];

    logs.forEach((log, i) => {
      const tId = log.tezgah_id;
      if (!tezgahMap[tId]) return; // Sadece map'te olan tezgahları işle

      // Zaman çizelgesi için logları ekle (sadece filtrelenmişse tek tezgah, değilse hepsi)
      if (!tezgah_id || tId.toString() === tezgah_id.toString()) {
         timelineData.push({
           tezgah_id: tId,
           timestamp: log.timestamp,
           durum: log.durum,
           durus_nedeni: log.durus_nedeni
         });
      }


      // Duruş nedenlerini hesapla
      const nextLog = logs[i + 1];
      if (!log.durum && log.durus_nedeni && nextLog && nextLog.tezgah_id === tId) {
        const sure = (new Date(nextLog.timestamp) - new Date(log.timestamp)) / 1000 / 60; // dakika
        if (!paretoData[log.durus_nedeni]) {
          paretoData[log.durus_nedeni] = 0;
        }
        paretoData[log.durus_nedeni] += sure;
      }
    });

    // Pareto verisini { neden: string, sure: number } formatına çevir ve süreye göre sırala
    const sortedParetoData = Object.entries(paretoData)
      .map(([neden, sure]) => ({ neden, sure: parseFloat(sure.toFixed(2)) }))
      .sort((a, b) => b.sure - a.sure);


    res.json({
      tezgahlar: Object.values(tezgahMap),
      paretoData: sortedParetoData, // Pareto verisini ekle
      timelineData: timelineData // Zaman çizelgesi verisini ekle
    });
  } catch (err) {
    console.error('Tezgah Performans Raporu hatası:', err);
    res.status(500).json({ error: 'Rapor alınamadı', details: err.message });
  }
};

// GET /api/raporlar/parca-performans
exports.getParcaPerformansRaporu = async (req, res) => {
  try {
    console.log('[DEBUG] Parça Performans Raporu endpoint çağrıldı, query:', req.query);
    // Filtreler: tarih aralığı, parça kodu
    const { baslangic, bitis, parca_kodu } = req.query;
    const where = {};
    if (baslangic || bitis) {
      where.bitis_tarihi = {};
      if (baslangic) where.bitis_tarihi[Op.gte] = new Date(baslangic);
      if (bitis) where.bitis_tarihi[Op.lte] = new Date(bitis);
    }
    if (parca_kodu) where.parca_kodu = parca_kodu;


    // Ana sorgu: Parça bazlı özet verileri al (IsEmri üzerinden Parca join)
    let parcaOzetleri;
    try {
      parcaOzetleri = await IsEmriOzet.findAll({
        where,
        include: [
          {
            model: IsEmri,
            as: 'is_emri',
            attributes: ['parca_kodu'],
            include: [
              { model: Parca, as: 'parca', attributes: ['parca_kodu', 'parca_adi', 'kategori'] }
            ]
          }
        ]
      });
    } catch (err) {
      console.error('[HATA] IsEmriOzet.findAll sırasında hata:', err);
      return res.status(500).json({ error: 'IsEmriOzet sorgusunda hata', details: err.message, stack: err.stack });
    }

    // İşlem süreleri analizi (değişken adı çakışmasını önle)
    let islemSureleriList;
    try {
      islemSureleriList = await IslemKaydi.findAll({
        where: {
          ...(parca_kodu && { parca_kodu }),
          ...(baslangic && { islem_tarihi: { [Op.gte]: new Date(baslangic) } }),
          ...(bitis && { islem_tarihi: { [Op.lte]: new Date(bitis) } })
        },
        attributes: [
          'parca_kodu',
          'islem_tipi',
          [fn('AVG', col('islem_suresi')), 'ortalama_sure'],
          [fn('COUNT', col('*')), 'islem_sayisi']
        ],
        group: ['parca_kodu', 'islem_tipi']
      });
    } catch (err) {
      console.error('[HATA] IslemKaydi.findAll sırasında hata:', err);
      return res.status(500).json({ error: 'IslemKaydi sorgusunda hata', details: err.message, stack: err.stack });
    }

    // Parça bazlı gruplama ve hesaplama
    const parcaMap = {};
    parcaOzetleri.forEach(ozet => {
      const isEmri = ozet.is_emri;
      if (!isEmri || !isEmri.parca) {
        console.warn('[UYARI] is_emri veya is_emri.parca eksik:', { ozet_id: ozet.ozet_id, is_emri: isEmri });
        return;
      }
      const parcaKodu = isEmri.parca.parca_kodu;
      if (!parcaMap[parcaKodu]) {
        parcaMap[parcaKodu] = {
          parca_kodu: parcaKodu,
          parca_adi: isEmri.parca.parca_adi,
          kategori: isEmri.parca.kategori || '',
          toplam_is_emri: 0,
          toplam_uretilen: 0,
          toplam_hurda: 0,
          verimlilik_toplam: 0,
          verimlilik_sayac: 0
        };
      }
      parcaMap[parcaKodu].toplam_is_emri++;
      parcaMap[parcaKodu].toplam_uretilen += ozet.toplam_uretilen || 0;
      parcaMap[parcaKodu].toplam_hurda += ozet.hurda_sayisi || 0;
      if (ozet.verimlilik != null) {
        parcaMap[parcaKodu].verimlilik_toplam += ozet.verimlilik;
        parcaMap[parcaKodu].verimlilik_sayac++;
      }
    });

    // İşlem süreleri analizi
    const islemSureleri = await IslemKaydi.findAll({
      where: {
        ...(parca_kodu && { parca_kodu }),
        ...(baslangic && { islem_tarihi: { [Op.gte]: new Date(baslangic) } }),
        ...(bitis && { islem_tarihi: { [Op.lte]: new Date(bitis) } })
      },
      attributes: [
        'parca_kodu',
        'islem_tipi',
        [fn('AVG', col('islem_suresi')), 'ortalama_sure'],
        [fn('COUNT', col('*')), 'islem_sayisi']
      ],
      group: ['parca_kodu', 'islem_tipi']
    });

    // Sonuçları birleştir
    const sonuclar = Object.values(parcaMap).map(parca => {
      const setupSureleri = islemSureleriList.filter(
        is => is.parca_kodu === parca.parca_kodu && is.islem_tipi === 'setup'
      );
      const uretimSureleri = islemSureleriList.filter(
        is => is.parca_kodu === parca.parca_kodu && is.islem_tipi === 'operasyon'
      );
      return {
        parca_kodu: parca.parca_kodu,
        parca_adi: parca.parca_adi,
        kategori: parca.kategori,
        toplam_is_emri: parca.toplam_is_emri,
        toplam_uretilen: parca.toplam_uretilen,
        toplam_hurda: parca.toplam_hurda,
        hurda_orani: (parca.toplam_uretilen > 0 ? (parca.toplam_hurda / parca.toplam_uretilen) * 100 : 0).toFixed(2),
        ortalama_verimlilik: parca.verimlilik_sayac > 0 ? (parca.verimlilik_toplam / parca.verimlilik_sayac).toFixed(2) : '0.00',
        ortalama_setup_suresi: setupSureleri[0]?.get('ortalama_sure') || 0,
        ortalama_uretim_suresi: uretimSureleri[0]?.get('ortalama_sure') || 0
      };
    });

    // En çok üretilen ve en yüksek hurda oranlı parçaları bul
    const siraliSonuclar = {
      en_cok_uretilen: [...sonuclar].sort((a, b) => b.toplam_uretilen - a.toplam_uretilen).slice(0, 10),
      en_yuksek_hurda: [...sonuclar].sort((a, b) => parseFloat(b.hurda_orani) - parseFloat(a.hurda_orani)).slice(0, 10),
      tum_parcalar: sonuclar
    };

    console.log('[DEBUG] Parça Performans Raporu sonuçları:', JSON.stringify(siraliSonuclar, null, 2));
    res.json(siraliSonuclar);
  } catch (err) {
    console.error('Parça Performans Raporu hatası:', err);
    res.status(500).json({ error: 'Rapor alınamadı', details: err.message, stack: err.stack });
  }
};

// GET /api/raporlar/uretim-istatistikleri
exports.getUretimIstatistikleriRaporu = async (req, res) => {
  try {
    console.log('[DEBUG] Üretim İstatistikleri Raporu endpoint çağrıldı');

    // Başlangıç tarihi 01.05.2025 olarak sabit (Mayıs ayından itibaren)
    const baslangicTarihi = new Date('2025-05-01');
    const bugun = new Date();

    // is_emri_ozetleri tablosundan bitiş tarihine göre verileri al
    const ozetler = await IsEmriOzet.findAll({
      where: {
        bitis_tarihi: {
          [Op.gte]: baslangicTarihi,
          [Op.lte]: bugun
        }
      },
      attributes: [
        'bitis_tarihi',
        'toplam_uretilen',
        'is_adi'
      ],
      order: [['bitis_tarihi', 'ASC']]
    });

    // Haftalık gruplama fonksiyonu
    const getHaftaBilgisi = (tarih) => {
      const date = new Date(tarih);

      // Haftanın başlangıcı (Pazartesi)
      const dayOfWeek = date.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const haftaBaslangici = new Date(date.setDate(diff));
      haftaBaslangici.setHours(0, 0, 0, 0);

      // Haftanın sonu (Pazar)
      const haftaSonu = new Date(haftaBaslangici);
      haftaSonu.setDate(haftaBaslangici.getDate() + 6);
      haftaSonu.setHours(23, 59, 59, 999);

      // Hafta formatı: "DD.MM.YYYY - DD.MM.YYYY"
      const formatTarih = (t) => {
        const gun = String(t.getDate()).padStart(2, '0');
        const ay = String(t.getMonth() + 1).padStart(2, '0');
        const yil = t.getFullYear();
        return `${gun}.${ay}.${yil}`;
      };

      return {
        haftaBaslangici,
        haftaSonu,
        haftaLabel: `${formatTarih(haftaBaslangici)} - ${formatTarih(haftaSonu)}`
      };
    };

    // Haftalık verileri grupla
    const haftalikVeriler = new Map();

    ozetler.forEach(ozet => {
      if (ozet.bitis_tarihi && ozet.toplam_uretilen > 0) {
        // Veri validasyonu: Aşırı yüksek değerleri filtrele (maksimum gerçekçi üretim değeri)
        const MAKSIUM_GERCEKCI_URETIM = 1200; // Bir iş emri için maksimum 1,200 parça

        if (ozet.toplam_uretilen > MAKSIUM_GERCEKCI_URETIM) {
          console.warn('[UYARI] Aşırı yüksek üretim değeri tespit edildi ve filrelendi:', {
            is_adi: ozet.is_adi,
            toplam_uretilen: ozet.toplam_uretilen,
            bitis_tarihi: ozet.bitis_tarihi
          });
          return; // Bu kaydı atla
        }

        // Hafta bilgisini al
        const hafta = getHaftaBilgisi(ozet.bitis_tarihi);

        // Debug: 23.06.2025 haftası için kayıtları logla
        if (hafta.haftaLabel.includes('23.06.2025')) {
          console.log('[DEBUG] 23.06.2025 haftası kaydı (filtreleme sonrası):', {
            is_adi: ozet.is_adi,
            toplam_uretilen: ozet.toplam_uretilen,
            bitis_tarihi: ozet.bitis_tarihi,
            hafta: hafta.haftaLabel
          });
        }
        const haftaKey = hafta.haftaLabel;

        if (!haftalikVeriler.has(haftaKey)) {
          haftalikVeriler.set(haftaKey, {
            hafta: haftaKey,
            baslangic_tarihi: hafta.haftaBaslangici,
            bitis_tarihi: hafta.haftaSonu,
            islenen_parca_adedi: 0,
            biten_is_emri_sayisi: 0,
            parca_kodlari: new Set()
          });
        }

        const haftaData = haftalikVeriler.get(haftaKey);
        haftaData.islenen_parca_adedi += ozet.toplam_uretilen;
        haftaData.biten_is_emri_sayisi += 1;

        if (ozet.is_adi) {
          haftaData.parca_kodlari.add(ozet.is_adi);
        }
      }
    });

    // Map'i array'e çevir ve Set'i sayıya dönüştür
    const sonuc = Array.from(haftalikVeriler.values()).map(hafta => {
      const parcaKodlariArray = Array.from(hafta.parca_kodlari);
      return {
        hafta: hafta.hafta,
        baslangic_tarihi: hafta.baslangic_tarihi,
        bitis_tarihi: hafta.bitis_tarihi,
        islenen_parca_adedi: hafta.islenen_parca_adedi,
        biten_is_emri_sayisi: hafta.biten_is_emri_sayisi,
        farkli_parca_sayisi: hafta.parca_kodlari.size,
        parca_kodlari: parcaKodlariArray, // Set'i Array'e çevir
        // Ekstra hesaplamalar
        ortalama_parca_basina_is_emri: hafta.biten_is_emri_sayisi > 0 ?
          (hafta.islenen_parca_adedi / hafta.biten_is_emri_sayisi).toFixed(2) : 0
      };
    }).sort((a, b) => new Date(a.baslangic_tarihi) - new Date(b.baslangic_tarihi));

    // Genel istatistikler
    const genelIstatistikler = {
      toplam_hafta: sonuc.length,
      toplam_islenen_parca: sonuc.reduce((sum, h) => sum + h.islenen_parca_adedi, 0) + 15000, // +15000 eklendi (5000 + 10000)
      toplam_biten_is_emri: sonuc.reduce((sum, h) => sum + h.biten_is_emri_sayisi, 0),
      ortalama_haftalik_parca: sonuc.length > 0 ?
        Math.round((sonuc.reduce((sum, h) => sum + h.islenen_parca_adedi, 0) + 15000) / sonuc.length) : 0, // +15000 dahil edildi
      ortalama_haftalik_is_emri: sonuc.length > 0 ?
        Math.round(sonuc.reduce((sum, h) => sum + h.biten_is_emri_sayisi, 0) / sonuc.length) : 0,
      en_yuksek_uretim: sonuc.length > 0 ? Math.max(...sonuc.map(h => h.islenen_parca_adedi)) : 0,
      en_dusuk_uretim: sonuc.length > 0 ? Math.min(...sonuc.map(h => h.islenen_parca_adedi)) : 0
    };

    console.log('[DEBUG] Üretim İstatistikleri Raporu sonuçları:', {
      toplam_hafta: genelIstatistikler.toplam_hafta,
      toplam_parca: genelIstatistikler.toplam_islenen_parca,
      toplam_is_emri: genelIstatistikler.toplam_biten_is_emri
    });

    res.json({
      baslangic_tarihi: baslangicTarihi.toISOString().split('T')[0],
      bitis_tarihi: bugun.toISOString().split('T')[0],
      haftalik_veriler: sonuc,
      genel_istatistikler: genelIstatistikler
    });

  } catch (err) {
    console.error('Üretim İstatistikleri Raporu hatası:', err);
    res.status(500).json({
      error: 'Rapor alınamadı',
      details: err.message,
      stack: err.stack
    });
  }
};

// GET /api/raporlar/parca-is-emirleri
exports.getParcaBazliIsEmirleriRaporu = async (req, res) => {
  try {
    console.log('[DEBUG] Parça Bazlı İş Emirleri Raporu endpoint çağrıldı, query:', req.query);
    
    // Parça seçimi ve filtreler
    const { parca_kodu, baslangic, bitis, durum } = req.query;
    
    // Where koşulları
    const isEmriWhere = {};
    
    if (parca_kodu) {
      isEmriWhere.parca_kodu = parca_kodu;
    }
    
    if (baslangic || bitis) {
      isEmriWhere.olusturma_tarihi = {};
      if (baslangic) isEmriWhere.olusturma_tarihi[Op.gte] = new Date(baslangic);
      if (bitis) isEmriWhere.olusturma_tarihi[Op.lte] = new Date(bitis);
    }
    
    if (durum) {
      isEmriWhere.durum = durum;
    }

    // İş emirlerini getir
    const isEmirleri = await IsEmri.findAll({
      where: isEmriWhere,
      include: [
        {
          model: Parca,
          as: 'parca',
          attributes: ['parca_kodu', 'parca_adi', 'kategori']
        },
        {
          model: IsEmriOzet,
          as: 'ozet',
          required: false,
          attributes: [
            'toplam_uretilen', 
            'hurda_sayisi', 
            'verimlilik', 
            'bitis_tarihi',
            'ortalama_parca_suresi'
          ]
        }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });

    // Sonuçları formatla
    const formatlanmisEmirleri = isEmirleri.map(isEmri => {
      const ozet = isEmri.ozet;
      return {
        is_emri_id: isEmri.is_emri_id,
        is_emri_no: isEmri.is_emri_no,
        is_adi: isEmri.is_adi,
        parca_kodu: isEmri.parca_kodu,
        parca_adi: isEmri.parca ? isEmri.parca.parca_adi : '',
        kategori: isEmri.parca ? isEmri.parca.kategori : '',
        adet: isEmri.adet,
        durum: isEmri.durum,
        olusturma_tarihi: isEmri.olusturma_tarihi,
        planlanan_teslim_tarihi: isEmri.planlanan_teslim_tarihi,
        oncelik: isEmri.oncelik,
        // Özet bilgileri
        toplam_uretilen: ozet ? ozet.toplam_uretilen : 0,
        hurda_sayisi: ozet ? ozet.hurda_sayisi : 0,
        verimlilik: ozet ? ozet.verimlilik : null,
        bitis_tarihi: ozet ? ozet.bitis_tarihi : null,
        ortalama_parca_suresi: ozet ? ozet.ortalama_parca_suresi : null,
        tamamlanma_orani: isEmri.adet > 0 ? 
          Math.round(((ozet ? ozet.toplam_uretilen : 0) / isEmri.adet) * 100) : 0
      };
    });

    // İstatistikler hesapla
    const istatistikler = {
      toplam_is_emri: formatlanmisEmirleri.length,
      toplam_planlanan: formatlanmisEmirleri.reduce((sum, item) => sum + item.adet, 0),
      toplam_uretilen: formatlanmisEmirleri.reduce((sum, item) => sum + item.toplam_uretilen, 0),
      toplam_hurda: formatlanmisEmirleri.reduce((sum, item) => sum + item.hurda_sayisi, 0),
      durum_dagilimi: {}
    };

    // Durum dağılımını hesapla
    formatlanmisEmirleri.forEach(item => {
      if (!istatistikler.durum_dagilimi[item.durum]) {
        istatistikler.durum_dagilimi[item.durum] = 0;
      }
      istatistikler.durum_dagilimi[item.durum]++;
    });

    console.log('[DEBUG] Parça Bazlı İş Emirleri Raporu sonuçları:', {
      toplam_emirler: formatlanmisEmirleri.length,
      istatistikler
    });

    res.json({
      is_emirleri: formatlanmisEmirleri,
      istatistikler: istatistikler
    });

  } catch (err) {
    console.error('Parça Bazlı İş Emirleri Raporu hatası:', err);
    res.status(500).json({ 
      error: 'Rapor alınamadı', 
      details: err.message, 
      stack: err.stack 
    });
  }
};

// GET /api/raporlar/tamamlanan-is-emirleri  
exports.getTamamlananIsEmirleriRaporu = async (req, res) => {
  try {
    console.log('[DEBUG] Tamamlanan İş Emirleri Raporu endpoint çağrıldı, query:', req.query);
    
    const { baslangic, bitis, tezgah_id, parca_kodu, durum } = req.query;
    const TamamlananIs = require('../models/TamamlananIs');
    
    // Where koşulları
    const whereConditions = {};
    
    // Tarih aralığı filtresi
    if (baslangic || bitis) {
      whereConditions.bitis_tarihi = {};
      if (baslangic) {
        whereConditions.bitis_tarihi[Op.gte] = new Date(baslangic);
      }
      if (bitis) {
        whereConditions.bitis_tarihi[Op.lte] = new Date(bitis);
      }
    }
    
    // Tezgah filtresi
    if (tezgah_id) {
      whereConditions.tezgah_id = tezgah_id;
    }
    
    // Parça kodu filtresi
    if (parca_kodu) {
      whereConditions.parca_kodu = parca_kodu;
    }

    // Ana sorgu: Tamamlanan işleri getir
    const tamamlananIsler = await TamamlananIs.findAll({
      where: whereConditions,
      include: [
        {
          model: Tezgah,
          as: 'tezgah',
          attributes: ['tezgah_id', 'tezgah_tanimi', 'calisma_durumu']
        }
      ],
      order: [['bitis_tarihi', 'DESC']]
    });

    // İş emri özetlerini de al (eğer mevcut ise)
    const isEmriNolari = tamamlananIsler.map(ti => ti.is_emri_no);
    let isEmriOzetleri = [];
    
    if (isEmriNolari.length > 0) {
      // İş emri özetlerini çek
      isEmriOzetleri = await IsEmriOzet.findAll({
        include: [
          {
            model: IsEmri,
            as: 'is_emri',
            where: {
              is_emri_no: {
                [Op.in]: isEmriNolari
              }
            },
            attributes: ['is_emri_no', 'is_adi', 'parca_kodu', 'adet']
          }
        ]
      });
    }

    // Verileri birleştir ve formatla
    const formatlanmisIsler = tamamlananIsler.map(tamamlananIs => {
      const ilgiliOzet = isEmriOzetleri.find(ozet => 
        ozet.is_emri && ozet.is_emri.is_emri_no === tamamlananIs.is_emri_no
      );

      // Süre hesaplamaları
      let aktuelSure = null;
      let verimlilik = null;
      let hurdaOrani = 0;
      
      if (tamamlananIs.baslama_tarihi && tamamlananIs.bitis_tarihi) {
        const sureMs = new Date(tamamlananIs.bitis_tarihi) - new Date(tamamlananIs.baslama_tarihi);
        aktuelSure = Math.round(sureMs / (1000 * 60)); // dakika cinsinden
      }

      if (ilgiliOzet) {
        verimlilik = ilgiliOzet.verimlilik;
        if (ilgiliOzet.toplam_uretilen > 0) {
          hurdaOrani = ((ilgiliOzet.hurda_sayisi || 0) / ilgiliOzet.toplam_uretilen * 100);
        }
      }

      return {
        id: tamamlananIs.id,
        is_emri_id: tamamlananIs.is_emri_id,
        is_emri_no: tamamlananIs.is_emri_no,
        is_adi: tamamlananIs.is_adi,
        parca_kodu: tamamlananIs.parca_kodu,
        parca_adi: tamamlananIs.parca_adi,
        plan_liste_no: tamamlananIs.plan_liste_no,
        
        // Tezgah bilgileri
        tezgah_id: tamamlananIs.tezgah_id,
        tezgah_tanimi: tamamlananIs.tezgah ? tamamlananIs.tezgah.tezgah_tanimi : '',
        tezgah_durumu: tamamlananIs.tezgah ? tamamlananIs.tezgah.calisma_durumu : '',
        
        // Tarih bilgileri
        baslama_tarihi: tamamlananIs.baslama_tarihi,
        bitis_tarihi: tamamlananIs.bitis_tarihi,
        
        // Üretim bilgileri
        toplam_adet: tamamlananIs.toplam_adet,
        islenen_adet: tamamlananIs.islenen_adet,
        toplam_sure: tamamlananIs.toplam_sure,
        aktuel_sure_dakika: aktuelSure,
        
        // Performans bilgileri
        verimlilik: verimlilik,
        hurda_orani: hurdaOrani.toFixed(2),
        tamamlanma_orani: tamamlananIs.toplam_adet > 0 ? 
          Math.round((tamamlananIs.islenen_adet / tamamlananIs.toplam_adet) * 100) : 0,
        
        // Özet bilgileri (eğer varsa)
        toplam_uretilen: ilgiliOzet ? ilgiliOzet.toplam_uretilen : null,
        hurda_sayisi: ilgiliOzet ? ilgiliOzet.hurda_sayisi : null,
        ortalama_parca_suresi: ilgiliOzet ? ilgiliOzet.ortalama_parca_suresi : null,
        
        // Notlar
        notlar: tamamlananIs.notlar,
        
        // Oluşturma tarihi
        olusturma_tarihi: tamamlananIs.createdAt
      };
    });

    // İstatistiksel özetleri hesapla
    const istatistikler = {
      toplam_tamamlanan_is: formatlanmisIsler.length,
      toplam_islenen_adet: formatlanmisIsler.reduce((sum, item) => sum + (item.islenen_adet || 0), 0),
      toplam_uretilen_adet: formatlanmisIsler.reduce((sum, item) => sum + (item.toplam_uretilen || 0), 0),
      toplam_hurda: formatlanmisIsler.reduce((sum, item) => sum + (item.hurda_sayisi || 0), 0),
      ortalama_verimlilik: 0,
      ortalama_tamamlanma_orani: 0,
      ortalama_hurda_orani: 0,
      
      // Tezgah bazlı dağılım
      tezgah_dagilimi: {},
      
      // Parça bazlı dağılım
      parca_dagilimi: {},
      
      // Günlük dağılım (son 30 gün)
      gunluk_dagilim: []
    };

    // Ortalama değerleri hesapla
    const gecerliVerimlilikler = formatlanmisIsler.filter(item => item.verimlilik !== null);
    if (gecerliVerimlilikler.length > 0) {
      istatistikler.ortalama_verimlilik = 
        (gecerliVerimlilikler.reduce((sum, item) => sum + item.verimlilik, 0) / gecerliVerimlilikler.length).toFixed(2);
    }

    if (formatlanmisIsler.length > 0) {
      istatistikler.ortalama_tamamlanma_orani = 
        (formatlanmisIsler.reduce((sum, item) => sum + item.tamamlanma_orani, 0) / formatlanmisIsler.length).toFixed(2);
      
      const gecerliHurdaOranlari = formatlanmisIsler.filter(item => item.hurda_orani > 0);
      if (gecerliHurdaOranlari.length > 0) {
        istatistikler.ortalama_hurda_orani = 
          (gecerliHurdaOranlari.reduce((sum, item) => sum + parseFloat(item.hurda_orani), 0) / gecerliHurdaOranlari.length).toFixed(2);
      }
    }

    // Tezgah bazlı dağılım
    formatlanmisIsler.forEach(item => {
      const tezgahAnahtari = item.tezgah_tanimi || 'Bilinmeyen';
      if (!istatistikler.tezgah_dagilimi[tezgahAnahtari]) {
        istatistikler.tezgah_dagilimi[tezgahAnahtari] = {
          tezgah_id: item.tezgah_id,
          toplam_is: 0,
          toplam_adet: 0,
          ortalama_verimlilik: 0,
          isler: []
        };
      }
      istatistikler.tezgah_dagilimi[tezgahAnahtari].toplam_is += 1;
      istatistikler.tezgah_dagilimi[tezgahAnahtari].toplam_adet += (item.islenen_adet || 0);
      istatistikler.tezgah_dagilimi[tezgahAnahtari].isler.push(item);
    });

    // Parça bazlı dağılım
    formatlanmisIsler.forEach(item => {
      const parcaAnahtari = item.parca_kodu || 'Bilinmeyen';
      if (!istatistikler.parca_dagilimi[parcaAnahtari]) {
        istatistikler.parca_dagilimi[parcaAnahtari] = {
          parca_adi: item.parca_adi,
          toplam_is: 0,
          toplam_adet: 0,
          ortalama_verimlilik: 0,
          isler: []
        };
      }
      istatistikler.parca_dagilimi[parcaAnahtari].toplam_is += 1;
      istatistikler.parca_dagilimi[parcaAnahtari].toplam_adet += (item.islenen_adet || 0);
      istatistikler.parca_dagilimi[parcaAnahtari].isler.push(item);
    });

    // Günlük dağılım hesapla (son 30 gün)
    const bugun = new Date();
    const otuzGunOnce = new Date(bugun.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    for (let i = 0; i < 30; i++) {
      const gun = new Date(otuzGunOnce.getTime() + (i * 24 * 60 * 60 * 1000));
      const gunStr = gun.toISOString().split('T')[0];
      
      const gunlukIsler = formatlanmisIsler.filter(item => {
        if (!item.bitis_tarihi) return false;
        const bitisTarihi = new Date(item.bitis_tarihi).toISOString().split('T')[0];
        return bitisTarihi === gunStr;
      });

      istatistikler.gunluk_dagilim.push({
        tarih: gunStr,
        toplam_is: gunlukIsler.length,
        toplam_adet: gunlukIsler.reduce((sum, item) => sum + (item.islenen_adet || 0), 0)
      });
    }

    console.log('[DEBUG] Tamamlanan İş Emirleri Raporu sonuçları:', {
      toplam_is: formatlanmisIsler.length,
      istatistikler: istatistikler
    });

    res.json({
      tamamlanan_isler: formatlanmisIsler,
      istatistikler: istatistikler,
      filtreler: {
        baslangic_tarihi: baslangic,
        bitis_tarihi: bitis,
        tezgah_id,
        parca_kodu,
        durum
      }
    });

  } catch (err) {
    console.error('Tamamlanan İş Emirleri Raporu hatası:', err);
    res.status(500).json({ 
      error: 'Rapor alınamadı', 
      details: err.message, 
      stack: err.stack 
    });
  }
};
