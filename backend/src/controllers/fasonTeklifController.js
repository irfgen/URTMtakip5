const FasonTeklif = require('../models/FasonTeklif');
const FasonIsEmri = require('../models/FasonIsEmri');
const Parca = require('../models/Parca');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');

// Tüm teklifleri listele
exports.listAllTeklifler = async (req, res) => {
    try {
        const teklifler = await FasonTeklif.findAll({
            include: [
                { model: Parca, as: 'parca' }
            ],
            order: [['teklif_tarihi', 'DESC']]
        });
        
        res.status(200).json(teklifler);
    } catch (error) {
        console.error('Teklifler listelenirken hata:', error);
        res.status(500).json({ message: 'Teklifler listelenirken bir hata oluştu', error: error.message });
    }
};

// Parça koduna göre teklifleri listele
exports.listTekliflerByParcaKodu = async (req, res) => {
    try {
        const { parca_kodu } = req.params;
        
        if (!parca_kodu) {
            return res.status(400).json({ message: 'Parça kodu belirtilmemiş' });
        }
        
        // URL-decode the part code
        const decodedParcaKodu = decodeURIComponent(parca_kodu);
        
        console.log(`[DEBUG] Parça koduna göre teklifler aranıyor: '${decodedParcaKodu}'`);
        
        // Önce tam eşleşme ile ara
        let teklifler = await FasonTeklif.findAll({
            where: { parca_kodu: decodedParcaKodu },
            include: [
                { model: Parca, as: 'parca' }
            ],
            order: [['teklif_tarihi', 'DESC']]
        });
        
        console.log(`[DEBUG] Tam eşleşme ile bulunan teklif sayısı: ${teklifler.length}`);
        
        // Tam eşleşme yoksa LIKE ile esnek arama yap
        if (teklifler.length === 0) {
            console.log(`[DEBUG] Tam eşleşme bulunamadı, LIKE ile aranıyor...`);
            teklifler = await FasonTeklif.findAll({
                where: { 
                    parca_kodu: { 
                        [Op.like]: `%${decodedParcaKodu}%` 
                    } 
                },
                include: [
                    { model: Parca, as: 'parca' }
                ],
                order: [['teklif_tarihi', 'DESC']]
            });
            console.log(`[DEBUG] LIKE ile bulunan teklif sayısı: ${teklifler.length}`);
        }
        
        if (teklifler.length === 0) {
            console.log(`[DEBUG] '${decodedParcaKodu}' kodlu parça için teklif bulunamadı.`);
            
            // Veritabanında mevcut tüm teklif parça kodlarını göster - debug için
            const tumTeklifler = await FasonTeklif.findAll({
                attributes: ['parca_kodu'],
                group: ['parca_kodu'],
                limit: 20
            });
            
            console.log(`[DEBUG] Veritabanındaki teklif parça kodları örneği:`, 
                tumTeklifler.map(t => t.parca_kodu)
            );
            
            // Parça kontrolü - gerçekten böyle bir parça var mı?
            const parcaVar = await Parca.findByPk(decodedParcaKodu);
            if (!parcaVar) {
                console.log(`[DEBUG] '${decodedParcaKodu}' kodlu parça veritabanında bulunamadı.`);
                
                // Benzer parça adları bul
                const benzerParcalar = await Parca.findAll({
                    where: {
                        parcaKodu: {
                            [Op.like]: `%${decodedParcaKodu}%`
                        }
                    },
                    limit: 5
                });
                
                if (benzerParcalar.length > 0) {
                    console.log(`[DEBUG] Benzer parcalar:`, benzerParcalar.map(p => p.parcaKodu));
                }
            } else {
                console.log(`[DEBUG] '${decodedParcaKodu}' kodlu parça veritabanında bulundu fakat teklifi yok.`);
            }
        } else {
            console.log(`[DEBUG] İlk bulunan teklif örneği:`, {
                teklif_id: teklifler[0].teklif_id,
                parca_kodu: teklifler[0].parca_kodu,
                tedarikci: teklifler[0].tedarikci,
                teklif_fiyati: teklifler[0].teklif_fiyati
            });
        }
        
        res.status(200).json(teklifler);
    } catch (error) {
        console.error('Teklifler listelenirken hata:', error);
        res.status(500).json({ message: 'Teklifler listelenirken bir hata oluştu', error: error.message });
    }
};

