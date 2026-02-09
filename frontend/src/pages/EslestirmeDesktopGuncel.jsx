import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Stack, Alert, CircularProgress,
  Divider, TextField, Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import FaturaKalemCard from '../components/eslestirme/FaturaKalemCard';
import { eslestirmeAPI } from '../services/api';
import { io } from 'socket.io-client';
import { getWebSocketUrl } from '../utils/getApiBaseUrl';

const EslestirmeDesktopGuncel = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Socket.IO connection
  const [socket, setSocket] = useState(null);

  const [data, setData] = useState(null);
  const [secilenOneriler, setSecilenOneriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nedenInput, setNedenInput] = useState('');
  const [kaldirDialogOpen, setKaldirDialogOpen] = useState(false);
  const [secilenKalemId, setSecilenKalemId] = useState(null);

  // Veri yükle
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await eslestirmeAPI.getGrupluOneriler(id);
      setData(response.data.data || response.data);
      setSecilenOneriler([]);
    } catch (err) {
      console.error('Veri yüklenirken hata:', err);
      setError(err.response?.data?.error || 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Socket.IO event listeners
  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    const namespace = '/fatura-eslestirme';
    const socketInstance = io(wsUrl + namespace, {
      transports: ['websocket'],
      reconnection: true
    });

    socketInstance.on('connect', () => {
      console.log('Socket.IO connected:', socketInstance.id);
    });

    socketInstance.on('eslestirme-tamamlandi', (data) => {
      console.log('Real-time update received:', data);
      if (data.faturaId === parseInt(id)) {
        setSuccess(`Eşleşme güncellendi: ${data.itemCount || 1} kalem`);
        loadData();
      }
    });

    socketInstance.on('eslestirme-kaldirildi', (data) => {
      console.log('Real-time update received:', data);
      loadData();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off('eslestirme-tamamlandi');
      socketInstance.off('eslestirme-kaldirildi');
      socketInstance.disconnect();
    };
  }, [id, loadData]);

  // Öneri seçimi değiştir
  const handleSecimDegistir = (yeniSecimler) => {
    setSecilenOneriler(yeniSecimler);
  };

  // Eşleşmeyi kaldır
  const handleRemoveMatch = async (faturaKalemId, neden) => {
    setSubmitting(true);
    setError('');
    try {
      await eslestirmeAPI.eslestirmeKaldir(faturaKalemId, neden || '');
      setSuccess('Eşleşme başarıyla kaldırıldı');
      await loadData();
    } catch (err) {
      console.error('Eşleşme kaldırma hatası:', err);
      setError(err.response?.data?.error || 'Eşleşme kaldırılırken hata oluştu');
    } finally {
      setSubmitting(false);
      setKaldirDialogOpen(false);
      setSecilenKalemId(null);
      setNedenInput('');
    }
  };

  // Toplu onay
  const handleBatchOnay = async () => {
    if (secilenOneriler.length === 0) return;

    // Miktar farkı kontrolü
    const miktarFarkliOneriler = secilenOneriler.filter(s => {
      // Önerilerden miktar farkını bul
      const kalem = data?.kalemler?.find(k => k.fatura_kalem.id === s.fatura_kalem_id);
      if (!kalem) return false;

      const oneri = kalem.oneriler?.find(o => o.irsaliye_kalem.id === s.irsaliye_kalem_id);
      if (!oneri) return false;

      return oneri.miktar_farki > 0.01;
    });

    if (miktarFarkliOneriler.length > 0 && !nedenInput) {
      setError('Miktar farkı olan eşleşmeler için neden belirtmelisiniz');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Önerileri API formatına çevir
      const eslestirmeler = secilenOneriler.map(s => {
        const kalem = data?.kalemler?.find(k => k.fatura_kalem.id === s.fatura_kalem_id);
        const oneri = kalem?.oneriler?.find(o => o.irsaliye_kalem.id === s.irsaliye_kalem_id);

        return {
          fatura_kalem_id: s.fatura_kalem_id,
          irsaliye_kalem_id: s.irsaliye_kalem_id,
          fatura_miktar: kalem?.fatura_kalem?.miktar || 0,
          irsaliye_miktar: oneri?.irsaliye_kalem?.miktar || 0,
          miktar_farki: oneri?.miktar_farki || 0,
          eslesme_tipi: oneri?.eslesme_tipi || 'kismi',
          neden: miktarFarkliOneriler.length > 0 ? nedenInput : undefined
        };
      });

      await eslestirmeAPI.onayla(id, eslestirmeler);
      setSuccess(`${secilenOneriler.length} eşleşme başarıyla onaylandı`);
      setSecilenOneriler([]);
      setNedenInput('');
      await loadData();
    } catch (err) {
      console.error('Eşleşme hatası:', err);
      setError(err.response?.data?.error || 'Eşleşme sırasında hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  // Durum chip rengi
  const getDurumColor = (durum) => {
    switch (durum) {
      case 'bekliyor': return 'warning';
      case 'kismi_eslesti': return 'info';
      case 'tam_eslesti': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
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
              {data?.fatura?.fatura_no} - {data?.fatura?.tedarikci?.firma_adi || '-'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={data?.fatura?.durum || '-'} color={getDurumColor(data?.fatura?.durum)} />
          <Button onClick={loadData} startIcon={<RefreshIcon />} variant="outlined" disabled={loading}>
            Yenile
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Batch Actions */}
      {secilenOneriler.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" gap={2}>
            <Typography variant="subtitle1">
              {secilenOneriler.length} eşleşme seçildi
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button onClick={() => setSecilenOneriler([])} startIcon={<CloseIcon />}>
                İptal
              </Button>
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={20} /> : <CheckIcon />}
                onClick={handleBatchOnay}
                disabled={submitting}
              >
                Onayla
              </Button>
            </Stack>
          </Stack>

          {/* Miktar farkı uyarısı */}
          {secilenOneriler.some(s => {
            const kalem = data?.kalemler?.find(k => k.fatura_kalem.id === s.fatura_kalem_id);
            const oneri = kalem?.oneriler?.find(o => o.irsaliye_kalem.id === s.irsaliye_kalem_id);
            return oneri?.miktar_farki > 0.01;
          }) && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Miktar farkı olan eşleşmeler için neden *"
                value={nedenInput}
                onChange={(e) => setNedenInput(e.target.value)}
                placeholder="Lütfen miktar farkının sebebini belirtin..."
                multiline
                rows={2}
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Fatura Bilgisi Özet */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
          <Box>
            <Typography variant="caption" color="text.secondary">Fatura No</Typography>
            <Typography variant="body1" fontWeight="medium">{data?.fatura?.fatura_no || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Belge Tarihi</Typography>
            <Typography variant="body1">
              {data?.fatura?.belge_tarih ? new Date(data.fatura.belge_tarih).toLocaleDateString('tr-TR') : '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Toplam Kalem</Typography>
            <Typography variant="body1">{data?.kalemler?.length || 0}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Durum</Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip label={data?.fatura?.durum || '-'} color={getDurumColor(data?.fatura?.durum)} size="small" />
            </Box>
          </Box>
        </Stack>
      </Paper>

      {/* Fatura Kalemleri */}
      {data?.kalemler?.map((item) => (
        <FaturaKalemCard
          key={item.fatura_kalem.id}
          kalem={item.fatura_kalem}
          eslesenIrsaliye={item.eslesen_irsaliye_kalem}
          oneriler={item.oneriler}
          seciliOneriler={secilenOneriler}
          onSecimDegistir={handleSecimDegistir}
          onSelectMatch={handleRemoveMatch}
        />
      ))}

      {/* Empty State */}
      {data?.kalemler?.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Bu faturada kalem bulunmuyor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fatura detayına dönerek kalem ekleyebilirsiniz
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EslestirmeDesktopGuncel;
