const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const { sequelize } = require('./src/config/database');
const Bom = require('./src/models/Bom');

async function backupBomData() {
  try {
    console.log('BOM verilerini yedekleme başlatılıyor...');

    // Veritabanı bağlantısını başlat
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');

    // Tüm BOM verilerini al
    const boms = await Bom.findAll({
      raw: true
    });

    if (boms.length === 0) {
      console.log('Yedeklenecek BOM verisi bulunamadı.');
      return;
    }

    console.log(`${boms.length} BOM kaydı bulundu, yedekleniyor...`);

    // Tarih damgası ile dosya adı oluştur
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `boms_backup_${timestamp}.csv`;
    const backupPath = path.join(__dirname, '..', backupFileName);

    // CSV writer'ı yapılandır
    const csvWriter = createObjectCsvWriter({
      path: backupPath,
      header: [
        { id: 'id', title: 'id' },
        { id: 'bom_kodu', title: 'bom_id' },
        { id: 'name', title: 'name' },
        { id: 'bom_aciklamasi', title: 'description' },
        { id: 'items', title: 'items' },
        { id: 'kategori', title: 'category' },
        { id: 'versiyon', title: 'version' },
        { id: 'aktif', title: 'active' },
        { id: 'malzeme_maliyeti', title: 'material_cost' },
        { id: 'iscilik_maliyeti', title: 'labor_cost' },
        { id: 'fason_maliyeti', title: 'subcontract_cost' },
        { id: 'toplam_maliyet', title: 'total_cost' },
        { id: 'createdAt', title: 'created_at' },
        { id: 'updatedAt', title: 'updated_at' }
      ]
    });

    // CSV dosyasını yaz
    await csvWriter.writeRecords(boms);

    console.log(`✅ BOM verileri başarıyla yedeklendi: ${backupPath}`);
    console.log(`📊 Yedeklenen kayıt sayısı: ${boms.length}`);

    // Dosya boyutunu göster
    const stats = fs.statSync(backupPath);
    const fileSize = (stats.size / 1024).toFixed(2);
    console.log(`📁 Dosya boyutu: ${fileSize} KB`);

    return backupPath;

  } catch (error) {
    console.error('BOM yedekleme hatası:', error.message);
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
  backupBomData()
    .then((backupPath) => {
      console.log(`\n🎉 BOM yedekleme başarıyla tamamlandı!\n📂 Dosya: ${backupPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ BOM yedekleme başarısız:', error.message);
      process.exit(1);
    });
}

module.exports = { backupBomData };