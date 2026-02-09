#include "cnc_monitor.h"

// CNC durumu için değişkenler
int lastCncState = -1;
unsigned long lastDebounceTime = 0;

// Test modu kaldırıldı

/**
 * CNC izleme sistemini başlatır
 */
void setupCncMonitor() {
    // CNC durum pini girişi olarak ayarla
    pinMode(CNC_STATUS_PIN, INPUT);
    Serial.println("CNC izleme sistemi başlatıldı - Normal mod");
    
    Serial.println("CNC izleme sistemi başlatıldı");
    
    // NTP sunucusuna bağlanarak zamanı senkronize et
    configTime(3 * 3600, 0, "tr.pool.ntp.org", "pool.ntp.org");
    
    Serial.println("NTP zaman senkronizasyonu başlatıldı");
    
    // NTP zamanını kontrol et
    time_t now;
    time(&now);
    if (now < 1600000000) {
        Serial.println("UYARI: NTP zaman senkronizasyonu başarısız olabilir!");
    } else {
        struct tm timeinfo;
        getLocalTime(&timeinfo);
        char timeString[25];
        strftime(timeString, sizeof(timeString), "%Y-%m-%d %H:%M:%S", &timeinfo);
        Serial.print("NTP zamanı alındı: ");
        Serial.println(timeString);
    }
    
    // Sunucu erişilebilirliğini HTTP ile kontrol et (ICMP ping gürültüsünü azalt)
    Serial.println("Sunucu bağlantısı test ediliyor (HTTP)...");
    testServerConnection();
}

/**
 * CNC'nin mevcut durumunu okur
 * @return CNC durum kodu (0=durdu, 1=çalışıyor)
 */
int readCncState() {
    int pinState = digitalRead(CNC_STATUS_PIN);
    
    if (pinState == HIGH) {
        return CNC_STATUS_RUNNING;
    } else {
        return CNC_STATUS_STOPPED;
    }
}

/**
 * Şu anki zamanı ISO 8601 (UTC, Z) formatında döndürür
 */
String getCurrentISOTime() {
    time_t nowEpoch = time(nullptr);
    if (nowEpoch <= 0) {
        Serial.println("Zaman bilgisi alınamadı!");
        return "2025-04-20T00:00:00Z";
    }
    struct tm* g = gmtime(&nowEpoch);
    if (!g) {
        return "2025-04-20T00:00:00Z";
    }
    char timeString[25];
    strftime(timeString, sizeof(timeString), "%Y-%m-%dT%H:%M:%SZ", g);
    return String(timeString);
}

// Epoch saniye (Unix time) → ISO 8601 (UTC)
String getISOFromEpoch(unsigned long epoch_seconds) {
    if (epoch_seconds == 0) {
        return getCurrentISOTime();
    }
    time_t t = (time_t)epoch_seconds;
    struct tm* g = gmtime(&t);
    if (!g) {
        return getCurrentISOTime();
    }
    char timeString[25];
    strftime(timeString, sizeof(timeString), "%Y-%m-%dT%H:%M:%SZ", g);
    return String(timeString);
}

/**
 * Sunucunun ping ile erişilebilir olup olmadığını kontrol eder
 */
bool pingServer() {
    String serverUrl = SERVER_ADDRESS;
    int startPos = serverUrl.indexOf("//") + 2;
    int endPos = serverUrl.indexOf(":", startPos);
    if (endPos == -1) endPos = serverUrl.indexOf("/", startPos);
    if (endPos == -1) endPos = serverUrl.length();
    
    String serverIP = serverUrl.substring(startPos, endPos);
    Serial.print("Sunucu ping testi: ");
    Serial.println(serverIP);
    
    IPAddress ipAddress;
    if (!ipAddress.fromString(serverIP)) {
        Serial.println("Geçersiz IP adresi!");
        return false;
    }
    
    bool success = Ping.ping(ipAddress, 3);
    Serial.print("Ping sonucu: ");
    Serial.println(success ? "Başarılı" : "Başarısız");
    return success;
}

/**
 * CNC durumunu ana sisteme gönderir
 */
