const { sequelize } = require('./src/config/database');

async function debugTezgah() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database bağlantısı başarılı');

        // Tezgahları listele
        console.log('\n📋 Mevcut Tezgahlar:');
        const [tezgahlar] = await sequelize.query('SELECT tezgah_id, tezgah_tanimi FROM tezgahlar LIMIT 10');
        tezgahlar.forEach(t => {
            console.log(`  ID: ${t.tezgah_id} - ${t.tezgah_tanimi}`);
        });

        // CNC 99 ara
        console.log('\n🔍 CNC 99 arama:');
        const [cnc99] = await sequelize.query("SELECT tezgah_id, tezgah_tanimi FROM tezgahlar WHERE tezgah_tanimi LIKE '%99%'");
        if (cnc99.length > 0) {
            cnc99.forEach(t => {
                console.log(`  ✅ Bulundu: ID ${t.tezgah_id} - ${t.tezgah_tanimi}`);
            });
        } else {
            console.log('  ❌ CNC 99 bulunamadı');
        }

        // Tezgah ID 25 ara
        console.log('\n🔍 Tezgah ID 25 arama:');
        const [tezgah25] = await sequelize.query('SELECT tezgah_id, tezgah_tanimi FROM tezgahlar WHERE tezgah_id = 25');
        if (tezgah25.length > 0) {
            tezgah25.forEach(t => {
                console.log(`  ✅ Bulundu: ID ${t.tezgah_id} - ${t.tezgah_tanimi}`);
            });
        } else {
            console.log('  ❌ Tezgah ID 25 bulunamadı');
        }

        // Son atanan iş emirleri
        console.log('\n📝 Son atanan iş emirleri:');
        const [isEmirleri] = await sequelize.query('SELECT is_emri_id, is_emri_no, tezgah_id FROM is_emirleri WHERE tezgah_id IS NOT NULL ORDER BY is_emri_id DESC LIMIT 5');
        if (isEmirleri.length > 0) {
            isEmirleri.forEach(ie => {
                console.log(`  İş Emri: ${ie.is_emri_no} (ID: ${ie.is_emri_id}) -> Tezgah ID: ${ie.tezgah_id}`);
            });
        } else {
            console.log('  ❌ Hiç atanmış iş emri yok');
        }

        // CNC Link API için test sorgusu
        console.log('\n🔗 CNC Link API test (Tezgah ID 25):');
        const query = `
            SELECT ie.is_emri_id, ie.is_emri_no, ie.is_adi, ie.adet, ie.tamamlanan_parca_sayisi
            FROM is_emirleri ie
            WHERE ie.tezgah_id = 25 
              AND ie.durum NOT IN ('iptal', 'sipariş verilecek', 'sparişte')
              AND (ie.tamamlanan_parca_sayisi < ie.adet OR ie.tamamlanan_parca_sayisi IS NULL)
            ORDER BY ie.oncelik DESC, ie.teslim_tarihi ASC
            LIMIT 1
        `;
        const [apiResult] = await sequelize.query(query);
        if (apiResult.length > 0) {
            console.log(`  ✅ Aktif iş emri bulundu: ${apiResult[0].is_emri_no}`);
            console.log(`     ID: ${apiResult[0].is_emri_id}`);
            console.log(`     İş Adı: ${apiResult[0].is_adi}`);
            console.log(`     Adet: ${apiResult[0].adet}`);
            console.log(`     Tamamlanan: ${apiResult[0].tamamlanan_parca_sayisi || 0}`);
        } else {
            console.log('  ❌ Tezgah ID 25 için aktif iş emri bulunamadı');
        }

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

debugTezgah();