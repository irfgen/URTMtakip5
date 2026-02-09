import { useState, useEffect, useRef, memo, useCallback } from 'react';
import Draggable from 'react-draggable';
import axios from 'axios';
import {
  Paper,
  Typography,
  Box,
  Badge,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Popover,
  List,
  ListItem,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Engineering as EngineeringIcon,
  Check as CheckIcon,
  Handyman as HandymanIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  MoreHoriz as MoreHorizIcon,
  Build as BuildIcon,
  InsertPhoto as InsertPhotoIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIsEmirleri } from '../store/slices/isEmirleriSlice';
import { fetchArizaBakimKayitlari } from '../store/slices/arizaBakimSlice';
import { tezgahAPI, isEmirleriAPI } from '../services/api';
import { cacheService, CACHE_KEYS } from '../services/cacheService';
import TezgahDuzenleForm from './TezgahDuzenleForm';
import TezgahIsleriForm from './TezgahIsleriForm';
import IsEmriOzetFormu from './IsEmriOzetFormu';
import ImageWithFallback from './ImageWithFallback';
import { fetchUretimPlanlari } from '../store/slices/uretimPlaniSlice';
import YeniIsSecimiModali from './YeniIsSecimiModali';

// Fotoğraf yolu için yardımcı fonksiyon
const getFotoPath = (foto_path) => {
  if (!foto_path) return '';
  if (foto_path.includes('://')) return foto_path; 
  if (foto_path.startsWith('/uploads/')) return foto_path;
  if (foto_path.startsWith('/fotograflar/')) return '/uploads' + foto_path;
  if (foto_path.includes('/')) return '/uploads/fotograflar/' + foto_path.split('/').pop();
  return '/uploads/fotograflar/' + foto_path;
};

// Teknik resim yolu için yardımcı fonksiyon
const getTeknikResimPath = (teknik_resim_path) => {
  if (!teknik_resim_path) return '';
  if (teknik_resim_path.includes('://')) return teknik_resim_path;
  if (teknik_resim_path.startsWith('/uploads/')) return teknik_resim_path;
  if (teknik_resim_path.startsWith('/teknik_resimler/')) return '/uploads' + teknik_resim_path;
  if (teknik_resim_path.includes('/')) return '/uploads/teknik_resimler/' + teknik_resim_path.split('/').pop();
  return '/uploads/teknik_resimler/' + teknik_resim_path;
};

