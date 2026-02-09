const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { sequelize } = require('./backend/src/config/database');
const Bom = require('./backend/src/models/Bom');

async function restoreBoms() {
  try {
    console.log('Veritabanı bağlantısı kuruluyor...');
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');

    // CSV dosyasının yolu
    const csvFilePath = path.join(__dirname, 'boms_export.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV dosyası bulunamadı: ${csvFilePath}`);
    }

    console.log('CSV dosyası okunuyor...');
    const bomsData = await readCSVFile(csvFilePath);
    console.log(`${bomsData.length} BOM kaydı okundu.`);

    // Mevcut BOM kayıtlarını temizle (isteğe bağlı)
    console.log('Mevcut BOM kayıtları temizleniyor...');
    await Bom.destroy({ where: {}, truncate: true });
    console.log('Mevcut kayıtlar temizlendi.');

    // Yeni kayıtları ekle
    console.log('Yeni BOM kayıtları ekleniyor...');
    const processedData = bomsData.map(row => {
      // CSV sütunlarını model alanlarına eşle
      const bomData = {
        // CSV'deki bom_id'yi kullanmıyoruz, auto-increment id kullanacağız
        bom_kodu: row.name || 'UNKNOWN', // name'i bom_kodu olarak kullan
        name: row.name || 'Unnamed BOM',
        bom_aciklamasi: row.description || null,
        versiyon: '1.0', // Varsayılan değer
        aktif: true, // Varsayılan değer
        kategori: null, // CSV'de yok, null bırak
        items: row.items ? JSON.parse(row.items) : [],
        malzeme_maliyeti: null,
        iscilik_maliyeti: null,
        fason_maliyeti: null,
        toplam_maliyet: null,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
      };
      
      return bomData;
    });

    // Toplu ekleme işlemi
    await Bom.bulkCreate(processedData, {
      validate: true,
      individualHooks: false
    });

    console.log(`${processedData.length} BOM kaydı başarıyla eklendi.`);
    
    // Sonuçları kontrol et
    const totalCount = await Bom.count();
    console.log(`Toplam BOM kayıt sayısı: ${totalCount}`);
    
  } catch (error) {
    console.error('Hata oluştu:', error.message);
    console.error('Detay:', error);
  } finally {
    try {
      await sequelize.close();
      console.log('Veritabanı bağlantısı kapatıldı.');
    } catch (closeError) {
      console.error('Veritabanı bağlantısı kapatılırken hata:', closeError.message);
    }
  }
}

function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Script'i çalıştır
if (require.main === module) {
  restoreBoms();
}

module.exports = { restoreBoms };