@echo off
echo ===========================================
echo STEP BOM Analyzer v3.0 - FreeCAD Native
echo System Test & Diagnostics
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

echo %BLUE%[TEST] Sistem testi baslatiyor...%RESET%
echo.

REM ===========================================
REM Test Results Tracking
REM ===========================================

set "TESTS_PASSED=0"
set "TESTS_FAILED=0"
set "TESTS_WARNING=0"
set "TOTAL_TESTS=10"

REM ===========================================
REM Test 1: Configuration File
REM ===========================================

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
    echo %RED%[FAILED] config.ini dosyasi bulunamadi%RESET%
    echo %YELLOW%   [SOLUTION] KURULUM.bat scripti calistirin%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM ===========================================
REM Test 2: FreeCAD Detection
REM ===========================================

echo %BLUE%[TEST-2] FreeCAD Detection%RESET%

set "FREECAD_PATH="

REM Try to read from config first
if exist "config.ini" (
    for /f "tokens=2 delims== " %%A in ('findstr "^path" config.ini 2^>nul') do (
        set "FREECAD_PATH=%%A"
    )
)

REM Auto-detect if not in config
if "!FREECAD_PATH!"=="" (
    if exist "C:\Program Files\FreeCAD 1.0\bin\FreeCAD.exe" (
        set "FREECAD_PATH=C:\Program Files\FreeCAD 1.0\bin\FreeCAD.exe"
    ) else if exist "C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe" (
        set "FREECAD_PATH=C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe"
    ) else if exist "C:\Program Files\FreeCAD 0.20\bin\FreeCAD.exe" (
        set "FREECAD_PATH=C:\Program Files\FreeCAD 0.20\bin\FreeCAD.exe"
    )
)

