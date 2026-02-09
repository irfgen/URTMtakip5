import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Fab,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Snackbar,
  Container
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUretimPlanlari, deleteUretimPlani } from '../../store/slices/uretimPlaniSlice';
import axios from 'axios';
import UretimPlaniKartiMobile from '../../components/mobile/UretimPlaniKartiMobile';
import UretimPlaniFiltreleMobile from '../../components/mobile/UretimPlaniFiltreleMobile';

const UretimPlaniMobile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.uretimPlani);

  // Local state
  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    hasMore: true,
    loading: false
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    durum: '',
    ozelListeAdi: ''
  });

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load data
  const loadUretimPlanlari = useCallback(async (isRefresh = false) => {
    try {
      const offset = isRefresh ? 0 : pagination.offset;
      const params = new URLSearchParams({
        mobile: 'true',
        limit: pagination.limit.toString(),
        offset: offset.toString(),
        ...filters
      });

      const response = await axios.get(`/api/uretim-plani?${params.toString()}`);
      
      if (isRefresh) {
        setUretimPlanlari(response.data.data);
        setFilteredPlans(response.data.data);
        setPagination(prev => ({
          ...prev,
          offset: pagination.limit,
          hasMore: response.data.pagination.hasMore,
          loading: false
        }));
      } else {
        setUretimPlanlari(prev => [...prev, ...response.data.data]);
        setFilteredPlans(prev => [...prev, ...response.data.data]);
        setPagination(prev => ({
          ...prev,
          offset: offset + pagination.limit,
          hasMore: response.data.pagination.hasMore,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Üretim planları yüklenirken hata:', error);
      setSnackbar({
        open: true,
        message: 'Üretim planları yüklenirken hata oluştu',
        severity: 'error'
      });
      setPagination(prev => ({ ...prev, loading: false }));
    }
  }, [filters, pagination.limit, pagination.offset]);

  // Initial load
  useEffect(() => {
    loadUretimPlanlari(true);
  }, [filters]);

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPlans(uretimPlanlari);
      return;
    }

    const filtered = uretimPlanlari.filter(plan => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (plan.ozel_liste_adi || '').toLowerCase().includes(searchLower) ||
        (plan.makina?.name || '').toLowerCase().includes(searchLower) ||
        (plan.durum || '').toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredPlans(filtered);
  }, [searchTerm, uretimPlanlari]);

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, offset: 0, hasMore: true }));
    await loadUretimPlanlari(true);
    setRefreshing(false);
  };

  // Load more
  const handleLoadMore = () => {
    if (pagination.hasMore && !pagination.loading) {
      setPagination(prev => ({ ...prev, loading: true }));
      loadUretimPlanlari(false);
    }
  };

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pagination.hasMore, pagination.loading]);

  // Filter handlers
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, offset: 0, hasMore: true }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      durum: '',
      ozelListeAdi: ''
    });
    setPagination(prev => ({ ...prev, offset: 0, hasMore: true }));
  };

  // Menu handlers
  const handleMenuOpen = (plan, event) => {
    setSelectedPlan(plan);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedPlan(null);
  };

  const handleEdit = () => {
    if (selectedPlan) {
      navigate(`/mobile/uretim-plani/duzenle/${selectedPlan.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    
    try {
      await dispatch(deleteUretimPlani(selectedPlan.id));
      await handleRefresh();
      setSnackbar({
        open: true,
        message: 'Üretim planı başarıyla silindi',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Üretim planı silinirken hata oluştu',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Search Bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <TextField
            fullWidth
            placeholder="Üretim planlarını ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
              },
            }}
          />
          <IconButton onClick={() => setFilterDrawerOpen(true)}>
            <FilterIcon />
          </IconButton>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="sm" sx={{ flex: 1, py: 2 }}>
        {loading && pagination.offset === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Results Info */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {filteredPlans.length} üretim planı bulundu
            </Typography>

            {/* Plans List */}
            {filteredPlans.map((plan) => (
              <UretimPlaniKartiMobile
                key={plan.id}
                plan={plan}
                onMenuClick={handleMenuOpen}
              />
            ))}

            {/* Load More Indicator */}
            {pagination.loading && (
              <Box display="flex" justifyContent="center" sx={{ py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {/* No More Data */}
            {!pagination.hasMore && filteredPlans.length > 0 && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center" 
                sx={{ py: 2 }}
              >
                Tüm üretim planları yüklendi
              </Typography>
            )}

            {/* Empty State */}
            {filteredPlans.length === 0 && !loading && (
              <Box textAlign="center" sx={{ py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  Üretim planı bulunamadı
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yeni bir üretim planı oluşturmak için + butonuna tıklayın
                </Typography>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Add FAB */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate('/mobile/uretim-plani/ekle')}
      >
        <AddIcon />
      </Fab>

      {/* Filter Drawer */}
      <UretimPlaniFiltreleMobile
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Düzenle</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Sil
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UretimPlaniMobile;