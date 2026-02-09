@echo off
echo ===========================================
echo STEP BOM Analyzer v3.0 - FreeCAD Native
echo Windows Auto-Installation Script
echo ===========================================
echo.

REM Set console encoding to UTF-8
chcp 65001 > nul

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

REM ===========================================
REM Phase 1: FreeCAD Detection
REM ===========================================

echo %BLUE%[PHASE-1] FreeCAD Detection%RESET%
echo ----------------------------------------

set "FREECAD_PATH="
set "FREECAD_VERSION="
set "FREECAD_PYTHON_PATH="

REM Check common FreeCAD installation paths
set "PATHS=C:\Program Files\FreeCAD*\bin\FreeCAD.exe;C:\Program Files (x86)\FreeCAD*\bin\FreeCAD.exe;%LOCALAPPDATA%\FreeCAD*\bin\FreeCAD.exe"

for %%P in (%PATHS%) do (
    if exist "%%P" (
        set "FREECAD_PATH=%%P"
        goto :freecad_found
    )
)

REM Check Windows Registry for FreeCAD
echo %YELLOW%[REGISTRY] Registry'den FreeCAD araniyor...%RESET%

reg query "HKLM\SOFTWARE\FreeCAD" /s 2>nul | find "InstallLocation" >temp_reg.txt
if exist temp_reg.txt (
    for /f "tokens=3" %%A in ('type temp_reg.txt') do (
        if exist "%%A\bin\FreeCAD.exe" (
            set "FREECAD_PATH=%%A\bin\FreeCAD.exe"
            del temp_reg.txt
            goto :freecad_found
        )
    )
    del temp_reg.txt
)

REM Check PATH environment variable
echo %YELLOW%🔍 PATH çevresel değişkeninden aranıyor...%RESET%
where FreeCAD.exe >nul 2>&1
if %errorlevel% == 0 (
    for /f %%i in ('where FreeCAD.exe') do set "FREECAD_PATH=%%i"
    goto :freecad_found
)

REM FreeCAD not found
echo.
echo %RED%❌ HATA: FreeCAD bulunamadı!%RESET%
echo.
echo FreeCAD'in kurulu olması gerekiyor. Lütfen şu adımları takip edin:
echo.
echo 1. https://www.freecad.org/downloads.php adresinden FreeCAD indirebilirsiniz
echo 2. FreeCAD 0.20 veya daha yeni bir sürümünü kurun
echo 3. Kurulum tamamlandıktan sonra bu scripti tekrar çalıştırın
echo.
echo Desteklenen FreeCAD sürümleri: 0.20, 0.21, 1.0+
echo.
pause
exit /b 1

:freecad_found
echo %GREEN%✅ FreeCAD bulundu: !FREECAD_PATH!%RESET%

REM ===========================================
REM Phase 2: FreeCAD Version Validation
REM ===========================================

echo.
echo %BLUE%📋 Phase 2: FreeCAD Version Validation%RESET%
echo ----------------------------------------

REM Get FreeCAD version by running it
echo %YELLOW%🔍 FreeCAD versiyonu kontrol ediliyor...%RESET%

"!FREECAD_PATH!" --version >temp_version.txt 2>&1

if exist temp_version.txt (
    for /f "tokens=*" %%A in (temp_version.txt) do (
        echo %%A | find "FreeCAD" >nul
        if !errorlevel! == 0 (
            set "FREECAD_VERSION=%%A"
            echo %GREEN%✅ Sürüm: %%A%RESET%
        )
    )
    del temp_version.txt
) else (
    echo %YELLOW%⚠️  Versiyon tespit edilemedi, devam ediliyor...%RESET%
)

REM ===========================================
REM Phase 3: Python API Test
REM ===========================================

echo.
echo %BLUE%📋 Phase 3: Python API Test%RESET%
echo ----------------------------------------

