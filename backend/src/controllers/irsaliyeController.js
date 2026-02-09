const db = require('../models');
const Irsaliye = db.Irsaliye;
const IrsaliyeKalem = db.IrsaliyeKalem;
const { Op } = require('sequelize');

class IrsaliyeController {
    /**
     * List irsaliyeler with filters and pagination
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

        const { count, rows } = await Irsaliye.findAndCountAll({
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
        const irsaliyeIds = rows.map(r => r.id);
        const kalemStats = await IrsaliyeKalem.findAll({
            attributes: [
                'irsaliye_id',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'kalem_sayisi'],
                [require('sequelize').fn('SUM', require('sequelize').col('miktar')), 'toplam_miktar']
            ],
            where: { irsaliye_id: { [Op.in]: irsaliyeIds } },
            group: ['irsaliye_id'],
            raw: true
        });

        const statsMap = {};
        kalemStats.forEach(stat => {
            statsMap[stat.irsaliye_id] = {
                toplam_kalem: parseInt(stat.kalem_sayisi) || 0,
                toplam_miktar: parseFloat(stat.toplam_miktar) || 0
            };
        });

        const data = rows.map(irsaliye => {
            const json = irsaliye.toJSON();
            return {
                id: json.id,
                irsaliyeNo: json.irsaliye_no,
                irsaliyeTarihi: json.belge_tarih,
                tur: json.belge_tipi === 'gelis' ? 'alis' : 'satis',
                durum: json.durum,
                aciklama: json.aciklama,
                toplamKalem: statsMap[json.id]?.toplam_kalem || 0,
                toplamMiktar: statsMap[json.id]?.toplam_miktar || 0,
                kalemSayisi: statsMap[json.id]?.toplam_kalem || 0,
                firmaAdi: json.tedarikci?.firma_adi || null,
                tedarikciId: json.tedarikci_id,
                createdAt: json.created_at
            };
        });

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
     * Get irsaliye by ID
     */
    async getById(id, user) {
        const irsaliye = await Irsaliye.findByPk(id, {
            include: [
                { association: 'tedarikci', attributes: ['id', 'firma_adi'] },
                { association: 'olusturan', attributes: ['id', 'personel_adi'] },
                { association: 'kilitli_kullanici', attributes: ['id', 'personel_adi'] },
                {
                    association: 'kalemler',
                    include: [
                        { association: 'eslesen_fatura_kalemi' }
                    ]
                }
            ]
        });

        if (!irsaliye) {
            throw new Error('NOT_FOUND');
        }

        // Get lock state
        const lockState = await irsaliye.getLockState(user.id);

        const json = irsaliye.toJSON();
        return {
            id: json.id,
            irsaliyeNo: json.irsaliye_no,
            irsaliyeTarihi: json.belge_tarih,
            tur: json.belge_tipi === 'gelis' ? 'alis' : 'satis',
            durum: json.durum,
            aciklama: json.aciklama,
            toplamKalem: json.toplam_kalem,
            toplamMiktar: json.toplam_miktar,
            firmaAdi: json.tedarikci?.firma_adi || null,
            tedarikciId: json.tedarikci_id,
            createdAt: json.created_at,
            kalemler: json.kalemler,
            lockState
        };
    }

    /**
     * Create new irsaliye
     */
    async create(data, user) {
        const { kalemler, ...irsaliyeData } = data;

        const irsaliye = await Irsaliye.create({
            ...irsaliyeData,
            created_by: user.id
        });

        // Create kalemler if provided
        if (kalemler && kalemler.length > 0) {
            for (const kalem of kalemler) {
                await IrsaliyeKalem.create({
                    stok_kodu: kalem.stok_kodu,
                    mal_hizmet_adi: kalem.mal_hizmet_adi || kalem.parca_adi,  // n8n backward compatibility
                    miktar: kalem.miktar,
                    birim: kalem.birim || 'Adet',
                    aciklama: kalem.aciklama,
                    irsaliye_id: irsaliye.id,
                    tedarikci_id: irsaliye.tedarikci_id
                });
            }
        }

        return this.getById(irsaliye.id, user);
    }

