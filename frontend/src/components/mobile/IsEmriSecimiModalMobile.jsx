import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Checkbox,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Badge,
  Slide,
  Fab,
  useTheme,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import axios from 'axios';


import apiClient from '../../utils/apiClient';const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mobile-tabpanel-${index}`}
      aria-labelledby={`mobile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

const IsEmriKartiMobile = ({ isEmri, isSelected, onToggleSelect, onImageClick, isFromSiparis = false }) => {
  const theme = useTheme();
  
  const handleCardClick = () => {
    onToggleSelect(isEmri);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (isEmri.parca?.foto_path || isEmri.parca?.teknik_resim_path) {
      onImageClick(isEmri.parca.foto_path || isEmri.parca.teknik_resim_path, 'Parça Görseli');
    }
  };

  const getDurumColor = (durum) => {
    switch (durum?.toLowerCase()) {
      case 'tamamlandi':
      case 'tamamlandı':
        return 'success';
      case 'devam ediyor':
      case 'başlandı':
        return 'primary';
      case 'beklemede':
        return 'warning';
      case 'iptal':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        mb: 1,
        border: 2,
        borderColor: isSelected ? 'primary.main' : 'divider',
        bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: isSelected ? 'primary.dark' : 'primary.light',
          transform: 'translateY(-1px)',
          boxShadow: theme.shadows[2]
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(isEmri);
            }}
            color="primary"
            sx={{ p: 0, alignSelf: 'flex-start' }}
          />

          {/* İçerik */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {isEmri.is_emri_no}
              </Typography>
              
              {isFromSiparis && (
                <Chip label="Sipariş" size="small" color="info" />
              )}
            </Box>

            {/* İş Adı */}
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {isEmri.is_adi || 'İş adı belirtilmemiş'}
            </Typography>

            {/* Parça Bilgisi */}
            {isEmri.parca && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {(isEmri.parca.foto_path || isEmri.parca.teknik_resim_path) && (
                  <IconButton
                    size="small"
                    onClick={handleImageClick}
                    sx={{ p: 0.5 }}
                  >
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.300' }}>
                      <ImageIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </IconButton>
                )}
                <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                  <Typography component="span" sx={{ fontWeight: 500 }}>
                    Parça:
                  </Typography>{' '}
                  {isEmri.parca.parca_kodu}
                  {isEmri.parca.parca_adi && ` - ${isEmri.parca.parca_adi}`}
                </Typography>
              </Box>
            )}

            {/* Sipariş Bilgisi */}
            {isFromSiparis && isEmri.siparis && (
              <Typography variant="body2" sx={{ mb: 1, color: 'info.main' }}>
                <Typography component="span" sx={{ fontWeight: 500 }}>
                  Sipariş:
                </Typography>{' '}
                {isEmri.siparis.siparis_no}
                {isEmri.siparis.musteri_adi && ` - ${isEmri.siparis.musteri_adi}`}
              </Typography>
            )}

            {/* Detay Bilgileri */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              <Chip
                label={`${isEmri.adet || 0} adet`}
                size="small"
                variant="outlined"
                color="primary"
              />
              
              <Chip
                label={isEmri.durum || 'Beklemede'}
                size="small"
                color={getDurumColor(isEmri.durum)}
              />
              
              {isEmri.teslim_tarihi && (
                <Chip
                  label={new Date(isEmri.teslim_tarihi).toLocaleDateString('tr-TR')}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              )}
              
              {isEmri.setup_sayisi > 0 && (
                <Chip
                  label={`Setup: ${isEmri.setup_sayisi}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const IsEmriSecimiModalMobile = ({ 
  open, 
  onClose, 
  onSelect, 
  multiSelect = true, 
  title = "İş Emri Seç" 
}) => {
  const theme = useTheme();
  
  // State tanımlamaları
  const [selectedTab, setSelectedTab] = useState(0);
  const [isEmirleri, setIsEmirleri] = useState({
    'beklemede': [],
    'freze': [],
    'torna': [],
    '5 metre': [],
    '6 metre': [],
    'tezgahta': [],
    'tamamlandı': [],
    'siparisler': []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIsEmirleri, setSelectedIsEmirleri] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIsEmirleri, setFilteredIsEmirleri] = useState({});
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Sekmeler konfigürasyonu
  const tabConfig = [
    { key: 'beklemede', label: 'Beklemede', color: '#2196f3' },
    { key: 'freze', label: 'Freze', color: '#4caf50' },
    { key: 'torna', label: 'Torna', color: '#ff9800' },
    { key: '5 metre', label: '5M', color: '#3f51b5' },
    { key: '6 metre', label: '6M', color: '#009688' },
    { key: 'tezgahta', label: 'Tezgahta', color: '#9c27b0' },
    { key: 'tamamlandı', label: 'Tamamlandı', color: '#388e3c' },
    { key: 'siparisler', label: 'Siparişler', color: '#e91e63' }
  ];

  // API'den veri çekme
  const fetchAtanabilirIsEmirleri = useCallback(async () => {
    if (!open) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // İş emirlerini çek
      const response = await axios.get('/api/is-emirleri/atanabilir-modal?excludeAssigned=true');
      
      // Siparişleri çek
      const siparisResponse = await axios.get('/api/siparisler/aktif-is-emirleri');
      
      // Veriyi birleştir
      const combinedData = {
        ...response.data,
        siparisler: siparisResponse.data || []
      };
      
      setIsEmirleri(combinedData);
      
    } catch (err) {
      console.error('İş emirleri çekilirken hata:', err);
      setError('İş emirleri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [open]);

  // Modal açıldığında veri çek
  useEffect(() => {
    if (open) {
      fetchAtanabilirIsEmirleri();
    }
  }, [open, fetchAtanabilirIsEmirleri]);

  // Modal kapandığında state'leri temizle
  useEffect(() => {
    if (!open) {
      setSelectedIsEmirleri([]);
      setSelectedTab(0);
      setError(null);
      setSearchTerm('');
    }
  }, [open]);

  // Arama işlevi
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredIsEmirleri(isEmirleri);
    } else {
      const filtered = {};
      const searchLower = searchTerm.toLowerCase().trim();
      
      Object.keys(isEmirleri).forEach(kategori => {
        filtered[kategori] = isEmirleri[kategori].filter(isEmri => {
          const parcaKodu = isEmri.parca_kodu || '';
          const isEmriNo = isEmri.is_emri_no || '';
          const isAdi = isEmri.is_adi || '';
          const parcaAdi = isEmri.parca?.parca_adi || '';
          
          return (
            parcaKodu.toLowerCase().includes(searchLower) ||
            isEmriNo.toLowerCase().includes(searchLower) ||
            isAdi.toLowerCase().includes(searchLower) ||
            parcaAdi.toLowerCase().includes(searchLower)
          );
        });
      });
      
      setFilteredIsEmirleri(filtered);
    }
  }, [searchTerm, isEmirleri]);

  // Sekme değiştirme
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // İş emri seçimini toggle et
  const handleIsEmriToggleSelect = (isEmri) => {
    const emriId = isEmri.id || isEmri.is_emri_id;
    const isCurrentlySelected = selectedIsEmirleri.some(ie => (ie.id || ie.is_emri_id) === emriId);
    
    if (multiSelect) {
      if (isCurrentlySelected) {
        setSelectedIsEmirleri(selectedIsEmirleri.filter(ie => (ie.id || ie.is_emri_id) !== emriId));
      } else {
        setSelectedIsEmirleri([...selectedIsEmirleri, isEmri]);
      }
    } else {
      setSelectedIsEmirleri([isEmri]);
    }
  };

  // Seçimi onayla
  const handleConfirmSelection = () => {
    if (selectedIsEmirleri.length === 0 || !onSelect) return;
    
    if (multiSelect) {
      onSelect(selectedIsEmirleri);
    } else {
      onSelect(selectedIsEmirleri[0]);
    }
    onClose();
  };

  // Tümünü seç/kaldır
  const handleSelectAll = () => {
    if (!multiSelect) return;
    
    const currentTabData = filteredIsEmirleri[tabConfig[selectedTab].key] || [];
    const currentTabIds = currentTabData.map(ie => ie.id || ie.is_emri_id);
    
    const allSelected = currentTabIds.every(id => 
      selectedIsEmirleri.some(ie => (ie.id || ie.is_emri_id) === id)
    );
    
    if (allSelected) {
      setSelectedIsEmirleri(selectedIsEmirleri.filter(ie => 
        !currentTabIds.includes(ie.id || ie.is_emri_id)
      ));
    } else {
      const newSelections = currentTabData.filter(ie => 
        !selectedIsEmirleri.some(selected => 
          (selected.id || selected.is_emri_id) === (ie.id || ie.is_emri_id)
        )
      );
      setSelectedIsEmirleri([...selectedIsEmirleri, ...newSelections]);
    }
  };

  // Resim görüntüleme
  const handleImageClick = (imagePath, imageType) => {
    if (!imagePath) return;
    
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const imageUrl = `${baseUrl.replace('/api', '')}/${cleanPath}`;
    
    setSelectedImage({
      url: imageUrl,
      type: imageType,
      path: imagePath
    });
    setImageDialogOpen(true);
  };

  if (loading) {
    return (
      <Dialog open={open} fullScreen TransitionComponent={Transition}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              İş Emirleri Yükleniyor...
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} fullScreen TransitionComponent={Transition}>
        {/* Header */}
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            {selectedIsEmirleri.length > 0 && (
              <Badge badgeContent={selectedIsEmirleri.length} color="secondary">
                <CheckCircleIcon />
              </Badge>
            )}
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          {/* Search */}
          <Box sx={{ p: 2, pb: 0 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Parça kodu, iş emri numarası ile arayın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {tabConfig.map((tab, index) => (
                <Tab
                  key={tab.key}
                  label={`${tab.label} (${filteredIsEmirleri[tab.key]?.length || 0})`}
                  sx={{
                    minWidth: 80,
                    fontSize: '0.8rem',
                    color: tab.color,
                    '&.Mui-selected': {
                      color: tab.color,
                      fontWeight: 'bold'
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Select All Button */}
          {multiSelect && filteredIsEmirleri[tabConfig[selectedTab]?.key]?.length > 0 && (
            <Box sx={{ p: 2, pb: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleSelectAll}
                startIcon={<FilterListIcon />}
              >
                {(() => {
                  const currentTabData = filteredIsEmirleri[tabConfig[selectedTab].key] || [];
                  const currentTabIds = currentTabData.map(ie => ie.id || ie.is_emri_id);
                  const allSelected = currentTabIds.every(id => 
                    selectedIsEmirleri.some(ie => (ie.id || ie.is_emri_id) === id)
                  );
                  return allSelected ? 'Tümünü Kaldır' : 'Tümünü Seç';
                })()}
              </Button>
            </Box>
          )}

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
            {tabConfig.map((tab, index) => (
              <TabPanel key={tab.key} value={selectedTab} index={index}>
                {filteredIsEmirleri[tab.key]?.length > 0 ? (
                  <List disablePadding>
                    {filteredIsEmirleri[tab.key].map((isEmri) => {
                      const emriId = isEmri.id || isEmri.is_emri_id;
                      const isSelected = selectedIsEmirleri.some(ie => (ie.id || ie.is_emri_id) === emriId);
                      const isFromSiparis = tab.key === 'siparisler';
                      
                      return (
                        <IsEmriKartiMobile
                          key={emriId}
                          isEmri={isEmri}
                          isSelected={isSelected}
                          onToggleSelect={handleIsEmriToggleSelect}
                          onImageClick={handleImageClick}
                          isFromSiparis={isFromSiparis}
                        />
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      {searchTerm ? (
                        `"${searchTerm}" araması için sonuç bulunamadı.`
                      ) : (
                        tab.key === 'siparisler' 
                          ? 'Aktif sipariş iş emri bulunmamaktadır.'
                          : `${tab.label} durumunda atanabilir iş emri bulunmamaktadır.`
                      )}
                    </Typography>
                    {searchTerm && (
                      <Button
                        variant="text"
                        onClick={() => setSearchTerm('')}
                        sx={{ mt: 1 }}
                      >
                        Aramayı Temizle
                      </Button>
                    )}
                  </Box>
                )}
              </TabPanel>
            ))}
          </Box>
        </Box>

        {/* Floating Action Button */}
        {selectedIsEmirleri.length > 0 && (
          <Fab
            color="primary"
            onClick={handleConfirmSelection}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000
            }}
          >
            <CheckCircleIcon />
          </Fab>
        )}

        {/* Bottom Actions */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ flex: 1 }}
            >
              İptal
            </Button>
            
            <Button
              variant="contained"
              onClick={handleConfirmSelection}
              disabled={selectedIsEmirleri.length === 0}
              sx={{ flex: 2 }}
            >
              {multiSelect 
                ? `Seç (${selectedIsEmirleri.length})` 
                : 'Seç'
              }
            </Button>
          </Box>
          
          {selectedIsEmirleri.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              Seçilen: {selectedIsEmirleri.map(ie => ie.is_emri_no).join(', ')}
            </Typography>
          )}
        </Box>
      </Dialog>

      {/* Image Dialog */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => setImageDialogOpen(false)}
        fullScreen
        TransitionComponent={Transition}
      >
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => setImageDialogOpen(false)}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {selectedImage?.type || 'Resim'}
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, bgcolor: 'black' }}>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage.url}
              alt={selectedImage.type}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default IsEmriSecimiModalMobile;