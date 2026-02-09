import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  ButtonGroup,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as TeslimIcon,
  LocalShipping as ShippingIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Assignment as DokumanIcon,
  OpenInNew as OpenInNewIcon,
  CloudUpload as CloudUploadIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Image as ImageIcon,
  Receipt as IrsaliyeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SevkiyatTeslimAlModal = ({ open, onClose, onSuccess, sevkiyatId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [personeller, setPersoneller] = useState([]);
  const [secilenPersonel, setSecilenPersonel] = useState('');
  const [teslimNotlari, setTeslimNotlari] = useState('');
  const [teslimTarihi, setTeslimTarihi] = useState(new Date().toISOString().split('T')[0]);
  const [onayAdedi, setOnayAdedi] = useState('');
  const [sevkiyatBilgileri, setSevkiyatBilgileri] = useState(null);
  const [sevkiyatKalemleri, setSevkiyatKalemleri] = useState([]);
  const [error, setError] = useState('');
  const [teslimResimleri, setTeslimResimleri] = useState([]);
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    if (open) {
      loadPersoneller();
      if (sevkiyatId) {
        loadSevkiyatBilgileri();
      }
    }
  }, [open, sevkiyatId]);

  const loadPersoneller = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/personel?aktif=true`);
      setPersoneller(response.data.data || response.data || []);
    } catch (err) {
      console.error('Personeller yüklenemedi:', err);
      setError('Personel listesi yüklenemedi');
    }
  };

  const loadSevkiyatBilgileri = async () => {
    try {
      // Sevkiyat bilgilerini getir
      const sevkiyatResponse = await axios.get(`${API_BASE_URL}/sevkiyat/${sevkiyatId}`);
      setSevkiyatBilgileri(sevkiyatResponse.data);

      // Sevkiyat kalemlerini getir
      try {
        const kalemlerResponse = await axios.get(`${API_BASE_URL}/sevkiyat-kalemleri/${sevkiyatId}/kalemler`);
        setSevkiyatKalemleri(kalemlerResponse.data || []);

        // Toplam adedi hesapla ve ön doldur
        const toplamAdet = kalemlerResponse.data?.reduce((sum, kalem) => {
          return sum + (parseFloat(kalem.adet) || 0);
        }, 0) || 0;

        if (toplamAdet > 0) {
          setOnayAdedi(toplamAdet.toString());
        }
      } catch (kalemlerErr) {
        console.warn('Sevkiyat kalemleri yüklenemedi:', kalemlerErr);
        // Kalemler yüklenemezse, mevcut onay adedini kullan
        if (sevkiyatResponse.data?.onay_adedi) {
          setOnayAdedi(sevkiyatResponse.data.onay_adedi);
        }
      }
    } catch (err) {
      console.error('Sevkiyat bilgileri yüklenemedi:', err);
      setError('Sevkiyat bilgileri alınamadı');
    }
  };

  const handleTeslimAl = async () => {
    if (!secilenPersonel) {
      setError('Lütfen teslim alan personeli seçiniz');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Önce resimleri yükle
      const resimUploadSuccess = await handleResimUpload();
      if (!resimUploadSuccess && teslimResimleri.length > 0) {
        return; // Resim yükleme başarısız olduysa durdur
      }

      const teslimData = {
        personel_id: secilenPersonel,
        teslim_notlari: teslimNotlari,
        teslim_tarihi: teslimTarihi,
        onay_adedi: onayAdedi || null
      };

      const response = await axios.post(`${API_BASE_URL}/sevkiyat/${sevkiyatId}/teslim-al`, teslimData);

      if (response.data.success) {
        onSuccess(response.data);
        handleClose();
      } else {
        setError(response.data.message || 'Teslim alma işlemi başarısız');
      }
    } catch (err) {
      console.error('Teslim alma hatası:', err);
      setError(err.response?.data?.message || 'Teslim alma işlemi sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleIrsaliyeGir = async () => {
    if (!sevkiyatId) {
      setError('Sevkiyat bilgisi bulunamadı');
      return;
    }

    // Sevkiyat bilgilerini state'e geçerek İrsaliyeler sayfasına yönlendir
    // İrsaliyeler sayfası açıldığında upload dialog'u otomatik açılacak
    navigate('/irsaliyeler', {
      state: {
        openUploadDialog: true,
        sevkiyatId: sevkiyatId,
        sevkiyatBilgileri: sevkiyatBilgileri,
        sevkiyatKalemleri: sevkiyatKalemleri,
        onayAdedi: onayAdedi
      }
    });
  };

  // Resim yükleme fonksiyonları
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Dosya validasyonu
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isValidType) {
        setError(`${file.name} geçerli bir resim dosyası değil`);
        return false;
      }

      if (!isValidSize) {
        setError(`${file.name} dosyası 10MB'dan büyük`);
        return false;
      }

      return true;
    });

    setTeslimResimleri([...teslimResimleri, ...validFiles]);
  };

  const handleFileClear = (index) => {
    const yeniResimler = [...teslimResimleri];
    yeniResimler.splice(index, 1);
    setTeslimResimleri(yeniResimler);
  };

  const handleResimUpload = async () => {
    if (teslimResimleri.length === 0) return true; // Resim yoksa devam et

    setUploading(true);

    try {
      const formData = new FormData();
      teslimResimleri.forEach(file => {
        formData.append('resimler', file);
      });

      const response = await axios.post(
        `${API_BASE_URL}/sevkiyat/resimler/${sevkiyatId}/resimler`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.uploaded_files) {
        console.log('Resimler yüklendi:', response.data.uploaded_files);
      }

      return true;
    } catch (err) {
      console.error('Resim yükleme hatası:', err);
      setError(err.response?.data?.error || 'Resimler yüklenemedi');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPersoneller([]);
    setSecilenPersonel('');
    setTeslimNotlari('');
    setTeslimTarihi(new Date().toISOString().split('T')[0]);
    setOnayAdedi('');
    setSevkiyatBilgileri(null);
    setSevkiyatKalemleri([]);
    setError('');
    setTeslimResimleri([]);
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 2,
                color: 'success.main'
              }}
            >
              <TeslimIcon />
            </Box>
            <Typography variant="h6">
              Sevkiyat Teslim Alma
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Sevkiyat Bilgileri */}
        {sevkiyatBilgileri && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Sevkiyat Bilgileri
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>Sevkiyat No:</strong> {sevkiyatBilgileri.sevkiyat_no}
              </Typography>
              <Typography variant="body2">
                <strong>Firma:</strong> {sevkiyatBilgileri.firma_adi}
              </Typography>
              {sevkiyatBilgileri.talep_kodu && (
                <Typography variant="body2">
                  <strong>Talep Kodu:</strong> {sevkiyatBilgileri.talep_kodu}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Durum:</strong>
                <span style={{
                  color: sevkiyatBilgileri.durum === 'beklemede' ? '#ff9800' : 'inherit'
                }}>
                  {' '}{sevkiyatBilgileri.durum?.replace('_', ' ').toUpperCase()}
                </span>
              </Typography>
            </Box>
          </Box>
        )}

        {/* Sevkiyat Kalemleri ve Parça/Stok Kartı Bilgileri */}
        {sevkiyatKalemleri.length > 0 && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <DokumanIcon sx={{ mr: 1 }} />
              Sevkiyat Kalemleri
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sevkiyatKalemleri.map((kalem, index) => {
                const isParca = kalem.kalem_tipi === 'parca' && kalem.parca_kodu;
                const hasStokKarti = kalem.kalem_tipi === 'stok_karti' && kalem.stok_karti_id;

                return (
                  <Card key={index} sx={{ border: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                    <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                      <Grid container spacing={2} alignItems="center">
                        {/* Kalem Bilgisi */}
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                              Kalem {index + 1}
                            </Typography>
                            <Chip
                              label={isParca ? 'Parça' : 'Stok Kartı'}
                              size="small"
                              color={isParca ? 'primary' : 'secondary'}
                            />
                          </Box>

                          <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                            {kalem.kalem_adi || `Kalem ${index + 1}`}
                          </Typography>

                          {kalem.kalem_detay && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {kalem.kalem_detay}
                            </Typography>
                          )}

                          <Typography variant="body2" color="text.secondary">
                            <strong>Adet:</strong> {parseFloat(kalem.adet || 0).toLocaleString('tr-TR')} {kalem.birim || 'adet'}
                          </Typography>
                        </Grid>

                        {/* Detay Link'i */}
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {(isParca || hasStokKarti) && (
                              <Button
                                size="small"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => {
                                  if (isParca) {
                                    window.open(`/parcalar/${kalem.parca_kodu}`, '_blank');
                                  } else if (hasStokKarti) {
                                    window.open(`/stok-kartlari/${kalem.stok_karti_id}`, '_blank');
                                  }
                                }}
                                sx={{ minWidth: 'auto' }}
                              >
                                {isParca ? 'Parça Kartı' : 'Stok Kartı'}
                              </Button>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Bilgilendirme Mesajı */}
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          icon={<ShippingIcon />}
        >
          <Typography variant="body2">
            Bu sevkiyatı teslim alarak personel durumunu ve ilgili talebin durumunu otomatik olarak "tamamlandı" olarak güncelleyebilirsiniz.
          </Typography>
        </Alert>

        {/* Teslim Alma Formu */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Teslim Alan Personel */}
          <FormControl fullWidth>
            <InputLabel>Teslim Alan Personel *</InputLabel>
            <Select
              value={secilenPersonel}
              label="Teslim Alan Personel *"
              onChange={(e) => setSecilenPersonel(e.target.value)}
              disabled={loading}
              startAdornment={
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              }
            >
              <MenuItem value="">
                <em>Personel Seçiniz</em>
              </MenuItem>
              {personeller.map((personel) => (
                <MenuItem key={personel.id} value={personel.id}>
                  {personel.personel_adi}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Teslim Tarihi */}
          <TextField
            fullWidth
            type="date"
            label="Teslim Tarihi"
            value={teslimTarihi}
            onChange={(e) => setTeslimTarihi(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={loading}
          />

          {/* Onay Adedi */}
          <TextField
            fullWidth
            type="number"
            label="Teslim Edilen Adet"
            value={onayAdedi}
            onChange={(e) => setOnayAdedi(e.target.value)}
            placeholder="Sevkiyat kalemlerinden hesaplanan toplam adet..."
            disabled={loading}
            InputProps={{
              endAdornment: <InputAdornment position="end">Adet</InputAdornment>,
              inputProps: { min: 1 }
            }}
            helperText="Gerekirse değiştirebilirsiniz"
          />

          {/* Teslim Notları */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Teslim Notları"
            placeholder="Teslim alma ile ilgili notlarınızı yazabilirsiniz (opsiyonel)..."
            value={teslimNotlari}
            onChange={(e) => setTeslimNotlari(e.target.value)}
            disabled={loading || uploading}
          />

          {/* Teslim Resimleri Yükleme */}
          <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PhotoCameraIcon sx={{ mr: 1, color: 'primary.main' }} />
              Teslim Alma Resimleri
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Gelen parça veya ham malzemelerin fotoğraflarını çekerek teslimata ekleyebilirsiniz.
            </Typography>

            {/* Resim Yükleme Butonu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={loading || uploading}
                size="medium"
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  minWidth: '120px',
                  minHeight: '40px'
                }}
              >
                📷 Resim Seç
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading || uploading}
                />
              </Button>

              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                📸 Maksimum 10MB, JPEG/PNG formatında
              </Typography>
            </Box>

            {/* Yüklenen Resimler */}
            {teslimResimleri.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Seçilen Resimler ({teslimResimleri.length}):
                </Typography>
                <Grid container spacing={1}>
                  {teslimResimleri.map((file, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ display: 'flex', alignItems: 'center', p: 1, border: '1px solid #e0e0e0' }}>
                        <ImageIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap title={file.name}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => handleFileClear(index)}
                          size="small"
                          disabled={loading || uploading}
                          sx={{ ml: 1 }}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Upload Progress */}
            {uploading && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="primary">
                  Resimler yükleniyor...
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
        <Box>
          <Button
            onClick={handleIrsaliyeGir}
            variant="outlined"
            color="warning"
            disabled={loading || uploading}
            startIcon={<IrsaliyeIcon />}
            size="small"
          >
            İrsaliye Gir
          </Button>
        </Box>
        <Box>
          <Button onClick={handleClose} disabled={loading || uploading}>
            İptal
          </Button>
          <Button
            onClick={handleTeslimAl}
            variant="contained"
            color="success"
            disabled={loading || uploading || !secilenPersonel}
            startIcon={loading || uploading ? <CircularProgress size={16} /> : <TeslimIcon />}
          >
            {loading ? 'İşleniyor...' : uploading ? 'Resimler Yükleniyor...' : 'Teslim Al ve Tamamla'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SevkiyatTeslimAlModal;