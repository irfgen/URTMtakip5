const Tezgah = require('../models/Tezgah');
const Parca = require('../models/Parca');

const seedDatabase = async () => {
  try {
    // Örnek tezgahları ekle
    const tezgahlar = [
      { tezgah_tanimi: 'CNC Torna 1', tezgah_tipi: 'torna', calisma_durumu: 'bosta', x_koordinat: 100, y_koordinat: 100 },
      { tezgah_tanimi: 'CNC Freze 1', tezgah_tipi: 'freze', calisma_durumu: 'bosta', x_koordinat: 300, y_koordinat: 100 },
      { tezgah_tanimi: 'Taşlama 1', tezgah_tipi: 'taslama', calisma_durumu: 'bosta', x_koordinat: 500, y_koordinat: 100 }
    ];
    
    for (const tezgah of tezgahlar) {
      await Tezgah.create(tezgah);
    }
    
    // Örnek parçaları ekle
    const parcalar = [
      { parcaKodu: 'P001', stokAdeti: 10, tedarikBedeli: 100, imalMi: true, hamMalzemeCinsi: 'Çelik', hamMalzemeOlculeri: '100x50x20', fasonMaliyeti: 50, sirketIciMaliyeti: 80 },
      { parcaKodu: 'P002', stokAdeti: 5, tedarikBedeli: 200, imalMi: false, hamMalzemeCinsi: '', hamMalzemeOlculeri: '', fasonMaliyeti: 0, sirketIciMaliyeti: 0 }
    ];
    
    for (const parca of parcalar) {
      await Parca.create(parca);
    }
    
    console.log('Örnek veriler başarıyla eklendi.');
  } catch (error) {
    console.error('Örnek veri ekleme hatası:', error);
  }
};

module.exports = { seedDatabase };
