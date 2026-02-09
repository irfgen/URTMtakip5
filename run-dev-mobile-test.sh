#!/bin/bash
# filepath: /home/irfan/Documents/PROJELER/URTMtakip/run-dev-mobile-test.sh

# Mobil cihaz test URL'sini tanımlama
MOBILE_TEST_URL="http://192.168.1.206:5173/mobile"

# Vite'ı başlat
echo "Vite geliştirme sunucusu başlatılıyor..."
cd frontend && npm run dev &
VITE_PID=$!

# Vite'ın başlamasını bekle
echo "Sunucunun başlaması bekleniyor..."
sleep 3

# Komut satırında URL bilgisini göster
echo "==============================================="
echo "Mobil uygulama burada çalışıyor: $MOBILE_TEST_URL"
echo "Mobil cihazınızdan erişmek için yerel IP adresinizi kullanabilirsiniz."
echo "Tarayıcı geliştirici araçlarıyla mobil görünümü de test edebilirsiniz."
echo "==============================================="

# Kullanıcı Ctrl+C ile çıkana kadar bekle
trap "echo 'Uygulama kapatılıyor...'; kill $VITE_PID; exit 0" INT
wait