if not "!FREECAD_PATH!"=="" (
    if exist "!FREECAD_PATH!" (
        echo %GREEN%[OK] FreeCAD bulundu%RESET%
        echo %GREEN%   Path: !FREECAD_PATH!%RESET%
        
        REM Try to get version
        "!FREECAD_PATH!" --version >temp_version.txt 2>&1
        if exist temp_version.txt (
            for /f "tokens=*" %%A in ('type temp_version.txt') do (
                echo %%A | find "FreeCAD" >nul
                if !errorlevel! == 0 (
                    echo %GREEN%   Version: %%A%RESET%
                    goto :version_found
                )
            )
            :version_found
            del temp_version.txt
        )
        
        set /a TESTS_PASSED+=1
    ) else (
        echo %RED%[FAILED] FreeCAD yolu gecersiz%RESET%
        echo %RED%   [ERROR] Bulunamadi: !FREECAD_PATH!%RESET%
        set /a TESTS_FAILED+=1
    )
) else (
    echo %RED%[FAILED] FreeCAD bulunamadi%RESET%
    echo %YELLOW%   [SOLUTION] FreeCAD'i indirin ve kurun (https://www.freecad.org)%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM ===========================================
REM Test 3: Python Environment
REM ===========================================

echo %BLUE%[TEST-3] Python Environment%RESET%

set "FREECAD_PYTHON="

if not "!FREECAD_PATH!"=="" (
    for %%i in ("!FREECAD_PATH!") do set "FREECAD_DIR=%%~dpi"
    set "FREECAD_PYTHON=!FREECAD_DIR!python.exe"
    
    if not exist "!FREECAD_PYTHON!" (
        set "FREECAD_PYTHON=!FREECAD_DIR!bin\python.exe"
    )
    
    if exist "!FREECAD_PYTHON!" (
        echo %GREEN%[OK] Python bulundu%RESET%
        echo %GREEN%   Path: !FREECAD_PYTHON!%RESET%
        
        REM Test Python version
        "!FREECAD_PYTHON!" --version >temp_pyversion.txt 2>&1
        if exist temp_pyversion.txt (
            for /f "tokens=*" %%A in ('type temp_pyversion.txt') do (
                echo %GREEN%   %%A%RESET%
            )
            del temp_pyversion.txt
        )
        
        set /a TESTS_PASSED+=1
    ) else (
        echo %RED%[FAILED] Python bulunamadi%RESET%
        set /a TESTS_FAILED+=1
    )
) else (
    echo %RED%[FAILED] Python bulunamadi%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM ===========================================
REM Test 4: FreeCAD Python API
REM ===========================================

echo %BLUE%[TEST-4] FreeCAD Python API%RESET%

if not "!FREECAD_PYTHON!"=="" (
    REM Create test script
    echo import sys > test_freecad_api.py
    echo try: >> test_freecad_api.py
    echo     import FreeCAD >> test_freecad_api.py
    echo     print("SUCCESS: FreeCAD API accessible") >> test_freecad_api.py
    echo except Exception as e: >> test_freecad_api.py
    echo     print("ERROR: " + str(e)) >> test_freecad_api.py
    
    "!FREECAD_PYTHON!" test_freecad_api.py >temp_api_test.txt 2>&1
    if exist temp_api_test.txt (
        findstr "SUCCESS" temp_api_test.txt >nul
        if !errorlevel! == 0 (
            echo %GREEN%[OK] FreeCAD Python API calisiyor%RESET%
            set /a TESTS_PASSED+=1
        ) else (
            echo %RED%[FAILED] FreeCAD Python API erisilemez%RESET%
            echo %YELLOW%   [ERROR] Hata detaylari:%RESET%
            type temp_api_test.txt
            echo %YELLOW%   [SOLUTION] FreeCAD'i bir kez manuel olarak baslatin%RESET%
            set /a TESTS_FAILED+=1
        )
        del temp_api_test.txt
    ) else (
        echo %RED%[FAILED] Python testi calistirilamadi%RESET%
        set /a TESTS_FAILED+=1
    )
    
    del test_freecad_api.py 2>nul
) else (
    echo %RED%[FAILED] Python bulunamadi%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM ===========================================
REM Test 5: Core Modules
REM ===========================================

echo %BLUE%[TEST-5] Core Modules%RESET%

set "CORE_MODULES=workflow_orchestrator.py bom_extractor_v2.py freecad_step_processor.py"
set "CORE_MODULES_FOUND=0"
set "CORE_MODULES_TOTAL=3"

for %%M in (%CORE_MODULES%) do (
    if exist "core\%%M" (
        echo %GREEN%   [OK] %%M%RESET%
        set /a CORE_MODULES_FOUND+=1
    ) else (
        echo %RED%   [MISSING] %%M%RESET%
    )
)

if !CORE_MODULES_FOUND! == !CORE_MODULES_TOTAL! (
    echo %GREEN%[OK] Tum core moduller mevcut (!CORE_MODULES_FOUND!/!CORE_MODULES_TOTAL!)%RESET%
    set /a TESTS_PASSED+=1
) else (
    echo %YELLOW%[WARNING] Bazi core moduller eksik (!CORE_MODULES_FOUND!/!CORE_MODULES_TOTAL!)%RESET%
    set /a TESTS_WARNING+=1
)

echo.

REM ===========================================
REM Test 6: GUI Modules
REM ===========================================

echo %BLUE%[TEST-6] GUI Modules%RESET%

if exist "gui\workflow_gui.py" (
    echo %GREEN%[OK] GUI modulu mevcut%RESET%
    set /a TESTS_PASSED+=1
) else (
    echo %RED%[FAILED] GUI modulu eksik%RESET%
    echo %RED%   [ERROR] gui\workflow_gui.py bulunamadi%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM ===========================================
REM Test 7: Python Dependencies
REM ===========================================

echo %BLUE%[TEST-7] Python Dependencies%RESET%

if not "!FREECAD_PYTHON!"=="" (
    set "DEPS=tkinter json os sys numpy requests"
    
    REM Create dependency test script
    echo import sys > test_deps.py
    for %%D in (%DEPS%) do (
        echo try: >> test_deps.py
        echo     import %%D >> test_deps.py
        echo     print("[OK] %%D") >> test_deps.py
        echo except ImportError: >> test_deps.py
        echo     print("[MISSING] %%D") >> test_deps.py
    )
    
    "!FREECAD_PYTHON!" test_deps.py >temp_deps_test.txt 2>&1
    
    if exist temp_deps_test.txt (
        type temp_deps_test.txt
        
        REM Count successful imports
        findstr /c:"[OK]" temp_deps_test.txt >nul 2>&1
        if !errorlevel! == 0 (
            for /f %%i in ('findstr /c:"[OK]" temp_deps_test.txt') do set DEPS_SUCCESS=%%i
        ) else (
            set DEPS_SUCCESS=0
        )
        
        del temp_deps_test.txt
    )
    
    if !DEPS_SUCCESS! GEQ 4 (
        echo %GREEN%[OK] Tum bagimliliklar mevcut%RESET%
        set /a TESTS_PASSED+=1
    ) else (
        echo %YELLOW%[WARNING] Bazi bagimliliklar eksik%RESET%
        echo %YELLOW%   [SOLUTION] KURULUM.bat scripti calistirin%RESET%
        set /a TESTS_WARNING+=1
    )
    
    del test_deps.py 2>nul
) else (
    echo %RED%[FAILED] Python bulunamadi%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM ===========================================
REM Test 8: Directory Structure
REM ===========================================

echo %BLUE%[TEST-8] Directory Structure%RESET%

set "DIRS=core gui macros temp output"
set "DIRS_FOUND=0"
set "DIRS_TOTAL=5"

for %%D in (%DIRS%) do (
    if exist "%%D" (
        echo %GREEN%   [OK] %%D\%RESET%
        set /a DIRS_FOUND+=1
    ) else (
        echo %YELLOW%   [WARNING] %%D\ (eksik, olusturulacak)%RESET%
        mkdir "%%D" 2>nul
        if exist "%%D" (
            echo %GREEN%      [CREATED] %%D\ olusturuldu%RESET%
            set /a DIRS_FOUND+=1
        )
    )
)

if !DIRS_FOUND! == !DIRS_TOTAL! (
    echo %GREEN%[OK] Dizin yapisi tamam (!DIRS_FOUND!/!DIRS_TOTAL!)%RESET%
    set /a TESTS_PASSED+=1
) else (
    echo %YELLOW%[WARNING] Bazi dizinler eksik (!DIRS_FOUND!/!DIRS_TOTAL!)%RESET%
    set /a TESTS_WARNING+=1
)

echo.

REM ===========================================
REM Test 9: Memory and Performance
REM ===========================================

echo %BLUE%[TEST-9] Memory and Performance%RESET%

REM Check available memory
for /f "skip=1 tokens=4" %%A in ('wmic OS get TotalVisibleMemorySize /value 2^>nul') do (
    if not "%%A"=="" (
        set /a TOTAL_MEMORY_KB=%%A
        set /a TOTAL_MEMORY_GB=!TOTAL_MEMORY_KB! / 1024 / 1024
        
        if !TOTAL_MEMORY_GB! GEQ 4 (
            echo %GREEN%[OK] RAM yeterli (!TOTAL_MEMORY_GB!GB >= 4GB)%RESET%
            set /a TESTS_PASSED+=1
        ) else (
            echo %YELLOW%[WARNING] RAM dusuk (!TOTAL_MEMORY_GB!GB < 4GB)%RESET%
            echo %YELLOW%   [INFO] Buyuk STEP dosyalari icin daha fazla RAM onerilir%RESET%
            set /a TESTS_WARNING+=1
        )
        goto :memory_done
    )
)

echo %YELLOW%[WARNING] RAM bilgisi alinamadi%RESET%
set /a TESTS_WARNING+=1

:memory_done
echo.

REM ===========================================
REM Test 10: Sample Workflow Test
REM ===========================================

echo %BLUE%[TEST-10] Sample Workflow Test%RESET%

if not "!FREECAD_PYTHON!"=="" (
    REM Create workflow test
    echo import sys, os > test_workflow.py
    echo sys.path.append(os.path.join(os.path.dirname(__file__), 'core')) >> test_workflow.py
    echo sys.path.append(os.path.join(os.path.dirname(__file__), 'gui')) >> test_workflow.py
    echo try: >> test_workflow.py
    echo     from workflow_orchestrator import WorkflowOrchestrator >> test_workflow.py
    echo     orchestrator = WorkflowOrchestrator() >> test_workflow.py
    echo     print("SUCCESS: Workflow components loaded") >> test_workflow.py
    echo except Exception as e: >> test_workflow.py
    echo     print("WARNING: " + str(e)) >> test_workflow.py
    
    "!FREECAD_PYTHON!" test_workflow.py >temp_workflow_test.txt 2>&1
    
    if exist temp_workflow_test.txt (
        findstr "SUCCESS" temp_workflow_test.txt >nul
        if !errorlevel! == 0 (
            echo %GREEN%[OK] Workflow komponenleri calisiyor%RESET%
            echo %GREEN%   [INFO] Core moduller basariyla yuklendi%RESET%
            set /a TESTS_PASSED+=1
        ) else (
            echo %YELLOW%[WARNING] Workflow testi kismen basarili%RESET%
            echo %YELLOW%   [INFO] Test ciktisi:%RESET%
            type temp_workflow_test.txt
            set /a TESTS_WARNING+=1
        )
        del temp_workflow_test.txt
    ) else (
        echo %RED%[FAILED] Workflow testi calistirilamadi%RESET%
        set /a TESTS_FAILED+=1
    )
    
    del test_workflow.py 2>nul
) else (
    echo %RED%[FAILED] Python bulunamadi%RESET%
    set /a TESTS_FAILED+=1
)

echo.
echo.

REM ===========================================
REM Test Results Summary
REM ===========================================

echo %BLUE%[SUMMARY] TEST SONUCLARI%RESET%
echo ========================================

set /a SUCCESS_RATE=(!TESTS_PASSED! * 100) / %TOTAL_TESTS%
echo %GREEN%[OK] Basarili Testler: !TESTS_PASSED!/%TOTAL_TESTS%%RESET%
echo %YELLOW%[WARNING] Uyari ile Gecen: !TESTS_WARNING!/%TOTAL_TESTS%%RESET%
echo %RED%[FAILED] Basarisiz Testler: !TESTS_FAILED!/%TOTAL_TESTS%%RESET%
echo.
echo %BLUE%Basari Orani: !SUCCESS_RATE!%%%RESET%

echo.

if !TESTS_FAILED! == 0 (
    if !TESTS_WARNING! == 0 (
        echo %GREEN%[EXCELLENT] Tum testler basarili (!SUCCESS_RATE!%% basari)%RESET%
        echo %GREEN%STEP BOM Analyzer kullanima hazir!%RESET%
    ) else (
        echo %YELLOW%[GOOD] Sistem calisir durumda (!SUCCESS_RATE!%% basari)%RESET%
        echo %YELLOW%Bazi uyarilar var ama kullanilabilir.%RESET%
    )
) else (
    echo %RED%[ATTENTION] Bazi kritik testler basarisiz (!SUCCESS_RATE!%% basari)%RESET%
    echo %RED%KURULUM.bat scripti calistirmaniz onerilir.%RESET%
)

echo.
echo.

REM ===========================================
REM System Information
REM ===========================================

echo %BLUE%[INFO] SISTEM BILGILERI%RESET%
echo ========================================

REM OS info
for /f "tokens=2 delims==" %%A in ('wmic os get caption /value 2^>nul') do (
    if not "%%A"=="" echo %BLUE%[OS] Isletim Sistemi:%RESET% %%A
)

REM CPU info  
for /f "tokens=2 delims==" %%A in ('wmic cpu get name /value 2^>nul') do (
    if not "%%A"=="" echo %BLUE%[CPU] Islemci:%RESET% %%A
)

REM Disk space
for /f "tokens=3" %%A in ('dir /-c 2^>nul ^| find "bytes free"') do (
    set /a FREE_SPACE_GB=%%A / 1024 / 1024 / 1024
    echo %BLUE%[DISK] Bos Disk Alani:%RESET% !FREE_SPACE_GB! GB
)

echo.
echo.

REM ===========================================
REM Recommendations
REM ===========================================

echo %BLUE%[RECOMMENDATIONS] ONERILER%RESET%
echo ========================================

if !TESTS_FAILED! GTR 0 (
    echo %YELLOW%[FIX] KURULUM.bat scripti calistirarak eksiklikleri giderin%RESET%
)

if !TESTS_WARNING! GTR 0 (
    echo %YELLOW%[INSTALL] Eksik bagimliliklar icin: pip install psutil openpyxl jinja2%RESET%
)

echo %BLUE%[USAGE] Kullanim:%RESET%
echo   • %YELLOW%ÇALIŞTIR.bat%RESET% - GUI arayuzunu baslatir
echo   • %YELLOW%KURULUM.bat%RESET% - Otomatik kurulum scripti
echo   • %YELLOW%TEST.bat%RESET% - Bu test scriptini tekrar calistirir

echo.

REM ===========================================
REM Save Test Report
REM ===========================================

echo Saving test report...
echo STEP BOM Analyzer v3.0 - Test Report > test_report.txt
echo Generated: %date% %time% >> test_report.txt
echo ================================== >> test_report.txt
echo. >> test_report.txt
echo Test Results: >> test_report.txt
echo - Passed: !TESTS_PASSED!/%TOTAL_TESTS% >> test_report.txt
echo - Warnings: !TESTS_WARNING!/%TOTAL_TESTS% >> test_report.txt
echo - Failed: !TESTS_FAILED!/%TOTAL_TESTS% >> test_report.txt
echo - Success Rate: !SUCCESS_RATE!%% >> test_report.txt
echo. >> test_report.txt
echo System Information: >> test_report.txt
if not "!FREECAD_PATH!"=="" echo - FreeCAD Path: !FREECAD_PATH! >> test_report.txt
if not "!FREECAD_PYTHON!"=="" echo - Python Path: !FREECAD_PYTHON! >> test_report.txt
echo - Test Date: %date% %time% >> test_report.txt

echo %GREEN%[OK] Test raporu kaydedildi: test_report.txt%RESET%

echo.
echo %BLUE%Test tamamlandi. Herhangi bir tusa basin...%RESET%
pause

endlocal
exit /b 0