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
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import axios from 'axios';
import makinaSiparisAPI from '../api/makinaSiparisAPI';

const DURUM_OPTIONS = [
  'Beklemede',
  'Gövde Montaj',
  'Boyada',
  'Son montajda',
  'Üretimde',
  'Tamamlandı',
  'İptal'
];

const SiparisFormModal = ({ open, onClose, onSuccess, makina: initialMakina, siparis }) => {
  const [makinalar, setMakinalar] = useState([]);
  const [loadingMakinalar, setLoadingMakinalar] = useState(false);
  const [formData, setFormData] = useState({
    makina_id: '',
    musteri: '',
    adet: 1,
    durum: 'Beklemede',
    siparis_tarihi: new Date(),
    teslim_tarihi: null,
    not: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load makinalar when modal opens
  useEffect(() => {
    if (open) {
      loadMakinalar();
    }
  }, [open]);

  // Update form when editing or when initialMakina changes
  useEffect(() => {
    if (siparis) {
      setFormData({
        makina_id: siparis.makina_id || '',
        musteri: siparis.musteri || '',
        adet: siparis.adet || 1,
        durum: siparis.durum || 'Beklemede',
        siparis_tarihi: siparis.siparis_tarihi ? new Date(siparis.siparis_tarihi) : new Date(),
        teslim_tarihi: siparis.teslim_tarihi ? new Date(siparis.teslim_tarihi) : null,
        not: siparis.not || ''
      });
    } else if (initialMakina) {
      setFormData(prev => ({
        ...prev,
        makina_id: initialMakina.makina_id
      }));
    }
  }, [siparis, initialMakina]);

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

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const validateForm = () => {
    if (!formData.makina_id) {
      setError('Makina seçimi gereklidir');
      return false;
    }
    if (!formData.musteri || formData.musteri.trim() === '') {
      setError('Müşteri adı gereklidir');
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

      const submitData = {
        makina_id: formData.makina_id,
        musteri: formData.musteri.trim(),
        adet: parseInt(formData.adet),
        durum: formData.durum,
        siparis_tarihi: formData.siparis_tarihi,
        teslim_tarihi: formData.teslim_tarihi,
        not: formData.not.trim()
      };

      if (siparis) {
        await makinaSiparisAPI.updateSiparis(siparis.siparis_id, submitData);
      } else {
        await makinaSiparisAPI.createSiparis(submitData);
      }

      onSuccess();
    } catch (err) {
      console.error('Sipariş kaydedilirken hata:', err);
      setError(err.message || 'Sipariş kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {siparis ? 'Sipariş Düzenle' : 'Yeni Sipariş'}
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

            <TextField
              autoFocus
              margin="dense"
              label="Müşteri"
              type="text"
              fullWidth
              required
              value={formData.musteri}
              onChange={handleChange('musteri')}
              sx={{ mb: 2 }}
            />

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
              <InputLabel>Durum</InputLabel>
              <Select
                value={formData.durum}
                onChange={handleChange('durum')}
                label="Durum"
              >
                {DURUM_OPTIONS.map(durum => (
                  <MenuItem key={durum} value={durum}>
                    {durum}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Sipariş Tarihi"
              value={formData.siparis_tarihi}
              onChange={handleDateChange('siparis_tarihi')}
              renderInput={(params) => (
                <TextField {...params} fullWidth sx={{ mb: 2 }} />
              )}
            />

            <DatePicker
              label="Teslim Tarihi"
              value={formData.teslim_tarihi}
              onChange={handleDateChange('teslim_tarihi')}
              minDate={formData.siparis_tarihi}
              renderInput={(params) => (
                <TextField {...params} fullWidth sx={{ mb: 2 }} />
              )}
            />

            <TextField
              margin="dense"
              label="Not"
              multiline
              rows={3}
              fullWidth
              value={formData.not}
              onChange={handleChange('not')}
              placeholder="Sipariş hakkında not..."
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
            {loading ? 'Kaydediliyor...' : siparis ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default SiparisFormModal;
