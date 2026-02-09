import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Typography,
  useTheme
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderIcon from '@mui/icons-material/Folder';
import ParcaKayitlariModal from './ParcaKayitlariModal';
import axios from 'axios';

const ParcaDuzenleForm = ({ open, onClose, onSubmit, initialData, onSuccess }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    parcaKodu: initialData?.parcaKodu || '',
    parcaAdi: initialData?.parcaAdi || '',
    aciklama: initialData?.aciklama || '',
    kategori: initialData?.kategori || '',
    stokAdeti: initialData?.stokAdeti || '',
    kritik_stok: initialData?.kritik_stok || '',
    tedarikBedeli: initialData?.tedarikBedeli || '',
    imalMi: initialData?.imalMi || false,
    hamMalzemeCinsi: initialData?.hamMalzemeCinsi || '',
    hamMalzemeOlculeri: initialData?.hamMalzemeOlculeri || '',
    fasonMaliyeti: initialData?.fasonMaliyeti || '',
    sirketIciMaliyeti: initialData?.sirketIciMaliyeti || '',
    setupSayisi: initialData?.setupSayisi || '',
    cncIslemeSuresi: initialData?.cncIslemeSuresi || '',
    siyah: initialData?.siyah || false,
    teknik_resim_path: initialData?.teknik_resim_path || '',
    foto_path: initialData?.foto_path || '',
    sldprt_yolu: initialData?.sldprt_yolu || '',
    slddrw_yolu: initialData?.slddrw_yolu || ''
  });

  const [parcaKayitlariModalOpen, setParcaKayitlariModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const teknikResimInputRef = useRef();
  const fotoInputRef = useRef();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileSelect = (ref, field) => {
    if (ref.current) {
      ref.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.put(`/api/parcalar/${formData.parcaKodu}`, formData);

      if (response.data) {
        setSuccess(true);
        // Başarılı olduğunda 1.5 saniye bekle ve kapat
        setTimeout(() => {
          setSuccess(false);
          if (onSuccess) {
            onSuccess(response.data);
          }
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Parça güncellenirken hata:', err);
      setError(err.response?.data?.message || 'Parça güncellenirken bir hata oluştu.');
      setLoading(false);
    }
  };

  // Form verilerini güncelle when initialData değişirse
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        parcaKodu: initialData.parcaKodu || '',
        parcaAdi: initialData.parcaAdi || '',
        aciklama: initialData.aciklama || '',
        kategori: initialData.kategori || '',
        stokAdeti: initialData.stokAdeti || '',
        kritik_stok: initialData.kritik_stok || '',
        tedarikBedeli: initialData.tedarikBedeli || '',
        imalMi: initialData.imalMi || false,
        hamMalzemeCinsi: initialData.hamMalzemeCinsi || '',
        hamMalzemeOlculeri: initialData.hamMalzemeOlculeri || '',
        fasonMaliyeti: initialData.fasonMaliyeti || '',
        sirketIciMaliyeti: initialData.sirketIciMaliyeti || '',
        setupSayisi: initialData.setupSayisi || '',
        cncIslemeSuresi: initialData.cncIslemeSuresi || '',
        siyah: initialData.siyah || false,
        teknik_resim_path: initialData.teknik_resim_path || '',
        foto_path: initialData.foto_path || '',
        sldprt_yolu: initialData.sldprt_yolu || '',
        slddrw_yolu: initialData.slddrw_yolu || ''
      });
    }
    // Reset states when modal opens/closes
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, [initialData, open]);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          overflowY: 'auto'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Parça Düzenle</Typography>
            {loading && <CircularProgress size={24} />}
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Hata ve Başarı Mesajları */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Parça başarıyla güncellendi!
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Parça Kodu"
              name="parcaKodu"
              value={formData.parcaKodu}
              onChange={handleChange}
              disabled
              required
            />
            <TextField
              label="Parça Adı"
              name="parcaAdi"
              value={formData.parcaAdi}
              onChange={handleChange}
              required
            />
            <TextField
              label="Açıklama"
              name="aciklama"
              value={formData.aciklama}
              onChange={handleChange}
              multiline
              rows={3}
            />
            <TextField
              label="Kategori"
              name="kategori"
              value={formData.kategori}
              onChange={handleChange}
            />
            <Box display={{ xs: 'block', sm: 'flex' }} gap={{ xs: 0, sm: 2 }}>
              <TextField
                label="Stok Adeti"
                name="stokAdeti"
                type="number"
                value={formData.stokAdeti}
                onChange={handleChange}
                required
                fullWidth
                sx={{ mb: { xs: 2, sm: 0 } }}
              />
              <TextField
                label="Kritik Stok Seviyesi"
                name="kritik_stok"
                type="number"
                value={formData.kritik_stok}
                onChange={handleChange}
                helperText="Bu seviyenin altına düştüğünde uyarı verilecek"
                fullWidth
              />
            </Box>
            <TextField
              label="Tedarik Bedeli"
              name="tedarikBedeli"
              type="number"
              value={formData.tedarikBedeli}
              onChange={handleChange}
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.imalMi}
                  onChange={handleChange}
                  name="imalMi"
                  color="primary"
                />
              }
              label="İmal Edilen Parça"
            />
            {formData.imalMi && (
              <>
                <TextField
                  label="Ham Malzeme Cinsi"
                  name="hamMalzemeCinsi"
                  value={formData.hamMalzemeCinsi}
                  onChange={handleChange}
                />
                <TextField
                  label="Ham Malzeme Ölçüleri"
                  name="hamMalzemeOlculeri"
                  value={formData.hamMalzemeOlculeri}
                  onChange={handleChange}
                />
                <TextField
                  label="Fason Maliyeti"
                  name="fasonMaliyeti"
                  type="number"
                  value={formData.fasonMaliyeti}
                  onChange={handleChange}
                />
                <TextField
                  label="Şirket İçi Maliyeti"
                  name="sirketIciMaliyeti"
                  type="number"
                  value={formData.sirketIciMaliyeti}
                  onChange={handleChange}
                />
                <TextField
                  label="Setup Sayısı"
                  name="setupSayisi"
                  type="number"
                  value={formData.setupSayisi}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  label="CNC İşleme Süresi (dk)"
                  name="cncIslemeSuresi"
                  type="number"
                  value={formData.cncIslemeSuresi}
                  onChange={handleChange}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.siyah}
                      onChange={handleChange}
                      name="siyah"
                      color="primary"
                    />
                  }
                  label="Siyah Parça"
                />
              </>
            )}
            <Box display={{ xs: 'block', sm: 'flex' }} gap={{ xs: 0, sm: 2 }}>
              <TextField
                label="Teknik Resim Dosya Yolu"
                name="teknik_resim_path"
                value={formData.teknik_resim_path}
                onChange={handleChange}
                helperText="PDF dosyasının tam yolu veya URL'si"
                fullWidth
                sx={{ mb: { xs: 2, sm: 0 } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={() => handleFileSelect(teknikResimInputRef, 'teknik_resim_path')}
                        edge="end"
                      >
                        <FolderOpenIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputRef={teknikResimInputRef}
              />
              <TextField
                label="Fotoğraf Dosya Yolu"
                name="foto_path"
                value={formData.foto_path}
                onChange={handleChange}
                helperText="Resim dosyasının tam yolu veya URL'si"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={() => handleFileSelect(fotoInputRef, 'foto_path')}
                        edge="end"
                      >
                        <FolderOpenIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputRef={fotoInputRef}
              />
            </Box>

            {/* 🆕 CAD Dosya Yolları Bölümü */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  📁 CAD Dosya Yolları
                </Typography>
              </Box>

              <Box display={{ xs: 'block', sm: 'flex' }} gap={{ xs: 0, sm: 2 }}>
                <TextField
                  label="SLDPRT Dosya Yolu"
                  name="sldprt_yolu"
                  value={formData.sldprt_yolu}
                  onChange={handleChange}
                  helperText="3D model dosyasının (.sldprt) sunucudaki yolu"
                  fullWidth
                  placeholder="/mnt/cad_files/parcalar/PARCA_001.sldprt"
                  sx={{ mb: { xs: 2, sm: 0 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => handleFileSelect(fotoInputRef, 'sldprt_yolu')}
                          edge="end"
                        >
                          <FolderOpenIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="SLDDRW Dosya Yolu"
                  name="slddrw_yolu"
                  value={formData.slddrw_yolu}
                  onChange={handleChange}
                  helperText="Teknik çizim dosyasının (.slddrw) sunucudaki yolu"
                  fullWidth
                  placeholder="/mnt/cad_files/parcalar/PARCA_001.slddrw"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => handleFileSelect(fotoInputRef, 'slddrw_yolu')}
                          edge="end"
                        >
                          <FolderOpenIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                💡 İpucu: Dizin tarama modülü ile bu alanlar otomatik olarak doldurulabilir.
                Network veya mount edilmiş dizinlerdeki CAD dosyalarının tam yollarını girin.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button
            onClick={() => {
              console.log('Parça Kayıtları butonu tıklandı!');
              setParcaKayitlariModalOpen(true);
            }}
            variant="outlined"
            color="secondary"
            startIcon={<FolderIcon />}
            sx={{ mr: 1, bgcolor: 'lightblue' }}
            disabled={loading}
          >
            Parça Kayıtları
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Güncelleniyor...' : 'Güncelle'}
          </Button>
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

export default ParcaDuzenleForm;
