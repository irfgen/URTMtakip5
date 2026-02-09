@echo off
echo ===========================================
echo STEP BOM Analyzer v3.0 - FreeCAD Native
echo GUI Launcher
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

echo %BLUE%[LAUNCHER] STEP BOM Analyzer baslatiyor...%RESET%
echo.

if not exist config.ini (
    echo %RED%[HATA] config.ini bulunamadi!%RESET%
    echo.
    echo Lutfen once KURULUM.bat scripti calistirin.
    echo.
    pause
    exit /b 1
)

echo %YELLOW%[CONFIG] Konfigurasyon yukleniyor...%RESET%

REM Read FreeCAD path from config using PowerShell helper
set "FREECAD_PATH="
set "FREECAD_PYTHON="

REM Use PowerShell to safely read config values
for /f "usebackq delims=" %%A in (`powershell -Command "Get-Content config.ini | Where-Object {$_ -match '^path ='} | ForEach-Object {$_.Split('=',2)[1].Trim()}"`) do (
    set "FREECAD_PATH=%%A"
)

for /f "usebackq delims=" %%A in (`powershell -Command "Get-Content config.ini | Where-Object {$_ -match '^python_path ='} | ForEach-Object {$_.Split('=',2)[1].Trim()}"`) do (
    set "FREECAD_PYTHON=%%A"
)

REM Auto-detect FreeCAD if not found in config
if "!FREECAD_PATH!"=="" (
    echo %YELLOW%[AUTO-DETECT] FreeCAD yolu config.ini'de bulunamadi, otomatik tespit ediliyor...%RESET%
    
    REM Check common FreeCAD installation paths
    if exist "C:\Program Files\FreeCAD 1.0\bin\FreeCAD.exe" (
        set "FREECAD_PATH=C:\Program Files\FreeCAD 1.0\bin\FreeCAD.exe"
        set "FREECAD_PYTHON=C:\Program Files\FreeCAD 1.0\bin\python.exe"
    ) else if exist "C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe" (
        set "FREECAD_PATH=C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe"
        set "FREECAD_PYTHON=C:\Program Files\FreeCAD 0.21\bin\python.exe"
    ) else if exist "C:\Program Files\FreeCAD 0.20\bin\FreeCAD.exe" (
        set "FREECAD_PATH=C:\Program Files\FreeCAD 0.20\bin\FreeCAD.exe"
        set "FREECAD_PYTHON=C:\Program Files\FreeCAD 0.20\bin\python.exe"
    ) else if exist "C:\Program Files (x86)\FreeCAD 1.0\bin\FreeCAD.exe" (
        set "FREECAD_PATH=C:\Program Files (x86)\FreeCAD 1.0\bin\FreeCAD.exe"
        set "FREECAD_PYTHON=C:\Program Files (x86)\FreeCAD 1.0\bin\python.exe"
    ) else (
        echo %RED%[HATA] FreeCAD bulunamadi!%RESET%
        echo.
        echo FreeCAD kurulumunu kontrol edin:
        echo - https://www.freecadweb.org/ adresinden FreeCAD indirin
        echo - Python API destegi ile kurun
        echo - KURULUM.bat scripti calistirin (otomatik kurulum icin)
        echo.
        pause
        exit /b 1
    )
    
    echo %GREEN%[AUTO-DETECT] FreeCAD bulundu: !FREECAD_PATH!%RESET%
)

if "!FREECAD_PYTHON!"=="" (
    echo %YELLOW%[AUTO-DETECT] Python yolu config.ini'de bulunamadi, otomatik tespit ediliyor...%RESET%
    
    REM Derive Python path from FreeCAD path
    set "FREECAD_PYTHON=!FREECAD_PATH:FreeCAD.exe=python.exe!"
    
    if not exist "!FREECAD_PYTHON!" (
        echo %RED%[HATA] FreeCAD Python bulunamadi: !FREECAD_PYTHON!%RESET%
        echo.
        echo Lutfen KURULUM.bat scripti calistirin.
        echo.
        pause
        exit /b 1
    )
    
    echo %GREEN%[AUTO-DETECT] Python bulundu: !FREECAD_PYTHON!%RESET%
)

echo %GREEN%[OK] FreeCAD: !FREECAD_PATH!%RESET%
echo %GREEN%[OK] Python: !FREECAD_PYTHON!%RESET%

echo.
echo %BLUE%[CHECK] Sistem kontrolu...%RESET%

REM Check if FreeCAD is available
if not exist "!FREECAD_PATH!" (
    echo %RED%[HATA] FreeCAD bulunamadi: !FREECAD_PATH!%RESET%
    echo.
    echo FreeCAD'in tasindigi veya kaldirildi gorunuyor.
    echo Lutfen KURULUM.bat scripti tekrar calistirin.
    echo.
    pause
    exit /b 1
)

REM Check if core modules exist
if not exist "core\workflow_orchestrator.py" (
    echo %RED%[HATA] Core moduller eksik!%RESET%
    echo.
    echo core\workflow_orchestrator.py dosyasi bulunamadi.
    echo Kurulum dosyalarinin tamamlandigindan emin olun.
    echo.
    pause
    exit /b 1
)

if not exist "gui\workflow_gui.py" (
    echo %RED%[HATA] GUI modulleri eksik!%RESET%
    echo.
    echo gui\workflow_gui.py dosyasi bulunamadi.
    echo Kurulum dosyalarinin tamamlandigindan emin olun.
    echo.
    pause
    exit /b 1
)

