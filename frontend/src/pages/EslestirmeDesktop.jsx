import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Badge
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { eslestirmeAPI, faturaAPI } from '../services/api';
import { io } from 'socket.io-client';
import { getWebSocketUrl } from '../utils/getApiBaseUrl';

const EslestirmeDesktop = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Socket.IO connection
  const [socket, setSocket] = useState(null);

  const [fatura, setFatura] = useState(null);
  const [oneriler, setOneriler] = useState([]);
  const [secilenOneriler, setSecilenOneriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [manuelDialog, setManuelDialog] = useState({ open: false, faturaKalem: null });
  const [kaldirDialog, setKaldirDialog] = useState({ open: false, faturaKalem: null });
  const [nedenInput, setNedenInput] = useState('');

  // Real-time update handler
  const handleRealtimeUpdate = useCallback((data) => {
    console.log('Real-time update received:', data);

    // Update if it's for current fatura
    if (data.faturaId === parseInt(id)) {
      setSuccess(`Eşleşme güncellendi: ${data.itemCount || 1} kalem`);
      loadData(); // Reload data
    }
  }, [id]);

  // Socket.IO event listeners
  useEffect(() => {
    // Connect to Socket.IO server
    const wsUrl = getWebSocketUrl();
    const namespace = '/fatura-eslestirme';
    const socketInstance = io(wsUrl + namespace, {
      transports: ['websocket'],
      reconnection: true
    });

    socketInstance.on('connect', () => {
      console.log('Socket.IO connected:', socketInstance.id);
    });

    socketInstance.on('eslestirme-tamamlandi', handleRealtimeUpdate);
    socketInstance.on('eslestirme-kaldirildi', handleRealtimeUpdate);

    setSocket(socketInstance);

    return () => {
      socketInstance.off('eslestirme-tamamlandi', handleRealtimeUpdate);
      socketInstance.off('eslestirme-kaldirildi', handleRealtimeUpdate);
      socketInstance.disconnect();
    };
  }, [handleRealtimeUpdate]);

  // Fatura ve önerileri yükle
  const loadData = async () => {
    setLoading(true);
    try {
      const [faturaResp, onerilerResp] = await Promise.all([
        faturaAPI.getById(id),
        eslestirmeAPI.getOneriler(id)
      ]);
      setFatura(faturaResp.data.data || faturaResp.data);
      setOneriler(onerilerResp.data.data || []);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Öneriyi seç/seçimi kaldır
  const toggleOneri = (oneri) => {
    const index = secilenOneriler.findIndex(o =>
      o.fatura_kalem_id === oneri.faturaKalem.id &&
      o.irsaliye_kalem_id === oneri.irsaliyeKalem.id
    );

    if (index >= 0) {
      setSecilenOneriler(secilenOneriler.filter((_, i) => i !== index));
    } else {
      setSecilenOneriler([...secilenOneriler, {
        fatura_kalem_id: oneri.faturaKalem.id,
        irsaliye_kalem_id: oneri.irsaliyeKalem.id,
        fatura_miktar: oneri.faturaKalem.miktar,
        irsaliye_miktar: oneri.irsaliyeKalem.miktar,
        miktar_farki: oneri.miktarFarki,
        eslesme_tipi: oneri.eslesmeTipi
      }]);
    }
  };

  // Tümünü seç
  const toggleAll = () => {
    if (secilenOneriler.length === oneriler.length) {
      setSecilenOneriler([]);
    } else {
      setSecilenOneriler(oneriler.map(o => ({
        fatura_kalem_id: o.faturaKalem.id,
        irsaliye_kalem_id: o.irsaliyeKalem.id,
        fatura_miktar: o.faturaKalem.miktar,
        irsaliye_miktar: o.irsaliyeKalem.miktar,
        miktar_farki: o.miktarFarki,
        eslesme_tipi: o.eslesmeTipi
      })));
    }
  };

  // Toplu eşleşme onayı
  const handleBatchOnay = async () => {
    if (secilenOneriler.length === 0) return;

    // Miktar farkı kontrolü
    const miktarFarkliOneriler = secilenOneriler.filter(s => s.miktar_farki > 0.01);
    if (miktarFarkliOneriler.length > 0 && !nedenInput) {
      setError('Miktar farkı olan eşleşmeler için neden belirtmelisiniz');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = secilenOneriler.map(s => ({
        ...s,
        neden: miktarFarkliOneriler.length > 0 ? nedenInput : undefined
      }));

      await eslestirmeAPI.onayla(id, payload);
      setSuccess(`${secilenOneriler.length} eşleşme başarıyla tamamlandı`);
      setSecilenOneriler([]);
      setNedenInput('');
      await loadData();
    } catch (error) {
      console.error('Eşleşme hatası:', error);
      setError(error.response?.data?.error || 'Eşleşme sırasında hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  // Manuel eşleşme dialog aç
  const openManuelDialog = (faturaKalem) => {
    setManuelDialog({ open: true, faturaKalem });
    setNedenInput('');
  };

  // Eşleşme kaldır dialog aç
  const openKaldirDialog = (faturaKalem) => {
    setKaldirDialog({ open: true, faturaKalem });
    setNedenInput('');
  };

  // Eşleşmeyi kaldır
  const handleKaldir = async () => {
    setSubmitting(true);
    setError('');

    try {
      await eslestirmeAPI.eslestirmeKaldir(kaldirDialog.faturaKalem.id, nedenInput);
      setSuccess('Eşleşme başarıyla kaldırıldı');
      setKaldirDialog({ open: false, faturaKalem: null });
      setNedenInput('');
      await loadData();
    } catch (error) {
      console.error('Eşleşme kaldırma hatası:', error);
      setError(error.response?.data?.error || 'Eşleşme kaldırılırken hata oluştu');
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

  // Eşleşme tipi chip
  const getEslesmeTipiChip = (tip) => {
    if (tip === 'tam') {
      return <Chip label="Tam Eşleşme" color="success" size="small" />;
    }
    return <Chip label="Kısmi Eşleşme" color="warning" size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Önerileri fatura kalemi grupla
  const grupluOneriler = {};
  oneriler.forEach(oneri => {
    const fkId = oneri.faturaKalem.id;
    if (!grupluOneriler[fkId]) {
      grupluOneriler[fkId] = {
        faturaKalem: oneri.faturaKalem,
        adaylar: []
      };
    }
    grupluOneriler[fkId].adaylar.push(oneri);
  });

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/faturalar')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4">Fatura Eşleştirme</Typography>
            <Typography variant="body2" color="text.secondary">
              {fatura?.fatura_no} - {fatura?.tedarikci?.adi || fatura?.tedarikci_adi || '-'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={fatura?.durum || '-'} color={getDurumColor(fatura?.durum)} />
          <IconButton onClick={loadData} color="primary">
            <RefreshIcon />
          </IconButton>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              {secilenOneriler.length} eşleşme seçildi
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {secilenOneriler.some(s => s.miktar_farki > 0.01) && (
                <TextField
                  size="small"
                  label="Miktar farkı nedeni"
                  value={nedenInput}
                  onChange={(e) => setNedenInput(e.target.value)}
                  sx={{ width: 250 }}
                />
              )}
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleBatchOnay}
                disabled={submitting || (secilenOneriler.some(s => s.miktar_farki > 0.01) && !nedenInput)}
              >
                Eşleşmeyi Onayla
              </Button>
              <Button onClick={() => setSecilenOneriler([])}>
                İptal
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Öneriler Tablosu */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Eşleşme Önerileri</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={secilenOneriler.length === oneriler.length && oneriler.length > 0}
                indeterminate={secilenOneriler.length > 0 && secilenOneriler.length < oneriler.length}
                onChange={toggleAll}
              />
            }
            label="Tümünü Seç"
          />
        </Box>

        {oneriler.length === 0 ? (
          <Alert severity="info">
            Bu fatura için eşleşme önerisi bulunmuyor. Fatura kalemleri eşleşmeye uygun değil.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Fatura Kalem</TableCell>
                  <TableCell align="right">Fatura Miktar</TableCell>
                  <TableCell>İrsaliye No</TableCell>
                  <TableCell>İrsaliye Tarihi</TableCell>
                  <TableCell align="right">İrsaliye Miktar</TableCell>
                  <TableCell align="right">Miktar Farkı</TableCell>
                  <TableCell>Eşleşme Tipi</TableCell>
                  <TableCell>Tedarikçi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {oneriler.map((oneri, index) => {
                  const isSelected = secilenOneriler.some(s =>
                    s.fatura_kalem_id === oneri.faturaKalem.id &&
                    s.irsaliye_kalem_id === oneri.irsaliyeKalem.id
                  );

                  return (
                    <TableRow
                      key={index}
                      hover
                      selected={isSelected}
                      onClick={() => toggleOneri(oneri)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {oneri.faturaKalem.stok_kodu}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {oneri.faturaKalem.parca_adi}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {parseFloat(oneri.faturaKalem.miktar).toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {oneri.faturaKalem.birim}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="primary">
                          {oneri.irsaliye.irsaliye_no}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(oneri.irsaliye.belge_tarih).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell align="right">
                        {parseFloat(oneri.irsaliyeKalem.miktar).toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {oneri.irsaliyeKalem.birim}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={oneri.miktarFarki > 0.01 ? 'warning.main' : 'text.primary'}
                        >
                          {parseFloat(oneri.miktarFarki).toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getEslesmeTipiChip(oneri.eslesmeTipi)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {oneri.tedarikci.adi}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Eşleşme Kaldır Dialog */}
      <Dialog open={kaldirDialog.open} onClose={() => setKaldirDialog({ open: false, faturaKalem: null })}>
        <DialogTitle>Eşleşmeyi Kaldır</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            <strong>{kaldirDialog.faturaKalem?.stok_kodu}</strong> için eşleşmeyi kaldırmak istediğinizden emin misiniz?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Neden (opsiyonel)"
            value={nedenInput}
            onChange={(e) => setNedenInput(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKaldirDialog({ open: false, faturaKalem: null })}>
            İptal
          </Button>
          <Button
            onClick={handleKaldir}
            color="error"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Kaldır
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EslestirmeDesktop;
