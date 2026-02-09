#!/bin/bash

# Git workflow helper script
# Bu script ile kolayca dal değiştirebilir ve güncelleyebilirsiniz

case "$1" in
    "dev")
        echo "🔧 Geliştirme moduna geçiliyor..."
        git checkout develop
        git pull origin develop
        echo "✅ Develop dalındasınız. Kodlamaya başlayabilirsiniz!"
        ;;
    
    "prod")
        echo "🏭 Production moduna geçiliyor..."
        git checkout production
        git pull origin production
        echo "✅ Production dalındasınız."
        ;;
    
    "release")
        echo "🚀 Develop'daki değişiklikler production'a aktarılıyor..."
        
        # Önce develop'ı güncelle
        git checkout develop
        git pull origin develop
        
        # Production'a geç ve merge et
        git checkout production
        git pull origin production
        git merge develop
        
        # Conflict yoksa push et
        if [ $? -eq 0 ]; then
            echo "📤 Production'a push ediliyor..."
            git push origin production
            echo "✅ Release tamamlandı!"
        else
            echo "❌ Merge conflict var! Manuel olarak çözmeniz gerekiyor."
            git status
        fi
        ;;
    
    "feature")
        if [ -z "$2" ]; then
            echo "❌ Feature adı gerekli: ./git-workflow.sh feature feature-name"
            exit 1
        fi
        
        echo "🌟 Yeni feature dalı oluşturuluyor: $2"
        git checkout develop
        git pull origin develop
        git checkout -b "feature/$2"
        echo "✅ Feature/$2 dalında çalışmaya başlayabilirsiniz!"
        ;;
    
    "merge-feature")
        if [ -z "$2" ]; then
            echo "❌ Feature adı gerekli: ./git-workflow.sh merge-feature feature-name"
            exit 1
        fi
        
        echo "🔗 Feature/$2 develop'a merge ediliyor..."
        git checkout develop
        git pull origin develop
        git merge "feature/$2"
        
        if [ $? -eq 0 ]; then
            git push origin develop
            git branch -d "feature/$2"
            echo "✅ Feature merge edildi ve silindi!"
        else
            echo "❌ Merge conflict var! Manuel olarak çözmeniz gerekiyor."
        fi
        ;;
    
    "status")
        echo "📊 Git Durumu:"
        echo "==============="
        echo "Mevcut dal: $(git branch --show-current)"
        echo ""
        echo "Son commitler:"
        git log --oneline -5
        echo ""
        echo "Değişen dosyalar:"
        git status --porcelain
        ;;
    
    *)
        echo "🔧 Git Workflow Helper"
        echo "======================"
        echo ""
        echo "Kullanım:"
        echo "  $0 dev                    # Develop dalına geç"
        echo "  $0 prod                   # Production dalına geç"
        echo "  $0 release                # Develop'ı production'a merge et"
        echo "  $0 feature <isim>         # Yeni feature dalı oluştur"
        echo "  $0 merge-feature <isim>   # Feature'ı develop'a merge et"
        echo "  $0 status                 # Git durumunu göster"
        echo ""
        echo "Örnek workflow:"
        echo "  1. $0 feature yeni-ozellik    # Yeni özellik için dal oluştur"
        echo "  2. # Kodunuzu yazın ve commit edin"
        echo "  3. $0 merge-feature yeni-ozellik  # Develop'a merge edin"
        echo "  4. $0 release                  # Production'a yayınlayın"
        ;;
esac
