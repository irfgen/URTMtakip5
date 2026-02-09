@echo off
REM PIL/Pillow Kurulum Script'i
REM ÜRTM Dizin Tarama Client için

echo ========================================
echo     PIL/Pillow Kurulum Araci
echo ========================================
echo.
echo Bu script resim gosterim ozelligini aktif etmek icin
echo PIL/Pillow kutuphanesini kuracaktir.
echo.

echo [1/2] Python kontrol ediliyor...
python --version >nul 2>&1
if errorlevel 1 (
    echo HATA: Python bulunamadi!
    echo Lutfen Python 3.8+ kurun ve PATH'e ekleyin.
    pause
    exit /b 1
)

echo [2/2] Pillow kuruluyor...
pip install Pillow

if errorlevel 1 (
    echo.
    echo HATA: Pillow kurulumu basarisiz!
    echo Alternatif komutu deneyin: py -m pip install Pillow
    pause
    exit /b 1
) else (
    echo.
    echo BASARILI: Pillow kuruldu!
    echo.
    echo Resim gosterim ozelligi aktif edildi.
    echo Client'i yeniden baslatin: python main.py
)

echo.
echo Kontrol ediliyor...
python -c "from PIL import Image, ImageTk; print('✅ PIL/Pillow basariyla kuruldu!')" 2>nul

if errorlevel 1 (
    echo UYARI: PIL kurulu ama import edilemiyor.
    echo Python PATH kontrol edin veya bilgisayari yeniden baslatin.
) else (
    echo ✅ Her sey hazir! Resimler artik gosterilebilir.
)

echo.
pause