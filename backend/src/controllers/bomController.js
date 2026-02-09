const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Bom = require('../models/Bom');
const Parca = require('../models/Parca'); // Parça arama için
const { calculatePartCost, calculatePartUnitCost } = require('../config/costConfig');

// Tüm BOM'ları listele (filtreleme ve sıralama ile)
exports.listBoms = async (req, res) => {
    try {
        const { search, sortBy = 'name', sortDir = 'ASC' } = req.query;

        // Güvenli sıralama alanları
        const allowedSortFields = ['id', 'bom_kodu', 'name', 'bom_aciklamasi', 'versiyon', 'aktif', 'createdAt', 'updatedAt'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
        const sortDirection = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        let query = `
            SELECT id, bom_kodu, name, bom_aciklamasi, versiyon, aktif, createdAt, updatedAt
            FROM boms
        `;

        let whereClause = '';
        const replacements = [];

        if (search) {
            whereClause = ` WHERE name LIKE ? OR bom_aciklamasi LIKE ?`;
            replacements.push(`%${search}%`, `%${search}%`);
        }

        query += whereClause;
        query += ` ORDER BY ${sortField} ${sortDirection}`;

        const boms = await sequelize.query(query, {
            replacements: replacements,
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json(boms);
    } catch (error) {
        console.error('BOM listelenirken hata:', error);
        res.status(500).json({ message: 'BOM listelenirken bir hata oluştu', error: error.message });
    }
};

// Tek bir BOM detayını getir
exports.getBomDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // BOM'u getir
        const bomQuery = `
            SELECT id, bom_kodu, name, bom_aciklamasi, versiyon, aktif, createdAt, updatedAt
            FROM boms
            WHERE id = ?
        `;

        const bomResults = await sequelize.query(bomQuery, {
            replacements: [id],
            type: sequelize.QueryTypes.SELECT
        });

        if (bomResults.length === 0) {
            return res.status(404).json({ message: 'BOM bulunamadı' });
        }

        const bom = bomResults[0];

        // BOM bileşenlerini getir
        const componentsQuery = `
            SELECT id, bomId, parcaKodu, miktar, birim, pozisyon, createdAt, updatedAt
            FROM bom_parcalar
            WHERE bomId = ?
            ORDER BY id
        `;

        const components = await sequelize.query(componentsQuery, {
            replacements: [id],
            type: sequelize.QueryTypes.SELECT
        });

        // Parça bilgilerini ve maliyet hesaplamalarını yap
        const itemsWithCosts = await Promise.all(
            components.map(async (component) => {
                try {
                    // Parça bilgilerini getir
                    const parca = await Parca.findOne({
                        where: { parca_kodu: component.parcaKodu }
                    });

                    let item = {
                        id: component.id,
                        name: component.parcaKodu,
                        quantity: component.miktar,
                        unit: component.birim || 'adet',
                        position: component.pozisyon || '',
                        type: 'PART'
                    };

                    if (parca) {
                        // Birim maliyet hesapla - YENİ MANTIK
                        const unitCostInfo = calculatePartUnitCost(parca);
                        const totalCostInfo = {
                            ...unitCostInfo,
                            quantity: component.miktar,
                            totalCostUSD: unitCostInfo.unitCostUSD * component.miktar,
                            totalCostTRY: unitCostInfo.unitCostTRY * component.miktar
                        };

                        item = {
                            ...item,
                            unitCostInfo: unitCostInfo,
                            totalCostInfo: totalCostInfo,
                            costInfo: calculatePartCost(parca), // Geriye uyumluluk için
                            partDetails: {
                                name: parca.parcaAdi,
                                isManufactured: parca.imalMi,
                                cncProcessingTime: parca.cncIslemeSuresi,
                                procurementCost: parca.tedarikBedeli,
                                internalCost: parca.sirketIciMaliyeti,
                                subcontractCost: parca.fasonMaliyeti,
                                foto_path: parca.foto_path || null,
                                costSource: unitCostInfo.costDetails.source || 'Bilinmiyor'
                            }
                        };
                    } else {
                        console.warn(`Parça bulunamadı: ${component.parcaKodu}`);
                    }

                    return item;
                } catch (partError) {
                    console.warn(`Parça ${component.parcaKodu} işlenirken hata:`, partError.message);
                    return {
                        id: component.id,
                        name: component.parcaKodu,
                        quantity: component.miktar,
                        unit: component.birim || 'adet',
                        position: component.pozisyon || '',
                        type: 'PART',
                        error: true
                    };
                }
            })
        );

        // Toplam maliyetleri hesapla - YENİ MANTIK
        let totalManufacturingCost = 0;
        let totalProcurementCost = 0;

        itemsWithCosts.forEach(item => {
            if (item.totalCostInfo && item.quantity) {
                const itemTotalCost = item.totalCostInfo.totalCostUSD;

                if (item.unitCostInfo.isManufactured) {
                    totalManufacturingCost += itemTotalCost;
                } else {
                    totalProcurementCost += itemTotalCost;
                }
            }
        });

        // BOM detayını birleştir
        const bomWithDetails = {
            ...bom,
            items: itemsWithCosts,
            calculatedCosts: {
                totalManufacturingCost: totalManufacturingCost,
                totalProcurementCost: totalProcurementCost,
                totalCost: totalManufacturingCost + totalProcurementCost
            }
        };

        res.status(200).json(bomWithDetails);
    } catch (error) {
        console.error('BOM detayı alınırken hata:', error);
        res.status(500).json({ message: 'BOM detayı alınırken bir hata oluştu', error: error.message });
    }
};

// Yeni BOM oluştur
exports.createBom = async (req, res) => {
    try {
        const { name, bom_aciklamasi, items, bom_kodu } = req.body;

        // Gelen items verisinin geçerli bir dizi olduğundan emin olalım
        const validatedItems = Array.isArray(items) ? items : [];

        // Önce BOM'u oluştur (items olmadan)
        const newBom = await Bom.create({
            name,
            bom_aciklamasi,
            bom_kodu: bom_kodu || `BOM_${Date.now()}`
        });

        // Sonra parçaları bom_parcalar tablosuna ekle
        if (validatedItems.length > 0) {
            for (const item of validatedItems) {
                try {
                    await sequelize.query(`
                        INSERT INTO bom_parcalar (bomId, parcaKodu, miktar, birim, pozisyon)
                        VALUES (?, ?, ?, ?, ?)
                    `, {
                        replacements: [
                            newBom.id,
                            item.id || item.parcaKodu, // parca kodu
                            item.quantity || item.miktar || 1, // miktar
                            'adet', // varsayılan birim
                            item.position || item.pozisyon || '' // pozisyon
                        ]
                    });
                } catch (insertError) {
                    console.error(`Parça eklenemedi - Parça Kodu: ${item.id || item.parcaKodu}, Hata:`, insertError);
                    // Bir parça eklenemezse işlemi durdurma, diğerlerini ekle
                }
            }
        }

        console.log(`BOM oluşturuldu: ${newBom.name}, ${validatedItems.length} parça eklendi`);
        res.status(201).json(newBom);
    } catch (error) {
        console.error('BOM oluşturulurken hata:', error);
        res.status(500).json({ message: 'BOM oluşturulurken bir hata oluştu', error: error.message });
    }
};

// BOM güncelle
exports.updateBom = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            bom_aciklamasi,
            items,
            bom_kodu,
            uretim_maliyeti,
            tedarik_maliyeti,
            tedarikci_firma
        } = req.body;

        const bom = await Bom.findByPk(id);
        if (!bom) {
            return res.status(404).json({ message: 'Güncellenecek BOM bulunamadı' });
        }

        // Gelen items verisinin geçerli bir dizi olduğundan emin olalım
        const validatedItems = Array.isArray(items) ? items : [];

        await bom.update({
            name,
            bom_aciklamasi,
            bom_kodu,
            items: validatedItems, // Modeldeki set metodu JSON'a çevirecek
            uretim_maliyeti: uretim_maliyeti || null,
            tedarik_maliyeti: tedarik_maliyeti || null,
            tedarikci_firma: tedarikci_firma || null
        });

        // Güncellenmiş BOM'u geri döndür
        const updatedBom = await Bom.findByPk(id);
        res.status(200).json(updatedBom);
    } catch (error) {
        console.error('BOM güncellenirken hata:', error);
        res.status(500).json({ message: 'BOM güncellenirken bir hata oluştu', error: error.message });
    }
};

