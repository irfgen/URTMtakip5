@echo off
echo =========================================
echo   URTM Dizin Tarama Client v1.0.0
echo   Çalıştırma Script'i
echo =========================================
echo.

if exist "publish\URTM_DizinTarama_Client.exe" (
    echo Client çalıştırılıyor...
    cd publish
    URTM_DizinTarama_Client.exe
) else (
    echo ❌ Çalıştırılabilir dosya bulunamadı!
    echo Lütfen önce build.bat dosyasını çalıştırın.
    pause
)