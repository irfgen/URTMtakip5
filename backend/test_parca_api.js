const { sequelize } = require('./src/config/database');

async function testParcaAPI() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database bağlantısı başarılı');

        // Test verisi - ESP32'den gelecek veri formatında
        const testData = {
            tezgah_id: 25,
            is_emri_id: 859,
            baslangic_zamani: "2025-01-27T10:00:00Z",
            bitis_zamani: "2025-01-27T10:05:00Z", 
            isleme_suresi_dakika: 5,
            timestamp: "2025-01-27T10:05:00Z",
            esp32_kayit_id: "TEST_ESP32_25_123456"
        };

        console.log('\n🧪 Parça işleme API test ediliyor...');
        console.log('Test verisi:', JSON.stringify(testData, null, 2));

        // Manuel SQL ile test et
        console.log('\n1️⃣ Tezgah kontrolü:');
        const [tezgahKontrol] = await sequelize.query(
            'SELECT tezgah_id FROM tezgahlar WHERE tezgah_id = ?',
            { replacements: [testData.tezgah_id] }
        );
        console.log(`   Tezgah ID ${testData.tezgah_id}: ${tezgahKontrol.length > 0 ? '✅ VAR' : '❌ YOK'}`);

        console.log('\n2️⃣ İş emri kontrolü:');
        const [isEmriKontrol] = await sequelize.query(
            'SELECT is_emri_id, adet, tamamlanan_parca_sayisi FROM is_emirleri WHERE is_emri_id = ?',
            { replacements: [testData.is_emri_id] }
        );
        
        if (isEmriKontrol.length > 0) {
            const isEmri = isEmriKontrol[0];
            console.log(`   İş Emri ID ${testData.is_emri_id}: ✅ VAR`);
            console.log(`   Adet: ${isEmri.adet}, Tamamlanan: ${isEmri.tamamlanan_parca_sayisi || 0}`);
        } else {
            console.log(`   İş Emri ID ${testData.is_emri_id}: ❌ YOK`);
            return;
        }

        console.log('\n3️⃣ Parça işleme kaydı ekleme testi:');
        
        const insertQuery = `
            INSERT INTO parca_isleme_kayitlari 
            (tezgah_id, is_emri_id, baslangic_zamani, bitis_zamani, isleme_suresi_dakika, kayit_zamani, esp32_kayit_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await sequelize.query(insertQuery, {
            replacements: [
                testData.tezgah_id,
                testData.is_emri_id,
                testData.baslangic_zamani,
                testData.bitis_zamani,
                testData.isleme_suresi_dakika,
                testData.timestamp,
                testData.esp32_kayit_id
            ]
        });
        console.log('   ✅ Parça işleme kaydı eklendi');

        console.log('\n4️⃣ İş emri güncelleme testi:');
        
        const mevcutTamamlanan = isEmriKontrol[0].tamamlanan_parca_sayisi || 0;
        const yeniTamamlanan = mevcutTamamlanan + 1;

        // Ortalama hesapla
        const [ortalamaResult] = await sequelize.query(`
            SELECT AVG(isleme_suresi_dakika) as ortalama_sure
            FROM parca_isleme_kayitlari 
            WHERE is_emri_id = ?
        `, { 
            replacements: [testData.is_emri_id],
            type: sequelize.QueryTypes.SELECT 
        });

        const ortalamaSure = ortalamaResult.ortalama_sure || 0;

        await sequelize.query(`
            UPDATE is_emirleri 
            SET tamamlanan_parca_sayisi = ?,
                toplam_isleme_suresi_dakika = toplam_isleme_suresi_dakika + ?,
                ortalama_parca_suresi_dakika = ?,
                guncelleme_tarihi = CURRENT_TIMESTAMP
            WHERE is_emri_id = ?
        `, {
            replacements: [
                yeniTamamlanan,
                testData.isleme_suresi_dakika,
                parseFloat(ortalamaSure).toFixed(2),
                testData.is_emri_id
            ]
        });

        console.log(`   ✅ İş emri güncellendi: ${mevcutTamamlanan} -> ${yeniTamamlanan}`);
        console.log(`   ✅ Ortalama süre: ${parseFloat(ortalamaSure).toFixed(2)} dakika`);

        console.log('\n🎉 Tüm test adımları başarılı! ESP32 artık parça kaydı gönderebilir.');

    } catch (error) {
        console.error('❌ Test hatası:', error.message);
    } finally {
        await sequelize.close();
    }
}

testParcaAPI();