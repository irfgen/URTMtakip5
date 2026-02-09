import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import makinaSiparisAPI from '../api/makinaSiparisAPI';
import SiparisFormModal from './SiparisFormModal';

const DURUM_OPTIONS = [
  'Beklemede',
  'Gövde Montaj',
  'Boyada',
  'Son montajda',
  'Üretimde',
  'Tamamlandı',
  'İptal'
];

const DURUM_RENKLERI = {
  'Beklemede': 'default',
  'Gövde Montaj': 'info',
  'Boyada': 'secondary',
  'Son montajda': 'warning',
  'Üretimde': 'primary',
  'Tamamlandı': 'success',
  'İptal': 'error'
};

const MakinaSiparislerModal = ({ open, onClose, makina }) => {
  const [siparisler, setSiparisler] = useState([]);
  const [makinalar, setMakinalar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSiparis, setEditingSiparis] = useState(null);
  const [filters, setFilters] = useState({
    durum: '',
    makina_id: ''
  });

  // Load makinalar for filter when modal opens
  useEffect(() => {
    if (open) {
      loadMakinalar();
    }
  }, [open]);

  // Load siparisler when modal opens or filters change
  useEffect(() => {
    if (open) {
      loadSiparisler();
    }
  }, [open, filters]);

  const loadMakinalar = async () => {
    try {
      const response = await axios.get('/api/makinalar');
      setMakinalar(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Makinalar yüklenirken hata:', err);
    }
  };

  const loadSiparisler = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await makinaSiparisAPI.getAllSiparisler(filters);
      setSiparisler(response.data || response);
    } catch (err) {
      console.error('Siparişler yüklenirken hata:', err);
      setError(err.message || 'Siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadMakinalarForFilter = () => {
    return makinalar.map(m => (
      <MenuItem key={m.makina_id} value={m.makina_id}>{m.name}</MenuItem>
    ));
  };

  const handleEdit = (siparis) => {
    setEditingSiparis(siparis);
    setShowFormModal(true);
  };

  const handleDelete = async (siparis) => {
    if (!window.confirm(`Sipariş numarası ${siparis.siparis_no} silinecek. Onaylıyor musunuz?`)) {
      return;
    }

    try {
      await makinaSiparisAPI.deleteSiparis(siparis.siparis_id);
      await loadSiparisler();
    } catch (err) {
      console.error('Sipariş silinirken hata:', err);
      setError(err.message || 'Sipariş silinemedi');
    }
  };

  const handleDurumChange = async (siparis, yeniDurum) => {
    try {
      await makinaSiparisAPI.updateSiparisDurum(siparis.siparis_id, yeniDurum);
      await loadSiparisler();
    } catch (err) {
      console.error('Durum güncellenirken hata:', err);
      setError(err.message || 'Durum güncellenemedi');
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingSiparis(null);
    loadSiparisler();
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditingSiparis(null);
  };

  const handleNewSiparis = () => {
    setEditingSiparis(null);
    setShowFormModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Makina Siparişleri
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Filtreler ve Yeni Sipariş Butonu */}
          <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Durum</InputLabel>
              <Select
                value={filters.durum}
                onChange={handleFilterChange('durum')}
                label="Durum"
              >
                <MenuItem value="">Tümü</MenuItem>
                {DURUM_OPTIONS.map(durum => (
                  <MenuItem key={durum} value={durum}>{durum}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Makina</InputLabel>
              <Select
                value={filters.makina_id}
                onChange={handleFilterChange('makina_id')}
                label="Makina"
              >
                <MenuItem value="">Tümü</MenuItem>
                {loadMakinalarForFilter()}
              </Select>
            </FormControl>

            <Box flexGrow={1} />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewSiparis}
            >
              Yeni Sipariş
            </Button>
          </Box>

              {/* Sipariş Listesi */}
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sipariş No</TableCell>
                        <TableCell>Makina</TableCell>
                        <TableCell>Müşteri</TableCell>
                        <TableCell>Adet</TableCell>
                        <TableCell>Durum</TableCell>
                        <TableCell>Sipariş Tarihi</TableCell>
                        <TableCell>Teslim Tarihi</TableCell>
                        <TableCell>Not</TableCell>
                        <TableCell align="center">İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {siparisler.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            <Typography color="textSecondary" py={2}>
                              Sipariş bulunamadı
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        siparisler.map((siparis) => (
                          <TableRow key={siparis.siparis_id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {siparis.siparis_no}
                              </Typography>
                            </TableCell>
                            <TableCell>{siparis.makina?.name || '-'}</TableCell>
                            <TableCell>{siparis.musteri || '-'}</TableCell>
                            <TableCell>{siparis.adet}</TableCell>
                            <TableCell>
                              <Select
                                value={siparis.durum}
                                onChange={(e) => handleDurumChange(siparis, e.target.value)}
                                size="small"
                                sx={{ minWidth: 150 }}
                              >
                                {DURUM_OPTIONS.map(durum => (
                                  <MenuItem key={durum} value={durum}>
                                    <Chip
                                      label={durum}
                                      color={DURUM_RENKLERI[durum]}
                                      size="small"
                                    />
                                  </MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>{formatDate(siparis.siparis_tarihi)}</TableCell>
                            <TableCell>{formatDate(siparis.teslim_tarihi)}</TableCell>
                            <TableCell>
                              {siparis.not ? (
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                  noWrap
                                  sx={{ maxWidth: 200 }}
                                >
                                  {siparis.not}
                                </Typography>
                              ) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit(siparis)}
                                title="Düzenle"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(siparis)}
                                title="Sil"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Form Modal */}
      <SiparisFormModal
        open={showFormModal}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        makina={makina}
        siparis={editingSiparis}
      />
    </>
  );
};

export default MakinaSiparislerModal;
