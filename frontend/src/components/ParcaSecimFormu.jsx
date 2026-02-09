import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Tooltip,
  Popover,
  Fade,
  Zoom
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import ParcaDuzenleFormu from './ParcaDuzenleFormu';

const ParcaSecimFormu = ({ open, onClose, onSec, onEditParca }) => {
  const [parcalar, setParcalar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParca, setSelectedParca] = useState(null);
  const [teknikResimOpen, setTeknikResimOpen] = useState(false);
  const [teknikResimPath, setTeknikResimPath] = useState(null);
  const [toplamParca, setToplamParca] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [parcaDuzenleDialogOpen, setParcaDuzenleDialogOpen] = useState(false);
  const [duzenlenecekParca, setDuzenlenecekParca] = useState(null);

  useEffect(() => {
    if (open) {
      fetchParcalar(1, true);
    } else {
      // Reset states when dialog is closed
      setCurrentPage(1);
      setParcalar([]);
      setSearchTerm('');
    }
  }, [open]);
  // Handle search input changes with debounce
  useEffect(() => {
    if (!open) return;
    
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim()) {
        searchParcalar(searchTerm);
      } else {
        fetchParcalar(1, true);
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm, open]);

  // Infinite scroll için scroll event handler
  useEffect(() => {
    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      
      // Sayfanın sonuna yaklaşıldığında (100px kala) yeni sayfa yükle
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadMoreParcalar();
      }
    };

    const dialogContent = document.querySelector('[data-parcalar-scroll]');
    if (dialogContent && open) {
      dialogContent.addEventListener('scroll', handleScroll);
      return () => dialogContent.removeEventListener('scroll', handleScroll);
    }
  }, [open, currentPage, totalPages, isLoadingMore, isSearching]);

  const searchParcalar = async (query) => {
    setLoading(true);
    setIsSearching(true);
    
    try {
      // Arama yaparken sayfalama kullan (sayfa başına 20 parça)
      const response = await axios.get(`/api/parcalar?aramaMetni=${encodeURIComponent(query)}&page=1&limit=20&includeStokKarti=true`);
      
      let newParcalar = [];
      if (Array.isArray(response.data.parcalar)) {
        newParcalar = response.data.parcalar;
      } else if (Array.isArray(response.data)) {
        newParcalar = response.data;
      } else if (typeof response.data === 'object' && response.data !== null) {
        newParcalar = Object.values(response.data);
      }
      
      setParcalar(newParcalar);
      
      // Set pagination info
      if (response.data.toplam !== undefined) {
        setToplamParca(response.data.toplam);
        setCurrentPage(1);
        setTotalPages(response.data.sayfaSayisi || Math.ceil(response.data.toplam / 20));
      }
    } catch (e) {
      console.error("Parça araması yapılırken hata oluştu:", e);
      setParcalar([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchParcalar = async (page = 1, reset = false) => {
    if (reset) {
      setLoading(true);
      setIsSearching(false);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      // Sayfalama kullanarak parçaları yükle (sayfa başına 20 parça)
      const response = await axios.get(`/api/parcalar?page=${page}&limit=20&includeStokKarti=true`);
      
      let newParcalar = [];
      if (Array.isArray(response.data.parcalar)) {
        newParcalar = response.data.parcalar;
      } else if (Array.isArray(response.data)) {
        newParcalar = response.data;
      } else if (typeof response.data === 'object' && response.data !== null) {
        newParcalar = Object.values(response.data);
      }
      
      if (reset) {
        setParcalar(newParcalar);
      } else {
        // Mevcut parçalarla yeni parçaları birleştir
        setParcalar(prev => [...prev, ...newParcalar]);
      }
      
      // Set pagination info
      if (response.data.toplam !== undefined) {
        setToplamParca(response.data.toplam);
        setCurrentPage(page);
        setTotalPages(response.data.sayfaSayisi || Math.ceil(response.data.toplam / 20));
      }
    } catch (e) {
      console.error("Parçalar yüklenirken hata oluştu:", e);
      if (reset) {
        setParcalar([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreParcalar = () => {
    // Eğer yükleme yapılıyorsa, arama yapılıyorsa veya son sayfa ise yeni sayfa yükleme
    if (isLoadingMore || isSearching || currentPage >= totalPages) {
      return;
    }

    // Sonraki sayfayı yükle
    if (searchTerm.trim()) {
      loadMoreSearchResults();
    } else {
      fetchParcalar(currentPage + 1, false);
    }
  };

  const loadMoreSearchResults = async () => {
    if (isLoadingMore || currentPage >= totalPages) return;
    
    setIsLoadingMore(true);
    
    try {
      const response = await axios.get(`/api/parcalar?aramaMetni=${encodeURIComponent(searchTerm)}&page=${currentPage + 1}&limit=20&includeStokKarti=true`);
      
      let newParcalar = [];
      if (Array.isArray(response.data.parcalar)) {
        newParcalar = response.data.parcalar;
      }
      
      // Mevcut parçalarla yeni parçaları birleştir
      setParcalar(prev => [...prev, ...newParcalar]);
      setCurrentPage(currentPage + 1);
      
    } catch (e) {
      console.error("Daha fazla parça yüklenirken hata oluştu:", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleParcaSec = () => {
    if (selectedParca) {
      onSec(selectedParca);
      onClose();
    }
  };

  const handleTeknikResimGoster = (e, path) => {
    e.stopPropagation();
    setTeknikResimPath(path);
    setTeknikResimOpen(true);
  };

  const handleParcaDuzenle = (e, parca) => {
    e.stopPropagation();
    // Parçayı düzenleme diyalogunu açalım
    setDuzenlenecekParca(parca);
    setParcaDuzenleDialogOpen(true);
  };
  
  // Parça güncellendikten sonra çağırılacak fonksiyon
  const handleParcaGuncellendi = (guncellenenParca) => {
    // Güncellenmiş parçayı listemize entegre edelim
    setParcalar(prev => 
      prev.map(parca => 
        parca.parcaKodu === guncellenenParca.parcaKodu ? guncellenenParca : parca
      )
    );
    
    // Eğer seçili parça güncellenmiş parça ise, seçili parçayı da güncelle
    if (selectedParca && selectedParca.parcaKodu === guncellenenParca.parcaKodu) {
      setSelectedParca(guncellenenParca);
    }
    
    setParcaDuzenleDialogOpen(false);
    setDuzenlenecekParca(null);
  };
  


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Parça Seçimi
        <TextField
          variant="outlined"
          size="small"
          fullWidth
          placeholder="Parça kodu veya adı ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </DialogTitle>
      <DialogContent dividers data-parcalar-scroll style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {parcalar.map((parca) => (
                <Grid item xs={12} key={parca.parcaKodu}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: selectedParca?.parcaKodu === parca.parcaKodu ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      borderRadius: 2,
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: selectedParca?.parcaKodu === parca.parcaKodu ? '#e3f2fd' : 'background.paper',
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                    onClick={() => setSelectedParca(parca)}
                  >
                    <Box 
                      sx={{ 
                        width: 240, 
                        height: 240, 
                        mr: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        bgcolor: '#fafafa', 
                        borderRadius: 1, 
                        overflow: 'hidden',
                        position: 'relative' // Pozisyon düzeni için
                      }}
                    >
                      {parca.foto_path ? (
                        <Tooltip
                          title={
                            <img 
                              src={parca.foto_path} 
                              alt={parca.parcaKodu} 
                              style={{ 
                                maxWidth: '300px', 
                                maxHeight: '300px', 
                                objectFit: 'contain'
                              }} 
                            />
                          }
                          arrow
                          placement="right"
                          TransitionComponent={Zoom}
                          TransitionProps={{ timeout: 300 }}
                          enterDelay={300}
                          enterNextDelay={300}
                          leaveDelay={100}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                bgcolor: 'white',
                                color: 'black',
                                border: '1px solid #ccc',
                                borderRadius: 2,
                                p: 1,
                                maxWidth: 'none',
                                boxShadow: 3
                              }
                            }
                          }}
                        >
                          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <img 
                              src={parca.foto_path} 
                              alt={parca.parcaKodu} 
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain', 
                                cursor: 'zoom-in'
                              }} 
                            />
                          </div>
                        </Tooltip>
                      ) : (
                        <ImageIcon sx={{ fontSize: 48, color: '#bdbdbd' }} />
                      )}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>{parca.parcaKodu}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Stok: {parca.stokAdeti || 0} <span style={{ color: '#888' }}> (Kritik: {parca.kritik_stok || 0})</span>
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      sx={{ ml: 1 }} 
                      onClick={(e) => handleTeknikResimGoster(e, parca.teknik_resim_path)}
                      title="Teknik Resim"
                    >
                      <ImageIcon fontSize="small" />
                    </IconButton>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      sx={{ ml: 1 }}
                      onClick={(e) => handleParcaDuzenle(e, parca)}
                    >
                      Parçayı Düzenle
                    </Button>
                  </Box>
                </Grid>
              ))}
              {parcalar.length === 0 && !loading && (
                <Grid item xs={12}>
                  <Typography variant="body1" align="center" sx={{ py: 4 }}>
                    Parça bulunamadı
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            {/* Daha fazla yükleme göstergesi */}
            {isLoadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Daha fazla parça yükleniyor...
                </Typography>
              </Box>
            )}
            
            {/* Toplam parça sayısı bilgisi */}
            {parcalar.length > 0 && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Gösterilen: {parcalar.length} / {toplamParca} parça
                  {currentPage < totalPages && (
                    <span style={{ color: '#1976d2' }}> (Daha fazlası için aşağı kaydırın)</span>
                  )}
                </Typography>
                
                {isSearching && searchTerm && (
                  <Box sx={{ mt: 1 }}>
                    <Button 
                      onClick={() => {
                        setSearchTerm('');
                        fetchParcalar(1, true);
                      }}
                    >
                      Tümünü Göster
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleParcaSec} variant="contained" color="primary" disabled={!selectedParca}>
          Tamam
        </Button>
      </DialogActions>
      {teknikResimOpen && teknikResimPath && (
        <Dialog open={teknikResimOpen} onClose={() => setTeknikResimOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Teknik Resim</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <img 
                src={teknikResimPath} 
                alt="Teknik Resim" 
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTeknikResimOpen(false)}>Kapat</Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Parça düzenleme formu */}
      {parcaDuzenleDialogOpen && duzenlenecekParca && (
        <ParcaDuzenleFormu 
          open={parcaDuzenleDialogOpen}
          onClose={() => setParcaDuzenleDialogOpen(false)}
          parca={duzenlenecekParca}
          onUpdateSuccess={handleParcaGuncellendi}
        />
      )}
    </Dialog>
  );
};

export default ParcaSecimFormu;
