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
  Alert
} from '@mui/material';

const HamMalzemeTeslimDialog = ({ open, onClose, fasonIsEmri, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    teslim_sorumlusu: '',
    notlar: ''
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
    
    if (!formData.teslim_sorumlusu.trim()) {
      newErrors.teslim_sorumlusu = 'Teslim sorumlusu gerekli';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    onSubmit(formData);
    
    // Form'u temizle
    setFormData({
      teslim_sorumlusu: '',
      notlar: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      teslim_sorumlusu: '',
      notlar: ''
    });
    setErrors({});
    onClose();
  };

  if (!fasonIsEmri) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Ham Malzeme Teslim Et
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Parça:</strong> {fasonIsEmri.parca?.parcaAdi || 'Bilinmiyor'} ({fasonIsEmri.parca_kodu})
            </Typography>
            <Typography variant="body2">
              <strong>Fason Adet:</strong> {fasonIsEmri.fason_adet}
            </Typography>
            {fasonIsEmri.ham_malzeme_miktari && (
              <Typography variant="body2">
                <strong>Gönderilen Ham Malzeme:</strong> {fasonIsEmri.ham_malzeme_miktari}
              </Typography>
            )}
          </Alert>

          <TextField
            fullWidth
            label="Teslim Sorumlusu *"
            value={formData.teslim_sorumlusu}
            onChange={(e) => handleChange('teslim_sorumlusu', e.target.value)}
            error={!!errors.teslim_sorumlusu}
            helperText={errors.teslim_sorumlusu}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Notlar"
            multiline
            rows={3}
            value={formData.notlar}
            onChange={(e) => handleChange('notlar', e.target.value)}
            placeholder="Teslim ile ilgili notlar..."
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          İptal
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          color="success"
        >
          {loading ? 'Teslim Ediliyor...' : 'Teslim Et'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HamMalzemeTeslimDialog;
