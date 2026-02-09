const fs = require('fs');
const sequelize = require('./src/config/database').sequelize;

async function fixBomItemsV2() {
  try {
    console.log('CSV dosyası manuel işleniyor...');
    
    // Test - ilk BOM'u manuel olarak düzeltelim
    const testItems = `[{""type"":""PARCA"",""name"":""56_SERI_KANAL_ACMA_BICAK"",""quantity"":1},{""type"":""PARCA"",""name"":""KB_KANAL_ACMA_009"",""quantity"":1}]`;
    
    // Double quote'ları normal quote'lara çevir
    let fixed = testItems.replace(/""/g, '"');
    console.log('Test JSON:', fixed);
    
    let parsed = JSON.parse(fixed);
    console.log('Test parse başarılı:', parsed.length, 'item');
    
    // Tüm CSV'yi işle
    const csvData = fs.readFileSync('../boms_export.csv', 'utf8');
    const lines = csvData.split('\n');
    
    let fixedCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Manuel CSV parsing - items alanını bul
        const parts = line.split(',');
        if (parts.length < 6) continue;
        
        const name = parts[1];
        
        // Items alanını bul - tırnak içindeki kısmı al
        const itemsStart = line.indexOf('"[{');
        const itemsEnd = line.lastIndexOf('}]"');
        
        if (itemsStart === -1 || itemsEnd === -1) {
          console.log('Items bulunamadı:', name);
          continue;
        }
        
        let itemsRaw = line.substring(itemsStart + 1, itemsEnd + 2);
        
        // Double quote'ları normal quote'lara çevir
        let itemsFixed = itemsRaw.replace(/""/g, '"');
        
        // JSON parse et
        let parsedItems = JSON.parse(itemsFixed);
        
        // BOM kodunu oluştur
        const bomKodu = name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        
        // Database'de güncelle
        await sequelize.query(
          'UPDATE boms SET items = ? WHERE bom_kodu = ?',
          {
            replacements: [JSON.stringify(parsedItems), bomKodu],
            type: sequelize.QueryTypes.UPDATE
          }
        );
        
        fixedCount++;
        console.log(`${fixedCount}. ${name}: ${parsedItems.length} items düzeltildi`);
        
      } catch (error) {
        console.error('Satır', i, 'hatası:', error.message);
      }
    }
    
    console.log('Toplam', fixedCount, 'BOM düzeltildi!');
  } catch (error) {
    console.error('Genel hata:', error);
  } finally {
    process.exit();
  }
}

fixBomItemsV2();