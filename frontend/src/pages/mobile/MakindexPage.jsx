import React, { useEffect, useState, memo, useMemo, useCallback, useRef } from 'react';
import socketClient from '../../utils/socketClient';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Paper,
  Typography,
  Fab,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Modal,
  Backdrop,
  Slide,
} from '@mui/material';
import {
  Menu,
  Search,
  ExpandMore,
  ExpandLess,
  Refresh,
  FilterList,
  Close,
  MoreVert,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import MakindexTreeView from '../../components/makindex/MakindexTreeView';
import MakindexSearch from '../../components/makindex/MakindexSearch';
import ParcaDetayCard from '../../components/makindex/ParcaDetayCard';
import {
  fetchSiniflar,
  fetchMakinalar,
  fetchGruplarByMakinaId,
  fetchParcalar,
  clearExpandedNodes,
  clearSearchResults,
  setViewMode,
  updateStok,
  updateParcaEklendi,
  updateGrupGuncellendi,
} from '../../store/slices/makindexSlice';

const MakindexPageMobile = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const {
    siniflar,
    expandedNodes,
    selectedNode,
    searchQuery,
    searchResults,
    viewMode,
    loading,
    error,
  } = useSelector((state) => state.makindex);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showTree, setShowTree] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedParcaKodu, setSelectedParcaKodu] = useState(null);
  const socketRef = useRef(null);

  // Initial data load
  useEffect(() => {
    dispatch(fetchSiniflar());
  }, [dispatch]);

  // Socket.IO connection setup for mobile
  useEffect(() => {
    // Initialize socket connection
    const initializeSocket = async () => {
      try {
        socketRef.current = await socketClient.initialize();

        socketRef.current.on('connect', () => {
      console.log('Mobile Socket.IO connected');
      // Join makindex room
      socketRef.current.emit('makindex-join');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Mobile Socket.IO disconnected');
    });

    // Listen for real-time updates
    socketRef.current.on('makindex-stok-guncellemesi', (data) => {
      console.log('Mobile stok güncellemesi:', data);
      // Update Redux state with new stock information
      dispatch(updateStok({
        parcaKodu: data.parcaKodu,
        yeniStok: data.yeniStok,
        oncekiStok: data.oncekiStok
      }));
    });

    socketRef.current.on('makindex-parca-eklendi', (data) => {
      console.log('Mobile yeni parça eklendi:', data);
      // Update Redux state with new parca
      dispatch(updateParcaEklendi({
        bomId: data.bomId,
        parcaKodu: data.parcaKodu,
        parcaAdi: data.parcaAdi
      }));
    });

    socketRef.current.on('makindex-bom-guncellemesi', (data) => {
      console.log('Mobile BOM güncellemesi:', data);
      // Update Redux state with BOM changes
      dispatch(updateGrupGuncellendi({
        bomId: data.bomId,
        makinaId: data.makinaId,
        degisiklik: data.degisiklik
      }));
    });

    socketRef.current.on('makindex-sinif-guncellemesi', (data) => {
      console.log('Mobile makina sınıfı güncellemesi:', data);
      // Refresh siniflar if affected
      dispatch(fetchSiniflar());
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('makindex-leave');
        socketRef.current.disconnect();
      }
    };
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('makindex-leave');
        socketRef.current.disconnect();
      }
    };
  }, [dispatch]);

  // Handle view mode toggle - memoized
  const handleViewModeToggle = useCallback(() => {
    const newMode = viewMode === 'tree' ? 'search' : 'tree';
    dispatch(setViewMode(newMode));
    setShowTree(newMode === 'tree');

    if (newMode === 'tree') {
      dispatch(clearSearchResults());
    } else {
      dispatch(clearExpandedNodes());
    }
  }, [viewMode, dispatch]);

  // Handle refresh - memoized
  const handleRefresh = useCallback(() => {
    dispatch(fetchSiniflar());
    dispatch(clearExpandedNodes());
    dispatch(clearSearchResults());
  }, [dispatch]);

  // Handle node selection - memoized
  const handleNodeSelect = useCallback((nodeType, nodeId, nodeData) => {
    switch (nodeType) {
      case 'sinif':
        dispatch(fetchMakinalar(nodeId));
        break;
      case 'makina':
        dispatch(fetchGruplarByMakinaId(nodeId));
        break;
      case 'bom':
        dispatch(fetchParcalar(nodeId));
        break;
      case 'parca':
        // Navigate to parca detayi
        navigate(`/mobile/parcalar/${nodeData.parcaKodu}`);
        break;
      default:
        break;
    }
  }, [dispatch, navigate]);

  // Handle drawer navigation - memoized
  const handleDrawerOpen = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Handle navigation - memoized
  const handleNavigation = useCallback((path) => {
    navigate(path);
    handleDrawerClose();
  }, [navigate, handleDrawerClose]);

  // Handle filter modal - memoized
  const handleFilterOpen = useCallback(() => {
    setFilterModalOpen(true);
  }, []);

  const handleFilterClose = useCallback(() => {
    setFilterModalOpen(false);
  }, []);

  // Action sheet handlers - memoized
  const handleActionSheetOpen = useCallback(() => {
    setActionSheetOpen(true);
  }, []);

  const handleActionSheetClose = useCallback(() => {
    setActionSheetOpen(false);
  }, []);

  const handleNodeAction = useCallback((action) => {
    if (selectedNode) {
      switch (action) {
        case 'details':
          // Show node details
          break;
        case 'edit':
          // Edit node (if permissions allow)
          break;
        case 'refresh':
          // Refresh current node data
          handleRefresh();
          break;
        default:
          break;
      }
    }
    handleActionSheetClose();
  }, [selectedNode, handleRefresh, handleActionSheetClose]);

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && drawerOpen) {
      // Left swipe closes drawer
      handleDrawerClose();
    }

    if (isRightSwipe && !drawerOpen) {
      // Right swipe opens drawer
      handleDrawerOpen();
    }
  }, [touchStart, touchEnd, drawerOpen, handleDrawerOpen, handleDrawerClose]);

  // Mobile menu items - memoized for performance
  const menuItems = useMemo(() => [
    { text: 'Ana Sayfa', path: '/mobile' },
    { text: 'İş Emirleri', path: '/mobile/is-emirleri' },
    { text: 'Parçalar', path: '/mobile/parcalar' },
    { text: 'Makinalar', path: '/mobile/makinalar' },
    { text: 'Stok Kartları', path: '/mobile/stok-kartlari' },
    { text: 'Üretim Planı', path: '/mobile/uretim-plani' },
    { text: 'Sevkiyat', path: '/mobile/sevkiyat' },
    { text: 'Raporlar', path: '/mobile/raporlar' },
  ], []);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Mobile App Bar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleDrawerOpen}
            sx={{ mr: 2 }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MAKINDEX
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleRefresh}
            disabled={loading.siniflar}
            sx={{ mr: 1 }}
          >
            <Refresh />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleViewModeToggle}
          >
            {viewMode === 'search' ? <FilterList /> : <Search />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" component="div">
            ÜRTM Takip
          </Typography>
          <Typography variant="caption" component="div">
            Mobil Sistem
          </Typography>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
            >
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          mt: '64px', // AppBar height
          overflow: 'hidden'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Error Display */}
        {(error.siniflar || error.search || error.seed) && (
          <Paper sx={{
            m: 2,
            p: 2,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            borderRadius: 2
          }}>
            <Typography variant="body2">
              Hata: {error.siniflar || error.search || error.seed || 'Bir hata oluştu'}
            </Typography>
          </Paper>
        )}

        {/* Search Component (shown when in search mode) */}
        {!showTree && (
          <Box sx={{ p: 2, pb: 1 }}>
            <MakindexSearch mobile={true} />
          </Box>
        )}

        {/* Tree/Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 2 }}>
          {showTree ? (
            loading.siniflar ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200
              }}>
                <Typography>Yükleniyor...</Typography>
              </Box>
            ) : siniflar.length > 0 ? (
              <MakindexTreeView
                siniflar={siniflar}
                expandedNodes={expandedNodes}
                selectedNode={selectedNode}
                onNodeSelect={handleNodeSelect}
                mobile={true}
              />
            ) : (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200
              }}>
                <Typography variant="body1" color="text.secondary" align="center">
                  Makine sınıfı bulunamadı
                </Typography>
              </Box>
            )
          ) : (
            searchResults.length > 0 ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Arama Sonuçları ({searchResults.length})
                </Typography>
                {/* Mobile search results display */}
                {searchResults.map((result, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleNodeSelect(result.type, result.id, result)}
                  >
                    <Typography variant="body1" fontWeight="bold">
                      {result.name || result.ad || result.parcaAdi}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {result.type} • {result.path}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200
              }}>
                <Typography variant="body1" color="text.secondary" align="center">
                  Arama sonucu bulunamadı
                </Typography>
              </Box>
            )
          )}
        </Box>
      </Box>

      {/* Filter Modal */}
      <Modal
        open={filterModalOpen}
        onClose={handleFilterClose}
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Filtreler
            </Typography>
            <IconButton onClick={handleFilterClose}>
              <Close />
            </IconButton>
          </Box>

          {/* Filter content can be added here */}
          <Typography variant="body2" color="text.secondary">
            Filtre seçenekleri yakında eklenecek...
          </Typography>
        </Box>
      </Modal>

      {/* Bottom Action Sheet */}
      <Modal
        open={actionSheetOpen}
        onClose={handleActionSheetClose}
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
        closeAfterTransition
      >
        <Slide direction="up" in={actionSheetOpen} mountOnEnter unmountOnExit>
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            borderRadius: '16px 16px 0 0',
            boxShadow: 24,
            p: 2,
            maxHeight: '50vh',
            overflow: 'auto'
          }}>
            <Box sx={{
              width: 40,
              height: 4,
              bgcolor: 'grey.300',
              borderRadius: 2,
              mx: 'auto',
              mb: 2
            }} />

            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              İşlemler
            </Typography>

            {selectedNode ? (
              <List>
                <ListItem button onClick={() => handleNodeAction('details')}>
                  <ListItemText primary="Detayları Göster" />
                </ListItem>
                <ListItem button onClick={() => handleNodeAction('refresh')}>
                  <ListItemText primary="Yenile" />
                </ListItem>
                <Divider />
                <ListItem button onClick={handleActionSheetClose}>
                  <ListItemText primary="İptal" />
                </ListItem>
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  İşlem yapmak için bir düğüm seçin
                </Typography>
              </Box>
            )}
          </Box>
        </Slide>
      </Modal>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 80, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {selectedNode && (
          <Fab
            size="small"
            color="secondary"
            onClick={handleActionSheetOpen}
            sx={{ transform: 'scale(0.8)' }}
          >
            <MoreVert />
          </Fab>
        )}
        {!showTree && (
          <Fab
            size="medium"
            color="secondary"
            onClick={handleViewModeToggle}
            sx={{ transform: 'scale(0.8)' }}
          >
            <ExpandLess />
          </Fab>
        )}
        <Fab
          size="medium"
          color="primary"
          onClick={handleRefresh}
          disabled={loading.siniflar}
          sx={{ transform: 'scale(0.9)' }}
        >
          <Refresh />
        </Fab>
      </Box>
    </Box>
  );
});

MakindexPageMobile.displayName = 'MakindexPageMobile';

export default MakindexPageMobile;