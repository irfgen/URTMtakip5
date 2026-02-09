# Implementation Workflow: Günlük Vardiya Raporu - Pie Chart Görselleştirmesi

## 📊 Overview

**Goal**: Günlük Tezgah Çalışma Raporu'nda her iş emrinin çalışma süresini Pie Chart ile görselleştir

**Approach**: Seçenek 3 - Pie Chart + İş Emri Kartları + Vardiya Özeti

## 🎯 User Requirements

1. **Her iş emri birer kart olarak görüntülensin**
2. **Tezgahın vardiyadaki toplam çalışma ve duruş süreleri görüntülensin**
3. **Pie Chart ile iş emri bazlı süre dağılımı gösterilsin**

## 📐 Architecture Design

### Backend Changes

```
vardiyaSuresiService.js
├── calculateCalismaSuresi() → Mevcut (toplam çalışma süresi)
└── calculateIsEmriCalismaSuresi() → YENİ (iş emri bazlı süre)
    ├── Output: {
    │   total: 180,        // Toplam çalışma süresi (dakika)
    │   working: 120,      // Gerçek çalışma süresi
    │   idle: 60,          // Duruş süresi
    │   is_emirleri: [
    │     { is_emri_no: "IE-001", sure: 80, oran: %44 },
    │     { is_emri_no: "IE-003", sure: 40, oran: %22 }
    │   ]
    │ }
```

### Frontend Components

```
VardiyaBolmesi.jsx (Yeni Yapı)
├── VardiyaOzetBilgisi (YENİ)
│   ├── Toplam Çalışma Süresi
│   ├── Toplam Duruş Süresi
│   └── Verimlilik Oranı
├── PieChartContainer (YENİ)
│   └── Chart.js Pie Chart
└── IsEmriKartiListesi
    └── IsEmriRaporKarti (Mevcut)
```

## 🔄 Implementation Steps

### Phase 1: Backend - İş Emri Bazlı Süre Hesaplama

**File**: `backend/src/services/vardiyaSuresiService.js`

```javascript
/**
 * YENİ METHOD: İş emri bazlı çalışma süresi hesapla
 *
 * @param {number} tezgah_id - Tezgah ID
 * @param {string} tarih - Tarih (YYYY-MM-DD)
 * @param {object} vardiya - Vardiya bilgisi
 * @returns {Promise<object>} İş emri bazlı süre dağılımı
 */
async calculateIsEmriCalismaSuresi(tezgah_id, tarih, vardiya) {
  // 1. TezgahDurumLog'ları getir (is_emri_id ile)
  // 2. Her is_emri_id için çalışma süresini hesapla
  // 3. Toplam çalışma ve duruş sürelerini hesapla
  // 4. Yüzde oranlarını hesapla
  // 5. Return structured data
}
```

**Algorithm**:
```
1. logs = TezgahDurumLog.findAll({
     where: { tezgah_id, tarih, vardiya_araligi },
     order: ['createdAt ASC']
   })

2. isEmriSuresiMap = new Map()

3. For each log pair (working → stopped):
     - sure = stopped_at - working_at (dakika)
     - isEmriSuresiMap[log.is_emri_id] += sure

4. Calculate totals:
     - total_working = sum(isEmriSuresiMap.values())
     - total_idle = (vardiya_bitis - vardiya_baslangic) - total_working

5. Calculate percentages:
     - For each is_emri: oran = (sure / total_working) * 100

6. Return structured object
```

### Phase 2: Backend - API Endpoint Update

**File**: `backend/src/controllers/gunlukVardiyaController.js`

