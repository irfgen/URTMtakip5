import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import ParcaKayitlariModal from './ParcaKayitlariModal';
import StokKartiSecici from './StokKartiSecici';
import StokKartiForm from './StokKartlari/StokKartiForm';

const ParcaDuzenleFormu = ({ open, onClose, parca, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [teknikResimFile, setTeknikResimFile] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [parcaKayitlariModalOpen, setParcaKayitlariModalOpen] = useState(false);
  const [stokKartiSeciciOpen, setStokKartiSeciciOpen] = useState(false);
  const [secilenStokKarti, setSecilenStokKarti] = useState(null);
  const [stokKartiDuzenleModal, setStokKartiDuzenleModal] = useState({ open: false, stokKarti: null });

  // Form verilerini parça değiştiğinde güncelleyelim
  useEffect(() => {
    // Tüm alanlar için varsayılan değerler
    const defaultData = {
      parcaKodu: '',
      parcaAdi: '',
      kategori: '',
      stokAdeti: 0,
      kritik_stok: 0,
      tedarikBedeli: 0,
      imalMi: false,
      hamMalzemeCinsi: '',
      hamMalzemeOlculeri: '',
      stok_karti_id: null,
      imalat_prosedur_no: '',
      fasonMaliyeti: 0,
      sirketIciMaliyeti: 0,
      setupSayisi: 0,
      cncIslemeSuresi: 0,
      siyah: false,
      teknik_resim_path: '',
      foto_path: ''
    };
    if (parca) {
      setFormData({
        ...defaultData,
        ...parca,
        parcaKodu: parca.parcaKodu || '',
        parcaAdi: parca.parcaAdi || '',
        kategori: parca.kategori || '',
        stokAdeti: parca.stokAdeti ?? 0,
        kritik_stok: parca.kritik_stok ?? 0,
        tedarikBedeli: parca.tedarikBedeli ?? 0,
        imalMi: parca.imalMi ?? false,
        hamMalzemeCinsi: parca.hamMalzemeCinsi || '',
        hamMalzemeOlculeri: parca.hamMalzemeOlculeri || '',
        stok_karti_id: parca.stok_karti_id || null,
        imalat_prosedur_no: parca.imalat_prosedur_no || '',
        fasonMaliyeti: parca.fasonMaliyeti ?? 0,
        sirketIciMaliyeti: parca.sirketIciMaliyeti ?? 0,
        setupSayisi: parca.setupSayisi ?? 0,
        cncIslemeSuresi: parca.cncIslemeSuresi ?? 0,
        siyah: parca.siyah ?? false,
        teknik_resim_path: parca.teknik_resim_path || '',
        foto_path: parca.foto_path || ''
      });
    } else {
      setFormData(defaultData);
    }
    setError('');
    setSuccess(false);
  }, [parca]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Input tipine göre değer belirleme
    const inputValue = type === 'checkbox' ? checked : 
                       type === 'number' ? parseFloat(value) : 
                       value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: inputValue
    }));
  };

  // Stok kartı seçme fonksiyonu
  const handleStokKartiSec = (stokKarti) => {
    setSecilenStokKarti(stokKarti);
    setFormData(prev => ({
      ...prev,
      stok_karti_id: stokKarti.id,
      // Eski alanları da güncelle (backward compatibility)
      hamMalzemeCinsi: stokKarti.malzeme_cinsi,
      hamMalzemeOlculeri: stokKarti.olculeriFormatted || stokKarti.kesit
    }));
    setStokKartiSeciciOpen(false);
  };

  // Stok kartı bağlantısını kaldırma
  const handleStokKartiBaglantiKaldir = () => {
    setSecilenStokKarti(null);
    setFormData(prev => ({
      ...prev,
      stok_karti_id: null
    }));
  };

  // Seçilen stok kartını yükle
  useEffect(() => {
    if (parca && parca.stokKarti) {
      setSecilenStokKarti(parca.stokKarti);
    } else {
      setSecilenStokKarti(null);
    }
  }, [parca]);

  const handleFileChange = (e, fileType) => {
    if (e.target.files && e.target.files[0]) {
      if (fileType === 'teknikResim') {
        setTeknikResimFile(e.target.files[0]);
      } else if (fileType === 'foto') {
        setFotoFile(e.target.files[0]);
      }
    }
  };

  const handleFileClear = (fileType) => {
    if (fileType === 'teknikResim') {
      setTeknikResimFile(null);
    } else if (fileType === 'foto') {
      setFotoFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      
      // Form verilerini oluşturalım
      let updatedParca = { ...formData };        // Dosya yüklemeleri için FormData oluşturuyoruz
        if (teknikResimFile || fotoFile) {
          const formDataForFiles = new FormData();
          
          // Formda parcaKodu ekleyelim
          formDataForFiles.append("parcaKodu", parca.parcaKodu);
          
          if (teknikResimFile) {
            formDataForFiles.append("teknik", teknikResimFile);
          }
          
          if (fotoFile) {
            formDataForFiles.append("foto", fotoFile);
          }
          
          // Dosyaları önce yükleyelim
          const fileUploadResponse = await axios.post('/api/upload/parca', formDataForFiles);
          
          // Yüklenen dosya yollarını updatedParca'ya ekleyelim
          if (fileUploadResponse.data.teknik_resim_path) {
            updatedParca.teknik_resim_path = fileUploadResponse.data.teknik_resim_path;
          }
          
          if (fileUploadResponse.data.foto_path) {
            updatedParca.foto_path = fileUploadResponse.data.foto_path;
          }
        }
      
      // Şimdi parçayı güncelleyelim
      const response = await axios.put(`/api/parcalar/${parca.parcaKodu}`, updatedParca);
      
      // Diğer sayfaları bilgilendirmek için custom event dispatch et
      const updateEvent = new CustomEvent('parcaUpdated', {
        detail: {
          updatedParca: response.data,
          parcaKodu: parca.parcaKodu
        }
      });
      window.dispatchEvent(updateEvent);
      
      setSuccess(true);
      setTimeout(() => {
        onUpdateSuccess(response.data);
      }, 1500);
      
    } catch (err) {
      console.error("Parça güncelleme hatası:", err);
      setError(err.response?.data?.error || "Parça güncellenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Parça Düzenle: {formData.parcaKodu}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>Parça başarıyla güncellendi!</Alert>}
            
            <Grid container spacing={2}>
              {/* Parça Kodu - Değiştirilemez, Primary Key */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Parça Kodu"
                  name="parcaKodu"
                  value={formData.parcaKodu}
                  fullWidth
                  disabled
                  variant="filled"
                  helperText="Parça kodu değiştirilemez"
                />
              </Grid>
              
              {/* Parça Adı */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Parça Adı"
                  name="parcaAdi"
                  value={formData.parcaAdi || ''}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              
              {/* Kategori */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Kategori"
                  name="kategori"
                  value={formData.kategori || ''}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              
              {/* Stok Adedi */}
              <Grid item xs={12} md={3}>
                <TextField
                  label="Stok Adedi"
                  name="stokAdeti"
                  type="number"
                  value={formData.stokAdeti || 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              {/* Kritik Stok */}
              <Grid item xs={12} md={3}>
                <TextField
                  label="Kritik Stok"
                  name="kritik_stok"
                  type="number"
                  value={formData.kritik_stok || 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              {/* Tedarik Bedeli */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Tedarik Bedeli"
                  name="tedarikBedeli"
                  type="number"
                  value={formData.tedarikBedeli || 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, step: "0.01" }
                  }}
                />
              </Grid>
              
              {/* İmal Mi */}
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.imalMi || false}
                      onChange={handleInputChange}
                      name="imalMi"
                    />
                  }
                  label="İmal Edilen Parça"
                />
              </Grid>
              
              {/* Siyah */}
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.siyah || false}
                      onChange={handleInputChange}
                      name="siyah"
                    />
                  }
                  label="Siyah"
                />
              </Grid>
              
              {/* Ham Malzeme Stok Kartı */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Ham Malzeme Stok Kartı
                  </Typography>
                  
                  {secilenStokKarti ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Chip
                          icon={<LinkIcon />}
                          label="Stok Kartı Bağlı"
                          color="success"
                          size="small"
                        />
                        <Button
                          startIcon={<SearchIcon />}
                          variant="outlined"
                          size="small"
                          onClick={() => setStokKartiSeciciOpen(true)}
                        >
                          Değiştir
                        </Button>
                        <Button
                          startIcon={<EditIcon />}
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => setStokKartiDuzenleModal({ open: true, stokKarti: secilenStokKarti })}
                        >
                          Düzenle
                        </Button>
                        <Button
                          startIcon={<LinkOffIcon />}
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={handleStokKartiBaglantiKaldir}
                        >
                          Kaldır
                        </Button>
                      </Box>
                      
                      <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                          {secilenStokKarti.olculeriFormatted || secilenStokKarti.kesit}
                          {secilenStokKarti.boy && ` x ${secilenStokKarti.boy}mm`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          <strong>Malzeme:</strong> {secilenStokKarti.malzeme_cinsi}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          <strong>Stok:</strong> {secilenStokKarti.adet} adet
                          {secilenStokKarti.kritik_stok_miktari > 0 && ` (Kritik: ${secilenStokKarti.kritik_stok_miktari})`}
                        </Typography>
                        {secilenStokKarti.lokasyon && (
                          <Typography variant="body2" color="text.secondary" display="block">
                            <strong>Lokasyon:</strong> {secilenStokKarti.lokasyon}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formData.imalMi ? 'Bu parça için ham malzeme stok kartı seçilmedi' : 'İmal edilmeyen parçalar için stok kartı gerekmez'}
                      </Typography>
                      {formData.imalMi && (
                        <Button
                          startIcon={<SearchIcon />}
                          variant="contained"
                          onClick={() => setStokKartiSeciciOpen(true)}
                        >
                          Stok Kartı Seç
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
              
              {/* İmalat Prosedür No */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="İmalat Prosedür No"
                  name="imalat_prosedur_no"
                  value={formData.imalat_prosedur_no || ''}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={!formData.imalMi}
                />
              </Grid>
              
              {/* Setup Sayısı */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Setup Sayısı"
                  name="setupSayisi"
                  type="number"
                  value={formData.setupSayisi || 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                  disabled={!formData.imalMi}
                />
              </Grid>
              
              {/* CNC İşleme Süresi */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="CNC İşleme Süresi (dk)"
                  name="cncIslemeSuresi"
                  type="number"
                  value={formData.cncIslemeSuresi || 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                  disabled={!formData.imalMi}
                />
              </Grid>
              
              {/* Fason Maliyeti */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fason Maliyeti"
                  name="fasonMaliyeti"
                  type="number"
                  value={formData.fasonMaliyeti || 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, step: "0.01" }
                  }}
                />
              </Grid>
              
              {/* Şirket İçi Maliyeti */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Şirket İçi Maliyeti"
                  name="sirketIciMaliyeti"
                  type="number"
                  value={formData.sirketIciMaliyeti || 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, step: "0.01" }
                  }}
                />
              </Grid>
              
              {/* Teknik Resim Dosyası */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Teknik Resim Dosyası
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                  >
                    Dosya Seç
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'teknikResim')}
                    />
                  </Button>
                  
                  {teknikResimFile && (
                    <>
                      <Typography variant="body2" sx={{ ml: 1, flexGrow: 1 }}>
                        {teknikResimFile.name}
                      </Typography>
                      <IconButton onClick={() => handleFileClear('teknikResim')} size="small">
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
                {formData.teknik_resim_path && !teknikResimFile && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Mevcut dosya: {formData.teknik_resim_path.split('/').pop()}
                  </Typography>
                )}
              </Grid>
              
              {/* Fotoğraf Dosyası */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Parça Fotoğrafı
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                  >
                    Dosya Seç
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'foto')}
                    />
                  </Button>
                  
                  {fotoFile && (
                    <>
                      <Typography variant="body2" sx={{ ml: 1, flexGrow: 1 }}>
                        {fotoFile.name}
                      </Typography>
                      <IconButton onClick={() => handleFileClear('foto')} size="small">
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
                {formData.foto_path && !fotoFile && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Mevcut fotoğraf: {formData.foto_path.split('/').pop()}
                  </Typography>
                )}
                
                {/* Mevcut fotoğraf önizleme */}
                {formData.foto_path && !fotoFile && (
                  <Box sx={{ mt: 1, width: '100px', height: '100px', border: '1px solid #eee', p: 1 }}>
                    <img 
                      src={formData.foto_path} 
                      alt="Parça Fotoğrafı" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </form>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button 
          onClick={() => setParcaKayitlariModalOpen(true)}
          variant="outlined"
          color="secondary"
          sx={{ mr: 1 }}
        >
          Parça Kayıtları
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
          disabled={saving}
          startIcon={saving && <CircularProgress size={16} />}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
    
    {/* Parça Kayıtları Modal */}
    <ParcaKayitlariModal
      open={parcaKayitlariModalOpen}
      onClose={() => setParcaKayitlariModalOpen(false)}
      parcaKodu={formData.parcaKodu || parca?.parcaKodu}
    />
    
    {/* Stok Kartı Seçici Modal */}
    <StokKartiSecici
      open={stokKartiSeciciOpen}
      onClose={() => setStokKartiSeciciOpen(false)}
      onSelect={handleStokKartiSec}
      currentParca={parca}
      aramaMetni={formData.hamMalzemeOlculeri || ''}
    />

    {/* Stok Kartı Düzenle Modal */}
    <StokKartiForm
      open={stokKartiDuzenleModal.open}
      onClose={() => setStokKartiDuzenleModal({ open: false, stokKarti: null })}
      stokKarti={stokKartiDuzenleModal.stokKarti}
      onSuccess={async (data, action) => {
        // Stok kartı güncellendiğinde, parça formundaki stok kartı bilgilerini güncelle
        if (action === 'update' && secilenStokKarti && secilenStokKarti.id === data.id) {
          setSecilenStokKarti(data);
          setFormData(prev => ({
            ...prev,
            hamMalzemeCinsi: data.malzeme_cinsi,
            hamMalzemeOlculeri: data.olculeriFormatted || data.kesit
          }));
        }

        // Global stok kartı güncelleme event'ini tetikle
        window.dispatchEvent(new CustomEvent('stokKartiUpdated', {
          detail: { updatedStokKarti: data, action: 'update' }
        }));
      }}
    />
    </>
  );
};

export default ParcaDuzenleFormu;
