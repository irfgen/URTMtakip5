# Fatura & İrsaliye Eşleştirme Sistemi - Kullanıcı Kılavuzu

## 📋 Sistem Overview

### 3-Yol Eşleştirme (Three-Way Matching) Nedir?

Fatura & İrsaliye Eşleştirme Sistemi, üretim ve satış süreçlerinde finansal kontrol ve doğrulama sağlayan bir sistemdir. Üç temel belge arasında ilişki kurarak tutarlılık kontrolü yapar:

```
İrsaliye (Mal Teslim) → Fatura (Finansal Belge) → Ödeme (Kapanış)
```

**Sistem Avantajları:**
- ✅ Maliyet kontrolü ve bütçe takibi
- ✅ Miktar tutarsızlıklarının otomatik tespiti
- ✅ Çift ödeme önleme
- ✅ Eksik faturaların takibi
- ✅ Muhasebe süreçlerinde hız ve doğruluk

**Temel Akış:**
1. **Mobil**: İrsaliye oluşturulur (malzemeler sevk edilir)
2. **Masaüstü**: Fatura oluşturulur (muhasebe kaydı)
3. **Masaüstü**: Eşleştirme yapılır (doğrulama)

---

## 📱 1. İrsaliye Oluşturma (Mobil)

### Erişim
- **Cihaz**: Tablet veya mobil cihaz
- **Menü**: `Mobil Menü` → `İrsaliyeler`
- **Konum**: Üretim alanı, depo veya sevk noktası

### İrsaliye Oluşturma Adımları

#### Adım 1: Yeni İrsaliye Butonu
```
[+ Yeni İrsaliye] butonuna tıklayın
```

**Görüntü:**
```
┌─────────────────────────────────────┐
│  İRSALİYELER                        │
├─────────────────────────────────────┤
│  [+ Yeni İrsaliye]                  │
│                                     │
│  Son İrsaliyeler:                   │
│  • IRS-2024-001 - 15.01.2024        │
│  • IRS-2024-002 - 16.01.2024        │
└─────────────────────────────────────┘
```

#### Adım 2: Temel Bilgileri Girme
- **Cari Seçimi**: Müşteri veya tedarikçi seçin
- **Tarih**: Otomatik olarak bugün (değiştirilebilir)
- **Tür**: Giden veya Gelen irsaliye
- **Belge No**: Otomatik veya manuel

**Görüntü:**
```
┌─────────────────────────────────────┐
│  YENİ İRSALİYE                      │
├─────────────────────────────────────┤
│  Cari: [Müşteri Seçin ▼]           │
│  Tarih: [24.01.2025]               │
│  Tür:  ⦿ Giden  ○ Gelen            │
│  Belge No: [IRS-2024-XXX]          │
│                                     │
│  [İleri]                            │
└─────────────────────────────────────┘
```

#### Adım 3: Kalem Ekleme
- **Parça/Bölüm**: Üretim planından veya parça reberinden seçim
- **Miktar**: Sevkedilen miktar
- **Birim**: Adet, kg, metre vb.
- **Depo**: Çıkış deposu

**Görüntü:**
```
┌─────────────────────────────────────┐
│  KALEMLER                           │
├─────────────────────────────────────┤
│  [+ Kalem Ekle]                     │
│                                     │
│  Parça: [Parça Kodu veya Adı]      │
│  Miktar: [100]                      │
│  Birim: [Adet ▼]                    │
│  Depo: [Ana Depo ▼]                │
│                                     │
│  Eklenen Kalemler:                  │
│  • X-1001 - Gövde - 50 Adet        │
│  • X-1002 - Kapak - 50 Adet        │
│                                     │
│  [Kaydet]                           │
└─────────────────────────────────────┘
```

#### Adım 4: Onaylama
- İrsaliye numarası otomatik oluşturulur
- Durumu: `Açık` (fatura bekliyor)
- Otomatik olarak eşleştirme havuzuna eklenir

