@echo off
echo =========================================
echo   URTM Dizin Tarama Client v1.0.0
echo   C# Build Script (Serilog Fixed)
echo =========================================
echo.

echo Mevcut dizin: %CD%
echo.

echo NuGet paketleri restore ediliyor...
dotnet restore
if %ERRORLEVEL% NEQ 0 (
    echo ❌ NuGet restore başarısız!
    echo.
    echo Not: Bu proje .NET 8.0 Runtime gerektirir.
    echo İndirme adresi: https://dotnet.microsoft.com/download/dotnet/8.0
    pause
    exit /b 1
)

echo ✅ NuGet paketleri başarıyla restore edildi
echo.

echo Proje build ediliyor...
dotnet build --configuration Release --verbosity normal
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build başarısız! Hata detayı:
    echo.
    echo Ayrıntılı bilgi için aşağıdaki komutu çalıştırın:
    echo.
    echo     dotnet build --configuration Release --verbosity normal
    echo.
    pause
    exit /b 1
)

echo ✅ Build başarıyla tamamlandı
echo.

echo Release yayınlıyor...
dotnet publish --configuration Release --output ".\publish" --self-contained false
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Publish başarısız!
    pause
    exit /b 1
)

echo ✅ Publish başarıyla tamamlandı
echo.

echo Çalıştırılabilir dosya: %CD%\publish\URTM_DizinTarama_Client.exe
echo.

echo Build işlemi tamamlandı!
pause