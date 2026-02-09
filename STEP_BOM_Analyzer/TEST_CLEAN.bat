@echo off
echo ===========================================
echo STEP BOM Analyzer v3.0 - FreeCAD Native
echo System Test
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

echo %BLUE%[TEST] Sistem testi baslatiyor...%RESET%
echo.

REM Test Results Tracking
set "TESTS_PASSED=0"
set "TESTS_FAILED=0" 
set "TESTS_WARNING=0"
set "TOTAL_TESTS=8"

REM Test 1: Configuration File
echo %BLUE%[TEST-1] Configuration File%RESET%

if exist "config.ini" (
    echo %GREEN%[OK] config.ini dosyasi mevcut%RESET%
    set /a TESTS_PASSED+=1
    
    REM Check FreeCAD specific config
    findstr "path" config.ini >nul
    if !errorlevel! == 0 (
        echo %GREEN%   [OK] FreeCAD konfigurasyonu mevcut%RESET%
    ) else (
        echo %YELLOW%   [WARNING] FreeCAD konfigurasyonu eksik%RESET%
        set /a TESTS_WARNING+=1
    )
) else (
    echo %RED%[FAIL] config.ini dosyasi bulunamadi%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM Test 2: FreeCAD Detection
echo %BLUE%[TEST-2] FreeCAD Detection%RESET%

set "FREECAD_PATH="

REM Check common FreeCAD installation paths
if exist "C:\Program Files\FreeCAD 1.0\bin\FreeCAD.exe" (
    set "FREECAD_PATH=C:\Program Files\FreeCAD 1.0\bin\FreeCAD.exe"
) else if exist "C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe" (
    set "FREECAD_PATH=C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe"
) else if exist "C:\Program Files\FreeCAD 0.20\bin\FreeCAD.exe" (
    set "FREECAD_PATH=C:\Program Files\FreeCAD 0.20\bin\FreeCAD.exe"
) else if exist "C:\Program Files (x86)\FreeCAD 1.0\bin\FreeCAD.exe" (
    set "FREECAD_PATH=C:\Program Files (x86)\FreeCAD 1.0\bin\FreeCAD.exe"
)

if not "!FREECAD_PATH!"=="" (
    echo %GREEN%[OK] FreeCAD bulundu: !FREECAD_PATH!%RESET%
    set /a TESTS_PASSED+=1
) else (
    echo %RED%[FAIL] FreeCAD bulunamadi%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM Test 3: Python API Test  
echo %BLUE%[TEST-3] Python API Test%RESET%

if not "!FREECAD_PATH!"=="" (
    set "FREECAD_DIR="
    for %%i in ("!FREECAD_PATH!") do set "FREECAD_DIR=%%~dpi"
    set "FREECAD_PYTHON=!FREECAD_DIR!python.exe"
    
    if exist "!FREECAD_PYTHON!" (
        echo %GREEN%[OK] FreeCAD Python bulundu: !FREECAD_PYTHON!%RESET%
        
        REM Test FreeCAD import
        echo import sys > test_api.py
        echo try: >> test_api.py
        echo     import FreeCAD >> test_api.py
        echo     print("API_TEST_OK") >> test_api.py
        echo except Exception as e: >> test_api.py
        echo     print("API_TEST_FAIL: " + str(e)) >> test_api.py
        
        "!FREECAD_PYTHON!" test_api.py >api_result.txt 2>&1
        findstr "API_TEST_OK" api_result.txt >nul
        if !errorlevel! == 0 (
            echo %GREEN%[OK] FreeCAD API calisiyor%RESET%
            set /a TESTS_PASSED+=1
        ) else (
            echo %RED%[FAIL] FreeCAD API calismiyor%RESET%
            echo %YELLOW%   Detay: %RESET%
            type api_result.txt
            set /a TESTS_FAILED+=1
        )
        
        del test_api.py api_result.txt 2>nul
    ) else (
        echo %RED%[FAIL] FreeCAD Python bulunamadi%RESET%
        set /a TESTS_FAILED+=1
    )
) else (
    echo %RED%[SKIP] FreeCAD bulunamadigi icin Python testi atlandI%RESET%
    set /a TESTS_WARNING+=1
)

echo.

REM Test 4: Core Modules
echo %BLUE%[TEST-4] Core Modules%RESET%

if exist "core\workflow_orchestrator.py" (
    echo %GREEN%[OK] workflow_orchestrator.py mevcut%RESET%
    set /a TESTS_PASSED+=1
) else (
    echo %RED%[FAIL] workflow_orchestrator.py eksik%RESET%
    set /a TESTS_FAILED+=1
)

if exist "gui\workflow_gui.py" (
    echo %GREEN%[OK] workflow_gui.py mevcut%RESET%
    set /a TESTS_PASSED+=1
) else (
    echo %RED%[FAIL] workflow_gui.py eksik%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM Test 5: Directory Structure
echo %BLUE%[TEST-5] Directory Structure%RESET%

set "MISSING_DIRS="

if not exist "temp" (
    mkdir temp >nul 2>&1
    if exist "temp" (
        echo %GREEN%[OK] temp dizini olusturuldu%RESET%
    ) else (
        echo %RED%[FAIL] temp dizini olusturulamadi%RESET%
        set "MISSING_DIRS=!MISSING_DIRS! temp"
        set /a TESTS_FAILED+=1
    )
) else (
    echo %GREEN%[OK] temp dizini mevcut%RESET%
    set /a TESTS_PASSED+=1
)

if not exist "output" (
    mkdir output >nul 2>&1
    if exist "output" (
        echo %GREEN%[OK] output dizini olusturuldu%RESET%
    ) else (
        echo %RED%[FAIL] output dizini olusturulamadi%RESET%
        set "MISSING_DIRS=!MISSING_DIRS! output"
        set /a TESTS_FAILED+=1
    )
) else (
    echo %GREEN%[OK] output dizini mevcut%RESET%
    set /a TESTS_PASSED+=1
)

echo.

REM Test 6: Python Dependencies
echo %BLUE%[TEST-6] Python Dependencies%RESET%

if not "!FREECAD_PYTHON!"=="" (
    for %%P in (tkinter json os sys) do (
        "!FREECAD_PYTHON!" -c "import %%P" >nul 2>&1
        if !errorlevel! == 0 (
            echo %GREEN%[OK] %%P modulu hazir%RESET%
        ) else (
            echo %RED%[FAIL] %%P modulu eksik%RESET%
            set /a TESTS_FAILED+=1
        )
    )
    set /a TESTS_PASSED+=1
) else (
    echo %RED%[SKIP] Python bulunamadigi icin bagimlilık testi atlandI%RESET%
    set /a TESTS_WARNING+=1
)

echo.

REM Test Results Summary
echo %BLUE%[SUMMARY] Test Sonuclari%RESET%
echo ========================================
echo %GREEN%Basarili testler: !TESTS_PASSED!%RESET%
echo %YELLOW%Uyari ile gecen: !TESTS_WARNING!%RESET%  
echo %RED%Basarisiz testler: !TESTS_FAILED!%RESET%
echo ----------------------------------------
echo %BLUE%Toplam test: !TOTAL_TESTS!%RESET%

if !TESTS_FAILED! == 0 (
    if !TESTS_WARNING! == 0 (
        echo.
        echo %GREEN%[SUCCESS] Tum testler basarili! Sistem hazir.%RESET%
        echo %GREEN%Simdi CALISTIR.bat ile GUI baslatabilirsiniz.%RESET%
    ) else (
        echo.
        echo %YELLOW%[WARNING] Bazi uyarilar var ama sistem kullanilabilir.%RESET%
        echo %YELLOW%CALISTIR.bat ile GUI baslatmayi deneyin.%RESET%
    )
) else (
    echo.
    echo %RED%[ERROR] Kritik hatalar var. Lutfen sorunlari giderin.%RESET%
    echo %RED%KURULUM.bat scripti tekrar calistirilabilir.%RESET%
)

echo.
pause
endlocal
exit /b 0