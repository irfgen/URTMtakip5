import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControlLabel, Switch, Box, InputAdornment } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ParcaKayitlariModal from './ParcaKayitlariModal';

// Ortak parça düzenleme formu (mobil ve web için)
const ParcaKartiDuzenleForm = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({ ...initialData });
  const [parcaKayitlariModalOpen, setParcaKayitlariModalOpen] = useState(false);

  useEffect(() => {
    setFormData({ ...initialData });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Parça Kartını Düzenle</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField label="Parça Kodu" name="parcaKodu" value={formData.parcaKodu || ''} onChange={handleChange} disabled fullWidth required />
            <TextField label="Parça Adı" name="parcaAdi" value={formData.parcaAdi || ''} onChange={handleChange} fullWidth required />
            <Box display="flex" gap={2}>
              <TextField label="Stok Adeti" name="stokAdeti" type="number" value={formData.stokAdeti || ''} onChange={handleChange} fullWidth />
              <TextField label="Kritik Stok" name="kritik_stok" type="number" value={formData.kritik_stok || ''} onChange={handleChange} fullWidth />
            </Box>
            <TextField label="Tedarik Bedeli" name="tedarikBedeli" type="number" value={formData.tedarikBedeli || ''} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₺</InputAdornment> }} />
            <FormControlLabel control={<Switch checked={!!formData.imalMi} onChange={handleChange} name="imalMi" color="primary" />} label="İmal Edilen Parça" />
            {formData.imalMi && (
              <>
                <TextField label="Ham Malzeme Cinsi" name="hamMalzemeCinsi" value={formData.hamMalzemeCinsi || ''} onChange={handleChange} fullWidth />
                <TextField label="Ham Malzeme Ölçüleri" name="hamMalzemeOlculeri" value={formData.hamMalzemeOlculeri || ''} onChange={handleChange} fullWidth />
                <TextField label="Fason Maliyeti" name="fasonMaliyeti" type="number" value={formData.fasonMaliyeti || ''} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₺</InputAdornment> }} />
                <TextField label="Şirket İçi Maliyeti" name="sirketIciMaliyeti" type="number" value={formData.sirketIciMaliyeti || ''} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₺</InputAdornment> }} />
                <TextField label="Setup Sayısı" name="setupSayisi" type="number" value={formData.setupSayisi || ''} onChange={handleChange} fullWidth />
                <TextField label="CNC İşleme Süresi (dk)" name="cncIslemeSuresi" type="number" value={formData.cncIslemeSuresi || ''} onChange={handleChange} fullWidth />
                <FormControlLabel control={<Switch checked={!!formData.siyah} onChange={handleChange} name="siyah" color="primary" />} label="Siyah Parça" />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>İptal</Button>
          <Button 
            onClick={() => setParcaKayitlariModalOpen(true)}
            variant="outlined"
            color="secondary"
            startIcon={<FolderIcon />}
            sx={{ mr: 1 }}
          >
            Parça Kayıtları
          </Button>
          <Button type="submit" variant="contained" color="primary">Kaydet</Button>
        </DialogActions>
      </form>
      
      <ParcaKayitlariModal
        open={parcaKayitlariModalOpen}
        onClose={() => setParcaKayitlariModalOpen(false)}
        parcaKodu={formData.parcaKodu}
      />
    </Dialog>
  );
};

export default ParcaKartiDuzenleForm;