    /**
     * Update irsaliye
     */
    async update(id, data, user) {
        const irsaliye = await Irsaliye.findByPk(id);

        if (!irsaliye) {
            throw new Error('NOT_FOUND');
        }

        // Check lock
        const lockState = await irsaliye.getLockState(user.id);
        if (lockState.state === 'LOCKED_BY_OTHER') {
            const error = new Error('LOCKED_BY_OTHER');
            error.lockedBy = lockState.lockedBy;
            error.lockedAt = lockState.lockedAt;
            throw error;
        }

        const { kalemler, ...irsaliyeData } = data;

        await irsaliye.update(irsaliyeData);

        // Update kalemler if provided
        if (kalemler) {
            // Delete existing kalemler
            await IrsaliyeKalem.destroy({ where: { irsaliye_id: id } });

            // Create new kalemler
            for (const kalem of kalemler) {
                await IrsaliyeKalem.create({
                    stok_kodu: kalem.stok_kodu,
                    mal_hizmet_adi: kalem.mal_hizmet_adi || kalem.parca_adi,  // n8n backward compatibility
                    miktar: kalem.miktar,
                    birim: kalem.birim || 'Adet',
                    aciklama: kalem.aciklama,
                    irsaliye_id: id,
                    tedarikci_id: irsaliye.tedarikci_id
                });
            }
        }

        return this.getById(id, user);
    }

    /**
     * Delete irsaliye
     */
    async delete(id, user) {
        const irsaliye = await Irsaliye.findByPk(id);

        if (!irsaliye) {
            throw new Error('NOT_FOUND');
        }

        // Check if any kalem is matched
        const matchedKalem = await IrsaliyeKalem.findOne({
            where: {
                irsaliye_id: id,
                eslesme_durumu: 1
            }
        });

        if (matchedKalem) {
            throw new Error('HAS_MATCHED_KALEM');
        }

        // Delete kalemler first
        await IrsaliyeKalem.destroy({ where: { irsaliye_id: id } });

        // Delete irsaliye
        await irsaliye.destroy();

        return { success: true };
    }

    /**
     * Get kalemler for irsaliye
     */
    async getKalemler(irsaliyeId) {
        const kalemler = await IrsaliyeKalem.findAll({
            where: { irsaliye_id: irsaliyeId },
            include: [
                { association: 'eslesen_fatura_kalem' }
            ],
            order: [['id', 'ASC']]
        });

        return kalemler;
    }

    /**
     * Add kalem to irsaliye
     */
    async addKalem(irsaliyeId, kalemData, user) {
        const irsaliye = await Irsaliye.findByPk(irsaliyeId);

        if (!irsaliye) {
            throw new Error('NOT_FOUND');
        }

        const kalem = await IrsaliyeKalem.create({
            stok_kodu: kalemData.stok_kodu,
            mal_hizmet_adi: kalemData.mal_hizmet_adi || kalemData.parca_adi,  // n8n backward compatibility
            miktar: kalemData.miktar,
            birim: kalemData.birim || 'Adet',
            aciklama: kalemData.aciklama,
            irsaliye_id: irsaliyeId,
            tedarikci_id: irsaliye.tedarikci_id
        });

        return kalem;
    }

    /**
     * Acquire lock on irsaliye
     */
    async acquireLock(id, userId) {
        const irsaliye = await Irsaliye.findByPk(id);

        if (!irsaliye) {
            throw new Error('NOT_FOUND');
        }

        return await irsaliye.lock(userId);
    }

    /**
     * Release lock on irsaliye
     */
    async releaseLock(id, userId) {
        const irsaliye = await Irsaliye.findByPk(id);

        if (!irsaliye) {
            throw new Error('NOT_FOUND');
        }

        return await irsaliye.unlock(userId);
    }

    /**
     * Force unlock (admin only)
     */
    async forceUnlock(id, adminId, reason) {
        const irsaliye = await Irsaliye.findByPk(id);

        if (!irsaliye) {
            throw new Error('NOT_FOUND');
        }

        const previousLockHolder = irsaliye.locked_by;

        irsaliye.locked_by = null;
        irsaliye.locked_at = null;
        await irsaliye.save();

        // TODO: Log audit trail

        return { previousLockHolder };
    }
}

module.exports = new IrsaliyeController();
