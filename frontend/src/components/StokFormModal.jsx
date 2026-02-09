import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import axios from 'axios';
import makinaStokAPI from '../api/makinaStokAPI';

const DEPO_OPTIONS = [
  'Ana Depo',
  'Alaaddin Bey Depo'
];

const GIRIS_KAYNAKLARI = [
  'Sipariş Tamamlama',
  'Manuel Giriş',
  'Düzeltme',
  'İade'
];

const StokFormModal = ({ open, onClose, onSuccess, makina: initialMakina, stok }) => {
  const [makinalar, setMakinalar] = useState([]);
  const [loadingMakinalar, setLoadingMakinalar] = useState(false);
  const [formData, setFormData] = useState({
    makina_id: '',
    depo_id: '',
    adet: 1,
    giris_kaynagi: 'Manuel Giriş',
    giris_tarihi: new Date(),
    not: '',
    seri_nolari: ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadMakinalar();
    }
  }, [open]);

  useEffect(() => {
    if (stok) {
      setFormData({
        makina_id: stok.makina_id || '',
        depo_id: stok.depo_id || '',
        adet: stok.adet || 1,
        giris_kaynagi: stok.giris_kaynagi || 'Manuel Giriş',
        giris_tarihi: stok.giris_tarihi ? new Date(stok.giris_tarihi) : new Date(),
        not: stok.not || '',
        seri_nolari: stok.seri_nolari && stok.seri_nolari.length > 0 ? stok.seri_nolari : ['']
      });
    } else if (initialMakina) {
      setFormData(prev => ({
        ...prev,
        makina_id: initialMakina.makina_id
      }));
    }
  }, [stok, initialMakina]);

  const loadMakinalar = async () => {
    try {
      setLoadingMakinalar(true);
      const response = await axios.get('/api/makinalar');
      setMakinalar(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Makinalar yüklenirken hata:', err);
      setError('Makinalar yüklenemedi');
    } finally {
      setLoadingMakinalar(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      giris_tarihi: date
    }));
  };

  const handleSeriNoChange = (index, value) => {
    const yeniSeriNolar = [...formData.seri_nolari];
    yeniSeriNolar[index] = value;
    setFormData(prev => ({
      ...prev,
      seri_nolari: yeniSeriNolar
    }));
  };

  const handleSeriNoEkle = () => {
    setFormData(prev => ({
      ...prev,
      seri_nolari: [...prev.seri_nolari, '']
    }));
  };

  const handleSiriNoSil = (index) => {
    if (formData.seri_nolari.length > 1) {
      const yeniSeriNolar = formData.seri_nolari.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        seri_nolari: yeniSeriNolar
      }));
    }
  };

  const validateForm = () => {
    if (!formData.makina_id) {
      setError('Makina seçimi gereklidir');
      return false;
    }
    if (!formData.adet || formData.adet < 1) {
      setError('Adet en az 1 olmalıdır');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Seri numaralarını temizle (boşları kaldır)
      const temizSeriNolar = formData.seri_nolari
        .map(s => s.trim())
        .filter(s => s !== '');

      const submitData = {
        makina_id: formData.makina_id,
        depo_id: formData.depo_id || null,
        adet: parseInt(formData.adet),
        giris_kaynagi: formData.giris_kaynagi,
        giris_tarihi: formData.giris_tarihi,
        not: formData.not.trim(),
        seri_nolari: temizSeriNolar.length > 0 ? temizSeriNolar : null
      };

      if (stok) {
        await makinaStokAPI.updateStok(stok.stok_id, submitData);
      } else {
        await makinaStokAPI.createStok(submitData);
      }

      onSuccess();
    } catch (err) {
      console.error('Stok kaydedilirken hata:', err);
      setError(err.message || 'Stok kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {stok ? 'Stok Düzenle' : 'Stok Girişi'}
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Makina *</InputLabel>
              <Select
                value={formData.makina_id}
                onChange={handleChange('makina_id')}
                label="Makina *"
                required
                disabled={loadingMakinalar}
              >
                <MenuItem value="">
                  <em>Makina Seçin</em>
                </MenuItem>
                {makinalar.map(m => (
                  <MenuItem key={m.makina_id} value={m.makina_id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Depo (Opsiyonel)</InputLabel>
              <Select
                value={formData.depo_id}
                onChange={handleChange('depo_id')}
                label="Depo (Opsiyonel)"
              >
                <MenuItem value="">Seçilmedi</MenuItem>
                {DEPO_OPTIONS.map(depo => (
                  <MenuItem key={depo} value={depo}>{depo}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="dense"
              label="Adet"
              type="number"
              fullWidth
              required
              inputProps={{ min: 1 }}
              value={formData.adet}
              onChange={handleChange('adet')}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Giriş Kaynağı</InputLabel>
              <Select
                value={formData.giris_kaynagi}
                onChange={handleChange('giris_kaynagi')}
                label="Giriş Kaynağı"
              >
                {GIRIS_KAYNAKLARI.map(kaynak => (
                  <MenuItem key={kaynak} value={kaynak}>
                    {kaynak}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Giriş Tarihi"
              value={formData.giris_tarihi}
              onChange={handleDateChange}
              renderInput={(params) => (
                <TextField {...params} fullWidth sx={{ mb: 2 }} />
              )}
            />

            {/* Seri Numaraları */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Seri Numaraları (Opsiyonel)
              </Typography>
              {formData.seri_nolari.map((seriNo, index) => (
                <Box key={index} display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
                  <TextField
                    size="small"
                    placeholder={`Seri No ${index + 1}`}
                    value={seriNo}
                    onChange={(e) => handleSeriNoChange(index, e.target.value)}
                    fullWidth
                  />
                  {formData.seri_nolari.length > 1 && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleSiriNoSil(index)}
                    >
                      <RemoveIcon />
                    </Button>
                  )}
                </Box>
              ))}
              <Button
                size="small"
                variant="outlined"
                onClick={handleSeriNoEkle}
                startIcon={<AddIcon />}
                sx={{ mt: 1 }}
              >
                Seri No Ekle
              </Button>
            </Box>

            <TextField
              margin="dense"
              label="Not"
              multiline
              rows={3}
              fullWidth
              value={formData.not}
              onChange={handleChange('not')}
              placeholder="Stok girişi hakkında not..."
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Kaydediliyor...' : stok ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default StokFormModal;
