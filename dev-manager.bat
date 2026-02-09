@echo off
echo =========================================
echo    URTM Takip - Development Manager
echo =========================================
echo.

:menu
echo 1) Start Full Development (Frontend + Backend)
echo 2) Start Frontend Only
echo 3) Start Backend Only
echo 4) Stop All Servers
echo 5) Restart All Servers
echo 6) Install Dependencies
echo 7) Build Frontend
echo 8) Check Processes
echo 9) Exit
echo.
set /p choice="Select an option (1-9): "

if "%choice%"=="1" goto start_full
if "%choice%"=="2" goto start_frontend
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto stop_all
if "%choice%"=="5" goto restart_all
if "%choice%"=="6" goto install_deps
if "%choice%"=="7" goto build_frontend
if "%choice%"=="8" goto check_processes
if "%choice%"=="9" goto exit
goto menu

:start_full
echo Starting Full Development Environment...
start "URTM Backend" cmd /c "cd /d %~dp0backend && npm run dev"
timeout /t 3 >nul
start "URTM Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"
echo Both servers are starting...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
pause
goto menu

:start_frontend
echo Starting Frontend Development Server...
start "URTM Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"
echo Frontend is starting at http://localhost:5173
pause
goto menu

:start_backend
echo Starting Backend Development Server...
start "URTM Backend" cmd /c "cd /d %~dp0backend && npm run dev"
echo Backend is starting at http://localhost:5000
pause
goto menu

:stop_all
echo Stopping all Node.js processes...
taskkill /F /IM node.exe /T 2>nul
echo All servers stopped.
pause
goto menu

:restart_all
echo Restarting all servers...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 >nul
start "URTM Backend" cmd /c "cd /d %~dp0backend && npm run dev"
timeout /t 3 >nul
start "URTM Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"
echo Servers restarted successfully!
pause
goto menu

:install_deps
echo Installing dependencies...
echo Installing backend dependencies...
cd /d %~dp0backend
call npm install
echo Installing frontend dependencies...
cd /d %~dp0frontend
call npm install
echo All dependencies installed!
cd /d %~dp0
pause
goto menu

:build_frontend
echo Building frontend for production...
cd /d %~dp0frontend
call npm run build
echo Build completed!
cd /d %~dp0
pause
goto menu

:check_processes
echo Current Node.js processes:
tasklist /FI "IMAGENAME eq node.exe" /FO TABLE
pause
goto menu

:exit
echo Goodbye!
exit