**Önemli Notlar:**
- ✅ İrsaliye oluştururken miktarları kontrol edin
- ✅ Doğru cari seçimi çok önemlidir (eşleştirme için)
- ✅ Tarih doğruluğu muhasebe için önemlidir
- ⚠️ İrsaliye silindiğinde eşleşmeler de kaldırılır

---

## 🖥️ 2. Fatura Oluşturma (Masaüstü)

### Erişim
- **Cihaz**: Masaüstü bilgisayar
- **Menü**: `Faturalar` → `Fatura Listesi`
- **Konum**: Muhasebe ofisi veya yönetici masası

### Fatura Oluşturma Adımları

#### Adım 1: Yeni Fatura Butonu
```
Faturalar sayfasında [+ Yeni Fatura] butonuna tıklayın
```

**Görüntü:**
```
┌──────────────────────────────────────────────────────┐
│  FATURALAR                                           │
├──────────────────────────────────────────────────────┤
│  [+ Yeni Fatura]  [Filtrele]  [Dışa Aktar]           │
│                                                      │
│  ┌──────┬──────────────┬──────────┬─────────┬────┐  │
│  │ Durum│ Fatura No    │ Cari     │ Tutar   │ İşle│  │
│  ├──────┼──────────────┼──────────┼─────────┼────┤  │
│  │ ⏳   │ FAT-24-001   │ A Ltd.   │ 45.000  │ ... │  │
│  │ ✅   │ FAT-24-002   │ B A.Ş.   │ 12.500  │ ... │  │
│  └──────┴──────────────┴──────────┴─────────┴────┘  │
└──────────────────────────────────────────────────────┘
```

#### Adım 2: Cari ve Temel Bilgiler
- **Cari**: Müşteri veya tedarikçi
- **Tarih**: Fatura kesim tarihi
- **Vade**: Ödeme tarihi
- **Fatura No**: Otomatik veya manuel

**Görüntü:**
```
┌──────────────────────────────────────────────────────┐
│  YENİ FATURA                                          │
├──────────────────────────────────────────────────────┤
│  Cari: [A Ltd. Şti.         ▼]                       │
│  Tarih: [24.01.2025]                                  │
│  Vade:  [23.02.2025]                                  │
│  Fatura No: [FAT-2025-XXX]                           │
│                                                      │
│  Cari Bilgileri:                                     │
│  • Adres: Sanayi Mah. ...                            │
│  • Vergi No: 1234567890                              │
│  • Vergi Dairesi: ...                                │
│                                                      │
│  [İleri]                                             │
└──────────────────────────────────────────────────────┘
```

#### Adım 3: Kalem Ekleme
Fatura kalemlerini eklerken sistem otomatik olarak eşleşme önerileri gösterir:

**Görüntü:**
```
┌──────────────────────────────────────────────────────┐
│  FATURA KALEMLERİ                                    │
├──────────────────────────────────────────────────────┤
│  [+ Kalem Ekle]                                      │
│                                                      │
│  Parça/Bölüm: [X-1001 - Gövde              ▼]       │
│  Miktar:      [50]                                    │
│  Birim:       [Adet             ▼]                   │
│  Birim Fiyat: [450.00]                                │
│  KDV:         [%20              ▼]                   │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 💡 EŞLEŞTİRME ÖNERİLERİ:                        │ │
│  │                                                 │ │
│  │ ⦿ IRS-2024-001 (X-1001)                        │ │
│  │    Açık İrsaliye - 50 Adet                      │ │
│  │    %100 Miktar Eşleşmesi ✅                    │ │
│  │    [Eşleştir]                                  │ │
│  │                                                 │ │
│  │ ○ IRS-2024-005 (X-1001)                        │ │
│  │    Açık İrsaliye - 45 Adet                      │ │
│  │    %90 Miktar Eşleşmesi ⚠️                     │ │
│  │    [Eşleştir]                                  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  Kayıtlı Kalemler:                                   │
│  ┌────┬───────────┬───────┬────────┬────────┬──────┐│
│  │ #  │ Parça     │ Miktar│ B.Fiyat│ KDV    │ Tutar││
│  ├────┼───────────┼───────┼────────┼────────┼──────┤│
│  │ 1  │ X-1001    │ 50    │ 450.00 │ %20    │ 27.000││
│  │    │           │       │        │        │ ✅   ││
│  │ 2  │ X-1002    │ 50    │ 120.00 │ %20    │ 7.200 ││
│  │    │           │       │        │        │ ⏳   ││
│  └────┴───────────┴───────┴────────┴────────┴──────┘│
│                                                      │
│  Ara Toplam: 34.200 ₺                               │
│  KDV Toplam: 6.840 ₺                                │
│  Genel Toplam: 41.040 ₺                             │
│                                                      │
│  [Kaydet]  [Kaydet ve Eşleştir]                     │
└──────────────────────────────────────────────────────┘
```

