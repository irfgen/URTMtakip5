import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Container,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import axios from 'axios';
import IsEmriSecimiModalMobile from '../../components/mobile/IsEmriSecimiModalMobile';

const UretimPlaniEkleMobile = () => {
  const navigate = useNavigate();
  
  // Form state
  const [planAdi, setPlanAdi] = useState('');
  const [makinaId, setMakinaId] = useState('');
  const [miktar, setMiktar] = useState('');
  const [teslimTarihi, setTeslimTarihi] = useState(null);
  const [aciklama, setAciklama] = useState('');
  const [durum, setDurum] = useState('aktif');
  
  // Data state
  const [makinaListesi, setMakinaListesi] = useState([]);
  const [selectedIsEmirleri, setSelectedIsEmirleri] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [makinaLoading, setMakinaLoading] = useState(true);
  const [isEmriModalOpen, setIsEmriModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});

  const durumOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'beklemede', label: 'Beklemede' },
    { value: 'tamamlandi', label: 'Tamamlandı' },
    { value: 'iptal', label: 'İptal' }
  ];

  const steps = [
    'Plan Bilgileri',
    'İş Emirleri',
    'Onay'
  ];

  useEffect(() => {
    loadMakinalar();
  }, []);

  const loadMakinalar = async () => {
    try {
      setMakinaLoading(true);
      const response = await axios.get('/api/tezgahlar');
      setMakinaListesi(response.data.data || response.data);
    } catch (error) {
      console.error('Makina listesi yüklenirken hata:', error);
      setError('Makina listesi yüklenemedi');
    } finally {
      setMakinaLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!planAdi.trim()) {
      errors.planAdi = 'Plan adı gereklidir';
    }
    
    if (!makinaId) {
      errors.makinaId = 'Makina seçimi gereklidir';
    }
    
    if (!miktar || miktar <= 0) {
      errors.miktar = 'Geçerli bir miktar giriniz';
    }
    
    if (selectedIsEmirleri.length === 0) {
      errors.isEmirleri = 'En az bir iş emri seçmelisiniz';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Step 1 validation
      const stepErrors = {};
      if (!planAdi.trim()) stepErrors.planAdi = 'Plan adı gereklidir';
      if (!makinaId) stepErrors.makinaId = 'Makina seçimi gereklidir';
      if (!miktar || miktar <= 0) stepErrors.miktar = 'Geçerli bir miktar giriniz';
      
      setFormErrors(stepErrors);
      if (Object.keys(stepErrors).length > 0) return;
    }
    
    if (activeStep === 1) {
      // Step 2 validation
      if (selectedIsEmirleri.length === 0) {
        setFormErrors({ isEmirleri: 'En az bir iş emri seçmelisiniz' });
        return;
      }
      setFormErrors({});
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleIsEmriEkle = (secilenIsEmirleri) => {
    const mevcutIds = selectedIsEmirleri.map(ie => ie.id || ie.is_emri_id);
    const yeniEklenecekler = secilenIsEmirleri.filter(ie => 
      !mevcutIds.includes(ie.id || ie.is_emri_id)
    );
    
    if (yeniEklenecekler.length > 0) {
      setSelectedIsEmirleri([...selectedIsEmirleri, ...yeniEklenecekler]);
    }
    
    setIsEmriModalOpen(false);
    setFormErrors(prev => ({ ...prev, isEmirleri: null }));
  };

  const handleIsEmriCikart = (isEmriId) => {
    setSelectedIsEmirleri(selectedIsEmirleri.filter(ie => 
      (ie.id || ie.is_emri_id) !== isEmriId
    ));
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const planData = {
        ozel_liste_adi: planAdi.trim(),
        makina_id: makinaId,
        miktar: parseInt(miktar),
        teslim_tarihi: teslimTarihi ? teslimTarihi.toISOString() : null,
        aciklama: aciklama.trim(),
        durum: durum,
        is_emri_ids: selectedIsEmirleri.map(ie => ie.id || ie.is_emri_id)
      };

      const response = await axios.post('/api/uretim-plani', planData);
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/mobile/uretim-plani');
      }, 2000);

    } catch (error) {
      console.error('Plan kaydedilirken hata:', error);
      setError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Plan kaydedilirken bir hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (planAdi || selectedIsEmirleri.length > 0) {
      setConfirmDialogOpen(true);
    } else {
      navigate('/mobile/uretim-plani');
    }
  };

  const confirmCancel = () => {
    setConfirmDialogOpen(false);
    navigate('/mobile/uretim-plani');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getDurumColor = (durum) => {
    switch (durum?.toLowerCase()) {
      case 'tamamlandi':
      case 'tamamlandı':
        return 'success';
      case 'aktif':
        return 'primary';
      case 'beklemede':
        return 'warning';
      case 'iptal':
        return 'error';
      default:
        return 'default';
    }
  };

  if (success) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Plan Oluşturuldu
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="sm" sx={{ flex: 1, py: 2, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Başarılı!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Üretim planı başarıyla oluşturuldu. Ana sayfaya yönlendiriliyorsunuz...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleCancel}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Yeni Plan Oluştur
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {activeStep + 1}/{steps.length}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="sm" sx={{ flex: 1, py: 2 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stepper */}
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Plan Bilgileri */}
          <Step>
            <StepLabel>Plan Bilgileri</StepLabel>
            <StepContent>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Plan Adı */}
                    <TextField
                      label="Plan Adı"
                      value={planAdi}
                      onChange={(e) => setPlanAdi(e.target.value)}
                      fullWidth
                      required
                      error={!!formErrors.planAdi}
                      helperText={formErrors.planAdi}
                      placeholder="Üretim planına bir ad verin"
                    />

                    {/* Makina Seçimi */}
                    <FormControl fullWidth required error={!!formErrors.makinaId}>
                      <InputLabel>Makina</InputLabel>
                      <Select
                        value={makinaId}
                        onChange={(e) => setMakinaId(e.target.value)}
                        label="Makina"
                        disabled={makinaLoading}
                      >
                        {makinaListesi.map((makina) => (
                          <MenuItem key={makina.id} value={makina.id}>
                            <Box>
                              <Typography variant="body1">
                                {makina.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {makina.model || 'Model belirtilmemiş'}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.makinaId && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                          {formErrors.makinaId}
                        </Typography>
                      )}
                    </FormControl>

                    {/* Miktar */}
                    <TextField
                      label="Miktar"
                      type="number"
                      value={miktar}
                      onChange={(e) => setMiktar(e.target.value)}
                      fullWidth
                      required
                      error={!!formErrors.miktar}
                      helperText={formErrors.miktar}
                      inputProps={{ min: 1 }}
                    />

                    {/* Teslim Tarihi */}
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                      <DatePicker
                        label="Teslim Tarihi"
                        value={teslimTarihi}
                        onChange={(newValue) => setTeslimTarihi(newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                        inputFormat="dd/MM/yyyy"
                      />
                    </LocalizationProvider>

                    {/* Durum */}
                    <FormControl fullWidth>
                      <InputLabel>Durum</InputLabel>
                      <Select
                        value={durum}
                        onChange={(e) => setDurum(e.target.value)}
                        label="Durum"
                      >
                        {durumOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Açıklama */}
                    <TextField
                      label="Açıklama"
                      value={aciklama}
                      onChange={(e) => setAciklama(e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Plan hakkında ek bilgiler..."
                    />
                  </Box>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={handleCancel}>
                  İptal
                </Button>
                <Button variant="contained" onClick={handleNext}>
                  Devam
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: İş Emirleri */}
          <Step>
            <StepLabel>İş Emirleri</StepLabel>
            <StepContent>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      İş Emirleri ({selectedIsEmirleri.length})
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setIsEmriModalOpen(true)}
                      size="small"
                    >
                      Ekle
                    </Button>
                  </Box>

                  {formErrors.isEmirleri && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {formErrors.isEmirleri}
                    </Alert>
                  )}

                  {selectedIsEmirleri.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        Henüz iş emri eklenmedi
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setIsEmriModalOpen(true)}
                      >
                        İş Emri Ekle
                      </Button>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {selectedIsEmirleri.map((isEmri, index) => (
                        <React.Fragment key={isEmri.id || isEmri.is_emri_id}>
                          <ListItem
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={() => handleIsEmriCikart(isEmri.id || isEmri.is_emri_id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <AssignmentIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${isEmri.is_emri_no} - ${isEmri.is_adi}`}
                              secondary={
                                <Box>
                                  <Typography variant="body2">
                                    Adet: {isEmri.adet}
                                  </Typography>
                                  {isEmri.parca && (
                                    <Typography variant="body2">
                                      Parça: {isEmri.parca.parca_kodu} - {isEmri.parca.parca_adi}
                                    </Typography>
                                  )}
                                  <Chip 
                                    label={isEmri.durum} 
                                    size="small" 
                                    color={getDurumColor(isEmri.durum)}
                                    sx={{ mt: 0.5 }}
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < selectedIsEmirleri.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Geri
                </Button>
                <Button variant="contained" onClick={handleNext}>
                  Devam
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Onay */}
          <Step>
            <StepLabel>Onay</StepLabel>
            <StepContent>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Plan Özeti
                  </Typography>
                  
                  <List disablePadding>
                    <ListItem disablePadding>
                      <ListItemIcon>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Plan Adı"
                        secondary={planAdi}
                      />
                    </ListItem>
                    <Divider />
                    
                    <ListItem disablePadding>
                      <ListItemIcon>
                        <BuildIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Makina"
                        secondary={makinaListesi.find(m => m.id == makinaId)?.name || 'Seçilmedi'}
                      />
                    </ListItem>
                    <Divider />
                    
                    <ListItem disablePadding>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Miktar"
                        secondary={miktar}
                      />
                    </ListItem>
                    <Divider />
                    
                    <ListItem disablePadding>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Teslim Tarihi"
                        secondary={teslimTarihi ? formatDate(teslimTarihi) : 'Belirtilmedi'}
                      />
                    </ListItem>
                    <Divider />
                    
                    <ListItem disablePadding>
                      <ListItemText
                        primary="İş Emirleri"
                        secondary={`${selectedIsEmirleri.length} adet iş emri seçildi`}
                      />
                    </ListItem>
                    
                    {aciklama && (
                      <>
                        <Divider />
                        <ListItem disablePadding>
                          <ListItemText
                            primary="Açıklama"
                            secondary={aciklama}
                          />
                        </ListItem>
                      </>
                    )}
                  </List>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Geri
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Kaydediliyor...' : 'Planı Kaydet'}
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </Container>

      {/* İş Emri Seçim Modal */}
      <IsEmriSecimiModalMobile
        open={isEmriModalOpen}
        onClose={() => setIsEmriModalOpen(false)}
        onSelect={handleIsEmriEkle}
        multiSelect={true}
        title="Plan için İş Emri Seç"
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>İptal Et</DialogTitle>
        <DialogContent>
          <Typography>
            Değişiklikler kaydedilmedi. Çıkmak istediğinizden emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Devam Et
          </Button>
          <Button onClick={confirmCancel} color="error" variant="contained">
            Çık
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UretimPlaniEkleMobile;