const TezgahKarti = ({ tezgah, bekleyenIsEmirleri = [], onDragStop, onDelete, onIsEmriAta, onTezgahGuncellendi }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const draggableRef = useRef(null);
  
  const isEmirleri = useSelector(state => state.isEmirleri?.isEmirleri || { Beklemede: [] });
  
  const [contextMenu, setContextMenu] = useState(null);
  const [bakimAnchorEl, setBakimAnchorEl] = useState(null);
  const [isEmriAnchorEl, setIsEmriAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isleriFormOpen, setIsleriFormOpen] = useState(false); // New state for TezgahIsleriForm
  const [tamamlaDialog, setTamamlaDialog] = useState({ open: false, isEmri: null });
  const [notlar, setNotlar] = useState('');
  const [arizaBakimDialog, setArizaBakimDialog] = useState({ open: false, arizaBakim: null });
  const [ozetFormOpen, setOzetFormOpen] = useState(false);
  const [tamamlananIsEmri, setTamamlananIsEmri] = useState(null);
  const [parcaBilgileri, setParcaBilgileri] = useState({});
  const [ozelListeAdi, setOzelListeAdi] = useState('');
  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [ilgilibekleyenIsEmirleri, setIlgilibekleyenIsEmirleri] = useState([]);
  const [loadingBekleyenIsEmirleri, setLoadingBekleyenIsEmirleri] = useState(false);
  
  // CNC Panel Durum Takibi
  const [cncPanelDurum, setCncPanelDurum] = useState({
    durum: null, // true: çalışıyor, false: durdu, null: bilinmiyor
    sonGuncelleme: null,
    baglantiDurumu: 'disconnected' // 'connected', 'disconnected', 'connecting'
  });
  const [cncError, setCncError] = useState(null);
  
  // Yeni İş Seçimi Modal State
  const [yeniIsModalOpen, setYeniIsModalOpen] = useState(false);
  const [boyutDuzenleModalOpen, setBoyutDuzenleModalOpen] = useState(false);
  const [boyutForm, setBoyutForm] = useState({ genislik: 200, yukseklik: 120 });
  
  // Debug için konsola tezgah verisi yazdırma
  useEffect(() => {
    console.log('Tezgah Verisi:', tezgah);
    console.log('Arıza Bakım Durumu:', tezgah?.ariza_bakim_durumu);
    console.log('Tezgah Çalışma Durumu:', tezgah?.calisma_durumu);
  }, [tezgah?.tezgah_id, tezgah?.ariza_bakim_durumu, tezgah?.calisma_durumu]);

  // Son tezgahı bu tezgah olan bekleyen iş emirlerini kontrol et
  const checkBekleyenIsEmirleri = useCallback(() => {
    if (!tezgah || !tezgah.tezgah_id) {
      setIlgilibekleyenIsEmirleri([]);
      return;
    }

    // Prop'tan gelen bekleyen iş emirlerini filtrele
    const bekleyenIsler = bekleyenIsEmirleri.filter(isEmri =>
      isEmri && isEmri.tezgah_bilgisi &&
      isEmri.tezgah_bilgisi.son_tezgah_id === tezgah.tezgah_id
    );

    setIlgilibekleyenIsEmirleri(bekleyenIsler);
    setLoadingBekleyenIsEmirleri(false);
  }, [tezgah?.tezgah_id, bekleyenIsEmirleri]);

  // Bekleyen iş emirlerini kontrol et - tezgah_id veya bekleyen iş emirleri değiştiğinde
  useEffect(() => {
    checkBekleyenIsEmirleri();
  }, [checkBekleyenIsEmirleri]);
    
  // İş emirleri varsa, her biri için parça bilgilerini yükle
  useEffect(() => {
    if (tezgah?.is_emirleri && tezgah.is_emirleri.length > 0) {
      const yukleParcilar = async () => {
        const parcaBilgileriMap = {};
        
        for (const isEmri of tezgah.is_emirleri) {
          if (isEmri.parca_kodu || isEmri.is_adi) {
            try {
              const searchTerm = isEmri.parca_kodu || isEmri.is_adi;
              console.log(`Tezgah kartı için parça bilgileri aranıyor: ${searchTerm}`);
              
              const response = await axios.get(`/api/parcalar?aramaMetni=${searchTerm}`);
              let parcaData = [];
              // Handle different API response formats (paginated or direct array)
              if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
                parcaData = response.data.parcalar;
              } else if (Array.isArray(response.data)) {
                parcaData = response.data;
              }
              
              if (parcaData.length > 0) {
                const matchedParca = isEmri.parca_kodu 
                  ? parcaData.find(p => p.parcaKodu === isEmri.parca_kodu)
                  : parcaData[0];
                  
                if (matchedParca) {
                  console.log(`Tezgah için bulunan parça: ${matchedParca.parcaKodu}`);
                  parcaBilgileriMap[isEmri.is_emri_id] = matchedParca;
                }
              }
            } catch (error) {
              console.error(`${isEmri.is_emri_no} için parça bilgileri alınamadı:`, error);
            }
          }
        }
        
        setParcaBilgileri(parcaBilgileriMap);
      };
      
      yukleParcilar();
    } else {
      // Eğer iş emri yoksa parça bilgilerini temizle
      setParcaBilgileri({});
    }
  }, [tezgah?.is_emirleri]);
    
  // CNC panel durumunu sürekli yükle (aktif iş olsun olmasın)
  useEffect(() => {
    if (tezgah?.tezgah_id) {
      fetchCncDurum(tezgah.tezgah_id);
      
      // 30 saniyede bir otomatik güncelleme (performans için optimizasyon)
      const interval = setInterval(() => {
        fetchCncDurum(tezgah.tezgah_id);
      }, 30000); // 30 saniye
      
      return () => clearInterval(interval);
    }
  }, [tezgah?.tezgah_id]);

  useEffect(() => {
    if (isEmriAnchorEl) {
      dispatch(fetchUretimPlanlari({ ozel_liste_adi: ozelListeAdi })).unwrap().then(setUretimPlanlari).catch(() => setUretimPlanlari([]));
    }
  }, [isEmriAnchorEl, ozelListeAdi, dispatch]);

  // Teknik resim ve fotoğraf ikonlarını render eden fonksiyon
  const renderDosyaIkonlari = (isEmriId) => {
    // Null kontrolü ve güvenlik kontrolü yap
    if (!parcaBilgileri || !isEmriId || !parcaBilgileri[isEmriId]) {
      return null;
    }
    
    const parca = parcaBilgileri[isEmriId];
    
    return (
      <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
        {parca.foto_path && (
          <Tooltip
            title={
              <Box sx={{ p: 0 }}>
                <ImageWithFallback 
                  src={getFotoPath(parca.foto_path)}
                  alt="Parça Fotoğrafı"
                  style={{ 
                    maxWidth: '300px', 
                    maxHeight: '300px', 
                    objectFit: 'contain',
                  }}
                />
              </Box>
            }
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'white',
                  '& .MuiTooltip-arrow': {
                    color: 'white',
                  },
                  maxWidth: 'none !important',
                  boxShadow: 3,
                  p: 1
                }
              }
            }}
            arrow
            placement="right"
            enterDelay={1000}
          >
            <IconButton size="small" onClick={() => window.open(getFotoPath(parca.foto_path), '_blank')}>
              <InsertPhotoIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        )}
        {parca.teknik_resim_path && (
          <Tooltip
            title={
              parca.teknik_resim_path.endsWith('.pdf') ? (
                "PDF dosyasını açmak için tıklayın"
              ) : (
                <Box sx={{ p: 0 }}>
                  <ImageWithFallback 
                    src={getTeknikResimPath(parca.teknik_resim_path)}
                    alt="Teknik Resim"
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '300px', 
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              )
            }
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'white',
                  '& .MuiTooltip-arrow': {
                    color: 'white',
                  },
                  maxWidth: 'none !important',
                  boxShadow: 3,
                  p: 1
                }
              }
            }}
            arrow
            placement="right"
            enterDelay={1000}
          >
            <IconButton size="small" onClick={() => window.open(getTeknikResimPath(parca.teknik_resim_path), '_blank')}>
              {parca.teknik_resim_path.endsWith('.pdf') ? (
                <PictureAsPdfIcon fontSize="small" color="error" />
              ) : (
                <DescriptionIcon fontSize="small" color="info" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  // CNC Panel durum verilerini almak için fonksiyonlar
  const fetchCncDurum = async (tezgahId) => {
    if (!tezgahId) return;
    try {
      setCncError(null);
      const response = await axios.get(`/api/tezgah-durum/tezgah-durum/${tezgahId}?limit=1`);
      const sonDurum = response.data[0];
      
      if (sonDurum) {
        setCncPanelDurum({
          durum: sonDurum.durum,
          sonGuncelleme: sonDurum.timestamp,
          baglantiDurumu: 'connected'
        });
      }
    } catch (error) {
      console.error('CNC durum alınırken hata:', error);
      setCncPanelDurum(prev => ({
        ...prev,
        baglantiDurumu: 'disconnected'
      }));
      setCncError('Veri alınamadı. Backend servisinin çalıştığından emin olun.');
    }
  };

  const getTezgahStatusColor = () => {
    if (!tezgah) return 'warning.main';
    
    // Öncelik sırası: Arıza durumu > CNC panel durumu > Varsayılan
    if (tezgah.calisma_durumu === 'arizada') {
      return 'error.main'; // Kırmızı - Arızada
    } else if (tezgah.calisma_durumu === 'bakimda') {
      return 'error.main'; // Kırmızı - Bakımda
    } else {
      // CNC panel durumuna göre renk belirle
      if (cncPanelDurum.durum === true) {
        return 'success.main'; // Yeşil - CNC çalışıyor
      } else if (cncPanelDurum.durum === false) {
        return 'warning.main'; // Sarı - CNC durdu
      } else {
        // CNC panel durumu bilinmiyorsa gri renk kullan
        return 'grey.500'; // Gri - CNC durumu bilinmiyor
      }
    }
  };

  const getTezgahCardBackgroundColor = () => {
    if (!tezgah) return '#f5f5f5';
    
    // Öncelik sırası: Arıza durumu > CNC panel durumu > Varsayılan
    if (tezgah.calisma_durumu === 'arizada') {
      return '#ffcdd2'; // Daha belirgin pastel kırmızı - Arızada
    } else if (tezgah.calisma_durumu === 'bakimda') {
      return '#ffcdd2'; // Daha belirgin pastel kırmızı - Bakımda
    } else {
      // CNC panel durumuna göre renk belirle
      if (cncPanelDurum.durum === true) {
        return '#c8e6c9'; // Daha belirgin pastel yeşil - CNC çalışıyor
      } else if (cncPanelDurum.durum === false) {
        return '#fff3e0'; // Daha belirgin pastel sarı - CNC durdu
      } else {
        // CNC panel durumu bilinmiyorsa gri renk kullan
        return '#e0e0e0'; // Daha belirgin pastel gri - CNC durumu bilinmiyor
      }
    }
  };
  
  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };
  
  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setBakimAnchorEl(null);
    setIsEmriAnchorEl(null);
  };

  const handleBoyutDuzenleClick = () => {
    setBoyutForm({
      genislik: tezgah.genislik || 200,
      yukseklik: tezgah.yukseklik || 120
    });
    setBoyutDuzenleModalOpen(true);
    handleCloseContextMenu();
  };

  const handleBoyutKaydet = async () => {
    try {
      const response = await tezgahAPI.update(tezgah.tezgah_id, {
        genislik: boyutForm.genislik,
        yukseklik: boyutForm.yukseklik
      });
      
      setSnackbar({
        open: true,
        message: 'Tezgah boyutları başarıyla güncellendi',
        severity: 'success'
      });
      
      setBoyutDuzenleModalOpen(false);
      
      if (onTezgahGuncellendi) {
        await onTezgahGuncellendi();
      }
    } catch (error) {
      console.error('Boyut güncelleme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Boyut güncelleme işlemi başarısız oldu',
        severity: 'error'
      });
    }
  };
  
  const handleBakimMenuClick = (event) => {
    setBakimAnchorEl(event.currentTarget);
  };
  
  const handleBakimMenuClose = () => {
    setBakimAnchorEl(null);
  };
  
  const handleIsEmriMenuClick = (event) => {
    event.stopPropagation();
    setIsEmriAnchorEl(event.currentTarget);
  };
  
  const handleIsEmriMenuClose = () => {
    setIsEmriAnchorEl(null);
  };
  
  const handlePlanliBakim = () => {
    navigate('/ariza-bakim/ekle', { 
      state: { 
        tezgah_id: tezgah.tezgah_id,
        kayit_tipi: 'bakim'
      } 
    });
    handleCloseContextMenu();
  };
  
  const handleAriza = () => {
    navigate('/ariza-bakim/ekle', { 
      state: { 
        tezgah_id: tezgah.tezgah_id,
        kayit_tipi: 'ariza'
      } 
    });
    handleCloseContextMenu();
  };
  
  const handleEkstralar = () => {
    navigate('/ariza-bakim', { 
      state: { 
        tezgah_id: tezgah.tezgah_id
      } 
    });
    handleCloseContextMenu();
  };
  
  const handleArizaBakimSonlandir = () => {
    if (tezgah?.ariza_bakim_durumu) {
      setArizaBakimDialog({
        open: true,
        arizaBakim: tezgah.ariza_bakim_durumu
      });
    }
    handleBakimMenuClose();
    handleCloseContextMenu();
  };
  
  const handleArizaBakimDialogClose = () => {
    setArizaBakimDialog({ open: false, arizaBakim: null });
    setNotlar('');
  };
  
  const handleArizaBakimSonlandirSubmit = async () => {
    try {
      setLoading(true);
      
      await tezgahAPI.endArizaBakim(
        tezgah.tezgah_id,
        arizaBakimDialog.arizaBakim.id,
        notlar
      );
      
      if (onTezgahGuncellendi) {
        await onTezgahGuncellendi();
      }
      
      await dispatch(fetchArizaBakimKayitlari({ durum: 'devam_ediyor' })).unwrap();
      
      setSnackbar({
        open: true,
        message: `${arizaBakimDialog.arizaBakim.tipi === 'ariza' ? 'Arıza' : 'Bakım'} kaydı başarıyla sonlandırıldı`,
        severity: 'success'
      });
      
      handleArizaBakimDialogClose();
    } catch (error) {
      console.error('Arıza/Bakım sonlandırma hatası:', error);
      setSnackbar({
        open: true,
        message: 'Arıza/Bakım sonlandırma işlemi başarısız oldu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleIsEmriSec = async (isEmri) => {
    try {
      setLoading(true);
      await tezgahAPI.assignIsEmri(tezgah.tezgah_id, isEmri.is_emri_id);
      
      // Cache'i temizle çünkü iş emri durumu değişti
      cacheService.invalidate(CACHE_KEYS.BEKLEYEN_IS_EMIRLERI);
      
      if (onTezgahGuncellendi) {
        await onTezgahGuncellendi();
      }
      await dispatch(fetchIsEmirleri()).unwrap();
      
      setSnackbar({
        open: true,
        message: `İş emri #${isEmri.is_emri_no} başarıyla ${tezgah.tezgah_tanimi} tezgahına atandı`,
        severity: 'success'
      });
    } catch (error) {
      console.error('İş emri atama hatası:', error);
      setSnackbar({
        open: true,
        message: 'İş emri atama işlemi başarısız oldu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      handleIsEmriMenuClose();
      handleCloseContextMenu();
    }
  };
  
  const handleIsEmriTamamlaDialogOpen = (isEmri) => {
    setTamamlaDialog({ open: true, isEmri });
    handleCloseContextMenu();
  };
  
  const handleIsEmriTamamlaDialogClose = () => {
    setTamamlaDialog({ open: false, isEmri: null });
    setNotlar('');
  };
  
  const handleIsEmriTamamla = async () => {
    try {
      setLoading(true);
      await tezgahAPI.completeIsEmri(tezgah.tezgah_id, tamamlaDialog.isEmri.is_emri_id, notlar);
      
      // Cache'i temizle çünkü iş emri durumu değişti
      cacheService.invalidate(CACHE_KEYS.BEKLEYEN_IS_EMIRLERI);
      
      if (onTezgahGuncellendi) {
        await onTezgahGuncellendi();
      } else {
        await dispatch(fetchIsEmirleri()).unwrap();
      }
      
      // İş emri tamamlandıktan sonra özet formunu açmak için bilgileri kaydet
      setTamamlananIsEmri({
        is_emri_id: tamamlaDialog.isEmri.is_emri_id,
        is_emri_no: tamamlaDialog.isEmri.is_emri_no,
        is_adi: tamamlaDialog.isEmri.is_adi,
      });
      
      // Tamamlama dialogunu kapat ve özet formunu aç
      handleIsEmriTamamlaDialogClose();
      setOzetFormOpen(true);
      
    } catch (error) {
      console.error('İş emri tamamlama hatası:', error);
      setSnackbar({
        open: true,
        message: 'İş emri tamamlama işlemi başarısız oldu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditClick = () => {
    setEditDialogOpen(true);
    handleCloseContextMenu();
  };
  
  const handleEditClose = () => {
    setEditDialogOpen(false);
  };
  
  const handleEditSubmit = async (editedData) => {
    try {
      setLoading(true);
      await tezgahAPI.updateTezgah(tezgah.tezgah_id, editedData);
      
      if (onTezgahGuncellendi) {
        await onTezgahGuncellendi();
      }
      
      setSnackbar({
        open: true,
        message: 'Tezgah başarıyla güncellendi',
        severity: 'success'
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Tezgah güncelleme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Tezgah güncelleme işlemi başarısız oldu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredIsEmirleri = isEmirleri?.Beklemede || [];
  
  // Handler for TezgahIsleri button click
  const handleTezgahIsleriClick = (event) => {
    event.stopPropagation();
    setIsleriFormOpen(true);
    handleCloseContextMenu();
  };

  // Yeni İş Seçimi button handler
  const handleYeniIsSecimi = () => {
    if (!tezgah?.tezgah_id) return;
    setYeniIsModalOpen(true);
  };

  // Yeni iş seçildi handler - web versiyonu için
  const handleYeniIsSecildiWeb = async (selectedIsEmri) => {
    if (!tezgah?.tezgah_id || !selectedIsEmri) return;
    
    try {
      console.log('Yeni iş atanıyor:', selectedIsEmri.is_emri_no);
      
      // İş emrini tezgaha ata
      await tezgahAPI.assignIsEmri(tezgah.tezgah_id, selectedIsEmri.is_emri_id || selectedIsEmri.id);
      
      // Cache'i temizle çünkü iş emri durumu değişti
      cacheService.invalidate(CACHE_KEYS.BEKLEYEN_IS_EMIRLERI);
      
      setSnackbar({ 
        open: true, 
        message: `İş emri #${selectedIsEmri.is_emri_no} başarıyla atandı`, 
        severity: 'success' 
      });

      // Modal'ı kapat
      setYeniIsModalOpen(false);
      
      // Tezgah durumunu güncelle
      if (onTezgahGuncellendi) {
        await onTezgahGuncellendi();
      }
      
    } catch (error) {
      console.error('İş emri atama hatası:', error);
      setSnackbar({
        open: true,
        message: 'İş emri atama işlemi başarısız oldu: ' + (error.response?.data?.error || error.message),
        severity: 'error'
      });
    }
  };

  
  // Tezgah yoksa null döndür
  if (!tezgah) return null;

  return (
    <>
      <Draggable
        nodeRef={draggableRef}
        defaultPosition={{ x: tezgah.pozisyon_x || 0, y: tezgah.pozisyon_y || 0 }}
        onStop={(e, data) => onDragStop(tezgah.tezgah_id, data.x, data.y)}
        bounds="parent"
        grid={[10, 10]}
      >
        <Paper
          ref={draggableRef}
          elevation={3}
          sx={{
            position: 'absolute',
            width: tezgah.genislik || 200,
            height: tezgah.yukseklik || 120,
            p: 2,
            cursor: 'move',
            backgroundColor: getTezgahCardBackgroundColor(),
            '&:hover': {
              boxShadow: 6,
            },
            zIndex: 1,
            userSelect: 'none',
            transition: 'background-color 0.3s ease',
            overflow: 'hidden'
          }}
          onContextMenu={handleContextMenu}
        >
          <Box display="flex" alignItems="center" mb={1}>
            <Badge
              sx={{ 
                '& .MuiBadge-badge': {
                  backgroundColor: getTezgahStatusColor(),
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  boxShadow: '0 0 0 2px white'
                },
                mr: 1
              }}
              variant="dot"
            />
            <Typography variant="h6" noWrap sx={{ flex: 1 }}>
              {tezgah.tezgah_tanimi}
            </Typography>
            {tezgah.is_emirleri && tezgah.is_emirleri.length > 0 && tezgah.is_emirleri[0] && (
              <Box sx={{ display: 'flex', ml: 2 }}>
                {renderDosyaIkonlari(tezgah.is_emirleri[0].is_emri_id)}
              </Box>
            )}
          </Box>            
            {ilgilibekleyenIsEmirleri && ilgilibekleyenIsEmirleri.length > 0 && (
              <Typography variant="caption" color="primary" display="block">
                <strong>Ara verilmiş iş sayısı: {ilgilibekleyenIsEmirleri.length}</strong>
              </Typography>
            )}
            
            {tezgah.ariza_bakim_durumu && (
              <Typography variant="caption" color="error" display="block">
                {tezgah.ariza_bakim_durumu.tipi === 'ariza' ? 'Arıza' : 'Bakım'} Başlangıç: {
                  new Date(tezgah.ariza_bakim_durumu.baslangic_tarihi).toLocaleString('tr-TR')
                }
              </Typography>
            )}
          
          {tezgah.is_emirleri && tezgah.is_emirleri.length > 0 ? (
            <Box sx={{ mt: 1 }}>
              {tezgah.is_emirleri.map((isEmri, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    #{isEmri.is_emri_no} - {isEmri.is_adi || ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Aktif iş yok
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleYeniIsSecimi}
                disabled={loading}
                sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
              >
                Yeni İş Seçimi
              </Button>
            </Box>
          )}
        </Paper>
      </Draggable>
      
      <Menu
        open={Boolean(contextMenu)}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.y, left: contextMenu.x }
            : undefined
        }
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Typography variant="subtitle1" gutterBottom>
            {tezgah.tezgah_tanimi}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Tezgahı Düzenle</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleBoyutDuzenleClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Tezgah Kartını Düzenle</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleTezgahIsleriClick}>
          <ListItemIcon>
            <BuildIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>TEZGAH İŞLERİ</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleBakimMenuClick}>
          <ListItemIcon>
            <EngineeringIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bakım / Arıza</ListItemText>
        </MenuItem>
        {tezgah.ariza_bakim_durumu && (
          <MenuItem onClick={handleArizaBakimSonlandir} sx={{ bgcolor: 'success.light' }}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Arıza - Bakım Bitir</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => { onDelete(tezgah.tezgah_id); handleCloseContextMenu(); }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Tezgahı Sil</ListItemText>
        </MenuItem>
      </Menu>
      
      <Menu
        anchorEl={bakimAnchorEl}
        open={Boolean(bakimAnchorEl)}
        onClose={handleBakimMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handlePlanliBakim}>
          <ListItemIcon>
            <HandymanIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Planlı Bakım</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAriza}>
          <ListItemIcon>
            <ErrorIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Arıza</ListItemText>
        </MenuItem>
        {tezgah.ariza_bakim_durumu && (
          <MenuItem onClick={handleArizaBakimSonlandir}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Arıza & Bakım Sonlandır</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleEkstralar}>
          <ListItemIcon>
            <MoreHorizIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ekstralar</ListItemText>
        </MenuItem>
      </Menu>
      
      <Popover
        anchorEl={isEmriAnchorEl}
        open={Boolean(isEmriAnchorEl)}
        onClose={handleIsEmriMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="subtitle1" sx={{ p: 2, bgcolor: 'grey.100' }}>
            {tezgah.tip === 'torna' ? 'Torna' : 'Freze'} İş Emirleri
          </Typography>
          <TextField
            label="Özel Liste Adı ile Filtrele"
            variant="outlined"
            size="small"
            fullWidth
            value={ozelListeAdi}
            onChange={e => setOzelListeAdi(e.target.value)}
            sx={{ mb: 2, px: 2 }}
          />
          <List>
            {filteredIsEmirleri
              .filter(isEmri => {
                if (!ozelListeAdi) return true;
                return uretimPlanlari.some(plan => plan.ozel_liste_adi === ozelListeAdi && plan.id === isEmri.uretim_plani_id);
              })
              .map((isEmri) => (
                <ListItem
                  key={isEmri.is_emri_id}
                  button
                  onClick={() => handleIsEmriSec(isEmri)}
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <ListItemIcon>
                    <AssignmentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`#${isEmri.is_emri_no}`}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {isEmri.is_adi}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {isEmri.plan_liste_no}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            {filteredIsEmirleri.length === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Atanabilecek iş emri bulunamadı
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </Popover>
      
      <Dialog open={tamamlaDialog.open} onClose={handleIsEmriTamamlaDialogClose}>
        <DialogTitle>İş Emri Tamamla</DialogTitle>
        <DialogContent>
          {tamamlaDialog.isEmri && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                #{tamamlaDialog.isEmri.is_emri_no} - {tamamlaDialog.isEmri.is_adi}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Üretim Planı: {tamamlaDialog.isEmri.uretim_plani_id ? `Plan #${tamamlaDialog.isEmri.uretim_plani_id}` : (tamamlaDialog.isEmri.plan_liste_no || '-')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Bu iş emrini tamamlamak üzeresiniz. Notlar eklemek ister misiniz?
              </Typography>
              <TextField
                label="Notlar"
                multiline
                rows={4}
                fullWidth
                margin="normal"
                value={notlar}
                onChange={(e) => setNotlar(e.target.value)}
                placeholder="İş emri ile ilgili notlar (opsiyonel)"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleIsEmriTamamlaDialogClose}>İptal</Button>
          <Button 
            onClick={handleIsEmriTamamla} 
            variant="contained" 
            color="success"
            disabled={loading}
          >
            {loading ? 'İşleniyor...' : 'Tamamla'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={arizaBakimDialog.open} onClose={handleArizaBakimDialogClose}>
        <DialogTitle>
          {arizaBakimDialog.arizaBakim?.tipi === 'ariza' ? 'Arızayı' : 'Bakımı'} Sonlandır
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" gutterBottom>
              {tezgah.tezgah_tanimi} tezgahında {arizaBakimDialog.arizaBakim?.tipi === 'ariza' ? 'arıza' : 'bakım'} kaydını sonlandırmak üzeresiniz.
            </Typography>
            <Typography variant="body2" gutterBottom>
              Başlangıç Tarihi: {arizaBakimDialog.arizaBakim && new Date(arizaBakimDialog.arizaBakim.baslangic_tarihi).toLocaleString('tr-TR')}
            </Typography>
            <TextField
              label="Yapılan İşlemler"
              multiline
              rows={4}
              fullWidth
              margin="normal"
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              placeholder="Yapılan işlemleri detaylandırın"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleArizaBakimDialogClose}>İptal</Button>
          <Button 
            onClick={handleArizaBakimSonlandirSubmit} 
            variant="contained" 
            color="success"
            disabled={loading}
          >
            {loading ? 'İşleniyor...' : 'Sonlandır'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <TezgahDuzenleForm
        open={editDialogOpen}
        onClose={handleEditClose}
        tezgah={tezgah}
        onSubmit={handleEditSubmit}
      />
      
      <TezgahIsleriForm
        open={isleriFormOpen}
        onClose={() => setIsleriFormOpen(false)}
        tezgah={tezgah}
        onTezgahGuncellendi={onTezgahGuncellendi}
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
      
      {/* İş Emri Özet Formu */}
      {tamamlananIsEmri && (
        <IsEmriOzetFormu
          open={ozetFormOpen}
          onClose={() => {
            setOzetFormOpen(false);
            setTamamlananIsEmri(null);
          }}
          isEmriId={tamamlananIsEmri.is_emri_id}
          isEmriNo={tamamlananIsEmri.is_emri_no}
          isAdi={tamamlananIsEmri.is_adi}
          tezgahAdi={tezgah.tezgah_tanimi}
          tezgahId={tezgah.tezgah_id}
        />
      )}

      {/* Yeni İş Seçimi Modalı */}
      <YeniIsSecimiModali
        open={yeniIsModalOpen}
        onClose={() => setYeniIsModalOpen(false)}
        onSelectIsEmri={handleYeniIsSecildiWeb}
        tezgahId={tezgah.tezgah_id}
      />

      <YeniIsSecimiModali
        open={Boolean(isEmriAnchorEl)}
        onClose={handleIsEmriMenuClose}
        tezgah={tezgah}
        onIsEmriAta={onIsEmriAta}
      />

      {/* Boyut Düzenleme Modal'ı */}
      <Dialog
        open={boyutDuzenleModalOpen}
        onClose={() => setBoyutDuzenleModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Tezgah Kartı Boyutlarını Düzenle - {tezgah.tezgah_tanimi}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Genişlik (px)"
              type="number"
              fullWidth
              value={boyutForm.genislik}
              onChange={(e) => setBoyutForm({ ...boyutForm, genislik: parseInt(e.target.value) || 200 })}
              inputProps={{ min: 150, max: 500 }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Yükseklik (px)"
              type="number"
              fullWidth
              value={boyutForm.yukseklik}
              onChange={(e) => setBoyutForm({ ...boyutForm, yukseklik: parseInt(e.target.value) || 120 })}
              inputProps={{ min: 100, max: 400 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBoyutDuzenleModalOpen(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleBoyutKaydet}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default memo(TezgahKarti);
