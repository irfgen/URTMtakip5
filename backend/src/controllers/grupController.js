const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Grup = require('../models/Grup');
const Parca = require('../models/Parca');

// Tüm grupları listele
exports.listGruplar = async (req, res) => {
    try {
        const { search, limit = 50 } = req.query;
        const where = {};

        if (search) {
            where[Op.or] = [
                { grup_adi: { [Op.like]: `%${search}%` } },
                { aciklama: { [Op.like]: `%${search}%` } }
            ];
        }

        const gruplar = await Grup.findAll({ 
            where, 
            limit: parseInt(limit),
            order: [['grup_adi', 'ASC']]
        });
        
        res.status(200).json(gruplar);
    } catch (error) {
        console.error('Gruplar listelenirken hata:', error);
        res.status(500).json({ message: 'Gruplar listelenirken bir hata oluştu', error: error.message });
    }
};

// Tek bir grup detayını getir
exports.getGrupDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const grup = await Grup.findByPk(id, {
            include: [
                {
                    model: Parca,
                    as: 'parcalar',
                    through: { attributes: [] } // Sadece parçaları getir, ara tabloyu getirme
                }
            ]
        });
        
        if (!grup) {
            return res.status(404).json({ message: 'Grup bulunamadı' });
        }
        
        res.status(200).json(grup);
    } catch (error) {
        console.error('Grup detayı alınırken hata:', error);
        res.status(500).json({ message: 'Grup detayı alınırken bir hata oluştu', error: error.message });
    }
};

// Yeni grup oluştur
exports.createGrup = async (req, res) => {
    try {
        const { grup_adi, aciklama, parcalar } = req.body;

        const yeniGrup = await Grup.create({
            grup_id: uuidv4(),
            grup_adi,
            aciklama
        });

        // Parçalar eklendiyse ilişkilendirme yap
        if (Array.isArray(parcalar) && parcalar.length > 0) {
            await yeniGrup.setParcalar(parcalar);
        }

        // İlişkili parçalarla birlikte grubu getir
        const grupDetay = await Grup.findByPk(yeniGrup.grup_id, {
            include: [
                {
                    model: Parca,
                    as: 'parcalar',
                    through: { attributes: [] }
                }
            ]
        });
        
        res.status(201).json(grupDetay);
    } catch (error) {
        console.error('Grup oluşturulurken hata:', error);
        res.status(500).json({ message: 'Grup oluşturulurken bir hata oluştu', error: error.message });
    }
};

// Grup güncelle
exports.updateGrup = async (req, res) => {
    try {
        const { id } = req.params;
        const { grup_adi, aciklama, parcalar } = req.body;

        const grup = await Grup.findByPk(id);
        if (!grup) {
            return res.status(404).json({ message: 'Güncellenecek grup bulunamadı' });
        }

        // Grubu güncelle
        await grup.update({
            grup_adi,
            aciklama
        });

        // Parçalar eklendiyse ilişkilendirmeyi güncelle
        if (Array.isArray(parcalar)) {
            await grup.setParcalar(parcalar);
        }

        // İlişkili parçalarla birlikte grubu getir
        const guncelGrup = await Grup.findByPk(id, {
            include: [
                {
                    model: Parca,
                    as: 'parcalar',
                    through: { attributes: [] }
                }
            ]
        });

        res.status(200).json(guncelGrup);
    } catch (error) {
        console.error('Grup güncellenirken hata:', error);
        res.status(500).json({ message: 'Grup güncellenirken bir hata oluştu', error: error.message });
    }
};

// Grup sil
exports.deleteGrup = async (req, res) => {
    try {
        const { id } = req.params;
        
        const grup = await Grup.findByPk(id);
        if (!grup) {
            return res.status(404).json({ message: 'Silinecek grup bulunamadı' });
        }

        await grup.destroy();
        res.status(200).json({ message: 'Grup başarıyla silindi' });
    } catch (error) {
        console.error('Grup silinirken hata:', error);
        res.status(500).json({ message: 'Grup silinirken bir hata oluştu', error: error.message });
    }
};

// Gruba parça ekle/çıkar
exports.updateGrupParcalar = async (req, res) => {
    try {
        const { id } = req.params;
        const { parcaKodlari, islem } = req.body; // islem: 'ekle' veya 'cikar'
        
        const grup = await Grup.findByPk(id);
        if (!grup) {
            return res.status(404).json({ message: 'Grup bulunamadı' });
        }
        
        if (!Array.isArray(parcaKodlari)) {
            return res.status(400).json({ message: 'Parça kodları dizi olmalıdır' });
        }
        
        if (islem === 'ekle') {
            // Parçaları ekle
            await grup.addParcalar(parcaKodlari);
        } else if (islem === 'cikar') {
            // Parçaları çıkar
            await grup.removeParcalar(parcaKodlari);
        } else {
            return res.status(400).json({ message: 'Geçersiz işlem. "ekle" veya "cikar" kullanın' });
        }
        
        // Güncel grup ve parça ilişkilerini getir
        const guncelGrup = await Grup.findByPk(id, {
            include: [
                {
                    model: Parca,
                    as: 'parcalar',
                    through: { attributes: [] }
                }
            ]
        });
        
        res.status(200).json(guncelGrup);
    } catch (error) {
        console.error('Grup parçaları güncellenirken hata:', error);
        res.status(500).json({ message: 'Grup parçaları güncellenirken bir hata oluştu', error: error.message });
    }
};
