# Fatura Eşleştirme - Detaylı UI Implementation Workflow

## Amaç
Fatura eşleştirme sayfasında mevcut tablo görünümü yerine, her fatura kaleminin altına eşleşen/önerilen irsaliye kaleminin tüm detaylarının göründüğü görsel bir card-based tasarım implement etmek.

## Mevcut Durum

### Backend API Endpoints
| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/eslestirme/oneler/:fatura_id` | GET | Eşleşme önerilerini getirir |
| `/api/eslestirme/onayla` | POST | Toplu eşleşme onayı |
| `/api/eslestirme/eslestirme-kaldir/:fatura_kalem_id` | POST | Eşleşmeyi kaldırır |
| `/api/faturalar/:id` | GET | Fatura detayını getirir |

### Mevcut Frontend Sayfaları
| Sayfa | Konum | İşlev |
|-------|--------|-------|
| `FaturaDetay.jsx` | `/faturalar/:id` | Fatura bilgileri ve kalemler tablosu |
| `EslestirmeDesktop.jsx` | `/faturalar/:id/eslestirme` | Eşleşme önerileri tablosu |

---

## Implementation Workflow

### Phase 1: Backend API İyileştirmeleri
**Dosyalar**: `backend/src/controllers/eslestirmeController.js`, `backend/src/routes/eslestirme.js`

#### 1.1 Yeni Endpoint: Gruplandırılmış Öneriler
```javascript
// GET /api/eslestirme/gruplu-oneler/:fatura_id
// Her fatura kalemi için önerileri gruplandırılmış getirir
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "fatura": {
      "id": 1,
      "fatura_no": "FAT-2024-001",
      "tedarikci": { "id": 10, "firma_adi": "ABC Ltd" },
      "durum": "bekliyor"
    },
    "kalemler": [
      {
        "fatura_kalem": {
          "id": 100,
          "stok_kodu": "AK-001",
          "mal_hizmet_adi": "ANAHTAR PARÇA",
          "miktar": 100.0,
          "birim": "Adet",
          "birim_fiyat": 50.00,
          "toplam_tutar": 5000.00,
          "eslesme_durumu": 0
        },
        "eslesen_irsaliye_kalem": null,
        "oneriler": [
          {
            "irsaliye_kalem": {
              "id": 500,
              "stok_kodu": "AK-001",
              "mal_hizmet_adi": "ANAHTAR PARÇA",
              "miktar": 100.0,
              "birim": "Adet"
            },
            "irsaliye": {
              "id": 50,
              "irsaliye_no": "IRS-2024-001",
              "belge_tarih": "2025-01-15",
              "tedarikci_id": 10
            },
            "eslesme_tipi": "tam",
            "miktar_farki": 0.0,
            "skor": 95
          }
        ]
      }
    ]
  }
}
```

#### 1.2 Controller Metodu Ekle
`eslestirmeController.js`:
```javascript
async getGrupluOneriler(faturaId) {
    const fatura = await Fatura.findByPk(faturaId, {
        include: [
            { association: 'tedarikci', attributes: ['id', 'firma_adi'] }
        ]
    });

    if (!fatura) throw new Error('NOT_FOUND');

    // Fatura kalemlerini getir
    const kalemler = await FaturaKalem.findAll({
        where: { fatura_id: faturaId },
        include: [
            { association: 'eslesen_irsaliye_kalem' }
        ],
        order: [['id', 'ASC']]
    });

    // Her kalem için önerileri hesapla
    const result = [];
    for (const kalem of kalemler) {
        const oneriler = await this._getOnerilerForKalem(kalem);

        result.push({
            fatura_kalem: kalem.toJSON(),
            eslesen_irsaliye_kalem: kalem.eslesen_irsaliye_kalem,
            oneriler
        });
    }

    return {
        fatura: fatura.toJSON(),
        kalemler: result
    };
}