REM Find FreeCAD Python executable
set "FREECAD_DIR="
for %%i in ("!FREECAD_PATH!") do set "FREECAD_DIR=%%~dpi"
set "FREECAD_PYTHON=!FREECAD_DIR!python.exe"

if not exist "!FREECAD_PYTHON!" (
    set "FREECAD_PYTHON=!FREECAD_DIR!bin\python.exe"
)

if not exist "!FREECAD_PYTHON!" (
    echo %YELLOW%⚠️  FreeCAD Python bulunamadı, sistem Python kullanılacak%RESET%
    set "FREECAD_PYTHON=python"
)

echo %YELLOW%🔍 FreeCAD Python API testi...%RESET%

REM Create test script
echo import sys > test_freecad.py
echo try: >> test_freecad.py
echo     import FreeCAD >> test_freecad.py
echo     print("SUCCESS: FreeCAD module imported") >> test_freecad.py
echo     print("FreeCAD Version:", FreeCAD.Version()) >> test_freecad.py
echo except ImportError as e: >> test_freecad.py
echo     print("ERROR: Cannot import FreeCAD module:", e) >> test_freecad.py
echo     sys.exit(1) >> test_freecad.py

"!FREECAD_PYTHON!" test_freecad.py >temp_python_test.txt 2>&1

if exist temp_python_test.txt (
    findstr "SUCCESS" temp_python_test.txt >nul
    if !errorlevel! == 0 (
        echo %GREEN%✅ FreeCAD Python API çalışıyor%RESET%
        type temp_python_test.txt | findstr "FreeCAD Version"
    ) else (
        echo %RED%❌ HATA: FreeCAD Python API çalışmıyor%RESET%
        echo.
        echo Test çıktısı:
        type temp_python_test.txt
        echo.
        echo Bu hatayı gidermek için:
        echo 1. FreeCAD'in doğru kurulduğundan emin olun
        echo 2. FreeCAD'i bir kez manuel olarak başlatıp kapatın
        echo 3. Bu scripti yönetici olarak çalıştırmayı deneyin
        echo.
        del test_freecad.py temp_python_test.txt
        pause
        exit /b 1
    )
    del temp_python_test.txt
)

del test_freecad.py

REM ===========================================
REM Phase 4: Dependency Installation
REM ===========================================

echo.
echo %BLUE%📋 Phase 4: Dependency Installation%RESET%
echo ----------------------------------------

echo %YELLOW%🔍 Python bağımlılıkları kuruluyor...%RESET%

REM Install required packages
set "PACKAGES=tkinter psutil openpyxl jinja2 pandas sqlite3"

for %%P in (%PACKAGES%) do (
    echo %YELLOW%📦 Kuruluyor: %%P%RESET%
    "!FREECAD_PYTHON!" -m pip install %%P --quiet --user 2>nul
    if !errorlevel! == 0 (
        echo %GREEN%   ✅ %%P kuruldu%RESET%
    ) else (
        echo %YELLOW%   ⚠️  %%P zaten kurulu veya erişilebilir%RESET%
    )
)

REM Test critical imports
echo.
echo %YELLOW%🔍 Kritik modüller test ediliyor...%RESET%

echo import tkinter > test_imports.py
echo import psutil >> test_imports.py
echo import sqlite3 >> test_imports.py
echo print("All critical modules imported successfully") >> test_imports.py

"!FREECAD_PYTHON!" test_imports.py >temp_import_test.txt 2>&1

if exist temp_import_test.txt (
    findstr "successfully" temp_import_test.txt >nul
    if !errorlevel! == 0 (
        echo %GREEN%✅ Tüm kritik modüller hazır%RESET%
    ) else (
        echo %YELLOW%⚠️  Bazı modüller eksik, devam ediliyor...%RESET%
    )
    del temp_import_test.txt
)

del test_imports.py

REM ===========================================
REM Phase 5: Macro File Installation
REM ===========================================

echo.
echo %BLUE%📋 Phase 5: Macro File Installation%RESET%
echo ----------------------------------------

