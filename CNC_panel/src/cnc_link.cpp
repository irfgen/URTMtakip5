#include "cnc_link.h"
#include "cnc_monitor.h"

// Global değişkenler
int aktif_is_emri_id = -1;
bool parca_isleme_aktif = false;
ParcaIslemeKaydi suanki_kayit;
ParcaIslemeKaydi bekleyen_kayitlar[PARCA_KAYIT_BUFFER_SIZE];
int bekleyen_kayit_sayisi = 0;
unsigned long son_is_emri_kontrol = 0;

/**
 * CNC Link sistemini başlatır
 */
void setupCncLink() {
    Serial.println("=== CNC Link Sistemi Başlatılıyor ===");
    
    // Değişkenleri sıfırla"
    aktif_is_emri_id = -1;
    parca_isleme_aktif = false;
    bekleyen_kayit_sayisi = 0;
    son_is_emri_kontrol = 0;
    
    // Başlangıçta iş emri al
    aktif_is_emri_id = isEmriIdAl();
    
    if (aktif_is_emri_id > 0) {
        Serial.printf("Aktif iş emri bulundu: %d\n", aktif_is_emri_id);
    } else {
        Serial.println("UYARI: Aktif iş emri bulunamadı!");
    }
    
    Serial.println("CNC Link sistemi hazır");
}

/**
 * Server'dan aktif iş emri ID'sini alır
 */
int isEmriIdAl() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi bağlantısı yok - İş emri ID alınamıyor");
        return -1;
    }
    
    HTTPClient http;
    String url = String(CNC_LINK_API_URL) + "/api/cnc_link/is-emri-id/" + String(CNC_NO);
    
    Serial.printf("İş emri ID alınıyor: %s\n", url.c_str());
    
    http.setConnectTimeout(5000);
    http.setTimeout(PARCA_GONDERIM_TIMEOUT);
    
    if (!http.begin(url)) {
        Serial.println("HTTP bağlantısı başlatılamadı!");
        return -1;
    }
    
    int httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("İş emri yanıtı: %s\n", response.c_str());
        
        // JSON parse et
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, response);
        
        if (error) {
            Serial.printf("JSON parse hatası: %s\n", error.c_str());
            http.end();
            return -1;
        }
        
        bool success = doc["success"];
        if (success) {
            int is_emri_id = doc["is_emri_id"];
            if (is_emri_id == 0) {
                Serial.println("Aktif iş emri yok (is_emri_id=0)");
                http.end();
                return 0;
            }
            Serial.printf("✓ Aktif iş emri ID: %d\n", is_emri_id);
            http.end();
            return is_emri_id;
        } else {
            Serial.printf("Server'dan hata: %s\n", doc["message"].as<String>().c_str());
        }
    } else {
        Serial.printf("HTTP GET hatası: %d\n", httpResponseCode);
    }
    
    http.end();
    return -1;
}

/**
 * Parça işlemeyi başlatır
 */
void parcaIslemeBaslat() {
    if (parca_isleme_aktif) {
        Serial.println("UYARI: Parça işleme zaten aktif!");
        return;
    }
    
    // İş emri kontrolü - 30 saniyede bir kontrol et
    unsigned long now = millis();
    if (now - son_is_emri_kontrol > IS_EMRI_KONTROL_ARALIGI) {
        int yeni_is_emri = isEmriIdAl();
        if (yeni_is_emri > 0) {
            aktif_is_emri_id = yeni_is_emri;
        }
        son_is_emri_kontrol = now;
    }
    
    if (aktif_is_emri_id <= 0) {
        Serial.println("UYARI: Aktif iş emri bulunamadı - Parça işleme başlatılamıyor");
        return;
    }
    
    // Yeni parça işleme kaydı başlat (epoch tabanlı zaman ve dakika hassasiyeti)
    time_t nowEpoch = time(nullptr);
    suanki_kayit.baslangic_epoch_saniye = (unsigned long)nowEpoch;
    suanki_kayit.bitis_epoch_saniye = 0;
    suanki_kayit.sure_dakika = 0;
    suanki_kayit.is_emri_id = aktif_is_emri_id;
    suanki_kayit.gonderildi = false;
    suanki_kayit.esp32_kayit_id = benzersizKayitIdOlustur();
    
    parca_isleme_aktif = true;
    
    Serial.printf("✓ Parça işleme başlatıldı - İş Emri: %d, Kayıt ID: %s\n", 
                 aktif_is_emri_id, suanki_kayit.esp32_kayit_id.c_str());
}

