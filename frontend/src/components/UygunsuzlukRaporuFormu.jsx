import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  Grid,
  Alert
} from '@mui/material';

const UygunsuzlukRaporuFormu = ({ 
  open, 
  onClose, 
  isEmriId, 
  isEmriNo,
  hurdaSayisi,
  onSave
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form verileri - şimdilik boş, sonra içerik eklenecek
  const [formData, setFormData] = useState({
    // Burada uygunsuzluk raporu alanları olacak
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Form verilerini kaydetme işlemi burada yapılacak
      console.log("Uygunsuzluk raporu kaydediliyor:", {
        isEmriId,
        isEmriNo,
        hurdaSayisi,
        formData
      });

      // Başarılı kaydetme simülasyonu
      setTimeout(() => {
        setSuccess(true);
        setSubmitting(false);
        if (onSave) {
          onSave(formData);
        }
        // Modal'ı kapat
        setTimeout(() => {
          handleClose();
        }, 1500);
      }, 1000);

    } catch (error) {
      console.error('Uygunsuzluk raporu kaydetme hatası:', error);
      setError('Uygunsuzluk raporu kaydedilirken bir hata oluştu');
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="uygunsuzluk-raporu-title"
    >
      <DialogTitle id="uygunsuzluk-raporu-title">
        <Typography variant="h6">
          Uygunsuzluk Raporu
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          İş Emri: {isEmriNo} | Hurda Sayısı: {hurdaSayisi}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Uygunsuzluk raporu başarıyla kaydedildi!
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Uygunsuzluk Detayları
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Bu form içeriği sonra tasarlanacak. Şimdilik boş bir form yapısı hazırlandı.
                </Typography>
              </Grid>
              
              {/* Geçici placeholder alanlar */}
              <Grid item xs={12} md={6}>
                <TextField
                  name="uygunsuzluk_tipi"
                  label="Uygunsuzluk Tipi"
                  fullWidth
                  value={formData.uygunsuzluk_tipi || ''}
                  onChange={handleInputChange}
                  placeholder="Örn: Boyut hatası, Yüzey kalitesi, vb."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="tespit_eden"
                  label="Tespit Eden"
                  fullWidth
                  value={formData.tespit_eden || ''}
                  onChange={handleInputChange}
                  placeholder="Operatör adı"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="aciklama"
                  label="Uygunsuzluk Açıklaması"
                  multiline
                  rows={4}
                  fullWidth
                  value={formData.aciklama || ''}
                  onChange={handleInputChange}
                  placeholder="Uygunsuzluğun detaylı açıklaması..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="onlem"
                  label="Alınan Önlemler"
                  multiline
                  rows={3}
                  fullWidth
                  value={formData.onlem || ''}
                  onChange={handleInputChange}
                  placeholder="Uygunsuzluk için alınan önlemler..."
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose}
          disabled={submitting}
        >
          İptal
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
        >
          {submitting ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UygunsuzlukRaporuFormu;
