const { sequelize } = require('./src/config/database');

async function debugTezgahDetay() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database bağlantısı başarılı');

        // 1. CNC 99 (Tezgah ID 25) ile ilgili TÜM iş emirleri
        console.log('\n📋 Tezgah ID 25 (CNC 99) için TÜM iş emirleri:');
        const [tumIsEmirleri] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, is_adi, durum, tezgah_id, adet, 
                   tamamlanan_parca_sayisi, created_at
            FROM is_emirleri 
            WHERE tezgah_id = 25 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        if (tumIsEmirleri.length > 0) {
            tumIsEmirleri.forEach(ie => {
                console.log(`  📝 ${ie.is_emri_no} - ${ie.is_adi}`);
                console.log(`     Durum: "${ie.durum}"`);
                console.log(`     Adet: ${ie.adet}, Tamamlanan: ${ie.tamamlanan_parca_sayisi || 0}`);
                console.log(`     Oluşturma: ${ie.created_at}`);
                console.log('     ────────────────────────');
            });
        } else {
            console.log('  ❌ Hiç iş emri bulunamadı');
        }

        // 2. API kriterleri dışında kalan iş emirleri
        console.log('\n🚫 API kriterlerine UYMAYAN iş emirleri (Tezgah ID 25):');
        const [uymayanlar] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, durum, adet, tamamlanan_parca_sayisi,
                   CASE 
                       WHEN durum IN ('iptal', 'sipariş verilecek', 'sparişte') THEN 'Durum hariç'
                       WHEN tamamlanan_parca_sayisi >= adet THEN 'Tamamlanmış'
                       ELSE 'Diğer'
                   END as sebep
            FROM is_emirleri 
            WHERE tezgah_id = 25
              AND (durum IN ('iptal', 'sipariş verilecek', 'sparişte') 
                   OR tamamlanan_parca_sayisi >= adet)
            ORDER BY created_at DESC
        `);

        if (uymayanlar.length > 0) {
            uymayanlar.forEach(ie => {
                console.log(`  ⚠️ ${ie.is_emri_no} - Sebep: ${ie.sebep}`);
                console.log(`     Durum: "${ie.durum}", Adet: ${ie.adet}, Tamamlanan: ${ie.tamamlanan_parca_sayisi || 0}`);
            });
        } else {
            console.log('  ✅ Hariç tutulan iş emri yok');
        }

        // 3. API kriterlerine UYAN iş emirleri
        console.log('\n✅ API kriterlerine UYAN iş emirleri (Aktif olması gerekenler):');
        const [uygunlar] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, is_adi, durum, adet, 
                   tamamlanan_parca_sayisi, oncelik, teslim_tarihi
            FROM is_emirleri 
            WHERE tezgah_id = 25
              AND durum NOT IN ('iptal', 'sipariş verilecek', 'sparişte')
              AND (tamamlanan_parca_sayisi < adet OR tamamlanan_parca_sayisi IS NULL)
            ORDER BY oncelik DESC, teslim_tarihi ASC
        `);

        if (uygunlar.length > 0) {
            uygunlar.forEach((ie, index) => {
                console.log(`  ${index === 0 ? '🎯' : '📋'} ${ie.is_emri_no} - ${ie.is_adi}`);
                console.log(`     Durum: "${ie.durum}"`);
                console.log(`     Adet: ${ie.adet}, Tamamlanan: ${ie.tamamlanan_parca_sayisi || 0}`);
                console.log(`     Öncelik: ${ie.oncelik}, Teslim: ${ie.teslim_tarihi}`);
                if (index === 0) console.log('     ↑ ESP32 bu işi almalı');
            });
        } else {
            console.log('  ❌ Hiç uygun iş emri yok! Bu yüzden ESP32 iş emri bulamıyor');
        }

        // 4. Son eklenen 5 iş emri (hangi tezgaha atandığına bakmalıyız)
        console.log('\n🕐 Son eklenen iş emirleri (tüm tezgahlar):');
        const [sonEklenenler] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, is_adi, tezgah_id, durum, created_at
            FROM is_emirleri 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        sonEklenenler.forEach(ie => {
            const tezgahInfo = ie.tezgah_id ? `Tezgah ID: ${ie.tezgah_id}` : 'Tezgah atanmamış';
            console.log(`  📅 ${ie.is_emri_no} - ${tezgahInfo}`);
            console.log(`     Durum: "${ie.durum}", Oluşturma: ${ie.created_at}`);
        });

        // 5. Tüm durum türleri
        console.log('\n📊 Sistemdeki tüm durum türleri:');
        const [durumlar] = await sequelize.query(`
            SELECT durum, COUNT(*) as sayi
            FROM is_emirleri 
            GROUP BY durum 
            ORDER BY sayi DESC
        `);

        durumlar.forEach(d => {
            const excluded = ['iptal', 'sipariş verilecek', 'sparişte'].includes(d.durum) ? ' ❌' : ' ✅';
            console.log(`  ${d.durum}: ${d.sayi} adet${excluded}`);
        });

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

debugTezgahDetay();