async _getOnerilerForKalem(faturaKalem) {
    // Mevcut getOneriler mantığı, tek kalem için
    // ... implementation
}
```

---

### Phase 2: Frontend Component Oluşturma
**Dizin**: `frontend/src/components/eslestirme/`

#### 2.1 FaturaKalemCard Component
**Dosya**: `FaturaKalemCard.jsx`

```jsx
import { Card, CardContent, Box, Typography, Chip, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme, themeMode }) => ({
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const FaturaKalemCard = ({ kalem, eslesenIrsaliye, oneriler, onSelectMatch, onRemoveMatch }) => {
  const getDurumColor = (durum) => {
    return durum === 1 ? 'success' : 'default';
  };

  return (
    <StyledCard>
      <CardContent>
        {/* Fatura Kalem Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {kalem.stok_kodu} - {kalem.mal_hizmet_adi}
          </Typography>
          <Chip label={kalem.eslesme_durumu === 1 ? 'Eşleşti' : 'Bekliyor'} color={getDurumColor(kalem.eslesme_durumu)} />
        </Box>

        {/* Fatura Kalem Detayları */}
        <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Miktar</Typography>
            <Typography variant="body1">{kalem.miktar} {kalem.birim}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Birim Fiyat</Typography>
            <Typography variant="body1">{kalem.birim_fiyat} ₺</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Toplam</Typography>
            <Typography variant="body1">{kalem.toplam_tutar} ₺</Typography>
          </Box>
        </Stack>

        {/* Eşleşen İrsaliye veya Öneriler */}
        {eslesenIrsaliye ? (
          <IrsaliyeKalemMatchCard
            irsaliyeKalem={eslesenIrsaliye}
            eslesmeDurumu="matched"
            onRemove={() => onRemoveMatch(kalem.id)}
          />
        ) : (
          <OneriListesi
            faturaKalemId={kalem.id}
            oneriler={oneriler}
            onSelect={(irsaliyeKalemId) => onSelectMatch(kalem.id, irsaliyeKalemId)}
          />
        )}
      </CardContent>
    </StyledCard>
  );
};

export default FaturaKalemCard;
```

#### 2.2 IrsaliyeKalemMatchCard Component
**Dosya**: `IrsaliyeKalemMatchCard.jsx`

```jsx
import { Card, CardContent, Box, Typography, Button, Stack, Chip, Divider } from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const MatchCard = styled(Card)(({ theme, eslesmeTipi }) => ({
  backgroundColor: eslesmeTipi === 'tam'
    ? theme.palette.success.dark + '10'
    : theme.palette.warning.dark + '10',
  borderLeft: `4px solid ${eslesmeTipi === 'tam' ? theme.palette.success.main : theme.palette.warning.main}`,
  marginTop: theme.spacing(2)
}));

const IrsaliyeKalemMatchCard = ({ irsaliyeKalem, irsaliye, eslesmeTipi, miktarFarki, skor, onRemove }) => {
  return (
    <MatchCard eslesmeTipi={eslesmeTipi}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" color="primary">
            🔗 {irsaliye.irsaliye_no}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={eslesmeTipi === 'tam' ? 'Tam Eşleşme' : 'Kısmi Eşleşme'} color={eslesmeTipi === 'tam' ? 'success' : 'warning'} size="small" />
            {skor && <Chip label={`Skor: ${skor}/100`} size="small" variant="outlined" />}
          </Stack>
        </Box>

        {/* İrsaliye Tarihi */}
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Tarih: {new Date(irsaliye.belge_tarih).toLocaleDateString('tr-TR')}
        </Typography>

        {/* Kalem Detayları */}
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Mal/Hizmet:</Typography>
            <Typography variant="body2" fontWeight="medium">{irsaliyeKalem.mal_hizmet_adi}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Stok Kodu:</Typography>
            <Typography variant="body2">{irsaliyeKalem.stok_kodu || '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Miktar:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {irsaliyeKalem.miktar} {irsaliyeKalem.birim}
            </Typography>
          </Box>
          {miktarFarki !== undefined && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Miktar Farkı:</Typography>
              <Typography variant="body2" color={miktarFarki > 0.01 ? 'warning.main' : 'success.main'}>
                {miktarFarki.toFixed(2)}
              </Typography>
            </Box>
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Close />}
            onClick={onRemove}
            size="small"
          >
            Eşleşmeyi Kaldır
          </Button>
        </Box>
      </CardContent>
    </MatchCard>
  );
};

export default IrsaliyeKalemMatchCard;
```

#### 2.3 OneriListesi Component
**Dosya**: `OneriListesi.jsx`

```jsx
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, RadioGroup, FormControlLabel, Radio, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IrsaliyeKalemMatchCard from './IrsaliyeKalemMatchCard';

const OneriListesi = ({ faturaKalemId, oneriler, onSelect }) => {
  if (!oneriler || oneriler.length === 0) {
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          🔍 Bu kalem için eşleşme önerisi bulunmuyor
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
        🔸 {oneriler.length} Eşleşme Önerisi Bulundu
      </Typography>

      {oneriler.map((oneri, index) => (
        <Accordion key={oneri.irsaliye_kalem.id} defaultExpanded={index === 0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="body2">
                Öneri #{index + 1} - {oneri.irsaliye.irsaliye_no}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Skor: {oneri.skor}/100
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <IrsaliyeKalemMatchCard
              irsaliyeKalem={oneri.irsaliye_kalem}
              irsaliye={oneri.irsaliye}
              eslesmeTipi={oneri.eslesme_tipi}
              miktarFarki={oneri.miktar_farki}
              skor={oneri.skor}
              onSelect={() => onSelect(oneri.irsaliye_kalem.id)}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default OneriListesi;
```

---

### Phase 3: Ana Sayfa İyileştirmesi
**Dosya**: `frontend/src/pages/EslestirmeDesktopGuncel.jsx` (Yeni dosya)

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Stack, Alert, CircularProgress,
  Divider, TextField
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { eslestirmeAPI } from '../services/api';
import FaturaKalemCard from '../components/eslestirme/FaturaKalemCard';

const EslestirmeDesktopGuncel = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [secilenOneriler, setSecilenOneriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nedenInput, setNedenInput] = useState('');

  // Veri yükle
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await eslestirmeAPI.getGrupluOneriler(id);
      setData(response.data.data);
    } catch (error) {
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Öneriyi seç
  const handleSelectOneri = (faturaKalemId, irsaliyeKalemId) => {
    setSecilenOneriler(prev => {
      const filtered = prev.filter(s => s.fatura_kalem_id !== faturaKalemId);
      return [...filtered, { fatura_kalem_id: faturaKalemId, irsaliye_kalem_id: irsaliyeKalemId }];
    });
  };

  // Eşleşmeyi kaldır
  const handleRemoveMatch = async (faturaKalemId) => {
    setSubmitting(true);
    try {
      await eslestirmeAPI.eslestirmeKaldir(faturaKalemId, nedenInput);
      setSuccess('Eşleşme kaldırıldı');
      await loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  // Toplu onay
  const handleBatchOnay = async () => {
    if (secilenOneriler.length === 0) return;

    setSubmitting(true);
    try {
      await eslestirmeAPI.onayla(id, secilenOneriler);
      setSuccess(`${secilenOneriler.length} eşleşme onaylandı`);
      setSecilenOneriler([]);
      await loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button onClick={() => navigate('/faturalar')} startIcon={<ArrowBackIcon />}>
            Geri
          </Button>
          <Box>
            <Typography variant="h4">Fatura Eşleştirme</Typography>
            <Typography variant="body2" color="text.secondary">
              {data?.fatura?.fatura_no} - {data?.fatura?.tedarikci?.firma_adi}
            </Typography>
          </Box>
        </Box>
        <Button onClick={loadData} startIcon={<RefreshIcon />} variant="outlined">
          Yenile
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Batch Actions */}
      {secilenOneriler.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography>{secilenOneriler.length} eşleşme seçildi</Typography>
            <Stack direction="row" spacing={1}>
              <Button onClick={() => setSecilenOneriler([])}>İptal</Button>
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleBatchOnay}
                disabled={submitting}
              >
                Onayla
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Fatura Kalemleri */}
      {data?.kalemler?.map((item) => (
        <FaturaKalemCard
          key={item.fatura_kalem.id}
          kalem={item.fatura_kalem}
          eslesenIrsaliye={item.eslesen_irsaliye_kalem}
          oneriler={item.oneriler}
          onSelectMatch={handleSelectOneri}
          onRemoveMatch={handleRemoveMatch}
        />
      ))}
    </Box>
  );
};

export default EslestirmeDesktopGuncel;
```

---

### Phase 4: API Client Güncellemesi
**Dosya**: `frontend/src/services/api.js`

```javascript
// Yeni metod ekle
export const eslestirmeAPI = {
  // ... mevcut metodlar

  getGrupluOneriler: (faturaId) => {
    return axios.get(`/api/eslestirme/gruplu-oneler/${faturaId}`);
  },

  eslestirmeKaldir: (faturaKalemId, neden) => {
    return axios.post(`/api/eslestirme/eslestirme-kaldir/${faturaKalemId}`, { neden });
  }
};
```

---

### Phase 5: Routing Güncellemesi
**Dosya**: `frontend/src/App.jsx`

```jsx
// Yeni route ekle
<Route path="/faturalar/:id/eslestirme-guncel" element={<EslestirmeDesktopGuncel />} />

// FaturaDetay'daki butonu güncelle
<Button
  startIcon={<LinkIcon />}
  onClick={() => navigate(`/faturalar/${id}/eslestirme-guncel`)}
  variant="contained"
  color="primary"
>
  Eşleştir
</Button>
```

---

### Phase 6: Test Planı

#### 6.1 Backend Testleri
```javascript
// tests/integration/gruplu-eslestirme.test.js
describe('GET /api/eslestirme/gruplu-oneler/:fatura_id', () => {
  it('should return grouped suggestions for each fatura kalem', async () => {
    const response = await request(app)
      .get('/api/eslestirme/gruplu-oneler/1')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.fatura).toBeDefined();
    expect(response.body.data.kalemler).toBeInstanceOf(Array);
  });
});
```

#### 6.2 Frontend Component Testleri
```javascript
// FaturaKalemCard.test.jsx
describe('FaturaKalemCard', () => {
  it('should display fatura kalem details', () => {
    render(<FaturaKalemCard kalem={mockKalem} />);
    expect(screen.getByText('AK-001')).toBeInTheDocument();
  });

  it('should show matched irsaliye when provided', () => {
    render(<FaturaKalemCard kalem={mockKalem} eslesenIrsaliye={mockIrsaliye} />);
    expect(screen.getByText(/Eşleşen İrsaliye/)).toBeInTheDocument();
  });
});
```

---

## Deployment Checklist

- [ ] Backend controller metodu eklendi
- [ ] Backend route tanımlandı
- [ ] Frontend componentler oluşturuldu
- [ ] API client güncellendi
- [ ] Route eklendi
- [ ] Testler yazıldı ve geçti
- [ ] Manuel test yapıldı
- [ ] Dokümantasyon güncellendi

---

## Notlar

1. **Gerçek zamanlı güncelleme**: Socket.IO entegrasyonu mevcut `EslestirmeDesktop` component'inden alınabilir

2. **Mobile uyumluluk**: İleride `FaturaKalemCardMobile` component'i oluşturulabilir

3. **Performans**: Büyük faturalar için pagination veya lazy loading düşünülebilir

4. **Erişilebilirlik**: Keyboard navigation ve screen reader desteği eklenmeli
