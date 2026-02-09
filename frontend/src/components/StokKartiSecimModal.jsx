import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Avatar,
  Chip,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import stokKartlariService from '../services/stokKartlariService';
import StokKartiForm from './StokKartlari/StokKartiForm';

const StokKartiSecimModal = ({ open, onClose, onSelect, selectedStokKarti = null }) => {
  const [stokKartlari, setStokKartlari] = useState([]);
  const [filteredStokKartlari, setFilteredStokKartlari] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [yeniStokKartiFormOpen, setYeniStokKartiFormOpen] = useState(false);

  // Stok kartlarını yükle
  useEffect(() => {
    if (open) {
      loadStokKartlari();
    }
  }, [open]);

  // Arama filtreleme
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStokKartlari(stokKartlari);
    } else {
      const filtered = stokKartlari.filter(stok => 
        stok.malzeme_cinsi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stok.kesit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stok.firma?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stok.lokasyon?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStokKartlari(filtered);
    }
  }, [searchQuery, stokKartlari]);

  const loadStokKartlari = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await stokKartlariService.getStokKartlari();
      const data = response.data || response;
      
      if (Array.isArray(data)) {
        setStokKartlari(data);
        setFilteredStokKartlari(data);
      } else {
        console.error('API response is not an array:', data);
        setError('Stok kartları yüklenemedi');
      }
    } catch (error) {
      console.error('Stok kartları yükleme hatası:', error);
      setError('Stok kartları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Stok durumu belirleme
  const getStokDurumu = (adet, kritikStokMiktari) => {
    if (adet === 0) {
      return { 
        label: 'Stokta Yok', 
        color: 'error', 
        icon: <ErrorIcon />,
        bgColor: '#ffebee'
      };
    } else if (adet <= kritikStokMiktari) {
      return { 
        label: 'Kritik', 
        color: 'warning', 
        icon: <WarningIcon />,
        bgColor: '#fff3e0'
      };
    } else {
      return { 
        label: 'Normal', 
        color: 'success', 
        icon: <CheckCircleIcon />,
        bgColor: '#e8f5e8'
      };
    }
  };

  // Boyut formatı
  const formatBoyut = (kesit, boy) => {
    if (boy && boy > 0) {
      return `${kesit} x ${boy}mm`;
    }
    return kesit || '';
  };

  const handleSelect = (stokKarti) => {
    onSelect(stokKarti);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleYeniStokKartiAc = () => {
    setYeniStokKartiFormOpen(true);
  };

  const handleYeniStokKartiKapat = () => {
    setYeniStokKartiFormOpen(false);
  };

  const handleYeniStokKartiBasarili = (yeniStokKarti) => {
    setYeniStokKartiFormOpen(false);
    // Stok kartlarını yeniden yükle
    loadStokKartlari();
    // Yeni eklenen stok kartını otomatik seç
    if (yeniStokKarti) {
      onSelect(yeniStokKarti);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h6">Stok Kartı Seç</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Arama Kutusu ve Yeni Ekle Butonu */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Malzeme cinsi, boyut, firma veya lokasyon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleYeniStokKartiAc}
            sx={{ 
              minWidth: 'fit-content',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Yeni Ekle
          </Button>
        </Box>

        {/* İçerik */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
            {filteredStokKartlari.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  {searchQuery ? 'Arama kriterlerine uygun stok kartı bulunamadı' : 'Henüz hiç stok kartı eklenmemiş'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchQuery 
                    ? 'Farklı arama terimleri deneyin veya yeni stok kartı ekleyin' 
                    : 'İlk stok kartınızı eklemek için aşağıdaki butona tıklayın'
                  }
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleYeniStokKartiAc}
                  size="large"
                >
                  Yeni Stok Kartı Ekle
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredStokKartlari.map((stok) => {
                  const durum = getStokDurumu(stok.adet || 0, stok.kritik_stok_miktari || 0);
                  const isSelected = selectedStokKarti?.id === stok.id;
                  
                  return (
                    <Grid item xs={12} key={stok.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: isSelected ? '2px solid' : '1px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          backgroundColor: isSelected ? 'action.selected' : 'background.paper',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 2
                          }
                        }}
                        onClick={() => handleSelect(stok)}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ mb: 0.5, fontSize: '1.1rem' }}>
                                {stok.malzeme_cinsi}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {formatBoyut(stok.kesit, stok.boy)}
                              </Typography>
                            </Box>
                            <Chip
                              label={durum.label}
                              color={durum.color}
                              size="small"
                              icon={durum.icon}
                              sx={{ ml: 1 }}
                            />
                          </Box>

                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                Mevcut Stok
                              </Typography>
                              <Typography variant="h6" color={durum.color === 'error' ? 'error.main' : 'text.primary'}>
                                {stok.adet || 0}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                Kritik Seviye
                              </Typography>
                              <Typography variant="body1">
                                {stok.kritik_stok_miktari || 0}
                              </Typography>
                            </Grid>
                            {stok.firma && (
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Firma
                                </Typography>
                                <Typography variant="body1">
                                  {stok.firma}
                                </Typography>
                              </Grid>
                            )}
                            {stok.lokasyon && (
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Lokasyon
                                </Typography>
                                <Typography variant="body1">
                                  {stok.lokasyon}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          İptal
        </Button>
        {selectedStokKarti && (
          <Button 
            onClick={() => handleSelect(selectedStokKarti)} 
            variant="contained"
          >
            Seçili Kartı Onayla
          </Button>
        )}
      </DialogActions>

      {/* Yeni Stok Kartı Formu */}
      <StokKartiForm
        open={yeniStokKartiFormOpen}
        onClose={handleYeniStokKartiKapat}
        onSuccess={handleYeniStokKartiBasarili}
        stokKarti={null}
      />
    </Dialog>
  );
};

export default StokKartiSecimModal;
