import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as OnayIcon,
  Cancel as RedIcon,
  LocalShipping as SiparisIcon,
  DoneAll as TeslimIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import tedarikService from '../../services/tedarikService';
import TedarikTalepForm from './TedarikTalepForm';
import TedarikTalepDetay from './TedarikTalepDetay';
import OnayModal from './OnayModal';
import FirmaYonetimPage from './FirmaYonetimPage';

const TedarikTalepListesi = () => {
  const [talepler, setTalepler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTalep, setSelectedTalep] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detayModalOpen, setDetayModalOpen] = useState(false);
  const [onayModalOpen, setOnayModalOpen] = useState(false);
  const [onayType, setOnayType] = useState('onayla');
  const [filters, setFilters] = useState({
    durum: '',
    kaynak_tipi: '',
    q: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 20,
    rowCount: 0
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [firmaYonetimOpen, setFirmaYonetimOpen] = useState(false);

  useEffect(() => {
    loadTalepler();
  }, [pagination.page, pagination.pageSize, filters]);

  const loadTalepler = async () => {
    setLoading(true);
    try {
      const params = {
        sayfa: pagination.page + 1,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await tedarikService.getTedarikTalepleri(params);
      setTalepler(response.data);
      setPagination(prev => ({
        ...prev,
        rowCount: response.pagination.total
      }));
    } catch (error) {
      console.error('Tedarik talepleri yüklenirken hata:', error);
      setSnackbar({
        open: true,
        message: 'Tedarik talepleri yüklenemedi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 0
    }));
  };

  const handleYeniTalep = () => {
    setSelectedTalep(null);
    setModalOpen(true);
  };

  const handleDuzenle = (talep) => {
    setSelectedTalep(talep);
    setModalOpen(true);
  };

  const handleDetay = (talep) => {
    setSelectedTalep(talep);
    setDetayModalOpen(true);
  };

  const handleOnay = (talep, type) => {
    setSelectedTalep(talep);
    setOnayType(type);
    setOnayModalOpen(true);
  };

  const handleOnayConfirm = async (onayData) => {
    try {
      let response;
      if (onayType === 'onayla') {
        response = await tedarikService.onaylaTedarikTalebi(selectedTalep.id, {
          onaylayan_kullanici: 'Mevcut Kullanıcı',
          ...onayData
        });
      } else {
        response = await tedarikService.reddetTedarikTalebi(selectedTalep.id, {
          onaylayan_kullanici: 'Mevcut Kullanıcı',
          red_nedeni: onayData.notlar
        });
      }

      // Backend'den gelen mesajı doğru şekilde al
      const message = response.data?.message || response.message || 'İşlem başarılı';

      // Otomatik sevkiyat oluşturulduğunda kullanıcı bilgilendirme
      if (onayType === 'onayla' && onayData.firma_id) {
        const successMessage = message + (message.includes('otomatik') ? '' : ' ve otomatik sevkiyat oluşturuldu');
        setSnackbar({
          open: true,
          message: successMessage,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: message,
          severity: 'success'
        });
      }
      loadTalepler();
      setOnayModalOpen(false);
    } catch (error) {
      console.error('Onay işlemi hatası:', error);
      setSnackbar({
        open: true,
        message: error.message || 'İşlem gerçekleştirilemedi',
        severity: 'error'
      });
    }
  };

  const handleSil = async (talep) => {
    if (!window.confirm('Bu tedarik talebini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await tedarikService.deleteTedarikTalebi(talep.id);
      setSnackbar({
        open: true,
        message: 'Tedarik talebi silindi',
        severity: 'success'
      });
      loadTalepler();
    } catch (error) {
      console.error('Silme işlemi hatası:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Silme işlemi gerçekleştirilemedi',
        severity: 'error'
      });
    }
  };

  const handleSave = (savedTalep) => {
    setModalOpen(false);
    setSnackbar({
      open: true,
      message: selectedTalep ? 'Tedarik talebi güncellendi' : 'Tedarik talebi oluşturuldu',
      severity: 'success'
    });
    loadTalepler();
  };

  const getDurumColor = (durum) => {
    const colors = {
      'beklemede': 'warning',
      'onaylandi': 'info',
      'reddedildi': 'error',
      'sipariste': 'secondary',
      'teslim_edildi': 'success'
    };
    return colors[durum] || 'default';
  };

  const getDurumIcon = (durum) => {
    const icons = {
      'beklemedi': <FilterIcon />,
      'onaylandi': <OnayIcon />,
      'reddedildi': <RedIcon />,
      'sipariste': <SiparisIcon />,
      'teslim_edildi': <TeslimIcon />
    };
    return icons[durum];
  };

  const columns = [
    {
      field: 'talep_kodu',
      headerName: 'Talep Kodu',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      )
    },
    {
      field: 'kaynak_tipi',
      headerName: 'Kaynak',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace('_', ' ').toUpperCase() || 'MANUEL'}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'parca_kodu',
      headerName: 'Parça Kodu',
      width: 120
    },
    {
      field: 'adet',
      headerName: 'Adet',
      width: 80,
      renderCell: (params) => {
        // Detaylardaki toplam adeti hesapla
        const toplamAdet = params.row.detaylar?.reduce((sum, detay) => {
          return sum + (parseFloat(detay.miktar) || 0);
        }, 0) || params.row.miktar || 1;

        return (
          <Typography variant="body2" fontWeight="medium">
            {toplamAdet.toLocaleString('tr-TR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            })}
          </Typography>
        );
      }
    },
    {
      field: 'tedarik_firma',
      headerName: 'Tedarik Firma',
      width: 150,
      renderCell: (params) => {
        const firma = params.value;
        if (firma && firma.firma_adi) {
          return (
            <Typography variant="body2">
              {firma.firma_adi}
            </Typography>
          );
        }
        return (
          <Typography variant="body2" color="text.secondary">
            Belirtilmemiş
          </Typography>
        );
      }
    },
    {
      field: 'toplam_tutar',
      headerName: 'Toplam Tutar',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
          }).format(params.value || 0)}
        </Typography>
      )
    },
    {
      field: 'durum',
      headerName: 'Durum',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={getDurumIcon(params.value)}
          label={params.value?.replace('_', ' ').toUpperCase()}
          color={getDurumColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'talep_tarihi',
      headerName: 'Talep Tarihi',
      width: 130,
      renderCell: (params) => {
        const date = new Date(params.value);
        return date.toLocaleDateString('tr-TR');
      }
    },
    {
      field: 'onay_tarihi',
      headerName: 'Onay Tarihi',
      width: 130,
      renderCell: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return date.toLocaleDateString('tr-TR');
      }
    },
    {
      field: 'islemler',
      headerName: 'İşlemler',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Detay">
            <IconButton
              size="small"
              onClick={() => handleDetay(params.row)}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          {params.row.durum === 'beklemede' || params.row.durum === 'reddedildi' ? (
            <Tooltip title="Düzenle">
              <IconButton
                size="small"
                onClick={() => handleDuzenle(params.row)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          ) : null}

          {params.row.durum === 'beklemede' ? (
            <>
              <Tooltip title="Onayla">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleOnay(params.row, 'onayla')}
                >
                  <OnayIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reddet">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleOnay(params.row, 'reddet')}
                >
                  <RedIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : null}
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Tedarik Talepleri
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BusinessIcon />}
            onClick={() => setFirmaYonetimOpen(true)}
          >
            Firma Yönetimi
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleYeniTalep}
          >
            Yeni Talep
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Talep kodu, parça kodu veya açıklama ara..."
                value={filters.q}
                onChange={handleFilterChange('q')}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={filters.durum}
                  onChange={handleFilterChange('durum')}
                  label="Durum"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="beklemede">Beklemede</MenuItem>
                  <MenuItem value="onaylandi">Onaylandı</MenuItem>
                  <MenuItem value="reddedildi">Reddedildi</MenuItem>
                  <MenuItem value="sipariste">Siparişte</MenuItem>
                  <MenuItem value="teslim_edildi">Teslim Edildi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Kaynak Tipi</InputLabel>
                <Select
                  value={filters.kaynak_tipi}
                  onChange={handleFilterChange('kaynak_tipi')}
                  label="Kaynak Tipi"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="manuel">Manuel</MenuItem>
                  <MenuItem value="is_emri">İş Emri</MenuItem>
                  <MenuItem value="parca">Parça</MenuItem>
                  <MenuItem value="stok_karti">Stok Kartı</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadTalepler}
                disabled={loading}
              >
                Yenile
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={talepler}
              columns={columns}
              pagination
              paginationMode="server"
              rowCount={pagination.rowCount}
              page={pagination.page}
              pageSize={pagination.pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              rowsPerPageOptions={[10, 20, 50, 100]}
              disableSelectionOnClick
              getRowId={(row) => row.id}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none'
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold'
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <TedarikTalepForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editData={selectedTalep}
      />

      <TedarikTalepDetay
        open={detayModalOpen}
        onClose={() => setDetayModalOpen(false)}
        talep={selectedTalep}
      />

      <OnayModal
        open={onayModalOpen}
        onClose={() => setOnayModalOpen(false)}
        onConfirm={handleOnayConfirm}
        talep={selectedTalep}
        type={onayType}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Firma Yönetim Modal */}
      <Dialog
        open={firmaYonetimOpen}
        onClose={() => setFirmaYonetimOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Firma Yönetimi</Typography>
            <IconButton
              edge="end"
              onClick={() => setFirmaYonetimOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <FirmaYonetimPage />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TedarikTalepListesi;