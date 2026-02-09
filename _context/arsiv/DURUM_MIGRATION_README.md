# İş Emri Durum Migration Rehberi

Bu dokümantasyon, iş emri durumlarını 3'ten 9'a çıkaran migration işlemini açıklar.

## 📋 Migration Özeti

### Eski Durumlar (3 adet)
- `Beklemede` - İş emri bekleme durumunda
- `Siparis` - Malzeme siparişi verilmiş
- `Iptal` - İş emri iptal edilmiş

### Yeni Durumlar (9 adet)
- `sipariş verilecek` - İş emri oluşturuldu, sipariş verilmedi
- `sparişte` - Malzeme siparişi verildi (eski Siparis)
- `beklemede` - Malzemeler geldi, üretim bekleniyor (eski Beklemede)
- `iptal` - İş emri iptal edildi (eski Iptal)
- `freze` - Freze tezgahında işleniyor
- `torna` - Torna tezgahında işleniyor
- `5 metre` - 5 metre tezgahında işleniyor
- `6 metre` - 6 metre tezgahında işleniyor
- `kaynak` - Kaynak tezgahında işleniyor

## 🚀 Migration Adımları

### 1. Mevcut Durumu Kontrol Et
```bash
npm run check-durum-status
```

Bu komut size:
- Mevcut iş emri sayılarını
- Durum dağılımını
- Backup durumunu
- Migration geçmişini
gösterecektir.

### 2. Migration'ı Çalıştır
```bash
npm run migrate-durum
```

Migration şu işlemleri yapar:
1. ✅ Mevcut verileri `is_emirleri_backup` tablosuna yedekler
2. ✅ Durum kolonunu string formatına çevirir
3. ✅ Eski durumları yeni durumlarla eşler
4. ✅ Yeni ENUM değerlerini uygular
5. ✅ Migration logunu kaydeder
6. ✅ İstatistikleri gösterir

### 3. Rollback (Gerekirse)
```bash
npm run rollback-durum-migration
```

Bu komut migration'ı geri alır ve eski duruma döndürür.

## 📊 Durum Dönüşüm Tablosu

| Eski Durum | Yeni Durum | Açıklama |
|------------|------------|----------|
| `Beklemede` | `beklemede` | Küçük harfe dönüştürüldü |
| `Siparis` | `sparişte` | İsim değişti |
| `Iptal` | `iptal` | Küçük harfe dönüştürüldü |
| `Uretimde` | `beklemede` | Beklemede durumuna çevrildi |
| `Imalatta` | `beklemede` | Beklemede durumuna çevrildi |
| `Tamamlandi` | `beklemede` | Beklemede durumuna çevrildi |

## ⚠️ Önemli Notlar

### Migration Öncesi
- Database yedeği alınmasını öneririz
- Sunucu trafiğinin az olduğu saatlerde çalıştırın
- Migration yaklaşık 30 saniye - 2 dakika arası sürebilir

### Migration Sonrası
- Sequelize modellerini güncelleyin (`IsEmri.js`)
- Frontend'i yeni durumları destekleyecek şekilde güncelleyin
- API testlerini çalıştırın

### Güvenlik
- Migration transaction kullanır, hata durumunda otomatik rollback yapar
- Backup tablosu migration tamamlandıktan sonra da kalır
- Migration logs tablosunda tüm geçmiş tutulur

## 🔧 Sorun Giderme

### Migration Başarısız Olursa
1. Error mesajını kontrol edin
2. Database bağlantısını doğrulayın
3. Disk alanının yeterli olduğundan emin olun
4. Rollback ile eski duruma dönün

### Backup Tablosu Zaten Varsa
```bash
# SQLite shell ile backup tablosunu silin
sqlite3 database.sqlite "DROP TABLE IF EXISTS is_emirleri_backup;"
```

### Migration Tekrar Çalıştırılırsa
Migration idempotent değildir. Tekrar çalıştırmadan önce rollback yapın.

## 📝 Log Takibi

Migration logs `migration_logs` tablosunda tutulur:
```sql
SELECT * FROM migration_logs WHERE migration_name = 'update_is_emri_durum_enum';
```

## 🎯 Sonraki Adımlar

Migration tamamlandıktan sonra:
1. [ ] `IsEmri.js` modelini güncelleyin
2. [ ] Controller'larda durum validasyonlarını güncelleyin
3. [ ] Frontend kanban board'u 9 kolona çıkarın
4. [ ] Redux store'u güncelleyin
5. [ ] CSS durum renklerini ekleyin
6. [ ] API testlerini çalıştırın

## 📞 Destek

Sorun yaşarsanız:
- Migration log dosyalarını kontrol edin
- Database backup'ını geri yükleyin
- Development ekibi ile iletişime geçin
