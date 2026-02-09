@echo off
echo ===========================================
echo STEP BOM Analyzer v3.0 - System Test
echo ===========================================
echo.

setlocal enabledelayedexpansion

REM Colors
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "RESET=[0m"

echo %BLUE%[TEST] Sistem testi baslatiyor...%RESET%
echo.

REM Test 1: Config file
echo %BLUE%[1] Configuration Test%RESET%
if exist config.ini (
    echo %GREEN%   [OK] config.ini bulundu%RESET%
) else (
    echo %RED%   [FAIL] config.ini yok%RESET%
)

echo.

REM Test 2: FreeCAD detection
echo %BLUE%[2] FreeCAD Detection%RESET%

set "FREECAD_FOUND=0"

if exist "C:\Program Files\FreeCAD 1.0\bin\FreeCAD.exe" (
    echo %GREEN%   [OK] FreeCAD 1.0 bulundu%RESET%
    set "FREECAD_FOUND=1"
    set "FREECAD_VER=1.0"
)

if exist "C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe" (
    echo %GREEN%   [OK] FreeCAD 0.21 bulundu%RESET%
    set "FREECAD_FOUND=1"
    set "FREECAD_VER=0.21"
)

if "!FREECAD_FOUND!"=="0" (
    echo %RED%   [FAIL] FreeCAD bulunamadi%RESET%
)

echo.

REM Test 3: Python test
echo %BLUE%[3] Python API Test%RESET%

if "!FREECAD_FOUND!"=="1" (
    if "!FREECAD_VER!"=="1.0" (
        set "PYTHON_PATH=C:\Program Files\FreeCAD 1.0\bin\python.exe"
    ) else (
        set "PYTHON_PATH=C:\Program Files\FreeCAD 0.21\bin\python.exe"
    )
    
    if exist "!PYTHON_PATH!" (
        echo %GREEN%   [OK] Python bulundu%RESET%
        
        echo import sys > test_simple.py
        echo try: >> test_simple.py
        echo     import FreeCAD >> test_simple.py
        echo     print("SUCCESS") >> test_simple.py
        echo except: >> test_simple.py
        echo     print("FAIL") >> test_simple.py
        
        "!PYTHON_PATH!" test_simple.py > result.txt 2>&1
        
        findstr "SUCCESS" result.txt >nul
        if !errorlevel! == 0 (
            echo %GREEN%   [OK] FreeCAD API calisiyor%RESET%
        ) else (
            echo %RED%   [FAIL] FreeCAD API sorunu%RESET%
            echo %YELLOW%   Hata detayi:%RESET%
            type result.txt
        )
        
        del test_simple.py result.txt 2>nul
        
    ) else (
        echo %RED%   [FAIL] Python bulunamadi%RESET%
    )
) else (
    echo %YELLOW%   [SKIP] FreeCAD yok, test atlandı%RESET%
)

echo.

REM Test 4: Required files
echo %BLUE%[4] Required Files%RESET%

if exist "core\workflow_orchestrator.py" (
    echo %GREEN%   [OK] workflow_orchestrator.py%RESET%
) else (
    echo %RED%   [FAIL] workflow_orchestrator.py eksik%RESET%
)

if exist "gui\workflow_gui.py" (
    echo %GREEN%   [OK] workflow_gui.py%RESET%
) else (
    echo %RED%   [FAIL] workflow_gui.py eksik%RESET%
)

echo.

REM Test 5: GUI Test (manual check)
echo %BLUE%[5] GUI Test%RESET%
echo %YELLOW%   GUI testini manuel yapmak icin CALISTIR.bat calistirin%RESET%

echo.
echo %BLUE%[SUMMARY] Test Completed%RESET%
echo %YELLOW%Eger tum testler OK ise, GUI calismali.%RESET%
echo %YELLOW%GUI kapaniyorsa, Python modulu eksik olabilir.%RESET%

echo.
pause
endlocal