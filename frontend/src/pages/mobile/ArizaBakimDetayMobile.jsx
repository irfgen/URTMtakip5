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
  DialogActions,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  IconButton,
  Chip
} from '@mui/material';
import { 
  ArrowBack, 
  Edit, 
  Check, 
  BuildRounded, 
  ErrorOutlined, 
  Save,
  Cancel,
  MoreVert
} from '@mui/icons-material';

import { 
  fetchArizaBakimById, 
  updateArizaBakim, 
  clearError, 
  clearSuccess
} from '../../store/slices/arizaBakimSlice';

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ArizaBakimDetayMobile = () => {
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
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  
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
        dispatch(clearError());
        dispatch(clearSuccess());
      }, 3000);
      
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
  
  // Düzenleme moduna geç
  const handleEditMode = () => {
    setEditing(true);
    setSpeedDialOpen(false);
  };
  
  // Düzenlemeyi iptal et
  const handleCancelEdit = () => {
    setEditing(false);
    // Form verilerini eski haline döndür
    if (currentKayit) {
      setFormData({
        bitis_tarihi: currentKayit.bitis_tarihi ? new Date(currentKayit.bitis_tarihi).toISOString().slice(0, 16) : '',
        durum: currentKayit.durum || 'devam_ediyor',
        yapilan_islemler: currentKayit.yapilan_islemler || '',
        maliyet: currentKayit.maliyet || '',
        sorumlu: currentKayit.sorumlu || ''
      });
    }
    setFormErrors({});
  };
  
  // Form doğrulama
  const validateForm = () => {
    const errors = {};
    
    if (formData.durum === 'tamamlandi' && !formData.yapilan_islemler) {
      errors.yapilan_islemler = 'Tamamlanan işler için yapılan işlemler belirtilmelidir';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Güncelleme işlemi
  const handleUpdate = () => {
    if (!validateForm()) {
      return;
    }
    
    const updateData = {
      ...formData,
      maliyet: formData.maliyet ? parseFloat(formData.maliyet) : null
    };
    
    dispatch(updateArizaBakim({ id, kayitData: updateData }))
      .then((result) => {
        if (!result.error) {
          setEditing(false);
        }
      });
  };
  
  // Arıza/Bakım bitir
  const handleFinishClick = () => {
    setFinishDialogOpen(true);
    setSpeedDialOpen(false);
  };
  
  // Bitir formu değişiklikleri
  const handleFinishInputChange = (e) => {
    const { name, value } = e.target;
    setFinishFormData({
      ...finishFormData,
      [name]: value
    });
    
    if (finishFormErrors[name]) {
      setFinishFormErrors({
        ...finishFormErrors,
        [name]: null
      });
    }
  };
  
  // Bitir formu doğrulama
  const validateFinishForm = () => {
    const errors = {};
    
    if (!finishFormData.yapilan_islemler.trim()) {
      errors.yapilan_islemler = 'Yapılan işlemler belirtilmelidir';
    }
    
    if (!finishFormData.bitis_tarihi) {
      errors.bitis_tarihi = 'Bitiş tarihi belirtilmelidir';
    }
    
    setFinishFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Arıza/Bakım bitir işlemi
  const handleFinishSubmit = () => {
    if (!validateFinishForm()) {
      return;
    }
    
    setFinishLoading(true);
    
    const finishData = {
      durum: 'tamamlandi',
      bitis_tarihi: finishFormData.bitis_tarihi,
      yapilan_islemler: finishFormData.yapilan_islemler,
      maliyet: finishFormData.maliyet ? parseFloat(finishFormData.maliyet) : null
    };
    
    dispatch(updateArizaBakim({ id, kayitData: finishData }))
      .then((result) => {
        setFinishLoading(false);
        if (!result.error) {
          setFinishDialogOpen(false);
          setFormData({
            ...formData,
            ...finishData
          });
        }
      });
  };
  
  // Geri git
  const handleBack = () => {
    navigate('/mobile/ariza-bakim');
  };
  
  // Tarih formatlama
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy HH:mm', { locale: tr });
    } catch (e) {
      return 'Geçersiz Tarih';
    }
  };

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
  
  // Yükleme durumu
  if (detailLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Kayıt bulunamadı
  if (!currentKayit && !detailLoading) {
    return (
      <Container maxWidth="md" sx={{ p: 2 }}>
        <Alert severity="error">
          Arıza/Bakım kaydı bulunamadı
        </Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Geri Dön
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ p: 2, pb: 10 }}>
      {/* Başlık ve Geri Butonu */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
          {currentKayit.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'} Detayı
        </Typography>
        <Chip 
          label={durumMetni[currentKayit.durum] || 'Belirsiz'} 
          color={durumRenkleri[currentKayit.durum] || 'default'}
          size="small"
        />
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
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Temel Bilgiler
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Tezgah
            </Typography>
            <Typography variant="body1">
              {currentKayit.tezgah?.tezgah_tanimi || 'Tezgah Belirtilmemiş'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Kayıt Tipi
            </Typography>
            <Typography variant="body1">
              {currentKayit.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Başlangıç Tarihi
            </Typography>
            <Typography variant="body1">
              {formatDateTime(currentKayit.baslangic_tarihi)}
            </Typography>
          </Box>
          
          {currentKayit.bitis_tarihi && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Bitiş Tarihi
              </Typography>
              <Typography variant="body1">
                {formatDateTime(currentKayit.bitis_tarihi)}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Açıklama
            </Typography>
            <Typography variant="body1">
              {currentKayit.aciklama || 'Açıklama belirtilmemiş'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      {/* Düzenlenebilir Bilgiler */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            İşlem Bilgileri
          </Typography>
          
          {editing ? (
            <Box>
              <FormControl fullWidth margin="normal">
                <InputLabel>Durum</InputLabel>
                <Select
                  name="durum"
                  value={formData.durum}
                  onChange={handleInputChange}
                  label="Durum"
                  disabled={loading}
                >
                  <MenuItem value="devam_ediyor">Devam Ediyor</MenuItem>
                  <MenuItem value="bekliyor">Bekliyor</MenuItem>
                  <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                margin="normal"
                label="Sorumlu Kişi"
                name="sorumlu"
                value={formData.sorumlu}
                onChange={handleInputChange}
                disabled={loading}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Yapılan İşlemler"
                name="yapilan_islemler"
                value={formData.yapilan_islemler}
                onChange={handleInputChange}
                multiline
                rows={4}
                disabled={loading}
                error={!!formErrors.yapilan_islemler}
                helperText={formErrors.yapilan_islemler}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Maliyet"
                name="maliyet"
                type="number"
                value={formData.maliyet}
                onChange={handleInputChange}
                disabled={loading}
                InputProps={{
                  endAdornment: '₺'
                }}
              />
              
              {formData.durum === 'tamamlandi' && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Bitiş Tarihi"
                  name="bitis_tarihi"
                  type="datetime-local"
                  value={formData.bitis_tarihi}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  disabled={loading}
                />
              )}
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  onClick={handleUpdate}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancelEdit}
                  disabled={loading}
                  fullWidth
                >
                  İptal
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Sorumlu Kişi
                </Typography>
                <Typography variant="body1">
                  {currentKayit.sorumlu || 'Belirtilmemiş'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Yapılan İşlemler
                </Typography>
                <Typography variant="body1">
                  {currentKayit.yapilan_islemler || 'Henüz işlem yapılmamış'}
                </Typography>
              </Box>
              
              {currentKayit.maliyet && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Maliyet
                  </Typography>
                  <Typography variant="body1">
                    {currentKayit.maliyet} ₺
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Speed Dial - Floating Action Menu */}
      {!editing && currentKayit.durum === 'devam_ediyor' && (
        <SpeedDial
          ariaLabel="SpeedDial"
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          icon={<SpeedDialIcon icon={<MoreVert />} />}
          open={speedDialOpen}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
        >
          <SpeedDialAction
            icon={<Edit />}
            tooltipTitle="Düzenle"
            onClick={handleEditMode}
          />
          <SpeedDialAction
            icon={currentKayit.kayit_tipi === 'ariza' ? <ErrorOutlined /> : <BuildRounded />}
            tooltipTitle={`${currentKayit.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'} Bitir`}
            onClick={handleFinishClick}
          />
        </SpeedDial>
      )}
      
      {/* Arıza/Bakım Bitir Dialog */}
      <Dialog 
        open={finishDialogOpen} 
        onClose={() => setFinishDialogOpen(false)}
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'background.default'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {currentKayit.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'} Bitir
            </Typography>
            <IconButton onClick={() => setFinishDialogOpen(false)} disabled={finishLoading}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Yapılan İşlemler"
            name="yapilan_islemler"
            value={finishFormData.yapilan_islemler}
            onChange={handleFinishInputChange}
            multiline
            rows={4}
            disabled={finishLoading}
            error={!!finishFormErrors.yapilan_islemler}
            helperText={finishFormErrors.yapilan_islemler}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Maliyet"
            name="maliyet"
            type="number"
            value={finishFormData.maliyet}
            onChange={handleFinishInputChange}
            disabled={finishLoading}
            InputProps={{
              endAdornment: '₺'
            }}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Bitiş Tarihi"
            name="bitis_tarihi"
            type="datetime-local"
            value={finishFormData.bitis_tarihi}
            onChange={handleFinishInputChange}
            InputLabelProps={{
              shrink: true,
            }}
            disabled={finishLoading}
            error={!!finishFormErrors.bitis_tarihi}
            helperText={finishFormErrors.bitis_tarihi}
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setFinishDialogOpen(false)}
            disabled={finishLoading}
            variant="outlined"
            fullWidth
            sx={{ mr: 1 }}
          >
            İptal
          </Button>
          <Button
            onClick={handleFinishSubmit}
            variant="contained"
            color={currentKayit.kayit_tipi === 'ariza' ? 'error' : 'primary'}
            startIcon={finishLoading ? <CircularProgress size={20} color="inherit" /> : <Check />}
            disabled={finishLoading}
            fullWidth
          >
            {finishLoading ? 'İşleniyor...' : 'Bitir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ArizaBakimDetayMobile; 