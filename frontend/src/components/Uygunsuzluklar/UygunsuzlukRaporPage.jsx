import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  IconButton,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { createUygunsuzluk } from '../../store/slices/uygunsuzluklarSlice';
import { fetchPersonel } from '../../store/slices/personelSlice';
import { useEffect } from 'react';

const UygunsuzlukRaporPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, success, error } = useSelector((state) => state.uygunsuzluklar);
  const { personelListesi } = useSelector((state) => state.personel);

  // Personel listesini yükle
  useEffect(() => {
    dispatch(fetchPersonel());
  }, [dispatch]);

  const [formData, setFormData] = useState({
    baslik: '',
    aciklama: '',
    kategori: 'diger',
    oncelik: 'orta',
    lokasyon: '',
    tezgah_id: '',
    raporlayan_id: ''
  });

  const [resimler, setResimler] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
    }
  };

  const handleResimEkle = (e) => {
    const files = Array.from(e.target.files);

    // Dosya sayısı kontrolü
    if (resimler.length + files.length > 10) {
      alert('Maksimum 10 adet resim yükleyebilirsiniz');
      return;
    }

    // Dosya validasyonu
    const validFiles = files.filter(file => {
      // Dosya boyutu kontrolü (10 MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} dosyası çok büyük. Maksimum 10 MB.`);
        return false;
      }

      // Dosya tipi kontrolü
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name} dosya türü desteklenmiyor. Sadece JPG, PNG, GIF, WebP yükleyebilirsiniz.`);
        return false;
      }

      return true;
    });

    setResimler([...resimler, ...validFiles]);
  };

  const handleResimSil = (index) => {
    setResimler(resimler.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.baslik.trim()) {
      errors.baslik = 'Başlık zorunludur';
    }
    if (!formData.aciklama.trim()) {
      errors.aciklama = 'Açıklama zorunludur';
    }
    if (formData.baslik.length > 200) {
      errors.baslik = 'Başlık maksimum 200 karakter olabilir';
    }
    if (formData.aciklama.length > 2000) {
      errors.aciklama = 'Açıklama maksimum 2000 karakter olabilir';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const raporData = new FormData();
    raporData.append('baslik', formData.baslik);
    raporData.append('aciklama', formData.aciklama);
    raporData.append('kategori', formData.kategori);
    raporData.append('oncelik', formData.oncelik);
    if (formData.lokasyon) {
      raporData.append('lokasyon', formData.lokasyon);
    }
    if (formData.tezgah_id) {
      raporData.append('tezgah_id', formData.tezgah_id);
    }
    if (formData.raporlayan_id) {
      raporData.append('raporlayan_id', formData.raporlayan_id);
    }

    // Resimleri ekle (backend'de 'files' field name'i bekleniyor)
    resimler.forEach((resim) => {
      raporData.append('files', resim);
    });

    dispatch(createUygunsuzluk(raporData))
      .unwrap()
      .then((result) => {
        navigate(`/uygunsuzluklar/${result.id}`);
      })
      .catch((err) => {
        console.error('Rapor oluşturulurken hata:', err);
      });
  };

  const getKategoriLabel = (kategori) => {
    const labels = {
      is_guvenligi: 'İş Güvenliği',
      kalite: 'Kalite',
      cevre: 'Çevre',
      surec: 'Süreç',
      diger: 'Diğer'
    };
    return labels[kategori] || kategori;
  };

  const getKategoriIcon = (kategori) => {
    const icons = {
      is_guvenligi: '🛡️',
      kalite: '⭐',
      cevre: '🌿',
      surec: '⚙️',
      diger: '📁'
    };
    return icons[kategori] || '📁';
  };

  const getOncelikColor = (oncelik) => {
    const colors = {
      acil: '#D32F2F',
      yuksek: '#F57C00',
      orta: '#FBC02D',
      dusuk: '#388E3C'
    };
    return colors[oncelik] || '#9E9E9E';
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Başlık */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/uygunsuzluklar')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Yeni Uygunsuzluk Raporu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              İşletme içerisinde tespit edilen uygunsuzlukları kayıt altına alın
            </Typography>
          </Box>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Başlık */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Başlık"
                name="baslik"
                value={formData.baslik}
                onChange={handleChange}
                error={!!validationErrors.baslik}
                helperText={validationErrors.baslik || 'Maksimum 200 karakter'}
                inputProps={{ maxLength: 200 }}
              />
            </Grid>

            {/* Açıklama */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={6}
                label="Açıklama"
                name="aciklama"
                value={formData.aciklama}
                onChange={handleChange}
                error={!!validationErrors.aciklama}
                helperText={validationErrors.aciklama || 'Maksimum 2000 karakter'}
                inputProps={{ maxLength: 2000 }}
              />
            </Grid>

            {/* Raporlayan Personel */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Raporlayan</InputLabel>
                <Select
                  label="Raporlayan"
                  name="raporlayan_id"
                  value={formData.raporlayan_id}
                  onChange={handleChange}
                >
                  {personelListesi.map((personel) => (
                    <MenuItem key={personel.id} value={personel.id}>
                      {personel.personel_adi} {personel.sicil_no ? `(${personel.sicil_no})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Kategori ve Öncelik */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Kategori</InputLabel>
                <Select
                  label="Kategori"
                  name="kategori"
                  value={formData.kategori}
                  onChange={handleChange}
                >
                  <MenuItem value="is_guvenligi">
                    🛡️ İş Güvenliği
                  </MenuItem>
                  <MenuItem value="kalite">
                    ⭐ Kalite
                  </MenuItem>
                  <MenuItem value="cevre">
                    🌿 Çevre
                  </MenuItem>
                  <MenuItem value="surec">
                    ⚙️ Süreç
                  </MenuItem>
                  <MenuItem value="diger">
                    📁 Diğer
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Öncelik</InputLabel>
                <Select
                  label="Öncelik"
                  name="oncelik"
                  value={formData.oncelik}
                  onChange={handleChange}
                >
                  <MenuItem value="dusuk">🟢 Düşük</MenuItem>
                  <MenuItem value="orta">🟡 Orta</MenuItem>
                  <MenuItem value="yuksek">🟠 Yüksek</MenuItem>
                  <MenuItem value="acil">🔴 Acil</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Lokasyon */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Lokasyon (Opsiyonel)"
                name="lokasyon"
                value={formData.lokasyon}
                onChange={handleChange}
                placeholder="Örn: Atölye A, Tezgah 5, Depo vb."
              />
            </Grid>

            {/* Resim Yükleme */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Fotoğraflar ({resimler.length}/10)
                    </Typography>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<PhotoCameraIcon />}
                      disabled={resimler.length >= 10}
                    >
                      Resim Ekle
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleResimEkle}
                      />
                    </Button>
                  </Box>

                  {resimler.length > 0 ? (
                    <Grid container spacing={2}>
                      {resimler.map((resim, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Card>
                            <Box
                              sx={{
                                position: 'relative',
                                paddingTop: '75%',
                                backgroundImage: `url(${URL.createObjectURL(resim)})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              <IconButton
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                                }}
                                size="small"
                                onClick={() => handleResimSil(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <CardContent sx={{ p: 1, textAlign: 'center' }}>
                              <Typography variant="caption" noWrap>
                                {resim.name}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Henüz resim eklenmedi
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Maksimum 10 adet resim yükleyebilirsiniz
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Önizleme */}
            {formData.baslik && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ backgroundColor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Önizleme
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">
                        {getKategoriIcon(formData.kategori)}
                      </Typography>
                      <Chip
                        label={getKategoriLabel(formData.kategori)}
                        size="small"
                      />
                      <Chip
                        label={formData.oncelik.toUpperCase()}
                        size="small"
                        sx={{ backgroundColor: getOncelikColor(formData.oncelik), color: 'white' }}
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {formData.baslik}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.aciklama?.substring(0, 200)}
                      {formData.aciklama?.length > 200 ? '...' : ''}
                    </Typography>
                    {formData.lokasyon && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        📍 {formData.lokasyon}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* İşlem Butonları */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/uygunsuzluklar')}
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={loading}
                >
                  {loading ? 'Kaydediliyor...' : 'Rapor Oluştur'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default UygunsuzlukRaporPage;
