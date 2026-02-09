import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // Arıza ikonu
import EngineeringIcon from '@mui/icons-material/Engineering'; // Bakım ikonu
import Draggable from 'react-draggable';
import { tezgahAPI } from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { fetchIsEmirleri, createIsEmri } from '../store/slices/isEmirleriSlice';
import { fetchArizaBakimKayitlari } from '../store/slices/arizaBakimSlice'; // Arıza/Bakım slice import edildi
import { fetchUygunsuzlukIstatistikleri } from '../store/slices/uygunsuzluklarSlice'; // Uygunsuzluk slice import edildi
import TezgahKarti from '../components/TezgahKarti';
import IsEmriEkleForm from '../components/IsEmriEkleForm';
import TezgahEkleForm from '../components/TezgahEkleForm';
import axios from 'axios';
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; // Uygunsuzluk ikonu
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const dispatch = useDispatch();
  const [tezgahlar, setTezgahlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pozisyonlar, setPozisyonlar] = useState({});
  const [zoom, setZoom] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [isEmriFormOpen, setIsEmriFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [parcaGorselleri, setParcaGorselleri] = useState({});
  const [gorsellerYukleniyor, setGorsellerYukleniyor] = useState(false);
  
  // Arıza/Bakım state'i
  const { kayitlar: arizaBakimKayitlari, loading: arizaBakimLoading } = useSelector(state => state.arizaBakim);

  // İş emirleri state'i
  const { isEmirleri, loading: isEmirleriLoading } = useSelector(state => state.isEmirleri);

  // Uygunsuzluk state'i
  const { istatistikler: uygunsuzlukIstatistikleri, loading: uygunsuzlukLoading } = useSelector(state => state.uygunsuzluklar);

  useEffect(() => {
    init();
    
    // Veriler 15 saniyede bir güncellenir
    const interval = setInterval(() => {
      loadTezgahlar(); // Sadece tezgah verilerini güncelle
    }, 15000); // 15 saniye
    
    return () => clearInterval(interval);
  }, [dispatch]);

  const init = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTezgahlar(),
        dispatch(fetchIsEmirleri()).unwrap(),
        dispatch(fetchArizaBakimKayitlari({ durum: 'devam_ediyor' })).unwrap(), // Aktif arıza/bakımları getir
        dispatch(fetchUygunsuzlukIstatistikleri()).unwrap() // Uygunsuzluk istatistiklerini getir
      ]);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadTezgahlar = async () => {
    try {
      const response = await tezgahAPI.getAll();
      setTezgahlar(response.data);
      
      const yeniPozisyonlar = {};
      response.data.forEach(tezgah => {
        yeniPozisyonlar[tezgah.tezgah_id] = {
          x: tezgah.pozisyon_x || 0,
          y: tezgah.pozisyon_y || 0
        };
      });
      setPozisyonlar(yeniPozisyonlar);
    } catch (error) {
      console.error('Tezgah listesi yükleme hatası:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDragStop = (tezgahId, x, y) => {
    setPozisyonlar(prev => ({
      ...prev,
      [tezgahId]: { x, y }
    }));
  };

  const handleTezgahEkle = async (yeniTezgah) => {
    try {
      await tezgahAPI.create(yeniTezgah);
      setSnackbar({
        open: true,
        message: 'Tezgah başarıyla eklendi',
        severity: 'success'
      });
      setFormOpen(false);
      await loadTezgahlar();
    } catch (error) {
      console.error('Tezgah ekleme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Tezgah eklenirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleTezgahDuzenle = async (tezgah) => {
    // Tezgah düzenleme işlemi için gerekli kodlar
    console.log('Tezgah düzenlenecek:', tezgah);
  };

  const handleTezgahSil = async (tezgahId) => {
    // Tezgah silme işlemi için gerekli kodlar
    console.log('Tezgah silinecek:', tezgahId);
  };

  const handleIsEmriAta = (tezgah) => {
    // İş emri atama işlemi için gerekli kodlar
    console.log('İş emri atanacak tezgah:', tezgah);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  // Tezgah güncellendiğinde çağrılacak fonksiyon
  const handleTezgahGuncellendi = async () => {
    await init();
  };

  // Arıza ve bakım sayılarını hesapla
  const arizaSayisi = arizaBakimKayitlari.filter(k => k.kayit_tipi === 'ariza' && k.durum === 'devam_ediyor').length;
  const bakimSayisi = arizaBakimKayitlari.filter(k => k.kayit_tipi === 'bakim' && k.durum === 'devam_ediyor').length;

  useEffect(() => {
    // İş emirleri yüklendiğinde, bu iş emirleri için parça görsellerini yükle
    if (isEmirleri) {
      const tumIsEmirleri = [
        ...(isEmirleri?.Beklemede || []),
        ...(isEmirleri?.Siparis || [])
      ];
      
      if (tumIsEmirleri.length > 0) {
        yukleParcaGorselleri(tumIsEmirleri);
      }
    }
  }, [isEmirleri]);
  
  const yukleParcaGorselleri = async (isEmriListesi) => {
    try {
      setGorsellerYukleniyor(true);
      const gorseller = {};
      
      for (const isEmri of isEmriListesi) {
        if (isEmri.parca_kodu || isEmri.is_adi) {
          try {
            const searchTerm = isEmri.parca_kodu || isEmri.is_adi;
            const response = await axios.get(`/api/parcalar?aramaMetni=${searchTerm}`);
            
            let parcaData = [];
            // Handle different API response formats (paginated or direct array)
            if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
              parcaData = response.data.parcalar;
            } else if (Array.isArray(response.data)) {
              parcaData = response.data;
            }
            
            if (parcaData.length > 0) {
              const parca = isEmri.parca_kodu 
                ? parcaData.find(p => p.parcaKodu === isEmri.parca_kodu)
                : parcaData[0];
                
              if (parca && parca.foto_path) {
                gorseller[isEmri.is_emri_id] = parca.foto_path;
              }
            }
          } catch (error) {
            console.error(`${isEmri.is_emri_no} için parça görseli alınamadı:`, error);
          }
        }
      }
      
      setParcaGorselleri(gorseller);
    } catch (error) {
      console.error('Parça görselleri yüklenirken hata:', error);
    } finally {
      setGorsellerYukleniyor(false);
    }
  };
  
  // Fotoğraf yolu için yardımcı fonksiyon
  const getGorselPath = (foto_path) => {
    if (!foto_path) return null;
    if (foto_path.includes('://')) return foto_path; 
    if (foto_path.startsWith('/uploads/')) return foto_path;
    if (foto_path.startsWith('/fotograflar/')) return '/uploads' + foto_path;
    if (foto_path.includes('/')) return '/uploads/fotograflar/' + foto_path.split('/').pop();
    return '/uploads/fotograflar/' + foto_path;
  };
  
  const renderIsEmriKarti = (isEmri, bgColor) => {
    const gorselPath = parcaGorselleri[isEmri.is_emri_id];
    
    return (
      <Card key={isEmri.is_emri_id} sx={{ mb: 1, bgcolor: bgColor, position: 'relative' }}>
        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 }, position: 'relative' }}>
          {gorselPath && (
            <Box sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              width: 40, 
              height: 40, 
              zIndex: 1 
            }}>
              <Avatar 
                variant="rounded"
                sx={{ 
                  width: 40, 
                  height: 40, 
                  boxShadow: 1
                }}
                src={getGorselPath(gorselPath)}
                alt={isEmri.is_adi}
              />
            </Box>
          )}
          <Box sx={{ pr: gorselPath ? 6 : 0 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">
                #{isEmri.is_emri_no}
              </Typography>
              <Chip
                size="small"
                label={isEmri.oncelik.toUpperCase()}
                color={oncelikRenkleri[isEmri.oncelik] || 'default'}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {isEmri.is_adi}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Üretim Planı: {isEmri.uretim_plani_id ? `Plan #${isEmri.uretim_plani_id}` : (isEmri.plan_liste_no || '-')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  if (loading || arizaBakimLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      bgcolor: '#f5f5f5',
      display: 'flex'
    }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ 
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 2
        }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="h4">Dashboard</Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* Arıza ve Bakım Özet Kartları */}
                <Card variant="outlined" sx={{ bgcolor: 'error.light', color: 'white' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, '&:last-child': { pb: 1 } }}>
                    <ErrorOutlineIcon />
                    <Typography variant="body2">Arızada: {arizaSayisi}</Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ bgcolor: 'info.light', color: 'white' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, '&:last-child': { pb: 1 } }}>
                    <EngineeringIcon />
                    <Typography variant="body2">Bakımda: {bakimSayisi}</Typography>
                  </CardContent>
                </Card>

                {/* Uygunsuzluk Özet Kartı */}
                <Card
                  variant="outlined"
                  component={Link}
                  to="/uygunsuzluklar"
                  sx={{
                    bgcolor: 'warning.light',
                    color: 'white',
                    textDecoration: 'none',
                    '&:hover': {
                      bgcolor: 'warning.main',
                      color: 'white'
                    }
                  }}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, '&:last-child': { pb: 1 } }}>
                    <ReportProblemIcon />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Uygunsuzluk: {uygunsuzlukIstatistikleri?.acik || 0} Açık
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                        Toplam: {uygunsuzlukIstatistikleri?.toplam || 0}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton onClick={handleZoomOut}>
                    <ZoomOutIcon />
                  </IconButton>
                  <Typography sx={{ mx: 1 }}>
                    {Math.round(zoom * 100)}%
                  </Typography>
                  <IconButton onClick={handleZoomIn}>
                    <ZoomInIcon />
                  </IconButton>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setFormOpen(true)}
                >
                  Yeni Tezgah
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AssignmentIcon />}
                  onClick={() => setIsEmriFormOpen(true)}
                >
                  Yeni İş Emri
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            position: 'relative',
            flex: 1,
            overflow: 'auto',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '1500px',
              height: '1200px',
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              backgroundColor: '#f5f5f5',
              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
          >
            {tezgahlar.map(tezgah => (
              <TezgahKarti
                key={tezgah.tezgah_id}
                tezgah={tezgah}
                onDragStop={handleDragStop}
                onEdit={handleTezgahDuzenle}
                onDelete={handleTezgahSil}
                onIsEmriAta={handleIsEmriAta}
                onTezgahGuncellendi={handleTezgahGuncellendi}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* İş Emirleri Yan Panel - Beklemede ve Siparişte olanların listesi */}
      <Box 
        sx={{ 
          width: 320, 
          borderLeft: '1px solid', 
          borderColor: 'divider', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider', textAlign: 'center' }}>
          İş Emirleri Durumu
        </Typography>
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Bekleyen İş Emirleri */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100', textAlign: 'center' }}>
              Bekleyen İş Emirleri
            </Typography>
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {isEmirleriLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : isEmirleri?.Beklemede?.length ? (
                isEmirleri.Beklemede.map((isEmri) => renderIsEmriKarti(isEmri, 'grey.50'))
              ) : (
                <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  Bekleyen iş emri bulunmuyor
                </Typography>
              )}
            </Box>
          </Box>

          {/* Siparişte Olan İş Emirleri */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100', textAlign: 'center' }}>
              Siparişte
            </Typography>
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {isEmirleriLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : isEmirleri?.Siparis?.length ? (
                isEmirleri.Siparis.map((isEmri) => renderIsEmriKarti(isEmri, '#e8f5e9'))
              ) : (
                <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  Siparişte iş emri bulunmuyor
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      
      <TezgahEkleForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        onSubmit={(data) => {
          if (editData) {
            handleTezgahDuzenle(data);
          } else {
            handleTezgahEkle(data);
          }
        }}
        initialData={editData}
      />

      <IsEmriEkleForm 
        open={isEmriFormOpen}
        onClose={() => setIsEmriFormOpen(false)}
        onSubmit={async (yeniIsEmri) => {
          try {
            const isEmriData = {
              is_adi: yeniIsEmri.isAdi,
              plan_liste_no: yeniIsEmri.planListeNo,
              adet: parseInt(yeniIsEmri.adet),
              malzeme: yeniIsEmri.malzeme,
              teslim_tarihi: yeniIsEmri.teslimTarihi,
              oncelik: yeniIsEmri.oncelik,
              durum: yeniIsEmri.tezgahTipi,
              aciklama: yeniIsEmri.aciklama || '',
              uretim_plani_id: yeniIsEmri.uretim_plani_id || null,
              parca_kodu: yeniIsEmri.parca_kodu || null,
              setup_sayisi: yeniIsEmri.setup_sayisi || 0,
              cnc_suresi: yeniIsEmri.cnc_suresi || 0
            };
            await dispatch(createIsEmri(isEmriData)).unwrap();
            setSnackbar({
              open: true,
              message: 'İş emri başarıyla oluşturuldu',
              severity: 'success'
            });
            setIsEmriFormOpen(false);
          } catch (error) {
            console.error('İş emri oluşturma hatası:', error);
            setSnackbar({
              open: true,
              message: 'İş emri oluşturulurken bir hata oluştu',
              severity: 'error'
            });
          }
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Add this constant for priority colors which was defined in IsEmriListesi
const oncelikRenkleri = {
  dusuk: 'info',
  normal: 'success',
  yuksek: 'warning',
  acil: 'error'
};

export default Dashboard;