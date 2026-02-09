@echo off
echo ===========================================
echo STEP BOM Analyzer v3.0 - FreeCAD Native
echo Windows Auto-Installation Script
echo ===========================================
echo.

REM Enable delayed variable expansion
setlocal enabledelayedexpansion

REM Set colors for output
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "RESET=[0m"

echo %BLUE%[INSTALL] Sistem kontrolu basliyor...%RESET%
echo.

echo %BLUE%[PHASE-1] FreeCAD Detection%RESET%
echo ----------------------------------------

set "FREECAD_PATH="
set "FREECAD_VERSION="
set "FREECAD_PYTHON_PATH="

echo %YELLOW%[SEARCH] FreeCAD araniyor...%RESET%

REM Check FreeCAD 1.0
if exist "C:\Program Files\FreeCAD 1.0\bin\FreeCAD.exe" (
    set "FREECAD_PATH=C:\Program Files\FreeCAD 1.0\bin\FreeCAD.exe"
    goto freecad_found
)

REM Check FreeCAD 0.21
if exist "C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe" (
    set "FREECAD_PATH=C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe"
    goto freecad_found
)

REM Check FreeCAD 0.20
if exist "C:\Program Files\FreeCAD 0.20\bin\FreeCAD.exe" (
    set "FREECAD_PATH=C:\Program Files\FreeCAD 0.20\bin\FreeCAD.exe"
    goto freecad_found
)

REM Check x86 versions
if exist "C:\Program Files (x86)\FreeCAD 1.0\bin\FreeCAD.exe" (
    set "FREECAD_PATH=C:\Program Files (x86)\FreeCAD 1.0\bin\FreeCAD.exe"
    goto freecad_found
)

if exist "C:\Program Files (x86)\FreeCAD 0.21\bin\FreeCAD.exe" (
    set "FREECAD_PATH=C:\Program Files (x86)\FreeCAD 0.21\bin\FreeCAD.exe"
    goto freecad_found
)

if exist "C:\Program Files (x86)\FreeCAD 0.20\bin\FreeCAD.exe" (
    set "FREECAD_PATH=C:\Program Files (x86)\FreeCAD 0.20\bin\FreeCAD.exe"
    goto freecad_found
)

echo %RED%[HATA] FreeCAD bulunamadi!%RESET%
echo.
echo FreeCAD'in kurulu olmasi gerekiyor. Lutfen su adimlari takip edin:
echo 1. https://www.freecadweb.org/ adresine gidin
echo 2. FreeCAD 0.20 veya daha yeni bir surumunu kurun
echo 3. Kurulum tamamlandiktan sonra bu scripti tekrar calistirin
echo.
echo Desteklenen FreeCAD surumleri: 0.20, 0.21, 1.0+
echo.
pause
exit /b 1

:freecad_found
echo %GREEN%[OK] FreeCAD bulundu: !FREECAD_PATH!%RESET%

echo.
echo %BLUE%[PHASE-2] FreeCAD Version Validation%RESET%
echo ----------------------------------------

echo %YELLOW%[VERSION] FreeCAD versiyonu kontrol ediliyor...%RESET%

"!FREECAD_PATH!" --version >temp_version.txt 2>nul
if exist temp_version.txt (
    for /f "tokens=*" %%A in (temp_version.txt) do (
        echo %%A | find "FreeCAD" >nul
        if !errorlevel! == 0 (
            set "FREECAD_VERSION=%%A"
            echo %GREEN%[OK] Surum: %%A%RESET%
            del temp_version.txt
            goto version_ok
        )
    )
    del temp_version.txt
    echo %YELLOW%[WARNING] Versiyon tespit edilemedi, devam ediliyor...%RESET%
)

:version_ok

echo.
echo %BLUE%[PHASE-3] Python API Test%RESET%
echo ----------------------------------------

set "FREECAD_DIR="
for %%i in ("!FREECAD_PATH!") do set "FREECAD_DIR=%%~dpi"
set "FREECAD_PYTHON=!FREECAD_DIR!python.exe"

if not exist "!FREECAD_PYTHON!" (
    set "FREECAD_PYTHON=!FREECAD_DIR!bin\python.exe"
)