**Göstergeler:**
- ✅ = Tam eşleşmiş
- ⏳ = Bekliyor (eşleşmemiş)
- ⚠️ = Kısmi eşleşmiş
- ❌ = Eşleşme hatası

---

## 🔗 3. Eşleştirme İşlemi (Masaüstü)

### Erişim
- **Menü**: `Eşleştirmeler` → `Fatura-İrsaliye Eşleştirmeleri`

### Eşleştirme Yöntemleri

### 3.1. Otomatik Eşleştirme (Öneri Tabanlı)

**En hızlı ve önerilen yöntem**

**Adım 1:** Eşleştirme ekranını açın
```
Eşleştirmeler → Fatura-İrsaliye Eşleştirmeleri
```

**Adım 2:** Önerileri inceleyin
```
┌───────────────────────────────────────────────────────────────────┐
│  EŞLEŞTİRME ÖNERİLERİ                                             │
├───────────────────────────────────────────────────────────────────┤
│  🔍 Filtreler: [Tümü ▼] [Bugün ▼] [Uygula]                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 💡 %100 EŞLEŞME - FAT-2025-001                              │ │
│  │                                                              │ │
│  │ Fatura: FAT-2025-001 - A Ltd. - 45.000 ₺                    │ │
│  │ İrsaliye: IRS-2025-003 - 10.01.2025                         │ │
│  │                                                              │ │
│  │ Kalemler:                                                    │ │
│  │ ✅ X-1001 (Gövde): 50 + 50 = 100                           │ │
│  │ ✅ X-1002 (Kapak): 50 + 50 = 100                           │ │
│  │                                                              │ │
│  │ [Eşleştir]  [İncele]  [Reddet]                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ⚠️ KISMİ EŞLEŞME - FAT-2025-002                             │ │
│  │                                                              │ │
│  │ Fatura: FAT-2025-002 - B A.Ş. - 28.500 ₺                   │ │
│  │ İrsaliye: IRS-2025-005 - 12.01.2025                         │ │
│  │                                                              │ │
│  │ Kalemler:                                                    │ │
│  │ ✅ X-2001 (Kol): 30 + 30 = 60                              │ │
│  │ ⚠️  X-2003 (Teker): Fatura: 20, İrs: 18                     │ │
│  │    Fark: 2 Adet (faturada fazla)                           │ │
│  │                                                              │ │
│  │ [Eşleştir]  [Düzelt]  [İncele]                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [Tümünü Eşleştir]  [Daha Fazla Göster]                          │
└───────────────────────────────────────────────────────────────────┘
```

**Adım 3:** Onaylama
```
[Toplu Eşleştir] butonu → Tüm %100 önerileri otomatik eşleştir
```

### 3.2. Manuel Eşleştirme

**Karmaşık durumlar için özel eşleştirme**

**Adım 1:** Fatura seçin
```
Eşleştirmeler → [Fatura Seç]
```

