# ÜRTM Takip - Dizin Tarama Client Kurulum Rehberi

## Genel Bakış

ÜRTM Takip Dizin Tarama Client, Windows tabanlı kullanıcı bilgisayarlarında çalışan, CAD dosyalarını tarayıp ana sunucuyla iletişim kuran Python uygulamasıdır.

## Sistem Gereksinimleri

### Minimum Gereksinimler
- **İşletim Sistemi**: Windows 10 veya üzeri (64-bit önerilir)
- **RAM**: 4 GB (8 GB önerilir)
- **Disk Alanı**: 100 MB (program için), ek alan tarama için
- **İnternet Bağlantısı**: Ana sunucuya erişim için gerekli

### Yazılım Gereksinimleri
- **Python 3.8 veya üzeri** (zorunlu)
- **Network erişimi** ÜRTM Takip sunucusuna
- **CAD dosyalarına erişim** (SolidWorks, PDF vs.)

## Python Kurulumu

### 1. Python'u İndirin
1. [Python.org](https://www.python.org/downloads/) adresine gidin
2. "Download Python 3.11.x" butonuna tıklayın (en son sürüm)
3. İndirilen dosyayı çalıştırın

### 2. Python Kurulum Adımları
1. **ÖNEMLİ**: "Add Python to PATH" seçeneğini işaretleyin
2. "Install Now" seçeneğini seçin
3. Kurulum tamamlandıktan sonra "Disable path length limit" tıklayın
4. Kurulumu tamamlayın

### 3. Python Kurulumunu Doğrulayın
1. `Win + R` tuşlarına basın
2. `cmd` yazın ve Enter'a basın
3. Açılan komut isteminde şunu yazın:
   ```bash
   python --version
   ```
4. Python sürümü görünmelidir (örn: Python 3.11.5)

## Dizin Tarama Client Kurulumu

### 1. Dosyaları İndirin
ÜRTM Takip admin'inden client dosyalarını alın:
- `main.py` - Ana program
- `windows_utils.py` - Windows yardımcıları
- `requirements.txt` - Python gereksinimleri
- `quick_install.bat` - Hızlı kurulum scripti (ÖNERİLEN)
- `install.bat` - Detaylı kurulum scripti
- `run.bat` - Çalıştırma scripti
- `debug_install.bat` - Sorun giderme scripti
- `README.md` - Hızlı başlangıç
- `KURULUM_REHBERI.md` - Bu dosya

### 2. Klasör Oluşturun
1. `C:\\URTM_DizinTarama` klasörü oluşturun
2. İndirilen dosyaları bu klasöre kopyalayın

### 3. Kurulum Seçenekleri

#### Seçenek A: Basit Kurulum (ÖNERİLEN - Encoding Sorunu Çözülmüş)
1. `simple_install.bat` dosyasını **çift tık** (yönetici yetkisi gerekmez)
2. Ekrandaki talimatları takip edin
3. Kurulum otomatik olarak tamamlanır

#### Seçenek A2: Encoding Test (Sorun Yaşıyorsanız)
1. `fix_encoding.bat` dosyasını çalıştırın
2. Sistem kontrollerini inceleyin
3. Program çalıştırma seçeneğini kullanın

#### Seçenek B: Manuel Kurulum
1. Komut istemini **yönetici olarak** açın
2. Şu komutları sırasıyla çalıştırın:
   ```bash
   cd C:\URTM_DizinTarama
   pip install requests
   python main.py
   ```

#### Seçenek C: Sorun Giderme Kurulumu
1. `debug_install.bat` dosyasını çalıştırın
2. Hata mesajlarını kontrol edin
3. Eksik dosyaları tamamlayın

### 4. İlk Çalıştırma
- `run_simple.bat` dosyasını çift tıklayın (ÖNERİLEN)
- VEYA `run.bat` dosyasını çift tıklayın
- VEYA komut satırında: `python main.py`

## Yapılandırma

### 1. Sunucu Ayarları
İlk açılışta:
1. "Sunucu URL" alanına ana sunucu adresini girin
   - Örnek: `http://192.168.1.100:3000` (yerel ağ)
   - Örnek: `https://urtm.company.com` (internet)

2. "Bağlantıyı Test Et" butonuna tıklayın
3. ✓ yeşil işaret görmelisiniz

### 2. Tarama Ayarları
"Ayarlar" butonunda:
- **Dosya uzantıları**: `.sldprt,.slddrw,.pdf` (varsayılan)
- **Hariç klasörler**: `IPTAL,iptal,temp,Temp`
- **Maksimum derinlik**: `10` (alt klasör seviyesi)

### 3. Ağ Sürücüleri
Windows'ta network klasörlerini eşlemeniz gerekir:

1. **File Explorer** açın
2. **"This PC"** → **"Map network drive"**
3. Sürücü harfi seçin (örn: Z:)
4. Klasör yolu girin (örn: `\\server\shared\folder`)
5. Kullanıcı adı/şifre girin
6. "Reconnect at sign-in" işaretleyin

## Kullanım

### 1. Temel Tarama
1. "Dizin Seç" butonuna tıklayın
2. Taranacak klasörü seçin
3. "Dizini Analiz Et" butonuna tıklayın
4. Sonuçları bekleyin

### 2. Network Klasörleri
- Eşlenmiş sürücüler (Z:, Y: vs.) kullanın
- UNC yolları desteklenir (`\\server\share\folder`)
- VPN bağlantısı gerekebilir

### 3. Sonuçları Anlamak
- **Tam**: 3D + Çizim + PDF dosyaları mevcut
- **Kısmi**: Bazı dosyalar eksik
- **Eksik**: Sadece 3D dosya var

## Sorun Giderme

### Python Hatası
```
'python' is not recognized as an internal or external command
```
**Çözüm**: Python'u PATH'e ekleyin:
1. "Environment Variables" açın
2. "Path" değişkenine Python klasörünü ekleyin
3. Komut istemini yeniden başlatın

### Bağlantı Hatası
```
Sunucuya bağlanılamıyor
```
**Çözümler**:
- Sunucu IP adresini kontrol edin
- Firewall ayarlarını kontrol edin
- VPN bağlantısını kontrol edin
- IT desteğinden yardım alın

### Dosya Erişim Hatası
```
Dizine erişim sağlanamıyor
```
**Çözümler**:
- Network sürücüsünü yeniden eşleyin
- Kullanıcı izinlerini kontrol edin
- Klasör yolunu doğrulayın

### Tarama Yavaş
**Optimizasyon**:
- "Maksimum derinlik" değerini azaltın
- Büyük klasörleri alt bölümlere ayırın
- SSD disk kullanın
- Network hızını artırın

## Güvenlik

### 1. Ağ Güvenliği
- Sadece güvenilir sunuculara bağlanın
- VPN kullanın
- SSL/HTTPS protokolünü tercih edin

### 2. Dosya Güvenliği
- Yetkisiz klasörlere erişmeyin
- Şirket politikalarına uyun
- Hassas dosyaları paylaşmayın

## Güncelleme

### Manuel Güncelleme
1. Yeni dosyaları indirin
2. Eski dosyaları yedekleyin
3. Yeni dosyaları kopyalayın
4. `config.ini` dosyasını koruyun

### Otomatik Güncelleme
Gelecek sürümlerde otomatik güncelleme özelliği eklenecek.

## Destek

### Teknik Destek
- **IT Departmanı**: Ağ ve sistem sorunları
- **ÜRTM Takip Admin**: Uygulama sorunları
- **Bu Rehber**: Temel kullanım sorular

### Log Dosyaları
Sorun yaşadığınızda `dizin_tarama.log` dosyasını paylaşın.

### Sık Karşılaşılan Sorular

**S**: Program açılmıyor
**C**: Python kurulumunu kontrol edin, yönetici yetkisiyle çalıştırın

**S**: Network klasörü görünmüyor
**C**: Sürücüyü yeniden eşleyin, VPN bağlantısını kontrol edin

**S**: Tarama çok uzun sürüyor
**C**: Tarama derinliğini azaltın, daha küçük klasörler seçin

**S**: Sunucuya gönderim başarısız
**C**: İnternet bağlantısını ve sunucu adresini kontrol edin

## Versiyon Geçmişi

### v1.0 (İlk Sürüm)
- Temel dizin tarama özelliği
- Windows uyumluluğu
- Sunucu iletişimi
- GUI arayüz

---

**Not**: Bu rehber ÜRTM Takip sistemi için özel olarak hazırlanmıştır. Genel Python kullanımı için resmi Python belgelerine başvurun.