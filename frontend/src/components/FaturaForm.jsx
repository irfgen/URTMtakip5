import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Collapse,
  Card,
  CardMedia,
  CardActions,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { faturaAPI } from '../services/api';

const validationSchema = yup.object({
  tedarikci_id: yup.number().required('Tedarikçi seçilmelidir'),
  fatura_no: yup.string().required('Fatura numarası zorunludur'),
  belge_tarih: yup.date().required('Belge tarihi zorunludur').nullable(),
  vade_tarihi: yup.date().nullable()
    .min(yup.ref('belge_tarih'), 'Vade tarihi belge tarihinden önce olamaz')
});

const FaturaForm = ({ open, onClose, onSubmit, initialData }) => {
  const [tedarikciler, setTedarikciler] = useState([]);
  const [kalemler, setKalemler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // AI Analiz state'leri
  const [faturaImage, setFaturaImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [aiDataLoaded, setAiDataLoaded] = useState(false);
  const fileInputRef = useRef(null);

  const formik = useFormik({
    initialValues: {
      tedarikci_id: initialData?.tedarikci_id || '',
      fatura_no: initialData?.fatura_no || '',
      belge_tarih: initialData?.belge_tarih ? new Date(initialData.belge_tarih) : null,
      vade_tarihi: initialData?.vade_tarihi ? new Date(initialData.vade_tarihi) : null,
      aciklama: initialData?.aciklama || ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSubmitting(true);
      setError('');

      try {
        // Boş kalemleri filtrele - sadece dolu olanları gönder
        // Backend validasyonu: sadece mal_hizmet_adi zorunlu, stok_kodu opsiyonel
        const doluKalemler = kalemler.filter(k =>
          k.mal_hizmet_adi?.trim()
        );

        const faturaData = {
          ...values,
          kalemler: doluKalemler.map(k => ({
            stok_kodu: k.stok_kodu?.trim() || '',
            mal_hizmet_adi: k.mal_hizmet_adi?.trim() || '',
            miktar: parseFloat(k.miktar) || 0,
            birim: k.birim || 'Adet',
            birim_fiyat: parseFloat(k.birim_fiyat) || 0,
            toplam_tutar: (parseFloat(k.miktar) || 0) * (parseFloat(k.birim_fiyat) || 0)
          }))
        };

        await onSubmit(faturaData);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Bir hata oluştu');
      } finally {
        setSubmitting(false);
      }
    }
  });

  // Fatura görüntüsünü yükle
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Dosya boyutu kontrolü (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Dosya boyutu çok büyük. Maksimum 10MB.');
      return;
    }

    // Görüntüyü base64'e çevir
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setFaturaImage(base64String);

      // AI analizi başlat
      await analyzeFatura(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Fatura analizi
  const analyzeFatura = async (imageBase64) => {
    setAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/faturalar/analiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          fatura_no: formik.values.fatura_no || ''
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analiz başarısız');
      }

      if (result.success && result.data) {
        const extractedData = result.data;

        // AI analizinden gelen veriyi forma yükle
        if (extractedData.fatura_no) {
          await formik.setFieldValue('fatura_no', extractedData.fatura_no);
        }
        if (extractedData.belge_tarih) {
          await formik.setFieldValue('belge_tarih', new Date(extractedData.belge_tarih));
        }
        if (extractedData.tedarikci_id) {
          await formik.setFieldValue('tedarikci_id', extractedData.tedarikci_id);
        }
        if (extractedData.vade_tarihi) {
          await formik.setFieldValue('vade_tarihi', new Date(extractedData.vade_tarihi));
        }
        if (extractedData.aciklama) {
          await formik.setFieldValue('aciklama', extractedData.aciklama);
        }

        // Kalemleri yükle
        if (extractedData.kalemler && Array.isArray(extractedData.kalemler)) {
          const yeniKalemler = extractedData.kalemler.map(k => ({
            stok_kodu: k.stok_kodu || '',
            mal_hizmet_adi: k.mal_hizmet_adi || k.parca_adi || '',  // n8n backward compatibility
            miktar: k.miktar || '',
            birim: k.birim || 'Adet',
            birim_fiyat: k.birim_fiyat || '',
            toplam_tutar: k.miktar && k.birim_fiyat ? (k.miktar * k.birim_fiyat) : 0
          }));
          setKalemler(yeniKalemler);
        }

        setAiDataLoaded(true);
      }

    } catch (err) {
      console.error('Fatura analizi hatası:', err);
      setError(err.message || 'Analiz sırasında bir hata oluştu');
    } finally {
      setAnalyzing(false);
    }
  };

  // Görüntüyü kaldır
  const handleRemoveImage = () => {
    setFaturaImage(null);
    setAiDataLoaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Tedarikçileri yükle
  useEffect(() => {
    const loadTedarikciler = async () => {
      setLoading(true);
      try {
        // Firma API'den tedarikçileri al
        const response = await fetch('/api/firmalar');
        const json = await response.json();
        setTedarikciler(json.data || []);
      } catch (error) {
        console.error('Tedarikçiler yüklenirken hata:', error);
        setTedarikciler([]);
      } finally {
        setLoading(false);
      }
    };
    loadTedarikciler();
  }, []);

  // Initial data değişince kalemleri güncelle
  useEffect(() => {
    if (initialData?.kalemler) {
      setKalemler(initialData.kalemler);
    } else {
      setKalemler([]);
    }
  }, [initialData]);

  // Kalem ekle
  const handleAddKalem = () => {
    setKalemler([...kalemler, {
      stok_kodu: '',
      mal_hizmet_adi: '',
      miktar: '',
      birim: 'Adet',
      birim_fiyat: ''
    }]);
  };

  // Kalem güncelle
  const handleKalemChange = (index, field, value) => {
    const newKalemler = [...kalemler];
    newKalemler[index][field] = value;

    // Otomatik hesaplamalar
    if (field === 'miktar' || field === 'birim_fiyat') {
      const miktar = parseFloat(newKalemler[index].miktar) || 0;
      const birimFiyat = parseFloat(newKalemler[index].birim_fiyat) || 0;
      newKalemler[index].toplam_tutar = miktar * birimFiyat;
    }

    setKalemler(newKalemler);
  };

  // Kalem sil
  const handleRemoveKalem = (index) => {
    setKalemler(kalemler.filter((_, i) => i !== index));
  };

  // Toplam tutar hesapla
  const toplamTutar = kalemler.reduce((sum, kalem) => {
    const miktar = parseFloat(kalem.miktar) || 0;
    const birimFiyat = parseFloat(kalem.birim_fiyat) || 0;
    return sum + (miktar * birimFiyat);
  }, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {initialData ? 'Fatura Düzenle' : 'Yeni Fatura'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* AI Fatura Analizi Butonu */}
        <Box sx={{ mb: 2 }}>
          {!faturaImage ? (
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              disabled={analyzing}
              fullWidth
              sx={{
                py: 2,
                borderStyle: 'dashed',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2
                }
              }}
            >
              {analyzing ? 'Fatura Analiz Ediliyor...' : 'Fatura Görseli Yükle ve Analiz Et'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
              />
            </Button>
          ) : (
            <Collapse in={!!faturaImage}>
              <Card>
                <CardMedia
                  component="img"
                  sx={{
                    height: imageExpanded ? 'auto' : 200,
                    cursor: 'pointer',
                    objectFit: 'contain'
                  }}
                  image={faturaImage}
                  onClick={() => setImageExpanded(!imageExpanded)}
                />
                <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => setImageExpanded(!imageExpanded)}
                    >
                      {imageExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Typography variant="caption" color="text.secondary">
                      {imageExpanded ? 'Gizle' : 'Genişlet'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {aiDataLoaded && (
                      <Chip
                        label="✓ AI Analiz Tamamlandı"
                        color="success"
                        size="small"
                      />
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={handleRemoveImage}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Collapse>
          )}
        </Box>

        {analyzing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2" color="text.secondary">
              AI ile fatura analizi yapılıyor, lütfen bekleyin...
            </Typography>
          </Box>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Tedarikçi */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tedarikçi *</InputLabel>
              <Select
                name="tedarikci_id"
                value={formik.values.tedarikci_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Tedarikçi *"
                error={formik.touched.tedarikci_id && Boolean(formik.errors.tedarikci_id)}
                disabled={loading}
              >
                {tedarikciler.map(t => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.firma_adi}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Fatura No */}
          <Grid item xs={12} md={6}>
            <TextField
              name="fatura_no"
              label="Fatura No *"
              fullWidth
              value={formik.values.fatura_no}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fatura_no && Boolean(formik.errors.fatura_no)}
              helperText={formik.touched.fatura_no && formik.errors.fatura_no}
            />
          </Grid>

          {/* Belge Tarihi */}
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DatePicker
                label="Belge Tarihi *"
                value={formik.values.belge_tarih}
                onChange={(value) => formik.setFieldValue('belge_tarih', value)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.belge_tarih && Boolean(formik.errors.belge_tarih),
                    helperText: formik.touched.belge_tarih && formik.errors.belge_tarih
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Vade Tarihi */}
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DatePicker
                label="Vade Tarihi"
                value={formik.values.vade_tarihi}
                onChange={(value) => formik.setFieldValue('vade_tarihi', value)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.vade_tarihi && Boolean(formik.errors.vade_tarihi),
                    helperText: formik.touched.vade_tarihi && formik.errors.vade_tarihi
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Açıklama */}
          <Grid item xs={12} md={4}>
            <TextField
              name="aciklama"
              label="Açıklama"
              fullWidth
              multiline
              rows={1}
              value={formik.values.aciklama}
              onChange={formik.handleChange}
            />
          </Grid>
        </Grid>

        {/* Kalemler */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Kalemler</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddKalem}
              variant="outlined"
              size="small"
            >
              Kalem Ekle
            </Button>
          </Box>

          {kalemler.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography color="text.secondary">
                Henüz kalem eklenmedi
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={1}>
              {kalemler.map((kalem, index) => (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {index + 1}
                        </Typography>
                      </Grid>
                      <Grid item xs={5} md={2.5}>
                        <TextField
                          label="Stok Kodu"
                          fullWidth
                          size="small"
                          value={kalem.stok_kodu}
                          onChange={(e) => handleKalemChange(index, 'stok_kodu', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={5} md={2.5}>
                        <TextField
                          label="Mal/Hizmet Adı"
                          fullWidth
                          size="small"
                          value={kalem.mal_hizmet_adi}
                          onChange={(e) => handleKalemChange(index, 'mal_hizmet_adi', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={3} md={1.5}>
                        <TextField
                          label="Miktar"
                          fullWidth
                          size="small"
                          type="number"
                          value={kalem.miktar}
                          onChange={(e) => handleKalemChange(index, 'miktar', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={3} md={1.5}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Birim</InputLabel>
                          <Select
                            value={kalem.birim || 'Adet'}
                            onChange={(e) => handleKalemChange(index, 'birim', e.target.value)}
                            label="Birim"
                          >
                            <MenuItem value="Adet">Adet</MenuItem>
                            <MenuItem value="KG">KG</MenuItem>
                            <MenuItem value="Lt">Lt</MenuItem>
                            <MenuItem value="Mt">Mt</MenuItem>
                            <MenuItem value="m2">m²</MenuItem>
                            <MenuItem value="m3">m³</MenuItem>
                            <MenuItem value="Gram">Gram</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={4} md={2}>
                        <TextField
                          label="Birim Fiyat"
                          fullWidth
                          size="small"
                          type="number"
                          value={kalem.birim_fiyat}
                          onChange={(e) => handleKalemChange(index, 'birim_fiyat', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={3} md={1.5}>
                        <TextField
                          label="Toplam"
                          fullWidth
                          size="small"
                          value={kalem.toplam_tutar?.toFixed(2) || '0.00'}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={1} md={0.5}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveKalem(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Toplam */}
          {kalemler.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="h6">
                Genel Toplam: {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: 'TRY'
                }).format(toplamTutar)}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          İptal
        </Button>
        <Button
          onClick={formik.handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting && <CircularProgress size={20} />}
        >
          {submitting ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FaturaForm;
