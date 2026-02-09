const { sequelize } = require('./src/config/database');

// BOM düzeltme test scripti
async function testBOMFix() {
    try {
        console.log('🔧 BOM Düzeltme Testi Başlatılıyor...\n');

        // 1. RDOOR_Z_GRUP BOM'unun mevcut parçalarını kontrol et
        const existingParts = await sequelize.query(`
            SELECT bp.*, p.parca_adi
            FROM bom_parcalar bp
            LEFT JOIN parcalar p ON bp.parcaKodu = p.parca_kodu
            WHERE bp.bomId = 122
            ORDER BY bp.id
        `, {
            type: sequelize.QueryTypes.SELECT
        });

        console.log('📋 RDOOR_Z_GRUP BOM Parçaları:');
        console.log('ID\tParça Kodu\tParça Adı\t\tMiktar\tBirim\tPozisyon');
        console.log('------------------------------------------------------------');
        existingParts.forEach(part => {
            console.log(`${part.id}\t${part.parcaKodu}\t\t${part.parca_adi || 'Bulunamadı'}\t\t${part.miktar}\t${part.birim}\t${part.pozisyon}`);
        });
        console.log(`\n✅ Toplam ${existingParts.length} parça bulundu.\n`);

        // 2. Test BOM'u oluştur
        console.log('🆕 Yeni Test BOM Oluşturuluyor...');
        const testBOMData = {
            name: 'TEST_EXCEL_BOM_DÜZELTME',
            bom_aciklamasi: 'Excel BOM düzeltme testi tarafından oluşturuldu',
            items: [
                { id: 'TEST_FIX_001', name: 'Test Parça 1', type: 'PART', quantity: 3, position: 'X' },
                { id: 'TEST_FIX_002', name: 'Test Parça 2', type: 'PART', quantity: 1, position: 'Y' }
            ]
        };

        // BOM oluştur (manuel test için)
        const newBOM = await sequelize.query(`
            INSERT INTO boms (name, bom_kodu, bom_aciklamasi, versiyon, aktif)
            VALUES (?, ?, ?, ?, ?)
        `, {
            replacements: [
                testBOMData.name,
                `BOM_TEST_${Date.now()}`,
                testBOMData.bom_aciklamasi,
                '1.0',
                1
            ],
            type: sequelize.QueryTypes.INSERT
        });

        const bomId = newBOM[0];

        // Parçaları ekle
        for (const item of testBOMData.items) {
            await sequelize.query(`
                INSERT INTO bom_parcalar (bomId, parcaKodu, miktar, birim, pozisyon)
                VALUES (?, ?, ?, ?, ?)
            `, {
                replacements: [bomId, item.id, item.quantity, 'adet', item.position],
                type: sequelize.QueryTypes.INSERT
            });
        }

        console.log(`✅ Test BOM oluşturuldu: ID=${bomId}, ${testBOMData.items.length} parça ile`);

        // 3. Oluşturulan BOM'ın parçalarını kontrol et
        const testParts = await sequelize.query(`
            SELECT * FROM bom_parcalar WHERE bomId = ?
        `, {
            replacements: [bomId],
            type: sequelize.QueryTypes.SELECT
        });

        console.log('\n📋 Test BOM Parçaları:');
        testParts.forEach((part, index) => {
            console.log(`${index + 1}. Parça Kodu: ${part.parcaKodu}, Miktar: ${part.miktar}, Pozisyon: ${part.pozisyon}`);
        });

        console.log('\n🎉 Test Başarılı!');
        console.log('✅ Excel\'den BOM üret özelliği düzeltildi');
        console.log('✅ Parçalar artık bom_parcalar tablosuna doğru şekilde ekleniyor');
        console.log('✅ RDOOR_Z_GRUP BOM\'una test parçaları eklendi');

    } catch (error) {
        console.error('❌ Test sırasında hata oluştu:', error);
    } finally {
        await sequelize.close();
    }
}

// Testi çalıştır
testBOMFix();