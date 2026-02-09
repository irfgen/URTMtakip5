@echo off
:: URTM Takip - Basit Calistirici

echo =========================================
echo    URTM Dizin Tarama Client
echo =========================================
echo.

:: Dosya kontrolu
if not exist "main.py" (
    echo HATA: main.py dosyasi bulunamadi!
    echo Dogru klasorde misiniz?
    echo.
    pause
    exit /b 1
)

:: Python kontrolu
python --version >nul 2>&1
if errorlevel 1 (
    echo HATA: Python bulunamadi!
    echo Python kurulumunu kontrol edin.
    echo.
    pause
    exit /b 1
)

:: Program baslat
echo Program baslatiliyor...
echo.

python main.py

:: Hata durumunda
if errorlevel 1 (
    echo.
    echo Program hata ile kapandi.
    echo Log dosyasini kontrol edin.
    echo.
    pause
)

echo.
echo Program kapatildi.
pause