const db = require('../models');
const Fatura = db.Fatura;
const FaturaKalem = db.FaturaKalem;
const Irsaliye = db.Irsaliye;
const IrsaliyeKalem = db.IrsaliyeKalem;
const { sequelize, QueryTypes } = require('../config/database');
const { Op } = require('sequelize');

class EslestirmeController {
    /**
     * Get matching suggestions for a fatura
     */
    async getOneriler(faturaId) {
        const fatura = await Fatura.findByPk(faturaId);
        if (!fatura) {
            throw new Error('NOT_FOUND');
        }

        // Eşleştirme kriterleri:
        // 1. Aynı tedarikçi_id ZORUNLU
        // 2. Her iki taraf da eslesme_durumu = 0 (bekliyor) ZORUNLU
        // 3. mal_hizmet_adi tam eşleşmesi ZORUNLU (case-insensitive, trim)
        // 4. stok_kodu bilgi amaçlı (eşleşme zorunlu değil)

        const oneriler = await sequelize.query(`
            SELECT
                fk.id as fatura_kalem_id,
                fk.fatura_id,
                fk.stok_kodu,
                fk.mal_hizmet_adi,
                fk.miktar as fatura_miktar,
                fk.birim_fiyat,
                fk.toplam_tutar,
                ik.id as irsaliye_kalem_id,
                ik.irsaliye_id,
                ik.miktar as irsaliye_miktar,
                ik.birim as irsaliye_birim,
                i.irsaliye_no,
                i.belge_tarih as irsaliye_tarih,
                i.tedarikci_id,
                t.firma_adi as tedarikci_adi,
                ABS(fk.miktar - ik.miktar) as miktar_farki,
                CASE
                    WHEN ABS(fk.miktar - ik.miktar) < 0.01 THEN 'tam'
                    ELSE 'kismi'
                END as eslesme_tipi,
                CASE
                    WHEN ABS(fk.miktar - ik.miktar) < 0.01 THEN 1
                    ELSE 2
                END as oncelik,
                -- Stok kodu eşleşme skoru (bilgi amaçlı)
                CASE
                    WHEN fk.stok_kodu IS NOT NULL
                         AND ik.stok_kodu IS NOT NULL
                         AND LOWER(TRIM(fk.stok_kodu)) = LOWER(TRIM(ik.stok_kodu))
                    THEN 1
                    ELSE 0
                END as stok_kodu_eslesiyor
            FROM fatura_kalemleri fk
            INNER JOIN faturalar f ON fk.fatura_id = f.id
            INNER JOIN irsaliye_kalemleri ik
                ON fk.tedarikci_id = ik.tedarikci_id
                AND ik.eslesme_durumu = 0
                AND LOWER(TRIM(fk.mal_hizmet_adi)) = LOWER(TRIM(ik.mal_hizmet_adi))
            INNER JOIN irsaliyeler i ON ik.irsaliye_id = i.id
            INNER JOIN firmalar t ON fk.tedarikci_id = t.id
            WHERE fk.fatura_id = ?
                AND fk.eslesme_durumu = 0
            ORDER BY oncelik ASC, i.belge_tarih DESC
        `, {
            replacements: [faturaId],
            type: QueryTypes.SELECT
        });

        return oneriler.map(oneri => ({
            faturaKalem: {
                id: oneri.fatura_kalem_id,
                fatura_id: oneri.fatura_id,
                stok_kodu: oneri.stok_kodu,
                mal_hizmet_adi: oneri.mal_hizmet_adi,
                miktar: oneri.fatura_miktar,
                birim_fiyat: oneri.birim_fiyat,
                toplam_tutar: oneri.toplam_tutar
            },
            irsaliyeKalem: {
                id: oneri.irsaliye_kalem_id,
                irsaliye_id: oneri.irsaliye_id,
                miktar: oneri.irsaliye_miktar,
                birim: oneri.irsaliye_birim
            },
            irsaliye: {
                id: oneri.irsaliye_id,
                irsaliye_no: oneri.irsaliye_no,
                belge_tarih: oneri.irsaliye_tarih,
                tedarikci_id: oneri.tedarikci_id
            },
            tedarikci: {
                id: oneri.tedarikci_id,
                adi: oneri.tedarikci_adi
            },
            eslesmeTipi: oneri.eslesme_tipi,
            miktarFarki: oneri.miktar_farki,
            oncelik: oneri.oncelik
        }));
    }

