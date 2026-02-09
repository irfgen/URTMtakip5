const { IslemKaydi, IsEmri, Tezgah, sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');

async function testStats() {
  try {
    const isEmriId = 119;
    console.log("İş Emri İstatistikleri Hesaplanıyor. İş Emri ID:", isEmriId);
    
    // İş emri bilgilerini al
    const isEmri = await IsEmri.findByPk(isEmriId);
    if (!isEmri) {
      console.error(`İş emri bulunamadı. ID: ${isEmriId}`);
      return;
    }
    
    console.log("İş emri bulundu:", isEmri.is_emri_no);
    
    // Tezgah durum loglarını al
    const durumLogs = await sequelize.query(
      `SELECT * FROM tezgah_durum_logs 
       WHERE is_emri_id = ? 
       ORDER BY timestamp ASC`,
      {
        replacements: [isEmriId],
        type: QueryTypes.SELECT
      }
    );
    
    console.log(`İş emri ${isEmriId} için ${durumLogs.length} adet durum logu bulundu.`);
    
    if (durumLogs.length === 0) {
      console.log("Durum logu yok");
      return;
    }
    
    // İstatistikleri hesapla
    let baslangicTarihi = null;
    let bitisTarihi = null;
    let toplamCalisma = 0;
    let toplamDurus = 0;
    let araVermeSayisi = 0;
    let toplamUretilen = 0;
    let sonDurum = null;
    let sonDurumZamani = null;
    const duruslar = [];
    let calismaDurusDonguSayisi = 0;
    
    // Durum loglarını analiz et
    for (let i = 0; i < durumLogs.length; i++) {
      const log = durumLogs[i];
      const suankiZaman = new Date(log.timestamp);
      
      if (i === 0) {
        baslangicTarihi = suankiZaman;
        if (log.durum === 0) {
          // İlk kayıt duruş ise, öncesinde çalışma olduğunu varsay
          sonDurum = 1;
          sonDurumZamani = suankiZaman;
        }
      }
      
      if (sonDurumZamani) {
        const fark = (suankiZaman - sonDurumZamani) / (1000 * 60); // dakika cinsinden
        
        if (sonDurum === 1) { // çalışıyor
          toplamCalisma += fark;
          console.log(`Çalışma süresi eklendi: ${fark.toFixed(2)} dk`);
        } else if (sonDurum === 0) { // durdu
          toplamDurus += fark;
          araVermeSayisi++;
          
          duruslar.push({
            baslangic: sonDurumZamani,
            bitis: log.timestamp,
            sure: fark.toFixed(2),
            neden: log.durus_nedeni || 'Duruş',
            aciklama: log.durus_nedeni
          });
          console.log(`Duruş süresi eklendi: ${fark.toFixed(2)} dk`);
        }
      }

      // Durum değişikliği sayısını hesapla (çalışma->duruş veya duruş->çalışma)
      if (sonDurum !== null && sonDurum !== log.durum) {
        calismaDurusDonguSayisi++;
      }

      sonDurum = log.durum;
      sonDurumZamani = suankiZaman;
      bitisTarihi = suankiZaman;
    }
    
    // Son durum çalışıyor ise ve henüz bitmemişse, şimdiki zamana kadar çalışma süresi ekle
    if (sonDurum === 1) {
      const simdikiZaman = new Date();
      const fark = (simdikiZaman - sonDurumZamani) / (1000 * 60);
      toplamCalisma += fark;
      bitisTarihi = simdikiZaman;
    }

    // Toplam üretileni varsayılan olarak 0 bırak (bu formda manuel girilecek)
    toplamUretilen = 0;
    
    console.log(`Toplam çalışma-duruş döngü sayısı: ${calismaDurusDonguSayisi}`);
    
    // İstatistikler
    const stats = {
      is_emri_id: parseInt(isEmriId),
      baslangic_tarihi: baslangicTarihi,
      bitis_tarihi: bitisTarihi,
      toplam_calisma_suresi: Math.round(toplamCalisma),
      toplam_durus_suresi: Math.round(toplamDurus),
      ara_verme_sayisi: araVermeSayisi,
      toplam_uretilen: toplamUretilen,
      calisma_durus_dongu_sayisi: calismaDurusDonguSayisi,
      hurda_sayisi: 0, // Bu değer formda kullanıcı tarafından girilecek
      ortalama_parca_suresi: toplamUretilen > 0 ? (toplamCalisma / toplamUretilen).toFixed(2) : 0,
      verimlilik: toplamCalisma > 0 ? (((toplamCalisma) / (toplamCalisma + toplamDurus)) * 100).toFixed(2) : 0,
      durus_detaylari: duruslar
    };
    
    console.log("SONUÇ:", JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('İstatistik hesaplama hatası:', error);
  }
  process.exit(0);
}

testStats();
