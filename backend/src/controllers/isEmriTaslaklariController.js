const IsEmriTaslak = require('../models/IsEmriTaslak');
const IsEmri = require('../models/IsEmri');
const Parca = require('../models/Parca');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Yeni iş emri numarası oluştur fonksiyonunu import et
const { generateIsEmriNo } = require('./isEmirleriController');

/**
 * Excel'den gelen verilerle iş emri taslakları oluştur
 */
exports.createTaslaklarFromExcel = async (req, res) => {
    try {
        const { uretimPlani, uretimPlaniId } = req.body;

        if (!uretimPlani || !Array.isArray(uretimPlani)) {
            return res.status(400).json({ error: 'Geçersiz üretim planı verisi' });
        }

        // Yeni oturum ID oluştur
        const oturumId = uuidv4();
        
        const transaction = await sequelize.transaction();

        try {
            const taslaklar = [];

            for (let i = 0; i < uretimPlani.length; i++) {
                const item = uretimPlani[i];
                
                // Plan liste no'yu Item sütunundan al
                const planListeNo = item['Item'] || item['item'] || item['ITEM'];
                
                // Zorunlu alanları kontrol et
                if (!planListeNo || !item.Adet || !item.Malzemesi) {
                    throw new Error(`Eksik veri: Item=${planListeNo}, Adet=${item.Adet}, Malzemesi=${item.Malzemesi}`);
                }

                // Parça kodu olarak planListeNo'yu kullan
                const parcaKodu = planListeNo;
                
                const taslakData = {
                    oturum_id: oturumId,
                    is_adi: planListeNo, // Item'ı iş adı olarak kullan
                    plan_liste_no: planListeNo,
                    parca_kodu: parcaKodu,
                    adet: parseInt(item.Adet) || 1,
                    malzeme: item.Malzemesi,
                    teslim_tarihi: new Date(),
                    durum: 'taslak',
                    kaynak: 'excel',
                    excel_satir_no: i + 1,
                    uretim_plani_id: uretimPlaniId || null
                };

                const taslak = await IsEmriTaslak.create(taslakData, { transaction });
                taslaklar.push(taslak);
            }

            await transaction.commit();

            res.json({
                success: true,
                message: `${taslaklar.length} iş emri taslağı oluşturuldu`,
                data: {
                    oturum_id: oturumId,
                    taslak_sayisi: taslaklar.length,
                    taslaklar: taslaklar
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Taslak oluşturma hatası:', error);
        res.status(500).json({ 
            error: 'Taslaklar oluşturulurken hata oluştu', 
            details: error.message 
        });
    }
};

/**
 * Oturum ID'sine göre taslakları getir
 */
exports.getTaslaklarByOturum = async (req, res) => {
    try {
        const { oturumId } = req.params;

        const taslaklar = await IsEmriTaslak.findAll({
            where: {
                oturum_id: oturumId,
                durum: {
                    [Op.in]: ['taslak', 'hazir']
                }
            },
            order: [['excel_satir_no', 'ASC'], ['olusturma_tarihi', 'ASC']]
        });

        // Her taslak için parça bilgilerini de getir
        for (let taslak of taslaklar) {
            if (taslak.parca_kodu) {
                try {
                    const parca = await Parca.findOne({
                        where: { parcaKodu: taslak.parca_kodu },
                        attributes: ['parcaKodu', 'parcaAdi', 'foto_path', 'teknik_resim_path', 'setupSayisi', 'cncIslemeSuresi']
                    });
                    
                    if (parca) {
                        taslak.dataValues.parca = parca;
                    }
                } catch (error) {
                    console.error(`Parça bilgisi yüklenirken hata (${taslak.parca_kodu}):`, error);
                }
            }
        }

        res.json({
            success: true,
            data: {
                oturum_id: oturumId,
                taslak_sayisi: taslaklar.length,
                taslaklar: taslaklar
            }
        });

    } catch (error) {
        console.error('Taslaklar getirilirken hata:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Taslağı güncelle
 */
exports.updateTaslak = async (req, res) => {
    try {
        const { taslakId } = req.params;
        const updateData = req.body;

        const taslak = await IsEmriTaslak.findByPk(taslakId);
        
        if (!taslak) {
            return res.status(404).json({ error: 'Taslak bulunamadı' });
        }

        if (taslak.durum === 'yayinlandi') {
            return res.status(400).json({ error: 'Yayınlanmış taslak düzenlenemez' });
        }

        // Parça kodu değişmişse, parça bilgilerini kontrol et
        if (updateData.parca_kodu && updateData.parca_kodu !== taslak.parca_kodu) {
            try {
                const parca = await Parca.findOne({
                    where: { parcaKodu: updateData.parca_kodu }
                });
                
                if (!parca) {
                    return res.status(400).json({ 
                        error: `Parça bulunamadı: ${updateData.parca_kodu}` 
                    });
                }
            } catch (error) {
                console.error('Parça kontrol hatası:', error);
            }
        }

        await taslak.update(updateData);

        // Güncellenmiş taslağı parça bilgileriyle birlikte getir
        if (taslak.parca_kodu) {
            try {
                const parca = await Parca.findOne({
                    where: { parcaKodu: taslak.parca_kodu },
                    attributes: ['parcaKodu', 'parcaAdi', 'foto_path', 'teknik_resim_path']
                });
                
                if (parca) {
                    taslak.dataValues.parca = parca;
                }
            } catch (error) {
                console.error(`Parça bilgisi yüklenirken hata:`, error);
            }
        }

        res.json({
            success: true,
            message: 'Taslak başarıyla güncellendi',
            data: taslak
        });

    } catch (error) {
        console.error('Taslak güncelleme hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Taslağı sil
 */
exports.deleteTaslak = async (req, res) => {
    try {
        const { taslakId } = req.params;

        const taslak = await IsEmriTaslak.findByPk(taslakId);
        
        if (!taslak) {
            return res.status(404).json({ error: 'Taslak bulunamadı' });
        }

        if (taslak.durum === 'yayinlandi') {
            return res.status(400).json({ error: 'Yayınlanmış taslak silinemez' });
        }

        await taslak.destroy();

        res.json({
            success: true,
            message: 'Taslak başarıyla silindi'
        });

    } catch (error) {
        console.error('Taslak silme hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Oturumdaki tüm taslakları iş emirlerine dönüştür (yayınla)
 */
exports.publishTaslaklar = async (req, res) => {
    try {
        const { oturumId } = req.params;

        const taslaklar = await IsEmriTaslak.findAll({
            where: {
                oturum_id: oturumId,
                durum: {
                    [Op.in]: ['taslak', 'hazir']
                }
            }
        });

        if (taslaklar.length === 0) {
            return res.status(404).json({ 
                error: 'Yayınlanabilir taslak bulunamadı' 
            });
        }

        const transaction = await sequelize.transaction();

        try {
            const olusturulanIsEmirleri = [];

            for (let taslak of taslaklar) {
                // Yeni iş emri numarası oluştur
                const isEmriNo = await generateIsEmriNo(transaction);
                
                // Parça bilgilerini al
                let setupSayisi = 0;
                let cncSuresi = 0;
                
                if (taslak.parca_kodu) {
                    try {
                        const parca = await Parca.findOne({
                            where: { parcaKodu: taslak.parca_kodu },
                            transaction: transaction
                        });
                        
                        if (parca) {
                            setupSayisi = parca.setupSayisi || 0;
                            cncSuresi = parca.cncIslemeSuresi || 0;
                        }
                    } catch (parcaError) {
                        console.error(`Parça bilgisi alınırken hata: ${taslak.parca_kodu}`, parcaError);
                    }
                }

                // İş emri verilerini hazırla
                const isEmriData = {
                    is_emri_no: isEmriNo,
                    is_adi: taslak.is_adi,
                    plan_liste_no: taslak.plan_liste_no,
                    parca_kodu: taslak.parca_kodu,
                    adet: taslak.adet,
                    malzeme: taslak.malzeme,
                    teslim_tarihi: taslak.teslim_tarihi,
                    oncelik: taslak.oncelik,
                    durum: 'Beklemede',
                    aciklama: taslak.aciklama ? 
                        `${taslak.aciklama} - Taslaktan oluşturuldu` : 
                        'Taslaktan otomatik oluşturuldu',
                    uretim_plani_id: taslak.uretim_plani_id,
                    setup_sayisi: setupSayisi,
                    cnc_suresi: cncSuresi,
                    hareketler: [`${new Date().toLocaleString('tr-TR')} - Taslaktan oluşturuldu`]
                };

                // İş emrini oluştur
                const isEmri = await IsEmri.create(isEmriData, { transaction });
                
                // Taslağın durumunu güncelle
                await taslak.update({ 
                    durum: 'yayinlandi' 
                }, { transaction });

                olusturulanIsEmirleri.push({
                    is_emri_id: isEmri.is_emri_id,
                    is_emri_no: isEmri.is_emri_no,
                    parca_kodu: isEmri.parca_kodu,
                    is_adi: isEmri.is_adi,
                    adet: isEmri.adet,
                    taslak_id: taslak.taslak_id
                });
            }

            await transaction.commit();

            res.json({
                success: true,
                message: `${olusturulanIsEmirleri.length} iş emri başarıyla oluşturuldu`,
                data: {
                    oturum_id: oturumId,
                    oluşturulan_is_emri_sayisi: olusturulanIsEmirleri.length,
                    is_emirleri: olusturulanIsEmirleri
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Taslak yayınlama hatası:', error);
        res.status(500).json({ 
            error: 'Taslaklar yayınlanırken hata oluştu', 
            details: error.message 
        });
    }
};

/**
 * Oturumdaki tüm taslakları sil
 */
exports.deleteOturum = async (req, res) => {
    try {
        const { oturumId } = req.params;

        const silinenSayisi = await IsEmriTaslak.destroy({
            where: {
                oturum_id: oturumId,
                durum: {
                    [Op.in]: ['taslak', 'hazir']
                }
            }
        });

        res.json({
            success: true,
            message: `${silinenSayisi} taslak silindi`,
            data: {
                silinen_taslak_sayisi: silinenSayisi
            }
        });

    } catch (error) {
        console.error('Oturum silme hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createTaslaklarFromExcel: exports.createTaslaklarFromExcel,
    getTaslaklarByOturum: exports.getTaslaklarByOturum,
    updateTaslak: exports.updateTaslak,
    deleteTaslak: exports.deleteTaslak,
    publishTaslaklar: exports.publishTaslaklar,
    deleteOturum: exports.deleteOturum
};
