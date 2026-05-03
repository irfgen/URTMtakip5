---
name: 05-PLAN.md
description: PostgreSQL kurulumu ve bağlantı altyapısı
type: plan
phase: 5
wave: 1
depends_on: []
autonomous: false
requirements_addressed:
  - DB-01
  - DB-02
  - DB-03
  - DB-04
files_modified:
  - backend/src/config/database.js
  - .env.example
  - docker-compose.yml
---

# Plan: PostgreSQL Kurulumu

## Objective

PostgreSQL kurulumu ve Sequelize bağlantısı yapılandırılacak. Docker Compose ile PostgreSQL container kurulacak, Sequelize postgresql dialect'e geçirilecek, connection pool ayarlanacak.

## Truths

- PostgreSQL 16 Alpine image kullanılacak
- Sequelize dialect: 'postgres' (not 'postgresql')
- Connection pool: `{ max: 20, min: 5, acquire: 30000, idle: 10000 }`
- DATABASE_URL format: `postgresql://user:pass@host:5432/dbname`
- SQLite aynı anda fallback olarak kalacak (geçiş süreci için)

## Tasks

### Task 1: Docker Compose PostgreSQL Kurulumu

**Objective:** Docker Compose ile PostgreSQL container oluştur

<read_first>
- docker-compose.yml (mevcut dosya kontrolü)
</read_first>

<action>
1. Eğer docker-compose.yml yoksa backend/ dizininde oluştur:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: urtmtakip_postgres
    environment:
      POSTGRES_DB: urtmtakip
      POSTGRES_USER: urfuser
      POSTGRES_PASSWORD: urfpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U urfuser -d urtmtakip"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

2. `docker-compose up -d` ile başlat
3. `docker-compose ps` ile container durumunu kontrol et
4. `docker logs urtmtakip_postgres 2>&1 | tail -20` ile startup loglarını kontrol et
</action>

<acceptance_criteria>
- [ ] docker-compose.yml dosyası mevcut veya oluşturulmuş
- [ ] `docker-compose up -d` başarılı
- [ ] `docker-compose ps` → postgres → running
- [ ] Container logs -> database system is ready to accept connections
</acceptance_criteria>

---

### Task 2: .env Yapılandırması

**Objective:** DATABASE_URL ve PostgreSQL bağlantı parametreleri .env.example'a ekle

<read_first>
- .env.example (mevcut dosya kontrolü)
</read_first>

<action>
1. .env.example dosyasını kontrol et
2. Aşağıdaki satırları ekle (veya mevcut DATABASE_URL varsa güncelle):
```env
# PostgreSQL Database (v2.0 migration)
DATABASE_URL=postgresql://urfuser:urfpass@localhost:5432/urtmtakip
DB_DIALECT=postgresql

# PostgreSQL connection settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=urtmtakip
DB_USER=urfuser
DB_PASS=urfpass
```

3. .env dosyasına aynı değerleri ekle (veya güncelle)
4. NOT: .env dosyası git commit edilmemeli (.gitignore'da olmalı)
</action>

<acceptance_criteria>
- [ ] .env.example → DB_DIALECT, DATABASE_URL, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS satırları mevcut
- [ ] .env → DATABASE_URL mevcut ve doğru formatta
- [ ] .gitignore → .env satırı mevcut
</acceptance_criteria>

---

### Task 3: Sequelize PostgreSQL Yapılandırması

**Objective:** database.js'i SQLite'den PostgreSQL'e geçir

<read_first>
- backend/src/config/database.js
</read_first>

<action>
1. database.js dosyasını oku ve aşağıdaki değişiklikleri yap:

**Değişiklik 1: require + imports**
```javascript
// Mevcut (SQLite):
const { Sequelize, Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Yeni (PostgreSQL):
const { Sequelize, Op } = require('sequelize');
require('dotenv').config();
```

**Değişiklik 2: Connection config — mevcut SQLite yapısını:**
```javascript
// Mevcut:
const dbPath = isTest
  ? ':memory:'
  : path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: isTest ? false : false,
  timezone: '+00:00',
  define: {
    timestamps: true,
    underscored: true
  },
  dialectOptions: {
    foreignKeys: true
  },
  pool: { max: 5, min: 0, acquire: 60000, idle: 10000, evict: 1000 },
  retry: { max: 5 },
  hooks: {
    afterConnect: async (connection, config) => {
      await connection.query('PRAGMA busy_timeout = 30000;');
      await connection.query('PRAGMA foreign_keys = OFF;');
      await connection.query('PRAGMA journal_mode = WAL;');
      // ... daha fazla PRAGMA
    }
  }
});
```

**Yeni PostgreSQL yapısı:**
```javascript
// PostgreSQL connection - destek both dialects
const DB_DIALECT = process.env.DB_DIALECT || 'sqlite';

const getSequelizeConfig = () => {
  if (DB_DIALECT === 'postgresql') {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      // URL format: postgresql://user:pass@host:port/dbname
      return {
        dialect: 'postgres',
        dialectOptions: {
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        },
        pool: {
          max: 20,
          min: 5,
          acquire: 30000,
          idle: 10000
        }
      };
    }
    // Individual params
    return {
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'urtmtakip',
      username: process.env.DB_USER || 'urfuser',
      password: process.env.DB_PASS || 'urfpass',
      logging: false,
      timezone: '+00:00',
      define: {
        timestamps: true,
        underscored: true
      },
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000
      }
    };
  }
  // SQLite fallback
  const dbPath = isTest ? ':memory:' : path.join(__dirname, '../../database.sqlite');
  return {
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    timezone: '+00:00',
    define: {
      timestamps: true,
      underscored: true
    },
    dialectOptions: { foreignKeys: true },
    pool: { max: 5, min: 0, acquire: 60000, idle: 10000, evict: 1000 },
    retry: { max: 5 },
    hooks: {
      afterConnect: async (connection, config) => {
        await connection.query('PRAGMA busy_timeout = 30000;');
        await connection.query('PRAGMA foreign_keys = OFF;');
        await connection.query('PRAGMA journal_mode = WAL;');
        await connection.query('PRAGMA synchronous = NORMAL;');
        await connection.query('PRAGMA cache_size = 10000;');
        await connection.query('PRAGMA temp_store = MEMORY;');
      }
    }
  };
};

const sequelize = new Sequelize(getSequelizeConfig());
```

**Değişiklik 3: initializeDatabase — PRAGMA'ları PostgreSQL'e uyarla:**
```javascript
// Mevcut (SQLite-specific):
// PRAGMA busy_timeout = 30000;
// PRAGMA foreign_keys = OFF;
// PRAGMA journal_mode = WAL;
// vs.

const initializeDatabase = async () => {
  if (process.env.NODE_ENV === 'test') {
    console.log('Test modu - veritabanı başlatma atlandı');
    return;
  }

  try {
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.', DB_DIALECT === 'postgresql' ? '(PostgreSQL)' : '(SQLite)');

    if (DB_DIALECT === 'postgresql') {
      // PostgreSQL: synchronize models without raw PRAGMA
      const models = sequelize.models;
      for (const modelName in models) {
        try {
          await models[modelName].sync();
          console.log(`${modelName} tablosu senkronize edildi`);
        } catch (err) {
          console.error(`${modelName} senkronizasyon hatası:`, err.message);
        }
      }
    } else {
      // SQLite: existing PRAGMA setup
      await sequelize.query('PRAGMA foreign_keys = OFF;');
      // ... existing SQLite setup
    }
  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error);
    throw error;
  }
};
```

**Değişiklik 4: Module exports — DB_DIALECT export et:**
```javascript
module.exports = {
  sequelize,
  Op,
  Transaction: Sequelize.Transaction,
  QueryTypes: Sequelize.QueryTypes,
  initializeDatabase,
  DB_DIALECT // PostgreSQL veya SQLite
};
```
</action>

<acceptance_criteria>
- [ ] database.js → `dialect: 'postgres'` kullanılıyor (DATABASE_URL varsa)
- [ ] database.js → `dialect: 'sqlite'` fallback olarak mevcut
- [ ] database.js → Connection pool `{ max: 20, min: 5, acquire: 30000, idle: 10000 }`
- [ ] database.js → `DB_DIALECT` env variable destekleniyor
- [ ] database.js → `initializeDatabase` PostgreSQL modunu destekliyor
- [ ] database.js → Module export olarak `DB_DIALECT` mevcut
</acceptance_criteria>

---

### Task 4: Bağlantı Doğrulama

**Objective:** PostgreSQL bağlantısını test et

<read_first>
- backend/src/config/database.js (güncellenmiş hali)
</read_first>

<action>
1. PostgreSQL container'ın çalıştığını doğrula:
```bash
docker-compose ps
```

2. Node.js ile bağlantı test et:
```bash
cd /home/irfan/Belgeler/URTMtakip5/backend
DB_DIALECT=postgresql node -e "
const { sequelize, DB_DIALECT } = require('./src/config/database');
console.log('Dialect:', DB_DIALECT);
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connection: OK'))
  .catch(e => console.error('PostgreSQL connection FAIL:', e.message));
"
```

3. Başarısız olursa logları kontrol et:
```bash
docker logs urtmtakip_postgres 2>&1 | tail -30
```
</action>

<acceptance_criteria>
- [ ] `docker-compose ps` → postgres → running
- [ ] `DB_DIALECT=postgresql node -e "..."` → "PostgreSQL connection: OK"
- [ ] Connection başarısız olursa hata mesajı açık ve actionable olmalı
</acceptance_criteria>

## Verification

1. `docker-compose up -d` → container running
2. `DB_DIALECT=postgresql node backend/src/index.js` → database initializes without error
3. `docker-compose down` → container stops cleanly

## Notes

- SQLite mevcut veritabanı dosyası (328MB) olduğıunda migration Phase 7'de yapılacak
- Bu phase sadece PostgreSQL bağlantısını kuruyor, veri taşımıyor
- docker-compose.yml .gitignore'a eklenmeli (credentials)
