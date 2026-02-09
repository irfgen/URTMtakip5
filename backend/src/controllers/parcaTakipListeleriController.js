const ParcaTakipListesi = require('../models/ParcaTakipListesi');

exports.list = async (req, res) => {
  try {
    const lists = await ParcaTakipListesi.findAll({ order: [['guncelleme_tarihi', 'DESC']] });
    res.json(lists);
  } catch (error) {
    console.error('Parça takip listeleri listelenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const liste = await ParcaTakipListesi.findByPk(id);
    if (!liste) return res.status(404).json({ error: 'Liste bulunamadı' });
    const plain = liste.toJSON();
    if (!Array.isArray(plain.kalemler)) plain.kalemler = [];
    res.json(plain);
  } catch (error) {
    console.error('Parça takip listesi getById hata:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { ad, kalemler = [], aciklama = null } = req.body || {};
    if (!ad || !ad.trim()) return res.status(400).json({ error: 'Liste adı gereklidir' });
    if (!Array.isArray(kalemler)) return res.status(400).json({ error: 'Kalemler dizi olmalıdır' });

    const created = await ParcaTakipListesi.create({ ad: ad.trim(), kalemler, aciklama });
    res.status(201).json(created);
  } catch (error) {
    console.error('Parça takip listesi create hata:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { ad, kalemler, aciklama } = req.body || {};
    const liste = await ParcaTakipListesi.findByPk(id);
    if (!liste) return res.status(404).json({ error: 'Liste bulunamadı' });

    if (typeof ad !== 'undefined') {
      if (!ad || !ad.trim()) return res.status(400).json({ error: 'Liste adı gereklidir' });
      liste.ad = ad.trim();
    }
    if (typeof aciklama !== 'undefined') liste.aciklama = aciklama;
    if (typeof kalemler !== 'undefined') {
      if (!Array.isArray(kalemler)) return res.status(400).json({ error: 'Kalemler dizi olmalıdır' });
      liste.kalemler = kalemler;
    }

    await liste.save();
    res.json(liste);
  } catch (error) {
    console.error('Parça takip listesi update hata:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const liste = await ParcaTakipListesi.findByPk(id);
    if (!liste) return res.status(404).json({ error: 'Liste bulunamadı' });
    await liste.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Parça takip listesi remove hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Üyelik ekleme: kalem push
exports.addItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { parca_kodu, adet = 1, not = '' } = req.body || {};
    if (!parca_kodu) return res.status(400).json({ error: 'parca_kodu gereklidir' });
    // Parça kodunu normalize et (boşlukları sadeleştir ve trimle)
    const temizKod = String(parca_kodu).replace(/\s+/g, ' ').trim();

    const liste = await ParcaTakipListesi.findByPk(id);
    if (!liste) return res.status(404).json({ error: 'Liste bulunamadı' });

    const current = Array.isArray(liste.kalemler) ? liste.kalemler : [];
    const exists = current.some(k => String(k.parca_kodu).replace(/\s+/g, ' ').trim() === temizKod);
    if (!exists) current.push({ parca_kodu: temizKod, adet: parseInt(adet) || 1, not: not || '' });
    liste.kalemler = current;
    await liste.save();
    res.status(201).json(liste);
  } catch (error) {
    console.error('Parça takip listesi addItem hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Üyelik çıkarma: kalem filter
exports.removeItem = async (req, res) => {
  try {
    const { id, parca_kodu } = req.params;
    const temizKod = String(parca_kodu).replace(/\s+/g, ' ').trim();
    const liste = await ParcaTakipListesi.findByPk(id);
    if (!liste) return res.status(404).json({ error: 'Liste bulunamadı' });

    const current = Array.isArray(liste.kalemler) ? liste.kalemler : [];
    const next = current.filter(k => String(k.parca_kodu).replace(/\s+/g, ' ').trim() !== temizKod);
    liste.kalemler = next;
    await liste.save();
    res.status(200).json(liste);
  } catch (error) {
    console.error('Parça takip listesi removeItem hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Çoklu parça için üyelik haritası
exports.membership = async (req, res) => {
  try {
    const idsParam = req.query.kodlar || '';
    const kodlar = idsParam.split(',').map(s => String(s)).filter(s => !!s);
    if (!kodlar.length) return res.json({});

    const lists = await ParcaTakipListesi.findAll();
    const map = {};
    for (const kod of kodlar) map[kod] = [];

    for (const liste of lists) {
      const kalemler = Array.isArray(liste.kalemler) ? liste.kalemler : [];
      const set = new Set(kalemler.map(k => String(k.parca_kodu)));
      kodlar.forEach(kod => {
        if (set.has(kod)) {
          map[kod].push({ id: liste.id, ad: liste.ad });
        }
      });
    }

    res.json(map);
  } catch (error) {
    console.error('Parça takip listesi membership hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tek parça için dahil olunan listeler
exports.byParca = async (req, res) => {
  try {
    const { parcaKodu } = req.params;
    if (!parcaKodu) return res.status(400).json({ error: 'Geçersiz parcaKodu' });

    const lists = await ParcaTakipListesi.findAll();
    const result = lists
      .filter(l => (Array.isArray(l.kalemler) ? l.kalemler : []).some(k => String(k.parca_kodu) === String(parcaKodu)))
      .map(l => ({ id: l.id, ad: l.ad }));

    res.json(result);
  } catch (error) {
    console.error('Parça takip listesi byParca hata:', error);
    res.status(500).json({ error: error.message });
  }
};


