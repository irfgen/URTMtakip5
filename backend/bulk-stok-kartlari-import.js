const StokKarti = require('./src/models/StokKarti');
const { sequelize } = require('./src/config/database');

// Tablo verilerini JavaScript array'ine çevir
const stokVerileri = [
  { kesit: "30X30", boy: 43, malzeme_cinsi: "SOGUK KARE", adet: 10 },
  { kesit: "60X80", boy: 78, malzeme_cinsi: "SOĞUK ÇEKME", adet: 10 },
  { kesit: "50X20", boy: 63, malzeme_cinsi: "SOĞUK ÇEKME", adet: 18 },
  { kesit: "150X30", boy: 5030, malzeme_cinsi: "SICAK ÇEKME", adet: 2 },
  { kesit: "60X15", boy: 182, malzeme_cinsi: "SICAK ÇEKME", adet: 4 },
  { kesit: "60X10", boy: 3738, malzeme_cinsi: "SICAK ÇEKME", adet: 2 },
  { kesit: "60X10", boy: 3618, malzeme_cinsi: "SICAK ÇEKME", adet: 1 },
  { kesit: "60X10", boy: 955, malzeme_cinsi: "SICAK ÇEKME", adet: 10 },
  { kesit: "30X10", boy: 510, malzeme_cinsi: "SICAK ÇEKME", adet: 12 },
  { kesit: "30X10", boy: 610, malzeme_cinsi: "SICAK ÇEKME", adet: 4 },
  { kesit: "30X10", boy: 548, malzeme_cinsi: "SICAK ÇEKME", adet: 4 },
  { kesit: "30X10", boy: 630, malzeme_cinsi: "SICAK ÇEKME", adet: 4 },
  { kesit: "30X10", boy: 1890, malzeme_cinsi: "SICAK ÇEKME", adet: 1 },
  { kesit: "60X10", boy: 1600, malzeme_cinsi: "SICAK ÇEKME", adet: 1 },
  { kesit: "50x10", boy: 170, malzeme_cinsi: "SICAK ÇEKME", adet: 1 },
  { kesit: "Çap23", boy: 3000, malzeme_cinsi: "otomat", adet: 100 },
  { kesit: "50x30", boy: 35, malzeme_cinsi: "SOĞUK ÇEKME", adet: 500 },
  { kesit: "40x20", boy: 58, malzeme_cinsi: "SOĞUK ÇEKME", adet: 500 },
  { kesit: "60x15", boy: 35, malzeme_cinsi: "SOĞUK ÇEKME", adet: 500 },
  { kesit: "20x10", boy: 50, malzeme_cinsi: "SOĞUK ÇEKME", adet: 500 },
  { kesit: "Çap80", boy: 137, malzeme_cinsi: "transmisyonlu mil", adet: 50 },
  { kesit: "30", boy: 94, malzeme_cinsi: "otomat", adet: 38 },
  { kesit: "30", boy: 98, malzeme_cinsi: "otomat", adet: 50 },
  { kesit: "70x10", boy: 75, malzeme_cinsi: "SOĞUK ÇEKME", adet: 1000 },
  { kesit: "25x25", boy: 80, malzeme_cinsi: "SOĞUK ÇEKME", adet: 100 },
  { kesit: "ÇAP80", boy: 12, malzeme_cinsi: "C1040", adet: 10 },
  { kesit: "ÇAP80", boy: 24, malzeme_cinsi: "C1040", adet: 10 },
  { kesit: "Ø25", boy: null, malzeme_cinsi: "OTOMAT MALZEME", adet: 2 },
  { kesit: "60X20", boy: 600, malzeme_cinsi: "SICAK ÇEKME", adet: 200 },
  { kesit: "ÇAP100", boy: 14, malzeme_cinsi: "C1040", adet: 1000 },
  { kesit: "ÇAP20", boy: 3000, malzeme_cinsi: "otomat", adet: 100 },
  { kesit: "40X15", boy: 113, malzeme_cinsi: "SOĞUK ÇEKME", adet: 11 },
  { kesit: "20X80", boy: 203, malzeme_cinsi: "SOĞUK ÇEKME", adet: 11 },
  { kesit: "30X20", boy: 133, malzeme_cinsi: "SOĞUK ÇEKME", adet: 11 },
  { kesit: "30X20", boy: 88, malzeme_cinsi: "SOĞUK ÇEKME", adet: 11 },
  { kesit: "20x15", boy: 120, malzeme_cinsi: "SOĞUK ÇEKME", adet: 15 },
  { kesit: "20x15", boy: 130, malzeme_cinsi: "SOĞUK ÇEKME", adet: 15 },
  { kesit: "70x20", boy: 96, malzeme_cinsi: "SOĞUK ÇEKME", adet: 30 },
  { kesit: "40x20", boy: 340, malzeme_cinsi: "SOĞUK ÇEKME", adet: 30 },
  { kesit: "15x15", boy: 120, malzeme_cinsi: "SOĞUK ÇEKME", adet: 15 },
  { kesit: "50x20", boy: 53, malzeme_cinsi: "SOĞUK ÇEKME", adet: 60 },
  { kesit: "30x20", boy: 113, malzeme_cinsi: "SOĞUK ÇEKME", adet: 15 },
  { kesit: "50x50", boy: 338, malzeme_cinsi: "SOĞUK ÇEKME", adet: 30 },
  { kesit: "40x15", boy: 28, malzeme_cinsi: "SOĞUK ÇEKME", adet: 120 },
  { kesit: "12x12", boy: 185, malzeme_cinsi: "SOĞUK ÇEKME", adet: 30 },
  { kesit: "30x30", boy: 80, malzeme_cinsi: "SOĞUK ÇEKME", adet: 30 },
  { kesit: "40x40", boy: 43, malzeme_cinsi: "SOĞUK ÇEKME", adet: 15 },
  { kesit: "100x30", boy: 105, malzeme_cinsi: "SOĞUK ÇEKME", adet: 15 },
  { kesit: "20x20", boy: 95, malzeme_cinsi: "SOĞUK ÇEKME", adet: 15 },
  { kesit: "20x15", boy: 152, malzeme_cinsi: "SOĞUK ÇEKME", adet: 15 },
  { kesit: "20x15", boy: 120, malzeme_cinsi: "SOĞUK ÇEKME", adet: 30 },
  { kesit: "40x15", boy: 63, malzeme_cinsi: "SOĞUK ÇEKME", adet: 15 },
  { kesit: "100x100", boy: 85, malzeme_cinsi: "SICAK ÇEKME", adet: 30 },
  { kesit: "100x40", boy: 316, malzeme_cinsi: "SICAK ÇEKME", adet: 15 },
  { kesit: "100x40", boy: 605, malzeme_cinsi: "SICAK ÇEKME", adet: 15 },
  { kesit: "130x130", boy: 60, malzeme_cinsi: "SICAK ÇEKME", adet: 30 },
  { kesit: "100x20", boy: 330, malzeme_cinsi: "SICAK ÇEKME", adet: 30 },
  { kesit: "100x20", boy: 733, malzeme_cinsi: "SICAK ÇEKME", adet: 30 },
  { kesit: "100x25", boy: 95, malzeme_cinsi: "SICAK ÇEKME", adet: 15 },
  { kesit: "70x50", boy: 70, malzeme_cinsi: "SICAK ÇEKME", adet: 15 },
  { kesit: "40x40", boy: 30, malzeme_cinsi: "SICAK ÇEKME", adet: 15 },
  { kesit: "30x30", boy: 35, malzeme_cinsi: "SICAK ÇEKME", adet: 15 },
  { kesit: "70x70", boy: 60, malzeme_cinsi: "SICAK ÇEKME", adet: 15 },
  { kesit: "Sw17", boy: 3000, malzeme_cinsi: "otomat", adet: 50 },
  { kesit: "Sw19", boy: 3000, malzeme_cinsi: "otomat", adet: 50 },
  { kesit: "80x80", boy: 63, malzeme_cinsi: "SOGUK KARE", adet: 10 },
  { kesit: "70x10", boy: 110, malzeme_cinsi: "SICAK ÇEKME", adet: 50 },
  { kesit: "AA36", boy: null, malzeme_cinsi: "otomat", adet: 1 },
  { kesit: "AA24", boy: null, malzeme_cinsi: "otomat", adet: 3 },
  { kesit: "AA30", boy: null, malzeme_cinsi: "otomat", adet: 2 },
  { kesit: "AA30", boy: 100, malzeme_cinsi: "st37", adet: 32 },
  { kesit: "AA30", boy: 96, malzeme_cinsi: "st37", adet: 32 },
  { kesit: "40 x 40", boy: 55, malzeme_cinsi: "Sıcak Çekme", adet: 1000 },
  { kesit: "Çap17", boy: 3000, malzeme_cinsi: "otomat", adet: 50 },
  { kesit: "Çap30", boy: 228, malzeme_cinsi: "c1040", adet: 1000 },
  { kesit: "Çap40", boy: 249, malzeme_cinsi: "c1040", adet: 500 },
  { kesit: "Çap30", boy: 254, malzeme_cinsi: "otomat", adet: 1000 },
  { kesit: "Çap100", boy: 33, malzeme_cinsi: "c1040", adet: 500 },
  { kesit: "40x30", boy: 85, malzeme_cinsi: "SICAK ÇEKME", adet: 10 },
  { kesit: "30x30", boy: 40, malzeme_cinsi: "SOĞUK ÇEKME", adet: 15 },
  { kesit: "Sw14", boy: 3000, malzeme_cinsi: "otomat", adet: 50 },
  { kesit: "Çap60", boy: 22, malzeme_cinsi: "c1040", adet: 1000 },
  { kesit: "Çap60", boy: 12, malzeme_cinsi: "c1040", adet: 500 },
  { kesit: "Çap70", boy: 71, malzeme_cinsi: "tornalı mil", adet: 100 },
  { kesit: "80x15", boy: 215, malzeme_cinsi: "SOĞUK ÇEKME", adet: 200 },
  { kesit: "20 x 5", boy: null, malzeme_cinsi: "Sıcak Çekme lama", adet: 8 },
  { kesit: "50X50", boy: 20, malzeme_cinsi: "SOĞUK ÇEKME", adet: 5 },
  { kesit: "70X70", boy: 50, malzeme_cinsi: "SOĞUK ÇEKME", adet: 5 },
  { kesit: "60X60", boy: 93, malzeme_cinsi: "SOĞUK ÇEKME", adet: 5 },
  { kesit: "60X60", boy: 90, malzeme_cinsi: "SOĞUK ÇEKME", adet: 5 },
  { kesit: "70x25", boy: 50, malzeme_cinsi: "SOĞUK ÇEKME", adet: 12 },
  { kesit: "Çap100", boy: 35, malzeme_cinsi: "c1040", adet: 100 },
  { kesit: "50x20", boy: 60, malzeme_cinsi: "SOĞUK ÇEKME", adet: 500 },
  { kesit: "150X40", boy: 750, malzeme_cinsi: "SICAK ÇEKME", adet: 1 },
  { kesit: "60X25", boy: 150, malzeme_cinsi: "SOĞUK ÇEKME", adet: 50 },
  { kesit: "16x16", boy: 153, malzeme_cinsi: "SOĞUK ÇEKME", adet: 100 },
  { kesit: "100x60", boy: 120, malzeme_cinsi: "SOĞUK ÇEKME", adet: 50 },
  { kesit: "20x10", boy: 20, malzeme_cinsi: "SOĞUK ÇEKME", adet: 1000 },
  { kesit: "Sw32", boy: 182, malzeme_cinsi: "otomat", adet: 1000 },
  { kesit: "Çap40", boy: 40, malzeme_cinsi: "otomat", adet: 1000 },
  { kesit: "Çap40", boy: 30, malzeme_cinsi: "otomat", adet: 1000 },
  { kesit: "Sw19", boy: 3000, malzeme_cinsi: "otomat", adet: 100 },
  { kesit: "Çap20", boy: 3000, malzeme_cinsi: "otomat", adet: 50 },
  { kesit: "40 x 40", boy: 55, malzeme_cinsi: "Sıcak Çekme", adet: 2000 },
  { kesit: "14", boy: 137, malzeme_cinsi: "otomat", adet: 1000 },
  { kesit: "30x5", boy: 600, malzeme_cinsi: "SOĞUK ÇEKME", adet: 100 },
  { kesit: "50x20", boy: 120, malzeme_cinsi: "SOĞUK ÇEKME", adet: 35 },
  { kesit: "70x25", boy: 170, malzeme_cinsi: "SOĞUK ÇEKME", adet: 12 },
  { kesit: "80x25", boy: 170, malzeme_cinsi: "SOĞUK ÇEKME", adet: 26 },
  { kesit: "60x25", boy: 250, malzeme_cinsi: "SOĞUK ÇEKME", adet: 18 },
  { kesit: "30x30", boy: 405, malzeme_cinsi: "SICAK ÇEKME", adet: 12 },
  { kesit: "120x25", boy: 120, malzeme_cinsi: "SOĞUK ÇEKME", adet: 20 },
  { kesit: "Sw41", boy: 16, malzeme_cinsi: "otomat", adet: 1000 },
  { kesit: "30X10", boy: 140, malzeme_cinsi: "SOĞUK ÇEKME", adet: 100 },
  { kesit: "Çap8", boy: 3000, malzeme_cinsi: "otomat", adet: 50 },
  { kesit: "Çap10", boy: 3000, malzeme_cinsi: "otomat", adet: 50 },
  { kesit: "50X25", boy: 125, malzeme_cinsi: "SICAK ÇEKME", adet: 60 },
  { kesit: "30X30", boy: 100, malzeme_cinsi: "SICAK ÇEKME", adet: 110 },
  { kesit: "25x5", boy: 280, malzeme_cinsi: "SOĞUK ÇEKME", adet: 1000 },
  { kesit: "30x12", boy: 100, malzeme_cinsi: "SOĞUK ÇEKME", adet: 500 },
  { kesit: "40x20", boy: 68, malzeme_cinsi: "soguk çekme lama", adet: 20 },
  { kesit: "8x8", boy: 130, malzeme_cinsi: "SOĞUK ÇEKME", adet: 300 },
  { kesit: "Çap40", boy: 249, malzeme_cinsi: "c1040", adet: 500 },
  { kesit: "Sw19", boy: 3000, malzeme_cinsi: "otomat", adet: 50 },
  { kesit: "60X60", boy: 120, malzeme_cinsi: "SOGUK KARE", adet: 20 },
  { kesit: "50x15", boy: 40, malzeme_cinsi: "SOĞUK ÇEKME", adet: 1000 },
  { kesit: "Çap10", boy: 3000, malzeme_cinsi: "otomat", adet: 100 },
  { kesit: "Sw17", boy: 3000, malzeme_cinsi: "otomat", adet: 50 },
  { kesit: "20 x 12", boy: 100, malzeme_cinsi: "Soğuk Çekme Lama", adet: 500 },
  { kesit: "Çap50", boy: 390, malzeme_cinsi: "1040 çelik", adet: 20 },
  { kesit: "Çap5", boy: 317, malzeme_cinsi: null, adet: null }
];

