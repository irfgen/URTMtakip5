# 37. CONTEXT (Context Engineering) Modülü

## Genel Bakış

Context modülü, proje bağlamı, notları ve geçici veri depolama için kullanılan yardımcı bir modüldür.

**Konum:** `context/`, `_context/`

---

## Modül Amacı

- Proje bağlam bilgileri
- Geçici notlar
- Arşivlenmiş veriler
- Referans dökümanları

---

## Alt Klasörler

### context/
- Aktif bağlam dosyaları
- Geçici notlar
- Ara veriler

### _context/arsiv/
- Arşivlenmiş dosyalar
- Eski proje verileri

---

## İçerik Türleri

| Tür | Açıklama |
|-----|----------|
| .md | Markdown notlar |
| .json | JSON formatlı veri |
| .txt | Düz metin |
| .log | Log dosyaları |

---

## Örnek Kullanım

### Proje Bağlamı
```markdown
# Proje: URTMtakip5
# Versiyon: v14.dev1
# Son güncelleme: 2025-01-15

## Aktif Görevler
- [ ] Yeni modül geliştirme
- [ ] Hata düzeltme

## Notlar
...
```

---

## Yönetim

- Düzenli temizlik (artık kullanılmayan dosyalar)
- Arşivleme (biten projeler)
- Yedekleme

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-01 | İlk versiyon |