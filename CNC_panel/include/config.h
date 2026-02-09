#ifndef CONFIG_H
#define CONFIG_H

// WiFi ayarları EV
//#define WIFI_SSID "VODAFONE_XR7300"
//#define WIFI_PASSWORD "exk9dkkeFtHNs7bN"

// WiFi ayarları İŞ
#define WIFI_SSID "CNC"
#define WIFI_PASSWORD "MizrakCnc1234"

#define SERVER_ADDRESS "http://192.168.1.206:3000"  // Sunucu adresi (ESP32'den farklı bir IP olmalı)
// CNC durum kodları
#define CNC_STATUS_STOPPED 0   // Durdu
#define CNC_STATUS_RUNNING 1   // Çalışıyor

// Ağ ping testleri (ICMP) – gürültüyü azaltmak için varsayılan: devre dışı
#define ENABLE_PING_TESTS false

// CNC makine numarası
#define CNC_NO 18 // (CNC XX) CNC makinesi için benzersiz tanımlayıcı

// CNC durumu için GPIO pin tanımları
#define CNC_STATUS_PIN 26  // CNC durum sinyalinin bağlı olduğu pin

// Zaman ayarları - Optimize edilmiş değerler
#define CHECK_INTERVAL 3000    // CNC durum kontrol aralığı (ms) - 3 saniye (eskiden 5)
#define DEBOUNCE_TIME 500      // Debounce süresi (ms) - artırıldı
#define WIFI_RECONNECT_INTERVAL 20000  // WiFi yeniden bağlanma aralığı (ms) - kısaltıldı

// CNC Link API ayarları
#define CNC_LINK_API_URL "http://192.168.1.206:3000"  // CNC Link API sunucu adresi
#define PARCA_KAYIT_BUFFER_SIZE 100  // Offline kayıt buffer boyutu
#define PARCA_GONDERIM_TIMEOUT 8000  // Parça bilgisi gönderim timeout'u (ms)
#define IS_EMRI_KONTROL_ARALIGI 30000  // İş emri kontrolü aralığı (ms) - 30 saniye

#endif // CONFIG_H