**Adım 2:** Uygun irsaliyeleri görün
```
┌───────────────────────────────────────────────────────────────────┐
│  FATURA: FAT-2025-003 (C Ltd. - 52.000 ₺)                       │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  UYUN İRSALİYELER:                                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ⦿ IRS-2025-007                                             │ │
│  │    Tarih: 15.01.2025 | Durum: Açık                         │ │
│  │    Kalemler:                                                │ │
│  │    • X-3001: 30 Adet                                        │ │
│  │    • X-3002: 20 Adet                                        │ │
│  │    [+ Seç]                                                 │ │
│  │                                                              │ │
│  │ ⦿ IRS-2025-010                                             │ │
│  │    Tarih: 18.01.2025 | Durum: Açık                         │ │
│  │    Kalemler:                                                │ │
│  │    • X-4001: 10 Adet                                        │ │
│  │    [+ Seç]                                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  SEÇİLEN KALEMLER:                                               │
│  ┌────┬──────────┬─────────────┬──────────────┐                 │
│  │ #  │ Parça    │ Fatura Mkt. │ İrsaliye Mkt.│                 │
│  ├────┼──────────┼─────────────┼──────────────┤                 │
│  │ 1  │ X-3001   │ 30          │ 30 ✅        │                 │
│  │ 2  │ X-3002   │ 20          │ 20 ✅        │                 │
│  │ 3  │ X-4001   │ 10          │ 5  ⚠️        │                 │
│  └────┴──────────┴─────────────┴──────────────┘                 │
│                                                                   │
│  [Eşleştir]  [İptal]                                             │
└───────────────────────────────────────────────────────────────────┘
```

**Adım 3:** Eşleştir butonuna tıklayın

### 3.3. Miktar Farkı Yönetimi

**Durum 1: Faturada Fazla Var**
```
Örnek: Fatura: 100 Adet, İrsaliye: 95 Adet
Çözüm:
  ⦿ Faturayı düzelt (95'e düşür)
  ⦿ İkinci irsaliye bekle (5 Adet)
  ⦿ Farkı kabul et (izin belgesi ile)
```

**Durum 2: İrsaliyede Fazla Var**
```
Örnek: İrsaliye: 100 Adet, Fatura: 95 Adet
Çözüm:
  ⦿ Eksik fatura oluştur (5 Adet için)
  ⦿ Farkı kabul et (izin belgesi ile)
  ⦿ İrsaliyede düzeltme yap
```

**Görüntü - Fark Yönetimi:**
```
┌───────────────────────────────────────────────────────────────────┐
│  ⚠️ MİKTAR FARKI TESPİT EDİLDİ                                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Parça: X-3001 (Kol Başı)                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Fatura Miktarı:        30 Adet                             │ │
│  │  İrsaliye Miktarı:      25 Adet                             │ │
│  │  Fark:                 5 Adet (Faturada fazla)             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ÇÖZÜM SEÇENEKLERİ:                                              │
│  ⦿ 1. Fatura miktarını 25 Adet'e düşür                          │
│  ⦿ 2. İkinci irsaliye için bekle (5 Adet)                       │
│  ⦿ 3. Farkı kabul et (izin belgesi yükle)                       │
│                                                                   │
│  [Seçimi Uygula]  [İptal]                                        │
└───────────────────────────────────────────────────────────────────┘
```

### 3.4. Toplu Eşleştirme

**Birden fazla faturayı hızlıca eşleştirme**

**Adım 1:** Faturaları seçin
```
┌───────────────────────────────────────────────────────────────────┐
│  BEKLEYEN FATURALAR                                              │
├───────────────────────────────────────────────────────────────────┤
│  ☐ FAT-2025-001 | A Ltd.   | 3 İrsaliye Önerisi                │
│  ☑ FAT-2025-002 | B A.Ş.   | 2 İrsaliye Önerisi                │
│  ☑ FAT-2025-003 | C Ltd.   | 1 İrsaliye Önerisi                │
│  ☐ FAT-2025-004 | D Tic.   | 0 İrsaliye Önerisi                │
│                                                                   │
│  [Seçilenleri Eşleştir]  [Hepsini Eşleştir]                     │
└───────────────────────────────────────────────────────────────────┘
```

