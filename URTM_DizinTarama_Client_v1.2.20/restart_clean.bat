@echo off
REM Dizin Tarama Client - Cache Temizleme ve Yeniden Başlatma
echo ========================================
echo URTM Dizin Tarama Client - Cache Temizleme
echo ========================================
echo.

echo 1. Python cache temizleniyor...
if exist __pycache__ (
    rmdir /s /q __pycache__
    echo    __pycache__ silindi
)

if exist selection_manager.pyc (
    del /q selection_manager.pyc
    echo    Eski .pyc dosyalari silindi
)

echo.
echo 2. Python moduller kontrol ediliyor...
python --version
echo.

echo 3. Client baslatiliyor...
python main.py

pause
