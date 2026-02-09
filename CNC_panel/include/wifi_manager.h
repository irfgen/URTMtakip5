#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>
#include "config.h"

// WiFi bağlantı yönetimi fonksiyonları

/**
 * WiFi bağlantısını başlatır
 * @return Bağlantı başarılı ise true, değilse false
 */
bool connectToWiFi(const char* ssid, const char* password) {
    Serial.println("WiFi bağlantısı başlatılıyor...");
    Serial.print("SSID: ");
    Serial.println(ssid);
    
    WiFi.mode(WIFI_STA);
    
    WiFi.disconnect(true); // WiFi'ı tamamen sıfırla
    delay(1000);           // Sıfırlamanın tamamlanması için bekle
    WiFi.begin(ssid, password);
    
    // DHCP ile dinamik IP: Bağlantı için 20 saniye bekle
    unsigned long startAttemptTime = millis();
    while (WiFi.status() != WL_CONNECTED && 
           millis() - startAttemptTime < 20000) {
        Serial.print(".");
        delay(500);
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("");
        Serial.println("WiFi bağlantısı başarılı!");
        Serial.print("IP adresi: ");
        Serial.println(WiFi.localIP());
        return true;
    } else {
        Serial.println("");
        Serial.println("WiFi bağlantısı başarısız!");
        return false;
    }
}

/**
 * WiFi bağlantısını kontrol eder ve gerekirse yeniden bağlanır
 * @return Bağlantı durumu (true/false)
 */
bool checkWiFiConnection() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi bağlantısı koptu. Yeniden bağlanılıyor...");
        return connectToWiFi(WIFI_SSID, WIFI_PASSWORD);
    }
    return true;
}

#endif // WIFI_MANAGER_H