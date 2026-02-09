import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';

const TezgahEkleForm = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    tanim: '',
    eksenSayisi: '',
    markaModel: '',
    durum: 'aktif',
    tezgah_x: '',
    tezgah_y: '',
    tezgah_z: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      tanim: '',
      eksenSayisi: '',
      markaModel: '',
      durum: 'aktif',
      tezgah_x: '',
      tezgah_y: '',
      tezgah_z: '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Yeni Tezgah Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="tanim"
                label="Tezgah Tanımı"
                value={formData.tanim}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="markaModel"
                label="Marka ve Model"
                value={formData.markaModel}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="eksenSayisi"
                label="Eksen Sayısı"
                type="number"
                value={formData.eksenSayisi}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 2, max: 6 }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Durum</InputLabel>
                <Select
                  name="durum"
                  value={formData.durum}
                  onChange={handleChange}
                  label="Durum"
                >
                  <MenuItem value="aktif">Aktif</MenuItem>
                  <MenuItem value="bakim">Bakımda</MenuItem>
                  <MenuItem value="ariza">Arızalı</MenuItem>
                  <MenuItem value="devre_disi">Devre Dışı</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                name="tezgah_x"
                label="X Ekseni (mm)"
                type="number"
                value={formData.tezgah_x}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                name="tezgah_y"
                label="Y Ekseni (mm)"
                type="number"
                value={formData.tezgah_y}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                name="tezgah_z"
                label="Z Ekseni (mm)"
                type="number"
                value={formData.tezgah_z}
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
            Ekle
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TezgahEkleForm;