// Fason iş emrine ait teklifleri listele
exports.listTekliflerByFasonIsEmriId = async (req, res) => {
    try {
        const { fason_is_emri_id } = req.params;
        
        const teklifler = await FasonTeklif.findAll({
            where: { fason_is_emri_id },
            include: [
                { model: Parca, as: 'parca' }
            ],
            order: [['teklif_tarihi', 'DESC']]
        });
        
        res.status(200).json(teklifler);
    } catch (error) {
        console.error('Teklifler listelenirken hata:', error);
        res.status(500).json({ message: 'Teklifler listelenirken bir hata oluştu', error: error.message });
    }
};

// Yeni teklif oluştur
exports.createTeklif = async (req, res) => {
    try {
        const { parca_kodu, fason_is_emri_id, tedarikci, teklif_fiyati, teslim_suresi, aciklama } = req.body;
        
        if (!parca_kodu) {
            return res.status(400).json({ message: 'Parça kodu belirtilmemiş' });
        }
        
        if (!tedarikci) {
            return res.status(400).json({ message: 'Tedarikçi bilgisi belirtilmemiş' });
        }
        
        if (!teklif_fiyati && teklif_fiyati !== 0) {
            return res.status(400).json({ message: 'Teklif fiyatı belirtilmemiş' });
        }
        
        if (!teslim_suresi && teslim_suresi !== 0) {
            return res.status(400).json({ message: 'Teslim süresi belirtilmemiş' });
        }
        
        // Parça kontrolü
        console.log('[DEBUG] Kontrol edilen parça kodu:', parca_kodu, typeof parca_kodu);
        
        const parca = await Parca.findByPk(parca_kodu);
        if (!parca) {
            console.log('[HATA] Parça bulunamadı. Veritabanında bu kodla eşleşen parça yok:', parca_kodu);
            
            // Benzer parça kodlarını bul
            const benzerParcalar = await Parca.findAll({
                where: {
                    parcaKodu: {
                        [Op.like]: `%${parca_kodu}%`
                    }
                },
                limit: 5
            });
            
            return res.status(404).json({ 
                message: 'Belirtilen parça kodu bulunamadı', 
                arananKod: parca_kodu,
                benzerParcalar: benzerParcalar.map(p => p.parcaKodu),
                ipucu: 'Parça kodu büyük-küçük harfe duyarlı olabilir veya formatı farklı olabilir'
            });
        }
        console.log('[DEBUG] Parça bulundu:', parca.parcaKodu);
        
        // İş emri kontrolü (eğer belirtilmişse)
        if (fason_is_emri_id) {
            const fasonIsEmri = await FasonIsEmri.findByPk(fason_is_emri_id);
            if (!fasonIsEmri) {
                return res.status(404).json({ message: 'Belirtilen fason iş emri bulunamadı' });
            }
        }
        
        // Teklif oluştur
        const yeniTeklif = await FasonTeklif.create({
            parca_kodu: parca.parcaKodu, // Veritabanındaki doğru parça kodunu kullan
            fason_is_emri_id,
            tedarikci,
            teklif_fiyati,
            teslim_suresi,
            aciklama: aciklama || null,
            teklif_tarihi: new Date(),
            durumu: 'aktif'
        });
        
        console.log('[DEBUG] Yeni teklif oluşturuldu:', {
            id: yeniTeklif.teklif_id,
            parca_kodu: yeniTeklif.parca_kodu,
            tedarikci: yeniTeklif.tedarikci
        });
        
        const createdTeklif = await FasonTeklif.findByPk(yeniTeklif.teklif_id, {
            include: [
                { model: Parca, as: 'parca' }
            ]
        });
        
        res.status(201).json(createdTeklif);
    } catch (error) {
        console.error('[HATA] Teklif oluşturulurken hata:', error);
        res.status(500).json({ 
            message: 'Teklif oluşturulurken bir hata oluştu',
            hata: error.message,
            stack: error.stack
        });
    }
};