/**
 * Parça işleme aktif değilken, belirli aralıklarla aktif iş emrini tazeler.
 */
void periodicIsEmriKontrol() {
    if (parca_isleme_aktif) {
        return;
    }
    unsigned long now = millis();
    if (now - son_is_emri_kontrol > IS_EMRI_KONTROL_ARALIGI) {
        int yeni_is_emri = isEmriIdAl();
        if (yeni_is_emri > 0 && yeni_is_emri != aktif_is_emri_id) {
            aktif_is_emri_id = yeni_is_emri;
            Serial.printf("Aktif iş emri güncellendi: %d\n", aktif_is_emri_id);
        }
        son_is_emri_kontrol = now;
    }
}
/**
 * Parça işlemeyi bitirir ve sunucuya gönderir
 */
void parcaIslemeBitir() {
    if (!parca_isleme_aktif) {
        Serial.println("UYARI: Parça işleme aktif değil!");
        return;
    }
    
    // Kayıt tamamla (epoch tabanlı)
    time_t nowEpoch = time(nullptr);
    suanki_kayit.bitis_epoch_saniye = (unsigned long)nowEpoch;
    unsigned long sure_saniye = 0;
    if (suanki_kayit.bitis_epoch_saniye >= suanki_kayit.baslangic_epoch_saniye) {
        sure_saniye = suanki_kayit.bitis_epoch_saniye - suanki_kayit.baslangic_epoch_saniye;
    }
    suanki_kayit.sure_dakika = (int)(sure_saniye / 60); // saniyeyi dakikaya çevir
    
    // En az 1 dakika olarak kaydet (çok kısa süreler için)
    if (suanki_kayit.sure_dakika < 1) {
        suanki_kayit.sure_dakika = 1;
    }
    
    parca_isleme_aktif = false;
    
    Serial.printf("✓ Parça işleme tamamlandı - Süre: %d dakika\n", suanki_kayit.sure_dakika);
    
    // Sunucuya göndermeyi dene
    if (parcaBilgisiGonder(suanki_kayit)) {
        Serial.println("✓ Parça bilgisi başarıyla gönderildi");
    } else {
        Serial.println("⚠ Parça bilgisi gönderilemedi - Offline kayıt olarak saklanıyor");
        
        // Buffer'a ekle
        if (bekleyen_kayit_sayisi < PARCA_KAYIT_BUFFER_SIZE) {
            bekleyen_kayitlar[bekleyen_kayit_sayisi] = suanki_kayit;
            bekleyen_kayit_sayisi++;
            Serial.printf("Offline kayıt eklendi (Toplam: %d/%d)\n", 
                         bekleyen_kayit_sayisi, PARCA_KAYIT_BUFFER_SIZE);
        } else {
            Serial.println("❌ Offline kayıt buffer'ı dolu!");
        }
    }
}

/**
 * Parça bilgilerini sunucuya gönderir
 */
