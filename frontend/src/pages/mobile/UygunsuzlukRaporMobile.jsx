import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Card,
  CardContent,
  IconButton,
  Alert,
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

function UygunsuzlukRaporMobile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, success, error } = useSelector((state) => state.uygunsuzluklar);

  const [formData, setFormData] = useState({
    baslik: '',
    aciklama: '',
    kategori: 'diger',
    oncelik: 'orta',
    lokasyon: ''
  });

  const [resimler, setResimler] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

    // Resimleri ekle (backend'de 'files' field name'i bekleniyor)
    resimler.forEach((resim) => {
      raporData.append('files', resim);
    });

    dispatch(createUygunsuzluk(raporData))
      .unwrap()
      .then((result) => {
        navigate(`/mobile/uygunsuzluklar/${result.id}`);
      })
      .catch((err) => {
        console.error('Rapor oluşturulurken hata:', err);
      });
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
    <Box sx={{ pb: 8 }}>
      {/* Üst Bar */}
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton sx={{ color: 'white' }} onClick={() => navigate('/mobile/uygunsuzluklar')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">
            Yeni Rapor
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
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
          {/* Başlık */}
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
            sx={{ mb: 2 }}
          />

          {/* Açıklama */}
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
            sx={{ mb: 2 }}
          />

          {/* Kategori ve Öncelik */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Kategori</InputLabel>
            <Select
              label="Kategori"
              name="kategori"
              value={formData.kategori}
              onChange={handleChange}
            >
              <MenuItem value="is_guvenligi">🛡️ İş Güvenliği</MenuItem>
              <MenuItem value="kalite">⭐ Kalite</MenuItem>
              <MenuItem value="cevre">🌿 Çevre</MenuItem>
              <MenuItem value="surec">⚙️ Süreç</MenuItem>
              <MenuItem value="diger">📁 Diğer</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
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

          {/* Lokasyon */}
          <TextField
            fullWidth
            label="Lokasyon (Opsiyonel)"
            name="lokasyon"
            value={formData.lokasyon}
            onChange={handleChange}
            placeholder="Örn: Atölye A, Tezgah 5, Depo vb."
            sx={{ mb: 2 }}
          />

          {/* Resim Yükleme */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">
                  Fotoğraflar ({resimler.length}/10)
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<PhotoCameraIcon />}
                  size="small"
                  disabled={resimler.length >= 10}
                >
                  Ekle
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
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {resimler.map((resim, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          backgroundImage: `url(${URL.createObjectURL(resim)})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          p: 0.5
                        }}
                        size="small"
                        onClick={() => handleResimSil(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <PhotoCameraIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Henüz resim eklenmedi
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Önizleme */}
          {formData.baslik && (
            <Card sx={{ mb: 2, backgroundColor: 'grey.100' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Önizleme
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={formData.kategori.replace('_', ' ').toUpperCase()}
                    size="small"
                  />
                  <Chip
                    label={formData.oncelik.toUpperCase()}
                    size="small"
                    sx={{ backgroundColor: getOncelikColor(formData.oncelik), color: 'white' }}
                  />
                </Box>
                <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {formData.baslik}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.aciklama?.substring(0, 150)}
                  {formData.aciklama?.length > 150 ? '...' : ''}
                </Typography>
                {formData.lokasyon && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    📍 {formData.lokasyon}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* İşlem Butonları */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/mobile/uygunsuzluklar')}
              disabled={loading}
              sx={{ flexGrow: 1 }}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ flexGrow: 1 }}
            >
              {loading ? 'Kaydediliyor...' : 'Oluştur'}
            </Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
}

export default UygunsuzlukRaporMobile;