// Teklifi güncelle
exports.updateTeklif = async (req, res) => {
    try {
        const { id } = req.params;
        const { tedarikci, teklif_fiyati, teslim_suresi, aciklama, durumu } = req.body;
        
        const teklif = await FasonTeklif.findByPk(id);
        if (!teklif) {
            return res.status(404).json({ message: 'Güncellenecek teklif bulunamadı' });
        }
        
        await teklif.update({
            tedarikci: tedarikci || teklif.tedarikci,
            teklif_fiyati: teklif_fiyati !== undefined ? teklif_fiyati : teklif.teklif_fiyati,
            teslim_suresi: teslim_suresi !== undefined ? teslim_suresi : teklif.teslim_suresi,
            aciklama: aciklama !== undefined ? aciklama : teklif.aciklama,
            durumu: durumu || teklif.durumu
        });
        
        // Güncel veriyi döndür
        const updatedTeklif = await FasonTeklif.findByPk(id);
        res.status(200).json(updatedTeklif);
    } catch (error) {
        console.error('Teklif güncellenirken hata:', error);
        res.status(500).json({ message: 'Teklif güncellenirken bir hata oluştu', error: error.message });
    }
};

// Teklifi sil
exports.deleteTeklif = async (req, res) => {
    try {
        const { id } = req.params;
        
        const teklif = await FasonTeklif.findByPk(id);
        if (!teklif) {
            return res.status(404).json({ message: 'Silinecek teklif bulunamadı' });
        }
        
        await teklif.destroy();
        res.status(200).json({ message: 'Teklif başarıyla silindi' });
    } catch (error) {
        console.error('Teklif silinirken hata:', error);
        res.status(500).json({ message: 'Teklif silinirken bir hata oluştu', error: error.message });
    }
};

// Teklifi kabul et
exports.kabulEtTeklif = async (req, res) => {
    try {
        const { id } = req.params;
        
        const teklif = await FasonTeklif.findByPk(id, {
            include: [{ model: FasonIsEmri, as: 'fason_is_emri' }]
        });
        
        if (!teklif) {
            return res.status(404).json({ message: 'Kabul edilecek teklif bulunamadı' });
        }
        
        // Teklif durumunu güncelle
        await teklif.update({
            durumu: 'kabul_edildi'
        });
        
        // Aynı iş emrine ait diğer teklifleri reddet
        if (teklif.fason_is_emri_id) {
            await FasonTeklif.update(
                { durumu: 'reddedildi' },
                { 
                    where: { 
                        fason_is_emri_id: teklif.fason_is_emri_id,
                        teklif_id: { [Op.ne]: teklif.teklif_id }
                    }
                }
            );
            
            // İş emrinin tedarikçisini ve maliyetini güncelle
            if (teklif.fason_is_emri) {
                await teklif.fason_is_emri.update({
                    tedarikci: teklif.tedarikci,
                    toplam_maliyet: teklif.teklif_fiyati * teklif.fason_is_emri.fason_adet
                });
            }
        }
        
        res.status(200).json({ 
            message: 'Teklif başarıyla kabul edildi',
            teklif: await FasonTeklif.findByPk(id)
        });
    } catch (error) {
        console.error('Teklif kabul edilirken hata:', error);
        res.status(500).json({ message: 'Teklif kabul edilirken bir hata oluştu', error: error.message });
    }
};