**Adım 2:** İşlemi başlatın
```
[Seçilenleri Eşleştir] → İlerleme çubuğu → Tamamlandı
```

**Görüntü - İşlem Sonucu:**
```
┌───────────────────────────────────────────────────────────────────┐
│  TOPLU EŞLEŞTİRME SONUCU                                         │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ✅ Başarılı: 3 Fatura                                           │
│  ⚠️  Kısmi Başarılı: 1 Fatura (fark var)                        │
│  ❌ Başarısız: 0 Fatura                                          │
│                                                                   │
│  DETAYLAR:                                                       │
│  ✅ FAT-2025-001 → IRS-2025-003, IRS-2025-004 (tam eşleşme)      │
│  ✅ FAT-2025-002 → IRS-2025-005 (tam eşleşme)                    │
│  ✅ FAT-2025-003 → IRS-2025-007 (tam eşleşme)                    │
│  ⚠️  FAT-2025-004 → IRS-2025-009 (2 Adet fark)                 │
│                                                                   │
│  [Tamam]  [Detaylı Rapor]                                        │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔒 4. Lock Kullanımı

### Lock Nedir?

Lock (Kilit) sistemi, eşleştirilmiş belgelerin yanlışlıkla değiştirilmesini önler.

**Lock Zamanları:**
- ✅ Eşleştirme yapıldığında otomatik lock
- ✅ Kullanıcı manuel lock atabilir
- ⚠️ Lock belgeler sadece yönetici açabilir

### Lock İşlemleri

#### Lock Atama
```
Eşleştirme kaydı → [🔒 Lock] butonu
```

**Görüntü:**
```
┌───────────────────────────────────────────────────────────────────┐
│  EŞLEŞTİRME: #EŞ-2025-001                                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Fatura: FAT-2025-001 (A Ltd.)                                  │
│  İrsaliye: IRS-2025-003                                          │
│  Durum: ✅ Eşleşmiş                                             │
│                                                                   │
│  🔒 KİLİTLİ: Evet (24.01.2025)                                  │
│  Kilidi Açan: Ahmet Yılmaz                                       │
│  Kilit Sebebi: Muhasebe onayı                                  │
│                                                                   │
│  [🔓 Kilidi Aç]  [Düzenle]  [Sil]                                │
└───────────────────────────────────────────────────────────────────┘
```

#### Lock Açma
**Sadece yetkili kullanıcılar açabilir**

```
1. Eşleştirme kaydını açın
2. [🔓 Kilidi Aç] butonuna tıklayın
3. Sebebini girin
4. Onaylayın
```

**Görüntü - Lock Açma:**
```
┌───────────────────────────────────────────────────────────────────┐
│  KİLİT AÇMA ONAYI                                               │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ⚠️ Bu işlemi sadece yapabilirsiniz:                             │
│  • Sistem Yöneticisi                                            │
│  • Muhasebe Müdürü                                              │
│  • Finans Direktörü                                              │
│                                                                   │
│  Kilit Açma Sebebi:                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Fatura düzeltmesi yapılacak (miktar farkı)                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [İptal]  [Onayla ve Kilidi Aç]                                  │
└───────────────────────────────────────────────────────────────────┘
```

**Lock Kullanım Senaryoları:**
- ✅ Muhasebe onayı tamamlandı
- ✅ Ödeme yapıldı
- ✅ Dönem kapanışı (ay sonları)
- ⚠️ Denetim öncesi belge koruması

---

## ❓ 5. Sorun Giderme (Troubleshooting)

### Sorun 1: Eşleştirme Önerisi Görmüyorum

**Sebep:** Uygun açık irsaliye yok

**Çözüm:**
```
1. İrsaliyeler sayfasını açın
2. Fatura ile aynı cariye sahip irsaliyeleri kontrol edin
3. İrsaliye durumunun "Açık" olduğunu doğrulayın
4. Tarih aralığını kontrol edin
```

**Kontrol Listesi:**
```
☐ Cari kodları eşleşiyor mu?
☐ Tarih aralığı uygun mu?
☐ İrsaliye durumu "Açık" mı?
☐ Parça kodları aynı mı?
☐ Daha önce eşleşmiş mi?
```

---

### Sorun 2: Miktar Farkı Kabul Etmiyor

**Sebep:** Sistem toleransı aşımı

**Varsayılan Toleranslar:**
- Adet bazlı: ±1 Adet
- Ağırlık bazlı: ±%2
- Para birimi: ±1 ₺

**Çözüm:**
```
1. Eşleştirme ekranında "Manuel Eşleştir" seçeneğini kullanın
2. Farkı kabul et butonuna tıklayın
3. İzin belgesi veya açıklama girin
4. Yönetici onayı alın (gerektiğinde)
```

**Görüntü - Fark Kabul:**
```
┌───────────────────────────────────────────────────────────────────┐
│  MİKTAR FARKI KABULİ                                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Fark: 15 Adet (toleransın üzerinde: ±1)                        │
│                                                                   │
│  Gerekli Bilgiler:                                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Açıklama:                                                 │ │
│  │ ┌───────────────────────────────────────────────────────┐  │ │
│  │ │ Fazla malzeme iade edildi, irsaliye düzeltmesi     │  │ │
│  │ │ yapılacak                                          │  │ │
│  │ └───────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │ İzin Belgesi: [Dosya Seç veya Sürükle]                    │ │
│  │                                                             │ │
│  │ Onaylayan: [Yönetici Adı              ]                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [İptal]  [Onayla ve Eşleştir]                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

