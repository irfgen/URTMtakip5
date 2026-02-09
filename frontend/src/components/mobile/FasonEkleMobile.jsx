import React, { useState, useEffect } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Stack,
  Card,
  CardContent,
  Chip,
  Container,
  Slide,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import axios from 'axios';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FasonEkleMobile = ({ 
  open, 
  onClose, 
  onSave,
  title = "Fason İş Ekle"
}) => {
  // Form state
  const [formData, setFormData] = useState({
    firma_id: '',
    firma_adi: '',
    is_tanimi: '',
    adet: '',
    birim_fiyat: '',
    teslim_tarihi: null,
    aciklama: '',
    durum: 'Beklemede'
  });

  // UI state
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [firmaListesi, setFirmaListesi] = useState([]);
  const [firmaLoading, setFirmaLoading] = useState(false);

  // Durum options
  const durumOptions = [
    'Beklemede',
    'Onaylandı',
    'Başlandı',
    'Devam Ediyor',
    'Tamamlandı',
    'İptal'
  ];

  // Load firma listesi when modal opens
  useEffect(() => {
    if (open) {
      loadFirmaListesi();
    }
  }, [open]);

  const loadFirmaListesi = async () => {
    try {
      setFirmaLoading(true);
      const response = await axios.get('/api/fason/firmalar');
      setFirmaListesi(response.data.data || response.data || []);
    } catch (error) {
      console.error('Fason firma listesi yüklenirken hata:', error);
      // Fallback - empty list if API fails
      setFirmaListesi([]);
    } finally {
      setFirmaLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleFirmaSelect = (event) => {
    const selectedFirmaId = event.target.value;
    const selectedFirma = firmaListesi.find(f => f.id === selectedFirmaId);
    
    setFormData(prev => ({
      ...prev,
      firma_id: selectedFirmaId,
      firma_adi: selectedFirma ? selectedFirma.firma_adi : ''
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firma_id) {
      errors.firma_id = 'Fason firma seçimi zorunludur';
    }

    if (!formData.is_tanimi.trim()) {
      errors.is_tanimi = 'İş tanımı zorunludur';
    }

    if (!formData.adet || parseInt(formData.adet) <= 0) {
      errors.adet = 'Geçerli bir adet giriniz';
    }

    if (!formData.durum) {
      errors.durum = 'Durum seçimi zorunludur';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        adet: parseInt(formData.adet),
        birim_fiyat: formData.birim_fiyat ? parseFloat(formData.birim_fiyat) : null,
        teslim_tarihi: formData.teslim_tarihi ? 
          formData.teslim_tarihi.toISOString().split('T')[0] : null
      };

      await onSave(submitData);
      handleReset();
    } catch (error) {
      console.error('Fason iş kaydedilirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firma_id: '',
      firma_adi: '',
      is_tanimi: '',
      adet: '',
      birim_fiyat: '',
      teslim_tarihi: null,
      aciklama: '',
      durum: 'Beklemede'
    });
    setFormErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const getDurumColor = (durum) => {
    switch (durum?.toLowerCase()) {
      case 'tamamlandı':
      case 'tamamlandi':
        return 'success';
      case 'başlandı':
      case 'baslandi':
      case 'devam ediyor':
      case 'onaylandı':
        return 'primary';
      case 'beklemede':
        return 'warning';
      case 'iptal':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        TransitionComponent={Transition}
      >
        {/* Header */}
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleClose}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <Button
              color="inherit"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Container maxWidth="sm" sx={{ flex: 1, py: 2, overflow: 'auto' }}>
          <Stack spacing={3}>
            {/* Firma Seçimi */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Fason Firma
                </Typography>
                
                <FormControl fullWidth error={!!formErrors.firma_id}>
                  <InputLabel>Fason Firma Seç *</InputLabel>
                  <Select
                    value={formData.firma_id}
                    onChange={handleFirmaSelect}
                    label="Fason Firma Seç *"
                    disabled={firmaLoading}
                    startAdornment={<BusinessIcon sx={{ mr: 1, color: 'action' }} />}
                  >
                    {firmaLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 2 }} />
                        Firmalar yükleniyor...
                      </MenuItem>
                    ) : firmaListesi.length === 0 ? (
                      <MenuItem disabled>
                        Fason firma bulunamadı
                      </MenuItem>
                    ) : (
                      firmaListesi.map((firma) => (
                        <MenuItem key={firma.id} value={firma.id}>
                          <Box>
                            <Typography variant="body1">
                              {firma.firma_adi}
                            </Typography>
                            {firma.telefon && (
                              <Typography variant="body2" color="text.secondary">
                                {firma.telefon}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {formErrors.firma_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {formErrors.firma_id}
                    </Typography>
                  )}
                </FormControl>
              </CardContent>
            </Card>

            {/* İş Detayları */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  İş Detayları
                </Typography>

                <Stack spacing={2}>
                  {/* İş Tanımı */}
                  <TextField
                    fullWidth
                    label="İş Tanımı *"
                    placeholder="Yapılacak işin detaylı açıklaması"
                    value={formData.is_tanimi}
                    onChange={(e) => handleInputChange('is_tanimi', e.target.value)}
                    error={!!formErrors.is_tanimi}
                    helperText={formErrors.is_tanimi}
                    multiline
                    rows={3}
                  />

                  {/* Adet */}
                  <TextField
                    fullWidth
                    label="Adet *"
                    type="number"
                    placeholder="İş miktarı"
                    value={formData.adet}
                    onChange={(e) => handleInputChange('adet', e.target.value)}
                    error={!!formErrors.adet}
                    helperText={formErrors.adet}
                    inputProps={{ min: 1 }}
                  />

                  {/* Birim Fiyat */}
                  <TextField
                    fullWidth
                    label="Birim Fiyat (TL)"
                    type="number"
                    placeholder="Opsiyonel"
                    value={formData.birim_fiyat}
                    onChange={(e) => handleInputChange('birim_fiyat', e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />

                  {/* Teslim Tarihi */}
                  <DatePicker
                    label="Teslim Tarihi"
                    value={formData.teslim_tarihi}
                    onChange={(newValue) => handleInputChange('teslim_tarihi', newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <Box sx={{ mr: 1 }}>
                              <CalendarIcon color="action" />
                            </Box>
                          )
                        }}
                      />
                    )}
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined"
                      }
                    }}
                  />

                  {/* Durum */}
                  <FormControl fullWidth error={!!formErrors.durum}>
                    <InputLabel>Durum *</InputLabel>
                    <Select
                      value={formData.durum}
                      onChange={(e) => handleInputChange('durum', e.target.value)}
                      label="Durum *"
                    >
                      {durumOptions.map((durum) => (
                        <MenuItem key={durum} value={durum}>
                          <Chip 
                            label={durum} 
                            size="small" 
                            color={getDurumColor(durum)}
                            variant="outlined"
                          />
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.durum && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {formErrors.durum}
                      </Typography>
                    )}
                  </FormControl>

                  {/* Açıklama */}
                  <TextField
                    fullWidth
                    label="Açıklama"
                    placeholder="Ek bilgiler, özel notlar..."
                    value={formData.aciklama}
                    onChange={(e) => handleInputChange('aciklama', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Özet */}
            {formData.firma_adi && formData.is_tanimi && formData.adet && (
              <Card sx={{ bgcolor: 'info.50' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }} color="info.main">
                    Özet
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Firma:</strong> {formData.firma_adi}
                    </Typography>
                    <Typography variant="body2">
                      <strong>İş:</strong> {formData.is_tanimi.slice(0, 50)}...
                    </Typography>
                    <Typography variant="body2">
                      <strong>Adet:</strong> {formData.adet}
                    </Typography>
                    {formData.birim_fiyat && (
                      <Typography variant="body2">
                        <strong>Toplam Tutar:</strong> {(parseFloat(formData.birim_fiyat) * parseInt(formData.adet || 0)).toFixed(2)} TL
                      </Typography>
                    )}
                    <Chip 
                      label={formData.durum} 
                      size="small" 
                      color={getDurumColor(formData.durum)}
                      variant="outlined"
                      sx={{ alignSelf: 'flex-start' }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Container>
      </Dialog>
    </LocalizationProvider>
  );
};

export default FasonEkleMobile;