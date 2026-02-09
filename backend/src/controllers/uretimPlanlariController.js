const { Op } = require('sequelize');
const UretimPlaniV2 = require('../models/UretimPlaniV2');

exports.list = async (req, res) => {
  try {
    const { search, durum, startDate, endDate, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (durum) where.durum = durum;
    if (startDate || endDate) {
      where.teslim_tarihi = {};
      if (startDate) where.teslim_tarihi[Op.gte] = new Date(startDate);
      if (endDate) where.teslim_tarihi[Op.lte] = new Date(endDate);
    }
    if (search) {
      where[Op.or] = [
        { uretim_plani_adi: { [Op.like]: `%${search}%` } },
        { aciklama: { [Op.like]: `%${search}%` } },
        { durum: { [Op.like]: `%${search}%` } }
      ];
    }

    const result = await UretimPlaniV2.findAndCountAll({
      where,
      order: [['olusturma_tarihi', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ total: result.count, records: result.rows });
  } catch (err) {
    console.error('UretimPlanlari list() hata:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const plan = await UretimPlaniV2.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan bulunamadı' });
    res.json(plan);
  } catch (err) {
    console.error('UretimPlanlari getById() hata:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { uretim_plani_adi, is_emirleri_listesi = [], teslim_tarihi, durum = 'Planlandı', aciklama } = req.body || {};

    if (!uretim_plani_adi) return res.status(400).json({ error: 'uretim_plani_adi zorunludur' });
    if (!teslim_tarihi) return res.status(400).json({ error: 'teslim_tarihi zorunludur' });

    const list = Array.isArray(is_emirleri_listesi) ? is_emirleri_listesi : [];

    const created = await UretimPlaniV2.create({
      uretim_plani_adi,
      is_emirleri_listesi: list,
      teslim_tarihi,
      durum,
      aciklama
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('UretimPlanlari create() hata:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { uretim_plani_adi, is_emirleri_listesi, teslim_tarihi, durum, aciklama } = req.body || {};
    const plan = await UretimPlaniV2.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan bulunamadı' });

    const updates = {};
    if (uretim_plani_adi !== undefined) updates.uretim_plani_adi = uretim_plani_adi;
    if (is_emirleri_listesi !== undefined) updates.is_emirleri_listesi = Array.isArray(is_emirleri_listesi) ? is_emirleri_listesi : [];
    if (teslim_tarihi !== undefined) updates.teslim_tarihi = teslim_tarihi;
    if (durum !== undefined) updates.durum = durum;
    if (aciklama !== undefined) updates.aciklama = aciklama;

    await plan.update(updates);
    res.json(plan);
  } catch (err) {
    console.error('UretimPlanlari update() hata:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await UretimPlaniV2.destroy({ where: { uretim_plani_id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Plan bulunamadı' });
    res.json({ success: true });
  } catch (err) {
    console.error('UretimPlanlari remove() hata:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateItems = async (req, res) => {
  try {
    const { is_emirleri_listesi } = req.body || {};
    const plan = await UretimPlaniV2.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan bulunamadı' });

    if (!Array.isArray(is_emirleri_listesi)) {
      return res.status(400).json({ error: 'is_emirleri_listesi dizi olmalıdır' });
    }
    await plan.update({ is_emirleri_listesi });
    res.json(plan);
  } catch (err) {
    console.error('UretimPlanlari updateItems() hata:', err);
    res.status(500).json({ error: err.message });
  }
};


