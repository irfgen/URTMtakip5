const { sequelize } = require('../src/config/database');
const Parca = require('../src/models/Parca');
const StokKarti = require('../src/models/StokKarti');

/**
 * Ham malzeme ölçülerini parse eder
 * @param {string} olculer - "50x40x120" formatındaki ölçü
 * @returns {object} {kesit, boy, isValid}
 */
function parseHamMalzemeOlculeri(olculer) {
  if (!olculer || typeof olculer !== 'string') {
    return { kesit: null, boy: null, isValid: false };
  }

  // Yaygın formatları yakala: "50x40x120", "50x40", "Çap25x100" vs.
  const cleanOlcu = olculer.trim().toUpperCase();
  
  // Çap formatını kontrol et
  const capMatch = cleanOlcu.match(/(?:ÇAP|Ø|CAP)(\d+)(?:X(\d+))?/);
  if (capMatch) {
    const cap = capMatch[1];
    const boy = capMatch[2] ? parseInt(capMatch[2]) : null;
    return { 
      kesit: `Çap${cap}`, 
      boy: boy, 
      isValid: true,
      tip: 'cap'
    };
  }

  // Normal XxYxZ formatını kontrol et
  const normalMatch = cleanOlcu.match(/(\d+)X(\d+)(?:X(\d+))?/);
  if (normalMatch) {
    const en = normalMatch[1];
    const boy1 = normalMatch[2];
    const boy2 = normalMatch[3] ? parseInt(normalMatch[3]) : null;
    
    return { 
      kesit: `${en}x${boy1}`, 
      boy: boy2, 
      isValid: true,
      tip: 'normal'
    };
  }

  // Tek boyutlu format: sadece sayı
  const singleMatch = cleanOlcu.match(/^(\d+)$/);
  if (singleMatch) {
    return { 
      kesit: singleMatch[1], 
      boy: null, 
      isValid: true,
      tip: 'single'
    };
  }

  return { kesit: cleanOlcu, boy: null, isValid: false, tip: 'unknown' };
}

/**
 * Stok kartında eşleşen kaydı bulur
 * @param {object} parsedOlcu - Parse edilmiş ölçü bilgisi
 * @param {string} malzemeCinsi - Malzeme cinsi
 * @returns {Promise<StokKarti|null>}
 */
async function findMatchingStokKarti(parsedOlcu, malzemeCinsi) {
  const { kesit, boy } = parsedOlcu;
  
  if (!kesit) return null;

  // 1. Tam eşleşme ara (kesit ve boy)
  if (boy) {
    const exactMatch = await StokKarti.findOne({
      where: {
        kesit: kesit,
        boy: boy,
        aktif_mi: true
      }
    });
    if (exactMatch) return exactMatch;
  }

  // 2. Kesit eşleşmesi ara (boy fark etmez)
  const kesitMatch = await StokKarti.findOne({
    where: {
      kesit: kesit,
      aktif_mi: true
    }
  });
  if (kesitMatch) return kesitMatch;

  // 3. Benzer kesit ara (küçük farklarla)
  const similarKesit = await StokKarti.findOne({
    where: {
      kesit: {
        [sequelize.Sequelize.Op.like]: `%${kesit}%`
      },
      aktif_mi: true
    }
  });
  if (similarKesit) return similarKesit;

  return null;
}

/**
 * Varsayılan stok kartı oluşturur
 * @param {object} parsedOlcu - Parse edilmiş ölçü
 * @param {string} malzemeCinsi - Malzeme cinsi
 * @returns {Promise<StokKarti>}
 */
async function createDefaultStokKarti(parsedOlcu, malzemeCinsi) {
  const { kesit, boy } = parsedOlcu;
  
  return await StokKarti.create({
    kesit: kesit || 'Tanımlanmamış',
    boy: boy || null,
    malzeme_cinsi: malzemeCinsi || 'Tanımlanmamış',
    malzeme_adi: `${kesit || 'Tanımlanmamış'} - Migration'dan Oluşturuldu`,
    adet: 0,
    kritik_stok_miktari: 0,
    lokasyon: 'Belirlenmemiş',
    firma: 'Migration',
    aktif_mi: true
  });
}