echo %GREEN%[OK] Sistem kontrolu basarili%RESET%

echo.
echo %BLUE%[SETUP] Baslatma scripti hazirlaniyor...%RESET%

REM Create Python startup script
echo # STEP BOM Analyzer v3.0 - Startup Script > start_gui.py
echo import sys, os >> start_gui.py
echo import tkinter as tk >> start_gui.py
echo from tkinter import ttk, messagebox >> start_gui.py
echo. >> start_gui.py
echo # Add core modules to path >> start_gui.py
echo sys.path.append(os.path.join(os.path.dirname(__file__), 'core')) >> start_gui.py
echo sys.path.append(os.path.join(os.path.dirname(__file__), 'gui')) >> start_gui.py
echo. >> start_gui.py
echo try: >> start_gui.py
echo     from workflow_gui import WorkflowGUI >> start_gui.py
echo     root = tk.Tk() >> start_gui.py
echo     app = WorkflowGUI(root) >> start_gui.py
echo     root.title("STEP BOM Analyzer v3.0 - FreeCAD Native Edition") >> start_gui.py
echo     root.geometry("1200x800") >> start_gui.py
echo     root.minsize(800, 600) >> start_gui.py
echo     root.eval('tk::PlaceWindow . center') >> start_gui.py
echo     root.mainloop() >> start_gui.py
echo except ImportError as e: >> start_gui.py
echo     root = tk.Tk() >> start_gui.py
echo     root.title("STEP BOM Analyzer - Import Error") >> start_gui.py
echo     root.geometry("600x400") >> start_gui.py
echo     error_frame = ttk.Frame(root, padding="20") >> start_gui.py
echo     error_frame.pack(fill='both', expand=True) >> start_gui.py
echo     ttk.Label(error_frame, text="Module Import Error", font=("Arial", 16, "bold")).pack(pady=(0,20)) >> start_gui.py
echo     ttk.Label(error_frame, text=f"Could not import required modules: {e}", wraplength=500).pack(pady=(0,20)) >> start_gui.py
echo     ttk.Label(error_frame, text="Please run KURULUM.bat to fix this issue.", font=("Arial", 12)).pack(pady=(0,20)) >> start_gui.py
echo     ttk.Button(error_frame, text="Close", command=root.destroy).pack() >> start_gui.py
echo     root.mainloop() >> start_gui.py
echo except Exception as e: >> start_gui.py
echo     import traceback >> start_gui.py
echo     root = tk.Tk() >> start_gui.py
echo     root.title("STEP BOM Analyzer - Startup Error") >> start_gui.py
echo     root.geometry("700x500") >> start_gui.py
echo     error_frame = ttk.Frame(root, padding="20") >> start_gui.py
echo     error_frame.pack(fill='both', expand=True) >> start_gui.py
echo     ttk.Label(error_frame, text="Startup Error", font=("Arial", 16, "bold")).pack(pady=(0,10)) >> start_gui.py
echo     ttk.Label(error_frame, text=f"Error: {str(e)}", wraplength=600).pack(pady=(0,10)) >> start_gui.py
echo     details_frame = ttk.LabelFrame(error_frame, text="Error Details", padding="10") >> start_gui.py
echo     details_frame.pack(fill='both', expand=True, pady=(10,0)) >> start_gui.py
echo     text_widget = tk.Text(details_frame, wrap='word', height=15) >> start_gui.py
echo     scrollbar = ttk.Scrollbar(details_frame, orient='vertical', command=text_widget.yview) >> start_gui.py
echo     text_widget.configure(yscrollcommand=scrollbar.set) >> start_gui.py
echo     text_widget.pack(side='left', fill='both', expand=True) >> start_gui.py
echo     scrollbar.pack(side='right', fill='y') >> start_gui.py
echo     error_details = traceback.format_exc() >> start_gui.py
echo     text_widget.insert('1.0', error_details) >> start_gui.py
echo     text_widget.config(state='disabled') >> start_gui.py
echo     ttk.Button(error_frame, text="Close", command=root.destroy).pack(pady=(10,0)) >> start_gui.py
echo     root.mainloop() >> start_gui.py

echo %GREEN%[OK] Startup script hazirlandi%RESET%

echo.
echo %BLUE%[LAUNCH] GUI baslatiyor...%RESET%
echo.

REM Always run in console mode to see errors
echo %GREEN%[DEBUG] Konsol modu - debug bilgileri gosteriliyor...%RESET%
echo.

REM Try system Python first (usually works better for GUI)
python --version >nul 2>&1
if !errorlevel! == 0 (
    echo %YELLOW%[INFO] Sistem Python ile deneniyor...%RESET%
    python start_gui.py
) else (
    echo %YELLOW%[INFO] FreeCAD Python ile deneniyor...%RESET%
    "!FREECAD_PYTHON!" start_gui.py
)

REM Clean up temporary startup script
if exist start_gui.py (
    del start_gui.py
)

echo.
echo %BLUE%[EXIT] STEP BOM Analyzer kapatildi.%RESET%

REM Only pause if run from console
echo %cmdcmdline% | find /i "%~0" >nul
if errorlevel 1 (
    echo.
    pause
)

endlocal
exit /b 0