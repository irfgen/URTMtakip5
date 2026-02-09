/**
 * Mevcut Fason Kayıtları İçin İş Emri Oluşturma Script'i
 * 
 * Bu script, mevcut fason kayıtları için iş emirleri oluşturur ve
 * fason-iş emri entegrasyonunu sağlar.
 */

const sequelize = require('../src/config/database').sequelize;
const FasonIsEmri = require('../src/models/FasonIsEmri');
const IsEmri = require('../src/models/IsEmri');
const { generateIsEmriNo } = require('../src/controllers/isEmirleriController');

async function createWorkOrdersForExistingFason() {
  console.log('🚀 Mevcut fason kayıtları için iş emri oluşturma başlıyor...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı');

    // İş emri ID'si olmayan fason kayıtlarını bul
    const mevcutFasonlar = await FasonIsEmri.findAll({
      where: { is_emri_id: null },
      order: [['verilis_tarihi', 'ASC']]
    });

    console.log(`📊 Toplam ${mevcutFasonlar.length} adet iş emri olmayan fason kaydı bulundu`);

    if (mevcutFasonlar.length === 0) {
      console.log('✅ Tüm fason kayıtları zaten iş emirleriyle ilişkili');
      return;
    }

    let olusturulan = 0;
    let hatalı = 0;

    // Transaction ile güvenli işlem
    const transaction = await sequelize.transaction();

    try {
      for (const fason of mevcutFasonlar) {
        try {
          console.log(`\n📝 İşleniyor: ${fason.parca_kodu} - ${fason.tedarikci}`);

          // Yeni iş emri numarası oluştur
          const isEmriNo = await generateIsEmriNo(transaction);
          
          // İş emri durumunu belirle
          let durum = 'fason';
          if (fason.durum === 'tamamlandi') {
            durum = 'tamamlandı';
          } else if (fason.durum === 'iptal') {
            durum = 'iptal';
          }

          // Yeni iş emri oluştur
          const yeniIsEmri = await IsEmri.create({
            is_emri_no: isEmriNo,
            is_adi: `Fason İş - ${fason.parca_kodu}`,
            plan_liste_no: `Fason - ${fason.tedarikci}`,
            adet: fason.fason_adet,
            malzeme: 'Fason İşlemi',
            teslim_tarihi: fason.teslim_tarihi || new Date(),
            oncelik: 'normal',
            durum: durum,
            tezgah_id: null,
            uretim_plani_id: fason.uretim_plani_id,
            parca_kodu: fason.parca_kodu,
            aciklama: `Fason işlemi: ${fason.aciklama || fason.tedarikci}`,
            hareketler: [
              `${new Date().toLocaleString('tr-TR')} - Mevcut fason kaydından otomatik oluşturuldu`,
              `${fason.verilis_tarihi ? new Date(fason.verilis_tarihi).toLocaleString('tr-TR') : ''} - Fasona gönderildi`
            ].filter(Boolean),
            malzemesi_siparis_edilecekmi: false,
            order: 0
          }, { transaction });

          // Fason kaydını güncelle
          await fason.update({
            is_emri_id: yeniIsEmri.is_emri_id
          }, { transaction });

          console.log(`   ✅ İş emri oluşturuldu: ${isEmriNo} (ID: ${yeniIsEmri.is_emri_id})`);
          olusturulan++;

        } catch (error) {
          console.error(`   ❌ Hata: ${fason.parca_kodu} için iş emri oluşturulamadı:`, error.message);
          hatalı++;
        }
      }

      // Transaction commit
      await transaction.commit();
      
      console.log(`\n📈 ÖZET:`);
      console.log(`   ✅ Başarıyla oluşturulan: ${olusturulan}`);
      console.log(`   ❌ Hatalı: ${hatalı}`);
      console.log(`   📊 Toplam işlenen: ${olusturulan + hatalı}`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Script genel hatası:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Veritabanı bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  createWorkOrdersForExistingFason()
    .then(() => {
      console.log('🎉 Script başarıyla tamamlandı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script hatası:', error);
      process.exit(1);
    });
}

module.exports = { createWorkOrdersForExistingFason };