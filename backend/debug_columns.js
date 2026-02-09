const { sequelize } = require('./src/config/database');

async function debugColumns() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database bağlantısı başarılı');

        // is_emirleri tablosu sütunlarını kontrol et
        console.log('\n📋 is_emirleri tablosu sütunları:');
        const [columns] = await sequelize.query("PRAGMA table_info(is_emirleri)");
        
        let hasUpdatedAt = false;
        let hasGuncellemeAt = false;
        
        columns.forEach(col => {
            console.log(`  ${col.name}: ${col.type}`);
            if (col.name === 'updated_at') hasUpdatedAt = true;
            if (col.name === 'guncelleme_tarihi') hasGuncellemeAt = true;
        });

        console.log(`\n🔍 Sütun kontrol:`)
        console.log(`  updated_at: ${hasUpdatedAt ? '✅ VAR' : '❌ YOK'}`);
        console.log(`  guncelleme_tarihi: ${hasGuncellemeAt ? '✅ VAR' : '❌ YOK'}`);

        // parca_isleme_kayitlari tablosu var mı kontrol et
        console.log('\n📋 parca_isleme_kayitlari tablosu:');
        try {
            const [parcaColumns] = await sequelize.query("PRAGMA table_info(parca_isleme_kayitlari)");
            if (parcaColumns.length > 0) {
                console.log('  ✅ Tablo mevcut:');
                parcaColumns.forEach(col => {
                    console.log(`    ${col.name}: ${col.type}`);
                });
            } else {
                console.log('  ❌ Tablo boş');
            }
        } catch (error) {
            console.log('  ❌ Tablo yok - oluşturulması gerekebilir');
            console.log(`  Hata: ${error.message}`);
        }

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

debugColumns();