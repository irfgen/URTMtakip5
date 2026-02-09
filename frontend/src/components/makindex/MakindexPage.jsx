import React, { useEffect, useState, useRef } from 'react';
import socketClient from '../../utils/socketClient';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  useTheme,
  Fab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Refresh,
  Settings,
  Search,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import MakindexTreeView from './MakindexTreeView';
import MakindexSearch from './MakindexSearch';
import MakinaSinifManager from './MakinaSinifManager';
import ParcaDetayCard from './ParcaDetayCard';
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
  deleteSinif,
  clearSinifError,
} from '../../store/slices/makindexSlice';

const MakindexPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
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

  const [treeWidth, setTreeWidth] = useState(() => {
    // Responsive initial width based on screen size
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      if (screenWidth < 600) return 350; // xs
      if (screenWidth < 900) return 450; // sm
      if (screenWidth < 1200) return 500; // md
      return 550; // lg and above
    }
    return 550; // Default for SSR
  });
  const [showTree, setShowTree] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [managerMode, setManagerMode] = useState('create');
  const [editingSinif, setEditingSinif] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, sinif: null });
  const [selectedParcaKodu, setSelectedParcaKodu] = useState(null);
  const socketRef = useRef(null);

  // Initial data load
  useEffect(() => {
    dispatch(fetchSiniflar());
  }, [dispatch]);

  // Socket.IO connection setup
  useEffect(() => {
    // Initialize socket connection
    const initializeSocket = async () => {
      try {
        socketRef.current = await socketClient.initialize();

        socketRef.current.on('connect', () => {
      console.log('Socket.IO connected');
      // Join makindex room
      socketRef.current.emit('makindex-join');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    // Listen for real-time updates
    socketRef.current.on('makindex-stok-guncellemesi', (data) => {
      console.log('Stok güncellemesi:', data);
      // Update Redux state with new stock information
      dispatch(updateStok({
        parcaKodu: data.parcaKodu,
        yeniStok: data.yeniStok,
        oncekiStok: data.oncekiStok
      }));
    });

    socketRef.current.on('makindex-parca-eklendi', (data) => {
      console.log('Yeni parça eklendi:', data);
      // Update Redux state with new parca
      dispatch(updateParcaEklendi({
        bomId: data.bomId,
        parcaKodu: data.parcaKodu,
        parcaAdi: data.parcaAdi
      }));
    });

    socketRef.current.on('makindex-bom-guncellemesi', (data) => {
      console.log('BOM güncellemesi:', data);
      // Update Redux state with BOM changes
      dispatch(updateGrupGuncellendi({
        bomId: data.bomId,
        makinaId: data.makinaId,
        degisiklik: data.degisiklik
      }));
    });

    socketRef.current.on('makindex-sinif-guncellemesi', (data) => {
      console.log('Makina sınıfı güncellemesi:', data);
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
  }, [dispatch, selectedNode]);

  // Handle view mode toggle
  const handleViewModeToggle = () => {
    const newMode = viewMode === 'tree' ? 'search' : 'tree';
    dispatch(setViewMode(newMode));

    if (newMode === 'tree') {
      dispatch(clearSearchResults());
    } else {
      dispatch(clearExpandedNodes());
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    dispatch(fetchSiniflar());
    dispatch(clearExpandedNodes());
    dispatch(clearSearchResults());
  };

  // Handle node selection
  const handleNodeSelect = (nodeType, nodeId, nodeData) => {
    switch (nodeType) {
      case 'sinif':
        dispatch(fetchMakinalar(nodeId));
        setSelectedParcaKodu(null); // Parça detayını kapat
        break;
      case 'makina':
        dispatch(fetchGruplarByMakinaId(nodeId));
        setSelectedParcaKodu(null); // Parça detayını kapat
        break;
      case 'grup':
        dispatch(fetchParcalar(nodeId));
        setSelectedParcaKodu(null); // Parça detayını kapat
        break;
      case 'parca':
        // Parça seçildiğinde detaylarını göster
        setSelectedParcaKodu(nodeId);
        break;
      default:
        break;
    }
  };

  // Handle tree width resize
  const handleTreeResize = (event) => {
    const newWidth = event.clientX;
    // Responsive minimum width based on current screen size
    let minWidth = 400;
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      if (screenWidth < 600) minWidth = 350; // xs
      else if (screenWidth < 900) minWidth = 400; // sm
      else if (screenWidth < 1200) minWidth = 450; // md
      else minWidth = 500; // lg and above
    }

    if (newWidth >= minWidth && newWidth <= 800) {
      setTreeWidth(newWidth);
    }
  };

  // Handle tree toggle
  const handleTreeToggle = () => {
    setShowTree(!showTree);
  };

  // Handle performance test
  const handlePerformanceTest = async () => {
    try {
      dispatch({ type: 'makindex/setLoading', payload: { key: 'test', value: true } });

      const response = await fetch('/api/makindex/test-data?count=1000');
      const data = await response.json();

      if (data.success) {
        console.log('Performance test data generated:', data.data.generated);
        alert(`Performans test verisi oluşturuldu:\n` +
              `- Sınıflar: ${data.data.generated.siniflar}\n` +
              `- Makinalar: ${data.data.generated.makinalar}\n` +
              `- BOM\'lar: ${data.data.generated.boms}\n` +
              `- Parçalar: ${data.data.generated.parcalar}\n` +
              `- Toplam düğüm: ${data.data.generated.totalNodes}\n\n` +
              `Sanal kaydırma 100+ düğümlerde otomatik aktif olacaktır.`);

        // Verileri Redux store'a ekle (test için)
        dispatch({ type: 'makindex/setTestData', payload: data.data.testData });

        // Sayfayı yenile
        handleRefresh();
      } else {
        alert('Performans test verisi oluşturulamadı: ' + data.message);
      }
    } catch (error) {
      console.error('Performance test error:', error);
      alert('Performans testi sırasında hata oluştu: ' + error.message);
    } finally {
      dispatch({ type: 'makindex/setLoading', payload: { key: 'test', value: false } });
    }
  };

  // Yönetim fonksiyonları
  const handleCreateSinif = () => {
    setManagerMode('create');
    setEditingSinif(null);
    setShowManager(true);
  };

  const handleEditSinif = (sinif) => {
    setManagerMode('edit');
    setEditingSinif(sinif);
    setShowManager(true);
  };

  const handleDeleteSinif = (sinif) => {
    setDeleteDialog({ open: true, sinif });
  };

  const confirmDeleteSinif = async () => {
    try {
      await dispatch(deleteSinif(deleteDialog.sinif.id)).unwrap();
      setDeleteDialog({ open: false, sinif: null });
      handleRefresh();
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const handleManagerClose = () => {
    setShowManager(false);
    setEditingSinif(null);
    dispatch(clearSinifError());
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: theme.palette.primary.main, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              MAKINDEX
            </Typography>
            <Typography variant="subtitle1" component="div">
              Üretim Makine ve Parça Hiyerarşik Yönetim Sistemi
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Yönetim Butonları */}
            <Tooltip title="Yeni Makina Sınıfı">
              <span>
                <Fab
                  size="small"
                  color="success"
                  onClick={handleCreateSinif}
                >
                  <Add />
                </Fab>
              </span>
            </Tooltip>

            <Tooltip title="Performans Testi (1000+ düğüm)">
              <span>
                <Fab
                  size="small"
                  color="warning"
                  onClick={handlePerformanceTest}
                  disabled={loading.test}
                >
                  <Settings />
                </Fab>
              </span>
            </Tooltip>
            <Tooltip title="Yenile">
              <span>
                <Fab
                  size="small"
                  color="secondary"
                  onClick={handleRefresh}
                  disabled={loading.siniflar || false}
                >
                  <Refresh />
                </Fab>
              </span>
            </Tooltip>
            <Tooltip title={showTree ? "Ağacı Gizle" : "Ağacı Göster"}>
              <Fab
                size="small"
                color="secondary"
                onClick={handleTreeToggle}
              >
                {showTree ? <ExpandLess /> : <ExpandMore />}
              </Fab>
            </Tooltip>
            <Tooltip title="Görünüm Modu">
              <Fab
                size="small"
                color={viewMode === 'search' ? 'primary' : 'default'}
                onClick={handleViewModeToggle}
              >
                {viewMode === 'search' ? <Search /> : <Settings />}
              </Fab>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Error Display */}
      {(error.siniflar || error.search || error.seed) && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: theme.palette.error.light, color: theme.palette.error.contrastText }}>
          <Typography variant="body1">
            Hata: {error.siniflar || error.search || error.seed || 'Bir hata oluştu'}
          </Typography>
        </Paper>
      )}

      {/* Search Component */}
      <MakindexSearch />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, minHeight: 0 }}>
        {/* Tree View Panel */}
        {showTree && (
          <Paper
            sx={{
              width: treeWidth,
              minWidth: { xs: 350, sm: 400, md: 450 },
              maxWidth: 800,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              resize: 'horizontal',
              overflow: 'auto',
            }}
          >
            {/* Resize Handle */}
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 4,
                cursor: 'col-resize',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
              onMouseDown={handleTreeResize}
            />

            {/* Tree Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" component="h2">
                Makine Hiyerarşisi
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {siniflar.length} sınıf • {Object.keys(expandedNodes).length} açık düğüm
              </Typography>
            </Box>

            {/* Tree Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {loading.siniflar ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <Typography>Yükleniyor...</Typography>
                </Box>
              ) : siniflar.length > 0 ? (
                <MakindexTreeView
                  siniflar={siniflar}
                  expandedNodes={expandedNodes}
                  selectedNode={selectedNode}
                  onNodeSelect={handleNodeSelect}
                  onEditSinif={handleEditSinif}
                  onDeleteSinif={handleDeleteSinif}
                  showActions={true}
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <Typography variant="body1" color="text.secondary">
                    Makine sınıfı bulunamadı
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* Detail Panel */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Detail Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" component="h2">
              Detaylar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedNode
                ? `${selectedNode.type}: ${selectedNode.name || selectedNode.ad || 'Seçili'}`
                : 'Detayları görüntülemek için bir düğüm seçin'
              }
            </Typography>
          </Box>

          {/* Detail Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {selectedParcaKodu ? (
              <ParcaDetayCard
                parcaKodu={selectedParcaKodu}
                onClose={() => setSelectedParcaKodu(null)}
              />
            ) : selectedNode ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Seçili Düğüm:</strong> {selectedNode.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {selectedNode.id}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  {selectedNode.type === 'parca'
                    ? 'Parça detayları için parçanın üzerine tıklayın.'
                    : 'Detay gösterimi için lütfen bir parça seçin.'
                  }
                </Typography>
              </Box>
            ) : (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: 2,
                p: 2
              }}>
                <Typography variant="h6" color="text.secondary" align="center">
                  Detayları Görüntüleme
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Soldaki hiyerarşiden bir parça seçin
                </Typography>
                <Typography variant="caption" color="text.secondary" align="center">
                  Parça detayları (stok durumu, fiyat, teknik resim vb.) burada görünecektir
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Status Bar */}
      <Paper sx={{ p: 1, mt: 2, backgroundColor: theme.palette.grey[100] }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            MAKINDEX v1.0 • {siniflar.length} sınıf • Görünüm: {viewMode === 'tree' ? 'Ağaç' : 'Arama'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {searchQuery && `Arama: "${searchQuery}"`}
          </Typography>
        </Box>
      </Paper>

      {/* Makina Sınıfı Yönetim Dialog */}
      <MakinaSinifManager
        open={showManager}
        onClose={handleManagerClose}
        editingSinif={editingSinif}
        mode={managerMode}
      />

      {/* Silme Onay Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, sinif: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" color="error.main">
            Makina Sınıfını Sil
          </Typography>
        </DialogTitle>
        <DialogContent>
          {deleteDialog.sinif && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Bu işlem geri alınamaz!
              </Alert>
              <Typography variant="body1" gutterBottom>
                <strong>{deleteDialog.sinif.ad}</strong> adlı makina sınıfını silmek istediğinizden emin misiniz?
              </Typography>
              {deleteDialog.sinif.makina_sayisi > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Bu sınıf <strong>{deleteDialog.sinif.makina_sayisi}</strong> adet makina içerdiği için silinemez.
                  Önce tüm makinaları başka sınıflara taşımalısınız.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, sinif: null })}
          >
            İptal
          </Button>
          <Button
            onClick={confirmDeleteSinif}
            variant="contained"
            color="error"
            disabled={deleteDialog.sinif?.makina_sayisi > 0 || loading.deleteSinif}
            startIcon={loading.deleteSinif ? <CircularProgress size={16} /> : <Delete />}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MakindexPage;