// Test dosyası - Geliştirme dalında çalışıyorum
console.log("Bu develop dalında yapılan bir test");

// Yeni özellik: Kullanıcı giriş sistemi
function kullaniciGiris(kullaniciAdi, sifre) {
    console.log(`Giriş yapılıyor: ${kullaniciAdi}`);
    // TODO: Gerçek giriş mantığı eklenecek
    return true;
}

module.exports = { kullaniciGiris };
