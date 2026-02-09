import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';

const FasonConfirmDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  isEmri,
  loading = false 
}) => {
  const [fasonData, setFasonData] = useState({
    fason_adet: isEmri?.adet || 1,
    teslim_tarihi: isEmri?.teslim_tarihi ? new Date(isEmri.teslim_tarihi) : new Date(),
    ilgili_kisi: '',
    tedarikci: '',
    aciklama: `${isEmri?.is_emri_no || ''} iş emrinden türetildi`
  });

  const handleInputChange = (field, value) => {
    setFasonData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirm = () => {
    onConfirm({
      fasonData,
      confirm: true
    });
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          <Typography variant="h6" component="div">
            ⚠️ Fason Durumuna Geçiş Onayı
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>{isEmri?.is_emri_no}</strong> numaralı iş emri fason durumuna geçirilecek ve 
              aşağıdaki bilgilerle yeni bir fason iş emri oluşturulacaktır.
            </Typography>
          </Alert>

          {/* Mevcut İş Emri Bilgileri */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Mevcut İş Emri Bilgileri
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>İş Emri No:</strong> {isEmri?.is_emri_no}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>İş Adı:</strong> {isEmri?.is_adi}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Parça Kodu:</strong> {isEmri?.parca_kodu}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Adet:</strong> {isEmri?.adet}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Fason İş Emri Bilgileri */}
          <Typography variant="subtitle2" gutterBottom color="primary">
            Oluşturulacak Fason İş Emri Bilgileri
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fason Adet"
                type="number"
                fullWidth
                value={fasonData.fason_adet}
                onChange={(e) => handleInputChange('fason_adet', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: isEmri?.adet }}
                helperText={`Maksimum: ${isEmri?.adet}`}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Teslim Tarihi"
                value={fasonData.teslim_tarihi}
                onChange={(date) => handleInputChange('teslim_tarihi', date)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="İlgili Kişi"
                fullWidth
                value={fasonData.ilgili_kisi}
                onChange={(e) => handleInputChange('ilgili_kisi', e.target.value)}
                placeholder="Fason işlemi takip edecek kişi"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Tedarikci"
                fullWidth
                value={fasonData.tedarikci}
                onChange={(e) => handleInputChange('tedarikci', e.target.value)}
                placeholder="Fason işlemini yapacak firma"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Açıklama"
                fullWidth
                multiline
                rows={3}
                value={fasonData.aciklama}
                onChange={(e) => handleInputChange('aciklama', e.target.value)}
                placeholder="Fason işlemi ile ilgili ek bilgiler"
              />
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              Bu işlem sonrasında:
              <br />• İş emri "fason" durumuna geçecek
              <br />• Yeni bir fason iş emri oluşturulacak
              <br />• Fason iş emri tamamlandığında ana iş emri de "tamamlandı" durumuna geçecek
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCancel}
            variant="outlined"
            disabled={loading}
          >
            İptal
          </Button>
          <Button 
            onClick={handleConfirm}
            variant="contained"
            color="warning"
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'İşleniyor...' : 'Fason Durumuna Geçir'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default FasonConfirmDialog;