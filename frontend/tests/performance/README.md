# Performance Testing Guide

## Fatura & İrsaliye Eşleştirme Sistemi

### Performance Testing Tools

#### 1. Artillery (API Load Testing)
```bash
npm install -g artillery
artillery run tests/performance/fatura-api-load.yml
```

#### 2. k6 (Alternative Load Testing)
```bash
npm install -g k6
k6 run tests/performance/fatura-load-test.js
```

#### 3. Lighthouse (Frontend Performance)
```bash
npm install -g lighthouse
lighthouse http://localhost:5173/faturalar --output=reports/lighthouse-faturalar.html
```

### Test Scenarios

#### API Load Tests
**fatura-api-load.yml**:
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Fatura Listesi"
    flow:
      - get:
          url: "/api/faturalar"
          qs:
            page: 1
            limit: 20

  - name: "Fatura Detay"
    flow:
      - get:
          url: "/api/faturalar/{{$randomNumber(1, 100)}}"

  - name: "Eşleştirme Önerileri"
    flow:
      - get:
          url: "/api/eslestirme/{{$randomNumber(1, 50)}}/oneriler"
```

### Performance Benchmarks

#### Response Time Targets
- **Fatura List**: < 200ms (p95)
- **Fatura Detay**: < 100ms (p95)
- **Eşleştirme Önerileri**: < 500ms (p95, 100 kalem)
- **Batch Eşleşme**: < 1saniye (100 kalem)

#### Throughput Targets
- **Concurrent Users**: 50 users
- **Requests/Second**: 100 req/s
- **Error Rate**: < 0.1%

### Database Performance

#### SQL Query Performance
```sql
-- Enable query logging
PRAGMA compile_options;

-- Check query plan
EXPLAIN QUERY PLAN
SELECT * FROM FaturaKalemleri
WHERE eslesme_durumu = 0
LIMIT 100;
```

#### Index Verification
```sql
-- Check indexes on FaturaKalem
PRAGMA index_list('FaturaKalemleri');

-- Analyze table statistics
ANALYZE;
```

### Frontend Performance

#### Bundle Size Targets
- **Initial Bundle**: < 500KB (gzipped)
- **Total JS**: < 2MB (gzipped)
- **Lighthouse Score**: > 90

#### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Monitoring Commands

```bash
# Memory usage during load test
artillery run tests/performance/load.yml --output reports/

# CPU profiling
node --prof backend/src/index.js &

# Check PostgreSQL (if using instead of SQLite)
psql -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Performance Test Execution

```bash
# Full performance test suite
npm run test:performance

# Individual tests
npm run test:performance:api
npm run test:performance:frontend
npm run test:performance:database
```
