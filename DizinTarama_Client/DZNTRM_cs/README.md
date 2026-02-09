# ÜRTM Dizin Tarama Client (C#)

ÜRTM Dizin Tarama Client'in modern C# (.NET 8.0) ile yazılmış versiyonu.

## Özellikler

- ✅ Modern C# 10+ ve .NET 8.0
- ✅ Windows Forms tabanlı kullanıcı dostu arayüz
- ✅ Asenkron dosya tarama ve veritabanı entegrasyonu
- ✅ Gerçek zamanlı ilerleme göstergesi
- ✅ Detaylı parça bilgileri ve görseller
- ✅ Esnek ayarlar yönetimi
- ✅ Güçlü loglama ve hata yönetimi
- ✅ Dependency Injection ve modern mimari

## Sistem Gereksinimleri

- Windows 10 veya üzeri
- .NET 8.0 Runtime
- 4GB RAM (önerilen 8GB)
- 100MB boş disk alanı

## Kurulum

### 1. Kaynak Kodundan Derleme

```bash
# Repository'den kopyala
git clone [repository-url]
cd DizinTarama_Client/DZNTRM_cs

# Build et
build.bat

# Çalıştır
run.bat
```

### 2. Manuel Build

```bash
# NuGet paketlerini yükle
dotnet restore

# Build et
dotnet build --configuration Release

# Yayınla
dotnet publish --configuration Release --output "./publish"
```

## Kullanım

### 1. Başlatma

- `run.bat` dosyasını çalıştırın veya
- `publish\URTM_DizinTarama_Client.exe` dosyasını doğrudan çalıştırın

### 2. Dizin Tarama

1. **Dizin Seç**: "Gözat..." butonu ile CAD dosyalarını içeren dizini seçin
2. **Taramayı Başlat**: "Taramayı Başlat" butonuna tıklayın
3. **İlerlemeyi İzle**: Tarama ilerlemesini gerçek zamanlı olarak izleyin
4. **Sonuçları İncele**: Tarama tamamlandığında sonuçları inceleyin

### 3. Veritabanı Entegrasyonu

- **Otomatik Eşleştirme**: Tarama sonucunda parçaları veritabanı ile otomatik eşleştirir
- **Detaylı Bilgiler**: Çift tıklayarak parça detaylarını görüntüleyin
- **Görseller**: Parça resimlerini ve teknik çizimleri görüntüleyin

### 4. Dosya Yönetimi

- **CAD Dosyaları**: 3D model (.sldprt), çizim (.slddrw) ve PDF dosyalarını destekler
- **Dosya Açma**: Dosyalara çift tıklayarak doğrudan açın
- **Yol Gösterimi**: Dosya yollarını tıklanabilir linkler olarak gösterir

## Ayarlar

### Sunucu Ayarları

- **Sunucu Adresi**: Backend API adresi
- **Zaman Aşımı**: İstek zaman aşımı süresi
- **Yeniden Deneme**: Başarısız isteklerin yeniden deneme sayısı

### Client Ayarları

- **Tarama Zaman Aşımı**: Maksimum tarama süresi
- **Eş Zamanlı Tarama**: Aynı anda çalışabilecek maksimum tarama sayısı
- **Cache**: Parça bilgileri için cache süresi

### Arayüz Ayarları

- **Pencere Boyutu**: Uygulama penceresi boyutu
- **Tema**: Arayüz teması
- **Dil**: Kullanıcı dili (Türkçe/İngilizce)

## Desteklenen Dosya Formatları

### CAD Dosyaları
- **SolidWorks**: .sldprt, .sldasm, .slddrw
- **STEP/IGES**: .step, .stp, .igs, .iges
- **STL**: .stl
- **Parasolid**: .x_t, .x_b

### Diğer
- **PDF**: Teknik resimler için
- **Resimler**: .png, .jpg, .jpeg, .bmp, .gif

## Hata Ayıklama

### Log Dosyaları

Log dosyaları `Logs` klasöründe bulunur:
- `Client_YYYY-MM-DD.log`: Günlük log dosyaları
- Hata ayıklama için bu dosyaları kontrol edin

### Yaygın Sorunlar

1. **Sunucu Bağlantı Hatası**
   - Sunucu adresini kontrol edin
   - Backend uygulamasının çalıştığından emin olun
   - Firewall ayarlarını kontrol edin

2. **Tarama Hatası**
   - Dizin izinlerini kontrol edin
   - Antivirüs yazılımının engellemediğinden emin olun
   - Dizin yolunun doğru olduğundan emin olun

3. **Görsel Yükleme Hatası**
   - İnternet bağlantısını kontrol edin
   - Sunucu adresini doğrulayın
   - Resim URL'lerinin geçerli olduğundan emin olun

## Geliştirme

### Proje Yapısı

```
DZNTRM_cs/
├── Models/          # Veri modelleri
├── Services/        # Servis katmanı
├── UI/             # Kullanıcı arayüzü
├── Program.cs      # Başlangıç noktası
├── appsettings.json # Yapılandırma dosyası
├── build.bat       # Build script'i
├── run.bat         # Çalıştırma script'i
└── README.md       # Bu dosya
```

### Teknolojiler

- **.NET 8.0**: Son .NET framework
- **Windows Forms**: Kullanıcı arayüzü
- **Microsoft.Extensions.Logging**: Loglama
- **System.Net.Http**: HTTP istekleri
- **Newtonsoft.Json**: JSON işlemleri

### Contributing

1. Repository'yi fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'e push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## Lisans

Bu proje MIT Lisansı altında dağıtılmaktadır. Detaylar için `LICENSE` dosyasına bakın.

## Destek

Sorunlar veya öneriler için:
- GitHub Issues üzerinden bildirin
- E-posta: [support-email]
- Dokümantasyon: [docs-url]

---

**Versiyon**: 1.0.0
**Son Güncelleme**: 2025-10-04
**Geliştirici**: ÜRTM Takım