```javascript
// MEVCUT CODE:
tezgahData.gunduz_vardiya = {
  vardiya_id: gunduzVardiya.id,
  vardiya_adi: gunduzVardiya.vardiya_adi,
  baslangic_saati: gunduzVardiya.baslangic_saati,
  bitis_saati: gunduzVardiya.bitis_saati,
  calisma_suresi_dakika: calismaSuresi,
  calisma_suresi_formatli: vardiyaSuresiService.formatCalismaSuresi(calismaSuresi),
  is_emirleri: isEmirleriWithTamamlanan
};

// YENİ CODE:
const isEmriSuresi = await vardiyaSuresiService.calculateIsEmriCalismaSuresi(
  tezgah.tezgah_id,
  tarih,
  gunduzVardiya
);

tezgahData.gunduz_vardiya = {
  vardiya_id: gunduzVardiya.id,
  vardiya_adi: gunduzVardiya.vardiya_adi,
  baslangic_saati: gunduzVardiya.baslangic_saati,
  bitis_saati: gunduzVardiya.bitis_saati,
  // YENİ ALANLAR:
  toplam_calisma: isEmriSuresi.working,      // Gerçek çalışma süresi
  toplam_durus: isEmriSuresi.idle,            // Duruş süresi
  verimlilik_orani: isEmriSuresi.verim,      // Verimlilik %
  is_emri_calismalar: isEmriSuresi.is_emirleri,  // İş emri bazlı süreler
  // MEVCUT:
  is_emirleri: isEmirleriWithTamamlanan        // İş emri detayları
};
```

### Phase 3: Frontend - Pie Chart Component

**File**: `frontend/src/components/Raporlar/VardiyaPieChart.jsx` (YENİ)

```javascript
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Box, Typography, useTheme } from '@mui/material';

const VardiyaPieChart = ({ isEmriCalismalar, toplamCalisma }) => {
  const theme = useTheme();

  // Chart.js data preparation
  const labels = isEmriCalismalar.map(ie => ie.is_emri_no);
  const data = isEmriCalismalar.map(ie => ie.sure_dakika);
  const colors = isEmriCalismalar.map((_, i) =>
    theme.palette.chartColors[i % theme.palette.chartColors.length]
  );

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderWidth: 2,
      borderColor: theme.palette.background.paper
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          generateLabels: (chart) => {
            const data = chart.data;
            return data.labels.map((label, i) => ({
              text: `${label}: ${data.datasets[0].data[i]} dk (${data.datasets[0].data[i] / toplamCalisma * 100 | 0}%)`,
              fillStyle: data.datasets[0].backgroundColor[i]
            }));
          }
        };
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = ((value / toplamCalisma) * 100).toFixed(1);
            return `${label}: ${value} dk (%${percentage})`;
          }
        }
      }
    }
  };

  return (
    <Box sx={{ position: 'relative', height: '250px', width: '100%' }}>
      <Pie data={chartData} options={chartOptions} />
    </Box>
  );
};

export default VardiyaPieChart;
```

### Phase 4: Frontend - Vardiya Özeti Component

**File**: `frontend/src/components/Raporlar/VardiyaOzeti.jsx` (YENİ)

```javascript
import React from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Pause as PauseIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const VardiyaOzeti = ({ toplamCalisma, toplamDurus, verimlilikOrani }) => {
  const theme = useTheme();

  const formatSure = (dakika) => {
    const saat = Math.floor(dakika / 60);
    const dk = dakika % 60;
    return saat > 0 ? `${saat}s ${dk}dk` : `${dk}dk`;
  };

  const items = [
    {
      label: 'Toplam Çalışma',
      value: formatSure(toplamCalisma),
      icon: <AccessTimeIcon />,
      color: theme.palette.success.main,
      bgColor: theme.palette.success.light
    },
    {
      label: 'Toplam Duruş',
      value: formatSure(toplamDurus),
      icon: <PauseIcon />,
      color: theme.palette.warning.main,
      bgColor: theme.palette.warning.light
    },
    {
      label: 'Verimlilik',
      value: `%${verimlilikOrani}`,
      icon: <TrendingUpIcon />,
      color: theme.palette.info.main,
      bgColor: theme.palette.info.light
    }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {items.map((item, index) => (
        <Grid item xs={12} sm={4} key={index}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: item.bgColor,
              borderLeft: `4px solid ${item.color}`
            }}
          >
            <Box sx={{ color: item.color }}>
              {item.icon}
            </Box>
            <Box flex={1}>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h6" color="text.primary">
                {item.value}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default VardiyaOzeti;
```