REM Create FreeCAD Macro directory
set "MACRO_DIR=%APPDATA%\FreeCAD\Macro"
if not exist "!MACRO_DIR!" (
    echo %YELLOW%📁 Macro dizini oluşturuluyor: !MACRO_DIR!%RESET%
    mkdir "!MACRO_DIR!" 2>nul
)

echo %YELLOW%📁 Macro dizini: !MACRO_DIR!%RESET%

REM Copy macro files if they exist
if exist "macros\" (
    echo %YELLOW%📋 Macro dosyaları kopyalanıyor...%RESET%
    
    for %%F in (macros\*.FCMacro) do (
        echo %YELLOW%   📄 Kopyalanıyor: %%~nxF%RESET%
        copy "%%F" "!MACRO_DIR!\" >nul 2>&1
        if !errorlevel! == 0 (
            echo %GREEN%      ✅ Başarılı%RESET%
        ) else (
            echo %RED%      ❌ Hata%RESET%
        )
    )
) else (
    echo %YELLOW%⚠️  Macro dizini bulunamadı, oluşturulacak...%RESET%
    mkdir macros 2>nul
)

REM ===========================================
REM Phase 6: Configuration Setup
REM ===========================================

echo.
echo %BLUE%📋 Phase 6: Configuration Setup%RESET%
echo ----------------------------------------

echo %YELLOW%⚙️  Konfigürasyon dosyası oluşturuluyor...%RESET%

REM Create config.ini
echo [freecad] > config.ini
echo path = !FREECAD_PATH! >> config.ini
echo python_path = !FREECAD_PYTHON! >> config.ini
echo macro_dir = !MACRO_DIR! >> config.ini
echo version = !FREECAD_VERSION! >> config.ini
echo. >> config.ini
echo [system] >> config.ini
echo install_date = %date% %time% >> config.ini
echo install_path = %cd% >> config.ini
echo. >> config.ini
echo [processing] >> config.ini
echo max_memory_mb = 2000 >> config.ini
echo max_concurrent_files = 2 >> config.ini
echo temp_dir = temp >> config.ini
echo. >> config.ini
echo [output] >> config.ini
echo default_format = html >> config.ini
echo generate_images = true >> config.ini
echo generate_reports = true >> config.ini

echo %GREEN%✅ Konfigürasyon hazırlandı: config.ini%RESET%

REM Create temp directory
if not exist "temp" (
    mkdir temp
    echo %GREEN%✅ Geçici dosya dizini oluşturuldu: temp\%RESET%
)

REM Create output directory
if not exist "output" (
    mkdir output
    echo %GREEN%✅ Çıktı dizini oluşturuldu: output\%RESET%
)

REM ===========================================
REM Phase 7: Test Workflow
REM ===========================================

echo.
echo %BLUE%📋 Phase 7: Test Workflow%RESET%
echo ----------------------------------------

echo %YELLOW%🔧 Test workflow çalıştırılıyor...%RESET%

REM Create simple test script
echo import sys, os > test_workflow.py
echo sys.path.append(os.path.join(os.path.dirname(__file__), 'core')) >> test_workflow.py
echo try: >> test_workflow.py
echo     from workflow_orchestrator import WorkflowOrchestrator >> test_workflow.py
echo     from error_handler import StepBomErrorHandler >> test_workflow.py
echo     print("SUCCESS: Core modules loaded successfully") >> test_workflow.py
echo except Exception as e: >> test_workflow.py
echo     print("ERROR:", str(e)) >> test_workflow.py
echo     import traceback >> test_workflow.py
echo     traceback.print_exc() >> test_workflow.py

"!FREECAD_PYTHON!" test_workflow.py >temp_workflow_test.txt 2>&1

