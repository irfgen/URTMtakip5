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
  Alert,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import makinaStokAPI from '../api/makinaStokAPI';
import StokFormModal from './StokFormModal';

const DEPO_OPTIONS = [
  'Ana Depo',
  'Alaaddin Bey Depo'
];

const GIRIS_KAYNAKLARI = [
  'Sipariş Tamamlama',
  'Manuel Giriş',
  'Düzeltme',
  'İade'
];

const MakinaStoklariModal = ({ open, onClose, makina }) => {
  const [stoklar, setStoklar] = useState([]);
  const [makinalar, setMakinalar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStok, setEditingStok] = useState(null);
  const [filters, setFilters] = useState({
    depo_id: '',
    makina_id: ''
  });

  // Load makinalar for filter when modal opens
  useEffect(() => {
    if (open) {
      loadMakinalar();
    }
  }, [open]);

  // Load stoklar when modal opens or filters change
  useEffect(() => {
    if (open) {
      loadStoklar();
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

  const loadStoklar = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await makinaStokAPI.getAllStok(filters);
      setStoklar(response.data || response);
    } catch (err) {
      console.error('Stoklar yüklenirken hata:', err);
      setError(err.message || 'Stoklar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadMakinalarForFilter = () => {
    return makinalar.map(m => (
      <MenuItem key={m.makina_id} value={m.makina_id}>{m.name}</MenuItem>
    ));
  };

  const handleEdit = (stok) => {
    setEditingStok(stok);
    setShowFormModal(true);
  };

  const handleDelete = async (stok) => {
    const depoAdi = stok.depo_id || 'Atanmamış';
    if (!window.confirm(`Bu stok kaydı silinecek (${depoAdi}). Onaylıyor musunuz?`)) {
      return;
    }

    try {
      await makinaStokAPI.deleteStok(stok.stok_id);
      await loadStoklar();
    } catch (err) {
      console.error('Stok silinirken hata:', err);
      setError(err.message || 'Stok silinemedi');
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
    setEditingStok(null);
    loadStoklar();
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditingStok(null);
  };

  const handleNewStok = () => {
    setEditingStok(null);
    setShowFormModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const getToplamStok = () => {
    return stoklar.reduce((toplam, stok) => toplam + (stok.adet || 0), 0);
  };

  const getKaynakChip = (kaynak) => {
    const colorMap = {
      'Sipariş Tamamlama': 'success',
      'Manuel Giriş': 'primary',
      'Düzeltme': 'warning',
      'İade': 'info'
    };
    return (
      <Chip
        label={kaynak}
        color={colorMap[kaynak] || 'default'}
        size="small"
      />
    );
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
            <Box>
              <Typography variant="h6">
                Makina Stokları
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Toplam Stok: <strong>{getToplamStok()} adet</strong>
              </Typography>
            </Box>
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

          {/* Filtreler ve Yeni Stok Butonu */}
          <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Depo</InputLabel>
              <Select
                value={filters.depo_id}
                onChange={handleFilterChange('depo_id')}
                label="Depo"
              >
                <MenuItem value="">Tümü</MenuItem>
                {DEPO_OPTIONS.map(depo => (
                  <MenuItem key={depo} value={depo}>{depo}</MenuItem>
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
              onClick={handleNewStok}
            >
              Stok Girişi
            </Button>
          </Box>

              {/* Stok Listesi */}
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Makina</TableCell>
                        <TableCell>Depo</TableCell>
                        <TableCell>Adet</TableCell>
                        <TableCell>Giriş Kaynağı</TableCell>
                        <TableCell>Giriş Tarihi</TableCell>
                        <TableCell>Seri Numaraları</TableCell>
                        <TableCell>Not</TableCell>
                        <TableCell align="center">İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stoklar.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <Typography color="textSecondary" py={2}>
                              Stok bulunamadı
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        stoklar.map((stok) => (
                          <TableRow key={stok.stok_id} hover>
                            <TableCell>{stok.makina?.name || '-'}</TableCell>
                            <TableCell>
                              {stok.depo_id ? (
                                <Chip label={stok.depo_id} size="small" color="primary" />
                              ) : (
                                <Typography variant="body2" color="textSecondary" fontStyle="italic">
                                  Atanmamış
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" fontWeight="bold">
                                {stok.adet}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {getKaynakChip(stok.giris_kaynagi)}
                            </TableCell>
                            <TableCell>{formatDate(stok.giris_tarihi)}</TableCell>
                            <TableCell>
                              {stok.seri_nolari && stok.seri_nolari.length > 0 ? (
                                <Box>
                                  <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                    {stok.seri_nolari.slice(0, 2).join(', ')}
                                    {stok.seri_nolari.length > 2 && '...'}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {stok.seri_nolari.length} adet
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {stok.not ? (
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                  noWrap
                                  sx={{ maxWidth: 150 }}
                                >
                                  {stok.not}
                                </Typography>
                              ) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit(stok)}
                                title="Düzenle"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(stok)}
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
      <StokFormModal
        open={showFormModal}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        makina={makina}
        stok={editingStok}
      />
    </>
  );
};

export default MakinaStoklariModal;
