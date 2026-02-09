@echo off
echo Starting URTM Takip Full Development...
start "URTM Backend" cmd /c "cd /d %~dp0backend && npm run dev"
timeout /t 3 >nul
start "URTM Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"
echo.
echo ✅ Development servers are starting...
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:5000
echo.
echo Press any key to close this window...
pause >nul
