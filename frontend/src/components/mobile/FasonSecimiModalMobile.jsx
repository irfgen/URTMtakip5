import React, { useState, useEffect } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Slide,
  Fab,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Image as ImageIcon,
  FilterList as FilterListIcon
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
      id={`fason-tabpanel-${index}`}
      aria-labelledby={`fason-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

const FasonKartiMobile = ({ fason, isSelected, onToggleSelect, onImageClick }) => {
  const theme = useTheme();

  const handleCardClick = () => {
    onToggleSelect(fason);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (fason.parca?.foto_path || fason.parca?.teknik_resim_path) {
      onImageClick(fason.parca.foto_path || fason.parca.teknik_resim_path, 'Parça Görseli');
    }
  };

  const getDurumColor = (durum) => {
    switch (durum?.toLowerCase()) {
      case 'beklemede':
        return 'warning';
      case 'uretimde':
        return 'primary';
      case 'tamamlandi':
      case 'tamamlandı':
        return 'success';
      case 'iptal':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTarih = (tarih) => {
    if (!tarih) return 'Belirtilmemiş';
    return new Date(tarih).toLocaleDateString('tr-TR');
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
              onToggleSelect(fason);
            }}
            color="primary"
            sx={{ p: 0, alignSelf: 'flex-start' }}
          />

          {/* İçerik */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {fason.parca?.parcaKodu || 'N/A'}
              </Typography>
              
              <Chip
                label={fason.durum || 'Beklemede'}
                size="small"
                color={getDurumColor(fason.durum)}
              />
            </Box>

            {/* Parça Adı */}
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
              {fason.parca?.parcaAdi || 'Parça adı belirtilmemiş'}
            </Typography>

            {/* Resim */}
            {(fason.parca?.foto_path || fason.parca?.teknik_resim_path) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <IconButton
                  size="small"
                  onClick={handleImageClick}
                  sx={{ p: 0.5 }}
                >
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.300' }}>
                    <ImageIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  Resim mevcut
                </Typography>
              </Box>
            )}

            {/* Tedarikçi */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                {fason.tedarikci || 'Tedarikçi belirtilmemiş'}
              </Typography>
            </Box>

            {/* Teslim Tarihi */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">
                {formatTarih(fason.teslim_tarihi)}
              </Typography>
            </Box>

            {/* Detay Bilgileri */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              <Chip
                label={`${fason.fason_adet || 0} adet`}
                size="small"
                variant="outlined"
                color="primary"
              />
              
              {fason.fason_grup && (
                <Chip
                  label={fason.fason_grup.grup_adi}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: fason.fason_grup.renk,
                    color: fason.fason_grup.renk
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const FasonSecimiModalMobile = ({ 
  open, 
  onClose, 
  onSelect, 
  title = "Fason İş Seç",
  selectedFasonIds = []
}) => {
  const theme = useTheme();
  
  // State tanımlamaları
  const [selectedTab, setSelectedTab] = useState(0);
  const [fasonlar, setFasonlar] = useState([]);
  const [filteredFasonlar, setFilteredFasonlar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [secilenFasonlar, setSecilenFasonlar] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Durum sekmeleri konfigürasyonu
  const durumSekmeler = [
    { label: 'Tümü', value: 'all', color: '#1976d2' },
    { label: 'Beklemede', value: 'beklemede', color: '#ff9800' },
    { label: 'Üretimde', value: 'uretimde', color: '#2196f3' },
    { label: 'Tamamlandı', value: 'tamamlandi', color: '#4caf50' }
  ];

  // API'den veri çekme
  const fetchFasonlar = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/fason/is-emirleri/selectable', {
        params: {
          durum: 'beklemede,uretimde',
          limit: 100
        }
      });

      if (response.data.success) {
        setFasonlar(response.data.data);
      } else {
        setError('Fason listesi alınamadı');
      }
    } catch (err) {
      console.error('Fason listesi getirilirken hata:', err);
      setError('Fason listesi getirilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Modal açılınca fasonları getir
  useEffect(() => {
    if (open) {
      fetchFasonlar();
      setSecilenFasonlar([]);
    }
  }, [open]);

  // Modal kapandığında state'leri temizle
  useEffect(() => {
    if (!open) {
      setSecilenFasonlar([]);
      setSelectedTab(0);
      setError(null);
      setSearchTerm('');
    }
  }, [open]);

  // Arama ve filtreleme
  useEffect(() => {
    let filtered = [...fasonlar];

    // Durum filtresi
    if (selectedTab > 0) {
      const selectedDurum = durumSekmeler[selectedTab].value;
      filtered = filtered.filter(fason => fason.durum === selectedDurum);
    }

    // Arama filtresi
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(fason => 
        fason.parca?.parcaKodu?.toLowerCase().includes(searchLower) ||
        fason.parca?.parcaAdi?.toLowerCase().includes(searchLower) ||
        fason.tedarikci?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredFasonlar(filtered);
  }, [fasonlar, selectedTab, searchTerm]);

  // Sekme değiştirme
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Fason seçimini toggle et
  const handleFasonToggle = (fason) => {
    const fasonId = fason.fason_is_emri_id;
    const isSelected = secilenFasonlar.some(f => f.fason_is_emri_id === fasonId);

    if (isSelected) {
      setSecilenFasonlar(secilenFasonlar.filter(f => f.fason_is_emri_id !== fasonId));
    } else {
      setSecilenFasonlar([...secilenFasonlar, fason]);
    }
  };

  // Seçimi onayla
  const handleConfirm = () => {
    if (secilenFasonlar.length === 0 || !onSelect) return;
    
    onSelect(secilenFasonlar);
    onClose();
  };

  // Tümünü seç/kaldır
  const handleSelectAll = () => {
    const allSelected = filteredFasonlar.every(fason => 
      secilenFasonlar.some(s => s.fason_is_emri_id === fason.fason_is_emri_id)
    );
    
    if (allSelected) {
      // Mevcut sekmede gösterilen fasonları seçili listeden çıkar
      const filteredIds = filteredFasonlar.map(f => f.fason_is_emri_id);
      setSecilenFasonlar(secilenFasonlar.filter(f => !filteredIds.includes(f.fason_is_emri_id)));
    } else {
      // Mevcut sekmede gösterilen fasonları seçili listeye ekle
      const newSelections = filteredFasonlar.filter(fason => 
        !secilenFasonlar.some(s => s.fason_is_emri_id === fason.fason_is_emri_id)
      );
      setSecilenFasonlar([...secilenFasonlar, ...newSelections]);
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
              Fason İşler Yükleniyor...
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
            {secilenFasonlar.length > 0 && (
              <Badge badgeContent={secilenFasonlar.length} color="secondary">
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
              <Button size="small" onClick={fetchFasonlar} sx={{ ml: 1 }}>
                Tekrar Dene
              </Button>
            </Alert>
          )}

          {/* Search */}
          <Box sx={{ p: 2, pb: 0 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Parça kodu, parça adı veya tedarikçi ara..."
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
              {durumSekmeler.map((durum, index) => {
                let count = 0;
                if (index === 0) {
                  count = fasonlar.length;
                } else {
                  count = fasonlar.filter(f => f.durum === durum.value).length;
                }
                
                return (
                  <Tab
                    key={durum.value}
                    label={`${durum.label} (${count})`}
                    sx={{
                      minWidth: 80,
                      fontSize: '0.8rem',
                      color: durum.color,
                      '&.Mui-selected': {
                        color: durum.color,
                        fontWeight: 'bold'
                      }
                    }}
                  />
                );
              })}
            </Tabs>
          </Box>

          {/* Select All Button */}
          {filteredFasonlar.length > 0 && (
            <Box sx={{ p: 2, pb: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleSelectAll}
                startIcon={<FilterListIcon />}
              >
                {(() => {
                  const allSelected = filteredFasonlar.every(fason => 
                    secilenFasonlar.some(s => s.fason_is_emri_id === fason.fason_is_emri_id)
                  );
                  return allSelected ? 'Tümünü Kaldır' : 'Tümünü Seç';
                })()}
              </Button>
            </Box>
          )}

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
            {filteredFasonlar.length > 0 ? (
              <List disablePadding>
                {filteredFasonlar.map((fason) => {
                  const isSelected = secilenFasonlar.some(s => 
                    s.fason_is_emri_id === fason.fason_is_emri_id
                  );
                  
                  return (
                    <FasonKartiMobile
                      key={fason.fason_is_emri_id}
                      fason={fason}
                      isSelected={isSelected}
                      onToggleSelect={handleFasonToggle}
                      onImageClick={handleImageClick}
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
                    'Seçilebilir fason iş emri bulunmamaktadır.'
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
          </Box>
        </Box>

        {/* Floating Action Button */}
        {secilenFasonlar.length > 0 && (
          <Fab
            color="primary"
            onClick={handleConfirm}
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
              onClick={handleConfirm}
              disabled={secilenFasonlar.length === 0}
              sx={{ flex: 2 }}
            >
              Seç ({secilenFasonlar.length})
            </Button>
          </Box>
          
          {secilenFasonlar.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              {secilenFasonlar.length} fason seçildi
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

export default FasonSecimiModalMobile;