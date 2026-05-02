# 38. PDCA (Plan-Do-Check-Act) Modülü

## Genel Bakış

PDCA modülü, sürekli iyileştirme döngüsü için planlama, uygulama, kontrol ve aksiyon döngüsünü yönetir.

**Konum:** `docs/pdca/`

---

## Modül Amacı

- PDCA döngüsü yönetimi
- İyileştirme projeleri takibi
- Aksiyon planları
- Sonuç ölçümü

---

## PDCA Döngüsü

```
    ┌─────────────┐
    │    PLAN    │
    │  (Planla)  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │     DO      │
    │  (Uygula)   │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │    CHECK    │
    │  (Kontrol)  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │     ACT     │
    │ (Aksiyon)   │
    └─────────────┘
```

---

## PDCA Aşamaları

### PLAN (Planla)
- Problem tanımı
- Hedef belirleme
- Kök neden analizi
- Çözüm planı

### DO (Uygula)
- Pilot uygulama
- Eğitim
- Planın hayata geçirilmesi

### CHECK (Kontrol Et)
- Sonuçları ölçme
- Hedef karşılaştırması
- Sapma analizi

### ACT (Aksiyon Al)
- Standardize et
- Ölçeklendir
- veya yeniden planla

---

## Belge Yapısı

```
docs/pdca/
├── PLAN_template.md
├── DO_checklist.md
├── CHECK_metrics.md
└── ACT_followup.md
```

---

## Kullanım

1. **Proje Oluşturma:** PDCA şablonu ile yeni proje başlatma
2. **Aşama Takibi:** Her aşamayı tamamlama ve belgeleme
3. **Ölçüm:** Sonuçları kaydetme ve değerlendirme
4. **İyileştirme:** Bir sonraki döngüye aktarma

---

## İlişkili Modüller

- **Uygunsuzluklar** - Problem kaynağı
- **Arıza-Bakım** - İyileştirme fırsatları
- **Raporlar** - Sonuç ölçümü

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-04 | İlk versiyon |
| 1.1 | 2024-08 | Şablonlar eklendi |