    /**
     * Confirm matching
     */
    async onayla(faturaId, eslestirmeler, userId, io) {
        const transaction = await sequelize.transaction();

        try {
            // Validate all matches first
            const validationErrors = [];
            for (const eslestirme of eslestirmeler) {
                const miktarFarki = Math.abs(
                    eslestirme.fatura_miktar - eslestirme.irsaliye_miktar
                );

                if (miktarFarki > 0.01 && !eslestirme.neden) {
                    validationErrors.push({
                        fatura_kalem_id: eslestirme.fatura_kalem_id,
                        error: 'Miktar farkı için neden belirtilmelidir'
                    });
                }
            }

            if (validationErrors.length > 0) {
                throw {
                    name: 'ValidationError',
                    details: validationErrors
                };
            }

            // Apply all matches
            for (const eslestirme of eslestirmeler) {
                await FaturaKalem.update(
                    {
                        eslesme_durumu: 1,
                        eslesen_irsaliye_kalem_id: eslestirme.irsaliye_kalem_id
                    },
                    {
                        where: { id: eslestirme.fatura_kalem_id },
                        transaction
                    }
                );

                await IrsaliyeKalem.update(
                    {
                        eslesme_durumu: 1,
                        eslesen_fatura_kalem_id: eslestirme.fatura_kalem_id
                    },
                    {
                        where: { id: eslestirme.irsaliye_kalem_id },
                        transaction
                    }
                );

                // TODO: Audit log
            }

            // Update document status
            await this._eslestirmeDurumGuncelle(faturaId, transaction);

            await transaction.commit();

            // Emit Socket.IO event only after successful commit
            if (io) {
                io.of('/fatura-eslestirme').emit('eslestirme-tamamlandi', {
                    faturaId,
                    itemCount: eslestirmeler.length,
                    performedBy: userId
                });
            }

            return { success: true, itemCount: eslestirmeler.length };

        } catch (error) {
            await transaction.rollback();

            if (error.name === 'ValidationError') {
                throw error;
            }

            throw error;
        }
    }

    /**
     * Reject matching
     */
    async reddet(faturaKalemId, irsaliyeKalemId, neden, userId) {
        // TODO: Implement rejection logic
        // This could be logged for analytics
        return { success: true };
    }