### Sorun 3: Eşleşme Silinemiyor

**Sebep:** Lock aktif veya yönetici onayı gerekli

**Çözüm:**
```
1. Lock durumu kontrol edin
2. Yöneticiye başvurun
3. Geçmişi tutmak için "İptal" statüsü kullanın
```

**Görüntü - Lock Hatası:**
```
┌───────────────────────────────────────────────────────────────────┐
│  ❌ İŞLEM BAŞARISIZ                                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Bu eşleşme silinemez:                                           │
│  ⛔ Kayıt kilitli (Lock)                                        │
│                                                                   │
│  Kilidi açmak için:                                             │
│  1. Yöneticiye başvurun                                         │
│  2. Kilidi açma nedenini belirtin                                │
│  3. Yönetici onayı alın                                         │
│                                                                   │
│  Alternatif:                                                    │
│  Kaydı silmek yerine "İptal" statüsüne alabilirsiniz             │
│                                                                   │
│  [Yöneticiye İlet]  [İptal Statüsü]  [Kapat]                    │
└───────────────────────────────────────────────────────────────────┘
```

---

### Sorun 4: Çift Eşleşme Uyarısı

**Sebep:** İrsaliye veya fatura zaten eşleşmiş

**Çözüm:**
```
1. Eşleşme geçmişini kontrol edin
2. Eşleşmeyi iptal edin (lock yoksa)
3. Yeni eşleştirme yapın
```

**Görüntü - Çift Eşleşme Uyarısı:**
```
┌───────────────────────────────────────────────────────────────────┐
│  ⚠️ UYARI - ÇİFT EŞLEŞME                                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Seçtiğiniz belgeler zaten eşleşmiş:                             │
│                                                                   │
│  Fatura: FAT-2025-001                                           │
│  └─> Eşleşmiş: IRS-2025-003 (#EŞ-2025-001)                    │
│                                                                   │
│  İrsaliye: IRS-2025-003                                         │
│  └─> Eşleşmiş: FAT-2025-001 (#EŞ-2025-001)                    │
│                                                                   │
│  NE YAPMAK İSTERSİNİZ?                                          │
│  ⦿ Mevcut eşleşmeyi iptal et ve yeniden eşleştir                │
│  ⦿ İptal et ve başka irsaliye seç                               │
│  ⦿ İptal et ve başka fatura seç                                 │
│  ⦿ Vazgeç                                                        │
│                                                                   │
│  [İptal ve Yeniden Eşleştir]                                     │
└───────────────────────────────────────────────────────────────────┘
```