### Phase 5: Frontend - VardiyaBolmesi Component Update

**File**: `frontend/src/components/Raporlar/VardiyaBolmesi.jsx`

```javascript
import VardiyaOzeti from './VardiyaOzeti';
import VardiyaPieChart from './VardiyaPieChart';

const VardiyaBolmesi = ({ vardiya, calismaSuresi, isEmirleri, tur = 'gunduz',
                          // YENİ PROPS:
                          isEmriCalismalar, toplamCalisma, toplamDurus, verimlilikOrani }) => {
  // ... existing code ...

  return (
    <Paper sx={{ height: '100%', p: 2, backgroundColor: config.bgColor, borderRadius: 2 }}>
      {/* Vardiya Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        {/* ... existing code ... */}
      </Box>

      {/* YENİ: Vardiya Özet Bilgileri */}
      {isEmriCalismalar && isEmriCalismalar.length > 0 && (
        <VardiyaOzeti
          toplamCalisma={toplamCalisma}
          toplamDurus={toplamDurus}
          verimlilikOrani={verimlilikOrani}
        />
      )}

      <Divider sx={{ my: 2 }} />

      {/* YENİ: Pie Chart */}
      {isEmriCalismalar && isEmriCalismalar.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            İş Emri Çalışma Dağılımı
          </Typography>
          <VardiyaPieChart
            isEmriCalismalar={isEmriCalismalar}
            toplamCalisma={toplamCalisma}
          />
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* İş Emri Kartları */}
      {!isEmirleri || isEmirleri.length === 0 ? (
        // ... existing empty state ...
      ) : (
        <Grid container spacing={2}>
          {isEmirleri.map((isEmri) => (
            <Grid item xs={12} sm={6} md={4} key={isEmri.is_emri_id}>
              <IsEmriRaporKarti isEmri={isEmri} />
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};
```

### Phase 6: Frontend - Theme Update

**File**: `frontend/src/theme.js`

```javascript
// Chart.js için renk paleti ekle
chartColors: [
  '#3f51b5', // primary
  '#f44336', // error
  '#4caf50', // success
  '#ff9800', // warning
  '#9c27b0', // purple
  '#00bcd4', // cyan
  '#ffeb3b', // yellow
  '#795548', // brown
  '#607d8b', // blue grey
  '#e91e63'  // pink
]
```

## 📋 Implementation Checklist

### Backend
- [ ] `vardiyaSuresiService.js` - `calculateIsEmriCalismaSuresi()` method
- [ ] `gunlukVardiyaController.js` - API response update
- [ ] Test: API response structure validation

### Frontend
- [ ] `VardiyaOzeti.jsx` - New component
- [ ] `VardiyaPieChart.jsx` - New component
- [ ] `VardiyaBolmesi.jsx` - Component update
- [ ] `theme.js` - Chart colors palette
- [ ] `package.json` - Verify chart.js dependency

### Testing
- [ ] Backend API test with real data
- [ ] Frontend rendering test
- [ ] Pie chart accuracy validation
- [ ] Responsive design test (mobile/desktop)
- [ ] Edge cases: No work orders, single work order, etc.

## 🎨 UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Vardiya Header: Gündüz Vardiyası (06:00 - 18:00)          │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┬───────────────┬───────────────┐        │
│  │ Toplam Çalışma│ Toplam Duruş │ Verimlilik   │        │
│  │ 4s 20dk      │ 1s 15dk      │ %78          │        │
│  └───────────────┴───────────────┴───────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  İş Emri Çalışma Dağılımı                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │  🥧 PIE CHART                                  │       │
│  │  IE-001: 180 dk (%58)                         │       │
│  │  IE-003: 80 dk (%26)                          │       │
│  │  IE-005: 50 dk (%16)                          │       │
│  └─────────────────────────────────────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  İş Emri Kartları                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │ IE-001      │ │ IE-003      │ │ IE-005      │         │
│  │ [Resim]     │ │ [Resim]     │ │ [Resim]     │         │
│  │ 120/200 adet│ │ 45/100 adet │ │ 30/50 adet  │         │
│  │ ████████░░  │ │ █████░░░░░  │ │ ████████░░  │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Color Strategy
- **Toplam Çalışma**: Green (success)
- **Toplam Duruş**: Orange (warning)
- **Verimlilik**: Blue (info)
- **Pie Chart Slices**: 10 distinct colors from palette

