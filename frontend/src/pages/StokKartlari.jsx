import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Snackbar,
  CircularProgress,
  Stack
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useParams, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

import useStokKartlari from '../hooks/useStokKartlari';
import StokKartiForm from '../components/StokKartlari/StokKartiForm';
import stokTakipListeleriService from '../services/stokTakipListeleriService';
import StokTakipListesiModal from '../components/StokTakipListeleri/StokTakipListesiModal';
import StokTakipListeleriYonetModal from '../components/StokTakipListeleri/StokTakipListeleriYonetModal';
import TedarikTalepForm from '../components/tedarik/TedarikTalepForm';
import stokKartlariService from '../services/stokKartlariService';

// Stok durumu chip komponenti
const StokDurumuChip = ({ stokDurumu }) => {
  if (!stokDurumu) return <Chip label="Bilinmiyor" color="default" size="small" />;
  
  const { durum } = stokDurumu;
  
  const chipProps = {
    'stokta_yok': { label: 'Stokta Yok', color: 'error', icon: <WarningIcon /> },
    'kritik': { label: 'Kritik', color: 'warning', icon: <TrendingDownIcon /> },
    'normal': { label: 'Normal', color: 'success' },
    'yuksek': { label: 'Yüksek', color: 'info', icon: <TrendingUpIcon /> }
  };
  
  const props = chipProps[durum] || chipProps.normal;
  return <Chip {...props} size="small" />;
};

