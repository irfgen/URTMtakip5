import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { faturaAPI } from '../services/api';
import FaturaForm from '../components/FaturaForm';

const FaturaDetay = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fatura, setFatura] = useState(null);
  const [kalemler, setKalemler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fatura detaylarını yükle
  const loadFatura = async () => {
    if (!id) {
      setError('Fatura ID bulunamadı');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await faturaAPI.getById(id);
      // API response format: { success: true, data: {...} }
      const faturaData = response.data.data || response.data;
      setFatura(faturaData);
      setKalemler(faturaData.kalemler || []);
    } catch (error) {
      console.error('Fatura yüklenirken hata:', error);
      setError('Fatura yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFatura();
  }, [id]);

  // Silme işlemi
  const handleDelete = async () => {
    try {
      await faturaAPI.delete(id);
      setSnackbar({
        open: true,
        message: 'Fatura başarıyla silindi',
        severity: 'success'
      });
      setDeleteOpen(false);
      setTimeout(() => navigate('/faturalar'), 1000);
    } catch (error) {
      console.error('Fatura silinirken hata:', error);
      setError(error.response?.data?.error || 'Fatura silinirken bir hata oluştu');
    }
  };

  // Lock işlemi
  const handleLock = async () => {
    try {
      await faturaAPI.acquireLock(id);
      await loadFatura();
      setSnackbar({
        open: true,
        message: 'Fatura kilitlendi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Lock hatası:', error);
      setError(error.response?.data?.error || 'Kilit alınamadı');
    }
  };

  const handleUnlock = async () => {
    try {
      await faturaAPI.releaseLock(id);
      await loadFatura();
      setSnackbar({
        open: true,
        message: 'Kilit serbest bırakıldı',
        severity: 'success'
      });
    } catch (error) {
      console.error('Unlock hatası:', error);
      setError(error.response?.data?.error || 'Kilit serbest bırakılamadı');
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

  // Durum label
  const getDurumLabel = (durum) => {
    switch (durum) {
      case 'bekliyor': return 'Bekliyor';
      case 'kismi_eslesti': return 'Kısmi Eşleşti';
      case 'tam_eslesti': return 'Tam Eşleşti';
      default: return durum || '-';
    }
  };

  // Eşleşme durumu chip rengi
  const getEslesmeDurumColor = (eslesme_durumu) => {
    switch (eslesme_durumu) {
      case 0: return 'default'; // Bekliyor
      case 1: return 'success'; // Eşleşti
      default: return 'default';
    }
  };

  // Eşleşme durumu label
  const getEslesmeDurumLabel = (eslesme_durumu) => {
    switch (eslesme_durumu) {
      case 0: return 'Bekliyor';
      case 1: return 'Eşleşti';
      default: return '-';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !fatura) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/faturalar')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Fatura Detayı</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {fatura?.lockState?.state === 'UNLOCKED' && (
            <Tooltip title="Kilitle">
              <IconButton onClick={handleLock} color="primary">
                <LockOpenIcon />
              </IconButton>
            </Tooltip>
          )}
          {fatura?.lockState?.state === 'LOCKED_BY_ME' && (
            <Tooltip title="Kilidi Aç">
              <IconButton onClick={handleUnlock} color="primary">
                <LockIcon />
              </IconButton>
            </Tooltip>
          )}
          <Button
            startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
            variant="outlined"
            disabled={fatura?.lockState?.state === 'LOCKED_BY_OTHER'}
          >
            Düzenle
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteOpen(true)}
            color="error"
            variant="outlined"
            disabled={fatura?.lockState?.state === 'LOCKED_BY_OTHER'}
          >
            Sil
          </Button>
          <Button
            startIcon={<LinkIcon />}
            onClick={() => navigate(`/faturalar/${id}/eslestirme-guncel`)}
            variant="contained"
            color="primary"
          >
            Eşleştir
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Lock Durumu */}
      {fatura?.lockState?.state === 'LOCKED_BY_OTHER' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Bu fatura {fatura.lockState.lockedBy?.personel_adi || 'başka bir kullanıcı'} tarafından kilitlenmiş.
          Kilitli olduğu sürece düzenleme yapılamaz.
        </Alert>
      )}

      {/* Fatura Bilgileri */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Fatura Bilgileri</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Fatura No</Typography>
            <Typography variant="body1">{fatura?.fatura_no || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Belge Tarihi</Typography>
            <Typography variant="body1">
              {fatura?.belge_tarih ? new Date(fatura.belge_tarih).toLocaleDateString('tr-TR') : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Vade Tarihi</Typography>
            <Typography variant="body1">
              {fatura?.vade_tarihi ? new Date(fatura.vade_tarihi).toLocaleDateString('tr-TR') : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Tedarikçi</Typography>
            <Typography variant="body1">{fatura?.tedarikci?.firma_adi || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Durum</Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip label={getDurumLabel(fatura?.durum)} color={getDurumColor(fatura?.durum)} size="small" />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Toplam Kalem</Typography>
            <Typography variant="body1">{fatura?.toplam_kalem || kalemler.length || 0}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Açıklama</Typography>
            <Typography variant="body1">{fatura?.aciklama || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Oluşturan</Typography>
            <Typography variant="body1">{fatura?.olusturan?.personel_adi || '-'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Kalemler */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Kalemler</Typography>
        <Divider sx={{ mb: 2 }} />

        {kalemler.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            Henüz kalem eklenmemiş
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Stok Kodu</TableCell>
                  <TableCell>Mal/Hizmet Adı</TableCell>
                  <TableCell align="right">Miktar</TableCell>
                  <TableCell>Birim</TableCell>
                  <TableCell align="right">Birim Fiyat</TableCell>
                  <TableCell align="right">Toplam Tutar</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Eşleşen İrsaliye</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {kalemler.map((kalem) => (
                  <TableRow key={kalem.id} hover>
                    <TableCell>{kalem.stok_kodu || '-'}</TableCell>
                    <TableCell>{kalem.mal_hizmet_adi || '-'}</TableCell>
                    <TableCell align="right">
                      {kalem.miktar != null ? parseFloat(kalem.miktar).toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }) : '-'}
                    </TableCell>
                    <TableCell>{kalem.birim || '-'}</TableCell>
                    <TableCell align="right">
                      {kalem.birim_fiyat != null ? parseFloat(kalem.birim_fiyat).toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }) + ' ₺' : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {kalem.toplam_tutar != null ? parseFloat(kalem.toplam_tutar).toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }) + ' ₺' : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getEslesmeDurumLabel(kalem.eslesme_durumu)}
                        color={getEslesmeDurumColor(kalem.eslesme_durumu)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {kalem.eslesen_irsaliye_kalem ? (
                        <Typography variant="body2" color="primary">
                          İK-{kalem.eslesen_irsaliye_kalem.id}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Edit Dialog */}
      <FaturaForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => {
          try {
            await faturaAPI.update(id, data);
            await loadFatura();
            setEditOpen(false);
            setSnackbar({
              open: true,
              message: 'Fatura başarıyla güncellendi',
              severity: 'success'
            });
          } catch (error) {
            setError(error.response?.data?.error || 'Güncelleme başarısız');
          }
        }}
        initialData={fatura}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Faturayı Sil</DialogTitle>
        <DialogContent>
          <Typography>
            "{fatura?.fatura_no}" numaralı faturayı silmek istediğinizden emin misiniz?
          </Typography>
          {kalemler.some(k => k.eslesme_durumu === 1) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Bu faturada eşleşmiş kalemler bulunmaktadır. Eşleşmiş kalemleri olan fatura silinemez.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>İptal</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={kalemler.some(k => k.eslesme_durumu === 1)}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FaturaDetay;
