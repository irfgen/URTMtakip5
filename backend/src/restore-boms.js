const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Bom, sequelize } = require('./models'); // sequelize'ı buradan alıyoruz

async function restoreBoms() {
    console.log('BOM geri yükleme işlemi başlatılıyor...');
    const csvFilePath = path.join(__dirname, '..', 'boms_export.csv');

    if (!fs.existsSync(csvFilePath)) {
        console.error(`Hata: CSV dosyası bulunamadı: ${csvFilePath}`);
        return;
    }

    let transaction;
    try {
        await sequelize.authenticate();
        console.log('Veritabanı bağlantısı başarıyla kuruldu.');

        transaction = await sequelize.transaction();

        console.log('Mevcut BOM verileri temizleniyor...');
        await Bom.destroy({ where: {}, transaction });
        console.log('Mevcut BOM verileri temizlendi.');

        const bomsToProcess = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (!row.name || row.name.trim() === '') {
                        console.warn('"name" sütunu boş olan satır atlanıyor:', row);
                        return;
                    }
                    const bomData = {
                        bom_kodu: row.name,
                        name: row.name,
                        bom_aciklamasi: row.description,
                        versiyon: row.versiyon || '1.0',
                        aktif: row.aktif === 'true' ? true : false,
                        kategori: row.kategori || null,
                        malzeme_maliyeti: parseFloat(row.malzeme_maliyeti) || 0,
                        iscilik_maliyeti: parseFloat(row.iscilik_maliyeti) || 0,
                        fason_maliyeti: parseFloat(row.fason_maliyeti) || 0,
                        toplam_maliyet: parseFloat(row.toplam_maliyet) || 0,
                        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
                        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
                    };

                    if (row.items) {
                        try {
                            let itemsArray = JSON.parse(row.items);
                            if (typeof itemsArray === 'string') {
                                itemsArray = JSON.parse(itemsArray); // Handle double-encoded JSON
                            }

                            if (Array.isArray(itemsArray)) {
                                bomData.items = itemsArray.map(item => ({
                                    ...item,
                                    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
                                    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
                                }));
                            } else {
                                console.warn(`BOM kodu ${row.name} için "items" bir diziye dönüştürülemedi.`);
                                bomData.items = [];
                            }
                        } catch (e) {
                            console.warn(`BOM kodu ${row.name} için öğeler ayrıştırılırken hata oluştu:`, e.message);
                            bomData.items = [];
                        }
                    } else {
                        bomData.items = [];
                    }
                    bomsToProcess.push(bomData);
                })
                .on('end', () => {
                    console.log('CSV okuma tamamlandı. Toplam BOM:', bomsToProcess.length);
                    resolve();
                })
                .on('error', (err) => {
                    console.error('CSV okuma hatası:', err);
                    reject(err);
                });
        });

        console.log(`${bomsToProcess.length} adet BOM işlenecek...`);

        for (const bomData of bomsToProcess) {
            try {
                const [bom, created] = await Bom.findOrCreate({
                    where: { bom_kodu: bomData.bom_kodu },
                    defaults: bomData,
                    transaction,
                });

                if (!created) {
                    await bom.update(bomData, { transaction });
                    // console.log(`BOM ${bom.bom_kodu} güncellendi.`); // Loglamayı azaltmak için kapatıldı
                }
            } catch (error) {
                console.error(`BOM ${bomData.bom_kodu} işlenirken hata oluştu:`, error.message);
            }
        }
        
        console.log('Tüm BOM\'lar başarıyla işlendi.');

        await transaction.commit();
        console.log('BOM geri yükleme işlemi başarıyla tamamlandı.');

    } catch (error) {
        if (transaction) {
            await transaction.rollback();
            console.log('İşlem geri alındı.');
        }
        console.error('BOM geri yükleme işlemi sırasında genel bir hata oluştu:', error);
    }
}

restoreBoms();