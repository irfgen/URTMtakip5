import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Collapse,
  Chip
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import FirmaEkleModal from '../components/tedarik/FirmaEkleModal';

function IrsaliyeForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [kalemler, setKalemler] = useState([
    { mal_hizmet_adi: '', stok_kodu: '', miktar: '', birim: '', aciklama: '' }
  ]);
  const [firmalar, setFirmalar] = useState([]);
  // mal_hizmet_adi serbest metin olarak kullanılıyor

  const [form, setForm] = useState({
    irsaliyeNo: '',
    irsaliyeTarihi: new Date().toISOString().split('T')[0],
    firmaId: '',
    tur: 'satis',
    aciklama: ''
  });

  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');
  const [aiDataLoaded, setAiDataLoaded] = useState(false);
  const [irsaliyeImage, setIrsaliyeImage] = useState(null);
  const [imageExpanded, setImageExpanded] = useState(true);
  const [bulunamayanTedarikci, setBulunamayanTedarikci] = useState(null);
  const [firmaEkleModalOpen, setFirmaEkleModalOpen] = useState(false);

  useEffect(() => {
    firmalariYukle();
    if (mode === 'edit' && id) {
      irsaliyeYukle(id);
    }
  }, [mode, id]);

  // Yeni firma ekleme callback
  const handleFirmaEkleSuccess = async (yeniFirma) => {
    // Firmalar listesini güncelle
    await firmalariYukle();

    // Yeni firmayı seçili yap
    setForm(prev => ({ ...prev, firmaId: yeniFirma.id }));

    // Uyarıyı kaldır
    setBulunamayanTedarikci(null);

    setBasari(`"${yeniFirma.firma_adi}" firması başarıyla kaydedildi`);
    setTimeout(() => setBasari(''), 3000);
  };

  // Helper: Obje formatındaki değerleri string'e çıkar (AI analyzer sonucu için)
  const extractValue = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'object' && val !== null) {
      // Try to get .value property first
      if (val.value !== undefined) {
        return val.value;
      }
      // If no .value property, check if it's a plain object and try to extract first string value
      const keys = Object.keys(val);
      for (const key of keys) {
        if (key !== 'confidence' && typeof val[key] === 'string' && val[key]) {
          return val[key];
        }
      }
      // Last resort: return string representation
      return String(val);
    }
    return val;
  };

  // DD.MM.YYYY formatını YYYY-MM-DD formatına çevir
  const convertDateToHtmlFormat = (dateStr) => {
    if (!dateStr) return null;

    // Eğer obje ise (AI analyzer sonucu gibi) value değerini al
    if (typeof dateStr === 'object' && dateStr !== null) {
      dateStr = dateStr.value || dateStr;
    }

    // String'e çevir
    const str = String(dateStr);

    // Eğer zaten YYYY-MM-DD formatındaysa, doğrudan döndür
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    // DD.MM.YYYY formatını parse et
    const parts = str.split('.');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }

    // ISO formatında (YYYY-MM-DDTHH:mm:ss) ise sadece tarihi al
    if (str.includes('T')) {
      return str.split('T')[0];
    }

    return null;
  };

  // Tedarikçi adını firma ID'ye eşleştir
  const tedarikciAdiniBul = async (tedarikciAdi) => {
    if (!tedarikciAdi || !firmalar.length) return null;

    // Önce tam eşleşme ara
    const tamEslesme = firmalar.find(f =>
      f.firma_adi.toLowerCase().trim() === tedarikciAdi.toLowerCase().trim()
    );
    if (tamEslesme) return tamEslesme.id;

    // Kısmi eşleşme ara (içeren)
    const kismiEslesme = firmalar.find(f =>
      f.firma_adi.toLowerCase().includes(tedarikciAdi.toLowerCase()) ||
      tedarikciAdi.toLowerCase().includes(f.firma_adi.toLowerCase())
    );
    if (kismiEslesme) return kismiEslesme.id;

    return null; // Bulunamadı
  };

  // AI analizinden gelen veriyi yükle
  useEffect(() => {
    const aiDataYukle = async () => {
      if (mode === 'create' && location.state?.extractedData && !aiDataLoaded) {
        const extractedData = location.state.extractedData;

        // Görüntüyü de state'e ekle
        if (location.state?.irsaliyeImage) {
          setIrsaliyeImage(location.state.irsaliyeImage);
        }

        // Tedarikçi adını firma ID'ye eşleştir
        let firmaId = null;
        const tedarikciAdi = extractValue(extractedData.tedarikci_adi);
        if (tedarikciAdi) {
          firmaId = await tedarikciAdiniBul(tedarikciAdi);
        }

        // Form alanlarını doldur
        setForm(prevForm => ({
          irsaliyeNo: extractValue(extractedData.irsaliye_no) || prevForm.irsaliyeNo,
          irsaliyeTarihi: convertDateToHtmlFormat(extractedData.belge_tarih) || prevForm.irsaliyeTarihi,
          firmaId: firmaId || extractValue(extractedData.firma_id) || prevForm.firmaId,
          tur: extractValue(extractedData.tur) || prevForm.tur,
          aciklama: extractValue(extractedData.aciklama) || prevForm.aciklama || 'AI tarafından analiz edildi'
        }));

        // Eşleşmeyen tedarikçi adını state'e kaydet (UI için)
        if (tedarikciAdi && !firmaId) {
          setBulunamayanTedarikci(tedarikciAdi);
        }

        // Kalemleri doldur
        if (extractedData.kalemler && extractedData.kalemler.length > 0) {
          const formattedKalemler = extractedData.kalemler.map(kalem => ({
            mal_hizmet_adi: extractValue(kalem.mal_hizmet_adi) || extractValue(kalem.parca_adi) || '',
            stok_kodu: extractValue(kalem.stok_kodu) || '',
            miktar: extractValue(kalem.miktar) || '',
            birim: extractValue(kalem.birim) || 'Adet',
            aciklama: extractValue(kalem.aciklama) || ''
          }));
          setKalemler(formattedKalemler);
        }

        setAiDataLoaded(true);
      }
    };

    aiDataYukle();
  }, [mode, location.state, aiDataLoaded]);

  const firmalariYukle = async () => {
    console.log('🔍 firmalariYukle ÇAĞRILDI!');
    try {
      console.log('📡 API call yapılıyor: /firmalar');
      const response = await api.get('/firmalar');
      console.log('✅ API Response alındı:', response);
      console.log('📦 response.data:', response.data);
      console.log('📦 response.data.data:', response.data?.data);

      // API yanıt formatını kontrol et
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      console.log('✅ Firmalar parsed data length:', data.length);
      console.log('✅ Firmalar:', data);

      setFirmalar(data);
      console.log('✅ setFirmalar çağrıldı');
    } catch (error) {
      console.error('❌ Firmalar yüklenirken hata:', error);
      setFirmalar([]);
    }
  };

  const irsaliyeYukle = async (irsaliyeId) => {
    setLoading(true);
    try {
      const response = await api.get(`/irsaliyeler/${irsaliyeId}`);
      const data = response.data?.data || response.data; // Handle both response formats

      // Backend response mapping (snake_case → camelCase)
      setForm({
        irsaliyeNo: data.irsaliye_no || data.irsaliyeNo || '',
        irsaliyeTarihi: data.belge_tarih || data.irsaliyeTarihi || new Date().toISOString().split('T')[0],
        firmaId: data.tedarikciId || data.firmaId || '',
        tur: data.tur || (data.belge_tipi === 'gelis' ? 'alis' : 'satis'),
        aciklama: data.aciklama || ''
      });

      // Load kalemler
      if (data.kalemler && data.kalemler.length > 0) {
        // Backend returns kalemler with mal_hizmet_adi
        const formattedKalemler = data.kalemler.map(k => ({
          mal_hizmet_adi: k.mal_hizmet_adi || '',
          stok_kodu: k.stok_kodu || '',
          miktar: k.miktar || '',
          birim: k.birim || 'Adet',
          aciklama: k.aciklama || ''
        }));
        setKalemler(formattedKalemler);
      }
    } catch (error) {
      console.error('İrsaliye yüklenirken hata:', error);
      setHata('İrsaliye yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHata('');
    setBasari('');
    setLoading(true);

    try {
      // Backend field names mapping
      const data = {
        irsaliye_no: form.irsaliyeNo,
        tedarikci_id: form.firmaId,
        belge_tarih: form.irsaliyeTarihi,
        belge_tipi: form.tur === 'satis' ? 'cikis' : 'gelis',
        aciklama: form.aciklama,
        kalemler: kalemler
          .filter(k => k.mal_hizmet_adi && k.miktar) // mal_hizmet_adi zorunlu
          .map(k => ({
            mal_hizmet_adi: k.mal_hizmet_adi,
            stok_kodu: k.stok_kodu || '',
            miktar: parseFloat(k.miktar) || 0,
            birim: k.birim || 'Adet',
            aciklama: k.aciklama || ''
          }))
      };

      console.log('📤 Gönderilen veri:', data);

      if (mode === 'create') {
        await api.post('/irsaliyeler', data);
        setBasari('İrsaliye başarıyla oluşturuldu');
        setTimeout(() => navigate('/irsaliyeler'), 1500);
      } else {
        await api.put(`/irsaliyeler/${id}`, data);
        setBasari('İrsaliye başarıyla güncellendi');
        setTimeout(() => navigate('/irsaliyeler'), 1500);
      }
    } catch (error) {
      console.error('İrsaliye kaydedilirken hata:', error);
      console.error('Hata detayı:', error.response?.data);
      setHata(error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleKalemEkle = () => {
    setKalemler([...kalemler, { mal_hizmet_adi: '', stok_kodu: '', miktar: '', birim: 'Adet', aciklama: '' }]);
  };

  const handleKalemSil = (index) => {
    const yeniKalemler = kalemler.filter((_, i) => i !== index);
    setKalemler(yeniKalemler);
  };

  const handleKalemDegistir = (index, alan, deger) => {
    const yeniKalemler = [...kalemler];
    yeniKalemler[index][alan] = deger;
    setKalemler(yeniKalemler);
  };

  if (loading && mode === 'edit') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {mode === 'create' ? 'Yeni İrsaliye' : 'İrsaliye Düzenle'}
        </Typography>

        {aiDataLoaded && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Bu irsaliye bilgileri AI tarafından otomatik analiz edilerek dolduruldu. Lütfen bilgileri kontrol edin ve gerekirse düzeltin.
          </Alert>
        )}
        {hata && <Alert severity="error" sx={{ mb: 2 }}>{hata}</Alert>}
        {basari && <Alert severity="success" sx={{ mb: 2 }}>{basari}</Alert>}

        {/* İrsaliye Görüntü Görüntüleme */}
        {irsaliyeImage && (
          <Card sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1,
                bgcolor: 'action.hover',
                cursor: 'pointer'
              }}
              onClick={() => setImageExpanded(!imageExpanded)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label="İrsaliye Görüntüsü"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="subtitle2" color="text.secondary">
                  AI tarafından analiz edilen belge
                </Typography>
              </Box>
              {imageExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            <Collapse in={imageExpanded}>
              <CardContent sx={{ pt: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <CardMedia
                    component="img"
                    image={irsaliyeImage}
                    alt="İrsaliye görüntüsü"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '600px',
                      objectFit: 'contain'
                    }}
                  />
                </Box>
              </CardContent>
            </Collapse>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="İrsaliye No"
                value={form.irsaliyeNo}
                onChange={(e) => setForm({ ...form, irsaliyeNo: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="İrsaliye Tarihi"
                value={form.irsaliyeTarihi}
                onChange={(e) => setForm({ ...form, irsaliyeTarihi: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Firma</InputLabel>
                <Select
                  value={form.firmaId}
                  label="Firma"
                  onChange={(e) => setForm({ ...form, firmaId: e.target.value })}
                  required
                >
                  {firmalar.map((firma) => (
                    <MenuItem key={firma.id} value={firma.id}>
                      {firma.firma_adi}
                    </MenuItem>
                  ))}
                </Select>
                {bulunamayanTedarikci && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>"{bulunamayanTedarikci}"</strong> firması sistemde kayıtlı değil.
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setFirmaEkleModalOpen(true)}
                      sx={{ mt: 1 }}
                    >
                      + Firmayı Kaydet
                    </Button>
                  </Alert>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tür</InputLabel>
                <Select
                  value={form.tur}
                  label="Tür"
                  onChange={(e) => setForm({ ...form, tur: e.target.value })}
                  required
                >
                  <MenuItem value="satis">Satış</MenuItem>
                  <MenuItem value="alis">Alış</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Açıklama"
                value={form.aciklama}
                onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
              />
            </Grid>

            {/* Kalemler */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Kalemler
              </Typography>
            </Grid>

            {kalemler.map((kalem, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Mal/Hizmet Adı"
                    value={kalem.mal_hizmet_adi}
                    onChange={(e) => handleKalemDegistir(index, 'mal_hizmet_adi', e.target.value)}
                    placeholder="İrsaliyedeki mal/hizmet adı"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Stok Kodu"
                    value={kalem.stok_kodu}
                    onChange={(e) => handleKalemDegistir(index, 'stok_kodu', e.target.value)}
                    placeholder="Opsiyonel"
                  />
                </Grid>

                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Miktar"
                    value={kalem.miktar}
                    onChange={(e) => handleKalemDegistir(index, 'miktar', e.target.value)}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel>Birim</InputLabel>
                    <Select
                      value={kalem.birim || 'Adet'}
                      label="Birim"
                      onChange={(e) => handleKalemDegistir(index, 'birim', e.target.value)}
                    >
                      <MenuItem value="Adet">Adet</MenuItem>
                      <MenuItem value="KG">KG</MenuItem>
                      <MenuItem value="Lt">Lt</MenuItem>
                      <MenuItem value="Mt">Mt</MenuItem>
                      <MenuItem value="m2">m2</MenuItem>
                      <MenuItem value="m3">m3</MenuItem>
                      <MenuItem value="Gram">Gram</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={1}>
                  <IconButton
                    color="error"
                    onClick={() => handleKalemSil(index)}
                    disabled={kalemler.length === 1}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={handleKalemEkle}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                Kalem Ekle
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/irsaliyeler')}
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : (mode === 'create' ? 'Oluştur' : 'Güncelle')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Firma Ekle Modal - Tedarik modülünden ortak kullanım */}
      <FirmaEkleModal
        open={firmaEkleModalOpen}
        onClose={() => setFirmaEkleModalOpen(false)}
        onSuccess={handleFirmaEkleSuccess}
        // Bulunamayan tedarikçi adını varsayılan olarak kullan
        initialFirmaAdi={bulunamayanTedarikci || ''}
      />
    </Container>
  );
}

export default IrsaliyeForm;
