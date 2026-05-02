# URTMtakip5 Master Agent - İletişim Kılavuzu

## 🏗️ Sistem Mimarisi

```
┌──────────────────────────────────────────────────────────┐
│                    MASTER AGENT                           │
│                  (Port 3001)                              │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  REST API   │  │  WebSocket │  │    CLI      │       │
│  │  (HTTP)     │  │  (WS)      │  │  (Terminal) │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└──────────────────────────┬───────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐
    │ Client  │       │ Browser │       │ OpenClaw│
    │  (JS)   │       │ (HTML)  │       │  Agent  │
    └─────────┘       └─────────┘       └─────────┘
```

---

## 📡 1. REST API (HTTP)

### Sunucu Başlatma
```bash
cd /home/irfan/Belgeler/URTMtakip5/backend/multi-agent
node api-server.js
```

### Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/health` | Sağlık kontrolü |
| GET | `/api/master/status` | Sistem durumu |
| GET | `/api/master/modules` | Tüm modüller |
| GET | `/api/master/modules/:id` | Belirli modül |
| POST | `/api/master/task` | Master ajana görev ver |
| POST | `/api/master/delegate` | Tüm modüllere dağıt |
| GET | `/api/master/find?q=query` | Modül ara |

### Örnek İstekler

```bash
# Durum kontrolü
curl http://localhost:3001/api/master/status

# Modül listesi
curl http://localhost:3001/api/master/modules

# Görev gönder
curl -X POST http://localhost:3001/api/master/task \
  -H "Content-Type: application/json" \
  -d '{"task":"Is Emirleri modulu ne is yapiyor?"}'

# Modül ara
curl "http://localhost:3001/api/master/find?q=stok"
```

---

## 🔌 2. WebSocket (Gerçek Zamanlı)

### Tarayıcıda Kullanım
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => console.log('Bağlandı!');
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('Mesaj:', msg);
};

// Görev gönder
ws.send(JSON.stringify({
  type: 'task',
  task: 'Sistem durumunu açıkla'
}));
```

### Mesaj Tipleri

| Tip | Yön | Açıklama |
|-----|-----|----------|
| `ping` | → | Bağlantı test |
| `pong` | ← | Ping yanıtı |
| `status` | → | Durum sorgula |
| `task` | → | Görev gönder |
| `result` | ← | Görev sonucu |
| `delegate` | → | Dağıtım yap |
| `find` | → | Modül ara |

### Node.js Client
```bash
node websocket-client.js
```

---

## ⌨️ 3. CLI (Komut Satırı)

```bash
cd /home/irfan/Belgeler/URTMtakip5/backend/multi-agent

# Durum
node cli.js --status

# Modül listesi
node cli.js --list

# Master görev
node cli.js --master "sistem analizi yap"

# Modül ara
node cli.js --find "stok"

# İnteraktif mod
node cli.js -x
```

---

## 🌐 4. OpenClaw Agent (Gelişmiş)

OpenClaw coding-agent skill ile entegrasyon:

```bash
# Direct Claude Code kullanımı
cd /home/irfan/Belgeler/URTMtakip5/backend
claude --print --permission-mode bypassPermissions "Multi-agent sistemini başlat ve durumu sor"
```

---

## 📝 5. JavaScript Client

```javascript
const client = require('./client');

async function main() {
  // Durum kontrolü
  const status = await client.getStatus();
  console.log(status);
  
  // Görev gönder
  const result = await client.sendTask('Is Emirleri analiz et');
  console.log(result);
  
  // Modül ara
  const found = await client.findModules('stok');
  console.log(found);
}

main();
```

---

## 🚀 Hızlı Başlangıç

```bash
# 1. Sunucu başlat
cd /home/irfan/Belgeler/URTMtakip5/backend/multi-agent
node api-server.js

# 2. Başka terminalde test et
curl http://localhost:3001/api/master/status

# 3. Görev gönder
curl -X POST http://localhost:3001/api/master/task \
  -H "Content-Type: application/json" \
  -d '{"task":"Sistemi 5 cumle ile ozetle"}'
```

---

## 📋 API Yanıt Formatı

```json
// Başarılı yanıt
{
  "success": true,
  "result": "..."
}

// Hata yanıtı
{
  "success": false,
  "error": "Hata mesajı"
}
```

---

## 🔐 Güvenlik Notları

- API şu an korumasız (production'da auth eklenmeli)
- CORS: Tüm originlere açık
- Rate limiting: Yok (eklenmeli)

---

## 📞 Destek

Sorun yaşarsanız loglar:
```bash
tail -f /tmp/api-server.log
```