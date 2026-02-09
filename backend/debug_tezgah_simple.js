const { sequelize } = require('./src/config/database');

async function debugTezgahSimple() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database bağlantısı başarılı');

        // 1. Tablo yapısını kontrol et
        console.log('\n📋 is_emirleri tablosu sütunları:');
        const [columns] = await sequelize.query("PRAGMA table_info(is_emirleri)");
        columns.forEach(col => {
            console.log(`  ${col.name}: ${col.type}`);
        });

        // 2. CNC 99 (Tezgah ID 25) için TÜM iş emirleri - basit sorgu
        console.log('\n📋 Tezgah ID 25 (CNC 99) için TÜM iş emirleri:');
        const [tumIsEmirleri] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, is_adi, durum, tezgah_id, adet, 
                   tamamlanan_parca_sayisi
            FROM is_emirleri 
            WHERE tezgah_id = 25 
            LIMIT 10
        `);
        
        if (tumIsEmirleri.length > 0) {
            console.log(`  ✅ ${tumIsEmirleri.length} iş emri bulundu:`);
            tumIsEmirleri.forEach(ie => {
                console.log(`    📝 ${ie.is_emri_no} - ${ie.is_adi || 'İsimsiz'}`);
                console.log(`       Durum: "${ie.durum}"`);
                console.log(`       Adet: ${ie.adet}, Tamamlanan: ${ie.tamamlanan_parca_sayisi || 0}`);
                console.log('       ────────────────────────');
            });
        } else {
            console.log('  ❌ Hiç iş emri bulunamadı!');
        }

        // 3. API kriterlerine UYAN iş emirleri
        console.log('\n✅ API kriterlerine UYAN iş emirleri:');
        const [uygunlar] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, is_adi, durum, adet, 
                   tamamlanan_parca_sayisi, oncelik
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

        if (uygunlar.length > 0) {
            const ie = uygunlar[0];
            console.log(`  🎯 ESP32'nin alması gereken iş: ${ie.is_emri_no}`);
            console.log(`     İş Adı: ${ie.is_adi || 'İsimsiz'}`);
            console.log(`     Durum: "${ie.durum}"`);
            console.log(`     Adet: ${ie.adet}, Tamamlanan: ${ie.tamamlanan_parca_sayisi || 0}`);
            console.log(`     Öncelik: ${ie.oncelik}`);
        } else {
            console.log('  ❌ ESP32 için uygun iş emri YOK!');
            console.log('  🔍 Sebepleri kontrol ediliyor...');

            // Sebep analizi
            const [hariçTutulanlar] = await sequelize.query(`
                SELECT is_emri_no, durum, adet, tamamlanan_parca_sayisi,
                       CASE 
                           WHEN durum IN ('iptal', 'sipariş verilecek', 'sparişte') THEN 'Durum nedeniyle hariç'
                           WHEN tamamlanan_parca_sayisi >= adet THEN 'Tamamlanmış'
                           ELSE 'Bilinmeyen sebep'
                       END as sebep
                FROM is_emirleri 
                WHERE tezgah_id = 25
            `);

            if (hariçTutulanlar.length > 0) {
                console.log('  📋 Hariç tutulan iş emirleri:');
                hariçTutulanlar.forEach(ie => {
                    console.log(`    ⚠️ ${ie.is_emri_no}: ${ie.sebep}`);
                    console.log(`       Durum: "${ie.durum}", Adet: ${ie.adet}/${ie.tamamlanan_parca_sayisi || 0}`);
                });
            } else {
                console.log('  ❌ Tezgah ID 25\'e hiç iş emri atanmamış!');
            }
        }

        // 4. Son 5 iş emri
        console.log('\n🕐 Son eklenen 5 iş emri (tüm sistem):');
        const [sonlar] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, tezgah_id, durum
            FROM is_emirleri 
            ORDER BY is_emri_id DESC 
            LIMIT 5
        `);

        sonlar.forEach(ie => {
            const tezgahInfo = ie.tezgah_id ? `Tezgah: ${ie.tezgah_id}` : 'Atanmamış';
            const cnc99Flag = ie.tezgah_id === 25 ? ' 🎯' : '';
            console.log(`  📅 ${ie.is_emri_no} - ${tezgahInfo} - "${ie.durum}"${cnc99Flag}`);
        });

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

debugTezgahSimple();