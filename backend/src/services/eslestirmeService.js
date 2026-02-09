const { Fatura, FaturaKalem, Irsaliye, IrsaliyeKalem } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

/**
 * Eşleştirme Servisi
 *
 * Fatura ve irsaliye kalemleri arasında akıllı eşleştirme yapar.
 *
 * Eşleştirme Kuralları:
 * 1. Aynı tedarikçi_id'ye sahip olmalı (ZORUNLU)
 * 2. Her iki taraf da eslesme_durumu = 0 (bekliyor) olmalı (ZORUNLU)
 * 3. mal_hizmet_adi tam eşleşmesi ZORUNLU (case-insensitive, trim)
 * 4. stok_kodu bilgi amaçlı tutuluyor (eşleşme zorunlu değil)
 * 5. Öncelik: tam eşleşme > kısmi eşleşme
 */

/**
 * Fatura için eşleştirme önerilerini getir
 *
 * @param {number} faturaId - Fatura ID
 * @param {object} options - Seçenekler
 * @returns {Promise<Array>} Eşleştirme önerileri
 */
async function eslestirmeOnerileriGetir(faturaId, options = {}) {
    try {
        logger.info(`Eşleştirme önerileri hesaplanıyor: Fatura ID ${faturaId}`);

        // 1. Faturayı getir (tedarikçi bilgisi ile)
        const fatura = await Fatura.findByPk(faturaId, {
            include: [
                {
                    model: FaturaKalem,
                    as: 'kalemler',
                    where: { eslesme_durumu: 0 }, // Sadece eşleşmemiş kalemler
                    required: false
                }
            ]
        });

        if (!fatura) {
            throw new Error('Fatura bulunamadı');
        }

        if (!fatura.kalemler || fatura.kalemler.length === 0) {
            return []; // Eşleşecek kalem yok
        }

        // 2. Aynı tedarikçinin bekleyen irsaliye kalemlerini bul
        const bekleyenIrsaliyeKalemleri = await IrsaliyeKalem.findAll({
            where: {
                eslesme_durumu: 0 // Bekleyen
            },
            include: [
                {
                    model: Irsaliye,
                    as: 'irsaliye',
                    where: {
                        tedarikci_id: fatura.tedarikci_id
                    },
                    required: true
                }
            ]
        });

        if (bekleyenIrsaliyeKalemleri.length === 0) {
            return []; // Eşleşecek irsaliye kalem yok
        }

        // 3. Kalem bazlı eşleştirme - mal_hizmet_adi ZORUNLU
        const oneriler = [];
        const eslesenIrsaliyeKalemIds = new Set(); // Zaten eşleşenleri takip et

        for (const faturaKalem of fatura.kalemler) {
            // Bu fatura kalemi için adayları bul
            const adaylar = bekleyenIrsaliyeKalemleri.filter(ik => {
                // Daha önce eşleşmemiş olmalı
                if (eslesenIrsaliyeKalemIds.has(ik.id)) return false;

                // mal_hizmet_adi tam eşleşmesi ZORUNLU (case-insensitive, trim)
                const malHizmetAdiEslesme = faturaKalem.mal_hizmet_adi &&
                                           ik.mal_hizmet_adi &&
                                           faturaKalem.mal_hizmet_adi.toLowerCase().trim() ===
                                           ik.mal_hizmet_adi.toLowerCase().trim();

                return malHizmetAdiEslesme;
            });

            // Her aday için bir öneri oluştur
            for (const aday of adaylar) {
                const miktarFarki = Math.abs(faturaKalem.miktar - aday.miktar);
                const eslesmeTipi = miktarFarki < 0.01 ? 'tam' : 'kismi';

                // Eşleşme kalite skorunu hesapla (0-100 arası)
                let skor = 0;

                // Miktar eşleşmesi (+60 puan, çünkü mal_hizmet_adi zaten zorunlu)
                if (eslesmeTipi === 'tam') {
                    skor += 60;
                } else {
                    // Miktar farkına göre ceza puanı (fark azaldıkça ceza azalır)
                    skor += Math.max(0, 60 - (miktarFarki * 10));
                }

                // Mal/hizmet adı tam eşleşmesi (+40 puan) - ZORUNLU koşul
                // Bu koşul sağlanmazsa zaten eşleşme önerisi oluşmaz
                skor += 40;

                // Stok kodu bilgilendirme amaçlı (+0 puan, eşleşme zorunlu değil)
                // Sadece UI'da gösterilecek, skora etki etmeyecek

                oneriler.push({
                    fatura_kalem_id: faturaKalem.id,
                    fatura_kalem: {
                        id: faturaKalem.id,
                        mal_hizmet_adi: faturaKalem.mal_hizmet_adi,
                        stok_kodu: faturaKalem.stok_kodu,
                        miktar: faturaKalem.miktar,
                        birim: faturaKalem.birim,
                        birim_fiyat: faturaKalem.birim_fiyat,
                        kdv_orani: faturaKalem.kdv_orani
                    },
                    irsaliye_kalem_id: aday.id,
                    irsaliye_kalem: {
                        id: aday.id,
                        mal_hizmet_adi: aday.mal_hizmet_adi,
                        stok_kodu: aday.stok_kodu,
                        miktar: aday.miktar,
                        birim: aday.birim
                    },
                    irsaliye: {
                        id: aday.irsaliye.id,
                        irsaliye_no: aday.irsaliye.irsaliye_no,
                        belge_tarih: aday.irsaliye.belge_tarih
                    },
                    eslesme_tipi: eslesmeTipi, // 'tam' veya 'kismi'
                    miktar_farki: miktarFarki,
                    skor: skor,
                    oncelik: eslesmeTipi === 'tam' ? 1 : 2
                });

                // Bu irsaliye kalemini kullanıldı olarak işaretle
                eslesenIrsaliyeKalemIds.add(aday.id);
            }
        }

        // 4. Öncelik ve skora göre sırala
        oneriler.sort((a, b) => {
            // Önce öncelik (tam > kısmi)
            if (a.oncelik !== b.oncelik) {
                return a.oncelik - b.oncelik;
            }
            // Sonra skora göre ters sırala (yüksek skor önde)
            return b.skor - a.skor;
        });

        logger.info(`Eşleştirme tamamlandı: ${oneriler.length} öneri bulundu`);
        return oneriler;

    } catch (error) {
        logger.error(`Eşleştirme önerileri hatası: ${error.message}`, { error });
        throw error;
    }
}

