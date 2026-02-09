const { sequelize } = require('./src/config/database');

async function debugAtamaBug() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database bağlantısı başarılı');

        // Son 5 iş emrinin tezgah_id durumu
        console.log('\n📋 Son eklenen iş emirlerinin tezgah_id durumu:');
        const [sonIsEmirleri] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, is_adi, tezgah_id, durum
            FROM is_emirleri 
            ORDER BY is_emri_id DESC 
            LIMIT 5
        `);

        sonIsEmirleri.forEach(ie => {
            const tezgahDurum = ie.tezgah_id ? `✅ Tezgah ID: ${ie.tezgah_id}` : '❌ tezgah_id NULL';
            console.log(`  ${ie.is_emri_no} - ${tezgahDurum} - Durum: "${ie.durum}"`);
        });

        // Tezgah JSON'ında olan ama tezgah_id NULL olan iş emirleri
        console.log('\n🔍 Tezgahların JSON listesindeki iş emirleri:');
        const [tezgahIsEmirleri] = await sequelize.query(`
            SELECT tezgah_id, tezgah_tanimi, is_emirleri
            FROM tezgahlar 
            WHERE is_emirleri IS NOT NULL 
              AND is_emirleri != '[]'
            LIMIT 5
        `);

        for (const tezgah of tezgahIsEmirleri) {
            console.log(`\n  📟 ${tezgah.tezgah_tanimi} (ID: ${tezgah.tezgah_id}):`);
            try {
                const isEmirleriList = JSON.parse(tezgah.is_emirleri || '[]');
                
                for (const jsonIs of isEmirleriList) {
                    // Bu iş emrinin database'deki tezgah_id durumunu kontrol et
                    const [dbCheck] = await sequelize.query(`
                        SELECT is_emri_id, is_emri_no, tezgah_id, durum
                        FROM is_emirleri 
                        WHERE is_emri_id = ?
                    `, { replacements: [jsonIs.is_emri_id] });

                    if (dbCheck.length > 0) {
                        const dbIs = dbCheck[0];
                        const tezgahMatch = dbIs.tezgah_id === tezgah.tezgah_id ? '✅' : '❌';
                        console.log(`    ${jsonIs.is_emri_no}: JSON'da VAR, DB tezgah_id: ${dbIs.tezgah_id} ${tezgahMatch}`);
                        
                        // BUG: JSON'da var ama DB'de tezgah_id farklı/null
                        if (dbIs.tezgah_id !== tezgah.tezgah_id) {
                            console.log(`    🚨 BUG: İş emri JSON'da ${tezgah.tezgah_id}'de ama DB'de tezgah_id: ${dbIs.tezgah_id}`);
                        }
                    }
                }
            } catch (parseError) {
                console.log(`    ⚠️ JSON parse hatası: ${parseError.message}`);
            }
        }

        // CNC 99 (Tezgah ID 25) özel kontrolü
        console.log('\n🎯 CNC 99 (Tezgah ID 25) özel kontrol:');
        
        // 1. JSON'daki iş emirleri
        const [cnc99Tezgah] = await sequelize.query(`
            SELECT tezgah_id, tezgah_tanimi, is_emirleri
            FROM tezgahlar 
            WHERE tezgah_id = 25
        `);

        if (cnc99Tezgah.length > 0) {
            const tezgah = cnc99Tezgah[0];
            console.log(`  📟 Tezgah JSON: ${tezgah.tezgah_tanimi}`);
            
            try {
                const jsonIsEmirleri = JSON.parse(tezgah.is_emirleri || '[]');
                console.log(`  📝 JSON'da ${jsonIsEmirleri.length} iş emri var:`);
                
                for (const jsonIs of jsonIsEmirleri) {
                    console.log(`    - ${jsonIs.is_emri_no} (ID: ${jsonIs.is_emri_id})`);
                }
            } catch {
                console.log('  📝 JSON\'da iş emri yok veya parse hatası');
            }
        }

        // 2. Database'deki tezgah_id = 25 olan iş emirleri
        const [cnc99DbIsEmirleri] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, durum, tezgah_id
            FROM is_emirleri 
            WHERE tezgah_id = 25
        `);

        console.log(`  🗄️ Database'de tezgah_id=25 olan ${cnc99DbIsEmirleri.length} iş emri:`);
        cnc99DbIsEmirleri.forEach(ie => {
            console.log(`    - ${ie.is_emri_no} (Durum: ${ie.durum})`);
        });

        // 3. API kriterlerine uyan iş emirleri
        const [apiUygun] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, durum
            FROM is_emirleri 
            WHERE tezgah_id = 25
              AND durum NOT IN ('iptal', 'sipariş verilecek', 'sparişte')
              AND (tamamlanan_parca_sayisi < adet OR tamamlanan_parca_sayisi IS NULL)
        `);

        console.log(`  🎯 ESP32 için uygun ${apiUygun.length} iş emri:`);
        apiUygun.forEach(ie => {
            console.log(`    - ${ie.is_emri_no} (Durum: ${ie.durum})`);
        });

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

debugAtamaBug();