    /**
     * Manual matching
     */
    async manuelEslestirme(faturaKalemId, irsaliyeKalemId, neden, userId, io) {
        const transaction = await sequelize.transaction();

        try {
            const faturaKalem = await FaturaKalem.findByPk(faturaKalemId, {
                transaction
            });

            const irsaliyeKalem = await IrsaliyeKalem.findByPk(irsaliyeKalemId, {
                transaction
            });

            if (!faturaKalem || !irsaliyeKalem) {
                throw new Error('NOT_FOUND');
            }

            if (faturaKalem.eslesme_durumu === 1 || irsaliyeKalem.eslesme_durumu === 1) {
                throw new Error('ALREADY_MATCHED');
            }

            // Update both sides
            await FaturaKalem.update(
                {
                    eslesme_durumu: 1,
                    eslesen_irsaliye_kalem_id: irsaliyeKalemId
                },
                {
                    where: { id: faturaKalemId },
                    transaction
                }
            );

            await IrsaliyeKalem.update(
                {
                    eslesme_durumu: 1,
                    eslesen_fatura_kalem_id: faturaKalemId
                },
                {
                    where: { id: irsaliyeKalemId },
                    transaction
                }
            );

            // Update document status
            await this._eslestirmeDurumGuncelle(faturaKalem.fatura_id, transaction);

            await transaction.commit();

            // Emit Socket.IO event
            if (io) {
                io.of('/fatura-eslestirme').emit('eslestirme-tamamlandi', {
                    faturaId: faturaKalem.fatura_id,
                    itemCount: 1,
                    performedBy: userId
                });
            }

            return { success: true };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Remove matching
     */
    async eslestirmeKaldir(faturaKalemId, neden, userId, io) {
        const transaction = await sequelize.transaction();

        try {
            const faturaKalem = await FaturaKalem.findByPk(faturaKalemId, {
                transaction
            });

            if (!faturaKalem) {
                throw new Error('NOT_FOUND');
            }

            if (faturaKalem.eslesme_durumu === 0) {
                throw new Error('NOT_MATCHED');
            }

            const irsaliyeKalemId = faturaKalem.eslesen_irsaliye_kalem_id;

            // Reset both sides
            await FaturaKalem.update(
                {
                    eslesme_durumu: 0,
                    eslesen_irsaliye_kalem_id: null
                },
                {
                    where: { id: faturaKalemId },
                    transaction
                }
            );

            if (irsaliyeKalemId) {
                await IrsaliyeKalem.update(
                    {
                        eslesme_durumu: 0,
                        eslesen_fatura_kalem_id: null
                    },
                    {
                        where: { id: irsaliyeKalemId },
                        transaction
                    }
                );
            }

            // Update document status
            await this._eslestirmeDurumGuncelle(faturaKalem.fatura_id, transaction);

            await transaction.commit();

            // Emit Socket.IO event
            if (io) {
                io.of('/fatura-eslestirme').emit('eslestirme-kaldirildi', {
                    faturaKalemId,
                    performedBy: userId
                });
            }

            return { success: true };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get matching status for fatura
     */
    async getDurum(faturaId) {
        const fatura = await Fatura.findByPk(faturaId);

        if (!fatura) {
            throw new Error('NOT_FOUND');
        }

        const kalemler = await FaturaKalem.findAll({
            where: { fatura_id: faturaId },
            attributes: [
                'eslesme_durumu',
                [db.fn('COUNT', db.col('id')), 'count']
            ],
            group: ['eslesme_durumu'],
            raw: true
        });

        const stats = {
            toplam: 0,
            eslesmis: 0,
            bekleyen: 0
        };

        kalemler.forEach(k => {
            stats.toplam += parseInt(k.count);
            if (k.eslesme_durumu === 1) {
                stats.eslesmis += parseInt(k.count);
            } else {
                stats.bekleyen += parseInt(k.count);
            }
        });

        return {
            faturaId,
            durum: fatura.durum,
            ...stats
        };
    }

    /**
     * Get matching status for fatura
     */
    async getDurum(faturaId) {
        const fatura = await Fatura.findByPk(faturaId);

        if (!fatura) {
            throw new Error('NOT_FOUND');
        }

        const kalemler = await FaturaKalem.findAll({
            where: { fatura_id: faturaId },
            attributes: [
                'eslesme_durumu',
                [db.fn('COUNT', db.col('id')), 'count']
            ],
            group: ['eslesme_durumu'],
            raw: true
        });

        const stats = {
            toplam: 0,
            eslesmis: 0,
            bekleyen: 0
        };

        kalemler.forEach(k => {
            stats.toplam += parseInt(k.count);
            if (k.eslesme_durumu === 1) {
                stats.eslesmis += parseInt(k.count);
            } else {
                stats.bekleyen += parseInt(k.count);
            }
        });

        return {
            faturaId,
            durum: fatura.durum,
            ...stats
        };
    }

    /**
     * Get grouped suggestions for each fatura kalem
     * Returns fatura info with kalemler and their matched/suggested irsaliye items
     */
    async getGrupluOneriler(faturaId) {
        // Get fatura with tedarikci
        const fatura = await Fatura.findByPk(faturaId, {
            include: [
                {
                    model: db.Firma,
                    as: 'tedarikci',
                    attributes: ['id', 'firma_adi']
                }
            ]
        });

        if (!fatura) {
            throw new Error('NOT_FOUND');
        }

        // Get all fatura kalemler with matched irsaliye
        const faturaKalemleri = await FaturaKalem.findAll({
            where: { fatura_id: faturaId },
            include: [
                {
                    association: 'eslesen_irsaliye_kalem',
                    include: [
                        {
                            association: 'irsaliye',
                            attributes: ['id', 'irsaliye_no', 'belge_tarih', 'tedarikci_id']
                        }
                    ]
                }
            ],
            order: [['id', 'ASC']]
        });

        // For each kalem, get suggestions
        const kalemlerWithOneriler = [];

        for (const kalem of faturaKalemleri) {
            const kalemData = kalem.toJSON();

            // If already matched, get the matched irsaliye details
            let eslesenIrsaliyeKalem = null;
            if (kalem.eslesen_irsaliye_kalem) {
                eslesenIrsaliyeKalem = kalem.eslesen_irsaliye_kalem;
            }

            // Get suggestions for unmatched items
            let oneriler = [];
            if (kalem.eslesme_durumu === 0) {
                // Use the existing getOneriler query logic for this kalem
                const onerilerRaw = await sequelize.query(`
                    SELECT
                        ik.id as irsaliye_kalem_id,
                        ik.irsaliye_id,
                        ik.stok_kodu as irsaliye_stok_kodu,
                        ik.mal_hizmet_adi as irsaliye_mal_hizmet_adi,
                        ik.miktar as irsaliye_miktar,
                        ik.birim as irsaliye_birim,
                        i.irsaliye_no,
                        i.belge_tarih as irsaliye_tarih,
                        i.tedarikci_id,
                        ABS(:faturaMiktar - ik.miktar) as miktar_farki,
                        CASE
                            WHEN ABS(:faturaMiktar - ik.miktar) < 0.01 THEN 'tam'
                            ELSE 'kismi'
                        END as eslesme_tipi,
                        CASE
                            WHEN ABS(:faturaMiktar - ik.miktar) < 0.01 THEN 1
                            ELSE 2
                        END as oncelik,
                        CASE
                            WHEN :faturaStokKodu IS NOT NULL
                                 AND ik.stok_kodu IS NOT NULL
                                 AND LOWER(TRIM(:faturaStokKodu)) = LOWER(TRIM(ik.stok_kodu))
                            THEN 1
                            ELSE 0
                        END as stok_kodu_eslesiyor,
                        -- Calculate match score
                        CASE
                            WHEN ABS(:faturaMiktar - ik.miktar) < 0.01 THEN 95
                            WHEN ABS(:faturaMiktar - ik.miktar) < 1 THEN 85
                            WHEN ABS(:faturaMiktar - ik.miktar) < 5 THEN 75
                            ELSE 65
                        END as skor
                    FROM irsaliye_kalemleri ik
                    INNER JOIN irsaliyeler i ON ik.irsaliye_id = i.id
                    WHERE ik.tedarikci_id = :tedarikciId
                        AND ik.eslesme_durumu = 0
                        AND LOWER(TRIM(ik.mal_hizmet_adi)) = LOWER(TRIM(:malHizmetAdi))
                    ORDER BY oncelik ASC, i.belge_tarih DESC, skor DESC
                `, {
                    replacements: {
                        faturaMiktar: kalem.miktar,
                        faturaStokKodu: kalem.stok_kodu,
                        tedarikciId: fatura.tedarikci_id,
                        malHizmetAdi: kalem.mal_hizmet_adi
                    },
                    type: QueryTypes.SELECT
                });

                oneriler = onerilerRaw.map(o => ({
                    irsaliye_kalem: {
                        id: o.irsaliye_kalem_id,
                        irsaliye_id: o.irsaliye_id,
                        stok_kodu: o.irsaliye_stok_kodu,
                        mal_hizmet_adi: o.irsaliye_mal_hizmet_adi,
                        miktar: o.irsaliye_miktar,
                        birim: o.irsaliye_birim
                    },
                    irsaliye: {
                        id: o.irsaliye_id,
                        irsaliye_no: o.irsaliye_no,
                        belge_tarih: o.irsaliye_tarih,
                        tedarikci_id: o.tedarikci_id
                    },
                    eslesme_tipi: o.eslesme_tipi,
                    miktar_farki: o.miktar_farki,
                    skor: o.skor,
                    oncelik: o.oncelik,
                    stok_kodu_eslesiyor: o.stok_kodu_eslesiyor === 1
                }));
            }

            kalemlerWithOneriler.push({
                fatura_kalem: {
                    id: kalemData.id,
                    stok_kodu: kalemData.stok_kodu,
                    mal_hizmet_adi: kalemData.mal_hizmet_adi,
                    miktar: kalemData.miktar,
                    birim: kalemData.birim,
                    birim_fiyat: kalemData.birim_fiyat,
                    toplam_tutar: kalemData.toplam_tutar,
                    eslesme_durumu: kalemData.eslesme_durumu
                },
                eslesen_irsaliye_kalem: eslesenIrsaliyeKalem,
                oneriler: oneriler
            });
        }

        return {
            fatura: {
                id: fatura.id,
                fatura_no: fatura.fatura_no,
                belge_tarih: fatura.belge_tarih,
                vade_tarihi: fatura.vade_tarihi,
                tedarikci: fatura.tedarikci,
                durum: fatura.durum
            },
            kalemler: kalemlerWithOneriler
        };
    }

    /**
     * Update document matching status
     * @private
     */
    async _eslestirmeDurumGuncelle(faturaId, transaction) {
        // Get all kalemler for this fatura
        const kalemler = await FaturaKalem.findAll({
            where: { fatura_id: faturaId },
            attributes: ['eslesme_durumu'],
            transaction
        });

        if (kalemler.length === 0) {
            return;
        }

        const toplam = kalemler.length;
        const eslesmis = kalemler.filter(k => k.eslesme_durumu === 1).length;

        let durum;
        if (eslesmis === 0) {
            durum = 'bekliyor';
        } else if (eslesmis < toplam) {
            durum = 'kismi_eslesti';
        } else {
            durum = 'tam_eslesti';
        }

        await Fatura.update(
            { durum },
            { where: { id: faturaId }, transaction }
        );
    }
}

module.exports = new EslestirmeController();
