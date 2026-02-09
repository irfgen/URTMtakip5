const { sequelize } = require('./src/config/database');
const ParcaKayitlari = require('./src/models/ParcaKayitlari');
const path = require('path');

async function fixParcaKayitPaths() {
  try {
    console.log('Parça kayıt dosya yolları düzeltiliyor...');
    
    // Tüm kayıtları getir
    const kayitlar = await ParcaKayitlari.findAll();
    
    console.log(`Toplam ${kayitlar.length} kayıt bulundu.`);
    
    for (const kayit of kayitlar) {
      const eskiYol = kayit.dosyaYolu;
      
      // Eğer zaten sadece dosya adı ise dokunma
      if (!eskiYol.includes('/') && !eskiYol.includes('\\')) {
        console.log(`Kayıt ${kayit.id}: Zaten düzgün - ${eskiYol}`);
        continue;
      }
      
      // Dosya adını çıkar (hem Windows hem Unix path'ler için)
      const dosyaAdi = path.basename(eskiYol);
      
      // Güncelle
      await kayit.update({ dosyaYolu: dosyaAdi });
      
      console.log(`Kayıt ${kayit.id}: "${eskiYol}" -> "${dosyaAdi}"`);
    }
    
    console.log('Dosya yolları başarıyla düzeltildi!');
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await sequelize.close();
  }
}

// Script'i çalıştır
fixParcaKayitPaths();
