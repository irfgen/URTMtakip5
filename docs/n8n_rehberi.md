# n8n Kapsamlı Rehber

**Sürüm:** 1.0
**Son Güncelleme:** 2025-12-25

---

## İçindekiler

1. [n8n Nedir?](#n8n-nedir)
2. [Temel Kavramlar](#temel-kavramlar)
3. [Workflow Oluşturma](#workflow-oluşturma)
4. [Node Türleri](#node-türleri)
5. [Temel Node'lar](#temel-nodelar)
6. [Trigger Node'ları](#trigger-nodeları)
7. [Veri Akışı ve Expressions](#veri-akışı-ve-expressions)
8. [Pratik Örnekler](#pratik-örnekler)
9. [İpuçları ve En İyi Uygulamalar](#ipuçları-ve-en-iyi-uygulamalar)
10. [Kaynaklar](#kaynaklar)

---

## n8n Nedir?

**n8n**, açık kaynaklı bir workflow otomasyon platformudur. Uygulamaları, API'leri ve servisleri birbirine bağlayan görsel bir arayüz sunar. 1000+ entegrasyon ile kendi otomasyonlarınızı kolayca oluşturabilirsiniz.

### Temel Özellikler

- **Açık Kaynak:** Kendi sunucunuzda barınabilir, tam kontrol sizde
- **Görsel Düzenleyici:** Sürükle-bırak ile workflow oluşturma
- **1000+ Entegrasyon:** Popüler uygulamalar ve servisler
- **Esnek:** Kendi kodunuzu ekleyebilme (JavaScript/TypeScript)
- **Self-hosted:** Kendi altyapınızda çalıştırma

---

## Temel Kavramlar

### Workflow (İş Akışı)

Workflow, n8n'deki temel yapı taşıdır. Bir veya daha fazla node'un birbirine bağlanarak oluşturduğu otomasyon sürecidir.

```
[Trigger] → [Action 1] → [Action 2] → [Output]
```

### Node (Düğüm)

Node, workflow içindeki tek bir işlemi temsil eder. Her node belirli bir işlevi yerine getirir:

- Veri alır (input)
- İşlem yapar (process)
- Sonuç üretir (output)

### Data Items (Veri Öğeleri)

n8n'de veriler "items" (öğeler) formatında akar. Her bir item bir JSON nesnesidir:

```json
{
  "json": {
    "name": "Ahmet",
    "age": 30,
    "email": "ahmet@example.com"
  },
  "binary": {
    "data": {
      "file": "base64_encoded_data"
    }
  },
  "pairedItem": {
    "item": 0,
    "input": 1
  }
}
```

### Connections (Bağlantılar)

Node'lar arasındaki veri akışını sağlayan çizgilerdir. Bağlantılar, bir node'un çıktısını diğer node'un girdisine aktarır.

---

## Workflow Oluşturma

### Adım 1: Yeni Workflow Oluşturma

1. n8n arayüzünde "New Workflow" butonuna tıklayın
2. İsim verin ve açıklama ekleyin
3. Boş canvas ekranı açılacak

### Adım 2: Trigger Node Ekleme

Her workflow bir trigger ile başlar:

1. Canvas'a tıklayın
2. "Add nodes" veya "+" butonuna tıklayın
3. Trigger kategorisinden bir node seçin:
   - **Manual Trigger:** Manuel başlatma için
   - **Webhook:** HTTP isteği ile başlatma
   - **Schedule/Cron:** Zamanlama ile başlatma

### Adım 3: Action Node'ları Ekleme

1. Trigger node'undan çıkan bağlantı noktasına tıklayın
2. İstediğiniz node'u arayın ve ekleyin
3. Node'u yapılandırın
4. Gerekirse daha fazla node ekleyin

### Adım 4: Test Etme

1. Üstteki "Test workflow" butonuna tıklayın
2. Her adımda veri akışını gözlemleyin
3. Hata varsa düzeltin

### Adım 5: Kaydetme ve Aktivasyon

1. "Save" butonu ile kaydedin
2. Production için "Active" durumuna getirin

---

## Node Türleri

### 1. Trigger Nodes (Tetikleyici Node'lar)

Workflow'u başlatan node'lardır. Sadece workflow'un başında bulunurlar.

**Örnekler:**
- Manual Trigger
- Webhook
- Schedule (Cron)
- Email Trigger
- File Watcher

### 2. Action Nodes (Eylem Node'ları)

Veri işleme ve dış servislerle etkileşim kuran node'lardır.

**Alt Kategoriler:**

#### Core Nodes
n8n'in yerleşik node'larıdır. Dış servise bağlantı gerektirmez.

- Logic (IF, Switch)
- Data (Filter, Merge, Set)
- Utility (HTTP Request, Code, Wait)

#### App Nodes
Üçüncü parti servislerle entegrasyon sağlayan node'lardır.

- Google Sheets, Gmail, Drive
- Slack, Discord, Teams
- Notion, Airtable, Trello
- GitHub, GitLab
- OpenAI, Anthropic

---

## Temel Node'lar

### 1. Manual Trigger

**Amaç:** Workflow'u manuel olarak başlatmak için kullanılır.

**Kullanım Alanları:**
- Test ve geliştirme
- Manuel işlemler
- Onay gerektiren iş akışları

**Özellikler:**
- Hiçbir parametre gerektirmez
- "Execute Workflow" butonu ile çalıştırılır

### 2. Webhook

**Amaç:** HTTP isteği ile workflow'u başlatmak.

**Parametreler:**
- **HTTP Method:** GET, POST, PUT, DELETE
- **Path:** Webhook URL yolu (örn: `/my-webhook`)
- **Authentication:** Opsiyonel kimlik doğrulama
- **Response Mode:** Çağırana dönecek cevap

**Örnek Kullanım:**
```javascript
// Webhook URL: https://n8n.example.com/webhook/leads
// Gönderilen veriye erişim:
{
  "json": {
    "name": "{{ $json.body.name }}",
    "email": "{{ $json.body.email }}"
  }
}
```

### 3. Schedule (Cron)

**Amaç:** Belirli zaman aralıklarında workflow'u başlatmak.

**Parametreler:**
- **Mode:** Cron expression veya Every X
- **Cron Expression:** `* * * * *` formatı
- **Trigger at Startup:** Açılışta tetikleme

**Cron Expression Formatı:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Haftanın günü (0-6, Pazar=0)
│ │ │ └─── Ay (1-12)
│ │ └───── Gün (1-31)
│ └─────── Saat (0-23)
└───────── Dakika (0-59)
```

**Örnekler:**
- `0 9 * * *` - Her gün 09:00'da
- `*/15 * * * *` - Her 15 dakikada bir
- `0 0 * * 1` - Her Pazartesi gece yarısı

### 4. HTTP Request

**Amaç:** Herhangi bir HTTP API'sine istek göndermek.

**Parametreler:**
- **Method:** GET, POST, PUT, PATCH, DELETE
- **URL:** İstek yapılacak adres
- **Authentication:** None, Basic Auth, Bearer Token, etc.
- **Headers:** İsteğe özel başlıklar
- **Body:** İstek gövdesi (JSON, form-data, etc.)
- **Query Parameters:** URL parametreleri

**Örnek GET İsteği:**
```json
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "headers": {
    "Authorization": "Bearer {{ $env.API_TOKEN }}"
  }
}
```

**Örnek POST İsteği:**
```json
{
  "method": "POST",
  "url": "https://api.example.com/users",
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "name",
        "value": "{{ $json.name }}"
      },
      {
        "name": "email",
        "value": "{{ $json.email }}"
      }
    ]
  }
}
```

### 5. Set (Edit Fields)

**Amaç:** Veriye yeni alanlar eklemek veya mevcut alanları değiştirmek.

**Kullanım:**
- Veri transformasyonu
- Alan hesaplama
- Yapılandırma verisi ekleme

**Örnek:**
```json
{
  "fields": {
    "values": [
      {
        "name": "fullName",
        "value": "={{ $json.firstName }} {{ $json.lastName }}"
      },
      {
        "name": "timestamp",
        "value": "={{ $now }}"
      },
      {
        "name": "processed",
        "value": "=true"
      }
    ]
  }
}
```

### 6. Code

**Amaç:** JavaScript kodu ile özel işlemler yapmak.

**Özellikler:**
- Gelen tüm item'lara erişim (`items`)
- Önceki node'lardan veri okuma
- Karmaşık veri işleme
- Koşullu mantık

**Örnek:**
```javascript
// Gelen item'ları işle
const processedItems = items.map(item => {
  const { json } = item;

  // Yeni hesaplanan alanlar
  return {
    json: {
      ...json,
      fullName: `${json.firstName} ${json.lastName}`,
      ageCategory: json.age >= 18 ? 'adult' : 'minor',
      processedAt: new Date().toISOString()
    }
  };
});

// Sonuçları döndür
return processedItems;
```

**Expresssions Kullanımı:**
```javascript
// Diğer node'lardan veri alma
const previousData = $('HTTP Request').first().json;
const allItems = $('HTTP Request').all();
```

### 7. IF (Condition)

**Amaç:** Koşullu olarak workflow'u farklı yönlere ayırmak.

**Parametreler:**
- **Conditions:** Bir veya daha fazla koşul
- **Combine Operation:** ALL (tümü) veya ANY (herhangi biri)
- **Logical Operator:** AND veya OR

**Örnek Koşullar:**
```json
{
  "conditions": {
    "options": {
      "caseSensitive": true,
      "leftValue": "",
      "typeValidation": "strict"
    },
    "conditions": [
      {
        "leftValue": "={{ $json.age }}",
        "rightValue": 18,
        "operator": {
          "type": "number",
          "operation": "gte"
        }
      },
      {
        "leftValue": "={{ $json.country }}",
        "rightValue": "TR",
        "operator": {
          "type": "string",
          "operation": "equals"
        }
      }
    ],
    "combineOperation": "all"
  }
}
```

**Operator Türleri:**
- **String:** equals, notEquals, contains, notContains, startsWith, endsWith
- **Number:** equals, notEquals, lessThan, greaterThan, etc.
- **Boolean:** isTrue, isFalse
- **Array:** isEmpty, includes

### 8. Switch

**Amaç:** Değerlere göre workflow'u farklı yollara ayırmak (IF'e alternatif).

**Parametreler:**
- **Rules:** Değer-çıkış eşleşmeleri
- **Fallback Rule:** Eşleşme yoksa varsayılan yol

**Örnek:**
```json
{
  "rules": {
    "values": [
      {
        "output": 1,
        "conditions": {
          "options": {},
          "conditions": [
            {
              "leftValue": "={{ $json.status }}",
              "rightValue": "active",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            }
          ],
          "combineOperation": "all"
        }
      },
      {
        "output": 2,
        "conditions": {
          "options": {},
          "conditions": [
            {
              "leftValue": "={{ $json.status }}",
              "rightValue": "pending",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            }
          ],
          "combineOperation": "all"
        }
      }
    ]
  }
}
```

### 9. Filter

**Amaç:** Veri setinden belirli koşulları sağlayan item'ları ayıklamak.

**Parametreler:**
- **Conditions:** Filtreleme koşulları
- **Combine Operation:** ALL veya ANY

**Örnek:**
```json
{
  "conditions": {
    "options": {},
    "conditions": [
      {
        "leftValue": "={{ $json.price }}",
        "rightValue": 100,
        "operator": {
          "type": "number",
          "operation": "gt"
        }
      },
      {
        "leftValue": "={{ $json.stock }}",
        "rightValue": 0,
        "operator": {
          "type": "number",
          "operation": "gt"
        }
      }
    ],
    "combineOperation": "all"
  }
}
```

### 10. Merge

**Amaç:** İki farklı veri kaynağını birleştirmek.

**Merge Modları:**

1. **Append:** Veri setlerini alt alta ekle
2. **Merge by Index:** Aynı indeksteki item'ları birleştir
3. **Merge by Key:** Belirli bir anahtara göre birleştir (SQL JOIN benzeri)
4. **Multiplex:** Her item'ı diğer input'un tüm item'larıyla eşleştir

**Merge by Index Örneği:**
```json
{
  "mode": "combine",
  "combinationMode": "mergeByIndex",
  "options": {}
}
```

**Merge by Key Örneği:**
```json
{
  "mode": "combine",
  "combinationMode": "multiplex",
  "options": {
    "propertyName": "userId"
  }
}
```

### 11. Split In Batches

**Amaç:** Büyük veri setlerini küçük gruplara (batch) bölmek.

**Kullanım Alanları:**
- API rate limiting
- Toplu işlem yönetimi
- Bellek optimizasyonu

**Parametreler:**
- **Batch Size:** Her batch'teki item sayısı
- **Reset:** false

**Örnek:**
```json
{
  "batchSize": 50,
  "options": {}
}
```

### 12. Wait

**Amaç:** Workflow'u belirli bir süre bekletmek.

**Parametreler:**
- **Amount:** Bekleme süresi
- **Unit:** saniye, dakika, saat

### 13. No-Op (No Operation)

**Amaç:** Veriyi olduğu gibi geçmek (pas-through).

**Kullanım Alanları:**
- Debug
- Yer tutucu
- Branch birleştirme

---

## Trigger Node'ları

### 1. Email Trigger

**Amaç:** Gelen e-postaları dinlemek.

**Parametreler:**
- **IMAP Server:** Mail sunucu adresi
- **Port:** 993 (SSL) veya 143 (STARTTLS)
- **Username:** E-posta adresi
- **Password:** Uygulama şifresi
- **Filters:** Konu, gönderen, ek filtreleri

### 2. File Trigger

**Amaç:** Dosya sistemi değişikliklerini izlemek.

**Kullanım:**
- Klasör izleme
- Dosya oluşturma/düzenleme/silme olayları

### 3. MQTT Trigger

**Amaç:** MQTT mesajlarını dinlemek.

**Parametreler:**
- **Broker URL:** mqtt://broker.example.com
- **Topic:** Mesaj konusu
- **QoS:** Quality of Service seviyesi

### 4. RSS Feed Trigger

**Amaç:** RSS beslemelerini izlemek.

**Parametreler:**
- **URL:** RSS feed adresi
- **Poll Times:** Kontrol sıklığı

### 5. PostgreSQL / MySQL Trigger

**Amaç:** Veritabanı değişikliklerini dinlemek.

**Kullanım:**
- Yeni kayıtlar
- Güncellemeler
- Silme işlemleri

---

## Veri Akışı ve Expressions

### Expression Sözdizimi

n8n'de veriye erişmek için `={{ }}` sözdizimi kullanılır:

```javascript
// Mevcut item'ın JSON verisine erişim
{{ $json }}

// Belirli bir alana erişim
{{ $json.name }}
{{ $json.address.city }}

// İç içe (nested) erişim
{{ $json.data.users[0].name }}
```

### Node Referansları

```javascript
// Önceki node'un çıktısına erişim
{{ $node.name }}

// Bir önceki node
{{ $node["HTTP Request"].json }}

// Belirli bir node'dan ilk item
{{ $node["Set"].first().json }}

// Belirli bir node'dan tüm item'lar
{{ $node["HTTP Request"].all() }}
```

### Fonksiyonlar

**Tarih/Zaman:**
```javascript
{{ $now }}              // Şu anki timestamp
{{ $today }}            // Bugünün tarihi
{{ $yesterday }}        // Dün
{{ $tomorrow }}         // Yarın
```

**Metin:**
```javascript
{{ $json.name.toLowerCase() }}
{{ $json.email.toUpperCase() }}
{{ $json.text.trim() }}
{{ $json.name.substring(0, 10) }}
```

**Dizi:**
```javascript
{{ $json.items.length }}
{{ $json.items[0] }}
{{ $json.items.slice(0, 5) }}
```

**Matematik:**
```javascript
{{ $json.price * 1.18 }}              // KDV hesaplama
{{ $json.total + $json.tax }}
{{ Math.round($json.value) }}
```

**Koşullu:**
```javascript
{{ $json.age >= 18 ? 'adult' : 'minor' }}
{{ $json.status || 'unknown' }}
```

### Environment Değişkenleri

```javascript
{{ $env.API_KEY }}
{{ $env.DATABASE_URL }}
{{ $env.WEBHOOK_URL }}
```

### Veri Yapılandırma

**Array Map:**
```javascript
{% for item in $json.items -%}
{
  "id": {{ item.id }},
  "name": "{{ item.name }}"
}
{% if !loop.last %},{% endif %}
{% endfor %}
```

**Advanced Filtering:**
```javascript
// Code node ile filtreleme
return items.filter(item => item.json.price > 100);
```

---

## Pratik Örnekler

### Örnek 1: Webhook ile Veri Toplama

**Senaryo:** Bir form gönderildiğinde veriyi alıp Google Sheets'e kaydetme.

```
[Webhook] → [Set] → [Google Sheets]
```

**Webhook Node:**
- Method: POST
- Path: /submit-form
- Response Mode: `{"success": true}`

**Set Node:**
```json
{
  "fields": {
    "values": [
      {
        "name": "timestamp",
        "value": "={{ $now }}"
      },
      {
        "name": "name",
        "value": "={{ $json.body.name }}"
      },
      {
        "name": "email",
        "value": "={{ $json.body.email }}"
      },
      {
        "name": "message",
        "value": "={{ $json.body.message }}"
      }
    ]
  }
}
```

**Google Sheets Node:**
- Operation: Append
- Sheet ID: `spreadsheet_id`
- Range: `A1`

### Örnek 2: API'den Veri Çekme ve Filtreleme

**Senaryo:** JSON API'den ürünleri çek, stoğu 0'dan büyükleri filtrele.

```
[Schedule] → [HTTP Request] → [Filter] → [Set] → [HTTP Request]
```

**Schedule Node:**
- Cron: `0 9 * * *` (Her sabah 09:00)

**HTTP Request (API):**
- URL: `https://api.example.com/products`
- Method: GET

**Filter Node:**
```json
{
  "conditions": {
    "conditions": [
      {
        "leftValue": "={{ $json.stock }}",
        "rightValue": 0,
        "operator": {
          "type": "number",
          "operation": "gt"
        }
      }
    ]
  }
}
```

**Set Node (Bildirim mesajı):**
```json
{
  "fields": {
    "values": [
      {
        "name": "message",
        "value": "={{ $json.name }} stoğu: {{ $json.stock }}"
      }
    ]
  }
}
```

### Örnek 3: Karmaşik Veri İşleme

**Senaryo:** İki API'den veri çek ve birleştir.

```
[Manual Trigger] → [HTTP Request 1] ─┐
                                    ├→ [Merge] → [Set] → [Output]
[Manual Trigger] → [HTTP Request 2] ─┘
```

**HTTP Request 1:** Kullanıcı bilgileri
**HTTP Request 2:** Sipariş bilgileri

**Merge Node:**
- Mode: Merge by Key
- Property: `userId`

**Set Node:**
```javascript
// Code node ile
return items.map(item => {
  const { json } = item;
  return {
    json: {
      userId: json.user.id,
      userName: json.user.name,
      userEmail: json.user.email,
      orderId: json.order.id,
      orderTotal: json.order.total,
      orderDate: json.order.date,
      fullReport: `${json.user.name} - ${json.order.total} TL`
    }
  };
});
```

### Örnek 4: Koşullu İş Akışı

**Senaryo:** Kullanıcı yaşına göre farklı işlemler yap.

```
[Webhook] → [Set] → [IF] ┬→ [Yetişkin İşlemleri] ─┐
                      ├→ [Çocuk İşlemleri] ──────┤→ [Merge] → [Response]
                      └→ [Yaşlı İşlemleri] ──────┘
```

**IF Node Koşulu:**
```json
{
  "conditions": {
    "conditions": [
      {
        "leftValue": "={{ $json.age }}",
        "rightValue": 18,
        "operator": { "operation": "gte", "type": "number" }
      }
    ]
  }
}
```

### Örnek 5: Batch İşleme

**Senaryo:** 1000 kullanıcıyı 50'şerli gruplar halinde işle.

```
[HTTP Request] → [Split In Batches] ┬→ [Process] ─┐
                                   ├→ [Process] ──┤→ [Final]
                                   └→ [Process] ──┘
```

**Split In Batches:**
- Batch Size: 50

**Process Node:** Her bir kullanıcı için işlem yap

### Örnek 6: Hata Yönetimi

**Senaryo:** API başarısız olursa yeniden dene.

```
[HTTP Request] → [IF] ┬→ [Success Path] ──┐
                   └→ [Wait] → [Retry] ───┤→ [Final]
                                           └→ [Error Logging]
```

**IF Node (Hata kontrolü):**
```javascript
// Code node ile hata kontrolü
if ($node["HTTP Request"].json.error) {
  return { json: { hasError: true } };
} else {
  return { json: { hasError: false } };
}
```

---

## İpuçları ve En İyi Uygulamalar

### 1. Veri Yapısı

- **Sadece gerekli veriyi tutun:** Gereksiz alanları filtreleyin
- **İsimlendirme:** Anlaşılır anahtar isimleri kullanın
- **Tip güvenliği:** Veri tiplerini tutarlı tutun

### 2. Performance

- **Batch kullanın:** Büyük veri setlerini bölün
- **Parallel execution:** Mümkünse paralel çalıştırın
- **Cache:** sık kullanılan verileri önbelleğe alın

### 3. Hata Ayıklama

- **Test workflow:** Her node'u test edin
- **Debug mode:** Detaylı log'ları aktif edin
- **Step-by-step:** Her adımı ayrı ayrı test edin

### 4. Güvenlik

- **Credentials:** Hassas bilgileri credentials olarak saklayın
- **Environment değişkenleri:** Ortam bazlı konfigürasyon
- **Input validation:** Gelen veriyi doğrulayın

### 5. Organizasyon

- **Folder yapısı:** Workflow'ları kategorilere ayırın
- **İsimlendirme:** Anlaşılır workflow isimleri
- **Notlar:** Karmaşık workflow'lara açıklama ekleyin

### 6. Versiyon Kontrol

```bash
# Workflow'ları JSON olarak dışa aktarın
# Git ile takip edin
# Geri yükleme yapın
```

---

## Kaynaklar

### Resmi Dokümantasyon
- **n8n Docs:** https://docs.n8n.io
- **Expressions Reference:** https://docs.n8n.io/code/expressions/
- **Node Library:** https://docs.n8n.io/integrations/builtin/

### Topluluk
- **Forum:** https://community.n8n.io
- **Reddit:** https://reddit.com/r/n8n
- **Discord:** n8n Discord Server
- **GitHub:** https://github.com/n8n-io/n8n

### Video Eğitimler
- n8n YouTube Channel
- "n8n Tutorial for Beginners" serileri
- "AI Automations with n8n" örnekleri

### Örnek Workflow'lar
- n8n Templates: https://n8n.io/workflows
- Community Templates
- Kullanıcı paylaşımları

---

## Ek Terimler Sözlüğü

| Terim | Türkçe | Açıklama |
|-------|--------|----------|
| Workflow | İş Akışı | Otomasyon sürecinin tamamı |
| Node | Düğüm | Tek bir işlem adımı |
| Trigger | Tetikleyici | Workflow'u başlatan olay |
| Execution | Çalıştırma | Workflow'un bir kez çalışması |
| Credential | Kimlik Bilgisi | API anahtarı, şifre vb. |
| Expression | İfade | Veriye erişim formülü |
| Item | Öğe | Veri birimi (JSON nesnesi) |
| Binary | İkili | Dosya verisi (resim, PDF vb.) |
| Sticky Node | Yapışkan Node | Çalıştıktan sonra tekrar çalışmayan |
| Connection | Bağlantı | Node'lar arası veri akışı |
| Polling | Sorgulama | Düzenli kontrol |
| Webhook | Web Kancası | HTTP callback |

---

**Not:** Bu rehber sürekli güncellenmektedir. Yeni node'lar ve özellikler eklendikçe güncellemeler yapılacaktır.

---

*© 2025 - ÜRTM Takip Projesi - n8n Otomasyon Rehberi*
