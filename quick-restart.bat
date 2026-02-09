@echo off
echo ========================================
echo    URTM Takip - Server Restart
echo ========================================
echo Restarting development servers...
echo.

REM Stop all Node.js processes
echo 🛑 Stopping all Node.js processes...
taskkill /F /IM node.exe /T 2>nul
if %errorlevel% == 0 (
    echo ✅ All Node.js processes stopped
) else (
    echo ℹ️  No Node.js processes were running
)

REM Wait for processes to fully terminate
echo ⏳ Waiting for processes to terminate...
timeout /t 3 /nobreak >nul

REM Start backend
echo.
echo 🔧 Starting Backend Server...
start "URTM Backend" cmd /c "cd /d %~dp0backend && npm run dev"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🚀 Starting Frontend Server...
start "URTM Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ Development servers restarted successfully!
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:5000
echo.
echo Press any key to close this window...
pause >nul
