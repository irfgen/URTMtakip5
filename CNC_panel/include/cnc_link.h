#ifndef CNC_LINK_H
#define CNC_LINK_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <time.h>
#include "config.h"

// Parça işleme kayıt yapısı
struct ParcaIslemeKaydi {
    unsigned long baslangic_epoch_saniye; // epoch seconds
    unsigned long bitis_epoch_saniye;     // epoch seconds
    int sure_dakika;                      // dakika bazında süre
    int is_emri_id;
    bool gonderildi;
    String esp32_kayit_id;
};

// CNC Link sistemi için global değişkenler
extern int aktif_is_emri_id;
extern bool parca_isleme_aktif;
extern ParcaIslemeKaydi suanki_kayit;
extern ParcaIslemeKaydi bekleyen_kayitlar[PARCA_KAYIT_BUFFER_SIZE];
extern int bekleyen_kayit_sayisi;

/**
 * CNC Link sistemini başlatır
 */
void setupCncLink();

/**
 * Server'dan aktif iş emri ID'sini alır
 * @return İş emri ID (başarısız ise -1)
 */
int isEmriIdAl();

/**
 * Parça işlemeyi başlatır
 */
void parcaIslemeBaslat();

/**
 * Parça işlemeyi bitirir ve sunucuya gönderir
 */
void parcaIslemeBitir();

/**
 * Parça bilgilerini sunucuya gönderir
 * @param kayit Gönderilecek kayıt
 * @return Gönderim başarılı ise true
 */
bool parcaBilgisiGonder(ParcaIslemeKaydi& kayit);

/**
 * Bekleyen kayıtları kontrol eder ve göndermeye çalışır
 */
void bekleyenKayitlariKontrolEt();

/**
 * Benzersiz ESP32 kayıt ID'si oluşturur
 * @return Benzersiz ID string'i
 */
String benzersizKayitIdOlustur();

/**
 * CNC Link sistem sağlığını kontrol eder
 * @return Sistem sağlıklı ise true
 */
bool cncLinkSaglikKontrol();

/**
 * Periyodik olarak (durum uygunken) aktif iş emrini günceller
 * Koşul: parca_isleme_aktif değilse ve periyot dolmuşsa server'dan çeker
 */
void periodicIsEmriKontrol();

// Test modu kaldırıldı

#endif // CNC_LINK_H 