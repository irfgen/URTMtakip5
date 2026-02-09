# URTM Takip - Dizin Tarama Client Sorun Giderme

## 🚨 En Sık Karşılaşılan Sorunlar

### ❌ Batch Dosya Encoding Sorunları

**Problem:**
```
'EM' is not recognized as an internal or external command
'cho' is not recognized as an internal or external command
```

**Çözüm:**
1. **Basit kurulum kullanın:**
   ```bash
   simple_install.bat
   ```

2. **Encoding test çalıştırın:**
   ```bash
   fix_encoding.bat
   ```

3. **Manuel çözüm:**
   - Komut istemini açın
   - `chcp 65001` yazın
   - `python main.py` ile programı başlatın

---

### ❌ Python Bulunamıyor

**Problem:**
```
'python' is not recognized as an internal or external command
```

**Çözüm:**
1. **Python kurulu mu kontrol edin:**
   - Başlat menüsünde "Python" arayın
   - Yoksa: https://python.org/downloads

2. **PATH ayarını kontrol edin:**
   - Windows Ayarlar → Sistem → Hakkında → Gelişmiş sistem ayarları
   - Çevre Değişkenleri → Path → Düzenle
   - Python klasörü ekleyin (örn: `C:\Python39`)

3. **Alternatif komutlar deneyin:**
   ```bash
   python3 main.py
   py main.py
   ```

---

### ❌ Dosyalar Bulunamıyor

**Problem:**
```
HATA: main.py dosyasi bulunamadi!
```

**Çözüm:**
1. **Dosya kontrolü:**
   ```bash
   fix_encoding.bat
   ```

2. **ZIP dosyasını tekrar çıkartın:**
   - Tüm dosyalar aynı klasörde olmalı
   - Windows Defender tarafından engellenmemiş olmalı

3. **Gerekli dosyalar:**
   - `main.py` ✓
   - `version.py` ✓
   - `requirements.txt` ✓
   - `simple_install.bat` ✓

---

### ❌ İnternet Bağlantısı Sorunları

**Problem:**
```
requests modulu yuklenemedi!
Sunucuya baglanılamıyor
```

**Çözüm:**
1. **İnternet bağlantısını kontrol edin**

2. **Firewall ayarları:**
   - Python.exe'ye izin verin
   - Antivirus tarafından engellenmiyor mu kontrol edin

3. **Proxy ayarları:**
   ```bash
   pip install --proxy http://proxy:port requests
   ```

---

### ❌ Sunucu Bağlantı Sorunları

**Problem:**
```
✗ Sunucuya bağlanılamıyor
```

**Çözüm:**
1. **Sunucu adresini kontrol edin:**
   - IP adresi doğru mu?
   - Port numarası doğru mu? (varsayılan: 3000)

2. **Network bağlantısı:**
   - VPN bağlı mı?
   - Şirket ağında mısınız?

3. **Test komutları:**
   ```bash
   ping [sunucu-ip]
   telnet [sunucu-ip] 3000
   ```

---

### ❌ Klasör Erişim Sorunları

**Problem:**
```
Dizine erişim sağlanamıyor
```

**Çözüm:**
1. **Yönetici yetkisi:**
   - Programı "Yönetici olarak çalıştır"

2. **Network drive kontrol:**
   - Sürücü eşlenmiş mi?
   - Kullanıcı izinleri yeterli mi?

3. **Yol formatı:**
   ```
   Doğru: Z:\CAD_Files
   Doğru: \\server\share\folder
   Yanlış: smb://server/share
   ```

---

## 🔧 Gelişmiş Sorun Giderme

### Debug Modu
```bash
# Detaylı debug bilgisi
debug_install.bat

# Manuel Python debug
python -v main.py
```

### Log Dosyası
```bash
# Log dosyasını kontrol edin
type dizin_tarama.log
```

### Sistem Bilgisi
```bash
# Sistem kontrolü
fix_encoding.bat
```

---

## 📞 Destek Alma

### Bilgi Toplama
Destek alırken şu bilgileri hazırlayın:

1. **Hata mesajı** (tam metin)
2. **Windows sürümü**
3. **Python sürümü** (`python --version`)
4. **Client sürümü** (Program → Hakkında)
5. **Log dosyası** (`dizin_tarama.log`)

### İletişim
- **IT Departmanı:** Ağ ve sistem sorunları
- **URTM Takip Admin:** Uygulama sorunları

---

## ⚡ Hızlı Çözümler

| Sorun | Çözüm |
|-------|-------|
| Encoding hatası | `simple_install.bat` kullanın |
| Python bulunamıyor | PATH ayarını kontrol edin |
| Dosya bulunamıyor | ZIP'i tekrar çıkartın |
| İnternet sorunu | Firewall/antivirus kontrol |
| Sunucu bağlantısı | IP/port doğruluğu |
| Klasör erişimi | Yönetici yetkisi |

---

## 🎯 Önleyici İpuçları

1. **Windows Defender'ı güncellüyin**
2. **Antivirus'e Python klasörünü ekleyin**
3. **VPN bağlantısını stable tutun**
4. **Network sürücülerini düzenli kontrol edin**
5. **Program güncellemelerini takip edin**

Bu rehberle çoğu sorunu kendiniz çözebilirsiniz! 🚀