// İstatistik kartı komponenti
const StatCard = ({ title, value, color = "primary", loading = false }) => (
  <Card>
    <CardContent sx={{ textAlign: 'center', py: 3 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {loading ? (
        <CircularProgress size={32} />
      ) : (
        <Typography variant="h3" color={`${color}.main`} fontWeight="bold">
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Ana component
function StokKartlari() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    stokKartlari,
    loading,
    error,
    pagination,
    filters,
    dropdownData,
    istatistikler,
    hasFilters,
    isEmpty,
    updateFilters,
    updatePagination,
    resetFilters,
    fetchData,
    createStokKarti,
    updateStokKarti,
    deleteStokKarti
  } = useStokKartlari();
  
  // UI state
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  const [modalForm, setModalForm] = useState({ 
    open: false, 
    stokKarti: null 
  });

  // Stok Takip Listeleri durumları
  const [stokTakipListeleri, setStokTakipListeleri] = useState([]);
  const [seciliTakipListesiId, setSeciliTakipListesiId] = useState('');
  const [membershipMap, setMembershipMap] = useState({});
  const [membershipLoading, setMembershipLoading] = useState(false);

  // URL'den ID parametresini kontrol et ve modal aç
  useEffect(() => {
    if (id) {
      // ID parametresi varsa, bu stok kartını bul ve modal'da aç
      const loadStokKartiForModal = async () => {
        try {
          const response = await stokKartlariService.getStokKarti(id);
          if (response.success && response.data) {
            setModalForm({ open: true, stokKarti: response.data });
            // URL'i temizle - sadece /stok-kartlari olarak kalsın
            navigate('/stok-kartlari', { replace: true });
          }
        } catch (error) {
          console.error('Stok kartı yüklenirken hata:', error);
          setSnackbar({
            open: true,
            message: 'Stok kartı bulunamadı',
            severity: 'error'
          });
          navigate('/stok-kartlari', { replace: true });
        }
      };

      loadStokKartiForModal();
    }
  }, [id, navigate]);

  // Parça ve stok kartı güncellemelerini dinle
  useEffect(() => {
    const handleParcaUpdate = (event) => {
      console.log('Parça güncellendi, stok kartları yeniden yükleniyor:', event.detail);
      fetchData();
    };

    const handleStokKartiUpdate = (event) => {
      console.log('Stok kartı güncellendi, veriler yeniden yükleniyor:', event.detail);
      fetchData();
    };

    window.addEventListener('parcaUpdated', handleParcaUpdate);
    window.addEventListener('stokKartiUpdated', handleStokKartiUpdate);

    return () => {
      window.removeEventListener('parcaUpdated', handleParcaUpdate);
      window.removeEventListener('stokKartiUpdated', handleStokKartiUpdate);
    };
  }, [fetchData]);

  // Stok takip listelerini yükle
  useEffect(() => {
    (async () => {
      try {
        const lists = await stokTakipListeleriService.list();
        setStokTakipListeleri(lists || []);
      } catch (e) {
        console.error('Takip listeleri yükleme hatası:', e);
      }
    })();
  }, []);

  // Görünen stok kartları için üyelikleri yükle
  useEffect(() => {
    const load = async () => {
      try {
        setMembershipLoading(true);
        const ids = (stokKartlari || []).map(r => r.id);
        if (!ids.length) {
          setMembershipMap({});
          return;
        }
        const map = await stokTakipListeleriService.getMembershipForIds(ids);
        setMembershipMap(map || {});
      } catch (e) {
        console.error('Stok takip membership hatası:', e);
      } finally {
        setMembershipLoading(false);
      }
    };
    load();
  }, [stokKartlari]);

  // Modal handlers
  const handleOpenForm = (stokKarti = null) => {
    setModalForm({ open: true, stokKarti });
  };

  const handleCloseForm = () => {
    setModalForm({ open: false, stokKarti: null });
  };

  const handleFormSuccess = async (data, action) => {
    const message = action === 'create' 
      ? 'Yeni stok kartı başarıyla oluşturuldu' 
      : 'Stok kartı başarıyla güncellendi';
    
    setSnackbar({
      open: true,
      message,
      severity: 'success'
    });
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm('Bu stok kartını silmek istediğinizden emin misiniz?')) {
      return;
    }

    const result = await deleteStokKarti(id);
    
    setSnackbar({
      open: true,
      message: result.success 
        ? 'Stok kartı başarıyla silindi' 
        : result.error || 'Silme işlemi başarısız',
      severity: result.success ? 'success' : 'error'
    });
  };

  // Filter handlers
  const handleFilterChange = (field, value) => {
    updateFilters({ [field]: value });
  };

  const handleClearFilters = () => {
    resetFilters();
    setSeciliTakipListesiId('');
  };

  const handleRefresh = () => {
    fetchData();
  };

  // Tedarik talebi fonksiyonları
  const handleOpenTedarikModal = (stokKarti) => {
    setSelectedStokKartiForTedarik(stokKarti);
    setTedarikModalOpen(true);
  };

  const handleCloseTedarikModal = () => {
    setTedarikModalOpen(false);
    setSelectedStokKartiForTedarik(null);
  };

  const handleTedarikTalebiOlustur = async (talepData) => {
    try {
      // Stok kartından tedarik talebi oluştur
      const enrichedTalep = {
        kaynak_tipi: 'stok_karti',
        kaynak_id: selectedStokKartiForTedarik?.id,
        stok_karti_id: selectedStokKartiForTedarik?.id,
        aciklama: `${selectedStokKartiForTedarik?.malzeme_cinsi} (${selectedStokKartiForTedarik?.kesit}${selectedStokKartiForTedarik?.boy ? ` x ${selectedStokKartiForTedarik.boy}mm` : ''}) için tedarik talebi`,
        talep_eden_kullanici: 'Sistem Kullanıcısı',
        detaylar: talepData.detaylar || []
      };

      // tedarikService'i kullanarak talep oluştur
      const response = await import('../services/tedarikService').then(module =>
        module.default.createFromStokKarti(selectedStokKartiForTedarik?.id, enrichedTalep)
      );

      setSnackbar({
        open: true,
        message: 'Tedarik talebi başarıyla oluşturuldu',
        severity: 'success'
      });

      handleCloseTedarikModal();
    } catch (error) {
      console.error('Tedarik talebi oluşturulurken hata:', error);
      setSnackbar({
        open: true,
        message: 'Tedarik talebi oluşturulurken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  // Modallar
  const [yeniListeModalOpen, setYeniListeModalOpen] = useState(false);
  const [yonetModalOpen, setYonetModalOpen] = useState(false);
  const [tedarikModalOpen, setTedarikModalOpen] = useState(false);
  const [selectedStokKartiForTedarik, setSelectedStokKartiForTedarik] = useState(null);

  // DataGrid kolonları
  const columns = useMemo(() => [
    {
      field: 'formatted_boyut',
      headerName: 'Boyut',
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" fontFamily="monospace">
          {params.value || `${params.row.kesit}${params.row.boy ? ` x ${params.row.boy}mm` : ''}`}
        </Typography>
      )
    },
    {
      field: 'malzeme_cinsi',
      headerName: 'Malzeme Cinsi',
      width: 200,
      flex: 1
    },
    {
      field: 'malzeme_adi',
      headerName: 'Malzeme Adı',
      width: 180,
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value ? 'text.primary' : 'text.secondary'}>
          {params.value || '-'}
        </Typography>
      )
    },
    {
      field: 'adet',
      headerName: 'Adet',
      width: 90,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          fontWeight="bold"
          color={params.value === 0 ? 'error.main' : 'text.primary'}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'kritik_stok_miktari',
      headerName: 'Kritik Seviye',
      width: 110,
      type: 'number',
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'stok_durumu',
      headerName: 'Durum',
      width: 120,
      renderCell: (params) => <StokDurumuChip stokDurumu={params.value} />
    },
    {
      field: 'stok_takip_listeleri',
      headerName: 'Stok Takip Listesi',
      width: 220,
      sortable: false,
      renderCell: (params) => {
        const lists = membershipMap[params.row.id] || [];
        if (!lists.length) return (
          <Typography variant="body2" color="text.secondary">-</Typography>
        );
        const shown = lists.slice(0, 2);
        const remaining = lists.length - shown.length;
        return (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
            {shown.map(l => (
              <Chip key={l.id} label={l.ad} size="small" />
            ))}
            {remaining > 0 && (
              <Tooltip title={lists.map(l => l.ad).join(', ')}>
                <Chip label={`+${remaining}`} size="small" variant="outlined" />
              </Tooltip>
            )}
          </Stack>
        );
      }
    },
    {
      field: 'lokasyon',
      headerName: 'Lokasyon',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value ? 'text.primary' : 'text.secondary'}>
          {params.value || '-'}
        </Typography>
      )
    },
    {
      field: 'firma',
      headerName: 'Firma',
      width: 150,
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value ? 'text.primary' : 'text.secondary'}>
          {params.value || '-'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 230,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Düzenle">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenForm(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sil">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tedarik Talebi Oluştur">
            <IconButton
              size="small"
              color="warning"
              onClick={() => handleOpenTedarikModal(params.row)}
            >
              <ShoppingCartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Listeye Ekle">
            <span>
              <IconButton
                size="small"
                color="secondary"
                disabled={!seciliTakipListesiId}
                onClick={async () => {
                  if (!seciliTakipListesiId) return;
                  try {
                    const listIdNum = parseInt(seciliTakipListesiId);
                    await stokTakipListeleriService.addItem(listIdNum, { stok_karti_id: params.row.id, adet: 1 });
                    // UI'yi anında güncelle (ek API çağrısı olmadan)
                    setMembershipMap(prev => {
                      const current = prev[params.row.id] || [];
                      const exists = current.some(l => parseInt(l.id) === listIdNum);
                      if (exists) return prev;
                      const listObj = (stokTakipListeleri || []).find(l => parseInt(l.id) === listIdNum);
                      const updated = [...current, { id: listIdNum, ad: listObj?.ad || 'Liste' }];
                      return { ...prev, [params.row.id]: updated };
                    });
                    setSnackbar({ open: true, severity: 'success', message: 'Listeye eklendi' });
                    // Seçili liste filtresi aktifse grid'i yenile
                    if (seciliTakipListesiId) {
                      fetchData();
                    }
                  } catch (e) {
                    setSnackbar({ open: true, severity: 'error', message: 'Ekleme başarısız' });
                  }
                }}
              >
                <PlaylistAddIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Listeden Çıkar">
            <span>
              <IconButton
                size="small"
                color="warning"
                disabled={!seciliTakipListesiId}
                onClick={async () => {
                  if (!seciliTakipListesiId) return;
                  try {
                    const listIdNum = parseInt(seciliTakipListesiId);
                    await stokTakipListeleriService.removeItem(listIdNum, params.row.id);
                    // UI'yi anında güncelle (ek API çağrısı olmadan)
                    setMembershipMap(prev => {
                      const current = prev[params.row.id] || [];
                      const updated = current.filter(l => parseInt(l.id) !== listIdNum);
                      return { ...prev, [params.row.id]: updated };
                    });
                    setSnackbar({ open: true, severity: 'success', message: 'Listeden çıkarıldı' });
                    // Seçili liste filtresi aktifse grid'i yenile (satırın anında kaybolması için)
                    if (seciliTakipListesiId) {
                      fetchData();
                    }
                  } catch (e) {
                    setSnackbar({ open: true, severity: 'error', message: 'Çıkarma başarısız' });
                  }
                }}
              >
                <PlaylistRemoveIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      )
    }
  ], [membershipMap, seciliTakipListesiId]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          Stok Kartları
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Yenile
          </Button>
          <Button
            variant="outlined"
            onClick={() => setYonetModalOpen(true)}
          >
            Takip listelerini yönet
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            onClick={() => setYeniListeModalOpen(true)}
          >
            Yeni Stok Takip Listesi
          </Button>
        </Stack>
      </Box>

      {/* İstatistik Kartları */}
      {istatistikler && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Toplam Kart" 
              value={istatistikler.toplam_kart} 
              color="primary" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Kritik Stok" 
              value={istatistikler.kritik_stok_sayisi} 
              color="warning" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Stokta Yok" 
              value={istatistikler.stokta_yok_sayisi} 
              color="error" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Kritik Oran" 
              value={`%${istatistikler.kritik_stok_orani || 0}`} 
              color="info" 
            />
          </Grid>
        </Grid>
      )}

      {/* Filtreler */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Arama"
              placeholder="Kesit, malzeme cinsi, firma..."
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth>
              <InputLabel>Malzeme Cinsi</InputLabel>
              <Select
                value={filters.malzeme_cinsi}
                onChange={(e) => handleFilterChange('malzeme_cinsi', e.target.value)}
                label="Malzeme Cinsi"
              >
                <MenuItem value="">Tümü</MenuItem>
                {dropdownData.malzemeCinsleri.map((malzeme) => (
                  <MenuItem key={malzeme} value={malzeme}>
                    {malzeme}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth>
              <InputLabel>Firma</InputLabel>
              <Select
                value={filters.firma}
                onChange={(e) => handleFilterChange('firma', e.target.value)}
                label="Firma"
              >
                <MenuItem value="">Tümü</MenuItem>
                {dropdownData.firmalar.map((firma) => (
                  <MenuItem key={firma} value={firma}>
                    {firma}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.kritik_stok}
                  onChange={(e) => handleFilterChange('kritik_stok', e.target.checked)}
                />
              }
              label="Sadece Kritik Stok"
            />
          </Grid>

          {/* Stok Takip Listesi Filtresi */}
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth>
              <InputLabel>Seçili Takip Listesi</InputLabel>
              <Select
                value={seciliTakipListesiId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSeciliTakipListesiId(val);
                  // Server-side filtreyi tetikle
                  handleFilterChange('stok_takip_listesi_id', val || undefined);
                }}
                label="Seçili Takip Listesi"
              >
                <MenuItem value="">(Yok)</MenuItem>
                {stokTakipListeleri.map(l => (
                  <MenuItem key={l.id} value={l.id}>{l.ad}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              disabled={!hasFilters}
            >
              Filtreleri Temizle
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={stokKartlari}
          columns={columns}
          loading={loading}
          paginationMode="server"
          rowCount={pagination.total}
          paginationModel={{
            page: pagination.page,
            pageSize: pagination.pageSize
          }}
          onPaginationModelChange={(model) => {
            console.log('Pagination model changed:', model);
            updatePagination({ 
              page: model.page, 
              pageSize: model.pageSize 
            });
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: 20
              }
            }
          }}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover'
            },
            '& .MuiDataGrid-cell': {
              borderRight: '1px solid',
              borderRightColor: 'divider'
            }
          }}
          slots={{
            noRowsOverlay: () => (
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                height="100%"
                p={3}
              >
                <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {hasFilters ? 'Filtrelere uygun stok kartı bulunamadı' : 'Henüz stok kartı bulunmuyor'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {hasFilters ? 'Filtrelerinizi değiştirmeyi deneyin' : 'İlk stok kartınızı oluşturun'}
                </Typography>
                {hasFilters ? (
                  <Button variant="outlined" onClick={handleClearFilters}>
                    Filtreleri Temizle
                  </Button>
                ) : (
                  <Button variant="contained" onClick={() => handleOpenForm()}>
                    Yeni Stok Kartı Ekle
                  </Button>
                )}
              </Box>
            )
          }}
        />
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Stok Takip Listesi Oluştur/Düzenle */}
      <StokTakipListesiModal
        open={yeniListeModalOpen}
        onClose={() => setYeniListeModalOpen(false)}
        onSaved={async () => {
          try {
            const lists = await stokTakipListeleriService.list();
            setStokTakipListeleri(lists || []);
          } catch {}
        }}
      />

      {/* Stok Kartı Düzenleme Formu */}
      <StokKartiForm
        open={modalForm.open}
        onClose={() => setModalForm({ open: false, stokKarti: null })}
        stokKarti={modalForm.stokKarti}
        onSuccess={handleFormSuccess}
      />

      {/* Takip Listelerini Yönet */}
      <StokTakipListeleriYonetModal
        open={yonetModalOpen}
        onClose={() => setYonetModalOpen(false)}
      />

      {/* Tedarik Talebi Oluşturma Modal */}
      <TedarikTalepForm
        open={tedarikModalOpen}
        onClose={handleCloseTedarikModal}
        onSave={handleTedarikTalebiOlustur}
        prefillData={{
          kaynak_tipi: 'stok_karti',
          kaynak_id: selectedStokKartiForTedarik?.id,
          stok_karti_id: selectedStokKartiForTedarik?.id,
          stokKarti: selectedStokKartiForTedarik,
          aciklama: `${selectedStokKartiForTedarik?.malzeme_cinsi} (${selectedStokKartiForTedarik?.kesit}${selectedStokKartiForTedarik?.boy ? ` x ${selectedStokKartiForTedarik.boy}mm` : ''}) için tedarik talebi`
        }}
      />
    </Box>
  );
}

export default StokKartlari;
