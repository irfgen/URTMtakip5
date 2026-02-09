#!/usr/bin/env node
/**
 * Workstation Scheduler Test Data Seeder
 * Bu dosya scheduler modülü için test verileri oluşturur
 */

const db = require('./src/models');
const { TezgahZamanPlani, IsEmri, Tezgah } = db;

const seedSchedulerTestData = async () => {
  try {
    console.log('🌱 Scheduler Test Data Seeding başlatılıyor...');

    // 1. Mevcut test verilerini temizle
    await TezgahZamanPlani.destroy({ where: {} });
    console.log('✅ Mevcut scheduler verileri temizlendi');

    // 2. İş emirlerinin tahmini süre alanını güncelle
    await IsEmri.update(
      { 
        tahmini_sure_dakika: 480, // 8 saat default
        plan_durumu: 'planlanmadi'
      },
      { where: {} }
    );

    // 3. Tezgah ve iş emirlerini getir
    const tezgahlar = await Tezgah.findAll({ limit: 5 });
    const isEmirleri = await IsEmri.findAll({ limit: 20 });

    if (tezgahlar.length === 0 || isEmirleri.length === 0) {
      console.log('❌ Test için yeterli tezgah veya iş emri bulunamadı');
      return;
    }

    // 4. Test planlama verileri oluştur
    const testPlans = [];
    const now = new Date();
    
    // Her tezgah için test planlamaları
    tezgahlar.forEach((tezgah, tezgahIndex) => {
      // Her tezgaha 3-4 iş emri planla
      const tezgahIsEmirleri = isEmirleri.slice(tezgahIndex * 4, (tezgahIndex + 1) * 4);
      
      let currentStartTime = new Date(now);
      currentStartTime.setHours(8, 0, 0, 0); // Sabah 8'de başla
      currentStartTime.setDate(currentStartTime.getDate() + tezgahIndex); // Her tezgah farklı güne
      
      tezgahIsEmirleri.forEach((isEmri, index) => {
        // Süre çeşitliliği için
        const sureDakika = [240, 480, 360, 600][index % 4]; // 4, 8, 6, 10 saat
        const bitisZamani = new Date(currentStartTime);
        bitisZamani.setMinutes(bitisZamani.getMinutes() + sureDakika);
        
        // Durum çeşitliliği
        const durumlar = ['planli', 'planli', 'devam_ediyor', 'tamamlandi'];
        const durum = durumlar[index % 4];
        
        // Öncelik çeşitliliği
        const oncelik = (index % 4) + 1;

        testPlans.push({
          tezgah_id: tezgah.tezgah_id,
          is_emri_id: isEmri.is_emri_id,
          baslangic_zamani: new Date(currentStartTime),
          bitis_zamani: bitisZamani,
          planlanan_sure_dakika: sureDakika,
          gerceklesen_sure_dakika: durum === 'tamamlandi' ? Math.floor(sureDakika * 1.1) : 0,
          durum: durum,
          oncelik: oncelik,
          notlar: `Test planlama - ${tezgah.tezgah_tanimi} için ${isEmri.is_emri_no}`,
          olusturma_tarihi: now,
          guncelleme_tarihi: now
        });

        // Bir sonraki iş için başlangıç zamanını ayarla (30dk mola)
        currentStartTime = new Date(bitisZamani);
        currentStartTime.setMinutes(currentStartTime.getMinutes() + 30);
      });
    });

    // 5. Test verilerini veritabanına kaydet
    await TezgahZamanPlani.bulkCreate(testPlans);
    console.log(`✅ ${testPlans.length} adet test planlama verisi oluşturuldu`);

    // 6. İlgili iş emirlerinin plan durumunu güncelle
    const planliIsEmriIds = testPlans.map(plan => plan.is_emri_id);
    await IsEmri.update(
      { plan_durumu: 'planlandi' },
      { where: { is_emri_id: planliIsEmriIds } }
    );

    // 7. Test verilerini kontrol et
    const createdPlans = await TezgahZamanPlani.findAll({
      include: [
        {
          model: IsEmri,
          as: 'isEmri',
          attributes: ['is_emri_no', 'is_adi']
        },
        {
          model: Tezgah,
          as: 'tezgah',
          attributes: ['tezgah_tanimi']
        }
      ],
      order: [['tezgah_id', 'ASC'], ['baslangic_zamani', 'ASC']]
    });

    console.log('\n📊 Oluşturulan Test Verileri:');
    console.log('=====================================');
    
    let currentTezgah = null;
    createdPlans.forEach(plan => {
      if (currentTezgah !== plan.tezgah_id) {
        currentTezgah = plan.tezgah_id;
        console.log(`\n🏭 ${plan.tezgah?.tezgah_tanimi}:`);
      }
      
      const startTime = plan.baslangic_zamani.toLocaleString('tr-TR');
      const endTime = plan.bitis_zamani.toLocaleString('tr-TR');
      const duration = Math.round(plan.planlanan_sure_dakika / 60);
      
      console.log(`  ⚙️  ${plan.isEmri?.is_emri_no} (${duration}h) - ${plan.durum} - ${startTime}`);
    });

    // 8. İstatistikler
    const stats = {
      totalPlans: testPlans.length,
      byStatus: {
        planli: testPlans.filter(p => p.durum === 'planli').length,
        devam_ediyor: testPlans.filter(p => p.durum === 'devam_ediyor').length,
        tamamlandi: testPlans.filter(p => p.durum === 'tamamlandi').length
      },
      workstationsUsed: tezgahlar.length,
      totalDuration: Math.round(testPlans.reduce((sum, p) => sum + p.planlanan_sure_dakika, 0) / 60)
    };

    console.log('\n📈 Test Veri İstatistikleri:');
    console.log('=====================================');
    console.log(`Toplam Plan: ${stats.totalPlans}`);
    console.log(`Kullanılan Tezgah: ${stats.workstationsUsed}`);
    console.log(`Toplam Süre: ${stats.totalDuration} saat`);
    console.log(`Durum Dağılımı:`);
    console.log(`  - Planlı: ${stats.byStatus.planli}`);
    console.log(`  - Devam Ediyor: ${stats.byStatus.devam_ediyor}`);
    console.log(`  - Tamamlandı: ${stats.byStatus.tamamlandi}`);

    console.log('\n🎉 Scheduler test data seeding tamamlandı!');
    console.log('API test için hazır: /api/scheduler/timeline');

  } catch (error) {
    console.error('❌ Seeding hatası:', error);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
};

// Doğrudan çalıştırılırsa seed'i başlat
if (require.main === module) {
  seedSchedulerTestData();
}

module.exports = seedSchedulerTestData;