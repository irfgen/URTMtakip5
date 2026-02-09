'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Sıra numarası kolonu ekle
    await queryInterface.addColumn('tezgah_planlanan_isler', 'sira_no', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 9999
    });

    // Mevcut kayıtlara 10'ar artarak sıra numarası ver
    const [planlananIsler] = await queryInterface.sequelize.query(
      'SELECT * FROM tezgah_planlanan_isler ORDER BY tezgah_id, id'
    );

    // Her tezgah için grup oluşturup sıra numarası atayalım
    const tezgahGruplari = {};
    
    // Kayıtları tezgah_id'ye göre grupla
    planlananIsler.forEach(isEmri => {
      const tezgahId = isEmri.tezgah_id;
      if (!tezgahGruplari[tezgahId]) {
        tezgahGruplari[tezgahId] = [];
      }
      tezgahGruplari[tezgahId].push(isEmri);
    });

    // Her tezgah için sıra numarası atama
    for (const tezgahId in tezgahGruplari) {
      const isEmirleri = tezgahGruplari[tezgahId];
      
      for (let i = 0; i < isEmirleri.length; i++) {
        const siraNo = (i + 1) * 10; // 10, 20, 30, ...
        const isEmri = isEmirleri[i];
        
        await queryInterface.sequelize.query(
          `UPDATE tezgah_planlanan_isler SET sira_no = ${siraNo} WHERE id = ${isEmri.id}`
        );
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Kolonu geri al
    await queryInterface.removeColumn('tezgah_planlanan_isler', 'sira_no');
  }
};
