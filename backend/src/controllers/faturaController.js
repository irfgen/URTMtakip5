const db = require('../models');
const Fatura = db.Fatura;
const FaturaKalem = db.FaturaKalem;
const { Op } = require('sequelize');

class FaturaController {
    /**
     * List faturalar with filters and pagination
     */
    async list(filters = {}) {
        const {
            page = 1,
            limit = 20,
            tedarikci_id,
            durum,
            baslangic_tarih,
            bitis_tarih
        } = filters;

        const offset = (page - 1) * limit;

        const where = {};

        if (tedarikci_id) {
            where.tedarikci_id = tedarikci_id;
        }

        if (durum) {
            where.durum = durum;
        }

        if (baslangic_tarih || bitis_tarih) {
            where.belge_tarih = {};
            if (baslangic_tarih) {
                where.belge_tarih[Op.gte] = baslangic_tarih;
            }
            if (bitis_tarih) {
                where.belge_tarih[Op.lte] = bitis_tarih;
            }
        }

        const { count, rows } = await Fatura.findAndCountAll({
            where,
            include: [
                { model: db.Firma, as: 'tedarikci', attributes: ['id', 'firma_adi'] },
                { model: db.Personel, as: 'olusturan', attributes: ['id', 'personel_adi'] },
                { model: db.Personel, as: 'kilitli_kullanici', attributes: ['id', 'personel_adi'] }
            ],
            limit,
            offset,
            order: [['belge_tarih', 'DESC'], ['id', 'DESC']]
        });

        // Calculate aggregate data
        const faturaIds = rows.map(r => r.id);
        const kalemStats = await FaturaKalem.findAll({
            attributes: [
                'fatura_id',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'kalem_sayisi'],
                [require('sequelize').fn('SUM', require('sequelize').col('miktar')), 'toplam_miktar'],
                [require('sequelize').fn('SUM', require('sequelize').col('toplam_tutar')), 'genel_toplam']
            ],
            where: { fatura_id: { [Op.in]: faturaIds } },
            group: ['fatura_id'],
            raw: true
        });

        const statsMap = {};
        kalemStats.forEach(stat => {
            statsMap[stat.fatura_id] = {
                toplam_kalem: parseInt(stat.kalem_sayisi) || 0,
                toplam_miktar: parseFloat(stat.toplam_miktar) || 0,
                genel_toplam: parseFloat(stat.genel_toplam) || 0
            };
        });

        const data = rows.map(fatura => ({
            ...fatura.toJSON(),
            ...statsMap[fatura.id]
        }));