/**
 * Eşleştirmeyi onayla ve uygula
 *
 * @param {object} data - Eşleştirme verileri
 * @param {number} data.fatura_kalem_id - Fatura kalem ID
 * @param {number} data.irsaliye_kalem_id - İrsaliye kalem ID
 * @param {number} data.kullanici_id - Kullanıcı ID (opsiyonel)
 * @returns {Promise<object>} Sonuç
 */
async function eslestirmeOnayla(data) {
    const t = await Fatura.sequelize.transaction();

    try {
        const { fatura_kalem_id, irsaliye_kalem_id, kullanici_id } = data;

        logger.info(`Eşleştirme onaylanıyor: FK ${fatura_kalem_id} ↔ İK ${irsaliye_kalem_id}`);

        // 1. Fatura kalemini getir
        const faturaKalem = await FaturaKalem.findByPk(fatura_kalem_id, {
            transaction: t,
            include: [{ model: Fatura, as: 'fatura' }]
        });

        if (!faturaKalem) {
            throw new Error('Fatura kalemı bulunamadı');
        }

        // 2. İrsaliye kalemini getir
        const irsaliyeKalem = await IrsaliyeKalem.findByPk(irsaliye_kalem_id, {
            transaction: t
        });

        if (!irsaliyeKalem) {
            throw new Error('İrsaliye kalemı bulunamadı');
        }

        // 3. Eşleştirme durumlarını güncelle
        await faturaKalem.update({
            eslesme_durumu: 1, // Eşleşti
            eslesen_irsaliye_kalem_id: irsaliye_kalem_id
        }, { transaction: t });

        await irsaliyeKalem.update({
            eslesme_durumu: 1, // Eşleşti
            eslesen_fatura_kalem_id: fatura_kalem_id
        }, { transaction: t });

        // 4. Fatura ve irsaliye durumlarını güncelle
        await faturaKalem.fatura.updateDurumu({ transaction: t });
        await irsaliyeKalem.irsaliye.updateDurumu({ transaction: t });

        await t.commit();

        logger.info(`Eşleştirme başarıyla uygulandı: FK ${fatura_kalem_id} ↔ İK ${irsaliye_kalem_id}`);

        return {
            success: true,
            message: 'Eşleştirme başarıyla uygulandı',
            data: {
                fatura_kalem: faturaKalem,
                irsaliye_kalem: irsaliyeKalem
            }
        };

    } catch (error) {
        await t.rollback();
        logger.error(`Eşleştirme onaylama hatası: ${error.message}`, { error });
        throw error;
    }
}

