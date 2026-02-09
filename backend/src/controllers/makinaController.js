const { Op } = require('sequelize');
const Makina = require('../models/Makina');
const MakinaSinifi = require('../models/MakinaSinifi'); // Makina sınıfları için
const Parca = require('../models/Parca'); // Parça arama için
const Bom = require('../models/Bom'); // Grup arama için

// Tüm Makinaları listele (filtreleme ve sıralama ile)
exports.listMakinalar = async (req, res) => {
    try {
        const { search, sortBy = 'name', sortDir = 'ASC' } = req.query;
        const where = {};

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { model: { [Op.like]: `%${search}%` } },
                { seri_no: { [Op.like]: `%${search}%` } }
            ];
        }

        const order = [[sortBy, sortDir]];

        const makinalar = await Makina.findAll({ where, order });
        res.status(200).json(makinalar);
    } catch (error) {
        console.error('Makinalar listelenirken hata:', error);
        res.status(500).json({ message: 'Makinalar listelenirken bir hata oluştu', error: error.message });
    }
};

// Tek bir Makina detayını getir
exports.getMakinaDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const makina = await Makina.findByPk(id);
        if (!makina) {
            return res.status(404).json({ message: 'Makina bulunamadı' });
        }
        res.status(200).json(makina);
    } catch (error) {
        console.error('Makina detayı alınırken hata:', error);
        res.status(500).json({ message: 'Makina detayı alınırken bir hata oluştu', error: error.message });
    }
};

// Yeni Makina oluştur
exports.createMakina = async (req, res) => {
    try {
        const { name, description, model, seri_no, uretim_yili, durum, items } = req.body;

        // Gelen items verisinin geçerli bir dizi olduğundan emin olalım
        const validatedItems = Array.isArray(items) ? items : [];

        const newMakina = await Makina.create({
            name,
            description,
            model,
            seri_no,
            uretim_yili,
            durum: durum || 'aktif',
            items: validatedItems // Modeldeki set metodu JSON'a çevirecek
        });
        res.status(201).json(newMakina);
    } catch (error) {
        console.error('Makina oluşturulurken hata:', error);
        res.status(500).json({ message: 'Makina oluşturulurken bir hata oluştu', error: error.message });
    }
};

// Makina güncelle
exports.updateMakina = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, model, seri_no, uretim_yili, durum, items } = req.body;

        const makina = await Makina.findByPk(id);
        if (!makina) {
            return res.status(404).json({ message: 'Güncellenecek makina bulunamadı' });
        }

        // Gelen items verisinin geçerli bir dizi olduğundan emin olalım
        const validatedItems = Array.isArray(items) ? items : [];

        await makina.update({
            name,
            description,
            model,
            seri_no,
            uretim_yili,
            durum,
            items: validatedItems // Modeldeki set metodu JSON'a çevirecek
        });

        // Güncellenmiş makinayı geri döndür
        const updatedMakina = await Makina.findByPk(id);
        res.status(200).json(updatedMakina);
    } catch (error) {
        console.error('Makina güncellenirken hata:', error);
        res.status(500).json({ message: 'Makina güncellenirken bir hata oluştu', error: error.message });
    }
};

// Makina sil
exports.deleteMakina = async (req, res) => {
    try {
        const { id } = req.params;
        const makina = await Makina.findByPk(id);
        if (!makina) {
            return res.status(404).json({ message: 'Silinecek makina bulunamadı' });
        }

        await makina.destroy();
        res.status(200).json({ message: 'Makina başarıyla silindi' });
    } catch (error) {
        console.error('Makina silinirken hata:', error);
        res.status(500).json({ message: 'Makina silinirken bir hata oluştu', error: error.message });
    }
};

// Parça arama (Makina formunda kullanılacak)
exports.searchParts = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where.parcaKodu = { [Op.like]: `%${search}%` };
        }

        const parts = await Parca.findAll({
            where,
            limit: 20,
            attributes: ['parcaKodu', 'tedarikBedeli'] // Sadece gerekli alanları al
        });
        res.status(200).json(parts);
    } catch (error) {
        console.error('Parça aranırken hata:', error);
        res.status(500).json({ message: 'Parça aranırken bir hata oluştu', error: error.message });
    }
};

// BOM (grupları) arama (Makina formunda kullanılacak)
exports.searchBoms = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const boms = await Bom.findAll({
            where,
            limit: 20,
            attributes: ['bom_id', 'name'] // Sadece gerekli alanları al
        });
        res.status(200).json(boms);
    } catch (error) {
        console.error('BOM aranırken hata:', error);
        res.status(500).json({ message: 'BOM aranırken bir hata oluştu', error: error.message });
    }
};

// Makina sınıflarını listele
exports.getMakinaSiniflari = async (req, res) => {
    try {
        const siniflar = await MakinaSinifi.getActiveSiniflar();
        res.status(200).json({
            success: true,
            data: siniflar,
            message: 'Makina sınıfları başarıyla listelendi'
        });
    } catch (error) {
        console.error('Makina sınıfları listelenirken hata:', error);
        res.status(500).json({
            success: false,
            message: 'Makina sınıfları listelenirken bir hata oluştu',
            error: error.message
        });
    }
};