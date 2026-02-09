@echo off
chcp 65001 >nul
title Debug - URTM Dizin Tarama Client

echo ========================================
echo     DEBUG - DOSYA KONTROL SCRIPT
echo ========================================
echo.

echo Mevcut dizin: %CD%
echo.

echo === DOSYA LISTESI ===
dir /b
echo.

echo === PYTHON DOSYALARI ===
dir /b *.py 2>nul
if errorlevel 1 echo Python dosyasi bulunamadi!
echo.

echo === TEXT DOSYALARI ===
dir /b *.txt 2>nul
if errorlevel 1 echo Text dosyasi bulunamadi!
echo.

echo === BAT DOSYALARI ===
dir /b *.bat 2>nul
if errorlevel 1 echo Bat dosyasi bulunamadi!
echo.

echo === MARKDOWN DOSYALARI ===
dir /b *.md 2>nul
if errorlevel 1 echo Markdown dosyasi bulunamadi!
echo.

echo === PYTHON VERSION ===
python --version
if errorlevel 1 (
    echo Python bulunamadi!
) else (
    echo Python bulundu!
)
echo.

echo === PIP VERSION ===
pip --version
if errorlevel 1 (
    echo Pip bulunamadi!
) else (
    echo Pip bulundu!
)
echo.

if exist "requirements.txt" (
    echo === REQUIREMENTS.TXT ICERIGI ===
    type requirements.txt
    echo.
) else (
    echo requirements.txt dosyasi bulunamadi!
    echo.
    echo Manuel requirements.txt olusturuluyor...
    echo requests>=2.25.0 > requirements.txt
    echo requirements.txt olusturuldu!
    echo.
)

echo === REQUESTS MODULU KONTROL ===
python -c "import requests; print('requests version:', requests.__version__)" 2>nul
if errorlevel 1 (
    echo requests modulu yuklu degil!
    echo Yuklemek icin: pip install requests
) else (
    echo requests modulu yuklu!
)
echo.

echo === MAIN.PY KONTROL ===
if exist "main.py" (
    echo main.py dosyasi mevcut
    python -c "import main" 2>nul
    if errorlevel 1 (
        echo main.py dosyasinda hata var!
    ) else (
        echo main.py dosyasi calisiyor!
    )
) else (
    echo main.py dosyasi bulunamadi!
)
echo.

echo Debug tamamlandi.
pause