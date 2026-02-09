@echo off
echo Stopping all URTM Takip development servers...
taskkill /F /IM node.exe /T 2>nul
echo ✅ All servers stopped!
timeout /t 2 >nul