/**
 * Ana migration fonksiyonu
 */
async function migrateHamMalzemeToStokKarti() {
  console.log('🚀 Ham malzeme ölçüleri -> Stok kartı migration başlıyor...\n');

  try {
    // Tüm parçaları al
    const parcalar = await Parca.findAll({
      where: {
        hamMalzemeOlculeri: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    });

    console.log(`📊 Toplamda ${parcalar.length} parça bulundu\n`);

    let basarili = 0;
    let eslesti = 0;
    let yeniOlusturuldu = 0;
    let hatali = 0;
    const hatalar = [];

    for (const parca of parcalar) {
      try {
        console.log(`🔄 İşleniyor: ${parca.parcaKodu} - ${parca.hamMalzemeOlculeri}`);

        // Ham malzeme ölçüsünü parse et
        const parsedOlcu = parseHamMalzemeOlculeri(parca.hamMalzemeOlculeri);
        
        if (!parsedOlcu.isValid) {
          console.log(`   ⚠️ Parse edilemedi: ${parca.hamMalzemeOlculeri}`);
          hatalar.push({
            parcaKodu: parca.parcaKodu,
            hamMalzemeOlculeri: parca.hamMalzemeOlculeri,
            hata: 'Parse edilemedi'
          });
          hatali++;
          continue;
        }

        // Eşleşen stok kartı ara
        let stokKarti = await findMatchingStokKarti(parsedOlcu, parca.hamMalzemeCinsi);

        if (stokKarti) {
          console.log(`   ✅ Eşleşti: Stok Kartı ID ${stokKarti.id} (${stokKarti.kesit})`);
          eslesti++;
        } else {
          // Yeni stok kartı oluştur
          stokKarti = await createDefaultStokKarti(parsedOlcu, parca.hamMalzemeCinsi);
          console.log(`   🆕 Yeni oluşturuldu: ID ${stokKarti.id} (${stokKarti.kesit})`);
          yeniOlusturuldu++;
        }

        // Parçaya stok kartı ID'sini ata
        await parca.update({
          stok_karti_id: stokKarti.id
        });

        basarili++;
        console.log(`   💾 Güncellendi: ${parca.parcaKodu} -> Stok Kartı ${stokKarti.id}\n`);

      } catch (error) {
        console.error(`   ❌ Hata: ${parca.parcaKodu} - ${error.message}\n`);
        hatalar.push({
          parcaKodu: parca.parcaKodu,
          hamMalzemeOlculeri: parca.hamMalzemeOlculeri,
          hata: error.message
        });
        hatali++;
      }
    }

    // Özet rapor
    console.log('\n' + '='.repeat(50));
    console.log('📈 MIGRATION ÖZET RAPORU');
    console.log('='.repeat(50));
    console.log(`✅ Başarılı: ${basarili}`);
    console.log(`🔗 Mevcut stok kartı ile eşleşti: ${eslesti}`);
    console.log(`🆕 Yeni stok kartı oluşturuldu: ${yeniOlusturuldu}`);
    console.log(`❌ Hatalı: ${hatali}`);
    console.log(`📊 Toplam: ${parcalar.length}`);

    if (hatalar.length > 0) {
      console.log('\n❌ HATALAR:');
      hatalar.forEach(hata => {
        console.log(`   ${hata.parcaKodu}: ${hata.hamMalzemeOlculeri} - ${hata.hata}`);
      });
    }

    console.log('\n🎉 Migration tamamlandı!');

  } catch (error) {
    console.error('❌ Migration genel hatası:', error);
    throw error;
  }
}

// Script'i çalıştır
if (require.main === module) {
  migrateHamMalzemeToStokKarti()
    .then(() => {
      console.log('\n✅ Script başarıyla tamamlandı');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script hatası:', error);
      process.exit(1);
    });
}

module.exports = {
  migrateHamMalzemeToStokKarti,
  parseHamMalzemeOlculeri,
  findMatchingStokKarti,
  createDefaultStokKarti
};
