import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  IconButton
} from '@mui/material';
import { Save, Close } from '@mui/icons-material';
import { createArizaBakim, clearError, clearSuccess } from '../../store/slices/arizaBakimSlice';
import axios from 'axios';

const ArizaBakimEkleMobilModal = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(state => state.arizaBakim);
  
  const [formData, setFormData] = useState({
    tezgah_id: '',
    kayit_tipi: '',
    baslangic_tarihi: new Date().toISOString().slice(0, 16),
    aciklama: '',
    sorumlu: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [tezgahlar, setTezgahlar] = useState([]);
  const [tezgahLoading, setTezgahLoading] = useState(false);
  
  // Tezgah listesini getir
  useEffect(() => {
    if (open) {
      const fetchTezgahlar = async () => {
        setTezgahLoading(true);
        try {
          const response = await axios.get('/api/tezgahlar');
          let tezgahlarData = [];
          if (response.data && response.data.success && Array.isArray(response.data.data)) {
            tezgahlarData = response.data.data;
          } else if (Array.isArray(response.data)) {
            tezgahlarData = response.data;
          }
          setTezgahlar(tezgahlarData);
        } catch (error) {
          console.error('Tezgah verisi alınırken hata oluştu:', error);
        } finally {
          setTezgahLoading(false);
        }
      };
      
      fetchTezgahlar();
      
      // Modal açıldığında hataları temizle
      dispatch(clearError());
      dispatch(clearSuccess());
    }
  }, [open, dispatch]);
  
  // Başarı durumunda modal'ı kapat
  useEffect(() => {
    if (success && open) {
      setTimeout(() => {
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    }
  }, [success, open, onSuccess]);
  
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
  
  // Form doğrulama
  const validateForm = () => {
    const errors = {};
    
    if (!formData.tezgah_id) {
      errors.tezgah_id = 'Tezgah seçimi zorunludur';
    }
    
    if (!formData.kayit_tipi) {
      errors.kayit_tipi = 'Kayıt tipi seçimi zorunludur';
    }
    
    if (!formData.baslangic_tarihi) {
      errors.baslangic_tarihi = 'Başlangıç tarihi zorunludur';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Formu gönder
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    dispatch(createArizaBakim(formData));
  };
  
  // Modal'ı kapat
  const handleClose = () => {
    // Form verilerini sıfırla
    setFormData({
      tezgah_id: '',
      kayit_tipi: '',
      baslangic_tarihi: new Date().toISOString().slice(0, 16),
      aciklama: '',
      sorumlu: ''
    });
    setFormErrors({});
    dispatch(clearError());
    dispatch(clearSuccess());
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
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
            Yeni Arıza / Bakım Kaydı
          </Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
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
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {/* Tezgah Seçimi */}
          <FormControl fullWidth margin="normal" error={!!formErrors.tezgah_id}>
            <InputLabel>Tezgah</InputLabel>
            <Select
              name="tezgah_id"
              value={formData.tezgah_id}
              onChange={handleInputChange}
              label="Tezgah"
              disabled={loading || tezgahLoading}
            >
              {tezgahLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} /> Yükleniyor...
                </MenuItem>
              ) : (
                Array.isArray(tezgahlar) && tezgahlar.map(tezgah => (
                  <MenuItem key={tezgah.tezgah_id} value={tezgah.tezgah_id}>
                    {tezgah.tezgah_tanimi}
                  </MenuItem>
                ))
              )}
            </Select>
            {formErrors.tezgah_id && (
              <FormHelperText>{formErrors.tezgah_id}</FormHelperText>
            )}
          </FormControl>
          
          {/* Kayıt Tipi */}
          <FormControl fullWidth margin="normal" error={!!formErrors.kayit_tipi}>
            <InputLabel>Kayıt Tipi</InputLabel>
            <Select
              name="kayit_tipi"
              value={formData.kayit_tipi}
              onChange={handleInputChange}
              label="Kayıt Tipi"
              disabled={loading}
            >
              <MenuItem value="ariza">Arıza</MenuItem>
              <MenuItem value="bakim">Bakım</MenuItem>
            </Select>
            {formErrors.kayit_tipi && (
              <FormHelperText>{formErrors.kayit_tipi}</FormHelperText>
            )}
          </FormControl>
          
          {/* Başlangıç Tarihi */}
          <TextField
            fullWidth
            margin="normal"
            label="Başlangıç Tarihi"
            name="baslangic_tarihi"
            type="datetime-local"
            value={formData.baslangic_tarihi}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
            error={!!formErrors.baslangic_tarihi}
            helperText={formErrors.baslangic_tarihi}
            disabled={loading}
          />
          
          {/* Sorumlu Kişi */}
          <TextField
            fullWidth
            margin="normal"
            label="Sorumlu Kişi"
            name="sorumlu"
            value={formData.sorumlu}
            onChange={handleInputChange}
            disabled={loading}
          />
          
          {/* Açıklama */}
          <TextField
            fullWidth
            margin="normal"
            label="Açıklama"
            name="aciklama"
            value={formData.aciklama}
            onChange={handleInputChange}
            multiline
            rows={4}
            disabled={loading}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          fullWidth
          sx={{ mr: 1 }}
        >
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArizaBakimEkleMobilModal; 