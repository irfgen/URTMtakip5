import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { LocalShipping as ShippingIcon } from '@mui/icons-material';

function HamMalzemeGonderimDialog({ 
  open, 
  onClose, 
  fasonIsEmri, 
  onSubmit,
  loading = false 
}) {
  const [formData, setFormData] = useState({
    ham_malzeme_miktari: '',
    gonderim_irsaliye_no: '',
    gonderen_kisi: '',
    ham_malzeme_notlar: '',
    gonderim_tarihi: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.ham_malzeme_miktari || !formData.gonderen_kisi) {
      setError('Ham malzeme miktarı ve gönderen kişi alanları zorunludur');
      return;
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError('Ham malzeme gönderimi kaydedilemedi');
    }
  };

  const handleClose = () => {
    setFormData({
      ham_malzeme_miktari: '',
      gonderim_irsaliye_no: '',
      gonderen_kisi: '',
      ham_malzeme_notlar: '',
      gonderim_tarihi: new Date().toISOString().split('T')[0]
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ShippingIcon color="primary" />
            <Typography variant="h6">Ham Malzeme Gönderimi</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {/* Parça Bilgileri */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Parça Bilgileri:</Typography>
            <Typography variant="body2">
              <strong>Parça Kodu:</strong> {fasonIsEmri?.parca_kodu || '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Parça Adı:</strong> {fasonIsEmri?.parca?.parcaAdi || '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Fason Adet:</strong> {fasonIsEmri?.fason_adet || '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Ham Malzeme:</strong> {fasonIsEmri?.parca?.hamMalzemeCinsi || '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Ölçüler:</strong> {fasonIsEmri?.parca?.hamMalzemeOlculeri || '-'}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ham Malzeme Miktarı"
                type="number"
                value={formData.ham_malzeme_miktari}
                onChange={(e) => setFormData({ ...formData, ham_malzeme_miktari: e.target.value })}
                required
                inputProps={{ min: 0, step: 0.001 }}
                helperText="Kilogram, adet, metre vb."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Gönderim Tarihi"
                type="date"
                value={formData.gonderim_tarihi}
                onChange={(e) => setFormData({ ...formData, gonderim_tarihi: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="İrsaliye Numarası"
                value={formData.gonderim_irsaliye_no}
                onChange={(e) => setFormData({ ...formData, gonderim_irsaliye_no: e.target.value })}
                placeholder="İrsaliye/sevk belgesi no"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Gönderen Kişi"
                value={formData.gonderen_kisi}
                onChange={(e) => setFormData({ ...formData, gonderen_kisi: e.target.value })}
                required
                placeholder="Gönderiyi hazırlayan/gönderen kişi"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notlar"
                multiline
                rows={3}
                value={formData.ham_malzeme_notlar}
                onChange={(e) => setFormData({ ...formData, ham_malzeme_notlar: e.target.value })}
                placeholder="Gönderimle ilgili özel notlar, açıklamalar..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            İptal
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !formData.ham_malzeme_miktari || !formData.gonderen_kisi}
          >
            {loading ? 'Kaydediliyor...' : 'Ham Malzeme Gönder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default HamMalzemeGonderimDialog;
