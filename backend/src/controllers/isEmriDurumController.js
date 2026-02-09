const IsEmriDurum = require('../models/IsEmriDurum');
const IsEmri = require('../models/IsEmri');
const { Op } = require('sequelize');

const isEmriDurumController = {
  // Tüm durumları listele
  async getAll(req, res) {
    try {
      const durumlar = await IsEmriDurum.findAll({
        where: {
          aktif: true
        },
        order: [['sira_no', 'ASC'], ['durum_adi', 'ASC']]
      });

      // Her durum için kaç adet iş emri olduğunu say
      const durumlarWithCount = await Promise.all(
        durumlar.map(async (durum) => {
          const count = await IsEmri.count({
            where: {
              durum: durum.durum_kodu
            }
          });
          
          return {
            ...durum.toJSON(),
            is_emri_sayisi: count
          };
        })
      );

      res.json(durumlarWithCount);
    } catch (error) {
      console.error('İş emri durumları alınırken hata:', error);
      res.status(500).json({ 
        error: 'İş emri durumları alınırken bir hata oluştu',
        details: error.message 
      });
    }
  },

  // Tek durum getir
  async getById(req, res) {
    try {
      const { id } = req.params;
      const durum = await IsEmriDurum.findByPk(id);

      if (!durum) {
        return res.status(404).json({ error: 'İş emri durumu bulunamadı' });
      }

      // Bu durumda kaç iş emri olduğunu say
      const isEmriSayisi = await IsEmri.count({
        where: {
          durum: durum.durum_kodu
        }
      });

      res.json({
        ...durum.toJSON(),
        is_emri_sayisi: isEmriSayisi
      });
    } catch (error) {
      console.error('İş emri durumu alınırken hata:', error);
      res.status(500).json({ 
        error: 'İş emri durumu alınırken bir hata oluştu',
        details: error.message 
      });
    }
  },

  // Yeni durum oluştur
  async create(req, res) {
    try {
      const { durum_kodu, durum_adi, durum_aciklamasi, renk_kodu, sira_no } = req.body;

      if (!durum_kodu || !durum_adi) {
        return res.status(400).json({ error: 'Durum kodu ve durum adı gereklidir' });
      }

      // Durum kodu benzersizliğini kontrol et
      const mevcutDurum = await IsEmriDurum.findOne({
        where: { durum_kodu }
      });

      if (mevcutDurum) {
        return res.status(400).json({ error: 'Bu durum kodu zaten kullanılıyor' });
      }

      const yeniDurum = await IsEmriDurum.create({
        durum_kodu,
        durum_adi,
        durum_aciklamasi,
        renk_kodu: renk_kodu || '#1976d2',
        sira_no: sira_no || 999,
        sistem_durumu: false
      });

      res.status(201).json(yeniDurum);
    } catch (error) {
      console.error('İş emri durumu oluşturulurken hata:', error);
      res.status(500).json({ 
        error: 'İş emri durumu oluşturulurken bir hata oluştu',
        details: error.message 
      });
    }
  },

  // Durum güncelle
  async update(req, res) {
    try {
      const { id } = req.params;
      const { durum_kodu, durum_adi, durum_aciklamasi, renk_kodu, sira_no, aktif } = req.body;

      const durum = await IsEmriDurum.findByPk(id);

      if (!durum) {
        return res.status(404).json({ error: 'İş emri durumu bulunamadı' });
      }

      // Sistem durumlarının durum kodunu değiştirmeyi engelle
      if (durum.sistem_durumu && durum_kodu && durum_kodu !== durum.durum_kodu) {
        return res.status(400).json({ error: 'Sistem durumlarının kodu değiştirilemez' });
      }

      // Durum kodu değiştiriliyorsa benzersizliğini kontrol et
      if (durum_kodu && durum_kodu !== durum.durum_kodu) {
        const mevcutDurum = await IsEmriDurum.findOne({
          where: { 
            durum_kodu,
            durum_id: { [Op.ne]: id }
          }
        });

        if (mevcutDurum) {
          return res.status(400).json({ error: 'Bu durum kodu zaten kullanılıyor' });
        }
      }

      const updateData = {};
      if (durum_kodu !== undefined) updateData.durum_kodu = durum_kodu;
      if (durum_adi !== undefined) updateData.durum_adi = durum_adi;
      if (durum_aciklamasi !== undefined) updateData.durum_aciklamasi = durum_aciklamasi;
      if (renk_kodu !== undefined) updateData.renk_kodu = renk_kodu;
      if (sira_no !== undefined) updateData.sira_no = sira_no;
      if (aktif !== undefined) updateData.aktif = aktif;

      await durum.update(updateData);

      // Eğer durum kodu değiştiyse, mevcut iş emirlerinin durumunu da güncelle
      if (durum_kodu && durum_kodu !== durum.durum_kodu) {
        await IsEmri.update(
          { durum: durum_kodu },
          { 
            where: { 
              durum: durum.durum_kodu 
            }
          }
        );
      }

      res.json(durum);
    } catch (error) {
      console.error('İş emri durumu güncellenirken hata:', error);
      res.status(500).json({ 
        error: 'İş emri durumu güncellenirken bir hata oluştu',
        details: error.message 
      });
    }
  },

  // Durum sil
  async delete(req, res) {
    try {
      const { id } = req.params;
      const durum = await IsEmriDurum.findByPk(id);

      if (!durum) {
        return res.status(404).json({ error: 'İş emri durumu bulunamadı' });
      }

      // Sistem durumlarını silmeyi engelle
      if (durum.sistem_durumu) {
        return res.status(400).json({ error: 'Sistem durumları silinemez' });
      }

      // Bu durumda iş emri var mı kontrol et
      const isEmriSayisi = await IsEmri.count({
        where: {
          durum: durum.durum_kodu
        }
      });

      if (isEmriSayisi > 0) {
        return res.status(400).json({ 
          error: `Bu durumda ${isEmriSayisi} adet iş emri bulunduğu için silinemez. Önce iş emirlerini başka bir duruma taşıyın.` 
        });
      }

      await durum.destroy();

      res.json({ message: 'İş emri durumu başarıyla silindi' });
    } catch (error) {
      console.error('İş emri durumu silinirken hata:', error);
      res.status(500).json({ 
        error: 'İş emri durumu silinirken bir hata oluştu',
        details: error.message 
      });
    }
  },

  // Durumları yeniden sırala
  async reorder(req, res) {
    try {
      const { durumlar } = req.body; // [{ durum_id: 1, sira_no: 1 }, ...]

      if (!Array.isArray(durumlar)) {
        return res.status(400).json({ error: 'Durumlar array formatında olmalıdır' });
      }

      // Toplu güncelleme yap
      const updatePromises = durumlar.map(({ durum_id, sira_no }) => 
        IsEmriDurum.update(
          { sira_no },
          { where: { durum_id } }
        )
      );

      await Promise.all(updatePromises);

      res.json({ message: 'Durum sıralaması başarıyla güncellendi' });
    } catch (error) {
      console.error('Durum sıralaması güncellenirken hata:', error);
      res.status(500).json({ 
        error: 'Durum sıralaması güncellenirken bir hata oluştu',
        details: error.message 
      });
    }
  },

  // Varsayılan durumları oluştur
  async createDefaults(req, res) {
    try {
      const varsayilanDurumlar = [
        { durum_kodu: 'sipariş verilecek', durum_adi: 'Sipariş Verilecek', renk_kodu: '#f44336', sira_no: 1, sistem_durumu: true },
        { durum_kodu: 'sparişte', durum_adi: 'Siparişte', renk_kodu: '#ff9800', sira_no: 2, sistem_durumu: true },
        { durum_kodu: 'beklemede', durum_adi: 'Beklemede', renk_kodu: '#2196f3', sira_no: 3, sistem_durumu: true },
        { durum_kodu: 'freze', durum_adi: 'Freze', renk_kodu: '#4caf50', sira_no: 4, sistem_durumu: true },
        { durum_kodu: 'torna', durum_adi: 'Torna', renk_kodu: '#9c27b0', sira_no: 5, sistem_durumu: true },
        { durum_kodu: '5 metre', durum_adi: '5 Metre', renk_kodu: '#00bcd4', sira_no: 6, sistem_durumu: true },
        { durum_kodu: '6 metre', durum_adi: '6 Metre', renk_kodu: '#607d8b', sira_no: 7, sistem_durumu: true },
        { durum_kodu: 'kaynak', durum_adi: 'Kaynak', renk_kodu: '#795548', sira_no: 8, sistem_durumu: true },
        { durum_kodu: 'tamamlandı', durum_adi: 'Tamamlandı', renk_kodu: '#8bc34a', sira_no: 9, sistem_durumu: true },
        { durum_kodu: 'iptal', durum_adi: 'İptal', renk_kodu: '#9e9e9e', sira_no: 10, sistem_durumu: true }
      ];

      const oluşturulanDurumlar = [];

      for (const durumData of varsayilanDurumlar) {
        const [durum, created] = await IsEmriDurum.findOrCreate({
          where: { durum_kodu: durumData.durum_kodu },
          defaults: durumData
        });

        if (created) {
          oluşturulanDurumlar.push(durum);
        }
      }

      res.json({
        message: `${oluşturulanDurumlar.length} adet varsayılan durum oluşturuldu`,
        oluşturulan_durumlar: oluşturulanDurumlar
      });
    } catch (error) {
      console.error('Varsayılan durumlar oluşturulurken hata:', error);
      res.status(500).json({ 
        error: 'Varsayılan durumlar oluşturulurken bir hata oluştu',
        details: error.message 
      });
    }
  }
};

module.exports = isEmriDurumController;