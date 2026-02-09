const { sequelize } = require('./src/config/database');

async function assignMakinaToSinif() {
  try {
    await sequelize.query(`
      UPDATE makinalar
      SET makina_sinifi_id = 2
      WHERE name = 'KENAR BANTLAMA'
    `);

    console.log('KENAR BANTLAMA makinası Kenar Bantlama Sınıfına (ID=2) atandı.');

    // Kontrol et
    const [results] = await sequelize.query(`
      SELECT m.name, m.makina_sinifi_id, ms.ad as sinif_adi
      FROM makinalar m
      LEFT JOIN makina_siniflari ms ON m.makina_sinifi_id = ms.id
      WHERE m.name = 'KENAR BANTLAMA'
    `);

    console.log('Sonuç:', results);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await sequelize.close();
  }
}

assignMakinaToSinif();