@echo off
chcp 65001 >nul
title Hizli Kurulum - URTM Dizin Tarama Client

echo ========================================
echo   HIZLI KURULUM - URTM DIZIN TARAMA
echo ========================================
echo.

REM Basit dosya kontrolu
if not exist "main.py" (
    echo HATA: main.py bulunamadi!
    echo Tum dosyalari ayni klasore cikarttin mi?
    echo.
    pause
    exit /b 1
)

echo main.py bulundu. OK
echo.

REM Python kontrolu
python --version >nul 2>&1
if errorlevel 1 (
    echo HATA: Python bulunamadi!
    echo.
    echo Python yuklemek icin:
    echo 1. https://python.org/downloads/ git
    echo 2. "Add to PATH" secenegini isaretleyin
    echo 3. Bu dosyayi tekrar calistirin
    echo.
    pause
    exit /b 1
)

echo Python bulundu. OK
echo.

REM Requests yukle
echo requests modulu yukleniyor...
pip install requests >nul 2>&1
if errorlevel 1 (
    echo requests yuklenemedi!
    echo Internet baglantinizi kontrol edin.
    pause
    exit /b 1
)

echo requests modulu yuklendi. OK
echo.

REM Config dosyasi olustur
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
    echo Yapilandirma dosyasi olusturuldu. OK
)

echo.
echo ========================================
echo        KURULUM TAMAMLANDI!
echo ========================================
echo.

echo Programi baslatmak icin:
echo - run.bat dosyasini cift tiklayin
echo - VEYA komut satirinda: python main.py
echo.

set /p START_NOW="Simdi programi baslatilsin mi? (Y/N): "
if /i "%START_NOW%"=="Y" (
    echo.
    echo Program baslatiliyor...
    python main.py
)

echo.
pause