import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Grid,
  InputAdornment
} from '@mui/material';
import { LocalShipping, Assignment } from '@mui/icons-material';

const FasonTeslimDialog = ({ open, onClose, fasonIsEmri, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    teslim_adet: '',
    teslim_notlari: ''
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Hata varsa temizle
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.teslim_adet || formData.teslim_adet <= 0) {
      newErrors.teslim_adet = 'Teslim adet 0\'dan büyük olmalıdır';
    }
    
    const mevcutTeslim = fasonIsEmri?.teslim_adet || 0;
    const yeniToplam = mevcutTeslim + parseInt(formData.teslim_adet);
    
    if (yeniToplam > fasonIsEmri?.fason_adet * 1.1) { // %10 tolerans
      newErrors.teslim_adet = `Toplam teslim (${yeniToplam}) fasona verilen adetten (%${fasonIsEmri?.fason_adet}) fazla olamaz`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    onSubmit({
      ...formData,
      teslim_adet: parseInt(formData.teslim_adet)
    });
    
    // Form'u temizle
    setFormData({
      teslim_adet: '',
      teslim_notlari: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      teslim_adet: '',
      teslim_notlari: ''
    });
    setErrors({});
    onClose();
  };

  if (!fasonIsEmri) return null;

  const mevcutTeslim = fasonIsEmri.teslim_adet || 0;
  const kalanAdet = fasonIsEmri.fason_adet - mevcutTeslim;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LocalShipping color="primary" />
          <Typography variant="h6">Fason Teslim Al</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Parça:</strong> {fasonIsEmri.parca?.parcaAdi || 'Bilinmiyor'} ({fasonIsEmri.parca_kodu})
            </Typography>
            <Typography variant="body2">
              <strong>Fasona Verilen:</strong> {fasonIsEmri.fason_adet} adet
            </Typography>
            <Typography variant="body2">
              <strong>Şu Ana Kadar Teslim Alınan:</strong> {mevcutTeslim} adet
            </Typography>
            <Typography variant="body2">
              <strong>Kalan:</strong> {kalanAdet} adet
            </Typography>
            <Typography variant="body2">
              <strong>Tedarikçi:</strong> {fasonIsEmri.tedarikci}
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teslim Alınan Adet *"
                type="number"
                value={formData.teslim_adet}
                onChange={(e) => handleChange('teslim_adet', e.target.value)}
                error={!!errors.teslim_adet}
                helperText={errors.teslim_adet || `Maksimum ${kalanAdet + Math.round(fasonIsEmri.fason_adet * 0.1)} adet (%10 tolerans ile)`}
                inputProps={{ min: 1, max: kalanAdet + Math.round(fasonIsEmri.fason_adet * 0.1) }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">adet</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teslim Notları"
                multiline
                rows={3}
                value={formData.teslim_notlari}
                onChange={(e) => handleChange('teslim_notlari', e.target.value)}
                placeholder="Teslim ile ilgili notlar, kalite durumu, eksiklikler vs..."
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          İptal
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || kalanAdet <= 0}
          startIcon={<Assignment />}
          color="primary"
        >
          {loading ? 'Teslim Alınıyor...' : 'Teslim Al'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FasonTeslimDialog;
