// filepath: /home/irfan/Documents/PROJELER/URTMtakip/frontend/src/pages/mobile/ArizaBakimMobile.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Card, CardContent, CardActionArea, Chip, Grid, CircularProgress, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Fab } from '@mui/material';
import { arizaBakimAPI } from '../../services/api';
import { fetchArizaBakimKayitlari } from '../../store/slices/arizaBakimSlice';
import SearchIcon from '@mui/icons-material/Search';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ArizaBakimEkleMobilModal from '../../components/mobile/ArizaBakimEkleMobilModal';

function ArizaBakimMobile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { kayitlar, loading } = useSelector(state => state.arizaBakim);
  
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Durum renklerini ayarlama
  const durumRenkleri = {
    'devam_ediyor': 'warning',
    'tamamlandi': 'success',
    'bekliyor': 'info'
  };
  
  // Durum metinlerini ayarlama
  const durumMetni = {
    'devam_ediyor': 'Devam Ediyor',
    'tamamlandi': 'Tamamlandı',
    'bekliyor': 'Bekliyor'
  };
  
  // Arıza bakım verilerini çekme
  useEffect(() => {
    dispatch(fetchArizaBakimKayitlari());
  }, [dispatch]);
  
  // Tarih formatlama
  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: tr });
    } catch (e) {
      return 'Geçersiz Tarih';
    }
  };
  
  // Filtreleme
  const filteredArizaBakimListesi = kayitlar.filter(arizaBakim => {
    const searchMatch = 
      arizaBakim.tezgah?.tezgah_tanimi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arizaBakim.aciklama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arizaBakim.kayit_tipi?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = statusFilter === 'all' || arizaBakim.durum === statusFilter;
    
    return searchMatch && statusMatch;
  });
  
  // Arıza bakım detayına gitme
  const handleArizaBakimClick = (arizaBakimId) => {
    navigate(`/mobile/ariza-bakim/${arizaBakimId}`);
  };
  
  // Yeni arıza/bakım ekleme butonuna tıklama
  const handleAddClick = () => {
    setShowAddModal(true);
  };

  // Modal kapatma
  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  // Başarılı ekleme sonrası
  const handleAddSuccess = () => {
    // Listeyi yenile
    dispatch(fetchArizaBakimKayitlari());
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
  
  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Arıza ve Bakım
      </Typography>
      
      {/* Arama ve Filtreleme */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Tezgah veya açıklama ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          variant="outlined"
          size="small"
          sx={{ mb: 1 }}
        />
        
        <FormControl fullWidth size="small">
          <InputLabel>Durum Filtresi</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Durum Filtresi"
            startAdornment={<FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            <MenuItem value="all">Tümü</MenuItem>
            <MenuItem value="devam_ediyor">Devam Ediyor</MenuItem>
            <MenuItem value="bekliyor">Bekliyor</MenuItem>
            <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Arıza Bakım Listesi */}
      <Grid container spacing={2}>
        {filteredArizaBakimListesi.map((arizaBakim) => (
          <Grid item xs={12} key={arizaBakim.id}>
            <Card>
              <CardActionArea onClick={() => handleArizaBakimClick(arizaBakim.id)}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div">
                      {arizaBakim.tezgah?.tezgah_tanimi || 'Tezgah Belirtilmemiş'}
                    </Typography>
                    <Chip 
                      label={durumMetni[arizaBakim.durum] || 'Belirsiz'} 
                      color={durumRenkleri[arizaBakim.durum] || 'default'}
                      size="small"
                      icon={<BuildCircleIcon />}
                    />
                  </Box>
                  
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {arizaBakim.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {arizaBakim.aciklama?.substring(0, 100) + (arizaBakim.aciklama?.length > 100 ? '...' : '') || 'Açıklama yok'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Başlangıç:</strong> {formatDate(arizaBakim.baslangic_tarihi)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        
        {filteredArizaBakimListesi.length === 0 && (
          <Box sx={{ p: 2, width: '100%', textAlign: 'center' }}>
            <Typography color="text.secondary">
              Aranan kriterlere uygun arıza/bakım kaydı bulunamadı.
            </Typography>
          </Box>
        )}
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleAddClick}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1000
        }}
      >
        <AddIcon />
      </Fab>

      {/* Arıza/Bakım Ekleme Modal */}
      <ArizaBakimEkleMobilModal
        open={showAddModal}
        onClose={handleCloseModal}
        onSuccess={handleAddSuccess}
      />
    </Box>
  );
}

export default ArizaBakimMobile;