// BOM sil
exports.deleteBom = async (req, res) => {
    try {
        const { id } = req.params;
        const bom = await Bom.findByPk(id);
        if (!bom) {
            return res.status(404).json({ message: 'Silinecek BOM bulunamadı' });
        }

        // TODO: Bu BOM'un başka BOM'lar içinde kullanılıp kullanılmadığını kontrol et?
        // Şimdilik doğrudan siliyoruz.

        await bom.destroy();
        res.status(200).json({ message: 'BOM başarıyla silindi' });
    } catch (error) {
        console.error('BOM silinirken hata:', error);
        res.status(500).json({ message: 'BOM silinirken bir hata oluştu', error: error.message });
    }
};

// Parça arama (BOM formunda kullanılacak)
exports.searchParts = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            // Parca modelindeki doğru alan adını kullan (parca_kodu)
            where.parca_kodu = { [Op.like]: `%${search}%` };
        }

        const parts = await Parca.findAll({
            where,
            limit: 20,
            attributes: ['parca_kodu', 'description'] // Sadece gerekli alanları al
        });
        res.status(200).json(parts);
    } catch (error) {
        console.error('Parça aranırken hata:', error);
        res.status(500).json({ message: 'Parça aranırken bir hata oluştu', error: error.message });
    }
};

