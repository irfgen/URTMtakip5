#include <Arduino.h>
#include <WiFi.h>
#include "config.h"
#include "wifi_manager.h"
#include "cnc_monitor.h"
#include "cnc_link.h"

// Global değişkenler
unsigned long lastCheckTime = 0;        // Son durum kontrol zamanı
unsigned long lastWifiCheckTime = 0;    // Son WiFi kontrol zamanı
unsigned long lastCncLinkCheckTime = 0; // Son CNC Link kontrol zamanı

void setup() {
    // Seri port başlatılıyor
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n\n--- ESP32 CNC Durum İzleme Sistemi ---");
    Serial.println("Sistem başlatılıyor...");
    
    // WiFi bağlantısını kur
    if (!connectToWiFi(WIFI_SSID, WIFI_PASSWORD)) {
        Serial.println("WiFi bağlantısı başarısız! Sistem yeniden başlatılıyor...");
        delay(3000);
        ESP.restart();
    }
    
    // CNC izleme sistemini başlat
    setupCncMonitor();
    
    // CNC Link sistemini başlat
    setupCncLink();
    
    Serial.println("Sistem hazır. CNC durum izleme ve parça takibi başlatıldı...");
    Serial.print("CNC No: ");
    Serial.println(CNC_NO);
    
    // Test modu kaldırıldı
    
    // NTP senkronu olmadan ilk durum bildirimi yapılmasın
    // İlk durum sadece belleğe alınır; periyodik kontrol ilk gönderimi yapar
    int initialState = readCncState();
    lastCncState = initialState;
    
    // İlk durum çalışıyor ise parça işlemeyi başlat
    if (initialState == CNC_STATUS_RUNNING) {
        parcaIslemeBaslat();
    }
}

void loop() {
    unsigned long currentMillis = millis();
    
    // Memory usage kontrolü ekle
    size_t freeHeap = ESP.getFreeHeap();
    if (freeHeap < 10000) { // 10KB'dan az free memory kaldıysa
        Serial.printf("⚠ Düşük memory: %u bytes, sistem yeniden başlatılıyor...\n", freeHeap);
        delay(1000);
        ESP.restart();
    }
    
    // WiFi bağlantısını kontrol et
    if (currentMillis - lastWifiCheckTime >= WIFI_RECONNECT_INTERVAL) {
        lastWifiCheckTime = currentMillis;
        
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("WiFi bağlantısı koptu, yeniden bağlanılıyor...");
            WiFi.disconnect();
            connectToWiFi(WIFI_SSID, WIFI_PASSWORD);
        }
    }
    
    // CNC durumunu kontrol et
    if (currentMillis - lastCheckTime >= CHECK_INTERVAL) {
        lastCheckTime = currentMillis;
        
        // Memory durumunu logla
        if (currentMillis % 30000 == 0) { // Her 30 saniyede bir
            Serial.printf("Free memory: %u bytes\n", ESP.getFreeHeap());
        }
        
        checkCncState();
    }
    
    // CNC Link sistemini kontrol et (bekleyen kayıtlar, sağlık kontrolü)
    if (currentMillis - lastCncLinkCheckTime >= 10000) { // Her 10 saniyede bir
        lastCncLinkCheckTime = currentMillis;
        
        // Bekleyen kayıtları kontrol et ve göndermeye çalış
        bekleyenKayitlariKontrolEt();

        // Parça işleme aktif değilken aktif iş emrini tazele
        periodicIsEmriKontrol();
        
        // Her 5 dakikada bir sağlık kontrolü yap
        if ((currentMillis / 300000) != (lastCncLinkCheckTime / 300000)) {
            if (cncLinkSaglikKontrol()) {
                Serial.println("✓ CNC Link sistemi sağlıklı");
            } else {
                Serial.println("⚠ CNC Link sistemi sağlık kontrolü başarısız");
            }
        }
        
    }
}