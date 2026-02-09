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
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import * as notlarService from '../../services/notlarService';

const NotEkleme = ({ acik, onKapat, onNotEklendi, kategoriler = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resimFiles, setResimFiles] = useState([]);
  const [resimPreviews, setResimPreviews] = useState([]);
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

  // Dialog kapanırken formu temizle
  useEffect(() => {
    if (!acik) {
      formik.resetForm();
      setResimFiles([]);
      setResimPreviews([]);
      setError(null);
      setLoading(false);
    }
  }, [acik]);

  // Auto-save draft functionality
  useEffect(() => {
    if (acik && (formik.values.baslik || formik.values.icerik)) {
      const draft = {
        baslik: formik.values.baslik,
        icerik: formik.values.icerik,
        kategori_id: formik.values.kategori_id,
        timestamp: Date.now()
      };
      localStorage.setItem('notlar_draft', JSON.stringify(draft));
    }
  }, [formik.values.baslik, formik.values.icerik, formik.values.kategori_id, acik]);

  // Load draft on component mount
  useEffect(() => {
    if (acik) {
      const draft = localStorage.getItem('notlar_draft');
      if (draft) {
        try {
          const draftData = JSON.parse(draft);
          // Sadece 24 saat içindeki draft'ları yükle
          if (Date.now() - draftData.timestamp < 24 * 60 * 60 * 1000) {
            formik.setValues({
              ...formik.values,
              baslik: draftData.baslik || '',
              icerik: draftData.icerik || '',
              kategori_id: draftData.kategori_id || ''
            });
          }
        } catch (error) {
          console.error('Draft yükleme hatası:', error);
        }
      }
    }
  }, [acik]);

  // Form submit handler
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);

      // Form data hazırla
      const formData = {
        baslik: values.baslik.trim(),
        icerik: values.icerik.trim(),
        kategori_id: values.kategori_id || null,
        olusturma_tarihi: values.olusturma_tarihi?.toISOString()
      };

      // API çağrısı
      const response = await notlarService.createNot(formData, resimFiles);

      if (response.success) {
        // Draft'ı temizle
        localStorage.removeItem('notlar_draft');
        
        // Callback'i çağır
        if (onNotEklendi) {
          onNotEklendi(response.data);
        }
        
        // Dialog'u kapat
        onKapat();
      }
    } catch (error) {
      console.error('Not ekleme hatası:', error);
      setError(error.message || 'Not eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Resim dosyaları seçme handler'ı
  const handleFilesSelect = async (files) => {
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

      // Çok fazla dosya kontrolü
      if (resimFiles.length + validFiles.length >= 10) {
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
      setResimFiles(prev => [...prev, ...validFiles]);
      setResimPreviews(prev => [...prev, ...previews]);
      setError(null);
    }
  };

  // Dosya input change handler
  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files || []);
    handleFilesSelect(files);
    // Input'u temizle ki aynı dosya tekrar seçilebilsin
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
      handleFilesSelect(imageFiles);
    }
  };

  // Belirli bir resim silme handler'ı
  const handleRemoveImage = (index) => {
    setResimFiles(prev => prev.filter((_, i) => i !== index));
    setResimPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Tüm resimleri silme handler'ı
  const handleRemoveAllImages = () => {
    setResimFiles([]);
    setResimPreviews([]);
  };

  // Dialog kapatma handler'ı
  const handleClose = () => {
    if (formik.dirty) {
      if (window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?')) {
        onKapat();
      }
    } else {
      onKapat();
    }
  };

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
            Yeni Not Ekle
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
              autoFocus
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

            {/* Kategori ve Tarih - Yan yana */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: isMobile ? 'column' : 'row' }}>
              {/* Kategori */}
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

              {/* Tarih */}
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

            {/* Resim Upload Alanı */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Resimler (Opsiyonel) - En fazla 10 adet
              </Typography>
              
              {/* Upload Alanı */}
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: dragOver ? `2px dashed ${theme.palette.primary.main}` : '2px dashed #ccc',
                  backgroundColor: dragOver ? theme.palette.action.hover : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  mb: resimPreviews.length > 0 ? 2 : 0,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Resim dosyalarını buraya sürükleyin veya tıklayın
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  JPEG, PNG, GIF, WebP formatları desteklenmektedir (Max: 10MB per dosya)
                </Typography>
                {resimFiles.length > 0 && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                    {resimFiles.length}/10 resim seçildi
                  </Typography>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                  disabled={loading}
                />
              </Paper>

              {/* Seçili Resimler */}
              {resimPreviews.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      Seçili Resimler ({resimPreviews.length})
                    </Typography>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={handleRemoveAllImages}
                      disabled={loading}
                    >
                      Tümünü Sil
                    </Button>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: 1,
                    maxHeight: 300,
                    overflowY: 'auto'
                  }}>
                    {resimPreviews.map((item, index) => (
                      <Paper key={item.id} variant="outlined" sx={{ p: 1, position: 'relative' }}>
                        <Box
                          component="img"
                          src={item.preview}
                          alt={`Önizleme ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 1,
                            display: 'block'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          disabled={loading}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.7)'
                            }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            textAlign: 'center', 
                            mt: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.file.name}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Draft bildirimi */}
            {formik.values.baslik || formik.values.icerik ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Değişiklikleriniz otomatik olarak taslak olarak kaydediliyor.
                </Typography>
              </Alert>
            ) : null}
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
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default NotEkleme;
