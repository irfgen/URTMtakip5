const { Op } = require('sequelize');
const Fason = require('../models/Fason');
const Parca = require('../models/Parca');
const FasonGrup = require('../models/FasonGrup');

// Tüm fason işlerini listele
exports.listFasonlar = async (req, res) => {
    try {
        const { search, sortBy = 'baslangic_tarihi', sortDir = 'DESC' } = req.query;
        const where = {};

        if (search) {
            where[Op.or] = [
                { is_emri_no: { [Op.like]: `%${search}%` } },
                { parca_adi: { [Op.like]: `%${search}%` } },
                { tedarikci: { [Op.like]: `%${search}%` } }
            ];
        }

        const order = [[sortBy, sortDir]];

        const fasonlar = await Fason.findAll({ where, order });
        res.status(200).json(fasonlar);
    } catch (error) {
        console.error('Fason işleri listelenirken hata:', error);
        res.status(500).json({ message: 'Fason işleri listelenirken bir hata oluştu', error: error.message });
    }
};

// Tek bir fason işin detayını getir
exports.getFasonDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const fason = await Fason.findByPk(id);
        if (!fason) {
            return res.status(404).json({ message: 'Fason işi bulunamadı' });
        }
        res.status(200).json(fason);
    } catch (error) {
        console.error('Fason detayı alınırken hata:', error);
        res.status(500).json({ message: 'Fason detayı alınırken bir hata oluştu', error: error.message });
    }
};

// Yeni fason işi oluştur
exports.createFason = async (req, res) => {
    try {
        const { parca_kodu, parca_adi, adet, tedarikci, baslangic_tarihi, teslim_tarihi, durum, maliyet, aciklama, is_emri_no } = req.body;

        // Zorunlu alanların kontrolü
        if (!parca_adi || !adet || !tedarikci || !baslangic_tarihi || !teslim_tarihi || !is_emri_no) {
            return res.status(400).json({ 
                message: 'Eksik veya hatalı bilgi',
                details: 'İş emri no, parça adı, adet, tedarikçi, başlangıç tarihi ve teslim tarihi zorunludur.'
            });
        }

        // Parça kodu varsa geçerli bir parça mı kontrol et
        if (parca_kodu) {
            const parca = await Parca.findByPk(parca_kodu);
            if (!parca) {
                return res.status(400).json({ message: 'Belirtilen parça kodu sistemde bulunamadı.' });
            }
        }

        const yeniFason = await Fason.create({
            is_emri_no,
            parca_kodu,
            parca_adi,
            adet,
            tedarikci,
            baslangic_tarihi,
            teslim_tarihi,
            durum: durum || 'beklemede',
            maliyet,
            aciklama
        });

        res.status(201).json(yeniFason);
    } catch (error) {
        console.error('Fason işi oluşturulurken hata:', error);
        res.status(500).json({ message: 'Fason işi oluşturulurken bir hata oluştu', error: error.message });
    }
};

// Fason işini güncelle
exports.updateFason = async (req, res) => {
    try {
        const { id } = req.params;
        const { parca_kodu, parca_adi, adet, tedarikci, baslangic_tarihi, teslim_tarihi, durum, maliyet, aciklama, is_emri_no } = req.body;

        const fason = await Fason.findByPk(id);
        if (!fason) {
            return res.status(404).json({ message: 'Güncellenecek fason işi bulunamadı' });
        }

        // Zorunlu alanların kontrolü
        if (!parca_adi || !adet || !tedarikci || !baslangic_tarihi || !teslim_tarihi || !is_emri_no) {
            return res.status(400).json({ 
                message: 'Eksik veya hatalı bilgi',
                details: 'İş emri no, parça adı, adet, tedarikçi, başlangıç tarihi ve teslim tarihi zorunludur.'
            });
        }

        // Parça kodu varsa geçerli bir parça mı kontrol et
        if (parca_kodu) {
            const parca = await Parca.findByPk(parca_kodu);
            if (!parca) {
                return res.status(400).json({ message: 'Belirtilen parça kodu sistemde bulunamadı.' });
            }
        }

        await fason.update({
            is_emri_no,
            parca_kodu,
            parca_adi,
            adet,
            tedarikci,
            baslangic_tarihi,
            teslim_tarihi,
            durum,
            maliyet,
            aciklama
        });

        // Güncellenmiş fason işini geri döndür
        const updatedFason = await Fason.findByPk(id);
        res.status(200).json(updatedFason);
    } catch (error) {
        console.error('Fason işi güncellenirken hata:', error);
        res.status(500).json({ message: 'Fason işi güncellenirken bir hata oluştu', error: error.message });
    }
};

// Fason işini sil
exports.deleteFason = async (req, res) => {
    try {
        const { id } = req.params;
        const fason = await Fason.findByPk(id);
        if (!fason) {
            return res.status(404).json({ message: 'Silinecek fason işi bulunamadı' });
        }

        await fason.destroy();
        res.status(200).json({ message: 'Fason işi başarıyla silindi' });
    } catch (error) {
        console.error('Fason işi silinirken hata:', error);
        res.status(500).json({ message: 'Fason işi silinirken bir hata oluştu', error: error.message });
    }
};

// Ham malzeme gönderimi kaydet
exports.hamMalzemeGonder = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            ham_malzeme_miktari, 
            gonderim_irsaliye_no, 
            gonderen_kisi, 
            ham_malzeme_notlar,
            gonderim_tarihi 
        } = req.body;

        const fason = await Fason.findByPk(id);
        if (!fason) {
            return res.status(404).json({ message: 'Fason işi bulunamadı' });
        }

        // Ham malzeme bilgilerini güncelle
        await fason.update({
            ham_malzeme_gonderim_tarihi: gonderim_tarihi || new Date().toISOString().split('T')[0],
            ham_malzeme_durumu: 'gonderildi',
            ham_malzeme_miktari,
            gonderim_irsaliye_no,
            gonderen_kisi,
            ham_malzeme_notlar,
            durum: 'ham_malzeme_gonderildi'
        });

        res.status(200).json({ 
            message: 'Ham malzeme gönderimi kaydedildi', 
            fason: await Fason.findByPk(id)
        });
    } catch (error) {
        console.error('Ham malzeme gönderimi kaydedilirken hata:', error);
        res.status(500).json({ message: 'Ham malzeme gönderimi kaydedilemedi', error: error.message });
    }
};

// Ham malzeme durumunu güncelle
exports.hamMalzemeDurumGuncelle = async (req, res) => {
    try {
        const { id } = req.params;
        const { ham_malzeme_durumu } = req.body;

        const fason = await Fason.findByPk(id);
        if (!fason) {
            return res.status(404).json({ message: 'Fason işi bulunamadı' });
        }

        await fason.update({ ham_malzeme_durumu });

        // Durum değişikliğine göre ana durumu da güncelle
        if (ham_malzeme_durumu === 'teslim_edildi') {
            await fason.update({ durum: 'uretimde' });
        }

        res.status(200).json({ 
            message: 'Ham malzeme durumu güncellendi', 
            fason: await Fason.findByPk(id)
        });
    } catch (error) {
        console.error('Ham malzeme durumu güncellenirken hata:', error);
        res.status(500).json({ message: 'Ham malzeme durumu güncellenemedi', error: error.message });
    }
};