// Diğer BOM'ları arama (BOM formunda kullanılacak)
exports.searchBoms = async (req, res) => {
    try {
        const { search, excludeBomId } = req.query; // Kendi kendini eklemeyi önlemek için
        const where = {};

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { bom_aciklamasi: { [Op.like]: `%${search}%` } }
            ];
        }

        // Düzenleme modunda, mevcut BOM'u sonuçlardan çıkar
        if (excludeBomId) {
            where.id = { [Op.ne]: excludeBomId };
        }

        const boms = await Bom.findAll({
            where,
            limit: 20,
            attributes: ['id', 'name'] // Sadece gerekli alanları al
        });
        res.status(200).json(boms);
    } catch (error) {
        console.error('BOM aranırken hata:', error);
        res.status(500).json({ message: 'BOM aranırken bir hata oluştu', error: error.message });
    }
};

// Parça birim maliyetini hesaplayan yeni endpoint
exports.getPartUnitCost = async (req, res) => {
    try {
        const { parcaKodu } = req.params;

        if (!parcaKodu) {
            return res.status(400).json({ message: 'Parça kodu gereklidir' });
        }

        const parca = await Parca.findOne({
            where: { parca_kodu: parcaKodu }
        });

        if (!parca) {
            return res.status(404).json({ message: 'Parça bulunamadı' });
        }

        // Birim maliyeti hesapla
        const unitCostInfo = calculatePartUnitCost(parca);

        const response = {
            parcaKodu: parca.parcaKodu,
            parcaAdi: parca.parcaAdi,
            imalMi: parca.imalMi,
            maliyetBilgileri: {
                birimMaliyetUSD: unitCostInfo.unitCostUSD,
                birimMaliyetTRY: unitCostInfo.unitCostTRY,
                maliyetKaynagi: unitCostInfo.costDetails.source || 'Bilinmiyor',
                maliyetTipi: unitCostInfo.costType,
                detaylar: unitCostInfo.costDetails
            },
            parcaDetaylari: {
                tedarikBedeli: parca.tedarikBedeli,
                sirketIciMaliyeti: parca.sirketIciMaliyeti,
                fasonMaliyeti: parca.fasonMaliyeti,
                cncIslemeSuresi: parca.cncIslemeSuresi
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Parça birim maliyeti alınırken hata:', error);
        res.status(500).json({ message: 'Parça birim maliyeti alınırken bir hata oluştu', error: error.message });
    }
};