@echo off
:: URTM Takip - Hizli Kurulum (Temiz Versiyon)

echo =========================================
echo    URTM Dizin Tarama - Hizli Kurulum
echo =========================================
echo.

:: Dosya kontrolu
if not exist "main.py" (
    echo HATA: main.py dosyasi bulunamadi!
    echo Tum client dosyalarini ayni klasore cikartin.
    echo.
    echo Mevcut dosyalar:
    dir /b *.py *.txt *.bat 2>nul
    echo.
    pause
    exit /b 1
)

echo main.py bulundu - OK
echo.

:: Python kontrolu
python --version >nul 2>&1
if errorlevel 1 (
    echo HATA: Python bulunamadi!
    echo.
    echo Python yuklemek icin:
    echo 1. https://python.org/downloads sayfasina git
    echo 2. "Add to PATH" secenegini isaretleyin
    echo 3. Kurulumu tamamlayin
    echo.
    pause
    exit /b 1
)

echo Python bulundu - OK
echo.

:: Requests yukle
echo requests modulu yukleniyor...
pip install requests >nul 2>&1
if errorlevel 1 (
    echo HATA: requests modulu yuklenemedi!
    echo Internet baglantinizi kontrol edin.
    echo.
    pause
    exit /b 1
)

echo requests modulu yuklendi - OK
echo.

:: Config olustur
if not exist "config.ini" (
    echo Yapilandirma dosyasi olusturuluyor...
    (
        echo [SERVER]
        echo url = http://localhost:3000
        echo timeout = 30
        echo.
        echo [SCAN]
        echo extensions = .sldprt,.slddrw,.pdf
        echo exclude_folders = IPTAL,iptal,temp,Temp
        echo max_depth = 10
        echo.
        echo [UI]
        echo last_directory =
        echo auto_scan_interval = 0
    ) > config.ini
    echo Yapilandirma dosyasi olusturuldu - OK
)

echo.
echo =========================================
echo         KURULUM TAMAMLANDI!
echo =========================================
echo.

echo Programi baslatmak icin:
echo - run_simple.bat dosyasini cift tiklayin
echo - VEYA: python main.py yazin
echo.

set /p START_NOW="Simdi programi baslatilsin mi? (Y/N): "
if /i "%START_NOW%"=="Y" (
    echo.
    echo Program baslatiliyor...
    python main.py
)

echo.
pause