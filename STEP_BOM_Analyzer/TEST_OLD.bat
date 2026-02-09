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

echo %BLUE%📋 Test 1: Configuration File%RESET%
echo ----------------------------------------

if exist "config.ini" (
    echo %GREEN%✅ BAŞARILI: config.ini dosyası mevcut%RESET%
    set /a TESTS_PASSED+=1
    
    REM Check config content
    findstr "freecad" config.ini >nul 2>&1
    if !errorlevel! == 0 (
        echo %GREEN%   ✅ FreeCAD konfigürasyonu mevcut%RESET%
    ) else (
        echo %YELLOW%   ⚠️  FreeCAD konfigürasyonu eksik%RESET%
        set /a TESTS_WARNING+=1
    )
) else (
    echo %RED%❌ BAŞARISIZ: config.ini dosyası bulunamadı%RESET%
    echo %YELLOW%   💡 Çözüm: KURULUM.bat scripti çalıştırın%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM ===========================================
REM Test 2: FreeCAD Detection
REM ===========================================

echo %BLUE%📋 Test 2: FreeCAD Detection%RESET%
echo ----------------------------------------

set "FREECAD_PATH="

if exist "config.ini" (
    for /f "tokens=2 delims== " %%A in ('findstr "^path" config.ini') do (
        set "FREECAD_PATH=%%A"
    )
)

if "!FREECAD_PATH!"=="" (
    REM Try manual detection
    set "PATHS=C:\Program Files\FreeCAD*\bin\FreeCAD.exe;C:\Program Files (x86)\FreeCAD*\bin\FreeCAD.exe"
    for %%P in (!PATHS!) do (
        if exist "%%P" (
            set "FREECAD_PATH=%%P"
            goto :freecad_test_found
        )
    )
)

:freecad_test_found
if not "!FREECAD_PATH!"=="" (
    if exist "!FREECAD_PATH!" (
        echo %GREEN%✅ BAŞARILI: FreeCAD bulundu%RESET%
        echo %GREEN%   📁 Yol: !FREECAD_PATH!%RESET%
        set /a TESTS_PASSED+=1
        
        REM Test FreeCAD version
        "!FREECAD_PATH!" --version >temp_version_test.txt 2>&1
        if exist temp_version_test.txt (
            for /f "tokens=*" %%A in (temp_version_test.txt) do (
                echo %%A | find "FreeCAD" >nul
                if !errorlevel! == 0 (
                    echo %GREEN%   📦 %%A%RESET%
                )
            )
            del temp_version_test.txt
        )
    ) else (
        echo %RED%❌ BAŞARISIZ: FreeCAD yolu geçersiz%RESET%
        echo %RED%   📁 Bulunamadı: !FREECAD_PATH!%RESET%
        set /a TESTS_FAILED+=1
    )
) else (
    echo %RED%❌ BAŞARISIZ: FreeCAD bulunamadı%RESET%
    echo %YELLOW%   💡 Çözüm: FreeCAD'i indirin ve kurun (https://www.freecad.org)%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM ===========================================
REM Test 3: Python Environment
REM ===========================================

echo %BLUE%📋 Test 3: Python Environment%RESET%
echo ----------------------------------------

set "FREECAD_PYTHON="

if exist "config.ini" (
    for /f "tokens=2 delims== " %%A in ('findstr "^python_path" config.ini') do (
        set "FREECAD_PYTHON=%%A"
    )
)

if "!FREECAD_PYTHON!"=="" (
    set "FREECAD_PYTHON=python"
)

"!FREECAD_PYTHON!" --version >temp_python_test.txt 2>&1

if exist temp_python_test.txt (
    for /f "tokens=*" %%A in (temp_python_test.txt) do (
        echo %%A | find "Python" >nul
        if !errorlevel! == 0 (
            echo %GREEN%✅ BAŞARILI: Python bulundu%RESET%
            echo %GREEN%   🐍 %%A%RESET%
            set /a TESTS_PASSED+=1
        )
    )
    del temp_python_test.txt
) else (
    echo %RED%❌ BAŞARISIZ: Python bulunamadı%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM ===========================================
REM Test 4: FreeCAD Python API
REM ===========================================

echo %BLUE%📋 Test 4: FreeCAD Python API%RESET%
echo ----------------------------------------

echo import FreeCAD > test_freecad_api.py
echo print("FreeCAD Version:", FreeCAD.Version()) >> test_freecad_api.py
echo print("SUCCESS: FreeCAD API accessible") >> test_freecad_api.py

"!FREECAD_PYTHON!" test_freecad_api.py >temp_freecad_api_test.txt 2>&1

if exist temp_freecad_api_test.txt (
    findstr "SUCCESS" temp_freecad_api_test.txt >nul
    if !errorlevel! == 0 (
        echo %GREEN%✅ BAŞARILI: FreeCAD Python API çalışıyor%RESET%
        type temp_freecad_api_test.txt | findstr "FreeCAD Version"
        set /a TESTS_PASSED+=1
    ) else (
        echo %RED%❌ BAŞARISIZ: FreeCAD Python API erişilemez%RESET%
        echo %YELLOW%   📄 Hata detayları:%RESET%
        type temp_freecad_api_test.txt
        echo %YELLOW%   💡 Çözüm: FreeCAD'i bir kez manuel olarak başlatın%RESET%
        set /a TESTS_FAILED+=1
    )
    del temp_freecad_api_test.txt
) else (
    echo %RED%❌ BAŞARISIZ: Python testi çalıştırılamadı%RESET%
    set /a TESTS_FAILED+=1
)

del test_freecad_api.py

echo.

REM ===========================================
REM Test 5: Core Modules
REM ===========================================

echo %BLUE%📋 Test 5: Core Modules%RESET%
echo ----------------------------------------

set "CORE_MODULES=workflow_orchestrator.py error_handler.py batch_processor.py template_manager.py part_library.py performance_monitor.py large_file_handler.py"
set "CORE_MODULES_FOUND=0"
set "CORE_MODULES_TOTAL=7"

for %%M in (%CORE_MODULES%) do (
    if exist "core\%%M" (
        echo %GREEN%   ✅ %%M%RESET%
        set /a CORE_MODULES_FOUND+=1
    ) else (
        echo %RED%   ❌ %%M (eksik)%RESET%
    )
)

if !CORE_MODULES_FOUND! == !CORE_MODULES_TOTAL! (
    echo %GREEN%✅ BAŞARILI: Tüm core modüller mevcut (!CORE_MODULES_FOUND!/!CORE_MODULES_TOTAL!)%RESET%
    set /a TESTS_PASSED+=1
) else (
    echo %YELLOW%⚠️  UYARI: Bazı core modüller eksik (!CORE_MODULES_FOUND!/!CORE_MODULES_TOTAL!)%RESET%
    set /a TESTS_WARNING+=1
)

echo.

REM ===========================================
REM Test 6: GUI Modules
REM ===========================================

echo %BLUE%📋 Test 6: GUI Modules%RESET%
echo ----------------------------------------

if exist "gui\workflow_gui.py" (
    echo %GREEN%✅ BAŞARILI: GUI modülü mevcut%RESET%
    echo %GREEN%   📄 gui\workflow_gui.py%RESET%
    set /a TESTS_PASSED+=1
) else (
    echo %RED%❌ BAŞARISIZ: GUI modülü eksik%RESET%
    echo %RED%   📄 gui\workflow_gui.py bulunamadı%RESET%
    set /a TESTS_FAILED+=1
)

echo.

REM ===========================================
REM Test 7: Python Dependencies
REM ===========================================

echo %BLUE%📋 Test 7: Python Dependencies%RESET%
echo ----------------------------------------

set "DEPS=tkinter psutil sqlite3"
set "DEPS_SUCCESS=0"
set "DEPS_TOTAL=3"

echo # Test Python dependencies > test_deps.py
for %%D in (%DEPS%) do (
    echo try: >> test_deps.py
    echo     import %%D >> test_deps.py
    echo     print("✅ %%D") >> test_deps.py
    echo except ImportError: >> test_deps.py
    echo     print("❌ %%D - Missing") >> test_deps.py
)

"!FREECAD_PYTHON!" test_deps.py >temp_deps_test.txt 2>&1

if exist temp_deps_test.txt (
    echo %YELLOW%📦 Dependency Test Results:%RESET%
    type temp_deps_test.txt
    
    findstr /c:"✅" temp_deps_test.txt >nul
    if !errorlevel! == 0 (
        for /f %%i in ('findstr /c:"✅" temp_deps_test.txt') do set DEPS_SUCCESS=%%i
    )
    
    del temp_deps_test.txt
)

if !DEPS_SUCCESS! == !DEPS_TOTAL! (
    echo %GREEN%✅ BAŞARILI: Tüm bağımlılıklar mevcut%RESET%
    set /a TESTS_PASSED+=1
) else (
    echo %YELLOW%⚠️  UYARI: Bazı bağımlılıklar eksik%RESET%
    echo %YELLOW%   💡 Çözüm: KURULUM.bat scripti çalıştırın%RESET%
    set /a TESTS_WARNING+=1
)

del test_deps.py

echo.

REM ===========================================
REM Test 8: Directory Structure
REM ===========================================

echo %BLUE%📋 Test 8: Directory Structure%RESET%
echo ----------------------------------------

set "DIRS=core gui macros temp output"
set "DIRS_FOUND=0"
set "DIRS_TOTAL=5"

for %%D in (%DIRS%) do (
    if exist "%%D\" (
        echo %GREEN%   ✅ %%D\%RESET%
        set /a DIRS_FOUND+=1
    ) else (
        echo %YELLOW%   ⚠️  %%D\ (eksik, oluşturulacak)%RESET%
        mkdir "%%D" 2>nul
        if exist "%%D\" (
            echo %GREEN%      → %%D\ oluşturuldu%RESET%
            set /a DIRS_FOUND+=1
        )
    )
)

if !DIRS_FOUND! == !DIRS_TOTAL! (
    echo %GREEN%✅ BAŞARILI: Dizin yapısı tamam (!DIRS_FOUND!/!DIRS_TOTAL!)%RESET%
    set /a TESTS_PASSED+=1
) else (
    echo %YELLOW%⚠️  UYARI: Bazı dizinler eksik (!DIRS_FOUND!/!DIRS_TOTAL!)%RESET%
    set /a TESTS_WARNING+=1
)

echo.

REM ===========================================
REM Test 9: Memory and Performance
REM ===========================================

echo %BLUE%📋 Test 9: Memory and Performance%RESET%
echo ----------------------------------------

REM Get system memory info
for /f "skip=1 tokens=2" %%A in ('wmic computersystem get TotalPhysicalMemory /value') do (
    set "TOTAL_MEMORY=%%A"
    goto :memory_found
)
:memory_found

if defined TOTAL_MEMORY (
    set /a TOTAL_MEMORY_GB=!TOTAL_MEMORY!/1024/1024/1024
    echo %GREEN%💾 Toplam RAM: !TOTAL_MEMORY_GB! GB%RESET%
    
    if !TOTAL_MEMORY_GB! GEQ 4 (
        echo %GREEN%✅ BAŞARILI: RAM yeterli (>4GB)%RESET%
        set /a TESTS_PASSED+=1
    ) else (
        echo %YELLOW%⚠️  UYARI: RAM düşük (!TOTAL_MEMORY_GB!GB < 4GB)%RESET%
        echo %YELLOW%   💡 Büyük STEP dosyaları için daha fazla RAM önerilir%RESET%
        set /a TESTS_WARNING+=1
    )
) else (
    echo %YELLOW%⚠️  UYARI: RAM bilgisi alınamadı%RESET%
    set /a TESTS_WARNING+=1
)

echo.

REM ===========================================
REM Test 10: Sample Workflow Test
REM ===========================================

echo %BLUE%📋 Test 10: Sample Workflow Test%RESET%
echo ----------------------------------------

echo # Quick workflow test > test_workflow.py
echo import sys, os >> test_workflow.py
echo sys.path.append(os.path.join(os.path.dirname(__file__), 'core')) >> test_workflow.py
echo try: >> test_workflow.py
echo     from workflow_orchestrator import WorkflowOrchestrator >> test_workflow.py
echo     from error_handler import StepBomErrorHandler >> test_workflow.py
echo     from performance_monitor import PerformanceMonitor >> test_workflow.py
echo     print("SUCCESS: Core workflow components loaded") >> test_workflow.py
echo     >> test_workflow.py
echo     # Quick instantiation test >> test_workflow.py
echo     orchestrator = WorkflowOrchestrator() >> test_workflow.py
echo     error_handler = StepBomErrorHandler() >> test_workflow.py
echo     monitor = PerformanceMonitor() >> test_workflow.py
echo     print("SUCCESS: Components instantiated successfully") >> test_workflow.py
echo except Exception as e: >> test_workflow.py
echo     print("ERROR:", str(e)) >> test_workflow.py

"!FREECAD_PYTHON!" test_workflow.py >temp_workflow_test.txt 2>&1

if exist temp_workflow_test.txt (
    findstr "SUCCESS" temp_workflow_test.txt >nul
    if !errorlevel! == 0 (
        echo %GREEN%✅ BAŞARILI: Workflow komponenleri çalışıyor%RESET%
        echo %GREEN%   🔧 Core modüller başarıyla yüklendi%RESET%
        set /a TESTS_PASSED+=1
    ) else (
        echo %YELLOW%⚠️  UYARI: Workflow testi kısmen başarılı%RESET%
        echo %YELLOW%   📄 Test çıktısı:%RESET%
        type temp_workflow_test.txt
        set /a TESTS_WARNING+=1
    )
    del temp_workflow_test.txt
) else (
    echo %RED%❌ BAŞARISIZ: Workflow testi çalıştırılamadı%RESET%
    set /a TESTS_FAILED+=1
)

del test_workflow.py

echo.

REM ===========================================
REM Test Results Summary
REM ===========================================

echo %BLUE%📊 TEST SONUÇLARI%RESET%
echo ===========================================
echo.
echo %GREEN%✅ Başarılı Testler: !TESTS_PASSED!/%TOTAL_TESTS%%RESET%
echo %YELLOW%⚠️  Uyarı ile Geçen: !TESTS_WARNING!/%TOTAL_TESTS%%RESET%
echo %RED%❌ Başarısız Testler: !TESTS_FAILED!/%TOTAL_TESTS%%RESET%
echo.

REM Calculate success percentage
set /a SUCCESS_RATE=(!TESTS_PASSED! * 100) / %TOTAL_TESTS%

if !TESTS_FAILED! == 0 (
    if !TESTS_WARNING! == 0 (
        echo %GREEN%🎉 MÜKEMMELİ! Tüm testler başarılı (!SUCCESS_RATE!%% başarı)%RESET%
        echo %GREEN%STEP BOM Analyzer kullanıma hazır!%RESET%
    ) else (
        echo %YELLOW%👍 İYİ! Sistem çalışır durumda (!SUCCESS_RATE!%% başarı)%RESET%
        echo %YELLOW%Bazı uyarılar var ama kullanılabilir.%RESET%
    )
) else (
    echo %RED%⚠️  DİKKAT! Bazı kritik testler başarısız (!SUCCESS_RATE!%% başarı)%RESET%
    echo %RED%KURULUM.bat scripti çalıştırmanız önerilir.%RESET%
)

echo.

REM ===========================================
REM System Information
REM ===========================================

echo %BLUE%💻 SİSTEM BİLGİLERİ%RESET%
echo ===========================================

REM Windows version
for /f "tokens=2 delims==" %%A in ('wmic os get caption /value 2^>nul') do echo %BLUE%🖥️  İşletim Sistemi:%RESET% %%A

REM Processor
for /f "tokens=2 delims==" %%A in ('wmic cpu get name /value 2^>nul') do echo %BLUE%⚙️  İşlemci:%RESET% %%A

REM Free disk space
for /f "tokens=2 delims==" %%A in ('wmic logicaldisk where caption^="C:" get FreeSpace /value 2^>nul') do (
    set /a FREE_SPACE_GB=%%A/1024/1024/1024
    echo %BLUE%💾 Boş Disk Alanı:%RESET% !FREE_SPACE_GB! GB
)

echo.

REM ===========================================
REM Recommendations
REM ===========================================

echo %BLUE%💡 ÖNERİLER%RESET%
echo ===========================================

if !TESTS_FAILED! GTR 0 (
    echo %YELLOW%🔧 KURULUM.bat scripti çalıştırarak eksiklikleri giderin%RESET%
)

if !TESTS_WARNING! GTR 0 (
    echo %YELLOW%📦 Eksik bağımlılıklar için: pip install psutil openpyxl jinja2%RESET%
)

echo %BLUE%📚 Kullanım:%RESET%
echo   • %YELLOW%ÇALIŞTIR.bat%RESET% - GUI arayüzünü başlatır
echo   • %YELLOW%KURULUM.bat%RESET% - Eksiklikleri giderir
echo   • %YELLOW%TEST.bat%RESET% - Bu test scriptini tekrar çalıştırır
echo.

REM ===========================================
REM Save Test Report
REM ===========================================

echo %BLUE%📄 Test raporu kaydediliyor...%RESET%

echo STEP BOM Analyzer v3.0 - System Test Report > test_report.txt
echo ================================================== >> test_report.txt
echo Test Date: %date% %time% >> test_report.txt
echo. >> test_report.txt
echo Test Results: >> test_report.txt
echo - Passed: !TESTS_PASSED!/%TOTAL_TESTS% >> test_report.txt
echo - Warnings: !TESTS_WARNING!/%TOTAL_TESTS% >> test_report.txt
echo - Failed: !TESTS_FAILED!/%TOTAL_TESTS% >> test_report.txt
echo - Success Rate: !SUCCESS_RATE!%% >> test_report.txt
echo. >> test_report.txt
echo System Information: >> test_report.txt

for /f "tokens=2 delims==" %%A in ('wmic os get caption /value 2^>nul') do echo - OS: %%A >> test_report.txt
for /f "tokens=2 delims==" %%A in ('wmic cpu get name /value 2^>nul') do echo - CPU: %%A >> test_report.txt
if defined TOTAL_MEMORY_GB echo - RAM: !TOTAL_MEMORY_GB! GB >> test_report.txt
if defined FREE_SPACE_GB echo - Free Disk: !FREE_SPACE_GB! GB >> test_report.txt

echo %GREEN%✅ Test raporu kaydedildi: test_report.txt%RESET%

echo.
echo %BLUE%Test tamamlandı. Herhangi bir tuşa basın...%RESET%
pause

endlocal
exit /b 0