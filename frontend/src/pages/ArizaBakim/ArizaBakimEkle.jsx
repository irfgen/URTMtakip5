import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom'; // useLocation eklendiğini not edin
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
  CircularProgress
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';

import { createArizaBakim, clearError } from '../../store/slices/arizaBakimSlice';
import axios from 'axios';

const ArizaBakimEkle = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // useLocation kullanımı eklendi
  const { loading, error, success } = useSelector(state => state.arizaBakim);
  
  // Diğer sayfalardan gelebilecek tezgah ve kayıt tipi bilgileri için başlangıç değerlerini kontrol et
  const initialTezgahId = location.state?.tezgah_id || '';
  const initialKayitTipi = location.state?.kayit_tipi || '';
  
  const [formData, setFormData] = useState({
    tezgah_id: initialTezgahId, // Başlangıç değeri güncellendi
    kayit_tipi: initialKayitTipi, // Başlangıç değeri güncellendi
    baslangic_tarihi: new Date().toISOString().slice(0, 16),
    aciklama: '',
    sorumlu: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [tezgahlar, setTezgahlar] = useState([]);
  const [tezgahLoading, setTezgahLoading] = useState(false);
  
  // Tezgah listesini getir
  useEffect(() => {
    const fetchTezgahlar = async () => {
      setTezgahLoading(true);
      try {
        const response = await axios.get('/api/tezgahlar');
        setTezgahlar(response.data.data || []);
      } catch (error) {
        console.error('Tezgah verisi alınırken hata oluştu:', error);
        setTezgahlar([]);
      } finally {
        setTezgahLoading(false);
      }
    };

    fetchTezgahlar();

    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);
  
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
    
    dispatch(createArizaBakim(formData))
      .then((result) => {
        if (!result.error) {
          setTimeout(() => {
            navigate('/ariza-bakim');
          }, 1500);
        }
      });
  };
  
  // İptal et
  const handleCancel = () => {
    navigate('/ariza-bakim');
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Yeni Arıza / Bakım Kaydı
          </Typography>
          
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
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.tezgah_id}>
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
                    ) : tezgahlar && Array.isArray(tezgahlar) && tezgahlar.length > 0 ? (
                      tezgahlar.map(tezgah => (
                        <MenuItem key={tezgah.tezgah_id} value={tezgah.tezgah_id}>
                          {tezgah.tezgah_tanimi}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        Tezgah bulunamadı
                      </MenuItem>
                    )}
                  </Select>
                  {formErrors.tezgah_id && (
                    <FormHelperText>{formErrors.tezgah_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.kayit_tipi}>
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
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
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
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  name="aciklama"
                  value={formData.aciklama}
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
                    onClick={handleCancel}
                    startIcon={<ArrowBack />}
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
        </Box>
      </Paper>
    </Container>
  );
};

export default ArizaBakimEkle;