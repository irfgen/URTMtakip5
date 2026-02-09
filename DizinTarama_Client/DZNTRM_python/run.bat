@echo off
chcp 65001 >nul
REM URTM Takip - Dizin Tarama Client Baslatici
REM Windows batch dosyası

echo ========================================
echo    URTM Takip - Dizin Tarama Client
echo ========================================
echo.

REM Mevcut dizin ve dosya kontrolu
echo Mevcut dizin: %CD%
if not exist "main.py" (
    echo HATA: main.py dosyasi bulunamadi!
    echo Lutfen dogru klasorde oldugunuzdan emin olun.
    echo.
    pause
    exit /b 1
)

REM Python kurulu mu kontrol et
python --version >nul 2>&1
if errorlevel 1 (
    echo HATA: Python bulunamadi!
    echo Lutfen once Python'u kurun: https://www.python.org/downloads/
    echo Kurulum rehberini okuyun: KURULUM_REHBERI.md
    echo.
    pause
    exit /b 1
)

echo Python bulundu.

REM Gerekli moduller kurulu mu kontrol et
echo Gerekli moduller kontrol ediliyor...
python -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo HATA: requests modulu bulunamadi!
    echo Yukleniyor...
    pip install requests
    if errorlevel 1 (
        echo requests modulu yuklenemedi!
        echo Internet baglantinizi kontrol edin.
        pause
        exit /b 1
    )
)

REM Dizin tarama client'ini baslat
echo.
echo Dizin Tarama Client baslatiliyor...
echo.

python main.py

REM Hata durumunda kullaniciya bilgi ver
if errorlevel 1 (
    echo.
    echo Program bir hatayla kapandi.
    echo Detaylar icin dizin_tarama.log dosyasini kontrol edin.
    echo.
    pause
)

echo.
echo Program kapatildi.
pause