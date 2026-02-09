import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Save, ArrowBack, Edit, Check, BuildRounded, ErrorOutlined } from '@mui/icons-material';
import { tezgahAPI } from '../../services/api';

import { 
  fetchArizaBakimById, 
  updateArizaBakim, 
  clearError, 
  clearSuccess,
  fetchArizaBakimKayitlari
} from '../../store/slices/arizaBakimSlice';

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ArizaBakimDetay = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { currentKayit, detailLoading, loading, error, success } = useSelector(
    state => state.arizaBakim
  );
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    bitis_tarihi: '',
    durum: '',
    yapilan_islemler: '',
    maliyet: '',
    sorumlu: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  // Arıza-Bakım Bitir dialog ve form state'leri
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [finishFormData, setFinishFormData] = useState({
    yapilan_islemler: '',
    sonuc: '',
    maliyet: '',
    bitis_tarihi: new Date().toISOString().slice(0, 16)
  });
  const [finishFormErrors, setFinishFormErrors] = useState({});
  const [finishLoading, setFinishLoading] = useState(false);
  
  // Kayıt detaylarını getir
  useEffect(() => {
    dispatch(fetchArizaBakimById(id));
    
    return () => {
      dispatch(clearError());
      dispatch(clearSuccess());
    };
  }, [dispatch, id]);
  
  // Kayıt verilerini form state'ine aktar
  useEffect(() => {
    if (currentKayit) {
      setFormData({
        bitis_tarihi: currentKayit.bitis_tarihi ? new Date(currentKayit.bitis_tarihi).toISOString().slice(0, 16) : '',
        durum: currentKayit.durum || 'devam_ediyor',
        yapilan_islemler: currentKayit.yapilan_islemler || '',
        maliyet: currentKayit.maliyet || '',
        sorumlu: currentKayit.sorumlu || ''
      });
      
      // Arıza-Bakım Bitir formu için başlangıç değerlerini ayarla
      setFinishFormData({
        ...finishFormData,
        yapilan_islemler: currentKayit.yapilan_islemler || '',
        maliyet: currentKayit.maliyet || ''
      });
    }
  }, [currentKayit]);
  
  // Başarı veya hata mesajı görüntülendikten sonra temizle
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
        dispatch(clearError());
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);
  
  // Form alanı değişiklikleri
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Hata mesajını temizle
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Arıza-Bakım Bitir form değişiklikleri
  const handleFinishFormChange = (e) => {
    const { name, value } = e.target;
    setFinishFormData({
      ...finishFormData,
      [name]: value
    });
    
    // Hata mesajını temizle
    if (finishFormErrors[name]) {
      setFinishFormErrors({
        ...finishFormErrors,
        [name]: null
      });
    }
  };
  
  // Form doğrulama
  const validateForm = () => {
    const errors = {};
    
    if (formData.durum === 'tamamlandi' && !formData.bitis_tarihi) {
      errors.bitis_tarihi = 'Tamamlanan kayıt için bitiş tarihi zorunludur';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Arıza-Bakım Bitir formu doğrulama
  const validateFinishForm = () => {
    const errors = {};
    
    if (!finishFormData.yapilan_islemler) {
      errors.yapilan_islemler = 'Yapılan işlemleri belirtmeniz zorunludur';
    }
    
    if (!finishFormData.sonuc) {
      errors.sonuc = 'Sonuç bilgisini belirtmeniz zorunludur';
    }
    
    setFinishFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Formu gönder
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Maliyet alanı sayıya dönüştürülüyor
    const maliyetValue = formData.maliyet !== '' ? parseFloat(formData.maliyet) : null;
    
    dispatch(updateArizaBakim({
      id,
      kayitData: {
        ...formData,
        maliyet: maliyetValue
      }
    }))
      .then((result) => {
        if (!result.error) {
          setEditing(false);
        }
      });
  };
  
  // Arıza-Bakım Bitir butonuna tıklandığında
  const handleFinishClick = () => {
    setFinishDialogOpen(true);
  };
  
  // Arıza-Bakım Bitir formunu gönder
  const handleFinishSubmit = async () => {
    if (!validateFinishForm()) {
      return;
    }
    
    try {
      setFinishLoading(true);
      
      // Maliyet alanı sayıya dönüştürülüyor
      const maliyetValue = finishFormData.maliyet !== '' ? parseFloat(finishFormData.maliyet) : null;
      
      // Tezgah API'sine arıza/bakımı sonlandırma isteği gönder
      await tezgahAPI.endArizaBakim(
        currentKayit.tezgah_id, 
        currentKayit.id, 
        finishFormData.yapilan_islemler + "\nSonuç: " + finishFormData.sonuc, 
        maliyetValue
      );
      
      // Dialog'u kapat
      setFinishDialogOpen(false);
      
      // Başarı mesajı göster
      dispatch({ 
        type: 'arizaBakim/endSuccess', 
        payload: `${currentKayit.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'} kaydı başarıyla sonlandırıldı`
      });
      
      // Listeyi yenile ve ana sayfaya yönlendir
      dispatch(fetchArizaBakimKayitlari());
      setTimeout(() => {
        navigate('/ariza-bakim');
      }, 2000);
      
    } catch (error) {
      console.error('Arıza/Bakım sonlandırma hatası:', error);
      setFinishFormErrors({ 
        ...finishFormErrors,
        submit: error.response?.data?.error || 'Arıza/Bakım sonlandırma işlemi başarısız oldu'
      });
    } finally {
      setFinishLoading(false);
    }
  };
  
  // İptal et
  const handleCancel = () => {
    navigate('/ariza-bakim');
  };
  
  // Tarih formatlama fonksiyonu
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'd MMMM yyyy HH:mm', { locale: tr });
  };
  
  // Düzenleme moduna geç
  const handleEditMode = () => {
    setEditing(true);
  };
  
  if (detailLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Kayıt yükleniyor...
        </Typography>
      </Container>
    );
  }
  
  if (!currentKayit) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Kayıt bulunamadı veya yüklenirken bir hata oluştu.
        </Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant="contained" onClick={handleCancel}>
            Listeye Dön
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h2">
              {currentKayit.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'} Kaydı #{currentKayit.id}
            </Typography>
            
            {!editing && currentKayit.durum === 'devam_ediyor' && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Edit />} 
                  onClick={handleEditMode}
                  disabled={loading}
                >
                  Düzenle
                </Button>
                <Button 
                  variant="contained" 
                  color={currentKayit.kayit_tipi === 'ariza' ? 'error' : 'primary'}
                  startIcon={currentKayit.kayit_tipi === 'ariza' ? <ErrorOutlined /> : <BuildRounded />}
                  onClick={handleFinishClick}
                  disabled={loading}
                >
                  {currentKayit.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'} Bitir
                </Button>
              </Box>
            )}
          </Box>
          
          {/* Hata mesajı */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Başarı mesajı */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          {/* Temel Bilgiler */}
          {!editing ? (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Temel Bilgiler
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Tezgah</Typography>
                    <Typography variant="body1">
                      {currentKayit.tezgah?.tezgah_tanimi || `#${currentKayit.tezgah_id}`}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Kayıt Tipi</Typography>
                    <Typography variant="body1">
                      {currentKayit.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Başlangıç Tarihi</Typography>
                    <Typography variant="body1">
                      {formatDate(currentKayit.baslangic_tarihi)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Bitiş Tarihi</Typography>
                    <Typography variant="body1">
                      {currentKayit.bitis_tarihi ? formatDate(currentKayit.bitis_tarihi) : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Durum</Typography>
                    <Typography variant="body1">
                      {currentKayit.durum === 'devam_ediyor' ? 'Devam Ediyor' : 'Tamamlandı'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Sorumlu Kişi</Typography>
                    <Typography variant="body1">
                      {currentKayit.sorumlu || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Açıklama</Typography>
                    <Typography variant="body1">
                      {currentKayit.aciklama || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Kayıt Güncelleme
                    </Typography>
                  </Divider>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Durum</InputLabel>
                    <Select
                      name="durum"
                      value={formData.durum}
                      onChange={handleInputChange}
                      label="Durum"
                      disabled={loading}
                    >
                      <MenuItem value="devam_ediyor">Devam Ediyor</MenuItem>
                      <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bitiş Tarihi"
                    name="bitis_tarihi"
                    type="datetime-local"
                    value={formData.bitis_tarihi}
                    onChange={handleInputChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!formErrors.bitis_tarihi}
                    helperText={formErrors.bitis_tarihi}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sorumlu Kişi"
                    name="sorumlu"
                    value={formData.sorumlu}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Maliyet"
                    name="maliyet"
                    type="number"
                    value={formData.maliyet}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Yapılan İşlemler"
                    name="yapilan_islemler"
                    value={formData.yapilan_islemler}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setEditing(false)}
                      disabled={loading}
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                      disabled={loading}
                    >
                      {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}
          
          {/* Yapılan İşlemler ve Maliyet */}
          {!editing && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Yapılan İşlemler ve Maliyet
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Yapılan İşlemler</Typography>
                    <Typography variant="body1">
                      {currentKayit.yapilan_islemler || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Maliyet</Typography>
                    <Typography variant="body1">
                      {currentKayit.maliyet ? `₺${currentKayit.maliyet.toFixed(2)}` : '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
          
          {/* Geri Dön Butonu */}
          {!editing && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleCancel}
              >
                Listeye Dön
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Arıza-Bakım Bitir Dialog */}
      <Dialog
        open={finishDialogOpen}
        onClose={() => !finishLoading && setFinishDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {currentKayit?.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'} Kaydını Sonlandır
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {finishFormErrors.submit && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {finishFormErrors.submit}
                </Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bitiş Tarihi ve Saati"
                name="bitis_tarihi"
                type="datetime-local"
                value={finishFormData.bitis_tarihi}
                onChange={handleFinishFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={true} // Otomatik tarih, düzenlenemez
              />
              <Typography variant="caption" color="textSecondary">
                * Sistem tarafından otomatik olarak doldurulur.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Yapılan İşlemler *"
                name="yapilan_islemler"
                value={finishFormData.yapilan_islemler}
                onChange={handleFinishFormChange}
                multiline
                rows={4}
                error={!!finishFormErrors.yapilan_islemler}
                helperText={finishFormErrors.yapilan_islemler}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sonuç *"
                name="sonuc"
                value={finishFormData.sonuc}
                onChange={handleFinishFormChange}
                multiline
                rows={2}
                error={!!finishFormErrors.sonuc}
                helperText={finishFormErrors.sonuc}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Maliyet"
                name="maliyet"
                type="number"
                value={finishFormData.maliyet}
                onChange={handleFinishFormChange}
                InputProps={{
                  startAdornment: '₺',
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setFinishDialogOpen(false)} 
            disabled={finishLoading}
          >
            İptal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleFinishSubmit}
            disabled={finishLoading}
            startIcon={finishLoading ? <CircularProgress size={20} color="inherit" /> : <Check />}
          >
            {finishLoading ? 'Kaydediliyor...' : 'Sonlandır'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ArizaBakimDetay;