const fs = require('fs');
const sequelize = require('./src/config/database').sequelize;

async function importBomsFromCsv() {
  try {
    console.log('CSV dosyası okunuyor...');
    const csvData = fs.readFileSync('../boms_export.csv', 'utf8');
    const lines = csvData.split('\n');
    const header = lines[0];
    
    console.log('Toplam satır:', lines.length);
    
    let imported = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // CSV satırını parse et - virgül ile ayrılmış ama tırnak içindeki virgülleri hesaba kat
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
        fields.push(current); // Son alanı ekle
        
        if (fields.length < 6) {
          console.log('Eksik alan, atlanan satır:', i);
          continue;
        }
        
        const [bom_id, name, description, items, created_at, updated_at] = fields;
        
        // Items JSON'ını parse et ve düzelt
        let parsedItems = [];
        try {
          if (items && items !== '""') {
            // Çift tırnak escape'lerini düzelt
            let cleanItems = items.replace(/^"|"$/g, ''); // Baş ve sondaki tırnakları kaldır
            cleanItems = cleanItems.replace(/""/g, '"'); // Çift tırnakları tek yap
            parsedItems = JSON.parse(cleanItems);
          }
        } catch (e) {
          console.log('Items parse hatası satır', i, ':', e.message);
          parsedItems = [];
        }
        
        // BOM kodunu oluştur
        const bomKodu = name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        
        // Database'e ekle
        await sequelize.query(
          'INSERT INTO boms (bom_kodu, name, bom_aciklamasi, items, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
          {
            replacements: [
              bomKodu,
              name,
              description || '',
              JSON.stringify(parsedItems),
              created_at || new Date().toISOString(),
              updated_at || new Date().toISOString()
            ],
            type: sequelize.QueryTypes.INSERT
          }
        );
        
        imported++;
        if (imported % 10 === 0) {
          console.log(imported, 'BOM import edildi...');
        }
        
      } catch (error) {
        console.error('Satır', i, 'import hatası:', error.message);
      }
    }
    
    console.log('Toplam', imported, 'BOM başarıyla import edildi!');
  } catch (error) {
    console.error('CSV import hatası:', error);
  } finally {
    process.exit();
  }
}

importBomsFromCsv();