// Multer configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece Excel dosyaları kabul edilir (.xlsx, .xls)'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Excel dosyası yükleme ve parse etme
exports.uploadAndParseExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Excel dosyası yüklenmedi' });
        }

        console.log('[DEBUG] Excel dosyası yüklendi:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // Excel dosyasını parse et
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Excel'i JSON'a çevir
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 3) {
            return res.status(400).json({ message: 'Excel dosyası en az 3 satır içermelidir (teklif grubu + başlık + veri)' });
        }

        // İlk satır teklif grubu adı, ikinci satır başlıklar
        const teklifGrubuAdi = jsonData[0][0];
        const headers = jsonData[1];
        console.log('[DEBUG] Teklif grubu adı:', teklifGrubuAdi);
        console.log('[DEBUG] Excel başlıkları:', headers);

        // Sütun mapping'i - DPEO Excel formatına özel (büyük-küçük harf duyarlı değil)
        const expectedColumns = {
            adet: ['adet', 'miktar', 'quantity', 'adet:'],
            parca_kodu: ['parça adı', 'parca adi', 'parca_kodu', 'parça kodu', 'part code', 'parça adı:', 'parca adi:', 'PARÇA ADI'],
            malzeme_kesiti: ['sipariş ölçüsü', 'siparis olcusu', 'malzeme kesiti', 'kesit', 'section', 'ölçü', 'olcu', 'KESIT'],
            uzunluk: ['uzunluk', 'length', 'uzunluk:', 'boy', 'BOY'],
            malzeme_cinsi: ['mazleme', 'malzeme cinsi', 'malzeme', 'material', 'malzeme cinsi:', 'malzeme:', 'MAZLEME']
        };

        // Sütun indekslerini bul - case insensitive ve trim işlemi
        const columnMapping = {};
        Object.keys(expectedColumns).forEach(key => {
            const index = headers.findIndex(header => {
                if (!header) return false;
                const cleanHeader = header.toString().toLowerCase().trim();
                return expectedColumns[key].some(expected => 
                    cleanHeader === expected.toLowerCase() || 
                    cleanHeader.includes(expected.toLowerCase()) ||
                    expected.toLowerCase().includes(cleanHeader)
                );
            });
            if (index !== -1) {
                columnMapping[key] = index;
                console.log(`[DEBUG] ${key} sütunu bulundu: index ${index}, başlık: "${headers[index]}"`);
            } else {
                console.log(`[WARNING] ${key} sütunu bulunamadı. Beklenen: ${expectedColumns[key].join(', ')}`);
            }
        });

        console.log('[DEBUG] Sütun mapping:', columnMapping);

        // Firma sütunlarını bul (5. sütundan sonraki tüm sütunlar)
        const firmaColumns = [];
        const baseColumnCount = 5; // adet, parça, kesit, uzunluk, malzeme cinsi
        for (let i = baseColumnCount; i < headers.length; i++) {
            if (headers[i] && headers[i].toString().trim()) {
                firmaColumns.push({
                    index: i,
                    firmaAdi: headers[i].toString().trim()
                });
            }
        }

        console.log('[DEBUG] Bulunan firma sütunları:', firmaColumns);

        // Veri satırlarını işle (3. satırdan başlayarak - index 2)
        const processedData = [];
        for (let rowIndex = 2; rowIndex < jsonData.length; rowIndex++) {
            const row = jsonData[rowIndex];
            
            // Boş satırları atla
            if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
                console.log(`[DEBUG] Satır ${rowIndex + 1} boş, atlanıyor`);
                continue;
            }

            console.log(`[DEBUG] Satır ${rowIndex + 1} işleniyor:`, row);

            const baseData = {
                satir_no: rowIndex + 1,
                adet: columnMapping.adet !== undefined ? (row[columnMapping.adet] || 0) : 0,
                parca_kodu: columnMapping.parca_kodu !== undefined ? (row[columnMapping.parca_kodu] || '').toString().trim() : '',
                malzeme_kesiti: columnMapping.malzeme_kesiti !== undefined ? (row[columnMapping.malzeme_kesiti] || '').toString().trim() : '',
                uzunluk: columnMapping.uzunluk !== undefined ? (row[columnMapping.uzunluk] || '').toString().trim() : '',
                malzeme_cinsi: columnMapping.malzeme_cinsi !== undefined ? (row[columnMapping.malzeme_cinsi] || '').toString().trim() : '',
                firmalar: []
            };

            console.log(`[DEBUG] Satır ${rowIndex + 1} base data:`, baseData);

            // Her firma için teklif fiyatını al
            firmaColumns.forEach(firma => {
                const fiyat = row[firma.index];
                console.log(`[DEBUG] Firma ${firma.firmaAdi} (index ${firma.index}): fiyat = "${fiyat}"`);
                if (fiyat && fiyat.toString().trim() !== '') {
                    baseData.firmalar.push({
                        firma_adi: firma.firmaAdi,
                        teklif_fiyati: parseFloat(fiyat.toString().replace(',', '.')) || 0
                    });
                }
            });

            console.log(`[DEBUG] Satır ${rowIndex + 1} firmalar:`, baseData.firmalar);

            // En az bir firma teklifi varsa veya zorunlu alanlar doluysa ekle
            if ((baseData.firmalar.length > 0 && baseData.parca_kodu) || baseData.parca_kodu) {
                processedData.push(baseData);
                console.log(`[DEBUG] Satır ${rowIndex + 1} eklendi`);
            } else {
                console.log(`[DEBUG] Satır ${rowIndex + 1} eklenmedi - parça kodu: "${baseData.parca_kodu}", firma sayısı: ${baseData.firmalar.length}`);
            }
        }

        console.log('[DEBUG] İşlenen veri sayısı:', processedData.length);
        console.log('[DEBUG] İşlenen verinin ilk 3 elemanı:', processedData.slice(0, 3));
        
        if (processedData.length === 0) {
            console.log('[WARNING] Hiç veri işlenemedi. Muhtemel nedenler:');
            console.log('- Sütun başlıkları tanınmadı:', columnMapping);
            console.log('- Firma sütunları bulunamadı:', firmaColumns);
            console.log('- Boş satırlar veya eksik veriler');
        }
        
        res.status(200).json({
            message: 'Excel dosyası başarıyla parse edildi',
            teklifGrubuAdi: teklifGrubuAdi,
            headers: headers,
            columnMapping: columnMapping,
            firmaColumns: firmaColumns,
            data: processedData,
            totalRows: processedData.length
        });

    } catch (error) {
        console.error('[HATA] Excel parse edilirken hata:', error);
        res.status(500).json({ 
            message: 'Excel dosyası işlenirken hata oluştu', 
            error: error.message 
        });
    }
};

