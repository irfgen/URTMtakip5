import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Fab,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  Grid,
  Paper,
  Breadcrumbs,
  Link,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import useDeviceDetect from '../../hooks/useDeviceDetect';

// Components
import NotlarListesi from './NotlarListesi';
import NotEkleme from './NotEkleme';
import NotDuzenle from './NotDuzenle';
import FiltrePaneli from './FiltrePaneli';
import KategoriYonetimi from './KategoriYonetimi';

// Services
import * as notlarService from '../../services/notlarService';

const NotlarPage = () => {
  const theme = useTheme();
  const { isMobile } = useDeviceDetect(); // Tutarlı mobile algılama için hook kullan
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [notlar, setNotlar] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [notEklemeAcik, setNotEklemeAcik] = useState(false);
  const [notDuzenleAcik, setNotDuzenleAcik] = useState(false);
  const [duzenlenecekNot, setDuzenlenecekNot] = useState(null);
  const [kategoriYonetimAcik, setKategoriYonetimAcik] = useState(false);
  
  // Filtreleme states
  const [filtrePaneliAcik, setFiltrePaneliAcik] = useState(!isMobile);
  const [filtreler, setFiltreler] = useState({
    arama: '',
    kategori_id: null,
    baslangic_tarihi: null,
    bitis_tarihi: null,
    resimli: null,
    siralama: 'olusturma_tarihi',
    siralama_yonu: 'DESC'
  });
  
  // Sayfalama
  const [sayfalama, setSayfalama] = useState({
    mevcut_sayfa: 1,
    toplam_sayfa: 1,
    toplam_kayit: 0,
    limit: 12
  });

  // İlk yükleme
  useEffect(() => {
    loadKategoriler();
    loadNotlar();
  }, []);

  // Filtreler değiştiğinde notları yeniden yükle
  useEffect(() => {
    if (!loading) {
      loadNotlar();
    }
  }, [filtreler, sayfalama.mevcut_sayfa]);

  // URL parametrelerinden filtreleri oku
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const yeniFiltreler = { ...filtreler };
    let degisti = false;

    if (searchParams.get('arama')) {
      yeniFiltreler.arama = searchParams.get('arama');
      degisti = true;
    }
    if (searchParams.get('kategori')) {
      yeniFiltreler.kategori_id = parseInt(searchParams.get('kategori'));
      degisti = true;
    }

    if (degisti) {
      setFiltreler(yeniFiltreler);
    }
  }, [location.search]);

  const loadNotlar = async () => {
    try {
      setLoading(true);
      const response = await notlarService.getNotlar({
        ...filtreler,
        sayfa: sayfalama.mevcut_sayfa,
        limit: sayfalama.limit
      });

      if (response.success) {
        setNotlar(response.data.notlar);
        setSayfalama(prev => ({
          ...prev,
          ...response.data.sayfalama
        }));
      } else {
        setError('Notlar yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Notlar yükleme hatası:', error);
      setError('Notlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadKategoriler = async () => {
    try {
      const response = await notlarService.getKategoriler({ not_sayilari: 'true' });
      if (response.success) {
        setKategoriler(response.data);
      }
    } catch (error) {
      console.error('Kategoriler yükleme hatası:', error);
    }
  };

  const handleNotEklendi = async (yeniNot) => {
    setSuccess('Not başarıyla eklendi');
    setNotEklemeAcik(false);
    await loadNotlar();
    await loadKategoriler(); // Kategori sayılarını güncelle
  };

  const handleNotDuzenle = (not) => {
    setDuzenlenecekNot(not);
    setNotDuzenleAcik(true);
  };

  const handleNotGuncellendi = async () => {
    setSuccess('Not başarıyla güncellendi');
    setNotDuzenleAcik(false);
    setDuzenlenecekNot(null);
    await loadNotlar();
    await loadKategoriler();
  };

  const handleNotSilindi = async () => {
    setSuccess('Not başarıyla silindi');
    await loadNotlar();
    await loadKategoriler();
  };

  const handleKategoriDegisti = async () => {
    await loadKategoriler();
    await loadNotlar(); // Kategoriler değiştiğinde notları da yenile
  };

  const handleFiltreUygula = (yeniFiltreler) => {
    setFiltreler(yeniFiltreler);
    setSayfalama(prev => ({ ...prev, mevcut_sayfa: 1 })); // İlk sayfaya dön
    
    // URL'yi güncelle
    const searchParams = new URLSearchParams();
    if (yeniFiltreler.arama) searchParams.set('arama', yeniFiltreler.arama);
    if (yeniFiltreler.kategori_id) searchParams.set('kategori', yeniFiltreler.kategori_id);
    
    const newUrl = `${location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    navigate(newUrl, { replace: true });
  };

  const handleSayfaDegisti = (yeniSayfa) => {
    setSayfalama(prev => ({ ...prev, mevcut_sayfa: yeniSayfa }));
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccess(null);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: isMobile ? '#f5f5f5' : 'inherit',
      pb: isMobile ? 10 : 0 // Mobilde bottom navigation için alan bırak
    }}>
      <Container 
        maxWidth={isMobile ? false : "xl"} 
        disableGutters={isMobile}
        sx={{ 
          py: isMobile ? 0 : 3,
          px: isMobile ? 0 : 3
        }}
      >
      {/* Breadcrumbs - sadece desktop'ta göster */}
      {!isMobile && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
            color="inherit"
            href="/"
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Ana Sayfa
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            Notlar
          </Typography>
        </Breadcrumbs>
      )}

      {/* Header */}
      <Box sx={{ mb: 3, px: isMobile ? 2 : 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Notlarım
          </Typography>
          {/* Mobilde kategori yönetimi butonu */}
          {isMobile && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setKategoriYonetimAcik(true)}
              sx={{ ml: 2 }}
            >
              Kategoriler
            </Button>
          )}
        </Box>
        <Typography variant="body1" color="text.secondary">
          Resimli notlarınızı oluşturun, düzenleyin ve kategorilere ayırın.
        </Typography>
      </Box>

      <Grid container spacing={isMobile ? 2 : 3} sx={{ px: isMobile ? 2 : 0 }}>
        {/* Filtre Paneli - Mobilde gizli */}
        {!isMobile && (
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 2,
                position: 'sticky',
                top: 20
              }}
            >
              <FiltrePaneli
                filtreler={filtreler}
                kategoriler={kategoriler}
                onFiltreUygula={handleFiltreUygula}
                onKategoriYonetimi={() => setKategoriYonetimAcik(true)}
                isMobile={isMobile}
              />
            </Paper>
          </Grid>
        )}

        {/* Ana İçerik */}
        <Grid item xs={12} md={isMobile ? 12 : 9}>
          <NotlarListesi
            notlar={notlar}
            loading={loading}
            sayfalama={sayfalama}
            onSayfaDegisti={handleSayfaDegisti}
            onNotDuzenle={handleNotDuzenle}
            onNotGuncellendi={handleNotGuncellendi}
            onNotSilindi={handleNotSilindi}
            kategoriler={kategoriler}
          />
        </Grid>
      </Grid>

      {/* Floating Action Button - Not Ekle */}
      <Fab
        color="primary"
        aria-label="not ekle"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 80 : 16, // Mobilde bottom navigation'dan kaçın
          right: 16,
          zIndex: 1000
        }}
        onClick={() => setNotEklemeAcik(true)}
      >
        <AddIcon />
      </Fab>

      {/* Modal'lar */}
      <NotEkleme
        acik={notEklemeAcik}
        onKapat={() => setNotEklemeAcik(false)}
        onNotEklendi={handleNotEklendi}
        kategoriler={kategoriler}
      />

      <NotDuzenle
        acik={notDuzenleAcik}
        onKapat={() => {
          setNotDuzenleAcik(false);
          setDuzenlenecekNot(null);
        }}
        onNotGuncellendi={handleNotGuncellendi}
        not={duzenlenecekNot}
        kategoriler={kategoriler}
      />

      <KategoriYonetimi
        acik={kategoriYonetimAcik}
        onKapat={() => setKategoriYonetimAcik(false)}
        onKategoriDegisti={handleKategoriDegisti}
        kategoriler={kategoriler}
      />

      {/* Snackbar Mesajları */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  );
};

export default NotlarPage;