/**
 * Eşleştirme önerisini reddet
 *
 * @param {object} data - Reddetme verileri
 * @param {number} data.fatura_kalem_id - Fatura kalem ID
 * @param {number} data.irsaliye_kalem_id - İrsaliye kalem ID
 * @param {string} data.sebep - Reddetme sebebi (opsiyonel)
 * @returns {Promise<object>} Sonuç
 */
async function eslestirmeReddet(data) {
    try {
        const { fatura_kalem_id, irsaliye_kalem_id, sebep } = data;

        logger.info(`Eşleştirme reddediliyor: FK ${fatura_kalem_id} ↔ İK ${irsaliye_kalem_id}`);

        // Şu an için sadece log kaydı tutuyoruz
        // İleride red nedenlerini takip etmek için bir tablo eklenebilir

        logger.info(`Eşleştirme reddedildi: ${sebep || 'Sebep belirtilmedi'}`);

        return {
            success: true,
            message: 'Eşleştirme reddedildi'
        };

    } catch (error) {
        logger.error(`Eşleştirme ret hatası: ${error.message}`, { error });
        throw error;
    }
}

/**
 * Manuel eşleştirme
 *
 * @param {object} data - Eşleştirme verileri
 * @param {number} data.fatura_kalem_id - Fatura kalem ID
 * @param {number} data.irsaliye_kalem_id - İrsaliye kalem ID
 * @param {number} data.kullanici_id - Kullanıcı ID (opsiyonel)
 * @returns {Promise<object>} Sonuç
 */
async function manuelEslestirme(data) {
    // Manuel eşleştirme, onay ile aynı işlemi yapar
    // Sadece log kaydında "manuel" olarak işaretlenir
    return eslestirmeOnayla({
        ...data,
        manuel: true
    });
}

/**
 * Eşleştirme durumunu sıfırla (eşleşmeyi kaldır)
 *
 * @param {number} faturaKalemId - Fatura kalem ID
 * @returns {Promise<object>} Sonuç
 */
async function eslestirmeSifirla(faturaKalemId) {
    const t = await Fatura.sequelize.transaction();

    try {
        logger.info(`Eşleştirme sıfırlanıyor: Fatura Kalem ID ${faturaKalemId}`);

        // 1. Fatura kalemini getir
        const faturaKalem = await FaturaKalem.findByPk(faturaKalemId, {
            transaction: t,
            include: [{ model: Fatura, as: 'fatura' }]
        });

        if (!faturaKalem) {
            throw new Error('Fatura kalemı bulunamadı');
        }

        if (!faturaKalem.eslesen_irsaliye_kalem_id) {
            throw new Error('Bu kalem zaten eşleşmemiş');
        }

        // 2. İlgili irsaliye kalemini getir
        const irsaliyeKalem = await IrsaliyeKalem.findByPk(
            faturaKalem.eslesen_irsaliye_kalem_id,
            { transaction: t }
        );

        // 3. Eşleştirme durumlarını sıfırla
        await faturaKalem.update({
            eslesme_durumu: 0,
            eslesen_irsaliye_kalem_id: null
        }, { transaction: t });

        if (irsaliyeKalem) {
            await irsaliyeKalem.update({
                eslesme_durumu: 0,
                eslesen_fatura_kalem_id: null
            }, { transaction: t });

            // İrsaliye durumunu güncelle
            await irsaliyeKalem.irsaliye.updateDurumu({ transaction: t });
        }

        // 4. Fatura durumunu güncelle
        await faturaKalem.fatura.updateDurumu({ transaction: t });

        await t.commit();

        logger.info(`Eşleştirme başarıyla sıfırlandı: Fatura Kalem ID ${faturaKalemId}`);

        return {
            success: true,
            message: 'Eşleştirme başarıyla kaldırıldı'
        };

    } catch (error) {
        await t.rollback();
        logger.error(`Eşleştirme sıfırlama hatası: ${error.message}`, { error });
        throw error;
    }
}

module.exports = {
    eslestirmeOnerileriGetir,
    eslestirmeOnayla,
    eslestirmeReddet,
    manuelEslestirme,
    eslestirmeSifirla
};
