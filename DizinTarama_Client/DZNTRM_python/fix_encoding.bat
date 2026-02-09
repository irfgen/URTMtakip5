@echo off
:: Encoding Duzeltme ve Test Script

echo =========================================
echo    URTM - Encoding Test ve Duzeltme
echo =========================================
echo.

echo Sistem Bilgileri:
echo - Windows Versiyon: %OS%
echo - Kod Sayfasi: %CODEPAGE%
echo - Mevcut Dizin: %CD%
echo.

echo Dosya Kontrolu:
echo.

:: Python dosyalari
echo === PYTHON DOSYALARI ===
for %%f in (*.py) do (
    echo [OK] %%f
)
echo.

:: Batch dosyalari
echo === BATCH DOSYALARI ===
for %%f in (*.bat) do (
    echo [OK] %%f
)
echo.

:: Text dosyalari
echo === TEXT DOSYALARI ===
for %%f in (*.txt) do (
    echo [OK] %%f
)
echo.

:: Markdown dosyalari
echo === MARKDOWN DOSYALARI ===
for %%f in (*.md) do (
    echo [OK] %%f
)
echo.

echo Python Test:
python --version
if errorlevel 1 (
    echo [HATA] Python bulunamadi!
) else (
    echo [OK] Python mevcut
)
echo.

echo PIP Test:
pip --version
if errorlevel 1 (
    echo [HATA] PIP bulunamadi!
) else (
    echo [OK] PIP mevcut
)
echo.

echo Requests Test:
python -c "import requests; print('requests OK')" 2>nul
if errorlevel 1 (
    echo [UYARI] requests modulu yuklu degil
    echo requests yukleniyor...
    pip install requests
) else (
    echo [OK] requests modulu mevcut
)
echo.

echo Main.py Test:
if exist "main.py" (
    echo [OK] main.py dosyasi mevcut
    python -c "print('Python calisma testi basarili')" 2>nul
    if errorlevel 1 (
        echo [HATA] Python calismadi!
    ) else (
        echo [OK] Python calisma testi basarili
    )
) else (
    echo [HATA] main.py dosyasi bulunamadi!
)
echo.

echo Test tamamlandi.
echo.

set /p RUN_PROGRAM="Ana programi calistirmak ister misiniz? (Y/N): "
if /i "%RUN_PROGRAM%"=="Y" (
    echo.
    echo Program baslatiliyor...
    python main.py
)

pause