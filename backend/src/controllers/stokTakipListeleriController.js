const { Op } = require('sequelize');
const StokTakipListesi = require('../models/StokTakipListesi');

exports.list = async (req, res) => {
  try {
    const lists = await StokTakipListesi.findAll({ order: [['guncelleme_tarihi', 'DESC']] });
    res.json(lists);
  } catch (error) {
    console.error('Stok takip listeleri listelenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const liste = await StokTakipListesi.findByPk(id);
    if (!liste) return res.status(404).json({ error: 'Liste bulunamadı' });
    // Güvenlik amaçlı: kalemler dizi değilse normalize et
    const plain = liste.toJSON();
    if (!Array.isArray(plain.kalemler)) plain.kalemler = [];
    res.json(plain);
  } catch (error) {
    console.error('Stok takip listesi getById hata:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { ad, kalemler = [], aciklama = null } = req.body || {};
    if (!ad || !ad.trim()) return res.status(400).json({ error: 'Liste adı gereklidir' });
    if (!Array.isArray(kalemler)) return res.status(400).json({ error: 'Kalemler dizi olmalıdır' });

    const created = await StokTakipListesi.create({ ad: ad.trim(), kalemler, aciklama });
    res.status(201).json(created);
  } catch (error) {
    console.error('Stok takip listesi create hata:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { ad, kalemler, aciklama } = req.body || {};
    const liste = await StokTakipListesi.findByPk(id);
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
    console.error('Stok takip listesi update hata:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const liste = await StokTakipListesi.findByPk(id);
    if (!liste) return res.status(404).json({ error: 'Liste bulunamadı' });
    await liste.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Stok takip listesi remove hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Üyelik ekleme: kalem push
exports.addItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { stok_karti_id, adet = 1, not = '' } = req.body || {};
    if (!stok_karti_id) return res.status(400).json({ error: 'stok_karti_id gereklidir' });

    const liste = await StokTakipListesi.findByPk(id);
    if (!liste) return res.status(404).json({ error: 'Liste bulunamadı' });

    const current = Array.isArray(liste.kalemler) ? liste.kalemler : [];
    const exists = current.some(k => parseInt(k.stok_karti_id) === parseInt(stok_karti_id));
    if (!exists) current.push({ stok_karti_id: parseInt(stok_karti_id), adet: parseInt(adet) || 1, not: not || '' });
    liste.kalemler = current;
    await liste.save();
    res.status(201).json(liste);
  } catch (error) {
    console.error('Stok takip listesi addItem hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Üyelik çıkarma: kalem filter
exports.removeItem = async (req, res) => {
  try {
    const { id, stok_karti_id } = req.params;
    const liste = await StokTakipListesi.findByPk(id);
    if (!liste) return res.status(404).json({ error: 'Liste bulunamadı' });

    const current = Array.isArray(liste.kalemler) ? liste.kalemler : [];
    const next = current.filter(k => parseInt(k.stok_karti_id) !== parseInt(stok_karti_id));
    liste.kalemler = next;
    await liste.save();
    res.status(200).json(liste);
  } catch (error) {
    console.error('Stok takip listesi removeItem hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Çoklu stok kartı için üyelik haritası
exports.membership = async (req, res) => {
  try {
    const idsParam = req.query.ids || '';
    const ids = idsParam.split(',').map(s => parseInt(s)).filter(n => Number.isInteger(n));
    if (!ids.length) return res.json({});

    const lists = await StokTakipListesi.findAll();
    const map = {};
    for (const id of ids) map[id] = [];

    for (const liste of lists) {
      const kalemler = Array.isArray(liste.kalemler) ? liste.kalemler : [];
      const set = new Set(kalemler.map(k => parseInt(k.stok_karti_id)));
      ids.forEach(sid => {
        if (set.has(sid)) {
          map[sid].push({ id: liste.id, ad: liste.ad });
        }
      });
    }

    res.json(map);
  } catch (error) {
    console.error('Stok takip listesi membership hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tek stok kartı için dahil olunan listeler
exports.byStokKarti = async (req, res) => {
  try {
    const { stokKartiId } = req.params;
    const idNum = parseInt(stokKartiId);
    if (!Number.isInteger(idNum)) return res.status(400).json({ error: 'Geçersiz stokKartiId' });

    const lists = await StokTakipListesi.findAll();
    const result = lists
      .filter(l => (Array.isArray(l.kalemler) ? l.kalemler : []).some(k => parseInt(k.stok_karti_id) === idNum))
      .map(l => ({ id: l.id, ad: l.ad }));

    res.json(result);
  } catch (error) {
    console.error('Stok takip listesi byStokKarti hata:', error);
    res.status(500).json({ error: error.message });
  }
};


