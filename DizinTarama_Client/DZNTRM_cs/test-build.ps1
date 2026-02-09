# Test C# build
Write-Host "Test C# build başlatılıyor..."

try {
    # Test NuGet restore
    Write-Host "NuGet paketleri restore ediliyor..."
    $restoreResult = dotnet restore
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ NuGet restore başarısız! Hata: $restoreResult" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ NuGet paketleri başarıyla restore edildi" -ForegroundColor Green

    # Test build
    Write-Host "Proje build ediliyor..."
    $buildResult = dotnet build --configuration Release
    if ($LASTEXITCODE -neq 0) {
        Write-Host "❌ Build başarısız! Hata: $buildResult" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build başarıyla tamamlandı" -ForegroundColor Green

    # Test publish
    Write-Host "Publish ediliyor..."
    $publishResult = dotnet publish --configuration Release --output ".\test-publish" --self-contained false
    if ($LASTEXITCODE -neq 0) {
        Write-Host "❌ Publish başarısız! Hata: $publishResult" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Publish başarıyla tamamlandı" -ForegroundColor Green

    Write-Host "🎉 Tüm testler başarılı!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Hata: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Test dosyası temizleniyor..." -ForegroundColor Yellow
Remove-Item "test-build.ps1" -Force -ErrorAction Sil

Write-Host "Test başarıyla tamamlandı!" -ForegroundColor Green