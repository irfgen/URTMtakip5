const { sequelize } = require('./src/config/database');

async function fixAdvantageMachines() {
  try {
    console.log('ADVANTAGE makinalarını Kenar Bantlama Sınıfına taşıma başlatılıyor...');

    // ADVANTAGE makinalarını Kenar Bantlama Sınıfına (ID=2) taşı
    const [result] = await sequelize.query(`
      UPDATE makinalar
      SET makina_sinifi_id = 2
      WHERE name LIKE 'ADVANTAGE%'
      AND name != 'KENAR BANTLAMA'
    `);

    console.log(`✅ ${result.affectedRows} ADVANTAGE makinası Kenar Bantlama Sınıfına taşındı.`);

    // Sonuçları kontrol et
    const [results] = await sequelize.query(`
      SELECT
        m.name,
        m.makina_sinifi_id,
        ms.ad as sinif_adi,
        m.model,
        m.durum
      FROM makinalar m
      LEFT JOIN makina_siniflari ms ON m.makina_sinifi_id = ms.id
      WHERE m.name LIKE 'ADVANTAGE%'
      ORDER BY m.name
    `);

    console.log('\n📋 Güncel ADVANTAGE Makina Atamaları:');
    results.forEach(item => {
      console.log(`  ${item.sinif_adi}: ${item.name} (${item.model || 'Model yok'})`);
    });

    // Kenar Bantlama Sınıfındaki tüm makinaları göster
    const [kenarBantMakinalar] = await sequelize.query(`
      SELECT
        m.name,
        m.makina_sinifi_id,
        ms.ad as sinif_adi,
        m.model,
        m.durum
      FROM makinalar m
      LEFT JOIN makina_siniflari ms ON m.makina_sinifi_id = ms.id
      WHERE m.makina_sinifi_id = 2
      ORDER BY m.name
    `);

    console.log('\n📋 Kenar Bantlama Sınıfındaki Tüm Makinalar:');
    kenarBantMakinalar.forEach(item => {
      console.log(`  • ${item.name} (${item.model || 'Model yok'})`);
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await sequelize.close();
  }
}

fixAdvantageMachines();