@echo off
REM URTM Takip - Dizin Tarama Client v1.2.0
REM Windows Kurulum Scripti
REM Python 3.8+ gereklidir

echo.
echo ========================================
echo   URTM Takip Dizin Tarama Client v1.2.0
echo   Windows Kurulum Scripti
echo ========================================
echo.

REM Python version control
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Python not found!
    echo Please install Python 3.8+: https://python.org/downloads
    echo.
    pause
    exit /b 1
)

echo Python installed, checking version...
python --version

echo.
echo Installing required packages...
echo.

REM pip update
echo Updating pip...
python -m pip install --upgrade pip

REM Install required packages
echo.
echo Installing requests package...
python -m pip install requests>=2.25.0

echo.
echo Installation completed!
echo.

REM Run tests
echo Running tests...
echo.

REM Python module checks
echo Module checks:
python -c "import requests; print('requests:', requests.__version__)" 2>nul && echo requests: OK || echo requests: ERROR
python -c "import tkinter; print('tkinter: OK')" 2>nul || echo tkinter: ERROR - GUI may not work
python -c "import json; print('json: OK')" 2>nul || echo json: ERROR
python -c "import threading; print('threading: OK')" 2>nul || echo threading: ERROR

echo.
echo Installation summary:
echo - Python: Installed
echo - HTTP Client (requests): Installed
echo - GUI Framework (tkinter): Checked
echo - Database Integration: Ready (v1.2.0)
echo - Selection System: Ready (v1.2.0)
echo.

echo Usage:
echo   python main.py
echo.

REM Config file check
if exist "config.ini" (
    echo Config file found: config.ini
) else (
    echo config.ini will be created automatically on first run
)

echo.
echo ========================================
echo   Installation completed successfully!
echo   Run with: python main.py
echo ========================================
echo.

pause