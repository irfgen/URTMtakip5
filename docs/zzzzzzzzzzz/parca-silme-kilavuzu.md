# Parça Silme Kılavuzu

Bu belge, parçaların nasıl güvenli bir şekilde silinebileceğini açıklar. Parçalar veri bütünlüğünü korumak için diğer tablolara referanslar içerebilir, bu nedenle silme işlemi dikkatli yapılmalıdır.

## Parça Silme Sorunu

Bir parça silinmeye çalışıldığında, eğer diğer tablolarda bu parçaya referans veren kayıtlar varsa "Bu parça başka bir tabloda kullanıldığı için silinemiyor." hatası alınır. Bu referanslar şunları içerebilir:

1. **İş Emirleri**: `is_emirleri` tablosundaki parça referansları
2. **Fason İş Emirleri**: `fason_is_emirleri` tablosundaki parça referansları
3. **Fason Teklifler**: `fason_teklifler` tablosundaki parça referansları
4. **Grup İlişkileri**: `grup_parcalar` ilişki tablosundaki parça referansları

## Çözüm Yöntemleri

### 1. Web Arayüzü Üzerinden Silme

Parçalar sayfasında silme işlemi yaptığınızda:

1. İlk olarak normal silme işlemi denenir
2. Eğer referanslar nedeniyle başarısız olursa, bir uyarı görüntülenir
3. Bu uyarıda ilişkili kayıtlar detaylı olarak gösterilir
4. "Yine de bu parçayı ve ilişkili tüm kayıtları silmek istiyor musunuz?" sorusuna "Tamam" derseniz, parça ve ilişkili tüm kayıtlar silinir

### 2. Referansları Kontrol Etmek İçin

Bir parçanın nerede kullanıldığını görmek için şu komutu kullanabilirsiniz:

```bash
./find-parca-references.sh <parca_kodu>
```

Örnek:
```bash
cd backend
./find-parca-references.sh "ABC123"
```

Bu komut, belirtilen parça kodunun tüm referanslarını listeler.

### 3. Komut Satırından Silme

Parçayı ve ilişkili tüm kayıtları komut satırından zorla silmek için:

```bash
node soft-delete-parca.js <parca_kodu> --force
```

Önce referansları görmek isterseniz (silmeden):

```bash
node soft-delete-parca.js <parca_kodu>
```

## Zorla Silmenin Etkileri

Bir parça zorla silindiğinde şu işlemler gerçekleşir:

1. **Grup İlişkileri**: Parça ve grup arasındaki ilişki kayıtları silinir (grup_parcalar tablosundan)
2. **Fason Teklifler**: Bu parça için tüm fason teklifler silinir
3. **Fason İş Emirleri**: Bu parça için tüm fason iş emirleri silinir
4. **İş Emirleri**: İş emirlerindeki parça referansı temizlenir (NULL değeri atanır, iş emri silinmez)
5. **Parça**: Son olarak parça kaydının kendisi silinir

> **Dikkat**: Zorla silme işlemi verilerin kalıcı olarak silinmesine neden olur. Veri bütünlüğü açısından önce parça referanslarını manuel olarak kaldırmak daha güvenlidir.
