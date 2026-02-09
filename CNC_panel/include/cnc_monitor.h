#ifndef CNC_MONITOR_H
#define CNC_MONITOR_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <time.h>
#include <ESP32Ping.h>
#include "config.h"

// Forward declarations for CNC Link functions
void parcaIslemeBaslat();
void parcaIslemeBitir();

// Fonksiyon prototipleri
void setupCncMonitor();
int readCncState();
String getCurrentISOTime();
// Epoch saniye (Unix time) değerini ISO 8601 (UTC, Z) string'ine çevirir
String getISOFromEpoch(unsigned long epoch_seconds);
bool pingServer();
bool sendCncStatus(int status);
void testServerConnection();
void checkCncState();

// CNC durumu için değişkenler (extern ile bildiriliyor)
extern int lastCncState;
extern unsigned long lastDebounceTime;

// Test modu kaldırıldı: ilgili değişkenler ve deklarasyonlar temizlendi

#endif // CNC_MONITOR_H