        return {
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get fatura by ID
     */
    async getById(id, user) {
        const fatura = await Fatura.findByPk(id, {
            include: [
                { association: 'tedarikci', attributes: ['id', 'firma_adi'] },
                { association: 'olusturan', attributes: ['id', 'personel_adi'] },
                { association: 'kilitli_kullanici', attributes: ['id', 'personel_adi'] },
                {
                    association: 'kalemler',
                    include: [
                        { association: 'eslesen_irsaliye_kalem' }
                    ]
                }
            ]
        });

        if (!fatura) {
            throw new Error('NOT_FOUND');
        }

        // Get lock state
        const lockState = await fatura.getLockState(user.id);

        return {
            ...fatura.toJSON(),
            lockState
        };
    }

    /**
     * Create new fatura
     */
    async create(data, user) {
        const { kalemler, ...faturaData } = data;

        const fatura = await Fatura.create({
            ...faturaData,
            created_by: user.id
        });

        // Create kalemler if provided
        if (kalemler && kalemler.length > 0) {
            for (const kalem of kalemler) {
                await FaturaKalem.create({
                    stok_kodu: kalem.stok_kodu,
                    mal_hizmet_adi: kalem.mal_hizmet_adi || kalem.parca_adi,  // n8n backward compatibility
                    miktar: kalem.miktar,
                    birim: kalem.birim || 'Adet',
                    birim_fiyat: kalem.birim_fiyat || 0,
                    toplam_tutar: kalem.toplam_tutar || (kalem.miktar * kalem.birim_fiyat),
                    fatura_id: fatura.id,
                    tedarikci_id: fatura.tedarikci_id
                });
            }
        }

        return this.getById(fatura.id, user);
    }

    /**
     * Update fatura
     */
    async update(id, data, user) {
        const fatura = await Fatura.findByPk(id);

        if (!fatura) {
            throw new Error('NOT_FOUND');
        }

        // Check lock
        const lockState = await fatura.getLockState(user.id);
        if (lockState.state === 'LOCKED_BY_OTHER') {
            const error = new Error('LOCKED_BY_OTHER');
            error.lockedBy = lockState.lockedBy;
            error.lockedAt = lockState.lockedAt;
            throw error;
        }

        const { kalemler, ...faturaData } = data;

        await fatura.update(faturaData);

        // Update kalemler if provided
        if (kalemler) {
            // Delete existing kalemler
            await FaturaKalem.destroy({ where: { fatura_id: id } });

            // Create new kalemler
            for (const kalem of kalemler) {
                await FaturaKalem.create({
                    stok_kodu: kalem.stok_kodu,
                    mal_hizmet_adi: kalem.mal_hizmet_adi || kalem.parca_adi,  // n8n backward compatibility
                    miktar: kalem.miktar,
                    birim: kalem.birim || 'Adet',
                    birim_fiyat: kalem.birim_fiyat || 0,
                    toplam_tutar: kalem.toplam_tutar || (kalem.miktar * kalem.birim_fiyat),
                    fatura_id: id,
                    tedarikci_id: fatura.tedarikci_id
                });
            }
        }

        return this.getById(id, user);
    }

    /**
     * Delete fatura
     */
    async delete(id, user) {
        const fatura = await Fatura.findByPk(id);

        if (!fatura) {
            throw new Error('NOT_FOUND');
        }

        // Check if any kalem is matched
        const matchedKalem = await FaturaKalem.findOne({
            where: {
                fatura_id: id,
                eslesme_durumu: 1
            }
        });

        if (matchedKalem) {
            throw new Error('HAS_MATCHED_KALEM');
        }

        // Delete kalemler first
        await FaturaKalem.destroy({ where: { fatura_id: id } });

        // Delete fatura
        await fatura.destroy();

        return { success: true };
    }

    /**
     * Get kalemler for fatura
     */
    async getKalemler(faturaId) {
        const kalemler = await FaturaKalem.findAll({
            where: { fatura_id: faturaId },
            include: [
                { association: 'eslesen_irsaliye_kalem' }
            ],
            order: [['id', 'ASC']]
        });

        return kalemler;
    }

    /**
     * Add kalem to fatura
     */
    async addKalem(faturaId, kalemData, user) {
        const fatura = await Fatura.findByPk(faturaId);

        if (!fatura) {
            throw new Error('NOT_FOUND');
        }

        // Calculate total tutar if not provided
        if (!kalemData.toplam_tutar && kalemData.miktar && kalemData.birim_fiyat) {
            kalemData.toplam_tutar = kalemData.miktar * kalemData.birim_fiyat;
        }

        const kalem = await FaturaKalem.create({
            stok_kodu: kalemData.stok_kodu,
            mal_hizmet_adi: kalemData.mal_hizmet_adi || kalemData.parca_adi,  // n8n backward compatibility
            miktar: kalemData.miktar,
            birim: kalemData.birim || 'Adet',
            birim_fiyat: kalemData.birim_fiyat || 0,
            toplam_tutar: kalemData.toplam_tutar || (kalemData.miktar * kalemData.birim_fiyat),
            fatura_id: faturaId,
            tedarikci_id: fatura.tedarikci_id
        });

        return kalem;
    }

    /**
     * Acquire lock on fatura
     */
    async acquireLock(id, userId) {
        const fatura = await Fatura.findByPk(id);

        if (!fatura) {
            throw new Error('NOT_FOUND');
        }

        return await fatura.lock(userId);
    }

    /**
     * Release lock on fatura
     */
    async releaseLock(id, userId) {
        const fatura = await Fatura.findByPk(id);

        if (!fatura) {
            throw new Error('NOT_FOUND');
        }

        return await fatura.unlock(userId);
    }
}

module.exports = new FaturaController();
