const { sequelize } = require('./src/config/database');
const Parca = require('./src/models/Parca');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database bağlandı');
    
    // Test verisi
    const testData = {
      setup_sayisi: 12,
      cnc_suresi: 30
    };
    
    console.log('Test verisi:', testData);
    
    const parcaKodu = 'DPEO PSH 009 M01';
    console.log('Controller mantığını simüle ediyorum...');
    
    const parca = await Parca.findByPk(parcaKodu);
    if (parca) {
      console.log(`[Parça Bulundu] ${parcaKodu} - Mevcut Setup: ${parca.setupSayisi}, CNC: ${parca.cncIslemeSuresi}, Stok: ${parca.stokAdeti}`);
      
      const updateData = {};
      
      // Setup güncellemesi
      if (testData.setup_sayisi !== undefined && testData.setup_sayisi > 0) {
        console.log(`[Setup Güncelleme] Gelen setup_sayisi: ${testData.setup_sayisi}`);
        if (parca.setupSayisi !== undefined) {
          updateData.setupSayisi = testData.setup_sayisi;
          console.log(`[Setup Güncelleme] setupSayisi alanı kullanılacak: ${testData.setup_sayisi}`);
        }
      }
      
      // CNC güncellemesi
      if (testData.cnc_suresi !== undefined && testData.cnc_suresi > 0) {
        console.log(`[CNC Güncelleme] Gelen cnc_suresi: ${testData.cnc_suresi}`);
        if (parca.cncIslemeSuresi !== undefined) {
          updateData.cncIslemeSuresi = testData.cnc_suresi;
          console.log(`[CNC Güncelleme] cncIslemeSuresi alanı kullanılacak: ${testData.cnc_suresi}`);
        }
      }
      
      console.log(`[Parça Güncelleme] Güncellenecek alanlar: ${Object.keys(updateData).join(', ')}`);
      
      if (Object.keys(updateData).length > 0) {
        await parca.update(updateData);
        await parca.reload();
        console.log(`[Güncelleme Sonrası] Setup: ${parca.setupSayisi}, CNC: ${parca.cncIslemeSuresi}`);
      }
    }
    
  } catch (e) { 
    console.error('Hata:', e.message); 
  } finally { 
    process.exit(); 
  }
})();