bool parcaBilgisiGonder(ParcaIslemeKaydi& kayit) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi bağlantısı yok - Parça bilgisi gönderilemedi");
        return false;
    }
    
    HTTPClient http;
    String url = String(CNC_LINK_API_URL) + "/api/cnc_link/parca-tamamlandi";
    
    http.setConnectTimeout(5000);
    http.setTimeout(PARCA_GONDERIM_TIMEOUT);
    
    if (!http.begin(url)) {
        Serial.println("HTTP bağlantısı başlatılamadı!");
        return false;
    }
    
    http.addHeader("Content-Type", "application/json");
    
    // Zaman damgalarını ISO formatına çevir (epoch saniye → ISO)
    String baslangic_iso = getISOFromEpoch(kayit.baslangic_epoch_saniye);
    String bitis_iso = getISOFromEpoch(kayit.bitis_epoch_saniye);
    String timestamp_iso = getCurrentISOTime();
    
    // JSON veri oluştur
    StaticJsonDocument<512> doc;
    doc["tezgah_id"] = CNC_NO;
    doc["is_emri_id"] = kayit.is_emri_id;
    doc["baslangic_zamani"] = baslangic_iso;
    doc["bitis_zamani"] = bitis_iso;
    doc["isleme_suresi_dakika"] = kayit.sure_dakika;
    doc["timestamp"] = timestamp_iso;
    doc["esp32_kayit_id"] = kayit.esp32_kayit_id;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.printf("Gönderilen veri: %s\n", jsonString.c_str());
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("Server yanıtı (%d): %s\n", httpResponseCode, response.c_str());
        
        if (httpResponseCode == 200 || httpResponseCode == 201) {
            kayit.gonderildi = true;
            http.end();
            return true;
        }
    } else {
        Serial.printf("HTTP POST hatası: %d\n", httpResponseCode);
    }
    
    http.end();
    return false;
}

/**
 * Bekleyen kayıtları kontrol eder ve göndermeye çalışır
 */
void bekleyenKayitlariKontrolEt() {
    if (bekleyen_kayit_sayisi == 0) {
        return;
    }
    
    if (WiFi.status() != WL_CONNECTED) {
        return;
    }
    
    Serial.printf("Bekleyen kayıtlar kontrol ediliyor (%d adet)...\n", bekleyen_kayit_sayisi);
    
    for (int i = 0; i < bekleyen_kayit_sayisi; i++) {
        if (!bekleyen_kayitlar[i].gonderildi) {
            if (parcaBilgisiGonder(bekleyen_kayitlar[i])) {
                Serial.printf("✓ Bekleyen kayıt gönderildi: %s\n", 
                             bekleyen_kayitlar[i].esp32_kayit_id.c_str());
            } else {
                Serial.printf("⚠ Bekleyen kayıt gönderilemedi: %s\n", 
                             bekleyen_kayitlar[i].esp32_kayit_id.c_str());
                break; // Bir kayıt gönderilemezse diğerlerini deneme
            }
        }
    }
    
    // Gönderilen kayıtları temizle
    int yeni_sayac = 0;
    for (int i = 0; i < bekleyen_kayit_sayisi; i++) {
        if (!bekleyen_kayitlar[i].gonderildi) {
            bekleyen_kayitlar[yeni_sayac] = bekleyen_kayitlar[i];
            yeni_sayac++;
        }
    }
    bekleyen_kayit_sayisi = yeni_sayac;
    
    if (bekleyen_kayit_sayisi == 0) {
        Serial.println("✓ Tüm bekleyen kayıtlar gönderildi");
    }
}

/**
 * Benzersiz ESP32 kayıt ID'si oluşturur
 */
String benzersizKayitIdOlustur() {
    unsigned long timestamp = millis();
    int random_num = random(1000, 9999);
    return String("ESP32_") + String(CNC_NO) + "_" + String(timestamp) + "_" + String(random_num);
}

/**
 * CNC Link sistem sağlığını kontrol eder
 */
bool cncLinkSaglikKontrol() {
    if (WiFi.status() != WL_CONNECTED) {
        return false;
    }
    
    HTTPClient http;
    String url = String(CNC_LINK_API_URL) + "/api/cnc_link/health";
    
    http.setConnectTimeout(3000);
    http.setTimeout(5000);
    
    if (!http.begin(url)) {
        return false;
    }
    
    int httpResponseCode = http.GET();
    bool saglikli = (httpResponseCode == 200);
    
    // Gürültüyü azalt: sadece başarısızlıkta kısa log
    if (!saglikli) {
        Serial.printf("CNC Link sağlık kontrolü başarısız (HTTP %d)\n", httpResponseCode);
    }
    
    http.end();
    return saglikli;
}

// getCurrentISOTime fonksiyonları cnc_monitor.h'dan kullanılacak