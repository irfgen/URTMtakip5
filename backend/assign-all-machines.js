const { sequelize } = require('./src/config/database');

async function assignAllMachines() {
  try {
    console.log('Tüm makinaları sınıflarına atama başlatılıyor...');

    // Mevcut makina isimleri ve atanacak sınıf ID'leri
    const assignments = [
      // Panel Ebatlama Sınıfı (ID=1)
      { name: 'ADVANTAGE-3', sinifId: 1 },
      { name: 'ADVANTAGE-4', sinifId: 1 },
      { name: 'ADVANTAGE-5', sinifId: 1 },
      { name: 'ADVANTAGE-6', sinifId: 1 },
      { name: 'ADVANTAGE-7', sinifId: 1 },
      { name: 'ADVANTAGE-SMALL', sinifId: 1 },
      { name: 'ADVANTAGE-X SMALL', sinifId: 1 },

      // Kenar Bantlama Sınıfı (ID=2) - Zaten atandı
      { name: 'KENAR BANTLAMA', sinifId: 2 },

      // Çizgili Yatar Daire Sınıfı (ID=3)
      { name: 'ÇIZICILI YATAR DAIRE', sinifId: 3 },
      { name: 'CON_3200_BOM', sinifId: 3 },
      { name: 'PR_ECO_2800_BOM', sinifId: 3 },

      // Kapı Üretim Makineleri Sınıfı (ID=4)
      { name: 'EWREWR', sinifId: 4 }, // Test makinası

      // CNC Freze Sınıfı (ID=5)
      // Bu sınıfa henüz makina atanmadı
    ];

    let updatedCount = 0;

    for (const assignment of assignments) {
      const [result] = await sequelize.query(`
        UPDATE makinalar
        SET makina_sinifi_id = :sinifId
        WHERE name = :name
      `, {
        replacements: { sinifId: assignment.sinifId, name: assignment.name }
      });

      if (result.affectedRows > 0) {
        console.log(`✅ ${assignment.name} → Sınıf ${assignment.sinifId}`);
        updatedCount++;
      } else {
        console.log(`❌ ${assignment.name} bulunamadı`);
      }
    }

    console.log(`\nToplam ${updatedCount} makina sınıflarına atandı.`);

    // Sonuçları göster
    const [results] = await sequelize.query(`
      SELECT
        m.name,
        m.makina_sinifi_id,
        ms.ad as sinif_adi,
        m.model,
        m.durum
      FROM makinalar m
      LEFT JOIN makina_siniflari ms ON m.makina_sinifi_id = ms.id
      WHERE m.makina_sinifi_id IS NOT NULL
      ORDER BY ms.ad, m.name
    `);

    console.log('\n📋 Mevcut Atamalar:');
    results.forEach(item => {
      console.log(`  ${item.sinif_adi}: ${item.name} (${item.model || 'Model yok'})`);
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await sequelize.close();
  }
}

assignAllMachines();