bool sendCncStatus(int status) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi bağlantısı yok, durum gönderilemedi");
        return false;
    }
    
    #if ENABLE_PING_TESTS
    if (!pingServer()) {
        Serial.println("Sunucuya ping atılamadı! Ağ bağlantısını kontrol edin.");
    }
    #endif
    
    HTTPClient http;
    String url = String(SERVER_ADDRESS) + "/api/tezgah-durum/tezgah-durum";
    
    http.setConnectTimeout(5000);
    http.setTimeout(8000);
    http.setReuse(false);
    
    Serial.print("Sunucuya bağlanılıyor: ");
    Serial.println(url);
    
    if(!http.begin(url)) {
        Serial.println("HTTP bağlantısı başlatılamadı!");
        Serial.println("Sunucu adresini kontrol edin: " + url);
        return false;
    }
    
    http.addHeader("Content-Type", "application/json");
    
    String timestamp = getCurrentISOTime();
    
    StaticJsonDocument<256> doc;
    doc["tezgah_id"] = CNC_NO;
    doc["durum"] = (status == CNC_STATUS_RUNNING);
    doc["timestamp"] = timestamp;
    
    String statusData;
    serializeJson(doc, statusData);
    
    Serial.print("Gönderilen veri: ");
    Serial.println(statusData);
    
    int httpResponseCode = -1;
    for(int i=0; i<3; i++) {
        httpResponseCode = http.POST(statusData);
        if(httpResponseCode > 0) {
            break;
        }
        Serial.printf("Deneme %d başarısız, yeniden deneniyor...\n", i+1);
        delay((i+1) * 2000);
    }
    
    if (httpResponseCode > 0) {
        Serial.print("HTTP Yanıt kodu: ");
        Serial.println(httpResponseCode);
        
        if (httpResponseCode == 200 || httpResponseCode == 201) {
            Serial.println("✓ Durum başarıyla kaydedildi (HTTP " + String(httpResponseCode) + ")");
            String response = http.getString();
            if (response.length() > 100) {
                Serial.println("Sunucu yanıtı: " + response.substring(0, 100) + "...");
            } else {
                Serial.println("Sunucu yanıtı: " + response);
            }
        } else {
            Serial.println("⚠ Beklenmeyen HTTP yanıt kodu: " + String(httpResponseCode));
        }
        
        http.end();
        return true;
    } else {
        Serial.print("Hata kodu: ");
        Serial.println(httpResponseCode);
        Serial.print("Hata açıklaması: ");
        Serial.println(http.errorToString(httpResponseCode));
        
        Serial.print("WiFi durum kontrolü: ");
        if(WiFi.status() == WL_CONNECTED) {
            Serial.println("WiFi bağlı (IP: " + WiFi.localIP().toString() + ")");
        } else {
            Serial.println("WiFi bağlantısı yok!");
        }
        
        http.end();
        return false;
    }
}

/**
 * Sunucu bağlantısını test eder ve sonucu seri porta yazdırır
 */
void testServerConnection() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi bağlantısı yok!");
        return;
    }
    
    // Gateway erişimi: ICMP yerine TCP denemesi ile kontrol
    bool gatewayOk = false;
    {
        IPAddress gatewayIP = WiFi.gatewayIP();
        if ((uint32_t)gatewayIP != 0) {
            WiFiClient client;
            client.setTimeout(1500);
            gatewayOk = client.connect(gatewayIP, 80);
            if (gatewayOk) client.stop();
        }
    }
    
    // İnternet erişimi: 204 dönen endpoint ile HTTP testi
    bool internetOk = false;
    {
        HTTPClient http;
        http.setConnectTimeout(2000);
        http.setTimeout(2500);
        if (http.begin("http://clients3.google.com/generate_204")) {
            int code = http.GET();
            internetOk = (code == 204 || (code >= 200 && code < 400));
            http.end();
        }
    }
    
    String serverUrl = SERVER_ADDRESS;
    int startPos = serverUrl.indexOf("//") + 2;
    int endPos = serverUrl.indexOf(":", startPos);
    if (endPos == -1) endPos = serverUrl.indexOf("/", startPos);
    if (endPos == -1) endPos = serverUrl.length();
    
    String serverIP = serverUrl.substring(startPos, endPos);
    // ICMP ping yerine HTTP testi sonucu kullanılacak
    
    HTTPClient http;
    String url = String(SERVER_ADDRESS);
    bool serverHttpOk = false;
    if (http.begin(url)) {
        http.setConnectTimeout(2000);
        http.setTimeout(2500);
        int httpCode = http.GET();
        serverHttpOk = (httpCode > 0 && httpCode < 500);
        http.end();
    }
    
    Serial.println("\nAğ Bağlantı Özeti:");
    Serial.println("------------------");
    Serial.print("WiFi: ");
    Serial.println(WiFi.status() == WL_CONNECTED ? "BAĞLI" : "BAĞLANTISIZ");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP().toString());
    Serial.print("Gateway erişimi: ");
    Serial.println(gatewayOk ? "VAR" : "YOK");
    Serial.print("İnternet erişimi: ");
    Serial.println(internetOk ? "VAR" : "YOK");
    Serial.print("Sunucu erişimi: ");
    Serial.println(serverHttpOk ? "VAR" : "YOK");
    Serial.println("------------------");
}

/**
 * CNC durumunu kontrol eder ve değişiklik varsa bildirir
 */
void checkCncState() {
    int currentState = readCncState();

    static int previousState = -1;
    static unsigned long lastSendTime = 0;
    unsigned long now = millis();

    // İlk çalıştırmada başlangıç durumunu baz al, gönderim yapma (çift gönderimi önle)
    if (previousState == -1) {
        previousState = currentState;
        lastSendTime = now;
        lastCncState = currentState;
        lastDebounceTime = millis();
        return;
    }

    bool durumDegisti = (currentState != previousState);
    bool zamanGeldi = (now - lastSendTime > 60000);

    if (durumDegisti || zamanGeldi) {
        sendCncStatus(currentState);
        
        if (durumDegisti) {
            if (currentState == CNC_STATUS_RUNNING && previousState != CNC_STATUS_RUNNING) {
                Serial.println("🔄 CNC çalışmaya başladı - Parça işleme başlatılıyor");
                parcaIslemeBaslat();
            } 
            else if (currentState == CNC_STATUS_STOPPED && previousState == CNC_STATUS_RUNNING) {
                Serial.println("⏹ CNC durdu - Parça işleme sonlandırılıyor");
                parcaIslemeBitir();
            }
        }
        
        previousState = currentState;
        lastSendTime = now;
    }
    lastCncState = currentState;
    lastDebounceTime = millis();
}