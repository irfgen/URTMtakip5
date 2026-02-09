const { sequelize } = require('./src/config/database');

async function debugKayitYerleri() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database bağlantısı başarılı\n');

        console.log('🔍 ESP32 verilerinin kaydedildiği yerler:\n');

        // 1. Parça işleme kayıtları tablosu - Her parça için detaylı kayıt
        console.log('📋 1️⃣ PARÇA İŞLEME KAYITLARI (parca_isleme_kayitlari):');
        console.log('   Her parça işleme için ayrı satır - Detaylı kayıt\n');
        
        const [parcaKayitlari] = await sequelize.query(`
            SELECT tezgah_id, is_emri_id, baslangic_zamani, bitis_zamani, 
                   isleme_suresi_dakika, esp32_kayit_id, kayit_zamani
            FROM parca_isleme_kayitlari 
            WHERE tezgah_id = 25 
            ORDER BY kayit_zamani DESC 
            LIMIT 5
        `);

        if (parcaKayitlari.length > 0) {
            console.log('   ✅ Son 5 parça işleme kaydı:');
            parcaKayitlari.forEach((kayit, index) => {
                console.log(`   ${index + 1}. ESP32 ID: ${kayit.esp32_kayit_id}`);
                console.log(`      İş Emri: ${kayit.is_emri_id}`);
                console.log(`      Süre: ${kayit.isleme_suresi_dakika} dakika`);
                console.log(`      Başlangıç: ${kayit.baslangic_zamani}`);
                console.log(`      Bitiş: ${kayit.bitis_zamani}`);
                console.log(`      Kayıt: ${kayit.kayit_zamani}`);
                console.log('      ────────────────────────');
            });
        } else {
            console.log('   ❌ Henüz parça kaydı yok');
        }

        // 2. İş emirleri tablosu - Özet istatistikler
        console.log('\n📊 2️⃣ İŞ EMRİ İSTATİSTİKLERİ (is_emirleri):');
        console.log('   İş emri toplam bilgileri - Özet istatistikler\n');
        
        const [isEmriStats] = await sequelize.query(`
            SELECT is_emri_id, is_emri_no, is_adi, adet, 
                   tamamlanan_parca_sayisi, toplam_isleme_suresi_dakika, 
                   ortalama_parca_suresi_dakika, guncelleme_tarihi
            FROM is_emirleri 
            WHERE is_emri_id = 859
        `);

        if (isEmriStats.length > 0) {
            const stats = isEmriStats[0];
            console.log('   ✅ İş Emri Özet Bilgileri:');
            console.log(`   📝 İş Emri: ${stats.is_emri_no} - ${stats.is_adi}`);
            console.log(`   📊 Toplam Adet: ${stats.adet}`);
            console.log(`   ✅ Tamamlanan: ${stats.tamamlanan_parca_sayisi || 0} parça`);
            console.log(`   ⏱️ Toplam Süre: ${stats.toplam_isleme_suresi_dakika || 0} dakika`);
            console.log(`   📈 Ortalama: ${stats.ortalama_parca_suresi_dakika || 0} dakika/parça`);
            console.log(`   🕐 Son Güncelleme: ${stats.guncelleme_tarihi}`);
        }

        // 3. Tablolar arası ilişki
        console.log('\n🔗 3️⃣ VERİ AKIŞI:');
        console.log('   ESP32 ──► parca_isleme_kayitlari (Detaylı kayıt)');
        console.log('   ESP32 ──► is_emirleri (Özet güncelleme)\n');

        // 4. Veri yapısı örnegi
        console.log('📦 ESP32\'den Gelen Veri Formatı:');
        console.log(`{
  "tezgah_id": 25,
  "is_emri_id": 859,
  "baslangic_zamani": "2025-08-04T01:26:33Z",
  "bitis_zamani": "2025-08-04T01:28:13Z", 
  "isleme_suresi_dakika": 1,
  "esp32_kayit_id": "ESP32_25_439151_9942"
}`);

        console.log('\n🗄️ Database\'e Kaydedilen Yerler:');
        console.log('1. parca_isleme_kayitlari → Ham detay (her parça ayrı satır)');
        console.log('2. is_emirleri → Toplam istatistik güncelleme');

        // 5. Kayıt sayısı kontrol
        const [kayitSayisi] = await sequelize.query(`
            SELECT COUNT(*) as toplam_kayit
            FROM parca_isleme_kayitlari 
            WHERE tezgah_id = 25 AND is_emri_id = 859
        `);

        console.log(`\n📊 Toplam Kayıt Sayısı: ${kayitSayisi[0].toplam_kayit} parça işleme kaydı`);

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

debugKayitYerleri();