const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sequelize } = require('./src/config/database');
const Bom = require('./src/models/Bom');
const { v4: uuidv4 } = require('uuid');

async function restoreBomsFromCSV() {
  try {
    console.log('BOM verilerini CSV dosyasından geri yükleme başlatılıyor...');
    
    // Veritabanı bağlantısını başlat
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');
    
    // CSV dosyasının yolunu belirle
    const csvPath = path.join(__dirname, '../boms_export.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV dosyası bulunamadı: ${csvPath}`);
    }
    
    console.log(`CSV dosyası okunuyor: ${csvPath}`);
    
    const results = [];
    
    // CSV dosyasını oku
    const processedData = await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
          try {
            // CSV'deki items JSON string'ini parse et
            let items = [];
            if (data.items) {
              items = JSON.parse(data.items);
            }
            
            // BOM verisini hazırla
            const bomData = {
              bom_kodu: uuidv4(), // Yeni UUID oluştur
              name: data.name,
              bom_aciklamasi: data.description,
              versiyon: '1.0',
              aktif: true,
              kategori: 'Excel Import',
              items: items,
              createdAt: new Date(data.created_at),
              updatedAt: new Date(data.updated_at)
            };
            
            results.push(bomData);
          } catch (parseError) {
            console.error('Satır parse hatası:', parseError.message, data);
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          console.error('CSV okuma hatası:', error.message);
          reject(error);
        });
    });
    
    console.log(`${processedData.length} BOM kaydı işlenecek...`);
    
    // Mevcut BOM kayıtlarını temizle (isteğe bağlı)
    console.log('Mevcut BOM kayıtları temizleniyor...');
    await Bom.destroy({ where: {} });
    
    // Yeni kayıtları toplu olarak ekle
    console.log('Yeni BOM kayıtları ekleniyor...');
    const createdBoms = await Bom.bulkCreate(processedData, {
      validate: true,
      ignoreDuplicates: false
    });
    
    console.log(`✅ ${createdBoms.length} BOM kaydı başarıyla geri yüklendi!`);
    
    // Sonuçları göster
    console.log('\n📊 Geri yuklenen BOMlar:');
    createdBoms.forEach((bom, index) => {
      console.log(`${index + 1}. ${bom.name} - ${bom.items.length} bileşen`);
    });
    
    return createdBoms;
    
  } catch (error) {
    console.error('BOM geri yükleme hatası:', error.message);
    throw error;
  } finally {
    // Veritabanı bağlantısını kapat
    try {
      await sequelize.close();
      console.log('Veritabanı bağlantısı kapatıldı.');
    } catch (closeError) {
      console.error('Bağlantı kapatma hatası:', closeError.message);
    }
  }
}

// Script'i çalıştır
if (require.main === module) {
  restoreBomsFromCSV()
    .then(() => {
      console.log('\n🎉 BOM verileri başarıyla geri yüklendi!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ BOM geri yükleme başarısız:', error.message);
      process.exit(1);
    });
}

module.exports = { restoreBomsFromCSV };