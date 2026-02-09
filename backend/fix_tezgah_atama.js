const { sequelize } = require('./src/config/database');

async function fixTezgahAtama() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database bağlantısı başarılı');

        console.log('\n🔧 Tezgah atama bug\'ını düzeltiyorum...');

        // 1. Tüm tezgahları ve JSON iş emirlerini al
        const [tezgahlar] = await sequelize.query(`
            SELECT tezgah_id, tezgah_tanimi, is_emirleri
            FROM tezgahlar 
            WHERE is_emirleri IS NOT NULL 
              AND is_emirleri != '[]'
        `);

        let fixedCount = 0;

        for (const tezgah of tezgahlar) {
            console.log(`\n📟 ${tezgah.tezgah_tanimi} (ID: ${tezgah.tezgah_id}) işleniyor...`);
            
            try {
                const jsonIsEmirleri = JSON.parse(tezgah.is_emirleri || '[]');
                
                for (const jsonIs of jsonIsEmirleri) {
                    // Bu iş emrinin database'deki tezgah_id'sini kontrol et
                    const [dbCheck] = await sequelize.query(`
                        SELECT is_emri_id, is_emri_no, tezgah_id
                        FROM is_emirleri 
                        WHERE is_emri_id = ?
                    `, { replacements: [jsonIs.is_emri_id] });

                    if (dbCheck.length > 0) {
                        const dbIs = dbCheck[0];
                        
                        // Eğer tezgah_id NULL veya farklıysa düzelt
                        if (dbIs.tezgah_id !== tezgah.tezgah_id) {
                            console.log(`  🔧 ${jsonIs.is_emri_no}: ${dbIs.tezgah_id} -> ${tezgah.tezgah_id}`);
                            
                            await sequelize.query(`
                                UPDATE is_emirleri 
                                SET tezgah_id = ?
                                WHERE is_emri_id = ?
                            `, { replacements: [tezgah.tezgah_id, jsonIs.is_emri_id] });
                            
                            fixedCount++;
                        } else {
                            console.log(`  ✅ ${jsonIs.is_emri_no}: Zaten doğru`);
                        }
                    }
                }
            } catch (parseError) {
                console.log(`  ⚠️ JSON parse hatası: ${parseError.message}`);
            }
        }

        console.log(`\n🎉 Toplam ${fixedCount} iş emri düzeltildi!`);

        // 2. CNC 99 durumunu tekrar kontrol et
        console.log('\n🎯 CNC 99 kontrol (düzeltme sonrası):');
        
        const [apiUygun] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, durum, adet, tamamlanan_parca_sayisi
            FROM is_emirleri 
            WHERE tezgah_id = 25
              AND durum NOT IN ('iptal', 'sipariş verilecek', 'sparişte')
              AND (tamamlanan_parca_sayisi < adet OR tamamlanan_parca_sayisi IS NULL)
            ORDER BY 
              CASE oncelik 
                WHEN 'acil' THEN 4
                WHEN 'yuksek' THEN 3  
                WHEN 'normal' THEN 2
                WHEN 'dusuk' THEN 1
                ELSE 0
              END DESC
            LIMIT 1
        `);

        if (apiUygun.length > 0) {
            const ie = apiUygun[0];
            console.log(`  🎯 ESP32 artık bu işi alabilir: ${ie.is_emri_no}`);
            console.log(`     Durum: ${ie.durum}, Adet: ${ie.adet}/${ie.tamamlanan_parca_sayisi || 0}`);
        } else {
            console.log(`  ❌ Hala uygun iş emri yok`);
        }

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

fixTezgahAtama();