const { sequelize } = require('./src/config/database');

async function testMultipleImages() {
  try {
    console.log('Çoklu resim API test başlıyor...');
    
    // 1. Notları getir ve resimlerle birlikte göster
    console.log('\n1. Mevcut notları kontrol ediyoruz:');
    const [notlar] = await sequelize.query(`
      SELECT 
        n.id,
        n.baslik,
        n.icerik,
        n.resim_yolu,
        n.kategori_id,
        n.olusturma_tarihi,
        n.guncelleme_tarihi,
        nk.kategori_adi,
        nk.renk_kodu
      FROM notlar n
      LEFT JOIN not_kategorileri nk ON n.kategori_id = nk.id AND nk.aktif = 1
      WHERE n.aktif = 1
      ORDER BY n.olusturma_tarihi DESC
      LIMIT 5
    `);

    // Her not için resimlerini getir
    for (let not of notlar) {
      const [resimler] = await sequelize.query(`
        SELECT id, resim_yolu, resim_adi, resim_boyutu, sira_no
        FROM not_resimleri 
        WHERE not_id = ? AND aktif = 1
        ORDER BY sira_no ASC, olusturma_tarihi ASC
      `, {
        replacements: [not.id]
      });
      
      not.resimler = resimler;
      console.log(`Not ID: ${not.id}, Başlık: ${not.baslik}, Resim sayısı: ${resimler.length}`);
      resimler.forEach((resim, index) => {
        console.log(`  Resim ${index + 1}: ${resim.resim_yolu} (Sıra: ${resim.sira_no})`);
      });
    }

    // 2. not_resimleri tablosunun içeriğini kontrol et
    console.log('\n2. not_resimleri tablosu içeriği:');
    const [tumResimler] = await sequelize.query(`
      SELECT nr.*, n.baslik 
      FROM not_resimleri nr 
      JOIN notlar n ON nr.not_id = n.id
      WHERE nr.aktif = 1
      ORDER BY nr.not_id, nr.sira_no
    `);
    
    console.log(`Toplam ${tumResimler.length} adet resim kaydı bulundu:`);
    tumResimler.forEach(resim => {
      console.log(`Not: ${resim.baslik} - Resim: ${resim.resim_yolu} (Sıra: ${resim.sira_no})`);
    });
    
    console.log('\nTest tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('Test hatası:', error);
    process.exit(1);
  }
}

testMultipleImages();