---

### Sorun 5: Eşleştirme Raporu Alınmıyor

**Sebep:** Filtreleme hatası veya sistem bağlantısı

**Çözüm:**
```
1. Filtreleri temizleyin (Tarihi, Cariyi)
2. Sayfayı yenileyin
3. Önbelleği temizleyin
4. Yöneticiye bildirin (süreklilik varsa)
```

---

## 📊 6. Raporlama ve Analiz

### Eşleştirme Raporları

**Erişim:** `Raporlar` → `Eşleştirme Raporları`

**Rapor Türleri:**
1. **Aylık Eşleştirme Özeti**: Her ayın eşleşme durumu
2. **Cari Bazında Eşleşmeler**: Müşteri/tedarikçi başına
3. **Miktar Farkı Raporu**: Fark tespit edilen belgeler
4. **Bekleyen Eşleşmeler**: Henüz eşleşmemiş belgeler

**Rapor Örneği:**
```
┌───────────────────────────────────────────────────────────────────┐
│  AYLIK EŞLEŞTİRME ÖZETİ - OCAK 2025                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  TOPLAM ÖZET:                                                    │
│  ┌────────────┬────────┬────────┬────────┬────────┐             │
│  │ Metrik     │ Toplam │ Başarılı│ Bekleyen│ Hatalı│             │
│  ├────────────┼────────┼────────┼────────┼────────┤             │
│  │ Fatura     │ 156    │ 142    │ 12     │ 2      │             │
│  │ İrsaliye   │ 203    │ 190    │ 13     │ 0      │             │
│  │ Eşleşme    │ 148    │ 140    │ 8      │ 0      │             │
│  └────────────┴────────┴────────┴────────┴────────┘             │
│                                                                   │
│  MİKTAR FARKLARI:                                                │
│  ┌──────────┬─────────────┬──────────────┬─────────┐             │
│  │ Tarih    │ Fatura No   │ Fark         │ Durum   │             │
│  ├──────────┼─────────────┼──────────────┼─────────┤             │
│  │ 15.01.25 │ FAT-25-042  │ +5 Adet      │ ✅      │             │
│  │ 18.01.25 │ FAT-25-055  │ -2.5 kg      │ ⚠️      │             │
│  │ 22.01.25 │ FAT-25-071  │ +120 ₺       │ ✅      │             │
│  └──────────┴─────────────┴──────────────┴─────────┘             │
│                                                                   │
│  [Dışa Aktar: Excel]  [PDF]  [Yazdır]                            │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🎓 7. Best Practices ve İpuçları

### Eşleştirme İpuçları

**✅ DOĞRU:**
- İrsaliyeyi önce mobilde oluşturun
- Fatura kesiminden hemen sonra eşleştirin
- %100 önerileri otomatik onaylayın
- Dönem sonlarında tüm belgeleri eşleştirin
- Lock sistemi düzenli olarak kullanın

**❌ YANLIŞ:**
- Fatura oluşturup günlerce bekletmeyin
- Manuel olarak her şeyi eşleştirmeyin (önerileri kullanın)
- Miktar farklarını görmezden gelmeyin
- Eşleşmeyi iptal edip tekrar yapmaktan kaçınmayın
- Lock açıkken düzenleme yapmayın

### Performans İpuçları

**Hızlı Eşleştirme İçin:**
1. Otomatik önerileri kullanın (%80+ zaman kazandırır)
2. Toplu işlemlerden yararlanın
3. Filtreleri etkili kullanın (cari, tarih aralığı)
4. Klavye kısayollarını öğrenin

**Klavye Kısayolları:**
```
Ctrl + N    → Yeni Fatura
Ctrl + E    → Eşleştir
Ctrl + L    → Lock / Unlock
Ctrl + F    → Filtrele
Ctrl + R    → Yenile
F5          → Sayfayı yenile
ESC         → İptal / Kapat
```

### Denetim İçin Hazırlık

**Dönem Sonları (Ay/Yıl Kapanışı):**
```
☐ Tüm faturalar eşleşmiş mi?
☐ Miktar farkları izinli mi?
☐ Lock aktif mi?
☐ Raporlar çıkarıldı mı?
☐ Yedek alındı mı?
```

---

## 📞 8. Destek ve İletişim

**Sorun yaşadığınızda:**

1. **İlk Yardım:** Bu kılavuzun Sorun Giderme bölümünü inceleyin
2. **Yardım Masası:** Sistem yöneticisine başvurun
3. **Eğitim:** Muhasebe departmanından eğitim isteyin
4. **Bildirim:** Sistem hatalarını destek ekibine bildirin

**İletişim Bilgileri:**
- 📧 E-posta: destek@sirket.com
- 📞 Telefon: Dahili 1234
- 💬 Slack: #urtm-takip-destek
- 📍 Ofis: Muhasebe Bölümü, 2. Kat

---

## 📝 9. Sözlük

**Terimler:**
- **İrsaliye**: Malzeme sevk belgesi
- **Fatura**: Finansal tahsilat belgesi
- **Eşleştirme**: İki belge arasında ilişki kurma
- **Lock**: Kilitleme, değişikliği engelleme
- **Kalem**: Belgedeki her bir satır (parça/malzeme)
- **Cari**: Müşteri veya tedarikçi
- **BOM**: Bill of Materials (Malzeme Listesi)
- **%100 Eşleşme**: Tüm kalemlerde miktar birebir aynı
- **Kısmi Eşleşme**: Bazı kalemlerde fark var

**Kısaltmalar:**
- **IRS**: İrsaliye
- **FAT**: Fatura
- **EŞ**: Eşleştirme
- **Adet**: Adet
- **Kg**: Kilogram
- **Mt**: Metre
- **KDV**: Katma Değer Vergisi

---

## 📅 10. Sürüm Geçmişi

| Sürüm | Tarih | Değişiklikler |
|-------|-------|---------------|
| v1.0  | 24.01.2025 | İlk sürüm |
| v1.1  | XX.XX.2025 | Mobil irsaliye entegrasyonu |
| v1.2  | XX.XX.2025 | Toplu eşleştirme özelliği |
| v1.3  | XX.XX.2025 | Gelişmiş raporlama |

---

**Son Güncelleme:** 24 Ocak 2025
**Doküman Versiyonu:** 1.0
**Yetkili:** Muhasebe departmanı

---

## 📸 Ekran Görüntüleri Yer Tutucuları

Bu kılavuzdaki tüm ekran görüntüleri yer tutucudur. Gerçek sistem görüntüleri için:

1. **Mobil İrsaliye**: `docs/images/mobil-irsaliye-olusturma.png`
2. **Fatura Oluşturma**: `docs/images/fatura-olusturma.png`
3. **Eşleştirme Ekranı**: `docs/images/eslestirme-ekrani.png`
4. **Öneriler Paneli**: `docs/images/eslestirme-onerileri.png`
5. **Lock Ekranı**: `docs/images/lock-ekrani.png`
6. **Hata Mesajları**: `docs/images/hata-mesajlari.png`
7. **Raporlar**: `docs/images/eslestirme-raporlari.png`

**Görüntü Ekleme Talimatı:**
```bash
# Ekran görüntüsü alın
# Dosyayı docs/images/ dizinine kaydedin
# Bu kılavuzda ilgili yere ekleyin
```