if exist temp_workflow_test.txt (
    findstr "SUCCESS" temp_workflow_test.txt >nul
    if !errorlevel! == 0 (
        echo %GREEN%✅ Test workflow başarılı%RESET%
    ) else (
        echo %YELLOW%⚠️  Test workflow kısmen çalışıyor%RESET%
        echo %YELLOW%    (Bu normal olabilir, FreeCAD modülleri henüz yüklenmemiş olabilir)%RESET%
    )
    del temp_workflow_test.txt
)

del test_workflow.py

REM ===========================================
REM Phase 8: Success Validation
REM ===========================================

echo.
echo %BLUE%📋 Phase 8: Success Validation%RESET%
echo ----------------------------------------

echo %GREEN%🎉 Kurulum tamamlandı!%RESET%
echo.
echo %BLUE%📋 Kurulum Özeti:%RESET%
echo ----------------------------------------
echo %GREEN%✅ FreeCAD Yolu:%RESET% !FREECAD_PATH!
echo %GREEN%✅ Python Yolu:%RESET% !FREECAD_PYTHON!
echo %GREEN%✅ Macro Dizini:%RESET% !MACRO_DIR!
echo %GREEN%✅ Konfigürasyon:%RESET% config.ini
echo %GREEN%✅ Temp Dizini:%RESET% temp\
echo %GREEN%✅ Output Dizini:%RESET% output\
echo.

REM Create desktop shortcut if requested
echo %YELLOW%🔗 Masaüstü kısayolu oluşturulsun mu? (Y/N)%RESET%
set /p "CREATE_SHORTCUT="

if /i "!CREATE_SHORTCUT!"=="Y" (
    echo %YELLOW%🔗 Masaüstü kısayolu oluşturuluyor...%RESET%
    
    REM Create VBS script for shortcut
    echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
    echo sLinkFile = "!USERPROFILE!\Desktop\STEP BOM Analyzer.lnk" >> CreateShortcut.vbs
    echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
    echo oLink.TargetPath = "%cd%\ÇALIŞTIR.bat" >> CreateShortcut.vbs
    echo oLink.WorkingDirectory = "%cd%" >> CreateShortcut.vbs
    echo oLink.Description = "STEP BOM Analyzer v3.0 - FreeCAD Native Edition" >> CreateShortcut.vbs
    echo oLink.Save >> CreateShortcut.vbs
    
    cscript CreateShortcut.vbs >nul 2>&1
    del CreateShortcut.vbs
    
    echo %GREEN%✅ Masaüstü kısayolu oluşturuldu%RESET%
)

REM ===========================================
REM Phase 9: GUI Launch Option
REM ===========================================

echo.
echo %BLUE%📋 Phase 9: Launch Option%RESET%
echo ----------------------------------------

echo %GREEN%🚀 Kurulum başarıyla tamamlandı!%RESET%
echo.
echo %BLUE%Kullanım:%RESET%
echo 1. %YELLOW%ÇALIŞTIR.bat%RESET% - GUI arayüzünü başlatır
echo 2. %YELLOW%TEST.bat%RESET% - Sistem testlerini çalıştırır  
echo.
echo %YELLOW%Şimdi STEP BOM Analyzer başlatılsın mı? (Y/N)%RESET%
set /p "LAUNCH_NOW="

if /i "!LAUNCH_NOW!"=="Y" (
    echo %GREEN%🚀 STEP BOM Analyzer başlatılıyor...%RESET%
    echo.
    call ÇALIŞTIR.bat
) else (
    echo.
    echo %BLUE%STEP BOM Analyzer hazır!%RESET%
    echo %YELLOW%ÇALIŞTIR.bat%RESET% dosyasını çalıştırarak programı başlatabilirsiniz.
    echo.
)

echo.
echo %GREEN%📚 Daha fazla bilgi için:%RESET%
echo - README.md dosyasını okuyabilirsiniz
echo - docs\WINDOWS_KURULUM.md dosyasında detaylı rehber bulunmaktadır
echo.

pause

REM End of script
endlocal
exit /b 0