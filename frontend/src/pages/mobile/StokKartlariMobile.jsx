import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Fab,
  SwipeableDrawer,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
  CardHeader,
  CardActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  SwipeLeft,
  SwipeRight,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useSwipeable } from 'react-swipeable';
import stokKartlariService from '../../services/stokKartlariService';
import StokKartiForm from '../../components/StokKartlari/StokKartiForm';

const StokKartlariMobile = () => {
  const theme = useTheme();
  const [stokKartlari, setStokKartlari] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    malzeme_cinsi: '',
    firma: '',
    kritik_stok: false
  });
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [istatistikler, setIstatistikler] = useState({
    toplam: 0,
    kritikStok: 0,
    stoktaYok: 0,
    kritikOran: 0
  });

  // Stok durumu hesaplama
  const getStokDurumu = useCallback((adet, kritikStokMiktari) => {
    if (adet === 0) {
      return { durum: 'Stokta Yok', renk: 'error', ikon: <ErrorIcon /> };
    } else if (adet <= kritikStokMiktari) {
      return { durum: 'Kritik', renk: 'warning', ikon: <WarningIcon /> };
    } else if (adet <= kritikStokMiktari * 2) {
      return { durum: 'Yüksek', renk: 'info', ikon: <CheckCircleIcon /> };
    } else {
      return { durum: 'Normal', renk: 'success', ikon: <CheckCircleIcon /> };
    }
  }, []);

  // Veri yükleme
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const params = {
        page: isRefresh ? 1 : page,
        limit: 20,
        search: searchQuery,
        ...selectedFilters
      };

      const [listResponse, istatistikResponse] = await Promise.all([
        stokKartlariService.getStokKartlari(params),
        stokKartlariService.getIstatistikler()
      ]);

      if (isRefresh || page === 1) {
        setStokKartlari(listResponse.data);
      } else {
        setStokKartlari(prev => [...prev, ...listResponse.data]);
      }

      setHasMore(listResponse.data.length === 20);
      setIstatistikler(istatistikResponse.data);

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Veriler yüklenirken hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchQuery, selectedFilters]);

  // İlk yükleme
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pull to refresh
  const handleRefresh = () => {
    loadData(true);
  };

  // Infinite scroll
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  // Arama
  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1);
  };

  // Swipe handlers
  const createSwipeHandlers = (item) => useSwipeable({
    onSwipedLeft: () => handleDelete(item.id),
    onSwipedRight: () => handleEdit(item),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  // CRUD işlemleri
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu stok kartını silmek istediğinizden emin misiniz?')) {
      try {
        await stokKartlariService.deleteStokKarti(id);
        setSnackbar({
          open: true,
          message: 'Stok kartı başarıyla silindi',
          severity: 'success'
        });
        loadData(true);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Silme işlemi başarısız',
          severity: 'error'
        });
      }
    }
  };

  const handleFormSubmit = () => {
    setFormModalOpen(false);
    setEditingItem(null);
    loadData(true);
  };

  // Stok kartı komponenti
  const StokKartiCard = ({ item }) => {
    const swipeHandlers = createSwipeHandlers(item);
    const stokDurumu = getStokDurumu(item.adet, item.kritik_stok_miktari);

    return (
      <Card
        {...swipeHandlers}
        sx={{
          mb: 2,
          borderLeft: `4px solid ${theme.palette[stokDurumu.renk].main}`,
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <CardHeader
          avatar={
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette[stokDurumu.renk].main, 0.1),
                color: theme.palette[stokDurumu.renk].main
              }}
            >
              <InventoryIcon />
            </Avatar>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {item.malzeme_cinsi}
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {item.kesit}
              {item.boy && ` x ${item.boy}mm`}
            </Typography>
          }
          action={
            <Chip
              icon={stokDurumu.ikon}
              label={stokDurumu.durum}
              color={stokDurumu.renk}
              size="small"
              variant="outlined"
            />
          }
        />

        <CardContent sx={{ pt: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                {item.adet}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mevcut Stok
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <Box textAlign="center">
              <Typography variant="h6" color="warning.main">
                {item.kritik_stok_miktari}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Kritik Seviye
              </Typography>
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Firma:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {item.firma || 'Belirtilmemiş'}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Lokasyon:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {item.lokasyon || 'Belirtilmemiş'}
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button
            startIcon={<EditIcon />}
            size="small"
            onClick={() => handleEdit(item)}
            sx={{ color: theme.palette.primary.main }}
          >
            Düzenle
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            size="small"
            color="error"
            onClick={() => handleDelete(item.id)}
          >
            Sil
          </Button>
        </CardActions>

        {/* Swipe indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, 
              ${theme.palette.success.main} 0%, 
              ${theme.palette.success.main} 50%, 
              ${theme.palette.error.main} 50%, 
              ${theme.palette.error.main} 100%)`
          }}
        />
      </Card>
    );
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <InventoryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Stok Kartları
          </Typography>
          <IconButton color="inherit" onClick={() => setFilterDrawerOpen(true)}>
            <FilterIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* İstatistikler */}
      <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <Box display="flex" justifyContent="space-around">
          <Box textAlign="center">
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
              {istatistikler.toplam}
            </Typography>
            <Typography variant="caption">Toplam</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>
              {istatistikler.kritikStok}
            </Typography>
            <Typography variant="caption">Kritik</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" color="error.main" sx={{ fontWeight: 'bold' }}>
              {istatistikler.stoktaYok}
            </Typography>
            <Typography variant="caption">Stokta Yok</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" color="info.main" sx={{ fontWeight: 'bold' }}>
              %{istatistikler.kritikOran}
            </Typography>
            <Typography variant="caption">Kritik Oran</Typography>
          </Box>
        </Box>
      </Box>

      {/* Arama */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Malzeme ara..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3
            }
          }}
        />
      </Box>

      {/* Stok kartları listesi */}
      <Box sx={{ px: 2 }}>
        {loading && page === 1 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {stokKartlari.map((item) => (
              <StokKartiCard key={item.id} item={item} />
            ))}

            {/* Load more */}
            {hasMore && !loading && (
              <Box display="flex" justifyContent="center" py={2}>
                <Button onClick={handleLoadMore} startIcon={<RefreshIcon />}>
                  Daha Fazla Yükle
                </Button>
              </Box>
            )}

            {loading && page > 1 && (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* FAB - Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        onClick={() => {
          console.log('FAB clicked, current formModalOpen:', formModalOpen);
          setEditingItem(null);
          setFormModalOpen(true);
          console.log('FAB clicked, setting formModalOpen to true');
        }}
      >
        <AddIcon />
      </Fab>

      {/* Filter Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onOpen={() => setFilterDrawerOpen(true)}
        disableSwipeToOpen
        PaperProps={{
          sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16 }
        }}
      >
        <Box sx={{ p: 3, minHeight: 200 }}>
          <Typography variant="h6" gutterBottom>
            Filtreler
          </Typography>
          {/* Filter options will be added here */}
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => setFilterDrawerOpen(false)}
          >
            Filtreleri Uygula
          </Button>
        </Box>
      </SwipeableDrawer>

      {/* Form Modal */}
      {formModalOpen && (
        <StokKartiForm
          open={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleFormSubmit}
          editData={editingItem}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Stok Kartı Modal */}
      {console.log('Component render - formModalOpen:', formModalOpen)}
      {formModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto'
          }}>
            <StokKartiForm
              open={true}
              onClose={() => {
                setFormModalOpen(false);
                setEditingItem(null);
              }}
              stokKarti={editingItem}
              onSuccess={async () => {
                setSnackbar({
                  open: true,
                  message: editingItem ? 'Stok kartı başarıyla güncellendi' : 'Stok kartı başarıyla oluşturuldu',
                  severity: 'success'
                });
                setFormModalOpen(false);
                setEditingItem(null);
                loadData();
              }}
            />
          </div>
        </div>
      )}
    </Box>
  );
};

export default StokKartlariMobile;
