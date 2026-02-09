import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Save as SaveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import * as notlarService from '../../services/notlarService';

const NotDuzenle = ({ acik, onKapat, onNotGuncellendi, not, kategoriler = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mevcutResimler, setMevcutResimler] = useState([]);
  const [yeniResimFiles, setYeniResimFiles] = useState([]);
  const [yeniResimPreviews, setYeniResimPreviews] = useState([]);
  const [silincekResimler, setSilincekResimler] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  // Validation schema
  const validationSchema = Yup.object({
    baslik: Yup.string()
      .min(1, 'Başlık en az 1 karakter olmalıdır')
      .max(500, 'Başlık en fazla 500 karakter olabilir')
      .required('Başlık zorunludur'),
    icerik: Yup.string()
      .max(10000, 'İçerik en fazla 10000 karakter olabilir'),
    kategori_id: Yup.number()
      .nullable()
      .positive('Geçerli bir kategori seçiniz'),
    olusturma_tarihi: Yup.date()
      .nullable()
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      baslik: '',
      icerik: '',
      kategori_id: '',
      olusturma_tarihi: new Date()
    },
    validationSchema,
    onSubmit: async (values) => {
      await handleSubmit(values);
    }
  });

  // Not değiştiğinde formu doldur
  useEffect(() => {
    if (not && acik) {
      formik.setValues({
        baslik: not.baslik || '',
        icerik: not.icerik || '',
        kategori_id: not.kategori_id || '',
        olusturma_tarihi: not.olusturma_tarihi ? new Date(not.olusturma_tarihi) : new Date()
      });
      setMevcutResimler(not.resimler || []);
      setYeniResimFiles([]);
      setYeniResimPreviews([]);
      setSilincekResimler([]);
    }
  }, [not, acik]);

  // Dialog kapanırken temizle
  useEffect(() => {
    if (!acik) {
      setError(null);
      setLoading(false);
      setMevcutResimler([]);
      setYeniResimFiles([]);
      setYeniResimPreviews([]);
      setSilincekResimler([]);
    }
  }, [acik]);

  // Form submit handler
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);

      // Yeni resimleri ekle
      const yeniResimleriEkle = async () => {
        if (yeniResimFiles.length > 0) {
          try {
            await notlarService.addNotResimler(not.id, yeniResimFiles);
          } catch (error) {
            console.error('Yeni resim ekleme hatası:', error);
          }
        }
      };

      // Not bilgilerini güncelle
      const formData = {
        baslik: values.baslik.trim(),
        icerik: values.icerik.trim(),
        kategori_id: values.kategori_id || null,
        olusturma_tarihi: values.olusturma_tarihi?.toISOString()
      };

      // API çağrıları (resim silme artık hemen yapılıyor)
      await Promise.all([
        notlarService.updateNot(not.id, formData),
        yeniResimleriEkle()
      ]);

      // Dialog'u kapat
      onKapat();
      
      // Güncellenen notu getir ve callback'i çağır
      if (onNotGuncellendi) {
        try {
          const response = await notlarService.getNotById(not.id);
          if (response.success) {
            onNotGuncellendi(response.data);
          } else {
            // API'den gelen veri yoksa manuel güncelle
            onNotGuncellendi({ ...not, ...formData });
          }
        } catch (error) {
          console.error('Güncellenmiş not getirme hatası:', error);
          // Hata olsa bile callback'i çağır
          onNotGuncellendi({ ...not, ...formData });
        }
      }
    } catch (error) {
      console.error('Not güncelleme hatası:', error);
      setError(error.message || 'Not güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Yeni resim dosyaları seçme handler'ı
  const handleYeniFilesSelect = async (files) => {
    if (!files || files.length === 0) return;

    const validFiles = [];
    const previews = [];

    for (const file of files) {
      // Dosya validasyonu
      const validation = notlarService.validateImageFile(file);
      if (!validation.valid) {
        setError(`${file.name}: ${validation.message}`);
        continue;
      }

      // Toplam resim sayısı kontrolü
      const toplamResim = mevcutResimler.length + yeniResimFiles.length + validFiles.length;
      if (toplamResim >= 10) {
        setError('En fazla 10 resim yükleyebilirsiniz');
        break;
      }

      try {
        const preview = await notlarService.createImagePreview(file);
        validFiles.push(file);
        previews.push({
          file: file,
          preview: preview,
          id: Date.now() + Math.random()
        });
      } catch (error) {
        console.error('Resim önizleme hatası:', error);
        setError(`${file.name}: Önizleme oluşturulamadı`);
      }
    }

    if (validFiles.length > 0) {
      setYeniResimFiles(prev => [...prev, ...validFiles]);
      setYeniResimPreviews(prev => [...prev, ...previews]);
      setError(null);
    }
  };

  // Dosya input change handler
  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files || []);
    handleYeniFilesSelect(files);
    event.target.value = '';
  };

  // Drag & drop handlers
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleYeniFilesSelect(imageFiles);
    }
  };

  // Mevcut resim silme handler'ı
  const handleMevcutResimSil = async (resimId) => {
    try {
      setLoading(true);
      await notlarService.deleteNotResim(not.id, resimId);
      
      // UI'dan kaldır
      setMevcutResimler(prev => prev.filter(resim => resim.id !== resimId));
      setError(null);
    } catch (error) {
      console.error('Resim silme hatası:', error);
      setError('Resim silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Mevcut resim geri alma handler'ı (artık kullanılmıyor)
  const handleMevcutResimGeriAl = (resimId) => {
    // Bu fonksiyon artık kullanılmıyor çünkü resimler hemen siliniyor
    setSilincekResimler(prev => prev.filter(id => id !== resimId));
  };

  // Yeni resim silme handler'ı
  const handleYeniResimSil = (index) => {
    setYeniResimFiles(prev => prev.filter((_, i) => i !== index));
    setYeniResimPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Dialog kapatma handler'ı
  const handleClose = () => {
    if (formik.dirty || yeniResimFiles.length > 0) {
      if (window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?')) {
        onKapat();
      }
    } else {
      onKapat();
    }
  };

  if (!not) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Dialog
        open={acik}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            minHeight: isMobile ? '100vh' : '70vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1
          }}
        >
          <Typography variant="h6" component="span">
            Not Düzenle
          </Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers sx={{ px: isMobile ? 2 : 3 }}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Başlık */}
            <TextField
              fullWidth
              label="Başlık *"
              name="baslik"
              value={formik.values.baslik}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.baslik && Boolean(formik.errors.baslik)}
              helperText={formik.touched.baslik && formik.errors.baslik}
              sx={{ mb: 2 }}
              disabled={loading}
            />

            {/* İçerik */}
            <TextField
              fullWidth
              label="İçerik"
              name="icerik"
              value={formik.values.icerik}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.icerik && Boolean(formik.errors.icerik)}
              helperText={formik.touched.icerik && formik.errors.icerik}
              multiline
              rows={4}
              sx={{ mb: 2 }}
              disabled={loading}
              placeholder="Notunuzun detaylarını buraya yazabilirsiniz..."
            />

            {/* Kategori ve Tarih */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: isMobile ? 'column' : 'row' }}>
              <FormControl fullWidth>
                <InputLabel>Kategori</InputLabel>
                <Select
                  name="kategori_id"
                  value={formik.values.kategori_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.kategori_id && Boolean(formik.errors.kategori_id)}
                  label="Kategori"
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Kategori seçmeyin</em>
                  </MenuItem>
                  {kategoriler.map((kategori) => (
                    <MenuItem key={kategori.id} value={kategori.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: kategori.renk_kodu,
                            mr: 1
                          }}
                        />
                        {kategori.kategori_adi}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Oluşturma Tarihi"
                value={formik.values.olusturma_tarihi}
                onChange={(date) => formik.setFieldValue('olusturma_tarihi', date)}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.olusturma_tarihi && Boolean(formik.errors.olusturma_tarihi),
                    helperText: formik.touched.olusturma_tarihi && formik.errors.olusturma_tarihi
                  }
                }}
              />
            </Box>

            {/* Mevcut Resimler */}
            {mevcutResimler.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Mevcut Resimler
                </Typography>
                <Grid container spacing={2}>
                  {mevcutResimler.map((resim, index) => (
                    <Grid item xs={6} sm={4} md={3} key={resim.id}>
                      <Card sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={resim.resim_yolu}
                          alt={resim.resim_adi}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardActions sx={{ p: 1, justifyContent: 'center' }}>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleMevcutResimSil(resim.id)}
                            disabled={loading}
                            startIcon={<DeleteIcon />}
                          >
                            Sil
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Yeni Resimler */}
            {yeniResimPreviews.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Yeni Resimler
                </Typography>
                <Grid container spacing={2}>
                  {yeniResimPreviews.map((preview, index) => (
                    <Grid item xs={6} sm={4} md={3} key={preview.id}>
                      <Card sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={preview.preview}
                          alt={preview.file.name}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardActions sx={{ p: 1, justifyContent: 'center' }}>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleYeniResimSil(index)}
                            disabled={loading}
                            startIcon={<DeleteIcon />}
                          >
                            Sil
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Resim Upload Alanı */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Yeni Resim Ekle
              </Typography>
              
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: dragOver ? `2px dashed ${theme.palette.primary.main}` : '2px dashed #ccc',
                  backgroundColor: dragOver ? theme.palette.action.hover : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('edit-file-input').click()}
              >
                <AddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Yeni resim dosyalarını buraya sürükleyin veya tıklayın
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  JPEG, PNG, GIF, WebP formatları desteklenmektedir (Max: 10MB)
                </Typography>
                <input
                  id="edit-file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                  disabled={loading}
                />
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: isMobile ? 2 : 3, py: 2 }}>
            <Button
              onClick={handleClose}
              disabled={loading}
              color="inherit"
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !formik.values.baslik}
              startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {loading ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default NotDuzenle;