## ⚡ Performance Considerations

1. **Backend**: Single query for all time calculations (no N+1 problem)
2. **Frontend**: Chart.js lazy loading
3. **Data Caching**: Vardiya süreleri cachelenebilir
4. **Responsive**: Mobile-first approach

## 🧪 Testing Strategy

### Unit Tests
```javascript
// Backend test
test('calculateIsEmriCalismaSuresi returns correct distribution', async () => {
  const result = await vardiyaSuresiService.calculateIsEmriCalismaSuresi(
    1, '2026-01-08', { baslangic_saati: '06:00', bitis_saati: '18:00' }
  );

  expect(result.toplam).toBeDefined();
  expect(result.is_emirleri).toBeInstanceOf(Array);
  expect(result.verim).toBeGreaterThanOrEqual(0);
  expect(result.verim).toBeLessThanOrEqual(100);
});
```

### Integration Tests
```javascript
// Frontend test
test('VardiyaBolmesi renders pie chart with correct data', () => {
  render(
    <VardiyaBolmesi
      vardiya={mockVardiya}
      isEmriCalismalar={mockIsEmriCalismalar}
      toplamCalisma={310}
      toplamDurus={75}
      verimlilikOrani={78.5}
    />
  );

  expect(screen.getByText('İş Emri Çalışma Dağılımı')).toBeInTheDocument();
  expect(screen.getByText('4s 20dk')).toBeInTheDocument();
});
```

## 📝 API Response Structure

```json
{
  "success": true,
  "data": {
    "tarih": "2026-01-08",
    "tezgahlar": [
      {
        "tezgah_id": 1,
        "tezgah_adi": "CNC-01",
        "gunduz_vardiya": {
          "vardiya_id": 1,
          "vardiya_adi": "Gündüz Vardiyası",
          "baslangic_saati": "06:00",
          "bitis_saati": "18:00",
          "toplam_calisma": 310,
          "toplam_durus": 75,
          "verimlilik_orani": 78.5,
          "is_emri_calismalar": [
            {
              "is_emri_no": "IE-2024-001",
              "is_emri_id": 123,
              "sure_dakika": 180,
              "oran": 58.1
            },
            {
              "is_emri_no": "IE-2024-003",
              "is_emri_id": 125,
              "sure_dakika": 80,
              "oran": 25.8
            },
            {
              "is_emri_no": "IE-2024-005",
              "is_emri_id": 128,
              "sure_dakika": 50,
              "oran": 16.1
            }
          ],
          "is_emirleri": [
            // Existing work order details with tamamlanan_adet
          ]
        }
      }
    ]
  }
}
```

## ✅ Acceptance Criteria

1. ✅ Her vardiya için toplam çalışma süresi gösterilir
2. ✅ Her vardiya için toplam duruş süresi gösterilir
3. ✅ Verimlilik oranı hesaplanır ve gösterilir
4. ✅ Pie chart ile iş emri bazlı süre dağılımı görselleştirilir
5. ✅ Her iş emri kart olarak gösterilir
6. ✅ Mobil ve masaüstü responsive çalışır
7. ✅ Veriler doğru hesaplanır (test ile doğrulanır)

## 🚀 Deployment Steps

1. Backend changes deploy
2. Database migration (if needed)
3. Frontend build and deploy
4. Smoke testing on staging
5. Production deployment
6. Monitoring and validation

---

**Created**: 2026-01-08
**Author**: PM Agent
**Status**: Ready for Implementation
