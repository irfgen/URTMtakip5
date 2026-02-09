const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sequelize } = require('./src/config/database');
const Bom = require('./src/models/Bom');
const { QueryTypes } = require('sequelize');

async function importBOMsFromCSV() {
  try {
    console.log('BOM import işlemi başlatılıyor...');

    // Veritabanı bağlantısını kontrol et
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');

    const csvFilePath = path.join(__dirname, 'boms_export.csv');
    const results = [];

    // CSV dosyasını oku
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        console.log(`CSV dosyasından ${results.length} BOM kaydı okundu.`);

        try {
          // Mevcut BOM kayıtlarını temizle (isteğe bağlı)
          await Bom.destroy({ where: {} });
          await sequelize.query('DELETE FROM bom_parcalar', { type: QueryTypes.DELETE });
          console.log('Mevcut BOM kayıtları temizlendi.');

          // Her BOM kaydı için işlem yap
          for (const bomData of results) {
            try {
              // Bom kaydını oluştur (doğrudan SQL ile)
              const insertResult = await sequelize.query(
                'INSERT INTO boms (bom_kodu, name, bom_aciklamasi, versiyon, aktif, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                {
                  replacements: [
                    bomData.name || bomData.bom_id,
                    bomData.name,
                    bomData.description || '',
                    '1.0',
                    1,
                    bomData.created_at ? new Date(bomData.created_at) : new Date(),
                    bomData.updated_at ? new Date(bomData.updated_at) : new Date()
                  ],
                  type: QueryTypes.INSERT
                }
              );

              // Yeni eklenen BOM'un ID'sini al
              const [bomRecord] = await sequelize.query(
                'SELECT id FROM boms WHERE bom_kodu = ? ORDER BY id DESC LIMIT 1',
                {
                  replacements: [bomData.name || bomData.bom_id],
                  type: QueryTypes.SELECT
                }
              );

              // Items alanını parse et ve parçaları ekle
              let items = [];
              if (bomData.items) {
                try {
                  items = JSON.parse(bomData.items);
                } catch (e) {
                  console.warn(`BOM ${bomData.name} için items parse edilemedi:`, e.message);
                  items = [];
                }
              }

              // BOM parçalarını ekle
              for (const item of items) {
                try {
                  await sequelize.query(
                    'INSERT INTO bom_parcalar (bomId, parcaKodu, miktar, birim, pozisyon, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
                    {
                      replacements: [bomRecord.id, item.name || '', item.quantity || 1, 'adet', item.type || ''],
                      type: QueryTypes.INSERT
                    }
                  );
                } catch (itemError) {
                  console.warn(`⚠️  BOM parçası eklenemedi (${item.name}):`, itemError.message);
                }
              }

              console.log(`✅ BOM eklendi: ${bomData.name} (${items.length} bileşen)`);
            } catch (error) {
              console.error(`❌ BOM ekleme hatası (${bomData.name}):`, error.message);
            }
          }

          console.log('\n🎉 BOM import işlemi tamamlandı!');

          // İstatistikleri göster
          const totalBOMs = await Bom.count();
          console.log(`📊 Toplam imported BOM sayısı: ${totalBOMs}`);

        } catch (error) {
          console.error('Import sırasında veritabanı hatası:', error);
        } finally {
          // Veritabanı bağlantısını kapat
          await sequelize.close();
        }
      });

  } catch (error) {
    console.error('Import işlemi başlatılırken hata:', error);
  }
}

// Script'i çalıştır
importBOMsFromCSV();