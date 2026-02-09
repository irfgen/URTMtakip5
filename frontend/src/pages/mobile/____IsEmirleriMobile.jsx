import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CardActionArea, Chip, Button, Grid, CircularProgress, TextField, Select, MenuItem, FormControl, InputLabel, Avatar, Modal, Tooltip } from '@mui/material';
import { isEmirleriAPI } from '../../services/api';
import api from '../../services/api';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ImageWithFallback from '../../components/ImageWithFallback';
import axios from 'axios';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

function IsEmirleriMobile() {
  const [isEmirleri, setIsEmirleri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [durumFilter, setDurumFilter] = useState('all');
  const [parcaGorselleri, setParcaGorselleri] = useState({});
  const [gorsellerYukleniyor, setGorsellerYukleniyor] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();
  
  // Durum renklerini ayarlama - Yeni 9 durum sistemi
  const durumRenkleri = {
    'sipariş verilecek': 'default',
    'sparişte': 'warning',
    'beklemede': 'info',
    'freze': 'success',
    'torna': 'secondary',
    '5 metre': 'primary',
    '6 metre': 'info',
    'kaynak': 'warning',
    'iptal': 'error'
  };
  
  // Durum metinlerini ayarlama - Yeni 9 durum sistemi
  const durumMetni = {
    'sipariş verilecek': 'Sipariş Verilecek',
    'sparişte': 'Siparişte',
    'beklemede': 'Beklemede',
    'freze': 'Freze',
    'torna': 'Torna',
    '5 metre': '5 Metre',
    '6 metre': '6 Metre',
    'kaynak': 'Kaynak',
    'iptal': 'İptal'
  };
  
  // Fotoğraf yolu için yardımcı fonksiyon
  const getFotoPath = (foto_path) => {
    if (!foto_path) return null;
    if (foto_path.includes('://')) return foto_path; 
    if (foto_path.startsWith('/uploads/')) return foto_path;
    if (foto_path.startsWith('/fotograflar/')) return '/uploads' + foto_path;
    if (foto_path.includes('/')) return '/uploads/fotograflar/' + foto_path.split('/').pop();
    return '/uploads/fotograflar/' + foto_path;
  };
  
  // Parçaların görsellerini yükle
  const loadParcaGorselleri = async (isEmirleriData) => {
    if (!isEmirleriData || isEmirleriData.length === 0) return;
    
    setGorsellerYukleniyor(true);
    try {
      const gorseller = {};
      
      // Parça kodlarını topla
      for (const isEmri of isEmirleriData) {
        if (isEmri.parca && isEmri.parca.parca_kodu) {
          try {
            const response = await axios.get(`/api/parcalar?aramaMetni=${isEmri.parca.parca_kodu}`);
            
            if (response.data && response.data.length > 0) {
              const parca = response.data.find(p => p.parcaKodu === isEmri.parca.parca_kodu) || response.data[0];
              
              if (parca && parca.foto_path) {
                gorseller[isEmri.id] = getFotoPath(parca.foto_path);
              }
            }
          } catch (error) {
            console.error(`${isEmri.is_emri_no || isEmri.id} için parça görseli alınamadı:`, error);
          }
        }
      }
      
      setParcaGorselleri(gorseller);
    } finally {
      setGorsellerYukleniyor(false);
    }
  };

  // İş emirleri verisini çekme
  useEffect(() => {
    async function fetchIsEmirleri() {
      try {
        // İş emirleri API çağrısında flat parameter ekleyerek düz liste al
        const response = await api.get('/is-emirleri?flat=true');
        console.log('Mobil API response:', response);
        console.log('Response data length:', response.data?.length);
        
        let data = [];
        // Verify response data format
        if (Array.isArray(response.data)) {
          data = response.data;
          console.log('Toplam iş emri sayısı:', data.length);
          
          // Durum analizi
          const durumAnalizi = {};
          data.forEach(item => {
            const durum = item.durum || 'tanımsız';
            durumAnalizi[durum] = (durumAnalizi[durum] || 0) + 1;
          });
          console.log('Durum analizi:', durumAnalizi);
          
          const beklemedeToplam = data.filter(item => 
            item.durum && item.durum.toLowerCase() === 'beklemede'
          ).length;
          console.log('Beklemede toplam:', beklemedeToplam);
          
          setIsEmirleri(data);
        } else {
          setIsEmirleri([]);
          console.warn('İş emirleri verisi boş veya uyumsuz format');
        }
        
        setLoading(false);
        
        // İş emirleri yüklendikten sonra parça görsellerini yükle
        if (data.length > 0) {
          loadParcaGorselleri(data);
        }
      } catch (err) {
        console.error('İş emirleri alınamadı:', err);
        setError('İş emirleri yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    }
    
    fetchIsEmirleri();
  }, []);
  
  // Filtreleme
const filteredIsEmirleri = isEmirleri.filter(isEmri => {
  const searchMatch = 
    isEmri.is_emri_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    isEmri.parca?.parca_kodu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    isEmri.parca?.parca_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    isEmri.tezgah?.tezgah_tanimi?.toLowerCase().includes(searchTerm.toLowerCase());

  // Durum karşılaştırmasını küçük harfe çevirerek yap
  // "beklemede" filtresi için hem "beklemede" hem "Beklemede" durumlarını dahil et
  let durumMatch;
  if (durumFilter === 'all') {
    durumMatch = true;
  } else if (durumFilter === 'beklemede') {
    durumMatch = isEmri.durum && isEmri.durum.toLowerCase() === 'beklemede';
  } else {
    durumMatch = isEmri.durum && isEmri.durum.toLowerCase() === durumFilter.toLowerCase();
  }

  return searchMatch && durumMatch;
});

// Debug filtreleme
console.log('Filtreleme sonucu:', {
  totalItems: isEmirleri.length,
  filteredItems: filteredIsEmirleri.length,
  searchTerm,
  durumFilter,
  beklemedeToplam: isEmirleri.filter(item => item.durum && item.durum.toLowerCase() === 'beklemede').length,
  beklemedeFiltreliToplam: filteredIsEmirleri.filter(item => item.durum && item.durum.toLowerCase() === 'beklemede').length
});
  
  // İş emri detayına gitme
  const handleIsEmriClick = (isEmriId) => {
    navigate(`/mobile/is-emirleri/${isEmriId}`);
  };
  
  // Tarih formatlama
  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: tr });
    } catch (e) {
      return 'Geçersiz Tarih';
    }
  };
  
  // Hata gösterme
  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  // Yükleme gösterme
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Modal kapatma fonksiyonu
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };
  
  // Görsel büyütme fonksiyonu
  const handleOpenImage = (event, imageSrc) => {
    event.stopPropagation(); // Kartın tıklanmasını engelle
    setSelectedImage(imageSrc);
    setModalOpen(true);
  };
  
  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        İş Emirleri
      </Typography>
      
      {/* Arama ve Filtreleme */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="İş emri, parça veya tezgah ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          variant="outlined"
          size="small"
          sx={{ mb: 1 }}
        />
        
        <FormControl fullWidth size="small">
          <InputLabel>Durum Filtresi</InputLabel>
          <Select
            value={durumFilter}
            onChange={(e) => setDurumFilter(e.target.value)}
            label="Durum Filtresi"
            startAdornment={<FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            <MenuItem value="all">Tümü</MenuItem>
            <MenuItem value="sipariş verilecek">Sipariş Verilecek</MenuItem>
            <MenuItem value="sparişte">Siparişte</MenuItem>
            <MenuItem value="beklemede">Beklemede</MenuItem>
            <MenuItem value="freze">Freze</MenuItem>
            <MenuItem value="torna">Torna</MenuItem>
            <MenuItem value="5 metre">5 Metre</MenuItem>
            <MenuItem value="6 metre">6 Metre</MenuItem>
            <MenuItem value="kaynak">Kaynak</MenuItem>
            <MenuItem value="iptal">İptal</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Büyük Resim Gösterme Modalı */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="resim-detay-modal"
        aria-describedby="parca-resim-buyuk-goruntuleme"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 2,
          maxWidth: '95%',
          maxHeight: '90vh',
          borderRadius: 1,
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Box sx={{ 
            width: '100%', 
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
            p: 1
          }}>
            <ImageWithFallback
              src={selectedImage}
              alt="Parça görseli"
              imgStyle={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
              fallbackText="Görsel yüklenemedi"
            />
          </Box>
          <Button 
            variant="contained" 
            onClick={handleCloseModal} 
            sx={{ mt: 2 }}
          >
            Kapat
          </Button>
        </Box>
      </Modal>
      {/* İş Emirleri Listesi */}
      <Grid container spacing={2}>
        {filteredIsEmirleri.map((isEmri, index) => (
          <Grid item xs={12} key={isEmri.id ? `isemri-${isEmri.id}` : `isemri-index-${index}`}>
            <Card>
              <CardActionArea onClick={() => handleIsEmriClick(isEmri.id)}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div">
                      {isEmri.is_emri_no || 'İş No #' + isEmri.id}
                    </Typography>
                    <Chip 
                      label={durumMetni[isEmri.durum] || 'Belirsiz'} 
                      color={durumRenkleri[isEmri.durum] || 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Parça:</strong> {isEmri.parca?.parca_kodu || 'Belirtilmemiş'} - {isEmri.parca?.parca_adi || ''}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        <strong>Tezgah:</strong> {isEmri.tezgah?.tezgah_tanimi || 'Belirlenmemiş'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        <strong>Teslim:</strong> {formatDate(isEmri.teslim_tarihi)}
                      </Typography>
                    </Box>
                    
                    {/* Parça görseli */}
                    {parcaGorselleri[isEmri.id] && (
                      <Box sx={{ ml: 1, position: 'relative' }}>
                        <Tooltip title="Büyüt">
                          <Box 
                            sx={{ 
                              position: 'relative', 
                              width: 60, 
                              height: 60,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Avatar 
                              variant="rounded"
                              sx={{ 
                                width: 60, 
                                height: 60,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7 }
                              }}
                              alt={isEmri.parca?.parca_kodu || 'Parça görseli'}
                              src={parcaGorselleri[isEmri.id]}
                              onClick={(e) => handleOpenImage(e, parcaGorselleri[isEmri.id])}
                            />
                            <ZoomInIcon 
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                backgroundColor: 'rgba(255,255,255,0.7)',
                                borderRadius: '50%',
                                padding: '2px',
                                fontSize: 16,
                                color: 'primary.main',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => handleOpenImage(e, parcaGorselleri[isEmri.id])}
                            />
                          </Box>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        
        {filteredIsEmirleri.length === 0 && (
          <Box sx={{ p: 2, width: '100%', textAlign: 'center' }}>
            <Typography color="text.secondary">
              Aranan kriterlere uygun iş emri bulunamadı.
            </Typography>
          </Box>
        )}
      </Grid>
    </Box>
  );
}

export default IsEmirleriMobile;
