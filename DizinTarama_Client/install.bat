@echo off
chcp 65001 >nul
REM URTM Takip - Dizin Tarama Client Kurulum Script
REM Windows automatic installer

title URTM Takip - Dizin Tarama Client Kurulum

echo ========================================
echo    URTM Takip - Dizin Tarama Client
echo         Otomatik Kurulum Script
echo ========================================
echo.

REM Mevcut dizin kontrolu
echo Mevcut dizin: %CD%
echo.

REM Dosyalarin varligini kontrol et
echo Gerekli dosyalar kontrol ediliyor...
if not exist "main.py" (
    echo HATA: main.py dosyasi bulunamadi!
    echo Lutfen tum dosyalari ayni klasore cikarttiginizdan emin olun.
    echo.
    dir /b *.py *.txt *.bat 2>nul
    echo.
    pause
    exit /b 1
)

if not exist "requirements.txt" (
    echo UYARI: requirements.txt dosyasi bulunamadi!
    echo Manuel paket kurulumu yapiliyor...
    echo.
    goto MANUAL_INSTALL
)

echo Gerekli dosyalar bulundu. OK
echo.

REM Yonetici yetkisi kontrolu
net session >nul 2>&1
if errorlevel 1 (
    echo UYARI: Bu script yonetici yetkisiyle calistirilmalidir.
    echo Lutfen "Yonetici olarak calistir" secenegini kullanin.
    echo.
    pause
    exit /b 1
)

echo Yonetici yetkileri onaylandi. OK
echo.

REM Python kurulu mu kontrol et
echo Python kurulumu kontrol ediliyor...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo HATA: Python bulunamadi!
    echo.
    echo Python'u kurmak icin:
    echo 1. https://www.python.org/downloads/ adresine gidin
    echo 2. En son Python surumunu indirin
    echo 3. Kurulum sirasinda "Add Python to PATH" secenegini isaretleyin
    echo 4. Bu script'i tekrar calistirin
    echo.
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo Python %PYTHON_VERSION% bulundu. OK
echo.

REM PIP guncelleme
echo PIP guncelleniyor...
python -m pip install --upgrade pip >nul 2>&1
if errorlevel 1 (
    echo PIP guncellemede sorun oldu, devam ediliyor...
) else (
    echo PIP guncellendi. OK
)
echo.

REM Gereksinimleri kur
echo Python paketleri kuruluyor...
pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo HATA: Paket kurulumunda sorun olustu!
    echo Internet baglantinizi kontrol edin.
    echo Manuel kurulum deneniyor...
    goto MANUAL_INSTALL
)

echo Paketler basariyla kuruldu. OK
echo.
goto CONFIG_SETUP

:MANUAL_INSTALL
echo.
echo === MANUEL PAKET KURULUMU ===
echo.
echo Temel Python paketleri kuruluyor...
pip install requests
if errorlevel 1 (
    echo requests paketi kurulamadi!
    echo Internet baglantinizi kontrol edin.
    pause
    exit /b 1
)
echo requests paketi kuruldu. OK
echo.

:CONFIG_SETUP

REM Yapilandirma dosyasi kontrol et
if not exist "config.ini" (
    echo Ilk yapilandirma dosyasi olusturuluyor...

    echo [SERVER] > config.ini
    echo url = http://localhost:3000 >> config.ini
    echo timeout = 30 >> config.ini
    echo. >> config.ini
    echo [SCAN] >> config.ini
    echo extensions = .sldprt,.slddrw,.pdf >> config.ini
    echo exclude_folders = IPTAL,iptal,temp,Temp >> config.ini
    echo max_depth = 10 >> config.ini
    echo. >> config.ini
    echo [UI] >> config.ini
    echo last_directory = >> config.ini
    echo auto_scan_interval = 0 >> config.ini

    echo Yapilandirma dosyasi olusturuldu. OK
)

REM Desktop kisayolu olustur (opsiyonel)
set /p CREATE_SHORTCUT="Desktop kisayolu olusturulsun mu? (Y/N): "
if /i "%CREATE_SHORTCUT%"=="Y" (
    echo Desktop kisayolu olusturuluyor...
    REM PowerShell ile kisayol olustur
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\URTM Dizin Tarama.lnk'); $Shortcut.TargetPath = '%CD%\run.bat'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.Description = 'URTM Takip Dizin Tarama Client'; $Shortcut.Save()"
    echo Desktop kisayolu olusturuldu. OK
)

echo.
echo ========================================
echo          KURULUM TAMAMLANDI!
echo ========================================
echo.
echo Programi baslatmak icin:
echo 1. "run.bat" dosyasini cift tiklayin, VEYA
echo 2. Desktop kisayolunu kullanin (olusturulduysa), VEYA
echo 3. Komut satirinda: python main.py
echo.
echo Ilk calistirmada:
echo - Sunucu adresini ayarlayin
echo - Baglantıyi test edin
echo - Taranacak dizini secin
echo.
echo Detayli bilgi icin: KURULUM_REHBERI.md
echo.

REM Test calistirmasi yap
set /p RUN_TEST="Simdi test calistirmasi yapilsin mi? (Y/N): "
if /i "%RUN_TEST%"=="Y" (
    echo.
    echo Test calistirmasi baslatiliyor...
    python main.py
)

echo.
echo Kurulum scripti tamamlandi.
pause