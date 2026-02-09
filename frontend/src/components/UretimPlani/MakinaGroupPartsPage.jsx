import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  TextField
} from '@mui/material';
import {
  Build as BuildIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  ListAlt as ListAltIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import MakinaGroupPartsList from './MakinaGroupPartsList';

const MakinaGroupPartsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [makinalar, setMakinalar] = useState([]);
  const [selectedMakina, setSelectedMakina] = useState('');
  const [showPartsList, setShowPartsList] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [partDetailDialog, setPartDetailDialog] = useState(false);
  const [planlananUretimAdeti, setPlanlananUretimAdeti] = useState('');
  const [hesaplamalar, setHesaplamalar] = useState(null);

  useEffect(() => {
    loadMakinalar();
  }, []);

  const loadMakinalar = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/makinalar');
      setMakinalar(response.data || []);
    } catch (err) {
      console.error('Makina listesi alınırken hata:', err);
      setError(err.response?.data?.message || 'Makina listesi alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleMakinaSelect = (event) => {
    const makinaId = event.target.value;
    setSelectedMakina(makinaId);
    if (makinaId) {
      setShowPartsList(true);
    } else {
      setShowPartsList(false);
    }
  };

  const handlePartSelect = (parca) => {
    setSelectedPart(parca);
    setPartDetailDialog(true);
  };

  const handleClosePartDetail = () => {
    setPartDetailDialog(false);
    setSelectedPart(null);
  };

  const handleHesapla = () => {
    if (!planlananUretimAdeti || planlananUretimAdeti <= 0) {
      setError('Lütfen geçerli bir planlanan üretim adeti girin.');
      return;
    }
    
    setHesaplamalar({
      planlananAdet: parseInt(planlananUretimAdeti),
      hesaplamaTarihi: new Date().toLocaleString('tr-TR')
    });
    setError(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY' 
    }).format(amount || 0);
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    // Remove duplicate /uploads/ prefix if exists
    const cleanPath = path.startsWith('/uploads/') ? path.substring(9) : path;
    return `/uploads/${cleanPath}`;
  };

  return (
    <Box p={3}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            <BuildIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Makina Grup-Parça Analizi
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Üretim planı oluşturma sürecinde, seçilen makinanın tüm gruplarını ve her gruptaki parçaları
            veritabanından detaylı bilgileriyle birlikte görüntüleyebilirsiniz.
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Makina Seçin</InputLabel>
                <Select
                  value={selectedMakina}
                  onChange={handleMakinaSelect}
                  label="Makina Seçin"
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Makina seçin...</em>
                  </MenuItem>
                  {makinalar.map((makina) => (
                    <MenuItem key={makina.makina_id} value={makina.makina_id}>
                      {makina.name} - {makina.model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              {selectedMakina && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="Planlanan Üretim Adeti"
                    type="number"
                    value={planlananUretimAdeti}
                    onChange={(e) => setPlanlananUretimAdeti(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                    inputProps={{ min: 1 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CalculateIcon />}
                    onClick={handleHesapla}
                    disabled={!planlananUretimAdeti || planlananUretimAdeti <= 0}
                  >
                    Hesapla
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography ml={2}>Makinalar yükleniyor...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography>Hata: {error}</Typography>
          <Button onClick={loadMakinalar} sx={{ mt: 1 }}>
            Tekrar Dene
          </Button>
        </Alert>
      )}

      {showPartsList && selectedMakina && (
        <MakinaGroupPartsList
          makinaId={selectedMakina}
          onPartSelect={handlePartSelect}
          hesaplamalar={hesaplamalar}
        />
      )}

      {/* Parça Detay Dialog */}
      <Dialog
        open={partDetailDialog}
        onClose={handleClosePartDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Parça Detayları: {selectedPart?.parca_kodu}
          </Typography>
          <IconButton onClick={handleClosePartDetail}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedPart && (
            <Grid container spacing={3}>
              {/* Parça Resmi */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  {selectedPart.foto_path ? (
                    <img
                      src={getImageUrl(selectedPart.foto_path)}
                      alt={selectedPart.parca_adi}
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        borderRadius: 1
                      }}
                    >
                      <Typography color="text.secondary">
                        Fotoğraf bulunmuyor
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Parça Bilgileri */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom>
                      {selectedPart.parca_adi}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Parça Kodu
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedPart.parca_kodu}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Kategori
                    </Typography>
                    <Typography variant="body1">
                      {selectedPart.kategori || '-'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Stok Adeti
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color={
                      selectedPart.stok_adeti <= selectedPart.kritik_stok ? 'error.main' : 'success.main'
                    }>
                      {selectedPart.stok_adeti}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Kritik Stok
                    </Typography>
                    <Typography variant="body1">
                      {selectedPart.kritik_stok || 0}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tedarik Bedeli
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(selectedPart.tedarik_bedeli)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Üretim Tipi
                    </Typography>
                    <Typography variant="body1">
                      {selectedPart.imal_mi ? 'İmal Edilir' : 'Satın Alınır'}
                    </Typography>
                  </Grid>

                  {selectedPart.setup_sayisi && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Setup Sayısı
                      </Typography>
                      <Typography variant="body1">
                        {selectedPart.setup_sayisi}
                      </Typography>
                    </Grid>
                  )}

                  {selectedPart.cnc_isleme_suresi && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        CNC İşleme Süresi
                      </Typography>
                      <Typography variant="body1">
                        {selectedPart.cnc_isleme_suresi} dakika
                      </Typography>
                    </Grid>
                  )}

                  {selectedPart.ham_malzeme_cinsi && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Ham Malzeme
                      </Typography>
                      <Typography variant="body1">
                        {selectedPart.ham_malzeme_cinsi}
                        {selectedPart.ham_malzeme_olculeri && ` - ${selectedPart.ham_malzeme_olculeri}`}
                      </Typography>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Grup Yolu
                    </Typography>
                    <Typography variant="body1">
                      {selectedPart.part_path}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Grup İçindeki Miktar
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedPart.quantity_in_group} adet
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              {/* Dosya Bağlantıları */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Dosyalar
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedPart.teknik_resim_path && (
                      <Grid item>
                        <Button
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          href={getImageUrl(selectedPart.teknik_resim_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Teknik Resim
                        </Button>
                      </Grid>
                    )}
                    {selectedPart.foto_path && (
                      <Grid item>
                        <Button
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          href={getImageUrl(selectedPart.foto_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Fotoğraf
                        </Button>
                      </Grid>
                    )}
                    {!selectedPart.teknik_resim_path && !selectedPart.foto_path && (
                      <Grid item>
                        <Typography variant="body2" color="text.secondary">
                          Dosya bulunmuyor
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePartDetail}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MakinaGroupPartsPage;
