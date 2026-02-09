@echo off
echo ========================================
echo   STEP BOM Analyzer Windows Setup
echo ========================================
echo.

echo [1/4] Windows klasoru olusturuluyor...

set "TARGET_DIR=C:\Users\%USERNAME%\Desktop\STEP_BOM_Analyzer"

if exist "%TARGET_DIR%" (
    echo ✅ Klasor zaten mevcut: %TARGET_DIR%
) else (
    mkdir "%TARGET_DIR%"
    echo ✅ Klasor olusturuldu: %TARGET_DIR%
)

echo.
echo [2/4] WSL dosyalari kopyalaniyor...

REM WSL path kontrolu
set "WSL_PATH=\\wsl.localhost\Ubuntu\home\irfan\projeler\URTMtakip\STEP_BOM_Analyzer"

if exist "%WSL_PATH%" (
    echo ✅ WSL klasoru bulundu
    
    REM PowerShell ile kopyala
    powershell -Command "Copy-Item -Recurse '%WSL_PATH%\*' '%TARGET_DIR%\' -Force"
    
    echo ✅ Dosyalar kopyalandi
) else (
    echo ❌ WSL klasoru bulunamadi: %WSL_PATH%
    echo.
    echo Manuel kopyalama gerekli:
    echo 1. File Explorer'da su adresi acin:
    echo    \\wsl.localhost\Ubuntu\home\irfan\projeler\URTMtakip\STEP_BOM_Analyzer
    echo 2. Tum dosyalari secin ve kopyalayin
    echo 3. Su klasore yapistiirin: %TARGET_DIR%
    echo.
    pause
    exit /b 1
)

echo.
echo [3/4] FreeCAD Python test ediliyor...

REM FreeCAD Python yolunu bul
set "FREECAD_PYTHON="

if exist "C:\Program Files\FreeCAD 1.0\bin\python.exe" (
    set "FREECAD_PYTHON=C:\Program Files\FreeCAD 1.0\bin\python.exe"
    echo ✅ FreeCAD Python bulundu: FreeCAD 1.0
) else if exist "C:\Program Files\FreeCAD 0.21\bin\python.exe" (
    set "FREECAD_PYTHON=C:\Program Files\FreeCAD 0.21\bin\python.exe"
    echo ✅ FreeCAD Python bulundu: FreeCAD 0.21
) else (
    echo ❌ FreeCAD Python bulunamadi!
    echo FreeCAD kurulumunu kontrol edin: https://www.freecadweb.org/
    pause
    exit /b 1
)

echo.
echo [4/4] Python bagimliliklari kuruluyor...

cd /d "%TARGET_DIR%"
"%FREECAD_PYTHON%" -m pip install -r requirements.txt --quiet

if errorlevel 1 (
    echo ⚠️ Bazi bagimliliklar kurulamadi, devam ediliyor...
) else (
    echo ✅ Bagimliliklar kuruldu
)

echo.
echo ========================================
echo      🎉 Kurulum Tamamlandi!
echo ========================================
echo.
echo Windows klasoru: %TARGET_DIR%
echo.
echo Calistirma secenekleri:
echo 🚀 ÇALIŞTIR.bat      - Ana GUI (cift tiklayin)
echo 🧪 TEST.bat           - Sistem testi
echo 🐍 START_GUI.py       - Python GUI
echo.
echo Simdiki klasor: %TARGET_DIR%
echo.

REM Kullaniciya secim sun
echo Ne yapmak istiyorsunuz?
echo [1] GUI'yi baslatir (ÇALIŞTIR.bat)
echo [2] Test yapar (TEST.bat)
echo [3] Windows klasorunu acar
echo [4] Cikis
echo.

choice /C 1234 /N /M "Seciminiz (1-4): "

if errorlevel 4 goto :exit
if errorlevel 3 goto :open_folder
if errorlevel 2 goto :run_test
if errorlevel 1 goto :run_gui

:run_gui
echo GUI baslatilic...
call ÇALIŞTIR.bat
goto :exit

:run_test
echo Test baslatilic...
call TEST.bat
goto :exit

:open_folder
echo Windows klasoru aciliyor...
explorer "%TARGET_DIR%"
goto :exit

:exit
echo.
echo Kurulum ve test tamamlandi!
pause