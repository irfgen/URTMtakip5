const StokKarti = require('./src/models/StokKarti');
const { sequelize } = require('./src/config/database');
const { Op } = require('sequelize');

async function createTestData() {
  try {
    console.log('Test stok kartları oluşturuluyor...');

    const testData = [
      {
        kesit: '10x20x2',
        boy: 2000.00,
        malzeme_cinsi: 'ST37 Sac',
        adet: 15,
        kritik_stok_miktari: 10,
        lokasyon: 'A-1-3',
        adres: 'Ana depo, 1. kısım, 3. raf',
        firma: 'Metal San A.Ş.'
      },
      {
        kesit: '5x30x1.5',
        boy: 3000.00,
        malzeme_cinsi: '304 Paslanmaz',
        adet: 5,
        kritik_stok_miktari: 8,
        lokasyon: 'B-2-1',
        adres: 'Paslanmaz depo, 2. kısım, 1. raf',
        firma: 'İnox Metal Ltd.'
      },
      {
        kesit: '40x40x3',
        boy: 6000.00,
        malzeme_cinsi: 'S235 Profil',
        adet: 0,
        kritik_stok_miktari: 5,
        lokasyon: 'C-1-2',
        adres: 'Profil deposu, 1. kısım, 2. raf',
        firma: 'Profil Dünyası'
      },
      {
        kesit: '50x25x2',
        boy: 4000.00,
        malzeme_cinsi: 'ST52 Dikdörtgen Profil',
        adet: 12,
        kritik_stok_miktari: 6,
        lokasyon: 'C-2-4',
        adres: 'Profil deposu, 2. kısım, 4. raf',
        firma: 'Çelik Kardeşler'
      },
      {
        kesit: '20x20x1',
        boy: 1500.00,
        malzeme_cinsi: 'Alüminyum Profil',
        adet: 25,
        kritik_stok_miktari: 15,
        lokasyon: 'D-1-1',
        adres: 'Alüminyum deposu, 1. kısım, 1. raf',
        firma: 'Alüminyum Teknik'
      },
      {
        kesit: '8x60x4',
        boy: 2500.00,
        malzeme_cinsi: 'S355 Sac',
        adet: 3,
        kritik_stok_miktari: 5,
        lokasyon: 'A-3-2',
        adres: 'Ana depo, 3. kısım, 2. raf',
        firma: 'Metal San A.Ş.'
      },
      {
        kesit: '15x15x2',
        boy: 3500.00,
        malzeme_cinsi: 'Galvaniz Profil',
        adet: 8,
        kritik_stok_miktari: 10,
        lokasyon: 'E-1-3',
        adres: 'Galvaniz deposu, 1. kısım, 3. raf',
        firma: 'Galva Metal'
      },
      {
        kesit: '30x60x5',
        boy: 5000.00,
        malzeme_cinsi: 'ST37 Dikdörtgen Profil',
        adet: 18,
        kritik_stok_miktari: 8,
        lokasyon: 'C-3-1',
        adres: 'Profil deposu, 3. kısım, 1. raf',
        firma: 'Profil Dünyası'
      }
    ];

    for (const data of testData) {
      await StokKarti.create(data);
      console.log(`✓ ${data.malzeme_cinsi} - ${data.kesit} oluşturuldu`);
    }

    console.log(`\n${testData.length} adet test stok kartı başarıyla oluşturuldu!`);

    // İstatistikleri göster
    const stats = await getStats();
    console.log('\n=== STOK İSTATİSTİKLERİ ===');
    console.log(`Toplam Kart: ${stats.toplam}`);
    console.log(`Kritik Stok: ${stats.kritik}`);
    console.log(`Stokta Yok: ${stats.yok}`);
    console.log(`Toplam Stok Miktarı: ${stats.toplam_miktar}`);

  } catch (error) {
    console.error('Test verisi oluşturma hatası:', error);
  }
}

async function getStats() {
  const [toplam, kritik, yok, toplamMiktar] = await Promise.all([
    StokKarti.count({ where: { aktif_mi: true } }),
    StokKarti.count({ where: { aktif_mi: true, [Op.and]: sequelize.literal('adet <= kritik_stok_miktari') } }),
    StokKarti.count({ where: { aktif_mi: true, adet: 0 } }),
    StokKarti.sum('adet', { where: { aktif_mi: true } })
  ]);

  return {
    toplam,
    kritik,
    yok,
    toplam_miktar: toplamMiktar || 0
  };
}

// Script çalıştır
if (require.main === module) {
  createTestData().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script hatası:', error);
    process.exit(1);
  });
}

module.exports = { createTestData, getStats };
