import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
import ImageWithFallback from '../ImageWithFallback';
import { getFotoPath } from '../../utils/imageUtils';

const MobilParcaSecici = ({ open, onClose, onSelect, aramaMetni = '', currentParca = null }) => {
  const [parcalar, setParcalar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParca, setSelectedParca] = useState(null);
  const [searchTerm, setSearchTerm] = useState(aramaMetni);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (open) {
      setSearchTerm(aramaMetni);
      loadParcalar(1, true);
    } else {
      resetState();
    }
  }, [open, aramaMetni]);

  useEffect(() => {
    if (!open) return;
    
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim() !== aramaMetni) {
        loadParcalar(1, true);
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm, open]);

  const resetState = () => {
    setParcalar([]);
    setSelectedParca(null);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalCount(0);
  };

  const loadParcalar = async (page = 1, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (searchTerm.trim()) {
        params.append('aramaMetni', searchTerm.trim());
      }

      const response = await axios.get(`/api/parcalar?${params}`);
      
      let newParcalar = [];
      if (Array.isArray(response.data.parcalar)) {
        newParcalar = response.data.parcalar;
      } else if (Array.isArray(response.data)) {
        newParcalar = response.data;
      }

      if (reset) {
        setParcalar(newParcalar);
      } else {
        setParcalar(prev => [...prev, ...newParcalar]);
      }

      setCurrentPage(page);
      setTotalPages(response.data.sayfaSayisi || Math.ceil((response.data.toplam || newParcalar.length) / 20));
      setTotalCount(response.data.toplam || newParcalar.length);

    } catch (error) {
      console.error('Parçalar yüklenirken hata:', error);
      if (reset) {
        setParcalar([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      loadParcalar(currentPage + 1, false);
    }
  };

  const handleSelect = () => {
    if (selectedParca && onSelect) {
      onSelect(selectedParca);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          margin: 0,
          maxHeight: '100vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        Parça Seçimi
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {/* Arama Kutusu */}
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Parça kodu veya adı ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Sonuç Sayısı */}
        {totalCount > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Toplam {totalCount} parça bulundu
          </Typography>
        )}

        {/* Yükleme Durumu */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Parça Listesi */}
            {parcalar.map((parca) => (
              <Card 
                key={parca.parcaKodu}
                sx={{ 
                  mb: 2,
                  border: selectedParca?.parcaKodu === parca.parcaKodu ? '2px solid' : '1px solid',
                  borderColor: selectedParca?.parcaKodu === parca.parcaKodu ? 'primary.main' : 'divider',
                  bgcolor: selectedParca?.parcaKodu === parca.parcaKodu ? 'primary.50' : 'background.paper'
                }}
                onClick={() => setSelectedParca(parca)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Parça Resmi */}
                    <Box 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        bgcolor: 'grey.100', 
                        borderRadius: 1,
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {parca.foto_path ? (
                        <ImageWithFallback
                          src={getFotoPath(parca.foto_path)}
                          alt={parca.parcaKodu}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain',
                            background: '#f5f5f5'
                          }}
                        />
                      ) : (
                        <ImageIcon sx={{ fontSize: 32, color: 'grey.400' }} />
                      )}
                    </Box>

                    {/* Parça Bilgileri */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>
                        {parca.parcaKodu}
                      </Typography>
                      
                      {parca.parcaAdi && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {parca.parcaAdi}
                        </Typography>
                      )}

                      {/* Stok Bilgisi */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <InventoryIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Stok: {parca.stokAdeti || 0} adet
                        </Typography>
                        
                        {parca.stokAdeti <= parca.kritik_stok && parca.kritik_stok > 0 && (
                          <Chip
                            icon={<WarningIcon />}
                            label="Kritik"
                            color="error"
                            size="small"
                            sx={{ fontSize: '0.75rem', height: 20 }}
                          />
                        )}
                      </Box>

                      {/* Durum Çipleri */}
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {parca.imalMi && (
                          <Chip
                            label="İmal"
                            color="primary"
                            size="small"
                            sx={{ fontSize: '0.75rem', height: 20 }}
                          />
                        )}
                        
                        {parca.siyah && (
                          <Chip
                            label="Siyah"
                            color="default"
                            size="small"
                            sx={{ fontSize: '0.75rem', height: 20 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}

            {/* Parça Bulunamadı */}
            {parcalar.length === 0 && !loading && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {searchTerm.trim() ? 'Arama kriterlerinize uygun parça bulunamadı.' : 'Henüz parça bulunmuyor.'}
                </Typography>
              </Alert>
            )}

            {/* Daha Fazla Yükle */}
            {currentPage < totalPages && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  fullWidth
                >
                  {isLoadingMore ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Yükleniyor...
                    </>
                  ) : (
                    `Daha Fazla Yükle (${parcalar.length}/${totalCount})`
                  )}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          fullWidth
        >
          İptal
        </Button>
        <Button 
          onClick={handleSelect}
          variant="contained"
          disabled={!selectedParca}
          fullWidth
        >
          Seç
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MobilParcaSecici;
