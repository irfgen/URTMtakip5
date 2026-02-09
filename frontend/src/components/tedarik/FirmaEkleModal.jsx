import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Grid,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import tedarikService from '../../services/tedarikService.js';

const FirmaEkleModal = ({ open, onClose, onSuccess, firma = null, initialFirmaAdi = '' }) => {
  const isEdit = !!firma;

  const [formData, setFormData] = useState({
    firma_adi: firma?.firma_adi || initialFirmaAdi || '',
    firma_kodu: firma?.firma_kodu || '',
    vergi_dairesi: firma?.vergi_dairesi || '',
    vergi_no: firma?.vergi_no || '',
    adres: firma?.adres || '',
    telefon: firma?.telefon || '',
    email: firma?.email || '',
    yetkili_kisi: firma?.yetkili_kisi || '',
    yetkili_telefon: firma?.yetkili_telefon || '',
    yetkili_email: firma?.yetkili_email || '',
    iban: firma?.iban || '',
    web_sitesi: firma?.web_sitesi || '',
    aciklama: firma?.aciklama || '',
    durum: firma?.durum || 'aktif',
    tip: firma?.tip || 'dis'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // initialFirmaAdi değiştiğinde formu güncelle (sadece yeni firma eklerken)
  useEffect(() => {
    if (!isEdit && initialFirmaAdi) {
      setFormData(prev => ({
        ...prev,
        firma_adi: initialFirmaAdi
      }));
    }
  }, [initialFirmaAdi, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firma_adi.trim()) {
      newErrors.firma_adi = 'Firma adı zorunludur';
    } else if (formData.firma_adi.trim().length < 2) {
      newErrors.firma_adi = 'Firma adı en az 2 karakter olmalıdır';
    }

    if (!formData.firma_kodu.trim()) {
      newErrors.firma_kodu = 'Firma kodu zorunludur';
    } else if (formData.firma_kodu.trim().length < 2) {
      newErrors.firma_kodu = 'Firma kodu en az 2 karakter olmalıdır';
    }

    if (formData.vergi_no && !/^[0-9]{10}$/.test(formData.vergi_no.replace(/\D/g, ''))) {
      newErrors.vergi_no = 'Vergi numarası 10 haneli olmalıdır';
    }

    if (formData.telefon && !/^(\+90|0)?[0-9]{10}$/.test(formData.telefon.replace(/\D/g, ''))) {
      newErrors.telefon = 'Telefon numarası geçerli formatta olmalıdır';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-posta adresi geçerli formatta olmalıdır';
    }

    if (formData.yetkili_telefon && !/^(\+90|0)?[0-9]{10}$/.test(formData.yetkili_telefon.replace(/\D/g, ''))) {
      newErrors.yetkili_telefon = 'Yetkili telefon numarası geçerli formatta olmalıdır';
    }

    if (formData.yetkili_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.yetkili_email)) {
      newErrors.yetkili_email = 'Yetkili e-posta adresi geçerli formatta olmalıdır';
    }

    if (formData.web_sitesi && !/^https?:\/\/.+/.test(formData.web_sitesi)) {
      newErrors.web_sitesi = 'Web sitesi adresi geçerli formatta olmalıdır (http:// veya https:// ile başlamalı)';
    }

    if (formData.iban && !/^TR[a-zA-Z0-9]{2}\s?([0-9]{4}\s?){3}[0-9]{2}$/.test(formData.iban.replace(/\s/g, ''))) {
      newErrors.iban = 'IBAN geçerli formatta olmalıdır (TR ile başlamalı)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        firma_adi: formData.firma_adi.trim(),
        firma_kodu: formData.firma_kodu.trim().toUpperCase(),
        vergi_no: formData.vergi_no ? formData.vergi_no.replace(/\D/g, '') : null,
        telefon: formData.telefon ? formData.telefon.replace(/\D/g, '') : null,
        yetkili_telefon: formData.yetkili_telefon ? formData.yetkili_telefon.replace(/\D/g, '') : null,
        iban: formData.iban ? formData.iban.replace(/\s/g, '').toUpperCase() : null,
        web_sitesi: formData.web_sitesi || null
      };

      let response;
      if (isEdit) {
        response = await tedarikService.updateFirma(firma.id, submitData);
      } else {
        response = await tedarikService.createFirma(submitData);
      }

      onSuccess(response.data);
      handleClose();
    } catch (error) {
      console.error('Firma kaydetme hatası:', error);

      if (error.data?.errors) {
        const serverErrors = {};
        error.data.errors.forEach(err => {
          serverErrors[err.field] = err.message;
        });
        setErrors(serverErrors);
      } else {
        setErrors({
          general: error.data?.message || 'Firma kaydedilirken bir hata oluştu'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firma_adi: '',
      firma_kodu: '',
      vergi_dairesi: '',
      vergi_no: '',
      adres: '',
      telefon: '',
      email: '',
      yetkili_kisi: '',
      yetkili_telefon: '',
      yetkili_email: '',
      iban: '',
      web_sitesi: '',
      aciklama: '',
      durum: 'aktif'
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              {isEdit ? 'Firma Düzenle' : 'Yeni Firma Ekle'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Zorunlu Alanlar */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Firma Adı"
              name="firma_adi"
              value={formData.firma_adi}
              onChange={handleChange}
              error={!!errors.firma_adi}
              helperText={errors.firma_adi}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Firma Kodu"
              name="firma_kodu"
              value={formData.firma_kodu}
              onChange={handleChange}
              error={!!errors.firma_kodu}
              helperText={errors.firma_kodu || "Benzersiz bir kod olmalı"}
              disabled={loading}
              placeholder="Örn: FRM001"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Firma Tipi</InputLabel>
              <Select
                name="tip"
                value={formData.tip || 'dis'}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="dis">Dış Firma</MenuItem>
                <MenuItem value="ic">İç Firma</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Vergi Bilgileri */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Vergi Dairesi"
              name="vergi_dairesi"
              value={formData.vergi_dairesi}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Vergi Numarası"
              name="vergi_no"
              value={formData.vergi_no}
              onChange={handleChange}
              error={!!errors.vergi_no}
              helperText={errors.vergi_no || "10 haneli olmalı"}
              disabled={loading}
              placeholder="1234567890"
            />
          </Grid>

          {/* İletişim Bilgileri */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Adres"
              name="adres"
              value={formData.adres}
              onChange={handleChange}
              multiline
              rows={2}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefon"
              name="telefon"
              value={formData.telefon}
              onChange={handleChange}
              error={!!errors.telefon}
              helperText={errors.telefon || "Örn: 05321234567"}
              disabled={loading}
              placeholder="05321234567"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="E-posta"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              type="email"
              disabled={loading}
              placeholder="firma@ornek.com"
            />
          </Grid>

          {/* Yetkili Bilgileri */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Yetkili Bilgileri
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Yetkili Kişi"
              name="yetkili_kisi"
              value={formData.yetkili_kisi}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Yetkili Telefon"
              name="yetkili_telefon"
              value={formData.yetkili_telefon}
              onChange={handleChange}
              error={!!errors.yetkili_telefon}
              helperText={errors.yetkili_telefon}
              disabled={loading}
              placeholder="05321234567"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Yetkili E-posta"
              name="yetkili_email"
              value={formData.yetkili_email}
              onChange={handleChange}
              error={!!errors.yetkili_email}
              helperText={errors.yetkili_email}
              type="email"
              disabled={loading}
              placeholder="yetkili@ornek.com"
            />
          </Grid>

          {/* Finansal Bilgiler */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Finansal Bilgiler
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="IBAN"
              name="iban"
              value={formData.iban}
              onChange={handleChange}
              error={!!errors.iban}
              helperText={errors.iban || "TR ile başlamalı"}
              disabled={loading}
              placeholder="TR12 3456 7890 1234 5678 9012 34"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Web Sitesi"
              name="web_sitesi"
              value={formData.web_sitesi}
              onChange={handleChange}
              error={!!errors.web_sitesi}
              helperText={errors.web_sitesi}
              disabled={loading}
              placeholder="https://www.firma.com"
            />
          </Grid>

          {/* Diğer Bilgiler */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Açıklama"
              name="aciklama"
              value={formData.aciklama}
              onChange={handleChange}
              multiline
              rows={3}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                name="durum"
                value={formData.durum}
                onChange={handleChange}
                label="Durum"
                disabled={loading}
              >
                <MenuItem value="aktif">Aktif</MenuItem>
                <MenuItem value="pasif">Pasif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={<BusinessIcon />}
        >
          {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Ekle')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FirmaEkleModal;