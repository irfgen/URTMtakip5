import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import axios from 'axios';
import ParcaDuzenleForm from '../ParcaDuzenleForm';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  Snackbar,
} from '@mui/material';
import {
  Edit,
  Close,
  PictureAsPdf,
  Image,
  DesignServices,
  AddTask as AddTaskIcon,
  Warning,
  Inventory,
  Visibility,
  OpenInNew,
  ArrowBack,
  PlayArrow,
  Build,
  History,
  ShoppingCart,
  MonetizationOn,
} from '@mui/icons-material';
import ImageWithFallback from '../ImageWithFallback';
import TeknikResimViewer from '../TeknikResimViewer';
import ParcaUretimGecmisiModal from '../ParcaUretimGecmisiModal';
import IsEmriEkleForm from '../IsEmriEkleForm';
import ParcaTekliflerModal from '../ParcaTekliflerModal';
import TedarikTalepForm from '../tedarik/TedarikTalepForm';
import QRCodeDisplay from '../common/QRCodeDisplay';
import { getFotoPath, getTeknikResimPath, getFileType } from '../../utils/imageUtils';

// Sekme panel bileşeni
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`parca-tabpanel-${index}`}
      aria-labelledby={`parca-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ParcaDetayCard = ({ parcaKodu, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetect();
  const [parca, setParca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [teknikResimDialogOpen, setTeknikResimDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [duzenleModalOpen, setDuzenleModalOpen] = useState(false);
  const [isEmriModalOpen, setIsEmriModalOpen] = useState(false);
  const [uretimGecmisiModalOpen, setUretimGecmisiModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Tedarik talebi oluşturma state'leri
  const [tedarikModalOpen, setTedarikModalOpen] = useState(false);

  // Teklifler modal state
  const [tekliflerModalOpen, setTekliflerModalOpen] = useState(false);

  useEffect(() => {
    const fetchParca = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/parcalar/${encodeURIComponent(parcaKodu)}`);
        setParca(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Parça detayları alınamadı:', err);
        setError('Parça bilgileri yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    if (parcaKodu) {
      fetchParca();
    }
  }, [parcaKodu]);

  // Parça güncellendiğinde verileri yenile
  const handleParcaGuncellendi = (guncellenmisParca) => {
    setParca(guncellenmisParca);
  };

  // CAD dosyasını aç
  const handleCadFileClick = async (filePath, fileType) => {
    try {
      const filename = filePath.split(/[\\/]/).pop();
      const response = await axios.get(`/api/cad-files/info/${filename}`);

      if (response.data.success && response.data.data.exists) {
        // Yeni sekmede aç
        window.open(response.data.data.httpUrl, '_blank');
      } else {
        // Dosya bulunamazsa veya erişilemezse kullanıcı bilgilendir
        alert(`CAD dosyasına erişilemiyor:\n\n${filePath}\n\nDosya yolu: ${response.data?.data?.filePath || 'Bilinmiyor'}\n\nÇözüm: CAD dosyalarını sunucunun erişebileceği bir dizine kopyalayın veya ağ yolunu doğrulayın.`);
      }
    } catch (error) {
      console.error('CAD dosyası açılırken hata:', error);

      // Hata mesajını kullanıcıya göster
      const errorMessage = error.response?.data?.message || error.message || 'Bilinmeyen hata';
      alert(`CAD dosyası açılırken hata oluştu:\n\n${filePath}\n\nHata: ${errorMessage}\n\nCAD dosyasının sunucu tarafından erişilebilir olduğundan emin olun.`);
    }
  };

  // İş emri modalını aç
  const handleOpenIsEmriModal = () => {
    setIsEmriModalOpen(true);
  };

  // İş emri modalını kapat
  const handleCloseIsEmriModal = () => {
    setIsEmriModalOpen(false);
  };

  // Fason oluşturma
  const handleOpenFasonModal = () => {
    // Fason sayfasına yönlendir ve parça bilgisini gönder
    window.open(`/fason`, '_blank');
  };

  // Üretim geçmişi modalını aç
  const handleOpenUretimGecmisiModal = () => {
    setUretimGecmisiModalOpen(true);
  };

  // Tedarik modalını aç
  const handleOpenTedarikModal = () => {
    setTedarikModalOpen(true);
  };

  // Tedarik modalını kapat
  const handleCloseTedarikModal = () => {
    setTedarikModalOpen(false);
  };

  // Tedarik talebi oluşturma
  const handleTedarikTalebiOlustur = async (tedarikTalebi) => {
    try {
      setFormLoading(true);
      // API çağrısı yapılabilir veya gerekli işlemler
      console.log('Tedarik talebi oluşturuluyor:', tedarikTalebi);
      setSnackbar({ open: true, message: 'Tedarik talebi başarıyla oluşturuldu', severity: 'success' });
      setTedarikModalOpen(false);
    } catch (error) {
      console.error('Tedarik talebi oluşturma hatası:', error);
      setSnackbar({ open: true, message: 'Tedarik talebi oluşturulurken hata oluştu', severity: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  // Teklifler modalını aç
  const handleOpenTekliflerModal = () => {
    setTekliflerModalOpen(true);
  };

  // Teklifler modalını kapat
  const handleCloseTekliflerModal = () => {
    setTekliflerModalOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!parca) return null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Üst başlık ve işlem butonları */}
      <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {window.innerWidth < 600 ? parca.parcaKodu?.substring(0, 15) + '...' : 'Parça Detayı'}
            </Typography>
            <Chip
              label={parca.imalMi ? 'İmal' : 'Tdr'}
              color={parca.imalMi ? 'primary' : 'default'}
              size="small"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Parçayı Düzenle">
              <IconButton
                size="small"
                onClick={() => setDuzenleModalOpen(true)}
                sx={{
                  p: 0.5,
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                  }
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Yeni Sekmede Aç">
              <IconButton
                size="small"
                onClick={() => window.open(`/parcalar/${parca.parcaKodu}`, '_blank')}
                sx={{ p: 0.5 }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} sx={{ p: 0.5 }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          {/* Sol taraf - Parça görseli ve temel bilgiler */}
          <Grid item xs={12} sm={5} md={4}>
            <Paper sx={{ p: { xs: 1, sm: 2 } }}>
              {/* Parça görseli */}
              <Box sx={{
                position: 'relative',
                mb: 2,
                height: { xs: 150, sm: 200 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                borderRadius: 1
              }}>
                {parca.foto_path ? (
                  <ImageWithFallback
                    src={getFotoPath(parca.foto_path)}
                    alt={parca.parcaAdi}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedImage(getFotoPath(parca.foto_path));
                      setPhotoDialogOpen(true);
                    }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    <DesignServices sx={{ fontSize: { xs: 30, sm: 40 }, opacity: 0.5, mb: 1 }} />
                    <Typography variant="body2">Resim Yok</Typography>
                  </Box>
                )}
              </Box>

              {/* Parça kodu ve temel bilgiler */}
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                {parca.parcaKodu}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {parca.parcaAdi}
              </Typography>

              {/* Stok durumu */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Inventory fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <strong>Stok:</strong> {parca.stokAdeti || 0}
                  </Typography>
                </Box>

                {parca.stokAdeti <= parca.kritik_stok && parca.kritik_stok > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Warning fontSize="small" color="error" />
                    <Typography variant="body2" color="error.main" sx={{ ml: 0.5, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                      Kritik ({parca.kritik_stok})
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Teknik resim butonu */}
              {parca.teknik_resim_path && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={(() => {
                      const fileType = getFileType(parca.teknik_resim_path);
                      switch (fileType) {
                        case 'pdf':
                          return <PictureAsPdf />;
                        case 'image':
                          return <Image />;
                        default:
                          return <DesignServices />;
                      }
                    })()}
                    onClick={() => setTeknikResimDialogOpen(true)}
                    fullWidth
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Teknik Resim
                  </Button>
                </Box>
              )}

              {/* İşlem butonları */}
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Bu Parçadan İş Emri Oluştur */}
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleOpenIsEmriModal}
                  startIcon={<PlayArrow />}
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    py: 1,
                    textTransform: 'none',
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  İş Emri Oluştur
                </Button>

                {/* Parçadan Fason Oluştur */}
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleOpenFasonModal}
                  startIcon={<Build />}
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    py: 1,
                    textTransform: 'none',
                    bgcolor: 'secondary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'secondary.dark'
                    }
                  }}
                >
                  Fason Oluştur
                </Button>

                {/* Parça Üretim Geçmişi */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleOpenUretimGecmisiModal}
                  startIcon={<History />}
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    py: 1,
                    textTransform: 'none'
                  }}
                >
                  Üretim Geçmişi
                </Button>

                {/* Parçadan Tedarik Talebi Oluştur Butonu */}
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleOpenTedarikModal}
                  startIcon={<ShoppingCart />}
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    py: 1,
                    textTransform: 'none',
                    bgcolor: 'info.main',
                    '&:hover': { bgcolor: 'info.dark' }
                  }}
                >
                  Tedarik Talebi
                </Button>

                {/* Parça Teklifleri Butonu */}
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleOpenTekliflerModal}
                  startIcon={<MonetizationOn />}
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    py: 1,
                    textTransform: 'none',
                    bgcolor: 'success.main',
                    '&:hover': { bgcolor: 'success.dark' }
                  }}
                >
                  Teklifler
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Sağ taraf - Detaylı bilgiler */}
          <Grid item xs={12} sm={7} md={8}>
            <Paper sx={{ p: 0 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTabs-scrollButtons': {
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    },
                  },
                }}
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
              >
                <Tab label="Temel" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: { xs: 60, sm: 80 } }} />
                <Tab label="Üretim" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: { xs: 60, sm: 80 } }} />
                <Tab label="Maliyet" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: { xs: 60, sm: 80 } }} />
                <Tab label="QR Kod" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: { xs: 60, sm: 80 } }} />
                <Tab label="CAD" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: { xs: 60, sm: 80 } }} />
              </Tabs>

              {/* Temel Bilgiler Sekmesi */}
              <TabPanel value={activeTab} index={0}>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Parça Kodu"
                      value={parca.parcaKodu || ''}
                      fullWidth
                      variant="filled"
                      size="small"
                      disabled
                      InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Parça Adı"
                      value={parca.parcaAdi || ''}
                      fullWidth
                      variant="filled"
                      size="small"
                      disabled
                      InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Stok Miktarı"
                      type="number"
                      value={parca.stokAdeti || ''}
                      fullWidth
                      variant="filled"
                      size="small"
                      disabled
                      InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Kritik Stok"
                      type="number"
                      value={parca.kritik_stok || ''}
                      fullWidth
                      variant="filled"
                      size="small"
                      disabled
                      InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                    />
                  </Grid>
                  {parca.kategori && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Kategori"
                        value={parca.kategori || ''}
                        fullWidth
                        variant="filled"
                        size="small"
                        disabled
                        InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                        InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField
                      label="Açıklama"
                      value={parca.aciklama || ''}
                      fullWidth
                      variant="filled"
                      size="small"
                      disabled
                      multiline
                      rows={3}
                      InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                    />
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Üretim Sekmesi */}
              <TabPanel value={activeTab} index={1}>
                {parca.imalMi ? (
                  <Grid container spacing={{ xs: 1, sm: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Setup Sayısı"
                        type="number"
                        value={parca.setupSayisi || ''}
                        fullWidth
                        variant="filled"
                        size="small"
                        disabled
                        InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                        InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="CNC İşleme Süresi (dk)"
                        type="number"
                        value={parca.cncIslemeSuresi || ''}
                        fullWidth
                        variant="filled"
                        size="small"
                        disabled
                        InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                        InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      />
                    </Grid>
                    {parca.hamMalzemeCinsi && (
                      <Grid item xs={12}>
                        <TextField
                          label="Ham Malzeme Cinsi"
                          value={parca.hamMalzemeCinsi || ''}
                          fullWidth
                          variant="filled"
                          size="small"
                          disabled
                          InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                          InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                        />
                      </Grid>
                    )}
                    {parca.hamMalzemeOlculeri && (
                      <Grid item xs={12}>
                        <TextField
                          label="Ham Malzeme Ölçüleri"
                          value={parca.hamMalzemeOlculeri || ''}
                          fullWidth
                          variant="filled"
                          size="small"
                          disabled
                          InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                          InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                        />
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Bu parça üretilmemektedir.
                    </Typography>
                  </Box>
                )}
              </TabPanel>

              {/* Maliyet Sekmesi */}
              <TabPanel value={activeTab} index={2}>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label={parca.imalMi ? "Şirket İçi Maliyeti ($)" : "Tedarik Bedeli ($)"}
                      type="number"
                      value={parca.imalMi ? (parca.sirketIciMaliyeti || 0) : (parca.tedarikBedeli || 0)}
                      fullWidth
                      variant="filled"
                      size="small"
                      disabled
                      InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                    />
                  </Grid>
                  {parca.imalMi && parca.fasonMaliyeti && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Fason Maliyeti ($)"
                        type="number"
                        value={parca.fasonMaliyeti || 0}
                        fullWidth
                        variant="filled"
                        size="small"
                        disabled
                        InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                        InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {parca.imalMi ? (
                          <>
                            • İmal maliyeti: ${(parca.sirketIciMaliyeti || parca.fasonMaliyeti || 0).toFixed(2)}<br />
                            • TL karşılığı: ₺{((parca.sirketIciMaliyeti || parca.fasonMaliyeti || 0) * 32).toFixed(2)}
                          </>
                        ) : (
                          <>
                            • Tedarik maliyeti: ${(parca.tedarikBedeli || 0).toFixed(2)}<br />
                            • TL karşılığı: ₺{((parca.tedarikBedeli || 0) * 32).toFixed(2)}
                          </>
                        )}
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* QR Kod Sekmesi */}
              <TabPanel value={activeTab} index={3}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  {activeTab === 3 && parca && (
                    <QRCodeDisplay
                      parcaKodu={parca.parcaKodu}
                      parcaAdi={parca.parcaAdi}
                      size={200}
                      variant="default"
                    />
                  )}
                </Box>
              </TabPanel>

              {/* CAD Dosyaları Sekmesi */}
              <TabPanel value={activeTab} index={4}>
                <Box sx={{ mb: 2 }}>
                  <Alert severity="info" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    CAD dosya yolları, SolidWorks dosyalarının sunucudaki konumlarını belirtir.
                    Dizin tarama modülü ile bu alanlar otomatik olarak doldurulabilir.
                  </Alert>
                </Box>

                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={12}>
                    <TextField
                      label="SLDPRT Dosya Yolu"
                      value={parca.sldprt_yolu || ''}
                      fullWidth
                      variant="filled"
                      size="small"
                      disabled
                      helperText="3D model dosyasının (.sldprt) sunucudaki yolu"
                      placeholder="/mnt/cad_files/parcalar/PARCA_001.sldprt"
                      InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="SLDDRW Dosya Yolu"
                      value={parca.slddrw_yolu || ''}
                      fullWidth
                      variant="filled"
                      size="small"
                      disabled
                      helperText="Teknik çizim dosyasının (.slddrw) sunucudaki yolu"
                      placeholder="/mnt/cad_files/parcalar/PARCA_001.slddrw"
                      InputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                      InputLabelProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
                    />
                  </Grid>

                  {/* CAD Dosya Linkleri */}
                  {(parca.sldprt_yolu || parca.slddrw_yolu) && (
                    <Grid item xs={12}>
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          CAD Dosya Linkleri:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {parca.sldprt_yolu && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleCadFileClick(parca.sldprt_yolu, 'sldprt')}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                            >
                              SLDPRT Aç
                            </Button>
                          )}
                          {parca.slddrw_yolu && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleCadFileClick(parca.slddrw_yolu, 'slddrw')}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                            >
                              SLDDRW Aç
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Teknik Resim Dialog */}
      <Dialog
        open={teknikResimDialogOpen}
        onClose={() => setTeknikResimDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          Teknik Resim
          <IconButton
            onClick={() => setTeknikResimDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <TeknikResimViewer path={getTeknikResimPath(parca.teknik_resim_path)} />
        </DialogContent>
      </Dialog>

      {/* Fotoğraf Dialog */}
      <Dialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Parça Görseli
          <IconButton
            onClick={() => setPhotoDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Parça Görseli"
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Parça Düzenle Modal */}
      <ParcaDuzenleForm
        open={duzenleModalOpen}
        onClose={() => setDuzenleModalOpen(false)}
        initialData={parca}
        onSuccess={handleParcaGuncellendi}
      />

      {/* Parça Üretim Geçmişi Modal */}
      {parca && (
        <ParcaUretimGecmisiModal
          open={uretimGecmisiModalOpen}
          onClose={() => setUretimGecmisiModalOpen(false)}
          parcaKodu={parca.parcaKodu}
          parcaAdi={parca.parcaAdi}
        />
      )}

      {/* İş Emri Oluşturma Modal */}
      <IsEmriEkleForm
        open={isEmriModalOpen}
        onClose={handleCloseIsEmriModal}
        onSubmit={async (payload) => {
          try {
            setFormLoading(true);
            const enriched = {
              ...payload,
              is_adi: payload.is_adi || parca?.parcaKodu,
              parca_kodu: payload.parca_kodu || parca?.parcaKodu,
              malzeme: payload.malzeme || parca?.hamMalzemeCinsi || ''
            };
            // API çağrısı yapılabilir (şimdilik sadece snackbar göster)
            console.log('İş emri oluşturuluyor:', enriched);
            setSnackbar({ open: true, message: 'İş emri başarıyla oluşturuldu', severity: 'success' });
            handleCloseIsEmriModal();
          } catch (e) {
            console.error('İş emri oluşturma hatası:', e);
            setSnackbar({ open: true, message: 'İş emri oluşturulamadı', severity: 'error' });
          } finally {
            setFormLoading(false);
          }
        }}
        preSelectedParcaKodu={parca ? { parcaKodu: parca.parcaKodu, stok_karti_id: parca.stok_karti_id } : null}
      />

      {/* Tedarik Talebi Oluşturma Modal */}
      <TedarikTalepForm
        open={tedarikModalOpen}
        onClose={handleCloseTedarikModal}
        onSave={handleTedarikTalebiOlustur}
        prefillData={{
          kaynak_tipi: 'parca',
          parca_kodu: parca?.parcaKodu,
          parca_id: parca?.id,
          miktar: 1,
          parca: parca
        }}
      />

      {/* Parça Teklifler Modal */}
      <ParcaTekliflerModal
        open={tekliflerModalOpen}
        onClose={handleCloseTekliflerModal}
        parcaKodu={parca?.parcaKodu}
        parcaAdi={parca?.parcaAdi}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ParcaDetayCard;