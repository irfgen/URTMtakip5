import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  TextField,
  AppBar,
  Toolbar,
  Chip,
  Grid,
  Fab,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function GruplarMobile() {
  const navigate = useNavigate();
  
  // State tanımlamaları
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(''); // Kullanıcının girdiği değer
  const [searchTerm, setSearchTerm] = useState(''); // API'ye gönderilecek değer
  const [refreshing, setRefreshing] = useState(false);

  // Debounce fonksiyonu
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Debounced arama fonksiyonu
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 800),
    [debounce]
  );

  // Arama input'u değiştiğinde debounced arama tetikle
  useEffect(() => {
    debouncedSearch(searchInput);
  }, [searchInput, debouncedSearch]);

  // Sayfa yüklendiğinde ve searchTerm değiştiğinde BOM'ları getir
  useEffect(() => {
    fetchBoms();
  }, [searchTerm]);

  // BOM'ları API'den getir
  const fetchBoms = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await axios.get('/api/boms', {
        params: { search: searchTerm }
      });
      
      // Clean the description field by removing Excel import text
      const cleanedBoms = response.data.map(bom => ({
        ...bom,
        description: bom.description?.replace(/\s*-\s*Excel'den aktarıldı$/, '').replace(/\s*bileşenli BOM$/, '')
      }));
      
      setBoms(cleanedBoms);
      setError(null);
    } catch (err) {
      console.error('BOM listesi yüklenirken hata:', err);
      setError('Gruplar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const handleRefresh = () => {
    fetchBoms(true);
  };

  // Arama terimi değiştirme
  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
  };

  // Grup detayına git
  const handleViewBom = (bomId) => {
    navigate(`/mobile/gruplar/${bomId}`);
  };

  // Grup düzenlemeye git
  const handleEditBom = (bomId) => {
    navigate(`/mobile/gruplar/duzenle/${bomId}`);
  };

  // Grup silme
  const handleDeleteBom = async (bomId, bomName) => {
    if (window.confirm(`"${bomName}" grubunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      try {
        await axios.delete(`/api/boms/${bomId}`);
        // Listeyi yenile
        fetchBoms();
      } catch (err) {
        console.error('BOM silinirken hata:', err);
        setError('Grup silinirken bir hata oluştu.');
      }
    }
  };

  // Yeni grup eklemeye git
  const handleAddBom = () => {
    navigate('/mobile/gruplar/ekle');
  };

  // BOM öğe sayısını hesapla
  const getItemCount = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.length;
  };

  // BOM öğe tiplerini analiz et
  const getItemTypes = (items) => {
    if (!Array.isArray(items)) return { parts: 0, boms: 0 };
    
    const parts = items.filter(item => item.type === 'PART').length;
    const boms = items.filter(item => item.type === 'BOM').length;
    
    return { parts, boms };
  };

  // Loading durumu
  if (loading && !refreshing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Üst Başlık */}
      <AppBar position="static" color="default" elevation={1} sx={{ mb: 2 }}>
        <Toolbar>
          <FolderIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gruplar (BOM)
          </Typography>
          {refreshing && <CircularProgress size={24} />}
        </Toolbar>
      </AppBar>

      {/* Arama Çubuğu */}
      <Box sx={{ px: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Grup ara..."
          value={searchInput}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 25,
            }
          }}
        />
      </Box>

      {/* Error Message */}
      {error && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* İstatistik */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {boms.length} grup bulundu
        </Typography>
      </Box>

      {/* BOM Kartları */}
      <Box sx={{ px: 2 }}>
        {boms.length === 0 && !loading ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <FolderIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Henüz grup bulunamadı
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchInput ? 'Arama kriterlerinize uygun grup bulunamadı.' : 'İlk grubunuzu oluşturmak için + butonuna tıklayın.'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {boms.map((bom) => {
              const itemCount = getItemCount(bom.items);
              const itemTypes = getItemTypes(bom.items);
              
              return (
                <Grid item xs={12} key={bom.bom_id}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      borderRadius: 2,
                      '&:hover': {
                        elevation: 4,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      {/* Grup Başlığı */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, fontSize: '1rem', wordBreak: 'break-word', lineHeight: 1.2 }}>
                          {bom.name}
                        </Typography>
                      </Box>

                      {/* Açıklama */}
                      {bom.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {bom.description}
                        </Typography>
                      )}

                      {/* Öğe Türleri */}
                      {itemCount > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {itemTypes.parts > 0 && (
                            <Chip 
                              size="small" 
                              label={`${itemTypes.parts} parça`}
                              variant="outlined"
                              color="success"
                              icon={<CategoryIcon />}
                            />
                          )}
                          {itemTypes.boms > 0 && (
                            <Chip 
                              size="small" 
                              label={`${itemTypes.boms} alt grup`}
                              variant="outlined"
                              color="info"
                              icon={<FolderIcon />}
                            />
                          )}
                        </Box>
                      )}
                      
                      {/* Removed creation date display */}
                    </CardContent>

                    {/* Aksiyon Butonları */}
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewBom(bom.bom_id)}
                          sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            mr: 1
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Floating Action Button - Yeni Grup Ekle */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleAddBom}
        sx={{
          position: 'fixed',
          bottom: 80, // Bottom navigation için margin
          right: 20,
          zIndex: 1000
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

export default GruplarMobile;
