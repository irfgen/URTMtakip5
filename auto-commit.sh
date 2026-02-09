#!/bin/bash

# Otomatik backup ve commit scripti
# Bu script değişiklikleri otomatik commit eder

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
CURRENT_BRANCH=$(git branch --show-current)

echo "📝 Otomatik commit işlemi başlıyor..."
echo "Dal: $CURRENT_BRANCH"
echo "Zaman: $TIMESTAMP"

# Değişen dosyaları kontrol et
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Commit edilecek değişiklik yok."
    exit 0
fi

echo "📋 Değişen dosyalar:"
git status --short

# Commit mesajı al veya otomatik oluştur
if [ -z "$1" ]; then
    COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MSG="$1"
fi

# Commit yap
git add .
git commit -m "$COMMIT_MSG"

if [ $? -eq 0 ]; then
    echo "✅ Commit başarılı: $COMMIT_MSG"
    
    # Push etmek isteyip istemediğini sor
    read -p "🔄 Origin'e push etmek istiyor musunuz? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin $CURRENT_BRANCH
        echo "✅ Push tamamlandı!"
    fi
else
    echo "❌ Commit başarısız!"
    exit 1
fi
