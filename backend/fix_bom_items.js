const fs = require('fs');
const sequelize = require('./src/config/database').sequelize;

async function fixBomItems() {
  try {
    console.log('CSV dosyası tekrar okunuyor...');
    const csvData = fs.readFileSync('../boms_export.csv', 'utf8');
    const lines = csvData.split('\n');
    
    let fixed = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // CSV satırını parse et
        const fields = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            fields.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        fields.push(current);
        
        if (fields.length < 6) continue;
        
        const [bom_id, name, description, items] = fields;
        
        // Items JSON'ını düzgün parse et
        let parsedItems = [];
        if (items && items !== '""') {
          try {
            // Özel parsing mantığı - CSV'deki JSON format sorunları
            let cleanItems = items;
            
            // Baş ve sondaki tırnakları kaldır
            if (cleanItems.startsWith('"') && cleanItems.endsWith('"')) {
              cleanItems = cleanItems.slice(1, -1);
            }
            
            // Çift tırnakları tek yap
            cleanItems = cleanItems.replace(/""/g, '"');
            
            // JSON parse et
            parsedItems = JSON.parse(cleanItems);
            
            // Eğer parsedItems array değilse boş array yap
            if (!Array.isArray(parsedItems)) {
              parsedItems = [];
            }
            
          } catch (e) {
            // Parse edilemezse boş array
            parsedItems = [];
          }
        }
        
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
        
        fixed++;
        if (fixed % 10 === 0) {
          console.log(fixed, 'BOM items düzeltildi... (Son:', name, '- Items:', parsedItems.length, 'adet)');
        }
        
      } catch (error) {
        console.error('Satır', i, 'düzeltme hatası:', error.message);
      }
    }
    
    console.log('Toplam', fixed, 'BOM items düzeltildi!');
  } catch (error) {
    console.error('Items düzeltme hatası:', error);
  } finally {
    process.exit();
  }
}

fixBomItems();