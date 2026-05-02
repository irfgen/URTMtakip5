# 40. CONTENG (Container Engineering) Modülü

## Genel Bakış

ContEng modülü, container tabanlı deployment ve geliştirme ortamı konfigürasyonlarını içerir.

**Konum:** `ContEng/`

---

## Modül Amacı

- Docker container yapılandırması
- Geliştirme ortamı kurulumu
- Production deployment
- Çoklu ortam desteği

---

## Container Mimarisi

```
┌─────────────────────────────────────────┐
│            Docker Network               │
├─────────────┬─────────────┬─────────────┤
│   Backend   │   Frontend  │    n8n     │
│   (Node.js) │   (React)   │  (Workflow)│
├─────────────┼─────────────┼─────────────┤
│    SQLite   │   Redis     │   ...      │
│  (Volume)   │  (Volume)   │            │
└─────────────┴─────────────┴─────────────┘
```

---

## Docker Yapılandırması

### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

---

## Ortamlar

| Ortam | Açıklama |
|-------|----------|
| development | Yerel geliştirme |
| staging | Test ortamı |
| production | Canlı sistem |

---

## Özellikler

- **Hot Reload:** Geliştirme ortamında anlık yeniden yükleme
- **Volume Mounting:** Dosya değişikliklerini anında yansıtma
- **Port Mapping:** Çakışmayı önlemek için port yönlendirme
- **Health Checks:** Container sağlık kontrolü

---

## Komutlar

```bash
# Geliştirme ortamı başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Tüm container'ları durdur
docker-compose down

# Container rebuild
docker-compose up --build
```

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-03 | İlk versiyon |
| 1.1 | 2024-07 | docker-compose eklendi |
| 1.2 | 2024-11 | Health checks eklendi |