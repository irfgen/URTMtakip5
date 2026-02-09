import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography
} from '@mui/material';

const TezgahDuzenleForm = ({ open, onClose, tezgah, onSubmit }) => {
  const [formData, setFormData] = useState({
    tezgah_tanimi: '',
    calisma_durumu: 'musait',
    eksen_sayisi: '',
    marka_model: '',
    pozisyon_x: 0,
    pozisyon_y: 0
  });

  useEffect(() => {
    if (tezgah) {
      setFormData({
        tezgah_tanimi: tezgah.tezgah_tanimi || '',
        calisma_durumu: tezgah.calisma_durumu || 'musait',
        eksen_sayisi: tezgah.eksen_sayisi || '',
        marka_model: tezgah.marka_model || '',
        pozisyon_x: tezgah.pozisyon_x || 0,
        pozisyon_y: tezgah.pozisyon_y || 0
      });
    }
  }, [tezgah]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Tezgah Düzenle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {tezgah?.is_emirleri?.length > 0 && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Atanmış İş Emri
                  </Typography>
                  <Typography variant="body2">
                    İş Emri No: {tezgah.is_emirleri[0].is_emri_no}
                  </Typography>
                  <Typography variant="body2">
                    İş Adı: {tezgah.is_emirleri[0].is_adi}
                  </Typography>
                  <Typography variant="body2">
                    Üretim Planı: {tezgah.is_emirleri[0].uretim_plani_id ? `Plan #${tezgah.is_emirleri[0].uretim_plani_id}` : (tezgah.is_emirleri[0].plan_liste_no || '-')}
                  </Typography>
                </Paper>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                name="tezgah_tanimi"
                label="Tezgah Tanımı"
                value={formData.tezgah_tanimi}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="marka_model"
                label="Marka ve Model"
                value={formData.marka_model}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Çalışma Durumu</InputLabel>
                <Select
                  name="calisma_durumu"
                  value={formData.calisma_durumu}
                  onChange={handleChange}
                  label="Çalışma Durumu"
                >
                  <MenuItem value="musait">Müsait</MenuItem>
                  <MenuItem value="calisiyor">Çalışıyor</MenuItem>
                  <MenuItem value="bakim">Bakımda</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="pozisyon_x"
                label="X Pozisyonu"
                type="number"
                value={formData.pozisyon_x}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="pozisyon_y"
                label="Y Pozisyonu"
                type="number"
                value={formData.pozisyon_y}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>İptal</Button>
          <Button type="submit" variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TezgahDuzenleForm;