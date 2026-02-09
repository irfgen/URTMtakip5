const axios = require('axios');

// Test için gerçek API endpoint'ini çağır
const testFasonTeslim = async () => {
    try {
        console.log('Fason teslim API test başlıyor...');
        
        // İlk olarak mevcut durumu getir
        const fasonId = '6235d3fd-d4b0-4038-b3d7-b9f8abe0f9e0';
        console.log(`Test edilecek fason ID: ${fasonId}`);
        
        // İlk teslim: 10 adet
        console.log('\n=== İLK TESLİM ===');
        const response1 = await axios.post(`http://192.168.1.206:3000/api/fason/is-emirleri/${fasonId}/teslim-al`, {
            teslim_adet: 10,
            teslim_notlari: 'Test teslimat 1'
        });
        
        console.log('İlk teslim sonucu:');
        console.log('- Mevcut teslim:', response1.data.mevcutTeslim);
        console.log('- Yeni teslim:', response1.data.yeniTeslim);
        console.log('- Toplam teslim:', response1.data.toplamTeslim);
        
        // 2 saniye bekle
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // İkinci teslim: 5 adet
        console.log('\n=== İKİNCİ TESLİM ===');
        const response2 = await axios.post(`http://192.168.1.206:3000/api/fason/is-emirleri/${fasonId}/teslim-al`, {
            teslim_adet: 5,
            teslim_notlari: 'Test teslimat 2'
        });
        
        console.log('İkinci teslim sonucu:');
        console.log('- Mevcut teslim:', response2.data.mevcutTeslim);
        console.log('- Yeni teslim:', response2.data.yeniTeslim);
        console.log('- Toplam teslim:', response2.data.toplamTeslim);
        
        console.log('\n=== SONUÇ ===');
        console.log('Beklenen toplam: 155 + 10 + 5 = 170');
        console.log('Gerçek toplam:', response2.data.toplamTeslim);
        
    } catch (error) {
        console.error('Test hatası:', error.response?.data || error.message);
    }
};

testFasonTeslim();