// Adet bilgisini temizle (sadece sayıları al)
function parseAdet(adetStr) {
  if (!adetStr) return 0;
  const match = String(adetStr).match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Malzeme cinsini normalize et
function normalizeMalzemeCinsi(malzeme) {
  if (!malzeme) return 'Tanımsız';
  
  // Türkçe karakter ve büyük harf normalleştirmesi
  return malzeme
    .toUpperCase()
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .trim();
}

// Ana import fonksiyonu
async function importStokKartlari() {
  try {
    console.log('🚀 Stok kartları bulk import işlemi başlatılıyor...');
    
    // Veritabanı bağlantısını test et
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı');

    // Model'i sync et
    await StokKarti.sync();
    console.log('✅ StokKarti modeli hazır');

    let basarili = 0;
    let hatali = 0;
    let atlanilan = 0;

    console.log(`📊 Toplam ${stokVerileri.length} kayıt işlenecek\n`);

    for (let i = 0; i < stokVerileri.length; i++) {
      const veri = stokVerileri[i];
      
      try {
        // Son satırı atla (eksik veri)
        if (i === stokVerileri.length - 1 && !veri.malzeme_cinsi) {
          console.log(`⏭️  ${i + 1}. kayıt atlandı: Eksik malzeme cinsi`);
          atlanilan++;
          continue;
        }

        // Adet parse et
        const adet = parseAdet(veri.adet);
        if (adet === 0 && veri.adet !== 0) {
          console.log(`⏭️  ${i + 1}. kayıt atlandı: Adet parselenemiyor (${veri.adet})`);
          atlanilan++;
          continue;
        }

        // Malzeme cinsini normalize et
        const malzemeCinsi = normalizeMalzemeCinsi(veri.malzeme_cinsi);

        // Kritik stok miktarını hesapla (adet'in %20'si, minimum 5)
        const kritikStokMiktari = Math.max(Math.ceil(adet * 0.2), 5);

        // Duplicate kontrolü
        const existing = await StokKarti.findOne({
          where: {
            kesit: veri.kesit,
            boy: veri.boy,
            malzeme_cinsi: malzemeCinsi
          }
        });

        if (existing) {
          // Mevcut kayıt varsa adet'i güncelle
          await existing.update({
            adet: existing.adet + adet,
            guncelleme_tarihi: new Date()
          });
          console.log(`🔄 ${i + 1}. Güncellendi: ${veri.kesit} - ${malzemeCinsi} (Eski: ${existing.adet - adet}, Yeni: ${existing.adet})`);
        } else {
          // Yeni kayıt oluştur
          await StokKarti.create({
            kesit: veri.kesit,
            boy: veri.boy,
            malzeme_cinsi: malzemeCinsi,
            adet: adet,
            kritik_stok_miktari: kritikStokMiktari,
            aktif_mi: true
          });
          console.log(`✅ ${i + 1}. Eklendi: ${veri.kesit} x ${veri.boy || 'boy'}mm - ${malzemeCinsi} (${adet} adet)`);
        }

        basarili++;

      } catch (error) {
        console.error(`❌ ${i + 1}. kayıt hatası: ${veri.kesit} - ${error.message}`);
        hatali++;
      }
    }

    // İstatistikleri göster
    console.log('\n📊 IMPORT İSTATİSTİKLERİ');
    console.log('========================');
    console.log(`✅ Başarılı: ${basarili}`);
    console.log(`❌ Hatalı: ${hatali}`);
    console.log(`⏭️  Atlanan: ${atlanilan}`);
    console.log(`📝 Toplam: ${stokVerileri.length}`);

    // Veritabanı istatistikleri
    const { Op } = require('sequelize');
    const toplamKart = await StokKarti.count({ where: { aktif_mi: true } });
    const kritikStok = await StokKarti.count({
      where: {
        aktif_mi: true,
        [Op.and]: sequelize.literal('adet <= kritik_stok_miktari')
      }
    });

    console.log('\n📈 VERİTABANI İSTATİSTİKLERİ');
    console.log('============================');
    console.log(`📦 Toplam Stok Kartı: ${toplamKart}`);
    console.log(`⚠️  Kritik Stok: ${kritikStok}`);

    console.log('\n🎉 Import işlemi tamamlandı!');

  } catch (error) {
    console.error('💥 Import işlemi sırasında kritik hata:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔒 Veritabanı bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  importStokKartlari()
    .then(() => {
      console.log('✨ İşlem başarıyla tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💀 İşlem başarısız:', error);
      process.exit(1);
    });
}

module.exports = { importStokKartlari, stokVerileri };
