# 39. n8n WORKFLOWS Modülü

## Genel Bakış

n8n Workflows modülü, n8n otomasyon platformu ile entegrasyon için workflow dosyalarını ve konfigürasyonları içerir.

**Konum:** `docs/workflows/`

---

## Modül Amacı

- n8n workflow import/export
- Otomasyon senaryoları
- Entegrasyon ayarları
- Webhook yönetimi

---

## n8n Nedir?

n8n (nodemation), açık kaynak kodlu bir iş akışı otomasyon aracıdır. Farklı uygulamaları ve servisleri bağlayarak süreçleri otomatikleştirir.

---

## Workflow Türleri

### Fatura İşleme
- Fatura e-postalarını okuma
- PDF çıkarma
- Veritabanına kaydetme

### Bildirimler
- Stok kritik uyarıları
- İş emri durumu bildirimleri
- Email/SMS gönderimi

### Entegrasyonlar
- ERP entegrasyonu
- CRM bağlantısı
- EDI entegrasyonu

---

## Konfigürasyon

### Ortam Değişkenleri
```env
N8N_HOST=http://localhost:5673
N8N_API_KEY=your_api_key
N8N_WEBHOOK_URL=https://example.com/webhook
```

### Workflow JSON Yapısı
```json
{
  "name": "Fatura İşleme",
  "nodes": [
    {
      "name": "Email Trigger",
      "type": "n8n-nodes-base.email",
      "parameters": {}
    },
    {
      "name": "PDF Parser",
      "type": "n8n-nodes-base.pdf",
      "parameters": {}
    },
    {
      "name": "Database Save",
      "type": "n8n-nodes-base.postgres",
      "parameters": {}
    }
  ],
  "connections": {}
}
```

---

## Webhook Endpoint'leri

| Endpoint | Açıklama |
|----------|----------|
| `/webhook/fatura` | Fatura verisi al |
| `/webhook/stok` | Stok güncellemesi |
| `/webhook/siparis` | Sipariş bildirimi |

---

## Kurulum

1. n8n'i kurun: `npm install -g n8n`
2. Workflow'ları import edin
3. Credential'ları ayarlayın
4. Aktif edin

---

## İlişkili Modüller

- **Faturalar** - Fatura verisi
- **Stok Kartları** - Stok güncellemeleri
- **Siparişler** - Sipariş bildirimleri

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-05 | İlk versiyon |
| 1.1 | 2024-09 | Fatura workflow eklendi |
| 1.2 | 2024-12 | Bildirim workflow'ları |