if not exist "!FREECAD_PYTHON!" (
    echo %YELLOW%[WARNING] FreeCAD Python bulunamadi, sistem Python kullanilacak%RESET%
    set "FREECAD_PYTHON=python"
)

echo %YELLOW%[TEST] FreeCAD Python API testi...%RESET%

REM Create test script
echo import sys > test_freecad.py
echo import os >> test_freecad.py
echo try: >> test_freecad.py
echo     import FreeCAD >> test_freecad.py
echo     print("FreeCAD API OK") >> test_freecad.py
echo except ImportError as e: >> test_freecad.py
echo     print("FreeCAD API ERROR: " + str(e)) >> test_freecad.py
echo     sys.exit(1) >> test_freecad.py

"!FREECAD_PYTHON!" test_freecad.py >test_output.txt 2>nul
if !errorlevel! == 0 (
    findstr "FreeCAD API OK" test_output.txt >nul
    if !errorlevel! == 0 (
        echo %GREEN%[OK] FreeCAD Python API calisiyor%RESET%
    ) else (
        echo %RED%[HATA] FreeCAD Python API calismiyor%RESET%
        echo.
        echo Test ciktisi:
        type test_output.txt
        echo.
        echo Bu hatayi gidermek icin:
        echo 1. FreeCAD'in dogru kuruldugunden emin olun
        echo 2. FreeCAD'i bir kez manuel olarak baslatip kapatin
        echo 3. Bu scripti yonetici olarak calistirmayi deneyin
        echo.
        del test_freecad.py test_output.txt 2>nul
        pause
        exit /b 1
    )
) else (
    echo %RED%[HATA] Python test scripti calismadi%RESET%
)

del test_freecad.py test_output.txt 2>nul

echo.
echo %BLUE%[PHASE-4] Dependency Installation%RESET%
echo ----------------------------------------

echo %YELLOW%[INSTALL] Python bagimliliklari kuruluyor...%RESET%

REM Install required packages
for %%P in (numpy tkinter requests) do (
    "!FREECAD_PYTHON!" -c "import %%P" >nul 2>&1
    if !errorlevel! == 0 (
        echo %GREEN%   [OK] %%P kuruldu%RESET%
    ) else (
        echo %YELLOW%   [WARNING] %%P zaten kurulu veya erisilebilir%RESET%
    )
)

echo.
echo %BLUE%[PHASE-5] Configuration Setup%RESET%
echo ----------------------------------------

echo %YELLOW%[CONFIG] Konfigurasyon dosyasi olusturuluyor...%RESET%

REM Update config.ini with detected paths
echo # FreeCAD Installation Paths > config.ini.temp
echo [FREECAD_INSTALLATION] >> config.ini.temp
echo path = !FREECAD_PATH! >> config.ini.temp
echo python_path = !FREECAD_PYTHON! >> config.ini.temp
echo version = !FREECAD_VERSION! >> config.ini.temp
echo install_date = %date% %time% >> config.ini.temp
echo. >> config.ini.temp

REM Append existing config.ini if exists
if exist config.ini (
    type config.ini >> config.ini.temp
    del config.ini
)

ren config.ini.temp config.ini

echo %GREEN%[OK] Konfigurasyon hazirlandi: config.ini%RESET%

REM Create directories
if not exist temp mkdir temp >nul 2>&1
if not exist output mkdir output >nul 2>&1

echo %GREEN%[SUCCESS] Kurulum tamamlandi!%RESET%
echo.
echo %BLUE%[SUMMARY] Kurulum Ozeti:%RESET%
echo ----------------------------------------
echo %GREEN%[OK] FreeCAD Yolu:%RESET% !FREECAD_PATH!
echo %GREEN%[OK] Python Yolu:%RESET% !FREECAD_PYTHON!
echo %GREEN%[OK] Konfigurasyon:%RESET% config.ini

echo.
echo %BLUE%Kullanim:%RESET%
echo 1. %YELLOW%CALISTIR.bat%RESET% - GUI arayuzunu baslatir
echo 2. %YELLOW%TEST.bat%RESET% - Sistem testlerini calistirir  

echo.
echo %GREEN%[SUCCESS] Kurulum basariyla tamamlandi!%RESET%

pause
endlocal
exit /b 0