// Parça kodu kontrol endpoint'i
exports.checkParcaKodu = async (req, res) => {
    try {
        const { parca_kodu } = req.query;
        
        if (!parca_kodu) {
            return res.status(400).json({ message: 'Parça kodu belirtilmemiş' });
        }

        console.log('[DEBUG] Parça kodu kontrol ediliyor:', parca_kodu);

        // Önce tam eşleşme ile ara
        let parca = await Parca.findOne({
            where: { parcaKodu: parca_kodu }
        });

        // Tam eşleşme yoksa case-insensitive arama yap (SQLite için UPPER kullan)
        if (!parca) {
            parca = await Parca.findOne({
                where: sequelize.where(
                    sequelize.fn('UPPER', sequelize.col('parcaKodu')),
                    'LIKE',
                    parca_kodu.toUpperCase()
                )
            });
        }

        // Hala bulunamadıysa LIKE ile esnek arama (SQLite için UPPER kullan)
        if (!parca) {
            parca = await Parca.findOne({
                where: sequelize.where(
                    sequelize.fn('UPPER', sequelize.col('parcaKodu')),
                    'LIKE',
                    `%${parca_kodu.toUpperCase()}%`
                )
            });
        }

        const response = {
            parca_kodu: parca_kodu,
            exists: !!parca,
            parca: parca ? {
                parcaKodu: parca.parcaKodu,
                parcaAdi: parca.parcaAdi,
                malzemeCinsi: parca.malzemeCinsi,
                hamMalzemeOlculeri: parca.hamMalzemeOlculeri
            } : null
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('[HATA] Parça kodu kontrol edilirken hata:', error);
        res.status(500).json({ 
            message: 'Parça kodu kontrol edilirken hata oluştu', 
            error: error.message 
        });
    }
};

// Toplu teklif kaydetme
exports.bulkCreateTeklifler = async (req, res) => {
    try {
        const { teklifData } = req.body;
        
        if (!teklifData || !Array.isArray(teklifData)) {
            return res.status(400).json({ message: 'Geçersiz teklif verisi' });
        }

        console.log('[DEBUG] Toplu teklif kaydı başlatılıyor. Toplam kayıt:', teklifData.length);

        const results = {
            basarili: [],
            basarisiz: [],
            toplam: teklifData.length
        };

        // Her teklif için işlem yap
        for (let i = 0; i < teklifData.length; i++) {
            const teklif = teklifData[i];
            
            try {
                // Zorunlu alan kontrolü
                if (!teklif.parca_kodu || !teklif.firma_adi || !teklif.teklif_fiyati) {
                    results.basarisiz.push({
                        satir_no: teklif.satir_no || (i + 1),
                        parca_kodu: teklif.parca_kodu,
                        firma_adi: teklif.firma_adi,
                        hata: 'Eksik zorunlu alanlar (parça kodu, firma adı, teklif fiyatı)'
                    });
                    continue;
                }

                // Parça kontrolü
                const parca = await Parca.findOne({
                    where: { parcaKodu: teklif.parca_kodu }
                });

                if (!parca) {
                    results.basarisiz.push({
                        satir_no: teklif.satir_no || (i + 1),
                        parca_kodu: teklif.parca_kodu,
                        firma_adi: teklif.firma_adi,
                        hata: 'Parça kodu bulunamadı'
                    });
                    continue;
                }

                // Teklif oluştur
                const yeniTeklif = await FasonTeklif.create({
                    parca_kodu: parca.parcaKodu,
                    tedarikci: teklif.firma_adi,
                    teklif_fiyati: parseFloat(teklif.teklif_fiyati),
                    teslim_suresi: parseInt(teklif.teslim_suresi) || 30,
                    aciklama: teklif.aciklama || null,
                    teklif_tarihi: new Date(),
                    durumu: 'aktif'
                });

                results.basarili.push({
                    satir_no: teklif.satir_no || (i + 1),
                    teklif_id: yeniTeklif.teklif_id,
                    parca_kodu: parca.parcaKodu,
                    firma_adi: teklif.firma_adi,
                    teklif_fiyati: yeniTeklif.teklif_fiyati
                });

            } catch (error) {
                console.error(`[HATA] ${i + 1}. satır için teklif oluşturulamadı:`, error);
                results.basarisiz.push({
                    satir_no: teklif.satir_no || (i + 1),
                    parca_kodu: teklif.parca_kodu,
                    firma_adi: teklif.firma_adi,
                    hata: error.message
                });
            }
        }

        console.log('[DEBUG] Toplu teklif kaydı tamamlandı:', {
            toplam: results.toplam,
            basarili: results.basarili.length,
            basarisiz: results.basarisiz.length
        });

        res.status(200).json({
            message: 'Toplu teklif kaydı tamamlandı',
            results: results
        });

    } catch (error) {
        console.error('[HATA] Toplu teklif kaydedilirken hata:', error);
        res.status(500).json({ 
            message: 'Toplu teklif kaydedilirken hata oluştu', 
            error: error.message 
        });
    }
};

// Upload middleware'ini export et
exports.uploadExcelMiddleware = upload.single('excel');

// n8n webhook proxy - Teklif dokümanlarını analiz et
exports.analyzeTeklifDocuments = async (req, res) => {
    try {
        const { documents } = req.body;

        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'En az bir doküman sağlanmalıdır'
            });
        }

        console.log('[DEBUG] Teklif doküman analizi başlatılıyor. Doküman sayısı:', documents.length);

        // n8n webhook URL
        const n8nWebhookUrl = 'https://n8n.igenis.com/webhook/teklif-analiz';

        // n8n'e istek gönder
        const requestBody = {
            request_id: `teklif-analiz-${Date.now()}`,
            timestamp: new Date().toISOString(),
            documents: documents
        };

        console.log('[DEBUG] n8n webhook\'e istek gönderiliyor:', {
            url: n8nWebhookUrl,
            document_count: documents.length
        });

        const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // Response body kontrolü - boş ise default response
        const responseText = await n8nResponse.text();

        if (!responseText || responseText.trim() === '') {
            console.warn('[WARN] n8n webhook boş response döndürdü');
            return res.status(200).json({
                success: true,
                teklifler: [],
                metadata: {
                    model: 'gemini-2.0-flash-exp',
                    processed_at: new Date().toISOString(),
                    workflow_version: '1.2.0',
                    total_teklifler: 0,
                    warning: 'n8n returned empty response, possibly due to rate limiting'
                }
            });
        }

        if (!n8nResponse.ok) {
            throw new Error(`n8n webhook hatası: ${n8nResponse.status} ${n8nResponse.statusText}`);
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[HATA] n8n JSON parse hatası:', parseError.message);
            console.error('[HATA] Response length:', responseText.length);
            return res.status(200).json({
                success: true,
                teklifler: [],
                metadata: {
                    model: 'gemini-2.0-flash-exp',
                    processed_at: new Date().toISOString(),
                    workflow_version: '1.2.0',
                    total_teklifler: 0,
                    warning: 'Invalid JSON from n8n, possibly due to rate limiting'
                }
            });
        }

        console.log('[DEBUG] n8n yanıtı alındı:', {
            success: result.success,
            teklif_count: result.teklifler ? result.teklifler.length : 0
        });

        res.status(200).json(result);

    } catch (error) {
        console.error('[HATA] Teklif doküman analizi başarısız:', error);
        res.status(500).json({
            success: false,
            message: 'Teklif dokümanları analiz edilirken hata oluştu',
            error: error.message
        });
    }
};
