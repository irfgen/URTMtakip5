import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  TextField,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Group as GroupIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  ColorLens as ColorIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Work as WorkIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { HexColorPicker } from 'react-colorful';
import axios from 'axios';


import apiClient from '../utils/apiClient';function FasonGruplar() {
  const [gruplar, setGruplar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detayDialogOpen, setDetayDialogOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedGrup, setSelectedGrup] = useState(null);
  const [fasonIsEmirleri, setFasonIsEmirleri] = useState([]);
  const [selectedFasonIsEmirleri, setSelectedFasonIsEmirleri] = useState([]);

  const [formData, setFormData] = useState({
    grup_adi: '',
    aciklama: '',
    renk: '#1976d2',
    olusturan_kisi: 'Current User'
  });

  // Gruba atanmamış fason iş emirlerini getir (grup oluştururken kullanmak için)
  const fetchAllFasonIsEmirleri = async () => {
    try {
      // Tamamlanan ve iptal haricindeki tüm fason iş emirlerini getir
      const response = await axios.get('/api/fason/is-emirleri');
      
      // Frontend'te tamamlanan ve iptal edilenler hariç tüm fason iş emirlerini filtrele
      const filteredFasonIsEmirleri = response.data.filter(fasonIsEmri => 
        fasonIsEmri.durum !== 'tamamlandi' && fasonIsEmri.durum !== 'iptal'
      );
      
      setFasonIsEmirleri(filteredFasonIsEmirleri);
    } catch (error) {
      console.error('Fason iş emirleri yüklenirken hata:', error);
    }
  };

  // Fason gruplarını getir
  const fetchGruplar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      
      const response = await axios.get('/api/fason-grup-test/basit', { params });
      setGruplar(response.data);
      setError(null);
    } catch (err) {
      console.error('Fason grupları yüklenirken hata:', err);
      setError('Fason grupları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGruplar();
    fetchAllFasonIsEmirleri();
  }, [search]);

  // Form işlemleri
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        fason_is_emirleri: selectedFasonIsEmirleri.map(fasonIsEmri => fasonIsEmri.fason_is_emri_id)
      };

      if (selectedGrup) {
        // Güncelleme
        await axios.put(`/api/fason-grup/${selectedGrup.fason_grup_id}`, submitData);
      } else {
        // Yeni oluşturma
        await axios.post('/api/fason-grup-test/basit', submitData);
      }

      await fetchGruplar();
      await fetchAllFasonIsEmirleri(); // Yeniden yükle çünkü bazıları gruba atanmış olabilir
      handleDialogClose();
      setError(null);
    } catch (err) {
      console.error('Form gönderilirken hata:', err);
      setError(err.response?.data?.message || 'İşlem sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (grup) => {
    setSelectedGrup(grup);
    setFormData({
      grup_adi: grup.grup_adi,
      aciklama: grup.aciklama || '',
      renk: grup.renk || '#1976d2',
      olusturan_kisi: grup.olusturan_kisi
    });
    setSelectedFasonIsEmirleri(grup.fasonIsEmirleri || []);
    setDialogOpen(true);
  };

  const handleDelete = async (grup) => {
    if (window.confirm(`"${grup.grup_adi}" grubunu silmek istediğinizden emin misiniz?`)) {
      setLoading(true);
      try {
        await axios.delete(`/api/fason-grup/${grup.fason_grup_id}`);
        await fetchGruplar();
        setError(null);
      } catch (err) {
        console.error('Grup silinirken hata:', err);
        setError(err.response?.data?.message || 'Grup silinirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = async (grup) => {
    try {
      const response = await axios.get(`/api/fason-grup-test/basit/${grup.fason_grup_id}`);
      setSelectedGrup(response.data);
      setDetayDialogOpen(true);
    } catch (err) {
      console.error('Grup detayları yüklenirken hata:', err);
      setError('Grup detayları yüklenirken bir hata oluştu');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedGrup(null);
    setFormData({
      grup_adi: '',
      aciklama: '',
      renk: '#1976d2',
      olusturan_kisi: 'Current User'
    });
    setSelectedFasonIsEmirleri([]);
    setColorPickerOpen(false);
  };

  const handleFasonIsEmriSelect = (fasonIsEmri) => {
    const isSelected = selectedFasonIsEmirleri.some(f => f.fason_is_emri_id === fasonIsEmri.fason_is_emri_id);
    if (isSelected) {
      setSelectedFasonIsEmirleri(selectedFasonIsEmirleri.filter(f => f.fason_is_emri_id !== fasonIsEmri.fason_is_emri_id));
    } else {
      setSelectedFasonIsEmirleri([...selectedFasonIsEmirleri, fasonIsEmri]);
    }
  };

  // Filtrelenmiş gruplar
  const filteredGruplar = gruplar;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Fason Grupları
        </Typography>
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setDialogOpen(true)}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Arama kutusu */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Grup adı veya açıklama ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Hata mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Yükleme göstergesi */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Gruplar listesi */}
      <Grid container spacing={3}>
        {filteredGruplar.map((grup) => (
          <Grid item xs={12} sm={6} md={4} key={grup.fason_grup_id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: `4px solid ${grup.renk}`,
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{ 
                      bgcolor: grup.renk, 
                      mr: 2,
                      width: 40,
                      height: 40 
                    }}
                  >
                    <GroupIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {grup.grup_adi}
                    </Typography>
                    <Chip
                      size="small"
                      label={grup.aktif ? 'Aktif' : 'Pasif'}
                      color={grup.aktif ? 'success' : 'default'}
                    />
                  </Box>
                </Box>

                {grup.aciklama && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    {grup.aciklama}
                  </Typography>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" gap={1}>
                    <Badge badgeContent={grup.aktif_parca_sayisi || 0} color="primary">
                      <Chip
                        size="small"
                        icon={<InventoryIcon />}
                        label="Parçalar"
                        variant="outlined"
                      />
                    </Badge>
                    <Badge badgeContent={grup.fason_is_emri_sayisi || 0} color="secondary">
                      <Chip
                        size="small"
                        icon={<AssignmentIcon />}
                        label="İş Emirleri"
                        variant="outlined"
                      />
                    </Badge>
                  </Box>
                </Box>

                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Oluşturan: {grup.olusturan_kisi || 'Bilinmiyor'}
                </Typography>
              </CardContent>

              <CardActions>
                <Tooltip title="Detayları Görüntüle">
                  <IconButton 
                    size="small" 
                    onClick={() => handleViewDetails(grup)}
                    color="primary"
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Düzenle">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEdit(grup)}
                    color="warning"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sil">
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(grup)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Grup oluşturma/düzenleme modalı */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>
            {selectedGrup ? 'Fason Grubunu Düzenle' : 'Yeni Fason Grubu Oluştur'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Grup Adı"
                  value={formData.grup_adi}
                  onChange={(e) => setFormData({ ...formData, grup_adi: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    label="Renk"
                    value={formData.renk}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: formData.renk,
                              borderRadius: '50%',
                              border: '1px solid #ccc'
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <IconButton onClick={() => setColorPickerOpen(!colorPickerOpen)}>
                    <ColorIcon />
                  </IconButton>
                </Box>
                {colorPickerOpen && (
                  <Box sx={{ mt: 2, position: 'relative' }}>
                    <HexColorPicker
                      color={formData.renk}
                      onChange={(color) => setFormData({ ...formData, renk: color })}
                    />
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  multiline
                  rows={3}
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Fason İş Emirleri ({selectedFasonIsEmirleri.length} seçili)
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
                  <List dense>
                    {fasonIsEmirleri && fasonIsEmirleri.length > 0 ? fasonIsEmirleri.map((fasonIsEmri) => {
                      const isSelected = selectedFasonIsEmirleri.some(f => f.fason_is_emri_id === fasonIsEmri.fason_is_emri_id);
                      return (
                        <ListItem
                          key={fasonIsEmri.fason_is_emri_id}
                          button
                          onClick={() => handleFasonIsEmriSelect(fasonIsEmri)}
                          sx={{
                            backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : 'grey.300' }}>
                              <WorkIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${fasonIsEmri.parca?.parcaKodu || 'N/A'} (${fasonIsEmri.fason_adet} adet)`}
                            secondary={`${fasonIsEmri.parca?.parcaAdi || ''} - ${fasonIsEmri.durum} - ${fasonIsEmri.tedarikci || 'Tedarikci belirtilmemiş'}`}
                          />
                          {isSelected && (
                            <ListItemSecondaryAction>
                              <Chip size="small" label="Seçili" color="primary" />
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      );
                    }) : (
                      <ListItem>
                        <ListItemText 
                          primary="Fason iş emirleri yükleniyor..." 
                          secondary="Lütfen bekleyin"
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} startIcon={<CancelIcon />}>
              İptal
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={<SaveIcon />}
              disabled={loading || !formData.grup_adi.trim()}
            >
              {selectedGrup ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Grup detay modalı */}
      <Dialog 
        open={detayDialogOpen} 
        onClose={() => setDetayDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Grup Detayları: {selectedGrup?.grup_adi}
        </DialogTitle>
        <DialogContent>
          {selectedGrup && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Açıklama
                  </Typography>
                  <Typography variant="body1">
                    {selectedGrup.aciklama || 'Açıklama yok'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Durum
                  </Typography>
                  <Box>
                    <Chip
                      label={selectedGrup.aktif ? 'Aktif' : 'Pasif'}
                      color={selectedGrup.aktif ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Fason İş Emirleri ({selectedGrup.fason_is_emirleri?.length || 0})
              </Typography>
              
              <Grid container spacing={2}>
                {selectedGrup.fason_is_emirleri?.map((fasonIsEmri) => (
                  <Grid item xs={12} sm={6} md={4} key={fasonIsEmri.fason_is_emri_id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        {/* Parça Resmi */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          {fasonIsEmri.parca?.fotoPath ? (
                            <Tooltip title="Resmi büyütmek için tıklayın">
                              <Avatar
                                src={fasonIsEmri.parca.fotoPath}
                                sx={{ 
                                  width: 150, 
                                  height: 150,
                                  border: '3px solid #e0e0e0',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    transition: 'transform 0.2s'
                                  }
                                }}
                                onClick={() => window.open(fasonIsEmri.parca.fotoPath, '_blank')}
                                style={{ cursor: 'pointer' }}
                              >
                                <WorkIcon />
                              </Avatar>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Parça resmi yok">
                              <Avatar sx={{ 
                                bgcolor: 'primary.main', 
                                width: 150, 
                                height: 150,
                                border: '3px solid #e0e0e0'
                              }}>
                                <WorkIcon sx={{ fontSize: 50 }} />
                              </Avatar>
                            </Tooltip>
                          )}
                        </Box>

                        {/* Parça Bilgileri */}
                        <Typography variant="h6" component="div" sx={{ mb: 1, textAlign: 'center' }}>
                          {fasonIsEmri.parca?.parcaKodu || 'N/A'}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', minHeight: 40 }}>
                          {fasonIsEmri.parca?.parcaAdi || '-'}
                        </Typography>

                        {/* Fason İş Emri Detayları */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                            Fason Detayları:
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">Adet:</Typography>
                            <Chip label={`${fasonIsEmri.fason_adet} adet`} size="small" color="primary" />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">Durum:</Typography>
                            <Chip 
                              label={fasonIsEmri.durum || 'Belirtilmemiş'} 
                              size="small" 
                              color={
                                fasonIsEmri.durum === 'tamamlandi' ? 'success' :
                                fasonIsEmri.durum === 'uretimde' ? 'warning' : 
                                fasonIsEmri.durum === 'beklemede' ? 'default' : 'default'
                              }
                            />
                          </Box>
                          
                          {fasonIsEmri.tedarikci && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">Tedarikçi:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                {fasonIsEmri.tedarikci}
                              </Typography>
                            </Box>
                          )}
                          
                          {fasonIsEmri.teslim_adet && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">Teslim:</Typography>
                              <Typography variant="caption">
                                {fasonIsEmri.teslim_adet}/{fasonIsEmri.fason_adet}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                      
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        {fasonIsEmri.parca?.teknikResimPath && (
                          <Tooltip title="Teknik Resmi Görüntüle">
                            <IconButton
                              size="small"
                              onClick={() => window.open(fasonIsEmri.parca.teknikResimPath, '_blank')}
                              sx={{ 
                                bgcolor: 'primary.light',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.main' }
                              }}
                            >
                              <DescriptionIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Box sx={{ flexGrow: 1 }} />
                        
                        <Typography variant="caption" color="text.secondary">
                          İş Emri: {fasonIsEmri.fason_is_emri_id.slice(-8)}
                        </Typography>
                      </CardActions>
                    </Card>
                  </Grid>
                )) || (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Bu gruba atanmış fason iş emri bulunmuyor.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Grup düzenle butonunu kullanarak iş emirleri ekleyebilirsiniz.
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetayDialogOpen(false)}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default FasonGruplar;
